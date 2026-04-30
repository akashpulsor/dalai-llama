// shared/types/tenant.d.ts
//
// Types for tenant-facing apps (agent-ui, supervisor-ui, admin-ui)

declare module "@dalaillama/shared-types/tenant" {

  /* ── Tenant Config (from GET /api/v1/public/tenant-config/{slug}) ── */

  export interface TenantConfig {
    tenant_id: string;
    realm: string;
    client_id: string;
    product_code: string;
    namespace: string;
    sip_wss_url: string;
    stomp_ws_url: string;
    turn_url: string;
    features: TenantFeatures;
  }

  export interface TenantFeatures {
    ai_bot: boolean;
    recording: boolean;
    campaigns: boolean;
    whisper: boolean;
    barge: boolean;
    listen: boolean;
    voicemail: boolean;
    live_transcript: boolean;
    dnc_management: boolean;
    amd: boolean;
    ivr_multi_language: boolean;
    rvc: boolean;
    softphone: boolean;
    queue_management: boolean;
    bot_management: boolean;
    bot_testing: boolean;
    routing_policies: boolean;
    sip_trunks: boolean;
    max_agents: number;
    max_queues: number;
    max_channels: number;
    max_ai_minutes: number;
    [key: string]: boolean | number | string;
  }

  /* ── Tenant Redux State ── */

  export interface TenantState {
    tenantId: string | null;
    slug: string | null;
    realm: string | null;
    clientId: string | null;
    productCode: string | null;
    sipWssUrl: string | null;
    stompWsUrl: string | null;
    turnUrl: string | null;
    features: Partial<TenantFeatures>;
    isResolved: boolean;
  }

  /* ── SIP Phone Types ── */

  export interface SipCredentials {
    extension: string;
    sip_domain: string;
    sip_password: string;
    sip_wss_url?: string;
  }

  export interface ActiveCallInfo {
    id: string;
    direction: string;
    remoteNumber: string;
    remoteName: string;
    state: string;
    startTime: number;
  }

  export interface IncomingCallInfo {
    id: string;
    callerNumber: string;
    callerName: string;
    timestamp: number;
  }

  export type SipRegistrationState = 'UNREGISTERED' | 'REGISTERING' | 'REGISTERED' | 'FAILED';
  export type SipCallState = 'IDLE' | 'RINGING_IN' | 'RINGING_OUT' | 'CONNECTED' | 'ON_HOLD' | 'WRAP_UP';

  export interface SipState {
    registrationState: SipRegistrationState;
    activeCall: ActiveCallInfo | null;
    incomingCall: IncomingCallInfo | null;
    callState: SipCallState;
    isMuted: boolean;
  }

  export interface SipPhoneApi {
    isRegistered: boolean;
    register: () => Promise<void>;
    unregister: () => Promise<void>;
    call: (number: string) => Promise<void>;
    answer: () => Promise<void>;
    hangup: () => void;
    hold: () => Promise<void>;
    unhold: () => Promise<void>;
    mute: () => void;
    unmute: () => void;
    transfer: (target: string) => Promise<void>;
    sendDtmf: (digit: string) => void;
  }

  /* ── Bot Test Types ── */

  export interface BotTestTranscriptEntry {
    role: 'user' | 'bot' | 'system';
    text: string;
    timestamp?: number;
  }

  export interface BotTestIntentEntry {
    intent: string;
    confidence: number;
    timestamp?: number;
  }

  export interface BotTestEscalationEvent {
    type: string;
    target?: string;
    reason?: string;
    timestamp?: number;
  }

  export interface BotTestPipelineStatus {
    kamailio: 'pending' | 'connected' | 'failed';
    freeswitch: 'pending' | 'connected' | 'failed';
    voice_brain: 'pending' | 'connected' | 'failed';
    stt: 'pending' | 'active' | 'failed';
    llm: 'pending' | 'active' | 'failed';
    tts: 'pending' | 'active' | 'failed';
    escalation: 'pending' | 'triggered' | 'none';
  }

  export interface BotTestLatency {
    stt_ms: number;
    llm_ms: number;
    tts_ms: number;
    total_ms: number;
  }

  export interface BotTestState {
    sessionId: string | null;
    isActive: boolean;
    transcript: BotTestTranscriptEntry[];
    intents: BotTestIntentEntry[];
    sentiment: number;
    escalationEvents: BotTestEscalationEvent[];
    pipelineStatus: BotTestPipelineStatus | null;
    latency: BotTestLatency | null;
  }

  /* ── Agent (PBX-Core model) ── */

  export type AgentRole = 'AGENT' | 'SUPERVISOR' | 'TENANT_ADMIN';
  export type AgentStatusType = 'ONLINE' | 'ON_CALL' | 'BREAK' | 'WRAP_UP' | 'OFFLINE';

  export interface PbxAgent {
    id: string;
    tenant_id: string;
    subscription_id: string;
    username: string;
    sip_domain: string;
    display_name: string;
    extension: string;
    email: string;
    role: AgentRole;
    status: AgentStatusType;
    skills: string[];
    keycloak_user_id: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }

  /* ── Bot (PBX-Core model) ── */

  export type BotProductMode = 'CONV_IVR' | 'AI_CC_ASSIST' | 'OUTBOUND' | 'RECEPTIONIST';

  export interface PbxBot {
    id: string;
    tenant_id: string;
    name: string;
    product_mode: BotProductMode;
    system_prompt: string;
    greeting: string;
    language: string;
    voice: string;
    stt_provider: string;
    tts_provider: string;
    llm_provider: string;
    llm_model: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }

  export interface BotKnowledgeDoc {
    id: string;
    bot_id: string;
    title: string;
    content: string;
    content_type: 'FAQ' | 'PRODUCT' | 'SCRIPT' | 'POLICY';
    is_enabled: boolean;
    created_at: string;
  }

  export type EscalationAction = 'TRANSFER_QUEUE' | 'TRANSFER_AGENT' | 'HANGUP';

  export interface BotEscalationIntent {
    id: string;
    bot_id: string;
    intent_name: string;
    threshold: number;
    action: EscalationAction;
    target: string;
    priority: number;
    is_enabled: boolean;
  }

  /* ── Campaign (PBX-Core model) ── */

  export type CampaignStatus = 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

  export interface PbxCampaign {
    id: string;
    tenant_id: string;
    name: string;
    bot_id: string;
    caller_id: string;
    max_concurrent: number;
    status: CampaignStatus;
    schedule_start: string;
    schedule_end: string;
    created_at: string;
  }

  /* ── Queue (PBX-Core model) ── */

  export type QueueStrategy = 'ROUND_ROBIN' | 'LONGEST_IDLE' | 'SKILLS_BASED' | 'RING_ALL';

  export interface PbxQueue {
    id: string;
    tenant_id: string;
    name: string;
    strategy: QueueStrategy;
    max_wait_seconds: number;
    wrapup_seconds: number;
    is_active: boolean;
    created_at: string;
  }

  export interface QueueStats {
    queue_id: string;
    name: string;
    waiting: number;
    avg_wait_seconds: number;
    sla_percent: number;
    agents_available: number;
    abandoned: number;
  }

  /* ── CDR / Call Record ── */

  export interface CdrRecord {
    id: string;
    tenant_id: string;
    call_id: string;
    direction: 'INBOUND' | 'OUTBOUND';
    status: 'COMPLETED' | 'MISSED' | 'FAILED' | 'BUSY' | 'NO_ANSWER';
    caller_number: string;
    callee_number: string;
    did_number?: string;
    agent_name?: string;
    product_code: string;
    start_time: string;
    end_time?: string;
    duration_seconds?: number;
    hangup_cause?: string;
    recording_url?: string;
    transcript_url?: string;
    sentiment_score?: number;
    cost?: number;
  }

  /* ── Analytics Responses ── */

  export interface AnalyticsOverview {
    total_calls: number;
    total_minutes: number;
    total_cost: number;
    ai_minutes: number;
    calls_by_direction: { inbound: number; outbound: number };
    calls_by_status: Record<string, number>;
    avg_handle_time: number;
    avg_wait_time: number;
    sla_percentage: number;
  }

  export interface AnalyticsCustomer {
    unique_callers: number;
    repeat_callers: number;
    avg_sentiment: number;
    top_intents: Array<{ intent: string; count: number }>;
    resolution_rate: number;
    escalation_rate: number;
    peak_hours: number[];
  }

  export interface AnalyticsBotStats {
    bot_id: string;
    bot_name: string;
    calls_handled: number;
    avg_conversation_length: number;
    escalation_rate: number;
    top_intents: Array<{ intent: string; count: number }>;
    avg_sentiment: number;
    containment_rate: number;
  }

  export interface AnalyticsAgentStats {
    agent_id: string;
    agent_name: string;
    calls_handled: number;
    avg_handle_time: number;
    avg_after_call_work: number;
    occupancy_rate: number;
    avg_sentiment: number;
    first_call_resolution_rate: number;
  }

  /* ── TURN Credentials ── */

  export interface TurnCredentials {
    turn_url: string;
    username: string;
    password: string;
    ttl: number;
  }
}