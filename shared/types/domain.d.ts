/**
 * shared/types/domain.d.ts
 *
 * Comprehensive domain and UI types for DalaiLLAMA monorepo.
 *
 * Import examples:
 *   import type { Agent, CallRecord, STTEvent } from "@dalaillama/shared-types";
 */

import type { ReactNode, ComponentType } from "react";

declare module "@dalaillama/shared-types" {
  /* -------------------------------------------------------------------------- */
  /*                            Basic ID / Utility Types                         */
  /* -------------------------------------------------------------------------- */

  export type ID = string;
  export type ISODateString = string; // e.g. new Date().toISOString()

  /* -------------------------------------------------------------------------- */
  /*                                 Enums / Tags                                */
  /* -------------------------------------------------------------------------- */

  export type CallDirection = "inbound" | "outbound" | "internal";
  export type CallState =
    | "queued"
    | "ringing"
    | "in-progress"
    | "on-hold"
    | "completed"
    | "failed"
    | "transferring";
  export type AgentStatus = "online" | "offline" | "break" | "busy" | "ringing";
  export type Sentiment = "positive" | "neutral" | "negative";
  export type PlanType = "shared" | "dedicated";
  export type DeploymentTarget = "aws" | "azure" | "gcp" | "onprem";

  /* -------------------------------------------------------------------------- */
  /*                                  Domain Models                              */
  /* -------------------------------------------------------------------------- */

  export interface Tenant {
    id: ID;
    name: string;
    domain?: string;
    ownerEmail?: string;
    plan: PlanType;
    createdAt: ISODateString;
    lastUpdated?: ISODateString;
    // cloud provider choice for dedicated deployments
    deployment?: {
      provider: DeploymentTarget;
      region?: string;
      workerNodeId?: ID;
    } | null;
    metadata?: Record<string, any>;
  }

  export interface Partner {
    id: ID;
    name: string;
    contactEmail?: string;
    walletId?: ID;
    createdAt: ISODateString;
  }

  export interface Agent {
    id: ID;
    tenantId: ID;
    name: string;
    username: string;
    email?: string;
    status: AgentStatus;
    skills?: string[]; // e.g. ["sales","billing"]
    currentCallId?: ID | null;
    createdAt: ISODateString;
    supervisorId?: ID | null;
    isSupervisor?: boolean;
    metadata?: Record<string, any>;
  }

  export interface Supervisor {
    id: ID;
    tenantId: ID;
    name: string;
    email?: string;
    directReports?: ID[]; // agent ids
    hierarchies?: string[]; // e.g. team names
  }

  export interface Queue {
    id: ID;
    tenantId: ID;
    name: string;
    number?: string; // DID
    priority?: number;
    maxWaitSeconds?: number;
    members?: ID[]; // agent ids
    routingPolicy?: "round-robin" | "least-recent" | "longest-idle" | "skills-based";
    createdAt?: ISODateString;
    metadata?: Record<string, any>;
  }

  export interface CallRecord {
    id: ID;
    tenantId: ID;
    from: string; // caller number
    to: string; // called number / DID
    direction: CallDirection;
    state: CallState;
    queueId?: ID | null;
    agentId?: ID | null;
    startTime?: ISODateString | null;
    endTime?: ISODateString | null;
    durationSeconds?: number | null;
    recordingUrl?: string | null;
    disposition?: string | null;
    notes?: string | null;
    cdr?: Record<string, any>; // raw CDR data
  }

  export interface Wallet {
    id: ID;
    tenantId?: ID | null;
    balance: number; // currency units
    currency?: string;
    threshold?: number; // auto topup trigger
    autoTopupEnabled?: boolean;
    lastTopupAt?: ISODateString | null;
  }

  /* -------------------------------------------------------------------------- */
  /*                             Speech / STT / AI Types                         */
  /* -------------------------------------------------------------------------- */

  export interface STTEvent {
    id: ID;
    tenantId?: ID | null;
    callId?: ID | null;
    speaker: "agent" | "customer" | "system" | string;
    text: string;
    confidence?: number; // 0..1
    startTime?: ISODateString | null;
    endTime?: ISODateString | null;
    language?: string;
    sentiment?: Sentiment;
    tokens?: string[]; // optional tokenization
    annotations?: Record<string, any>;
  }

  export interface AiSuggestion {
    id: ID;
    callId?: ID | null;
    timestamp: ISODateString;
    suggestionText: string;
    confidence?: number;
    type?: "reply" | "next-step" | "policy" | "escalation";
    metadata?: Record<string, any>;
  }

  export interface AiSummary {
    id: ID;
    callId: ID;
    createdAt: ISODateString;
    summaryText: string;
    keyTakeaways?: string[];
    recommendedFollowUps?: string[];
    churnRiskScore?: number; // 0..1
    tone?: Sentiment;
    tags?: string[];
  }

  /* -------------------------------------------------------------------------- */
  /*                             WebSocket / Telemetry Events                    */
  /* -------------------------------------------------------------------------- */

  export interface MetricsEvent {
    type: "metrics";
    callId?: ID;
    rttMs?: number;
    jitterMs?: number;
    packetLossPercent?: number;
    mos?: number; // mean opinion score estimated
    ts: number;
  }

  export interface CallEventMessage {
    type: "call_event";
    callId: ID;
    event: "started" | "ringing" | "answered" | "ended" | "transferred" | "hold" | "resumed";
    ts: number;
    details?: Record<string, any>;
  }

  export interface AgentEventMessage {
    type: "agent_event";
    agentId: ID;
    event: "login" | "logout" | "status_change" | "joined_call" | "left_call";
    ts: number;
    details?: Record<string, any>;
  }

  export interface STTMessage {
    type: "stt";
    payload: STTEvent;
  }

  export type WsMessage = MetricsEvent | CallEventMessage | AgentEventMessage | STTMessage | { type: string; [k: string]: any };

  /* -------------------------------------------------------------------------- */
  /*                               IVR / Bot Types                               */
  /* -------------------------------------------------------------------------- */

  export type IVRNodeType = "prompt" | "intent" | "dtmf" | "route" | "end" | "action";

  export interface BaseIVRNode {
    id: ID;
    type: IVRNodeType;
    name?: string;
    metadata?: Record<string, any>;
  }

  export interface PromptNode extends BaseIVRNode {
    type: "prompt";
    text: string; // TTS text
    next?: ID; // next node id
    timeoutSeconds?: number;
  }

  export interface IntentNode extends BaseIVRNode {
    type: "intent";
    model?: string; // model id or 'llm'
    routes: {
      [intentName: string]: ID; // maps recognized intent -> next node
    };
    fallback?: ID;
  }

  export interface DtmfNode extends BaseIVRNode {
    type: "dtmf";
    mapping: {
      [digit: string]: ID;
    };
    timeout?: ID; // node id to go to on timeout
  }

  export interface RouteNode extends BaseIVRNode {
    type: "route";
    targetType: "queue" | "agent" | "external";
    targetId?: ID; // queue or agent or external endpoint
  }

  export interface EndNode extends BaseIVRNode {
    type: "end";
    disposition?: string;
  }

  export type IVRNode = PromptNode | IntentNode | DtmfNode | RouteNode | EndNode;

  export interface IVRFlow {
    id: ID;
    tenantId: ID;
    name: string;
    nodes: Record<ID, IVRNode>;
    entryNodeId: ID;
    createdAt?: ISODateString;
    metadata?: Record<string, any>;
  }

  /* -------------------------------------------------------------------------- */
  /*                             Scheduling & Shifts                             */
  /* -------------------------------------------------------------------------- */

  export interface ShiftBlock {
    id: ID;
    tenantId: ID;
    agentId: ID;
    start: ISODateString;
    end: ISODateString;
    timezone?: string;
    role?: string;
    metadata?: Record<string, any>;
  }

  export interface ShiftCalendar {
    tenantId: ID;
    blocks: ShiftBlock[];
  }

  /* -------------------------------------------------------------------------- */
  /*                                ACW / Ticketing                              */
  /* -------------------------------------------------------------------------- */

  export interface Disposition {
    id: ID;
    name: string;
    code?: string;
    description?: string;
  }

  export interface ACWForm {
    callId: ID;
    dispositionId?: ID | null;
    notes?: string;
    followUpAt?: ISODateString | null;
    createdBy?: ID;
    createdAt?: ISODateString;
    ticketId?: ID | null; // optional auto-created ticket (Zendesk-like)
  }

  export interface TicketPreview {
    id: ID;
    createdAt: ISODateString;
    createdBy?: ID;
    tenantId?: ID;
    title: string;
    description?: string;
    priority?: "low" | "medium" | "high";
    status?: "open" | "pending" | "closed";
    linkedCallId?: ID | null;
    assigneeId?: ID | null;
  }

  /* -------------------------------------------------------------------------- */
  /*                                 Billing Types                                */
  /* -------------------------------------------------------------------------- */

  export interface BillingLineItem {
    id: ID;
    tenantId: ID;
    description: string;
    amount: number;
    currency?: string;
    timestamp?: ISODateString;
    metadata?: Record<string, any>;
  }

  export interface BillingSummary {
    tenantId: ID;
    month: string; // YYYY-MM
    total: number;
    breakdown?: BillingLineItem[];
  }

  /* -------------------------------------------------------------------------- */
  /*                                Supervisor Models                            */
  /* -------------------------------------------------------------------------- */

  export interface SupervisorHierarchy {
    id: ID;
    tenantId: ID;
    name: string;
    supervisors: ID[]; // supervisor ids
    agentIds: ID[]; // agents in this hierarchy
    parentId?: ID | null;
  }

  /* -------------------------------------------------------------------------- */
  /*                               UI / Navigation Types                         */
  /* -------------------------------------------------------------------------- */

  export type AppRoute =
    | "/"
    | "/login"
    | "/platform"
    | "/dashboard"
    | "/agent"
    | "/agent/live"
    | "/agent/acw"
    | "/admin"
    | "/admin/live-monitor"
    | string; // allow custom extension

  export interface NavLink {
    route: AppRoute;
    label: string;
    icon?: ComponentType<any>;
  }

  /* -------------------------------------------------------------------------- */
  /*                              RTK Query / API Helpers                        */
  /* -------------------------------------------------------------------------- */

  /** Generic API response envelope used by backend */
  export interface ApiResponse<T = any> {
    ok: boolean;
    data?: T;
    error?: string | Record<string, any>;
    ts?: ISODateString;
  }

  export interface Paginated<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
  }

  /* -------------------------------------------------------------------------- */
  /*                              Web UI Component Types                         */
  /* -------------------------------------------------------------------------- */

  // Re-declare or forward to react-props if needed; keeping here for convenience
  export interface ButtonProps {
    children: ReactNode;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    className?: string;
  }

  export interface InputFieldProps {
    type?: string;
    placeholder: string;
    value: string;
    onChange: (val: string) => void;
    error?: boolean;
    icon?: ComponentType<any>;
  }

  export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children?: ReactNode;
    title?: string;
  }

  export interface FloatingActionButtonProps {
    icon?: ComponentType<any>;
    label: string;
    onPress: () => void;
    className?: string;
  }

  export interface ErrorMessageProps {
    message: string;
  }

  /* -------------------------------------------------------------------------- */
  /*                         Mock / Dev helper types                             */
  /* -------------------------------------------------------------------------- */

  export interface MockResponderContext {
    url: string;
    method: string;
    body?: any;
    query?: Record<string, string | string[]>;
    headers?: Record<string, string>;
  }

  export type MockResponder = (ctx: MockResponderContext) => Promise<any> | any;

  /* -------------------------------------------------------------------------- */
  /*                                   Misc                                        */
  /* -------------------------------------------------------------------------- */

  export interface SimpleKeyValue {
    key: string;
    value: string | number | boolean;
  }
}
