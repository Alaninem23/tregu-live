from sqlalchemy.orm import Session
from datetime import datetime
from app.modules.ai.models import Task, TaskStatus, KnowledgeItem, AIEmployee

def _now():
    return datetime.utcnow()

def run_task(db: Session, task_id: int) -> Task:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise ValueError("Task not found")

    task.status = TaskStatus.RUNNING
    task.updated_at = _now()
    db.commit(); db.refresh(task)

    agent = None
    if task.assigned_agent_id:
        agent = db.query(AIEmployee).filter(AIEmployee.id == task.assigned_agent_id).first()

    # gather snippets (no f-strings/format to avoid PS escaping issues)
    kn = db.query(KnowledgeItem).order_by(KnowledgeItem.created_at.desc()).limit(3).all()
    parts = []
    for k in kn:
        content = (k.content or "")[:200]
        if k.content and len(k.content) > 200:
            content += "..."
        parts.append(" " + (k.title or "Untitled") + ": " + content)
    snippets = "\n\n".join(parts) if parts else "(none)"

    agent_name = agent.name if agent else "UnassignedAgent"
    desc = task.description or "-"

    lines = []
    lines.append("Agent " + agent_name + " executed task " + task.title + ".")
    lines.append("")
    lines.append("Description:")
    lines.append(desc)
    lines.append("")
    lines.append("Recent knowledge:")
    lines.append(snippets)
    lines.append("")
    lines.append("Result:")
    lines.append("This is a placeholder result produced by the local runtime. Hook up your LLM/tool calls in runtime.py.")

    task.result = "\n".join(lines)
    task.status = TaskStatus.DONE
    task.updated_at = _now()
    db.commit(); db.refresh(task)
    return task