// shared/store/slices/apiSlice.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { appConfig } from "@dalaillama/shared-config";
import {
  clearAuthState,
  redirectToKeycloakLogin,
  getAccessToken,
  isTokenExpired,
  keycloakApi,
} from "../../hooks/keycloakApi.js";
import { logout } from "./authSlice.js";
import { showFlash } from "./flashSlice.js";
import { prometheusClient } from "@dalaillama/shared-utils";

/* -------------------------------------------------------------------------- */
/*                               TYPE HELPERS                                 */
/* -------------------------------------------------------------------------- */

/**
 * @typedef {{ status: number, message: string }} NormalizedError
 */

/**
 * Normalize fetchBaseQuery or mock errors into our unified format.
 * @param {any} err
 * @returns {NormalizedError}
 */
const normalizeError = (err) => {
  if (!err) {
    return { status: 0, message: "Unknown error" };
  }

  if (typeof err.status === "number" && err.message) {
    return { status: err.status, message: err.message };
  }

  if (err.status === "FETCH_ERROR") {
    return { status: 0, message: err.error || "Network error" };
  }

  if (typeof err.status === "number") {
    return {
      status: err.status,
      message:
        typeof err.data === "string"
          ? err.data
          : JSON.stringify(err.data || {}),
    };
  }

  return { status: 0, message: "Unhandled error" };
};

/* -------------------------------------------------------------------------- */
/*                               MOCK RESPONSES                               */
/* -------------------------------------------------------------------------- */

/** @type {Record<string, any>} */
const MOCK_RESPONSES = {
  "/health": { status: "ok", env: "mock", ts: Date.now() },
    /* ---------------- Partner Onboarding ---------------- */
  "/partner/register": { partnerId: "partner-123", status: "registered" },
  "/partner/cloud/providers": ["aws", "azure", "gcp", "on-prem"],
  "/partner/cloud/mtls/setup": { status: "mtls-ready" },
  "/partner/cloud/node/create": { nodeId: "fake-node-1", status: "created" },
  "/partner/cloud/node/join": { status: "joined", nodes: ["fake-node-1"] },

  /* ---------------- Tenant Onboarding ---------------- */
  "/tenant/register": { tenantId: "tenant-xyz", status: "created" },
  "/tenant/verify": { ok: true },
  "/tenant/phone/purchase": { did: "+15550001111", status: "assigned" },
  "/tenant/phone/port": { portId: "port-abc", status: "submitted" },
  "/tenant/plan/select": { status: "plan-set" },
  "/tenant/compliance/upload": { status: "approved" },
  "/tenant/billing/card/add": { cardId: "card_mock_001", status: "added" },
  "/tenant/billing/wallet/toggle": { enabled: true },
  "/tenant/did/assign": { status: "assigned" },
  "/tenant/trunk/configure": { status: "success" },
  "/tenant/ai/enable": { enabled: true },
  "/tenant/summary": { onboarding: "completed" },


  "/tenants": [
    { id: "t001", name: "Acme Corp", plan: "shared" },
    { id: "t002", name: "Globex Corp", plan: "single" },
  ],

  "/agents": [
    { id: "a01", name: "John", status: "online" },
    { id: "a02", name: "Priya", status: "offline" },
  ],

  "/wallet/balance": { balance: 1200.75, currency: "INR", lastUpdated: Date.now() },
  "/wallet/add-balance": { success: true, balance: 0, currency: "INR", transactionId: "txn_mock_001" },
  "/tenants/me": {
    hasTenant: false,
    needsOnboarding: true,
    isActive: false,
    tenantId: null,
    slug: null,
    name: null,
    dashboardUrl: null,
    status: null,
    statusMessage: null,
    keycloakRealmName: null,
  },

  "/calls/live": {
    id: "call-xyz",
    from: "+15551234567",
    to: "Agent 01",
    status: "connected",
    sentiment: "neutral",
  },
   // added for dashboard/billing mocks so calls to those endpoints succeed in MOCK_MODE
  "/billing/invoices": [
    { id: "inv1", amount: 500, due: "2025-01-01" },
    { id: "inv2", amount: 1200, due: "2025-01-15" },
  ],

  "/dashboard/stats": {
    callsToday: 42,
    avgHandleTimeMs: 312000,
    sentimentScore: 0.78,
  },
  "/products": [
    {
      id: "product-ai-contact-center",
      code: "AI_CC",
      name: "AI Contact Center",
      description: "Voice support automation with AI agents, live supervision, and omnichannel routing.",
      type: "AI_CONTACT_CENTER",
      active: true,
    },
    {
      id: "product-conversational-ivr",
      code: "CONV_IVR",
      name: "Conversational IVR",
      description: "Natural language IVR flows for call deflection, self-service, and smart routing.",
      type: "CONVERSATIONAL_IVR",
      active: true,
    },
    {
      id: "product-basic-pbx",
      code: "BASIC_PBX",
      name: "Basic PBX",
      description: "Cloud PBX calling, extensions, queues, and phone number management.",
      type: "BASIC_PBX",
      active: true,
    },
    {
      id: "product-outbound-dialer",
      code: "OUTBOUND_DIALER",
      name: "Outbound Dialer",
      description: "Campaign calling with agent assignment, queue controls, and performance tracking.",
      type: "OUTBOUND_DIALER",
      active: true,
    },
    {
      id: "product-virtual-receptionist",
      code: "VIRTUAL_RECEPTIONIST",
      name: "Virtual Receptionist",
      description: "Automated call answering, appointment routing, and front-office workflows.",
      type: "VIRTUAL_RECEPTIONIST",
      active: true,
    },
  ],
  /* ---------------- DID INVENTORY ---------------- */
"/did/inventory": [
  {
    did: "+15550001111",
    country: "US",
    countryCode: "+1",
    type: "mobile",
    provider: "twilio",
    status: "available"
  },
  {
    did: "+918888888888",
    country: "India",
    countryCode: "+91",
    type: "mobile",
    provider: "airtel",
    status: "available"
  },
  {
    did: "+442033001122",
    country: "UK",
    countryCode: "+44",
    type: "fixed",
    provider: "bt",
    status: "assigned",
    tenantId: "t001"
  }
],

"/did/inventory/upload": {
  status: "uploaded",
  inserted: 5,
  failed: 1
},
/* ---------------- MANAGE TENANTS ---------------- */
"/tenants/list": [
  {
    id: "t001",
    name: "Acme Corp",
    plan: "shared",
    status: "active",
    createdAt: "2024-11-15",
    region: "us-east-1"
  },
  {
    id: "t002",
    name: "Globex Corp",
    plan: "single",
    status: "active",
    createdAt: "2024-10-22",
    region: "eu-west-1"
  },
  {
    id: "t003",
    name: "Initech LLC",
    plan: "shared",
    status: "suspended",
    createdAt: "2024-09-10",
    region: "ap-south-1"
  }
],
"/tenants/analytics": {
  totalCalls: 15240,
  recurringPayment: 2500.00,
  walletBalance: 1200.75,
  didsConfigured: 12,
  trunksConfigured: 4,
  region: "us-east-1",
  botsConfigured: 3,
  ivrCalls: 8420,
  callsToday: 342,
  avgCallDuration: 245,
  sentimentScore: 0.82
},

/* ---------------- CLOUD CONNECTIONS ---------------- */
"/cloud/providers": [
  { id: "aws", name: "Amazon AWS", logo: "☁️" },
  { id: "azure", name: "Microsoft Azure", logo: "🔷" },
  { id: "gcp", name: "Google Cloud", logo: "🌐" },
  { id: "onprem", name: "On-Premise", logo: "🏢" }
],

"/cloud/connections": [
  {
    id: "conn-001",
    provider: "aws",
    region: "us-east-1",
    nodeId: "master-node-1",
    status: "connected",
    tlsCert: "cert-abc-123",
    createdAt: "2024-12-01"
  },
  {
    id: "conn-002",
    provider: "azure",
    region: "eu-west-1",
    nodeId: "master-node-2",
    status: "connected",
    tlsCert: "cert-xyz-456",
    createdAt: "2024-11-28"
  }
],

"/cloud/connection/create": {
  status: "success",
  connectionId: "conn-003",
  message: "Successfully connected to master node"
},

"/cloud/tls/generate": {
  certificate: "-----BEGIN CERTIFICATE-----\nMIIC...",
  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIE...",
  expiresAt: "2025-12-09"
},

/* ---------------- TRUNKS ---------------- */
"/trunks/list": [
  {
    id: "trunk-001",
    name: "Primary SIP Trunk",
    provider: "twilio",
    status: "active",
    capacity: 100,
    inUse: 23,
    region: "us-east-1"
  },
  {
    id: "trunk-002",
    name: "EU Backup Trunk",
    provider: "bandwidth",
    status: "active",
    capacity: 50,
    inUse: 12,
    region: "eu-west-1"
  },
  {
    id: "trunk-003",
    name: "APAC Trunk",
    provider: "vonage",
    status: "inactive",
    capacity: 75,
    inUse: 0,
    region: "ap-south-1"
  }
],

"/trunks/create": {
  status: "success",
  trunkId: "trunk-004",
  message: "Trunk created successfully"
},

/* ---------------- BILLING & LICENSE ---------------- */
"/billing/monthly": [
  {
    month: "2024-12",
    totalAmount: 4250.00,
    callMinutes: 125000,
    aiInference: 320000,
    storageGB: 450,
    status: "current"
  },
  {
    month: "2024-11",
    totalAmount: 3980.00,
    callMinutes: 118000,
    aiInference: 295000,
    storageGB: 420,
    status: "paid"
  },
  {
    month: "2024-10",
    totalAmount: 4100.00,
    callMinutes: 120000,
    aiInference: 310000,
    storageGB: 435,
    status: "paid"
  }
],

"/billing/licenses": [
  {
    id: "lic-001",
    product: "AI Contact Center - Enterprise",
    seats: 100,
    pricePerSeat: 25.00,
    totalMonthly: 2500.00,
    renewalDate: "2025-01-15",
    status: "active"
  },
  {
    id: "lic-002",
    product: "Advanced Analytics Module",
    seats: 1,
    pricePerSeat: 500.00,
    totalMonthly: 500.00,
    renewalDate: "2025-01-15",
    status: "active"
  }
],

/* ---------------- COMPLIANCE ---------------- */
"/compliance/documents": [
  {
    id: "doc-001",
    type: "kyc",
    fileName: "business_registration.pdf",
    uploadedAt: "2024-11-20",
    status: "approved",
    expiresAt: "2026-11-20"
  },
  {
    id: "doc-002",
    type: "osp_license",
    fileName: "osp_certificate.pdf",
    uploadedAt: "2024-11-22",
    status: "approved",
    expiresAt: "2025-11-22"
  },
  {
    id: "doc-003",
    type: "tax_id",
    fileName: "tax_documents.pdf",
    uploadedAt: "2024-11-18",
    status: "pending",
    expiresAt: null
  }
],

"/compliance/upload": {
  status: "success",
  documentId: "doc-004",
  message: "Document uploaded for review"
},

/* ---------------- DOMAIN & BRANDING ---------------- */
"/branding/settings": {
  domain: "acmecorp.dalaillama.io",
  customDomain: "contact.acmecorp.com",
  logo: "https://example.com/logo.png",
  primaryColor: "#6B46C1",
  secondaryColor: "#9F7AEA",
  companyName: "Acme Corporation",
  supportEmail: "support@acmecorp.com",
  customCss: "/* Custom styles */"
},

"/branding/update": {
  status: "success",
  message: "Branding updated successfully"
},
"/auth/keycloak-config": {
  keycloakUrl: "https://mock-kc.dalaillama.in",
  realm: "mock-realm",
  clientId: "mock-client",

  // ⭐ NEW → Branding fields
  brandName: "Demo Contact Center",
  brandLogo: "https://via.placeholder.com/200x60?text=Demo+Logo"
}

};

/* -------------------------------------------------------------------------- */
/*                               MOCK BASE QUERY                               */
/* -------------------------------------------------------------------------- */

/**
 * @type {import("@reduxjs/toolkit/query").BaseQueryFn}
 */
const mockBaseQuery = async (args) => {
  const endpoint =
    typeof args === "string" ? args : args.url ? args.url : "";

  await new Promise((r) => setTimeout(r, 250));

  /** @type {string} */
  const key = String(endpoint);  // ✅ Fix: ensure string key

  if (Object.prototype.hasOwnProperty.call(MOCK_RESPONSES, key)) {
    return { data: MOCK_RESPONSES[key] };   // ✅ TS safe
  }

  return {
    error: { status: 404, message: `Mock endpoint not found: ${key}` },
  };
};

/* -------------------------------------------------------------------------- */
/*                               REAL BASE QUERY                               */
/* -------------------------------------------------------------------------- */

const realBaseQuery = fetchBaseQuery({
  baseUrl: appConfig.API_BASE_URL,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("auth_token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

let isAuthRedirectInFlight = false;
/** @type {Promise<any> | null} */
let refreshTokenPromise = null;

/**
 * Refresh access token once and fan out concurrent callers to the same promise.
 * @param {import("@reduxjs/toolkit/query").BaseQueryApi} api
 * @returns {Promise<any>}
 */
const refreshAuthToken = async (api) => {
  if (!refreshTokenPromise) {
    const refreshRequest = api.dispatch(
      keycloakApi.endpoints.refreshToken.initiate(undefined)
    );

    refreshTokenPromise = refreshRequest
      .unwrap()
      .finally(() => {
        refreshTokenPromise = null;
        refreshRequest.reset();
      });
  }

  return refreshTokenPromise;
};

/* -------------------------------------------------------------------------- */
/*                        WRAPPED BASE QUERY (FINAL)                          */
/* -------------------------------------------------------------------------- */

/**
 * @type {import("@reduxjs/toolkit/query").BaseQueryFn}
 */
const baseQueryWithMetrics = async (args, api, extra) => {
  const start = performance.now();

  const queryFn = appConfig.MOCK_MODE ? mockBaseQuery : realBaseQuery;

  if (!appConfig.MOCK_MODE) {
    const token = getAccessToken();
    if (token && isTokenExpired(token)) {
      try {
        await refreshAuthToken(api);
      } catch {
        // Let the request proceed so the standard 401 redirect path handles it.
      }
    }
  }

  let rawResult = await queryFn(args, api, extra);

  const latency = performance.now() - start;


  if (rawResult.data !== undefined) {
    return { data: rawResult.data };
  }

  const error = normalizeError(rawResult.error);
  let status = error.status;

  if (!appConfig.MOCK_MODE && status === 401 && getAccessToken()) {
    try {
      await refreshAuthToken(api);
      rawResult = await queryFn(args, api, extra);

      if (rawResult.data !== undefined) {
        return { data: rawResult.data };
      }

      status = normalizeError(rawResult.error).status;
    } catch {
      // Fall through to the existing logout + redirect behavior.
    }
  }

  if (!appConfig.MOCK_MODE) {
    if (status === 401) {
      clearAuthState();
      api.dispatch(logout());
      api.dispatch(
        showFlash({ message: "Session expired.", type: "error" })
      );

      if (
        typeof window !== "undefined" &&
        !isAuthRedirectInFlight &&
        !window.location.pathname.includes("/auth/callback")
      ) {
        isAuthRedirectInFlight = true;
        void redirectToKeycloakLogin().catch(() => {
          isAuthRedirectInFlight = false;
        });
      }
    } else if (status === 403) {
      // Istio returns 403 "RBAC: access denied" when JWT is missing/invalid.
      // Treat as auth failure — clear state and redirect to login.
      clearAuthState();
      api.dispatch(logout());
      api.dispatch(
        showFlash({ message: "Session expired. Redirecting to login…", type: "error" })
      );

      if (
        typeof window !== "undefined" &&
        !isAuthRedirectInFlight &&
        !window.location.pathname.includes("/auth/callback")
      ) {
        isAuthRedirectInFlight = true;
        void redirectToKeycloakLogin().catch(() => {
          isAuthRedirectInFlight = false;
        });
      }
    }
  }

  if (status >= 500) {
    api.dispatch(showFlash({ message: "Server error", type: "error" }));
  }

  return { error };
};

/**
 * Backend responses can include Jackson default-typing wrappers:
 *   ["com.example.Dto", { ... }]
 *   ["java.util.ImmutableCollections$ListN", [["com.example.Dto", { ... }]]]
 * Normalize those into plain JSON for UI consumers.
 * @param {any} value
 * @returns {any}
 */
const unwrapJavaTypedJson = (value) => {
  if (Array.isArray(value)) {
    if (
      value.length === 2 &&
      typeof value[0] === "string" &&
      (value[0].startsWith("java.") || value[0].startsWith("com."))
    ) {
      return unwrapJavaTypedJson(value[1]);
    }

    return value.map(unwrapJavaTypedJson);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        unwrapJavaTypedJson(nestedValue),
      ])
    );
  }

  return value;
};

/* -------------------------------------------------------------------------- */
/*                              API SLICE                                      */
/* -------------------------------------------------------------------------- */

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithMetrics,

  endpoints: (builder) => ({

    getHealth: builder.query({ query: () => "/health" }),

    /* ---------------- PARTNER ONBOARDING ---------------- */
    partnerRegister: builder.mutation({
      query: () => ({ url: "/partner/register", method: "POST" })
    }),
    partnerGetCloudProviders: builder.query({
      query: () => "/partner/cloud/providers"
    }),
    partnerSetupMTLS: builder.mutation({
      query: () => ({ url: "/partner/cloud/mtls/setup", method: "POST" })
    }),
    partnerCreateWorkerNode: builder.mutation({
      query: (body) => ({ url: "/partner/cloud/node/create", method: "POST", body })
    }),
    partnerJoinWorkerNode: builder.mutation({
      query: () => ({ url: "/partner/cloud/node/join", method: "POST" })
    }),
    /* ---------------- TENANT ONBOARDING ---------------- */
    tenantRegister: builder.mutation({
      query: (body) => ({ url: "/tenants", method: "POST", body })
    }),
    tenantVerify: builder.mutation({
      query: (body) => ({ url: "/tenant/verify", method: "POST", body })
    }),
    tenantPhonePurchase: builder.mutation({
      query: () => ({ url: "/tenant/phone/purchase", method: "POST" })
    }),
    tenantPhonePort: builder.mutation({
      query: (body) => ({ url: "/tenant/phone/port", method: "POST", body })
    }),
    tenantPlanSelection: builder.mutation({
      query: (body) => ({ url: "/tenant/plan/select", method: "POST", body })
    }),
       tenantComplianceUpload: builder.mutation({
      query: (body) => ({ url: "/tenant/compliance/upload", method: "POST", body })
    }),
    tenantBillingAddCard: builder.mutation({
      query: (body) => ({ url: "/tenant/billing/card/add", method: "POST", body })
    }),
    tenantToggleWallet: builder.mutation({
      query: () => ({ url: "/tenant/billing/wallet/toggle", method: "POST" })
    }),
    tenantAssignDID: builder.mutation({
      query: (body) => ({ url: "/tenant/did/assign", method: "POST", body })
    }),
    tenantUnAssignDID: builder.mutation({
      query: (body) => ({ url: "/tenant/did/unassign", method: "POST", body })
    }),
    tenantAssignNumber: builder.mutation({
      query: (body) => ({ url: "/tenant/number/assign", method: "POST", body })
    }),
    tenantUnAssignNumber: builder.mutation({
      query: (body) => ({ url: "/tenant/number/unassign", method: "POST", body })
    }),
    tenantConfigureTrunk: builder.mutation({
      query: (body) => ({ url: "/tenant/trunk/configure", method: "POST", body })
    }),
    tenantEnableAI: builder.mutation({
      query: () => ({ url: "/tenant/ai/enable", method: "POST" })
    }),
    tenantGetSummary: builder.query({
      query: () => "/tenant/summary"
    }),
    getMyTenant: builder.query({
      async queryFn(_arg, api, extraOptions) {
        const query = appConfig.MOCK_MODE ? mockBaseQuery : realBaseQuery;
        const result = await query({ url: "/tenants/me" }, api, extraOptions);

        if (result.data !== undefined) {
          return { data: unwrapJavaTypedJson(result.data) };
        }

        const error = normalizeError(result.error);
        if (error.status === 403) {
          console.warn("[dashboard] /tenants/me returned 403. Falling back to existing tenant heuristics.");
          return { data: null };
        }

        return { error };
      },
    }),

    getTenants: builder.query({ query: () => "/tenants" }),
    getAgents: builder.query({
      /** @param {void} _ */
      query: (_) => "/agents",
    }),
    getWalletBalance: builder.query({
      /**
       * @param {string | void} tenantId
       */
      query: (tenantId) =>
        tenantId ? `/billing/${tenantId}/wallet` : "/wallet/balance",
    }),
    addWalletBalance: builder.mutation({
      query: (body) => {
        const { tenantId, ...payload } = body || {};
        return {
          url: tenantId ? `/billing/${tenantId}/wallet/recharge` : "/wallet/add-balance",
          method: "POST",
          body: payload,
        };
      }
    }),

    getLiveCall: builder.query({
      /** @param {void} _ */
      query: (_) => "/calls/live",
    }),

     /* ---------------------- Billing + Dashboard ---------------------- */

    getInvoices: builder.query({
      /** @param {void} _ */
      query: (_) => "/billing/invoices",
    }),


    getDashboardStats: builder.query({
      /** @param {void} _ */
      query: (_) => "/dashboard/stats",
    }),

    /* ------------------------------------------------------------------ */
    /*                        CALL CONTROL ENDPOINTS                      */
    /* ------------------------------------------------------------------ */

    // originateCall HAS an argument → keep unchanged
    originateCall: builder.mutation({
      query: (/** @type {{to: string}} */ body) => ({
        url: "/calls/originate",
        method: "POST",
        body,
      }),
    }),

    /**
     * acceptCall needs NO args → force arg type = void
     * @type {import("@reduxjs/toolkit/query").MutationDefinition<void, any, any, any>}
     */
    acceptCall: builder.mutation({
      query: () => ({
        url: "/calls/accept",
        method: "POST",
      }),
    }),

    /**
     * hangupCall needs NO args → force arg type = void
     * @type {import("@reduxjs/toolkit/query").MutationDefinition<void, any, any, any>}
     */
    hangupCall: builder.mutation({
      query: () => ({
        url: "/calls/hangup",
        method: "POST",
      }),
    }),
    
    /* ---------------- DIDs (Search Available) ---------------- */

    /**
     * @typedef {Object} SearchAvailableDidsArgs
     * @property {string} country
     * @property {string} [city]
     * @property {string} [prefix]
     * @property {string} [type]
     * @property {number} [limit]
     * @property {number} [page]
     * @property {number} [size]
     * @property {string} [sortField]
     * @property {string} [sortOrder]
     */

    searchAvailableDids: builder.query({
      /**
       * @param {SearchAvailableDidsArgs} args
       */
      query: ({
        country,
        city,
        prefix,
        type,
        limit = 10,
        page = 0,
        size = 20,
        sortField = "monthlyFee",
        sortOrder = "asc",
      }) => ({
        url: `/did/available`,
        params: {
          country,
          city,
          prefix,
          type,
          limit,
          page,
          size,
          sort: `${sortField},${sortOrder}`, // important format
        },
      }),
    }),

        /* ---------------- DID INVENTORY ---------------- */

    getDidInventory: builder.query({
      query: () => "/did/inventory"
    }),

    uploadDidInventory: builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/did/inventory/upload",
        method: "POST",
        body
      })
    }),
    
    /* ---------------- MANAGE TENANTS ---------------- */
    getTenantsList: builder.query({
      query: () => "/tenants/list"
    }),
   getTenantAnalytics: builder.query({
      query: (tenantId) => `/tenants/analytics?tenantId=${tenantId}`
    }),

    updateTenant: builder.mutation({
      query: (body) => ({
        url: "/tenants/update",
        method: "PUT",
        body
      })
    }),
       deleteTenant: builder.mutation({
      query: (tenantId) => ({
        url: `/tenants/delete/${tenantId}`,
        method: "DELETE"
      })
    }),

    /* ---------------- CLOUD CONNECTIONS ---------------- */
    getCloudProviders: builder.query({
      query: () => "/cloud/providers"
    }),

    getCloudConnections: builder.query({
      query: () => "/cloud/connections"
    }),
   createCloudConnection: builder.mutation({
      query: (body) => ({
        url: "/cloud/connection/create",
        method: "POST",
        body
      })
    }),

    generateTLSCertificate: builder.mutation({
      query: () => ({
        url: "/cloud/tls/generate",
        method: "POST"
      })
    }),

    /* ---------------- TRUNKS ---------------- */
    getTrunksList: builder.query({
      query: () => "/trunks/list"
    }),
    createTrunk: builder.mutation({
      query: (body) => ({
        url: "/trunks/create",
        method: "POST",
        body
      })
    }),

    updateTrunk: builder.mutation({
      query: (body) => ({
        url: "/trunks/update",
        method: "PUT",
        body
      })
    }),
       deleteTrunk: builder.mutation({
      query: (trunkId) => ({
        url: `/trunks/delete/${trunkId}`,
        method: "DELETE"
      })
    }),

    /* ---------------- BILLING & LICENSE ---------------- */
    getMonthlyBilling: builder.query({
      query: () => "/billing/monthly"
    }),
      addPlans: builder.mutation({
      query: (body) => ({
        url: "/plans",
        method: "POST",
        body
      })
    }),

    /* ---------------- BILLING & LICENSE ---------------- */
    getPlans: builder.query({
      query: (userId) => `/plans/${userId}`
    }),

    getLicenses: builder.query({
      query: () => "/billing/licenses"
    }),

    /* ---------------- COMPLIANCE ---------------- */
    getComplianceDocuments: builder.query({
      query: () => "/compliance/documents"
    }),

    uploadComplianceDocument: builder.mutation({
      query: (body) => ({
        url: "/compliance/upload",
        method: "POST",
        body
      })
    }),
   /* ---------------- DOMAIN & BRANDING ---------------- */
    getBrandingSettings: builder.query({
      query: () => "/branding/settings"
    }),

    updateBrandingSettings: builder.mutation({
      query: (body) => ({
        url: "/branding/update",
        method: "PUT",
        body
      })
    }),
    /* ---------------- KEYCLOAK CONFIG ---------------- */
    getKeycloakConfig: builder.query({
      /**
       * @param {string} domain - e.g. window.location.hostname
       */
      query: (domain) => `/auth/keycloak-config?domain=${domain}`,
    }),
    addAgent: builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/agent/add",
        method: "POST",
        body
      })
    }),
    updateAgent: builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/agent/update",
        method: "PUT",
        body
      })
    }),
    disableAgent: builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/agent/disable",
        method: "post",
        body
      })
    }),
    addQueue: builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/queue/add",
        method: "POST",
        body
      })
    }),
    updateQueue: builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/queue/add",
        method: "POST",
        body
      })
    }),

    /* ---------------- BILLING & LICENSE ---------------- */
    getQueues: builder.query({
      query: (userId) => `/queue/${userId}`
    }),
    buyDid: builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/did/buy",
        method: "POST",
        body
      })
    }),
      saveDid: builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/did/save",
        method: "POST",
        body
      })
    }),
    createBot: builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/did/buy",
        method: "POST",
        body
      })
    }),

    /* ---------------- BILLING & LICENSE ---------------- */
    getBots: builder.query({
      query: (userId) => `/queue/${userId}`
    }),

    /* ---------------- BILLING & LICENSE ---------------- */
    getIvrs: builder.query({
      query: (userId) => `/queue/${userId}`
    }),
    publishIvr: builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/ivr/publish",
        method: "POST",
        body
      })
    }),
    saveSip: builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/sip/save",
        method: "POST",
        body
      })
    }),
    addRoutingRule: builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/routingrule/save",
        method: "POST",
        body
      })
    }),

    /* ---------------- BILLING & LICENSE ---------------- */
    getRoutingRules: builder.query({
      query: (userId) => `/routingrule/${userId}`
    }),
    updateRoutingRule: builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/routingrule/save",
        method: "POST",
        body
      })
    }),
    deleteRoutingRule: builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/routingrule/save",
        method: "delete",
        body
      })
    }),

    /* ---------------- BILLING & LICENSE ---------------- */
    getIVR: builder.query({
      query: (userId) => `/ivr/${userId}`
    }),

    /* ---------------- BILLING & LICENSE ---------------- */
    getIVRVersions: builder.query({
      query: (userId) => `/ivr/versions/${userId}`
    }),
    saveIVRDraft: builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/ivr-draft/save",
        method: "POST",
        body
      })
    }),
    publishIVR: builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/ivr/publish",
        method: "POST",
        body
      })
    }),

    /* ---------------- BILLING & LICENSE ---------------- */
    getRecordingPolicies: builder.query({
      query: (userId) => `/recording/policy/${userId}`
    }),

    /* ---------------- BILLING & LICENSE ---------------- */
    getQueueOverrides: builder.query({
      query: (userId) => `/recording/policy/${userId}`
    }),
    updateGlobalPolicies:builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/global/policies/save",
        method: "POST",
        body
      })
    }),
    updateQueueOverride:builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/queue/override/save",
        method: "POST",
        body
      })
    }),
    deleteQueueOverride:builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/queue/override",
        method: "DELETE",
        body
      })
    }),

    /* ---------------- BILLING & LICENSE ---------------- */
    getCompliancePolicies: builder.query({
      query: (userId) => `/compliance/policy/${userId}`
    }),

    /* ---------------- BILLING & LICENSE ---------------- */
    getDNCList: builder.query({
      query: (userId) => `/dnc/${userId}`
    }),
    updateCompliancePolicies:builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/compliance/policies/save",
        method: "POST",
        body
      })
    }),
    uploadDNCList:builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/dnc/list",
        method: "POST",
        body
      })
    }),
    addDNCNumber:builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/dnc/number",
        method: "POST",
        body
      })
    }),
    deleteDNCNumber:builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/dnc/number",
        method: "DELETE",
        body
      })
    }),
    /* ---------------- BILLING & LICENSE ---------------- */
    getBillingSummary: builder.query({
      query: (userId) => `/billing/${userId}`
    }),
    /* ---------------- BILLING & LICENSE ---------------- */
    getPaymentMethods: builder.query({
      query: (userId) => `/payment/${userId}`
    }),
    addPaymentMethod:builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/payment/method",
        method: "POST",
        body
      })
    }),
    updateAutoDebit:builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/update/autodebit",
        method: "POST",
        body
      })
    }),
    downloadInvoice:builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/download/invoice",
        method: "POST",
        body
      })
    }),
    /* ---------------- BILLING & LICENSE ---------------- */
    getProducts: builder.query({
      /** @param {void} _ */
      query: (_) => "/products",
      transformResponse: (response) => unwrapJavaTypedJson(response),
    }),
    getProductPlans: builder.query({
      /** @param {string} productCode */
      query: (productCode) => `/products/${productCode}/plans`,
      transformResponse: (response) => unwrapJavaTypedJson(response),
    }),
    /* ---------------- BILLING & LICENSE ---------------- */
    getSubscription: builder.query({
      query: (userId) => `/subscription/${userId}`
    }),
    purchaseAddon:builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/subscription/add-on",
        method: "POST",
        body
      })
    }),
    createSubscription: builder.mutation({
      query: (body) => ({
        url: "/subscriptions",
        method: "POST",
        body,
      }),
    }),
    simulatePaymentSuccess: builder.mutation({
      query: (gatewayOrderId) => ({
        url: `/internal/payments/simulate-success/${gatewayOrderId}`,
        method: "POST",
      }),
    }),
    getSubscriptionStatus: builder.query({
      query: (subscriptionId) => `/subscriptions/${subscriptionId}`,
    }),
    /* ---------------- BILLING & LICENSE ---------------- */
    getAuditLogs: builder.query({
      query: (userId) => `/audit/log/${userId}`
    }),
    /* ---------------- BILLING & LICENSE ---------------- */
    getQueueHealth: builder.query({
      query: (userId) => `/queue/${userId}`
    }),
    /* ---------------- BILLING & LICENSE ---------------- */
    getAgentStatus: builder.query({
      query: (userId) => `/agent/${userId}`
    }),
    /* ---------------- BILLING & LICENSE ---------------- */
    getAIInsights: builder.query({
      query: (userId) => `/agent/${userId}`
    }),
    /* ---------------- BILLING & LICENSE ---------------- GetQueueMonitor*/
    getAlerts: builder.query({
      query: (userId) => `/alerts/${userId}`
    }),
    /* ---------------- BILLING & LICENSE ---------------- GetLiveAgents*/
    getQueueMonitor: builder.query({
      query: (userId) => `/alerts/${userId}`
    }),
    /* ---------------- BILLING & LICENSE -------  useGetLiveCallsQuery,
  useMonitorCallMutation,
  useWhisperToAgentMutation,
  useBargeInCallMutation,
  useTakeoverCallMutation*/
    getLiveAgents: builder.query({
      query: (userId) => `/agents/${userId}`
    }),
    /* ---------------- BILLING & LICENSE -------  */
    getLiveCalls: builder.query({
      query: (userId) => `/calls/${userId}`
    }),
    monitorCall:builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/monitor/call",
        method: "POST",
        body
      })
    }),
    whisperToAgent:builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/whisper/agent",
        method: "POST",
        body
      })
    }),
    bargeInCall:builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/barge/call",
        method: "POST",
        body
      })
    }),
    takeoverCall:builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/takeover/call",
        method: "POST",
        body
      })
    }),
    /* GenerateFeedbackMutation---------------- BILLING & LICENSE -------  */
    getFlaggedCalls: builder.query({
      query: (userId) => `/flagged/calls/${userId}`
    }),
    generateFeedback:builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/generate/feedback",
        method: "POST",
        body
      })
    }),
    /* ---------------- BILLING & LICENSE -------  */
    getTeamMetrics: builder.query({
      query: (userId) => `/team/metrics/${userId}`
    }),
    /* GetAgentLeaderboard---------------- BILLING & LICENSE -------  */
    getAgentLeaderboard: builder.query({
      query: (userId) => `/agent/leaderboard/${userId}`
    }),
    /*    useGetForecastQuery,
  useApplyRecommendationMutation---------------- BILLING & LICENSE -------  */
    getCallReview: builder.query({
      query: (userId) => `/call/review/${userId}`
    }),
    generateCoaching:builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/generate/coaching",
        method: "POST",
        body
      })
    }),

    getForecast: builder.query({
      query: (userId) => `/forecast/${userId}`
    }),
    applyRecommendation:builder.mutation({
      /**
       * @param {{ inventory: Array<{did: string, country: string, countryCode: string, type?: string, provider?: string}> }} body
       */
      query: (body) => ({
        url: "/recommendation/apply",
        method: "POST",
        body
      })
    })
  }),
});

export const {
  useGetHealthQuery,
  useGetTenantsQuery,
  useGetAgentsQuery,
  useGetWalletBalanceQuery,
  useAddWalletBalanceMutation,
  useGetLiveCallQuery,
  useGetInvoicesQuery,
  useGetDashboardStatsQuery,
  useOriginateCallMutation,
  useAcceptCallMutation,
  useHangupCallMutation,

  usePartnerRegisterMutation,
  usePartnerGetCloudProvidersQuery,
  usePartnerSetupMTLSMutation,
  usePartnerCreateWorkerNodeMutation,
  usePartnerJoinWorkerNodeMutation,

  useTenantRegisterMutation,
  useTenantVerifyMutation,
  useTenantPhonePurchaseMutation,
  useTenantPhonePortMutation,
  useTenantPlanSelectionMutation,
  useTenantComplianceUploadMutation,
  useTenantBillingAddCardMutation,
  useTenantToggleWalletMutation,
  useTenantAssignDIDMutation,
  useTenantConfigureTrunkMutation,
  useTenantEnableAIMutation,
  useTenantGetSummaryQuery,
  useGetDidInventoryQuery,
  useUploadDidInventoryMutation,
 // New exports
  useGetTenantsListQuery,
  useGetTenantAnalyticsQuery,
  useUpdateTenantMutation,
  useDeleteTenantMutation,
  
  useGetCloudProvidersQuery,
  useGetCloudConnectionsQuery,
  useCreateCloudConnectionMutation,
  useGenerateTLSCertificateMutation,
  
  useGetTrunksListQuery,
  useCreateTrunkMutation,
  useUpdateTrunkMutation,
  useDeleteTrunkMutation,
  
  useGetMonthlyBillingQuery,
  useGetLicensesQuery,
  
  useGetComplianceDocumentsQuery,
  useUploadComplianceDocumentMutation,
  
  useGetBrandingSettingsQuery,
  useUpdateBrandingSettingsMutation,

  useAddPlansMutation,
  useGetPlansQuery,
  useGetKeycloakConfigQuery,

  useAddAgentMutation,
  useAddQueueMutation,
  useBuyDidMutation,
  useCreateBotMutation,
  usePublishIvrMutation,
  useSaveDidMutation,
  useSaveSipMutation,
  useDisableAgentMutation,
  useUpdateAgentMutation,
  useUpdateQueueMutation,
  useGetQueuesQuery,


  useAddRoutingRuleMutation,
  useUpdateRoutingRuleMutation,
  useGetBotsQuery,
  useGetIvrsQuery,

  useGetRoutingRulesQuery,
  useDeleteRoutingRuleMutation,
  useGetIVRQuery,
  useSaveIVRDraftMutation,
  usePublishIVRMutation,
  useGetIVRVersionsQuery,

  useGetRecordingPoliciesQuery,
  useUpdateGlobalPoliciesMutation,
  useGetQueueOverridesQuery,
  useUpdateQueueOverrideMutation,
  useDeleteQueueOverrideMutation,

  useGetCompliancePoliciesQuery,
  useUpdateCompliancePoliciesMutation,
  useUploadDNCListMutation,
  useAddDNCNumberMutation,
  useGetDNCListQuery,
  useDeleteDNCNumberMutation,

  useGetBillingSummaryQuery,
  useGetPaymentMethodsQuery,
  useAddPaymentMethodMutation,
  useUpdateAutoDebitMutation,
  useDownloadInvoiceMutation,

  useGetSubscriptionQuery,
  usePurchaseAddonMutation,
  useCreateSubscriptionMutation,
  useSimulatePaymentSuccessMutation,
  useLazyGetSubscriptionStatusQuery,

  useGetAuditLogsQuery,

  useGetQueueHealthQuery,
  useGetAgentStatusQuery,
  useGetAIInsightsQuery,
  useGetAlertsQuery,

  useGetQueueMonitorQuery,
  useGetLiveAgentsQuery,
  useGetLiveCallsQuery,
  useMonitorCallMutation,
  useWhisperToAgentMutation,
  useBargeInCallMutation,
  useTakeoverCallMutation,
    useGetFlaggedCallsQuery,
    useGenerateFeedbackMutation,
    useGetTeamMetricsQuery,
    useGetAgentLeaderboardQuery,
    
    useGetCallReviewQuery,
   useGenerateCoachingMutation,

   useGetForecastQuery,
  useApplyRecommendationMutation,
  useGetMyTenantQuery,
  useGetProductsQuery,
  useGetProductPlansQuery,
  useSearchAvailableDidsQuery
} = api;
