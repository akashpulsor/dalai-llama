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
}
