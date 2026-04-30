// shared/types/ui.d.ts

import * as React from "react";

/* ── Screen / Domain Types ── */

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

/* ── Component Module ── */

declare module "@dalaillama/shared-ui" {
  import * as React from "react";

  // ── Existing ──
  export const Toaster: React.FC;



  export class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
  > {}
  // ── FeatureGate ──
  export const FeatureGate: React.FC<{
    feature: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
  }>;
  export function useFeature(feature: string): boolean;

  // ── SoftphoneWidget ──
  export const SoftphoneWidget: React.FC<{
    sipPhone: {
      call: (number: string) => void;
      answer: () => void;
      hangup: () => void;
      hold: () => void;
      unhold: () => void;
      mute: () => void;
      unmute: () => void;
      transfer: (target: string) => void;
      sendDtmf: (digit: string) => void;
      isMuted: boolean;
      isRegistered: boolean;
    };
  }>;

  // ── LiveTranscriptPanel ──
  export const LiveTranscriptPanel: React.FC<{
    transcript?: Array<{ role: string; text: string; timestamp?: number }>;
    sentiment?: number;
    intents?: Array<{ intent: string; confidence: number }>;
    title?: string;
    className?: string;
  }>;

  // ── BotTestChat ──
  export const BotTestChat: React.FC<{
    botTest: {
      transcript: Array<{ role: string; text: string; timestamp?: number }>;
      intents: Array<{ intent: string; confidence: number; timestamp?: number }>;
      sentiment: number;
      escalationEvents: Array<{ type: string; target?: string; reason?: string; timestamp?: number }>;
      isActive: boolean;
    };
    onSendMessage: (text: string) => void;
    onStartVoice: () => void;
    onStopVoice: () => void;
    onStartTest: () => void;
    onEndTest: () => void;
    isRecording?: boolean;
  }>;

  // ── AudioPlayer ──
  export const AudioPlayer: React.FC<{
    src: string;
    title?: string;
    className?: string;
  }>;

  // ── AgentGrid ──
  export interface AgentGridItem {
    id: string;
    display_name: string;
    extension: string;
    status: 'ONLINE' | 'ON_CALL' | 'BREAK' | 'WRAP_UP' | 'OFFLINE';
    current_call_number?: string;
    call_duration?: number;
    avatar_url?: string;
  }

  export const AgentGrid: React.FC<{
    agents?: AgentGridItem[];
    onAgentClick?: (agent: AgentGridItem) => void;
    compact?: boolean;
  }>;

  // ── QueueStatsCard ──
  export const QueueStatsCard: React.FC<{
    queue: {
      name: string;
      waiting: number;
      avg_wait_seconds: number;
      sla_percent: number;
      agents_available: number;
      abandoned: number;
    };
    onClick?: () => void;
  }>;

  // ── CallRecordRow ──
  export interface CallRecordData {
    direction: string;
    status: string;
    start_time: string;
    caller_number: string;
    callee_number: string;
    agent_name?: string;
    duration_seconds?: number;
    recording_url?: string;
    transcript_url?: string;
  }

  export const CallRecordRow: React.FC<{
    record: CallRecordData;
    onPlayRecording?: (url: string) => void;
    onViewTranscript?: (url: string) => void;
    onClick?: () => void;
  }>;

  // ── DateRangePicker ──
  export const DateRangePicker: React.FC<{
    preset: string;
    label: string;
    setPreset: (p: string) => void;
    setCustomRange: (from: Date, to: Date) => void;
  }>;

  // ── KpiCard ──
  export const KpiCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: React.ElementType;
    iconBg?: string;
    trend?: number;
    className?: string;
  }>;

  // ── SupervisorCallActions ──
  export const SupervisorCallActions: React.FC<{
    callId: string;
    disabled?: boolean;
  }>;

  // ── SentimentBadge (existing) ──
  export type SentimentType = "positive" | "neutral" | "negative";
  export const SentimentBadge: React.FC<{ sentiment: SentimentType }>;

  // ── Existing components (untyped before, now typed) ──
  export const FormInput: React.FC<any>;
  export const FormSelect: React.FC<any>;
  export const FormTextArea: React.FC<any>;
  export const Table: React.FC<any>;
  export const TableRow: React.FC<any>;
  export const StatusTag: React.FC<any>;
  export const ActionButtons: React.FC<any>;
  export const AgentStatusCard: React.FC<any>;
  export const CallHeader: React.FC<any>;
  export const DialPad: React.FC<any>;
  export const LiveCallCard: React.FC<any>;
  export const SupervisorControls: React.FC<any>;
  export const TranscriptPane: React.FC<any>;
  export const UserAvtar: React.FC<any>;
  export const WaveformBar: React.FC<any>;
}