import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * PBX-Core RTK Query API — matches all actual Java controllers exactly.
 *
 * Controllers mapped:
 *   AgentController     → /api/v1/agents
 *   CallController      → /api/v1/calls
 *   BotController       → /api/v1/bots
 *   CampaignController  → /api/v1/campaigns
 *   ContactController   → /api/v1/campaigns/{id}/contacts, /api/v1/dnc
 *   QueueController     → /api/v1/queues
 *   RoutingController   → /api/v1/routing
 *   SupervisorController→ /api/v1/calls/{id}/listen|whisper|barge, /api/v1/supervisor
 *   TrunkController     → /api/v1/trunks
 *   TurnController      → /api/v1/turn
 */
/**
 * Resolve API base URL.
 * Production: https://api.{domain}/api/v1
 * Dev (Vite proxy): /api/v1
 */
function getBaseUrl() {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      const parts = hostname.split('.');
      const domain = parts.slice(-2).join('.');
      return `https://api.${domain}/api/v1`;
    }
  }
  return '/api/v1';
}

const pbxCoreApi = createApi({
  reducerPath: 'pbxCoreApi',
  baseQuery: fetchBaseQuery({
    baseUrl: getBaseUrl(),
    prepareHeaders: (headers, { getState }) => {
      const state = /** @type {any} */ (getState());
      // Try tenant auth token first (Keycloak JS adapter), then platform auth
      const token = state.auth?.keycloakToken || state.auth?.access_token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Agent', 'Bot', 'Campaign', 'Queue', 'Routing', 'Trunk', 'Contact', 'DNC'],
  endpoints: (builder) => ({

    // ═══════════════════════════════════════════════════════════
    // AGENT — AgentController.java
    // ═══════════════════════════════════════════════════════════

    // GET /agents/me
    getMe: builder.query({
      query: () => '/agents/me',
    }),

    // GET /agents/me/sip-credentials
    getSipCredentials: builder.query({
      query: () => '/agents/me/sip-credentials',
    }),

    // GET /agents?tenant_id=
    listAgents: builder.query({
      query: (/** @type {string} */ tenantId) => `/agents?tenant_id=${tenantId}`,
      providesTags: ['Agent'],
    }),

    // GET /agents/{id}
    getAgent: builder.query({
      query: (/** @type {string} */ id) => `/agents/${id}`,
      providesTags: ['Agent'],
    }),

    // GET /agents/available?tenant_id=
    getAvailableAgents: builder.query({
      query: (/** @type {string} */ tenantId) => `/agents/available?tenant_id=${tenantId}`,
    }),

    // POST /agents
    createAgent: builder.mutation({
      query: (/** @type {{ tenant_id: string, subscription_id: string, username: string, sip_domain: string, display_name: string, extension: string, email: string, role?: string, skills?: string[] }} */ body) => ({
        url: '/agents',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Agent'],
    }),

    // PUT /agents/{id}
    updateAgent: builder.mutation({
      query: (/** @type {{ id: string, display_name?: string, extension?: string, email?: string, skills?: string[] }} */ { id, ...body }) => ({
        url: `/agents/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Agent'],
    }),

    // PUT /agents/{id}/status
    setAgentStatus: builder.mutation({
      query: (/** @type {{ id: string, status: string }} */ { id, status }) => ({
        url: `/agents/${id}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: ['Agent'],
    }),

    // DELETE /agents/{id}
    deleteAgent: builder.mutation({
      query: (/** @type {string} */ id) => ({
        url: `/agents/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Agent'],
    }),

    // ═══════════════════════════════════════════════════════════
    // CALL — CallController.java
    // ═══════════════════════════════════════════════════════════

    // GET /calls/active?tenant_id=
    getActiveCalls: builder.query({
      query: (/** @type {string} */ tenantId) => `/calls/active?tenant_id=${tenantId}`,
    }),

    // POST /calls/originate
    originateCall: builder.mutation({
      query: (/** @type {{ from: string, to: string, tenant_id: string, context?: string }} */ body) => ({
        url: '/calls/originate',
        method: 'POST',
        body,
      }),
    }),

    // POST /calls/{callId}/answer
    answerCall: builder.mutation({
      query: (/** @type {string} */ callId) => ({
        url: `/calls/${callId}/answer`,
        method: 'POST',
      }),
    }),

    // POST /calls/{callId}/hold
    holdCall: builder.mutation({
      query: (/** @type {string} */ callId) => ({
        url: `/calls/${callId}/hold`,
        method: 'POST',
      }),
    }),

    // POST /calls/{callId}/transfer
    transferCall: builder.mutation({
      query: (/** @type {{ callId: string, destination: string, context?: string }} */ { callId, ...body }) => ({
        url: `/calls/${callId}/transfer`,
        method: 'POST',
        body,
      }),
    }),

    // POST /calls/{callId}/hangup
    hangupCall: builder.mutation({
      query: (/** @type {string} */ callId) => ({
        url: `/calls/${callId}/hangup`,
        method: 'POST',
      }),
    }),

    // POST /calls/{callId}/dtmf
    sendDtmf: builder.mutation({
      query: (/** @type {{ callId: string, digits: string }} */ { callId, digits }) => ({
        url: `/calls/${callId}/dtmf`,
        method: 'POST',
        body: { digits },
      }),
    }),

    // POST /calls/{callId}/interrupt
    interruptCall: builder.mutation({
      query: (/** @type {string} */ callId) => ({
        url: `/calls/${callId}/interrupt`,
        method: 'POST',
      }),
    }),

    // ═══════════════════════════════════════════════════════════
    // SUPERVISOR — SupervisorController.java
    // ═══════════════════════════════════════════════════════════

    // POST /calls/{callId}/listen
    listenCall: builder.mutation({
      query: (/** @type {{ callId: string, supervisor_uuid: string }} */ { callId, supervisor_uuid }) => ({
        url: `/calls/${callId}/listen`,
        method: 'POST',
        body: { supervisor_uuid },
      }),
    }),

    // POST /calls/{callId}/whisper
    whisperCall: builder.mutation({
      query: (/** @type {{ callId: string, supervisor_uuid: string }} */ { callId, supervisor_uuid }) => ({
        url: `/calls/${callId}/whisper`,
        method: 'POST',
        body: { supervisor_uuid },
      }),
    }),

    // POST /calls/{callId}/barge
    bargeCall: builder.mutation({
      query: (/** @type {{ callId: string, supervisor_uuid: string }} */ { callId, supervisor_uuid }) => ({
        url: `/calls/${callId}/barge`,
        method: 'POST',
        body: { supervisor_uuid },
      }),
    }),

    // GET /supervisor/dashboard?tenant_id=
    getSupervisorDashboard: builder.query({
      query: (/** @type {string} */ tenantId) => `/supervisor/dashboard?tenant_id=${tenantId}`,
    }),

    // GET /supervisor/agent/{agentId}/call?tenant_id=
    getAgentCall: builder.query({
      query: (/** @type {{ agentId: string, tenantId: string }} */ { agentId, tenantId }) =>
        `/supervisor/agent/${agentId}/call?tenant_id=${tenantId}`,
    }),

    // ═══════════════════════════════════════════════════════════
    // BOT — BotController.java
    // ═══════════════════════════════════════════════════════════

    // GET /bots?tenant_id=
    listBots: builder.query({
      query: (/** @type {string} */ tenantId) => `/bots?tenant_id=${tenantId}`,
      providesTags: ['Bot'],
    }),

    // GET /bots/{id}
    getBot: builder.query({
      query: (/** @type {string} */ id) => `/bots/${id}`,
      providesTags: ['Bot'],
    }),

    // POST /bots
    createBot: builder.mutation({
      query: (/** @type {{ tenant_id: string, subscription_id: string, name: string, system_prompt?: string, greeting_message?: string, goodbye_message?: string, guidelines?: string[], allowed_intents?: string[], fallback_message?: string, escalation_rules?: object, transfer_target?: string, transfer_type?: string, voice_provider?: string, voice_id?: string, voice_speed?: number, language?: string, max_turns?: number, max_duration_seconds?: number, dtmf_enabled?: boolean, barge_in_enabled?: boolean, sentiment_tracking?: boolean, custom_data?: object }} */ body) => ({
        url: '/bots',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Bot'],
    }),

    // PUT /bots/{id}
    updateBot: builder.mutation({
      query: (/** @type {{ id: string, [key: string]: any }} */ { id, ...body }) => ({
        url: `/bots/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Bot'],
    }),

    // PUT /bots/{id}/activate
    activateBot: builder.mutation({
      query: (/** @type {string} */ id) => ({
        url: `/bots/${id}/activate`,
        method: 'PUT',
      }),
      invalidatesTags: ['Bot'],
    }),

    // PUT /bots/{id}/disable
    disableBot: builder.mutation({
      query: (/** @type {string} */ id) => ({
        url: `/bots/${id}/disable`,
        method: 'PUT',
      }),
      invalidatesTags: ['Bot'],
    }),

    // ── Bot Escalation Intents ──

    // GET /bots/{botId}/escalation-intents
    listBotEscalation: builder.query({
      query: (/** @type {string} */ botId) => `/bots/${botId}/escalation-intents`,
    }),

    // POST /bots/{botId}/escalation-intents
    createBotEscalation: builder.mutation({
      query: (/** @type {{ botId: string, intent_name: string, description?: string, threshold?: number, action?: string, target?: string, priority?: number }} */ { botId, ...body }) => ({
        url: `/bots/${botId}/escalation-intents`,
        method: 'POST',
        body,
      }),
    }),

    // PUT /bots/{botId}/escalation-intents/{intentId}
    updateBotEscalation: builder.mutation({
      query: (/** @type {{ botId: string, intentId: string, [key: string]: any }} */ { botId, intentId, ...body }) => ({
        url: `/bots/${botId}/escalation-intents/${intentId}`,
        method: 'PUT',
        body,
      }),
    }),

    // DELETE /bots/{botId}/escalation-intents/{intentId}
    deleteBotEscalation: builder.mutation({
      query: (/** @type {{ botId: string, intentId: string }} */ { botId, intentId }) => ({
        url: `/bots/${botId}/escalation-intents/${intentId}`,
        method: 'DELETE',
      }),
    }),

    // ── Bot Knowledge Documents ──

    // GET /bots/{botId}/knowledge
    listBotKnowledge: builder.query({
      query: (/** @type {string} */ botId) => `/bots/${botId}/knowledge`,
    }),

    // POST /bots/{botId}/knowledge
    createBotKnowledge: builder.mutation({
      query: (/** @type {{ botId: string, title: string, content: string, content_type?: string, language?: string, display_order?: number }} */ { botId, ...body }) => ({
        url: `/bots/${botId}/knowledge`,
        method: 'POST',
        body,
      }),
    }),

    // PUT /bots/{botId}/knowledge/{docId}
    updateBotKnowledge: builder.mutation({
      query: (/** @type {{ botId: string, docId: string, [key: string]: any }} */ { botId, docId, ...body }) => ({
        url: `/bots/${botId}/knowledge/${docId}`,
        method: 'PUT',
        body,
      }),
    }),

    // DELETE /bots/{botId}/knowledge/{docId}
    deleteBotKnowledge: builder.mutation({
      query: (/** @type {{ botId: string, docId: string }} */ { botId, docId }) => ({
        url: `/bots/${botId}/knowledge/${docId}`,
        method: 'DELETE',
      }),
    }),

    // ═══════════════════════════════════════════════════════════
    // CAMPAIGN — CampaignController.java
    // ═══════════════════════════════════════════════════════════

    // GET /campaigns?tenant_id=
    listCampaigns: builder.query({
      query: (/** @type {string} */ tenantId) => `/campaigns?tenant_id=${tenantId}`,
      providesTags: ['Campaign'],
    }),

    // GET /campaigns/{id}
    getCampaign: builder.query({
      query: (/** @type {string} */ id) => `/campaigns/${id}`,
      providesTags: ['Campaign'],
    }),

    // POST /campaigns (body is full Campaign entity)
    createCampaign: builder.mutation({
      query: (/** @type {{ tenantId: string, subscriptionId: string, name: string, description?: string, campaignType: string, bot?: { id: string }, didNumber?: string, outboundCallerId?: string, dialerMode?: string, pacingRatio?: number, maxConcurrentCalls?: number, maxAttemptsPerContact?: number, retryDelayMinutes?: number, amdEnabled?: boolean, amdAction?: string, queueId?: string, afterHoursAction?: string, timezone?: string, startDate?: string, endDate?: string, maxDailyCalls?: number, maxTotalCalls?: number }} */ body) => ({
        url: '/campaigns',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Campaign'],
    }),

    // POST /campaigns/{id}/start
    startCampaign: builder.mutation({
      query: (/** @type {string} */ id) => ({ url: `/campaigns/${id}/start`, method: 'POST' }),
      invalidatesTags: ['Campaign'],
    }),

    // POST /campaigns/{id}/pause
    pauseCampaign: builder.mutation({
      query: (/** @type {string} */ id) => ({ url: `/campaigns/${id}/pause`, method: 'POST' }),
      invalidatesTags: ['Campaign'],
    }),

    // POST /campaigns/{id}/resume
    resumeCampaign: builder.mutation({
      query: (/** @type {string} */ id) => ({ url: `/campaigns/${id}/resume`, method: 'POST' }),
      invalidatesTags: ['Campaign'],
    }),

    // POST /campaigns/{id}/cancel
    cancelCampaign: builder.mutation({
      query: (/** @type {string} */ id) => ({ url: `/campaigns/${id}/cancel`, method: 'POST' }),
      invalidatesTags: ['Campaign'],
    }),

    // ═══════════════════════════════════════════════════════════
    // CONTACT — ContactController.java
    // ═══════════════════════════════════════════════════════════

    // POST /campaigns/{campaignId}/contacts/import
    importContacts: builder.mutation({
      query: (/** @type {{ campaignId: string, tenant_id: string, contacts: Array<{phone_number: string, name?: string, company?: string}> }} */ { campaignId, ...body }) => ({
        url: `/campaigns/${campaignId}/contacts/import`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Contact'],
    }),

    // GET /campaigns/{campaignId}/contacts?page=&size=
    listContacts: builder.query({
      query: (/** @type {{ campaignId: string, page?: number, size?: number }} */ { campaignId, page = 0, size = 50 }) =>
        `/campaigns/${campaignId}/contacts?page=${page}&size=${size}`,
      providesTags: ['Contact'],
    }),

    // GET /campaigns/{campaignId}/contacts/stats
    getContactStats: builder.query({
      query: (/** @type {string} */ campaignId) => `/campaigns/${campaignId}/contacts/stats`,
    }),

    // ═══════════════════════════════════════════════════════════
    // DNC — ContactController.java
    // ═══════════════════════════════════════════════════════════

    // POST /dnc
    addDnc: builder.mutation({
      query: (/** @type {{ tenant_id: string, phone_number: string, reason?: string, source?: string, expires_at?: string }} */ body) => ({
        url: '/dnc',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DNC'],
    }),

    // DELETE /dnc/{tenantId}/{phoneNumber}
    removeDnc: builder.mutation({
      query: (/** @type {{ tenantId: string, phoneNumber: string }} */ { tenantId, phoneNumber }) => ({
        url: `/dnc/${tenantId}/${phoneNumber}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['DNC'],
    }),

    // GET /dnc?tenant_id=&page=&size=
    listDnc: builder.query({
      query: (/** @type {{ tenant_id: string, page?: number, size?: number }} */ { tenant_id, page = 0, size = 50 }) =>
        `/dnc?tenant_id=${tenant_id}&page=${page}&size=${size}`,
      providesTags: ['DNC'],
    }),

    // ═══════════════════════════════════════════════════════════
    // QUEUE — QueueController.java
    // ═══════════════════════════════════════════════════════════

    // GET /queues?tenant_id=
    listQueues: builder.query({
      query: (/** @type {string} */ tenantId) => `/queues?tenant_id=${tenantId}`,
      providesTags: ['Queue'],
    }),

    // GET /queues/{id}
    getQueue: builder.query({
      query: (/** @type {string} */ id) => `/queues/${id}`,
      providesTags: ['Queue'],
    }),

    // GET /queues/{id}/stats
    getQueueStats: builder.query({
      query: (/** @type {string} */ id) => `/queues/${id}/stats`,
    }),

    // POST /queues
    createQueue: builder.mutation({
      query: (/** @type {{ tenant_id: string, subscription_id: string, name: string, strategy?: string, max_wait_seconds?: number, moh_file?: string, wrap_up_seconds?: number }} */ body) => ({
        url: '/queues',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Queue'],
    }),

    // GET /queues/{id}/members
    getQueueMembers: builder.query({
      query: (/** @type {string} */ id) => `/queues/${id}/members`,
    }),

    // POST /queues/{id}/members
    addQueueMember: builder.mutation({
      query: (/** @type {{ queueId: string, agent_id: string, priority?: number, penalty?: number }} */ { queueId, ...body }) => ({
        url: `/queues/${queueId}/members`,
        method: 'POST',
        body,
      }),
    }),

    // DELETE /queues/{queueId}/members/{agentId}
    removeQueueMember: builder.mutation({
      query: (/** @type {{ queueId: string, agentId: string }} */ { queueId, agentId }) => ({
        url: `/queues/${queueId}/members/${agentId}`,
        method: 'DELETE',
      }),
    }),

    // ═══════════════════════════════════════════════════════════
    // ROUTING — RoutingController.java
    // ═══════════════════════════════════════════════════════════

    // GET /routing/policies?tenant_id=
    listRoutingPolicies: builder.query({
      query: (/** @type {string} */ tenantId) => `/routing/policies?tenant_id=${tenantId}`,
      providesTags: ['Routing'],
    }),

    // POST /routing/policies
    createRoutingPolicy: builder.mutation({
      query: (/** @type {{ tenant_id: string, subscription_id: string, name: string, match_type?: string, match_value?: string, action_type: string, action_target?: string, priority?: number, time_condition?: object }} */ body) => ({
        url: '/routing/policies',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Routing'],
    }),

    // DELETE /routing/policies/{id}
    deleteRoutingPolicy: builder.mutation({
      query: (/** @type {string} */ id) => ({
        url: `/routing/policies/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Routing'],
    }),

    // GET /routing/ivr-flows?tenant_id=
    listIvrFlows: builder.query({
      query: (/** @type {string} */ tenantId) => `/routing/ivr-flows?tenant_id=${tenantId}`,
    }),

    // POST /routing/ivr-flows
    createIvrFlow: builder.mutation({
      query: (/** @type {{ tenant_id: string, subscription_id: string, name: string, flow_json: object }} */ body) => ({
        url: '/routing/ivr-flows',
        method: 'POST',
        body,
      }),
    }),

    // ═══════════════════════════════════════════════════════════
    // TRUNK — TrunkController.java
    // ═══════════════════════════════════════════════════════════

    // GET /trunks?tenant_id=
    listTrunks: builder.query({
      query: (/** @type {string} */ tenantId) => `/trunks?tenant_id=${tenantId}`,
      providesTags: ['Trunk'],
    }),

    // GET /trunks/{id}
    getTrunk: builder.query({
      query: (/** @type {string} */ id) => `/trunks/${id}`,
      providesTags: ['Trunk'],
    }),

    // POST /trunks
    createTrunk: builder.mutation({
      query: (/** @type {{ tenant_id: string, subscription_id: string, name: string, provider?: string, sip_server: string, sip_port?: number, transport?: string, auth_type?: string, auth_username?: string, auth_password?: string, max_concurrent?: number, outbound_caller_id?: string, codec_preference?: string }} */ body) => ({
        url: '/trunks',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Trunk'],
    }),

    // DELETE /trunks/{id}
    deleteTrunk: builder.mutation({
      query: (/** @type {string} */ id) => ({
        url: `/trunks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Trunk'],
    }),

    // ═══════════════════════════════════════════════════════════
    // TURN — TurnController.java
    // ═══════════════════════════════════════════════════════════

    // GET /turn/credentials/{tenantSlug}?tenant_id=&dedicated=
    getTurnCredentials: builder.query({
      query: (/** @type {{ tenantSlug: string, tenant_id: string, dedicated?: boolean }} */ { tenantSlug, tenant_id, dedicated = false }) =>
        `/turn/credentials/${tenantSlug}?tenant_id=${tenant_id}&dedicated=${dedicated}`,
    }),
  }),
});

export const {
  // Agent
  useGetMeQuery, useGetSipCredentialsQuery,
  useListAgentsQuery, useGetAgentQuery, useGetAvailableAgentsQuery,
  useCreateAgentMutation, useUpdateAgentMutation, useSetAgentStatusMutation, useDeleteAgentMutation,
  // Call
  useGetActiveCallsQuery, useOriginateCallMutation, useAnswerCallMutation,
  useHoldCallMutation, useTransferCallMutation, useHangupCallMutation,
  useSendDtmfMutation, useInterruptCallMutation,
  // Supervisor
  useListenCallMutation, useWhisperCallMutation, useBargeCallMutation,
  useGetSupervisorDashboardQuery, useGetAgentCallQuery,
  // Bot
  useListBotsQuery, useGetBotQuery, useCreateBotMutation, useUpdateBotMutation,
  useActivateBotMutation, useDisableBotMutation,
  useListBotEscalationQuery, useCreateBotEscalationMutation, useUpdateBotEscalationMutation, useDeleteBotEscalationMutation,
  useListBotKnowledgeQuery, useCreateBotKnowledgeMutation, useUpdateBotKnowledgeMutation, useDeleteBotKnowledgeMutation,
  // Campaign
  useListCampaignsQuery, useGetCampaignQuery, useCreateCampaignMutation,
  useStartCampaignMutation, usePauseCampaignMutation, useResumeCampaignMutation, useCancelCampaignMutation,
  // Contact
  useImportContactsMutation, useListContactsQuery, useGetContactStatsQuery,
  // DNC
  useAddDncMutation, useRemoveDncMutation, useListDncQuery,
  // Queue
  useListQueuesQuery, useGetQueueQuery, useGetQueueStatsQuery, useCreateQueueMutation,
  useGetQueueMembersQuery, useAddQueueMemberMutation, useRemoveQueueMemberMutation,
  // Routing
  useListRoutingPoliciesQuery, useCreateRoutingPolicyMutation, useDeleteRoutingPolicyMutation,
  useListIvrFlowsQuery, useCreateIvrFlowMutation,
  // Trunk
  useListTrunksQuery, useGetTrunkQuery, useCreateTrunkMutation, useDeleteTrunkMutation,
  // TURN
  useGetTurnCredentialsQuery,
} = pbxCoreApi;

export default pbxCoreApi;