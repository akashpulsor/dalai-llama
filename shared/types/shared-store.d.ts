declare module "@dalaillama/shared-store" {
  import type {
    EnhancedStore,
    AnyAction,
    ThunkDispatch,
  } from "@reduxjs/toolkit";

  /* -----------------------------------------------------------------------
   * EXISTING EXPORTS
   * ---------------------------------------------------------------------*/
  const store: EnhancedStore<any>;
  export default store;

  export function createStore(): EnhancedStore<any>;
  export const setUser: (payload: { user: any; token: string }) => AnyAction;
  export const logout: () => AnyAction;
  export const validateToken: () => AnyAction;

  export const login: (payload: string) => AnyAction;
  /* -----------------------------------------------------------------------
   * RTK QUERY API DECLARATIONS
   * ---------------------------------------------------------------------*/

  /** RTK Query mutation endpoint */
  export interface MutationEndpoint {
    /** MUST BE ANY so unwrap() works */
    initiate: (arg?: any) => any;
  }

  /** RTK Query query endpoint (simple) */
  export interface QueryEndpoint {
    initiate: (arg?: any) => any;
  }

  export interface ApiEndpoints {
    /* Generic queries */
    getHealth: QueryEndpoint;
    getTenants: QueryEndpoint;
    getAgents: QueryEndpoint;
    getWalletBalance: QueryEndpoint;
    getLiveCall: QueryEndpoint;

    /* ---------------- CALL CONTROL ENDPOINTS ---------------- */
    originateCall: MutationEndpoint;
    acceptCall: MutationEndpoint;
    hangupCall: MutationEndpoint;
  
    partnerRegister: MutationEndpoint;
    partnerGetCloudProviders: QueryEndpoint;
    partnerSetupMTLS: MutationEndpoint;
    partnerCreateWorkerNode: MutationEndpoint;
    partnerJoinWorkerNode: MutationEndpoint;

    tetenantRegister: MutationEndpoint;
    tenantVerify: MutationEndpoint;
    tenantPhonePurchase: MutationEndpoint;
    tenantPhonePort: MutationEndpoint;
    tenantPlanSelection: MutationEndpoint;
    tenantComplianceUpload: MutationEndpoint;
    tenantBillingAddCard: MutationEndpoint;
    tenantToggleWallet: MutationEndpoint;

    tenantAssignDID: MutationEndpoint;
    tenantUnassignDID: MutationEndpoint;
    tenantAssignNumber: MutationEndpoint;
    tenantUnassignNumber: MutationEndpoint;

    tenantConfigureTrunk: MutationEndpoint;
    tenantEnableAI: MutationEndpoint;
    tenantGetSummary: QueryEndpoint;
    
    getInvoices: QueryEndpoint;

    getPlans: QueryEndpoint;

    getDashboardStats: QueryEndpoint;

    saveDisposition: MutationEndpoint;

    getDidInventory: QueryEndpoint;
    addPlans: MutationEndpoint;
    uploadDidInventory: MutationEndpoint;

    getTenantsList: QueryEndpoint;
    getTenantAnalytics: QueryEndpoint;

    updateTenant: MutationEndpoint;

    deleteTenant: MutationEndpoint;

    getCloudProviders: QueryEndpoint;

    getCloudConnections: QueryEndpoint;

    createCloudConnection: MutationEndpoint;

    generateTLSCertificate: MutationEndpoint;

    getTrunksList: QueryEndpoint;

    createTrunk: MutationEndpoint;

    updateTrunk: MutationEndpoint;

    deleteTrunk: MutationEndpoint;

    getMonthlyBilling: QueryEndpoint;
    getLicenses: QueryEndpoint;
    getComplianceDocuments: QueryEndpoint;

    uploadComplianceDocument: MutationEndpoint;

    getBrandingSettings: QueryEndpoint;
    updateBrandingSettings: MutationEndpoint;
  

    getKeycloakConfig: QueryEndpoint;
    

    addAgentMutation:  MutationEndpoint;
    addQueueMutation: MutationEndpoint;
    buyDidMutation: MutationEndpoint;
    createBotMutation: MutationEndpoint;
    saveDidMutation: MutationEndpoint;
    saveSipMutation: MutationEndpoint;
    publishIvrMutation: MutationEndpoint;

    updateAgentMutation: MutationEndpoint;
    disableAgentMutation: MutationEndpoint;
    updateQueue: MutationEndpoint;
    getQueues: QueryEndpoint;

    addRoutingRuleMutation: MutationEndpoint;
    updateRoutingRuleMutation: MutationEndpoint;
  
    getBotsQuery: QueryEndpoint;
    getIvrsQuery: QueryEndpoint;

    getRoutingRulesQuery: QueryEndpoint;
    deleteRoutingRuleMutation: QueryEndpoint;

    getIVRQuery: QueryEndpoint;
    saveIVRDraftMutation: MutationEndpoint;

    publishIVRMutation: MutationEndpoint;

    getIVRVersionsQuery: QueryEndpoint;

    getRecordingPoliciesQuery: QueryEndpoint;
    updateGlobalPoliciesMutation: MutationEndpoint;
    getQueueOverridesQuery: QueryEndpoint;
    updateQueueOverrideMutation: MutationEndpoint;
    deleteQueueOverrideMutation: MutationEndpoint;
    

    getBillingSummaryQuery: QueryEndpoint;
    getPaymentMethodsQuery: QueryEndpoint;
    addPaymentMethodMutation: MutationEndpoint;
    updateAutoDebitMutation: MutationEndpoint;
    downloadInvoiceMutation: MutationEndpoint;

    getSubscriptionQuery: QueryEndpoint;
    purchaseAddonMutation: MutationEndpoint;

    getAuditLogsQuery: QueryEndpoint;
    /* Allow any additional endpoints RTK may generate */
    [key: string]: any;
  }

  /** Full API object */
  export const api: {
    endpoints: ApiEndpoints;
  };

    /* -----------------------------------------------------------------------
   * RTK Query Auto-Generated Hooks
   * ---------------------------------------------------------------------*/

  export const useGetTenantsQuery: any;
  export const useGetTenantsListQuery: any;
  export const useGetTenantAnalyticsQuery: any;

  export const useGetAgentsQuery: any;
  export const useGetWalletBalanceQuery: any;
  export const useGetLiveCallQuery: any;

  export const usePartnerRegisterMutation: any;
  export const usePartnerGetCloudProvidersQuery: any;
  export const usePartnerSetupMTLSMutation: any;
  export const usePartnerCreateWorkerNodeMutation: any;
  export const usePartnerJoinWorkerNodeMutation: any;

  export const useTenantRegisterMutation: any;
  export const useTenantVerifyMutation: any;
  export const useTenantPhonePurchaseMutation: any;
  export const useTenantPhonePortMutation: any;
  export const useTenantPlanSelectionMutation: any;
  export const useTenantComplianceUploadMutation: any;

  export const useTenantBillingAddCardMutation: any;
  export const useTenantToggleWalletMutation: any;

  export const useTenantAssignDIDMutation: any;
  export const useTenantUnAssignDIDMutation: any;

  export const useTenantAssignNumberMutation: any;
  export const useTenantUnAssignNumberMutation: any;

  export const useTenantConfigureTrunkMutation: any;
  export const useTenantEnableAIMutation: any;
  export const useTenantGetSummaryQuery: any;

  export const useOriginateCallMutation: any;
  export const useAcceptCallMutation: any;
  export const useHangupCallMutation: any;
  export const useSaveDispositionMutation: any;

  export const useGetDidInventoryQuery: any;
  export const useUploadDidInventoryMutation: any;

  export const useGetCloudProvidersQuery: any;
  export const useGetCloudConnectionsQuery: any;
  export const useCreateCloudConnectionMutation: any;
  export const useGenerateTLSCertificateMutation: any;

  export const useGetTrunksListQuery: any;
  export const useCreateTrunkMutation: any;
  export const useUpdateTrunkMutation: any;
  export const useDeleteTrunkMutation: any;

  export const useGetMonthlyBillingQuery: any;
  export const useGetLicensesQuery: any;

  export const useGetComplianceDocumentsQuery: any;
  export const useUploadComplianceDocumentMutation: any;

  export const useGetBrandingSettingsQuery: any;
  export const useUpdateBrandingSettingsMutation: any;

  export const useGetInvoicesQuery: any;
  export const useGetDashboardStatsQuery: any;

  export const useGetPlansQuery:any;
  export const useAddPlansMutation:any;

  export const useGetKeycloakConfigQuery: any;

  export const useAddAgentMutation: any;
  export const useAddQueueMutation: any;
  export const useBuyDidMutation: any;
  export const useCreateBotMutation: any;
  export const useSaveDidMutation: any;
  export const useSaveSipMutation: any;
  export const usePublishIvrMutation: any;

  export const   useUpdateAgentMutation: any;
  export const   useDisableAgentMutation: any;

  export const   useUpdateQueueMutation: any;

  export const useGetQueuesQuery: any;
  export const useAddRoutingRuleMutation: any;
  export const useUpdateRoutingRuleMutation: any;
  export const useGetQueuesQuery: any;
  export const useGetBotsQuery: any;
  export const useGetIvrsQuery: any;

  export const   useGetRoutingRulesQuery: any;
  export const   useDeleteRoutingRuleMutation: any;

  export const   useGetIVRQuery: any;
  export const   useSaveIVRDraftMutation: any;
  export const   usePublishIVRMutation: any;
  export const   useGetIVRVersionsQuery: any;

  export const   useGetRecordingPoliciesQuery: any;
  export const   useUpdateGlobalPoliciesMutation: any;
  export const   useGetQueueOverridesQuery: any;
  export const   useUpdateQueueOverrideMutation: any;
  export const   useDeleteQueueOverrideMutation: any;

  export const   useGetCompliancePoliciesQuery: any;
  export const   useUpdateCompliancePoliciesMutation: any;
  export const   useUploadDNCListMutation: any;
  export const   useAddDNCNumberMutation: any;
  export const   useGetDNCListQuery: any;
  export const   useDeleteDNCNumberMutation: any;

  export const   useGetBillingSummaryQuery: any;
  export const   useGetPaymentMethodsQuery: any;
  export const   useAddPaymentMethodMutation: any;
  export const   useUpdateAutoDebitMutation: any;
  export const   useDownloadInvoiceMutation: any;

  export const   useGetSubscriptionQuery: any;
  export const   usePurchaseAddonMutation: any;

  export const useGetAuditLogsQuery: any;
}
