// shared/types/ui.d.ts

export type Screen =
  | "agent-console"
  | "supervisor-dashboard"
  | "ivr-builder"
  | "billing"
  | "onboarding"
  | "calls"
  | "login";

export interface WaveformModel {
  samples: number[];
}

export interface TranscriptLine {
  text: string;
  ts: number;
  speaker: "agent" | "customer" | "system";
}

export interface LiveCallSummary {
  id: string;
  from: string;
  to: string;
  status: "ringing" | "connected" | "hold" | "ended";
  sentiment: "positive" | "neutral" | "negative";
}

export interface AgentPresence {
  id: string;
  name: string;
  status: "online" | "offline" | "away" | "busy";
  role?: string;
}
