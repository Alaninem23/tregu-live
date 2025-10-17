# Uses tools you approve (declared in tools.py)
# No code self-modification. "Upgrades/repairs" are proposals (tickets + patches) for human review.
# Simple, safe AI agent for Tregu (hardened).

import os, json, re, time
from typing import Dict, Any, List, Optional
from .tools import TOOL_REGISTRY, ToolContext

import requests

DEFAULT_MODEL = os.getenv("TREGU_LLM_MODEL", "gpt-4.1-mini")  # configurable, sane default
USE_RESPONSES_API = os.getenv("TREGU_USE_RESPONSES_API", "0") == "1"  # flip to use /v1/responses

class AICopilot:
    def __init__(self):
        # Read the key at init time (not import time)
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise RuntimeError("OPENAI_API_KEY missing in environment")

        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        })

    # --- OpenAI call wrappers -------------------------------------------------

    def _strip_code_fences(self, s: str) -> str:
        if not s:
            return s
        s = s.strip()
        # ```json ... ``` or ``` ... ```
        if s.startswith("```"):
            s = re.sub(r"^```(?:json)?\s*", "", s)
            s = re.sub(r"\s*```$", "", s)
        return s.strip()

    def _llm(self, messages: List[Dict[str, str]], temperature: float = 0.2, timeout: int = 60) -> str:
        """LLM call using either Chat Completions or Responses API (text-only)."""
        payload = {"model": DEFAULT_MODEL, "temperature": temperature}

        if USE_RESPONSES_API:
            # Responses API
            # docs: https://platform.openai.com/docs/api-reference/responses
            payload["input"] = [{"role": m["role"], "content": m["content"]} for m in messages]
            url = "https://api.openai.com/v1/responses"
            r = self.session.post(url, json=payload, timeout=timeout)
            r.raise_for_status()
            data = r.json()
            # responses API returns output_text or content parts; handle both
            text = data.get("output_text")
            if not text:
                # fallback parse for content parts
                out = data.get("output", []) or data.get("response", {}).get("output", [])
                parts = []
                for p in out:
                    if isinstance(p, dict):
                        parts.append(p.get("content", "") or p.get("text", ""))
                text = "\n".join([t for t in parts if t])
            return text or ""
        else:
            # Chat Completions (still supported; Responses recommended for new code)
            # docs: https://platform.openai.com/docs/guides/migrate-to-responses
            payload["messages"] = messages
            url = "https://api.openai.com/v1/chat/completions"
            r = self.session.post(url, json=payload, timeout=timeout)
            r.raise_for_status()
            data = r.json()
            return data["choices"][0]["message"]["content"]

    # --- System prompt --------------------------------------------------------

    SYSTEM = (
        "You are Tregu's embedded AI Copilot. Be concise and safe. "
        "You can use TOOLS only from the provided registry. Never run arbitrary code. "
        "For 'upgrade' or 'repair' requests, produce a proposal with: "
        "(1) title, (2) why, (3) risks, (4) migration/rollback, (5) test plan, (6) patch diff (pseudo or real). "
        "Always get user confirmation before executing any tool that changes data."
    )

    # --- Core loop ------------------------------------------------------------

    def chat(self, user_text: str, ctx: ToolContext) -> Dict[str, Any]:
        """
        Core loop:
        - Ask the LLM if a tool is needed.
        - If yes, call only safe tools from TOOL_REGISTRY with validated inputs.
        - Return final answer + any tool results.
        """
        # 1) First pass: ask LLM what to do (no tool run yet)
        tool_list = []
        for t in TOOL_REGISTRY:
            tool_list.append({
                "name": t.name,
                "description": getattr(t, "description", ""),
                "input_schema": getattr(t, "input_schema", {}),  # may be a dict
                "mutating": bool(getattr(t, "mutating", False)),
            })

        planning_prompt = [
            {"role": "system", "content": self.SYSTEM},
            {"role": "user", "content":
                "User said: "
                + user_text
                + "\n\nAvailable tools: "
                + json.dumps(tool_list, indent=2)
                + "\nDecide if a tool is needed. If so, output JSON "
                  "{\"use_tool\":true,\"tool_name\":\"...\",\"args\":{...}}. "
                  "If not, output JSON {\"use_tool\":false,\"answer\":\"...\"}. "
                  "Output JSON ONLY, no backticks, no prose."
            }
        ]

        plan_raw = self._llm(planning_prompt).strip()
        plan_raw = self._strip_code_fences(plan_raw)

        # 2) Parse JSON safely (tolerate single quotes)
        try:
            plan = json.loads(plan_raw)
        except Exception:
            try:
                plan = json.loads(plan_raw.replace("'", '"'))
            except Exception:
                plan = {"use_tool": False, "answer": plan_raw or "OK"}

        # 3) If no tool: answer directly
        if not plan.get("use_tool"):
            answer = plan.get("answer")
            if not isinstance(answer, str) or not answer.strip():
                answer = "OK"
            return {"answer": answer, "used_tool": None}

        # 4) Validate tool request
        tool_name = plan.get("tool_name") or ""
        args = plan.get("args") or {}
        tool = next((t for t in TOOL_REGISTRY if t.name == tool_name), None)
        if not tool:
            return {
                "answer": f"I proposed tool '{tool_name}' but it doesn't exist. Try again.",
                "used_tool": None
            }

        # 5) Validate args against tool.input_schema (very light check)
        input_schema = getattr(tool, "input_schema", {})
        required = input_schema.get("required", []) if isinstance(input_schema, dict) else []
        missing = [k for k in required if k not in args]
        if missing:
            return {
                "answer": f"Missing required args for '{tool.name}': {missing}",
                "used_tool": None
            }

        # 6) Confirm if tool mutates state
        is_mutating = bool(getattr(tool, "mutating", False))
        if is_mutating and not getattr(ctx, "user_confirmed", False):
            suggestion = (
                f"I can run tool '{tool.name}' with args {args}, "
                f"but it changes data. Reply 'CONFIRM {tool.name}' to proceed."
            )
            return {
                "answer": suggestion,
                "used_tool": None,
                "requires_confirmation": True,
                "tool_name": tool.name,
                "args": args
            }

        # 7) Execute tool with error handling
        try:
            result = tool.run(ctx, args)
        except Exception as e:
            return {"answer": f"Tool '{tool.name}' failed: {e}", "used_tool": tool.name}

        # Cap what we send back to the LLM for summarization
        try:
            result_for_model = json.dumps(result)
            if len(result_for_model) > 6000:
                result_for_model = result_for_model[:6000] + "... [truncated]"
        except Exception:
            result_for_model = str(result)[:6000] + "... [truncated]"

        # 8) Summarize result to user
        summary = self._llm([
            {"role": "system", "content": self.SYSTEM},
            {"role": "user", "content": f"Tool '{tool.name}' returned: {result_for_model}\nSummarize briefly for the user."}
        ])
        return {"answer": summary, "used_tool": tool.name, "result": result}
