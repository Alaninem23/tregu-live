export type AIBuddyPersona = {
  id: string;
  name: string;
  file: string;
  persona: {
    tone: "formal" | "neutral" | "friendly" | string;
    verbosity: "low" | "medium" | "high" | string;
    caution: "low" | "medium" | "high" | string;
    domain_bias: string[];
  };
  voice: {
    gender: string;
    style: string;
    speed: number;
  };
};

export type AIBuddyPrompt = {
  id: string;
  label: string;
  prompt: string;
  personaHint?: string;
};

export type AIBuddyPromptGroup = {
  id: string;
  title: string;
  description?: string;
  prompts: AIBuddyPrompt[];
};

export type AIBuddyTool = {
  id: string;
  label: string;
  description: string;
  status: "online" | "degraded" | "offline";
  connected: boolean;
  lastChecked: string;
  tags?: string[];
};

export type AIBuddyFeatureFlags = {
  auditLogging: boolean;
  allowToolExecution: boolean;
  allowPersonaEditing: boolean;
};

export type AIBuddyEnvironment = {
  region: string;
  latencyMs: number;
  lastSync: string;
  modelHint?: string;
};

export type AIBuddyConfig = {
  manifestVersion: number;
  personas: AIBuddyPersona[];
  defaultPersonaId: string | null;
  promptGroups: AIBuddyPromptGroup[];
  tools: AIBuddyTool[];
  featureFlags: AIBuddyFeatureFlags;
  environment: AIBuddyEnvironment;
};

export type AIBuddyMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type AIBuddyChatResponse = {
  reply: string;
  personaId: string;
  followUps?: string[];
  actions?: Array<{
    id: string;
    label: string;
    description?: string;
    target?: string;
  }>;
  telemetry?: {
    toolCalls?: number;
    latencyMs?: number;
  };
};
