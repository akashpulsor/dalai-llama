// shared/store/index.js
import { configureStore } from "@reduxjs/toolkit";
console.log("Testing configureStore:", configureStore);

import { api } from "./slices/apiSlice.js";
import { keycloakApi } from "../hooks/keycloakApi.js";
import authReducer from "./slices/authSlice.js";
import flashReducer from "./slices/flashSlice.js";

import pbxCoreApi from "./slices/pbxCoreApi.js";
import analyticsApi from "./slices/analyticsApi.js";

import tenantReducer from "./slices/tenantSlice.js";
import sipReducer from "./slices/sipSlice.js";
import botTestReducer from "./slices/botTestSlice.js";

import callReducer from "./slices/callSlice.js";
import liveCallsReducer from "./slices/liveCallsSlice.js";
import agentPresenceReducer from "./slices/agentPresenceSlice.js";
import billingReducer from "./slices/billingSlice.js";
import ivrReducer from "./slices/ivrSlice.js";

const isDashboardRuntime = (() => {
  if (typeof window === "undefined") return false;

  const { hostname, pathname, port } = window.location;
  return (
    port === "5177" ||
    hostname.startsWith("dashboard") ||
    hostname.startsWith("dash") ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/")
  );
})();

/**
 * @typedef {import("@reduxjs/toolkit").EnhancedStore} EnhancedStore
 */

/**
 * Create and configure the Redux store.
 * Used by all apps. The dashboard only needs the shared API/auth stack,
 * so we skip the large PBX/analytics RTK Query slices there.
 * @returns {EnhancedStore}
 */
export const createStore = () => {
  console.log("Attempting to call configureStore...");

  try {
    /** @type {Record<string, any>} */
    const reducers = {
      [api.reducerPath]: api.reducer,
      [keycloakApi.reducerPath]: keycloakApi.reducer,
      auth: authReducer,
      flash: flashReducer,
      tenant: tenantReducer,
      sip: sipReducer,
      botTest: botTestReducer,
      call: callReducer,
      liveCalls: liveCallsReducer,
      agentPresence: agentPresenceReducer,
      billing: billingReducer,
      ivr: ivrReducer,
    };

    if (!isDashboardRuntime) {
      reducers[pbxCoreApi.reducerPath] = pbxCoreApi.reducer;
      reducers[analyticsApi.reducerPath] = analyticsApi.reducer;
    }

    console.log("Store runtime profile:", isDashboardRuntime ? "dashboard-minimal" : "full");

    return configureStore({
      reducer: reducers,
      middleware: (getDefault) => {
        let middleware = getDefault()
          .concat(api.middleware)
          .concat(keycloakApi.middleware);

        if (!isDashboardRuntime) {
          middleware = middleware
            .concat(pbxCoreApi.middleware)
            .concat(analyticsApi.middleware);
        }

        return middleware;
      },
    });
  } catch (e) {
    console.error("configureStore FAILED:", e);
    throw e;
  }
};

/** @type {EnhancedStore} */
const store = createStore();
console.log("Store created successfully:", !!store);

export default store;

export * from "./slices/apiSlice.js";
export * from "./slices/authSlice.js";
export * from "./slices/flashSlice.js";

export {
  setTenantIdentity,
  setTenantConfig,
  selectApp,
  clearTenant,
  selectTenant,
  selectTenantId,
  selectProductCode,
  selectFeatures,
  selectFeature,
  selectIsResolved,
} from "./slices/tenantSlice.js";

export {
  setWallet,
  setInvoices,
  resetBilling,
} from "./slices/billingSlice.js";

export {
  setRegistrationState,
  setIncomingCall,
  clearIncomingCall,
  setActiveCall,
  setCallState,
  setMuted,
  callEnded,
  wrapUpComplete,
  resetSip,
  selectSipState,
  selectIsRegistered,
  selectActiveCall,
  selectIncomingCall,
  selectCallState,
} from "./slices/sipSlice.js";

export {
  startSession,
  endSession,
  addTranscript,
  addIntent,
  setSentiment,
  addEscalation,
  setPipelineStatus,
  setLatency,
  resetBotTest,
  selectBotTest,
} from "./slices/botTestSlice.js";

export {
  useGetMeQuery,
  useGetSipCredentialsQuery,
  useListAgentsQuery,
  useGetAgentQuery,
  useGetAvailableAgentsQuery,
  useCreateAgentMutation,
  useUpdateAgentMutation,
  useSetAgentStatusMutation,
  useDeleteAgentMutation,
  useGetActiveCallsQuery,
  useOriginateCallMutation,
  useAnswerCallMutation,
  useHoldCallMutation,
  useTransferCallMutation,
  useHangupCallMutation,
  useSendDtmfMutation,
  useInterruptCallMutation,
  useListenCallMutation,
  useWhisperCallMutation,
  useBargeCallMutation,
  useGetSupervisorDashboardQuery,
  useGetAgentCallQuery,
  useListBotsQuery,
  useGetBotQuery,
  useCreateBotMutation,
  useUpdateBotMutation,
  useActivateBotMutation,
  useDisableBotMutation,
  useListBotEscalationQuery,
  useCreateBotEscalationMutation,
  useUpdateBotEscalationMutation,
  useDeleteBotEscalationMutation,
  useListBotKnowledgeQuery,
  useCreateBotKnowledgeMutation,
  useUpdateBotKnowledgeMutation,
  useDeleteBotKnowledgeMutation,
  useListCampaignsQuery,
  useGetCampaignQuery,
  useCreateCampaignMutation,
  useStartCampaignMutation,
  usePauseCampaignMutation,
  useResumeCampaignMutation,
  useCancelCampaignMutation,
  useImportContactsMutation,
  useListContactsQuery,
  useGetContactStatsQuery,
  useAddDncMutation,
  useRemoveDncMutation,
  useListDncQuery,
  useListQueuesQuery,
  useGetQueueQuery,
  useGetQueueStatsQuery,
  useCreateQueueMutation,
  useGetQueueMembersQuery,
  useAddQueueMemberMutation,
  useRemoveQueueMemberMutation,
  useListRoutingPoliciesQuery,
  useCreateRoutingPolicyMutation,
  useDeleteRoutingPolicyMutation,
  useListIvrFlowsQuery,
  useCreateIvrFlowMutation,
  useListTrunksQuery,
  useGetTrunkQuery,
  useCreateTrunkMutation,
  useDeleteTrunkMutation,
  useGetTurnCredentialsQuery,
} from "./slices/pbxCoreApi.js";

export {
  useGetOverviewQuery,
  useGetCustomerAnalyticsQuery,
  useGetBotAnalyticsQuery,
  useGetAgentAnalyticsQuery,
} from "./slices/analyticsApi.js";

export { default as pbxCoreApi } from "./slices/pbxCoreApi.js";
export { default as analyticsApi } from "./slices/analyticsApi.js";
