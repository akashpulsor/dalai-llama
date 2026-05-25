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
    const data = err.data;
    /** @type {string} */
    let message = "An unexpected error occurred";
    if (typeof data === "string") {
      message = data;
    } else if (data && typeof data === "object") {
      message = data.message || data.error || data.detail || JSON.stringify(data);
    }
    return { status: err.status, message };
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
},

/* ---------------- CREATOR UI MOCKS ---------------- */
"/creator/trends": [
  {
    id: "trend-she-almost",
    title: "She Almost Didn't Go",
    status: "Very Hot",
    hashtags: ["#FitnessJourney", "#ShowUp", "#GlowUp"],
    reels: "12.4K",
    reelsGrowth: "+38%",
    engagement: "9.1%",
    engagementGrowth: "+21%"
  },
  {
    id: "trend-wife-gym",
    title: "POV: Indian Wife Starts Gym",
    status: "Hot",
    hashtags: ["#IndianFitness", "#POV", "#GymLife"],
    reels: "9.8K",
    reelsGrowth: "+31%",
    engagement: "8.4%",
    engagementGrowth: "+18%"
  },
  {
    id: "trend-study-late",
    title: "Study With Me - Late Nights",
    status: "Trending",
    hashtags: ["#StudyWithMe", "#LateNight", "#Discipline"],
    reels: "7.2K",
    reelsGrowth: "+24%",
    engagement: "7.7%",
    engagementGrowth: "+16%"
  },
  {
    id: "trend-skin-routine",
    title: "Glowing Skin Real Routine",
    status: "Hot",
    hashtags: ["#SkinCare", "#RealRoutine", "#Glow"],
    reels: "8.6K",
    reelsGrowth: "+29%",
    engagement: "8.8%",
    engagementGrowth: "+19%"
  },
  {
    id: "trend-protein-meals",
    title: "High Protein Indian Meals",
    status: "Trending",
    hashtags: ["#Protein", "#IndianMeals", "#MealPrep"],
    reels: "6.9K",
    reelsGrowth: "+22%",
    engagement: "7.3%",
    engagementGrowth: "+14%"
  }
],
"/creator/trends/refresh": {
  status: "success",
  refreshedAt: "2026-05-13T10:00:00.000Z"
},
"/creator/platforms": [
  {
    id: "mock-platform-instagram-reels",
    code: "instagram_reels",
    label: "Instagram Reels",
    displayName: "Instagram Reels",
    description: "Short-form vertical videos for Reels-first creator planning.",
    iconKey: "instagram",
    sortOrder: 10,
    shortForm: true,
    promptContext: "Optimize for Instagram Reels: hook-heavy, vertical, quick cuts, creator-led pacing."
  },
  {
    id: "mock-platform-youtube-shorts",
    code: "youtube_shorts",
    label: "YouTube Shorts",
    displayName: "YouTube Shorts",
    description: "Short-form YouTube format with strong retention and replay value.",
    iconKey: "youtube",
    sortOrder: 20,
    shortForm: true,
    promptContext: "Optimize for YouTube Shorts: clear setup, payoff, retention loops, and concise scripting."
  },
  {
    id: "mock-platform-tiktok",
    code: "tiktok",
    label: "TikTok",
    displayName: "TikTok",
    description: "Fast social-video format for trend-native creator content.",
    iconKey: "music",
    sortOrder: 30,
    shortForm: true,
    promptContext: "Optimize for TikTok: trend-aware framing, quick emotional beats, and native captions."
  }
],
"/creator/categories": [
  {
    id: "mock-category-fitness",
    code: "fitness",
    label: "Fitness",
    displayName: "Fitness",
    description: "Health, weight loss, routines, transformation and relatable wellness ideas.",
    iconKey: "dumbbell",
    sortOrder: 10,
    promptContext: "Fitness creator content with practical routines, motivation, realistic body goals, and clear action."
  },
  {
    id: "mock-category-beauty",
    code: "beauty",
    label: "Beauty",
    displayName: "Beauty",
    description: "Makeup, skincare, glow-up, styling and transformation-led content.",
    iconKey: "sparkles",
    sortOrder: 20,
    promptContext: "Beauty creator content with visual transformation, product moments, and confidence-led storytelling."
  },
  {
    id: "mock-category-food",
    code: "food",
    label: "Food",
    displayName: "Food",
    description: "Recipes, meal prep, cravings, regional food and creator kitchen storytelling.",
    iconKey: "utensils",
    sortOrder: 30,
    promptContext: "Food creator content with satisfying visuals, simple steps, cultural details, and sensory hooks."
  },
  {
    id: "mock-category-study",
    code: "study",
    label: "Study",
    displayName: "Study",
    description: "Student life, productivity, exam prep, motivation and routine content.",
    iconKey: "book-open",
    sortOrder: 40,
    promptContext: "Study creator content with focused routines, relatable pressure, practical advice, and calm pacing."
  },
  {
    id: "mock-category-tech-ai",
    code: "tech_ai",
    label: "Tech & AI",
    displayName: "Tech & AI",
    description: "AI tools, tech explainers, workflows, product demos and creator education.",
    iconKey: "cpu",
    sortOrder: 50,
    promptContext: "Tech and AI creator content with clear demos, strong before-after value, and simple explanations."
  },
  {
    id: "mock-category-finance-crypto",
    code: "finance_crypto",
    label: "Finance & Crypto",
    displayName: "Finance & Crypto",
    description: "Personal finance, markets, crypto education and money mindset content.",
    iconKey: "wallet",
    sortOrder: 60,
    promptContext: "Finance creator content with cautious educational framing, concrete examples, and trust-building clarity."
  }
],
"/creator/trend-combinations": {
  platforms: [
    { code: "instagram", label: "Instagram Reels", active: true },
    { code: "youtube", label: "YouTube Shorts", active: true },
    { code: "tiktok", label: "TikTok", active: true }
  ],
  categories: [
    { code: "fitness", label: "Fitness", active: true },
    { code: "beauty", label: "Beauty", active: true },
    { code: "food", label: "Food", active: true },
    { code: "study", label: "Study", active: true },
    { code: "tech_ai", label: "Tech & AI", active: true },
    { code: "finance_crypto", label: "Finance & Crypto", active: true }
  ],
  combinations: [
    { platformCode: "instagram", categoryCode: "fitness", active: true },
    { platformCode: "instagram", categoryCode: "beauty", active: true },
    { platformCode: "instagram", categoryCode: "food", active: true },
    { platformCode: "instagram", categoryCode: "study", active: true },
    { platformCode: "youtube", categoryCode: "fitness", active: true },
    { platformCode: "youtube", categoryCode: "study", active: true },
    { platformCode: "youtube", categoryCode: "tech_ai", active: true },
    { platformCode: "tiktok", categoryCode: "fitness", active: true },
    { platformCode: "tiktok", categoryCode: "beauty", active: true }
  ]
},
"/creator/ai-providers": [
  {
    id: "mock-openai-provider",
    code: "openai",
    label: "OpenAI",
    displayName: "OpenAI",
    description: "OpenAI Responses API provider for production creator generation.",
    providerType: "LLM",
    defaultModel: "gpt-4o-mini",
    defaultProvider: true,
    credentialConfigured: true,
    sortOrder: 10,
    capabilities: {
      jsonOutput: true,
      usageTokens: true,
      textGeneration: true
    }
  },
  {
    id: "mock-local-provider",
    code: "mock",
    label: "Mock Provider",
    displayName: "Mock Provider",
    description: "Deterministic local provider for development and tests.",
    providerType: "MOCK",
    defaultModel: "mock-creator-v1",
    defaultProvider: false,
    credentialConfigured: true,
    sortOrder: 90,
    capabilities: {
      offline: true,
      jsonOutput: true,
      textGeneration: true
    }
  }
],
"/creator/trends/predict": {
  jobId: "job-predict-trends-mock",
  predictionRunId: "prediction-run-mock",
  status: "PENDING"
},
"/creator/audience/suggest": {
  id: "audience-women-22-35-in",
  title: "Women 22-35 in India",
  description: "Interested in fitness, weight loss, confidence building and self improvement."
},
"/creator/audience/confirm": {
  id: "audience-women-22-35-in",
  status: "confirmed"
},
"/creator/profiles": [
  {
    id: "creator-priya",
    name: "Priya",
    age: 27,
    gender: "Female",
    vibe: ["Relatable", "Soft Spoken", "Determined"],
    fitnessLevel: "Beginner",
    style: "Casual Gym Wear",
    cameraConfidence: "Shy"
  }
],
"/creator/projects": [
  {
    id: "00000000-0000-4000-8000-000000000001",
    projectId: "00000000-0000-4000-8000-000000000001",
    title: "She Almost Didn't Go",
    lockedIdeaTitle: "Beginner fitness transformation",
    selectedCategoryCode: "fitness",
    durationSeconds: 30,
    status: "SCREENPLAY_GENERATED",
    updatedAt: new Date().toISOString()
  }
],
"/creator/ideas/generate": {
  ideas: [
    {
      id: "idea-she-almost",
      title: "She Almost Didn't Go",
      bestMatch: true,
      description: "A hesitant beginner nearly skips the gym, then chooses one small brave step.",
      hashtags: ["#ShowUp", "#FitnessJourney", "#BeginnerGym"]
    },
    {
      id: "idea-wife-gym",
      title: "POV: Indian Wife Starts Gym",
      bestMatch: false,
      description: "A relatable first-day gym story built around family expectations and self-belief.",
      hashtags: ["#POV", "#IndianFitness", "#Confidence"]
    },
    {
      id: "idea-day-one",
      title: "Nobody Saw Her Day 1",
      bestMatch: false,
      description: "Quiet progress montage that turns a private first step into a public win.",
      hashtags: ["#DayOne", "#GlowUp", "#Discipline"]
    }
  ]
},
"/creator/storyboard/generate": {
  projectId: "00000000-0000-4000-8000-000000000001",
  status: "queued"
},
"/creator/locked-ideas/quote": {
  cost: 149,
  currency: "INR",
  entitlementAllowed: true,
  wallet: { balance: 1250, currency: "INR" },
  includedItems: ["Locked idea", "First storyboard generation", "Director-level scene plan"]
},
"/creator/locked-ideas/generate-storyboard": {
  lockedIdeaId: "locked-idea-mock",
  storyboardId: "storyboard-she-almost",
  jobId: "job-storyboard-mock",
  status: "PENDING"
},
"/creator/storyboards/history": [
  {
    id: "storyboard-she-almost",
    title: "She Almost Didn't Go",
    lockedIdeaTitle: "She Almost Didn't Go",
    durationSeconds: 30,
    status: "COMPLETED",
    time: "Just now"
  },
  {
    id: "storyboard-gym-bag",
    title: "The Gym Bag Stayed Packed",
    lockedIdeaTitle: "First Small Win",
    durationSeconds: 45,
    status: "COMPLETED",
    time: "Yesterday"
  }
],
"/creator/storyboards/saved": [
  {
    id: "storyboard-she-almost",
    title: "She Almost Didn't Go",
    lockedIdeaTitle: "Beginner fitness transformation",
    durationSeconds: 30,
    status: "SAVED"
  }
],
"/creator/export": {
  exportId: "export-creator-mock",
  status: "ready",
  downloadUrl: "/mocks/storyboard/she-almost-storyboard.pdf"
},
"/creator/billing/wallet": {
  balance: 1250,
  currency: "INR"
},
"/creator/billing/recharge": {
  rechargeId: "recharge-mock",
  status: "PENDING",
  paymentUrl: "https://billing.dalaillama.in/mock/recharge"
},
"/creator/subscription": {
  planCode: "CREATOR_PRO",
  planName: "Creator Pro",
  status: "ACTIVE",
  creatorEntitlements: {
    creatorTrendPredictionEnabled: true,
    lockIdeaPackageEnabled: true,
    creatorTrendPredictionsPerMonth: 100
  }
},
"/creator/subscription/upgrade": {
  checkoutId: "checkout-upgrade-mock",
  status: "PENDING",
  checkoutUrl: "https://billing.dalaillama.in/mock/upgrade"
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
  const method = typeof args === "string" ? "GET" : args.method || "GET";
  const body = typeof args === "string" ? {} : args.body || {};

  await new Promise((r) => setTimeout(r, 250));

  /** @type {string} */
  const key = String(endpoint);  // ✅ Fix: ensure string key

  if (key === "/tenants" && method === "POST") {
    const sourceName = body.name || body.companyName || body.company_name || body.organizationName || "Creator Organization";
    const slug = body.slug || String(sourceName).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "creator-org";
    return {
      data: {
        id: `tenant-${slug}`,
        tenantId: `tenant-${slug}`,
        slug,
        name: sourceName,
        companyName: body.companyName || body.company_name || sourceName,
        status: "ACTIVE",
        hasTenant: true,
        needsOnboarding: false,
        productCode: body.productCode || "CREATOR",
        currency: body.currency || body.wallet?.currency || "INR",
      }
    };
  }

  if (key === "/creator/profiles" && method === "POST") {
    const displayName = body.displayName || body.name || "New Actor";
    const vibe = Array.isArray(body.vibe) ? body.vibe : Array.isArray(body.vibes) ? body.vibes : ["Relatable"];
    const mockId = `00000000-0000-4000-8000-${String(Date.now()).slice(-12).padStart(12, "0")}`;
    return {
      data: {
        id: mockId,
        projectId: body.projectId || null,
        name: displayName,
        displayName,
        roleInShort: body.roleInShort || "Main Actor",
        age: body.age || body.attributes?.age || 26,
        gender: body.gender || body.attributes?.gender || "All",
        vibe,
        vibes: vibe,
        style: body.style || body.attributes?.style || "Casual Gym Wear",
        cameraConfidence: body.cameraConfidence || body.attributes?.cameraConfidence || "Somewhat Comfortable",
        look: body.look || body.attributes?.look || "",
        profile: body.profile || body.attributes?.profile || "",
        notes: body.notes || body.attributes?.notes || "",
        confirmed: body.confirmed !== false,
        attributes: {
          ...(body.attributes || {}),
          age: body.age || body.attributes?.age || 26,
          gender: body.gender || body.attributes?.gender || "All",
          vibe,
          vibes: vibe,
          style: body.style || body.attributes?.style || "Casual Gym Wear",
          cameraConfidence: body.cameraConfidence || body.attributes?.cameraConfidence || "Somewhat Comfortable",
          look: body.look || body.attributes?.look || "",
          profile: body.profile || body.attributes?.profile || "",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    };
  }

  const creatorProfileUpdateMatch = key.match(/^\/creator\/profiles\/([^/]+)$/);
  if (creatorProfileUpdateMatch && method === "PATCH") {
    const [, profileId] = creatorProfileUpdateMatch;
    const displayName = body.displayName || body.name || "Updated Actor";
    const vibe = Array.isArray(body.vibe) ? body.vibe : Array.isArray(body.vibes) ? body.vibes : ["Relatable"];
    return {
      data: {
        id: profileId,
        projectId: body.projectId || null,
        name: displayName,
        displayName,
        roleInShort: body.roleInShort || "Main Actor",
        age: body.age || body.attributes?.age || 26,
        gender: body.gender || body.attributes?.gender || "All",
        vibe,
        vibes: vibe,
        style: body.style || body.attributes?.style || "Casual Gym Wear",
        cameraConfidence: body.cameraConfidence || body.attributes?.cameraConfidence || "Somewhat Comfortable",
        look: body.look || body.attributes?.look || "",
        profile: body.profile || body.attributes?.profile || "",
        notes: body.notes || body.attributes?.notes || "",
        confirmed: body.confirmed !== false,
        attributes: body.attributes || {},
        updatedAt: new Date().toISOString(),
      }
    };
  }

  const creatorJobMatch = key.match(/^\/creator\/jobs\/([^/]+)$/);
  if (creatorJobMatch) {
    const [, jobId] = creatorJobMatch;
    if (jobId.includes("predict")) {
      return {
        data: {
          jobId,
          status: "COMPLETED",
          progress: 100,
          message: "Trend prediction ready",
          result: { predictionRunId: "prediction-run-mock" }
        }
      };
    }

    return {
      data: {
        jobId,
        status: "COMPLETED",
        progress: 100,
        message: "Director-level storyboard ready",
        result: {
          storyboard: {
            id: "storyboard-she-almost",
            projectId: "00000000-0000-4000-8000-000000000001",
            title: "She Almost Didn't Go",
            durationSeconds: 30,
            hook: "A hesitant first step becomes the emotional proof that showing up counts.",
            sceneCount: 10,
            scenes: [
              {
                id: "scene-01",
                timestamp: "0-2 sec",
                description: "Priya stands outside the gym holding her bag, frozen before entering.",
                vo: "I almost didn't go today.",
                shotType: "Wide",
                hookBeat: "Immediate hesitation hook",
                expression: "Nervous, eyes lowered, shallow breath",
                dialogue: "I almost didn't go today.",
                cameraAngle: "Wide low-angle exterior with gym sign visible",
                cameraMovement: "Slow push-in",
                intendedImpact: "Make the viewer recognize the fear before the first step",
                transition: "Hard cut on breath",
                soundNote: "Soft city ambience, low heartbeat"
              },
              {
                id: "scene-02",
                timestamp: "2-4 sec",
                description: "Close-up of her thumb hovering over a message saying 'Maybe tomorrow'.",
                vo: "Excuses felt easier.",
                shotType: "Insert close-up",
                hookBeat: "Relatable resistance",
                expression: "Tense hand, tiny tremor",
                dialogue: "Excuses felt easier.",
                cameraAngle: "Phone insert from over shoulder",
                cameraMovement: "Static",
                intendedImpact: "Show the exact moment she nearly quits",
                transition: "Match cut to shoes",
                soundNote: "Notification tap, muted"
              },
              {
                id: "scene-03",
                timestamp: "4-7 sec",
                description: "Her shoes step forward once, stopping at the entrance line.",
                vo: "So I made the promise smaller.",
                shotType: "Low detail",
                hookBeat: "Tiny action changes the story",
                expression: "Body still guarded, shoulders tight",
                dialogue: "Just ten minutes.",
                cameraAngle: "Low angle on shoes",
                cameraMovement: "Micro dolly forward",
                intendedImpact: "Turn motivation into a simple action",
                transition: "Door sound bridge",
                soundNote: "Rubber sole squeak"
              },
              {
                id: "scene-04",
                timestamp: "7-10 sec",
                description: "She enters the gym and looks around, overwhelmed but present.",
                vo: "Not a new life. Just a new choice.",
                shotType: "Medium",
                hookBeat: "Audience sees the pressure",
                expression: "Wide eyes, controlled inhale",
                dialogue: "Not a new life. Just a new choice.",
                cameraAngle: "Medium from behind, gym depth visible",
                cameraMovement: "Handheld follow",
                intendedImpact: "Make the gym feel intimidating without making her weak",
                transition: "Cut on glance",
                soundNote: "Distant weights, soft room tone"
              },
              {
                id: "scene-05",
                timestamp: "10-14 sec",
                description: "She ties her hair and adjusts her grip on a light dumbbell.",
                vo: "I didn't feel ready.",
                shotType: "Close up",
                hookBeat: "Preparation beat",
                expression: "Focused but uncertain",
                dialogue: "I didn't feel ready.",
                cameraAngle: "Close-up hands and face reflected in mirror",
                cameraMovement: "Static mirror frame",
                intendedImpact: "Show preparation as courage",
                transition: "Cut with music lift",
                soundNote: "Music enters quietly"
              },
              {
                id: "scene-06",
                timestamp: "14-18 sec",
                description: "First awkward rep, slow and imperfect.",
                vo: "But I started anyway.",
                shotType: "Medium action",
                hookBeat: "Imperfect action beat",
                expression: "Strained, embarrassed smile",
                dialogue: "But I started anyway.",
                cameraAngle: "Three-quarter medium at shoulder height",
                cameraMovement: "Gentle handheld sway",
                intendedImpact: "Give permission to begin badly",
                transition: "Rep motion cut",
                soundNote: "Breath and soft weight clink"
              },
              {
                id: "scene-07",
                timestamp: "18-22 sec",
                description: "She pauses after the set, surprised that she completed it.",
                vo: "One small win was enough.",
                shotType: "Reaction close-up",
                hookBeat: "Payoff begins",
                expression: "Surprised relief, small smile",
                dialogue: "One small win was enough.",
                cameraAngle: "Close-up with mirror light",
                cameraMovement: "Slow push-in",
                intendedImpact: "Land the emotional reward",
                transition: "Soft dissolve",
                soundNote: "Music warms"
              },
              {
                id: "scene-08",
                timestamp: "22-25 sec",
                description: "Text on screen over her tying her bag: 'Just one decision...'",
                vo: "Just one decision...",
                shotType: "Text overlay",
                hookBeat: "Memorable line",
                expression: "Calm, more grounded",
                dialogue: "Just one decision...",
                cameraAngle: "Close-up bag strap",
                cameraMovement: "Static",
                intendedImpact: "Create a shareable caption moment",
                transition: "Text wipe",
                soundNote: "Music beat hit"
              },
              {
                id: "scene-09",
                timestamp: "25-28 sec",
                description: "She walks out of the gym, posture slightly taller.",
                vo: "To show up.",
                shotType: "Wide exit",
                hookBeat: "Transformation without exaggeration",
                expression: "Quiet confidence",
                dialogue: "To show up.",
                cameraAngle: "Wide from doorway",
                cameraMovement: "Follow then stop",
                intendedImpact: "Make the change feel believable",
                transition: "Cut to end frame",
                soundNote: "Music resolves"
              },
              {
                id: "scene-10",
                timestamp: "28-30 sec",
                description: "End frame: Priya outside, morning light behind her.",
                vo: "Start small. Start today.",
                shotType: "Hero end frame",
                hookBeat: "CTA close",
                expression: "Soft smile, direct eye contact",
                dialogue: "Start small. Start today.",
                cameraAngle: "Portrait hero frame",
                cameraMovement: "Static",
                intendedImpact: "Leave the viewer with an actionable feeling",
                transition: "End card",
                soundNote: "Final warm chord"
              }
            ]
          }
        }
      }
    };
  }

  const creatorStoryboardSaveMatch = key.match(/^\/creator\/storyboards\/([^/]+)\/save$/);
  if (creatorStoryboardSaveMatch) {
    const [, storyboardId] = creatorStoryboardSaveMatch;
    return {
      data: {
        storyboardId,
        saved: method !== "DELETE",
        status: method === "DELETE" ? "UNSAVED" : "SAVED"
      }
    };
  }

  const creatorStoryboardByIdMatch = key.match(/^\/creator\/storyboards\/([^/]+)$/);
  if (creatorStoryboardByIdMatch) {
    return {
      data: {
        id: "storyboard-she-almost",
        title: "She Almost Didn't Go",
        durationSeconds: 30,
        scenes: []
      }
    };
  }

  const creatorStoryboardFromScriptMatch = key.match(/^\/creator\/storyboards\/scripts\/([^/]+)\/generate$/);
  if (creatorStoryboardFromScriptMatch && method === "POST") {
    const [, scriptId] = creatorStoryboardFromScriptMatch;
    const sceneCount = 6;
    const scenes = Array.from({ length: sceneCount }, (_, index) => {
      const shotNumber = index + 1;
      const start = index * 5;
      const end = start + 5;
      const imagePath = `/mocks/creator/story-scene-${String(shotNumber).padStart(2, "0")}.png`;
      return {
        sceneId: `scene-${String(shotNumber).padStart(2, "0")}`,
        imageAssetId: `asset-storyboard-${shotNumber}`,
        lightingImageAssetId: `asset-lighting-${shotNumber}`,
        cameraPlanImageAssetId: `asset-camera-${shotNumber}`,
        shotNumber,
        title: `Shot ${shotNumber}: Production beat`,
        startTime: `${start}s`,
        endTime: `${end}s`,
        durationSeconds: 5,
        shotType: shotNumber % 2 ? "CU" : "MS",
        cameraAngle: "Eye Level",
        cameraMovement: shotNumber % 2 ? "Static" : "Slow Push-In",
        lensSuggestion: "Mobile 1x Wide",
        fps: 24,
        objectKey: `mock/storyboard/${scriptId}/${shotNumber}.png`,
        signedUrl: imagePath,
        lightingImageUrl: imagePath,
        cameraPlanImageUrl: imagePath,
        sketchPrompt: "Production storyboard panel with matching character continuity.",
        storyboardTag: {
          projectTitle: "She Almost Didn't Go",
          shotTitle: `Shot ${shotNumber}: Production beat`,
          narrativeBeatSummary: shotNumber === 1 ? "Creator hesitates before the first brave action." : "Creator moves through the next emotional beat.",
          compositionSummary: "Character center frame, eyes near upper third",
          targetFocalPoint: "TARGET: creator expression",
          shotType: shotNumber % 2 ? "CU" : "MS",
          cameraAngle: "Eye Level",
          cameraMovement: shotNumber % 2 ? "Static" : "Slow Push-In",
          lensSuggestion: "Mobile 1x Wide",
          fps: 24,
          action: "Hold the emotional action clearly for the storyboard frame.",
          expression: "Focused and vulnerable",
          emotion: "determined",
          textOverlay: shotNumber === sceneCount ? "START SMALL" : "",
          primaryDialogue: {
            characterName: "Priya",
            archetypeLabel: "INFLUENCER",
            line: shotNumber === 1 ? "I almost skipped this." : "",
            deliveryNote: "soft, honest",
            subtext: "Trying to stay brave",
            lineStartTime: start,
            lineEndTime: Math.min(end, start + 2),
          },
          primaryCharacters: [{ storyCharacterName: "Priya", archetypeLabel: "INFLUENCER", age: 27 }],
          sideCharacters: [],
        },
        lightingBuildSheetTag: {
          projectTitle: "She Almost Didn't Go",
          shotTitle: `Shot ${shotNumber}: Production beat`,
          shotNumber,
          budgetTier: "zero_budget",
          estimatedSetupMinutes: 10,
          cinematicIntent: "Soft phone-friendly key light with readable face detail and gentle shadow contrast.",
          floorPlan: {
            actor: { characterName: "Priya", facingDirection: "facing camera, slight three-quarter turn" },
            keyLight: { role: "KEY", householdGearName: "Window light", professionalGearName: "Aputure 600d equivalent", position: "front-left at 45 degrees" },
          },
          gearCards: [
            { cardNumber: 1, roleLabel: "KEY LIGHT", itemName: "Window light", setupBullets: ["Place actor near window", "Turn face toward soft light", "Keep eyes bright"] },
            { cardNumber: 2, roleLabel: "FILL LIGHT", itemName: "White A4 paper", setupBullets: ["Bounce from shadow side", "Keep fill low", "Avoid flattening face"] },
            { cardNumber: 3, roleLabel: "RIM LIGHT", itemName: "Phone flashlight", setupBullets: ["Place behind shoulder", "Diffuse with white plastic", "Keep edge subtle"] },
            { cardNumber: 4, roleLabel: "NEGATIVE FILL", itemName: "Black dupatta", setupBullets: ["Place on shadow side", "Keep out of frame", "Increase face shape"] },
            { cardNumber: 5, roleLabel: "DIFFUSER", itemName: "White bedsheet", setupBullets: ["Hang between window and actor", "Keep fabric smooth", "Check exposure"] },
            { cardNumber: 6, roleLabel: "CAMERA RIG", itemName: "Phone tripod", setupBullets: ["Lock phone vertical", "Set lens to 1x", "Frame upper third"] },
          ],
        },
        cameraPlanSheetTag: {
          projectTitle: "She Almost Didn't Go",
          shotNumber,
          shotTitle: `Shot ${shotNumber}: Production beat`,
          fps: 24,
          shotType: shotNumber % 2 ? "CU" : "MS",
          cameraAngle: "Eye Level",
          cameraMovement: shotNumber % 2 ? "Static" : "Slow Push-In",
          lensSuggestion: "Mobile 1x Wide",
          screenType: body.screenType || "vertical",
          blockingMap: {
            actors: [{ characterName: "Priya", age: 27, heightImpression: "average", startPosition: "center mark", endPosition: "center mark", movementPath: "static", movementDistanceFeet: 0 }],
            oneEightyLineNote: "No 180 line concern (single subject).",
          },
          framePreview: {
            aspectRatio: body.screenType === "horizontal" ? "16:9" : "9:16",
            headroomPercent: 10,
            leadRoomPercent: 25,
            subjectPlacement: "center frame, eyes on upper third",
            captionPosition: "bottom",
            mobileFocusArea: "Keep face and hands inside central 50 percent safe zone",
            lensCompressionFeel: "Natural mobile wide depth",
          },
          cameraRig: {
            cameraBody: "iPhone 14 Pro",
            lensSuggestion: "Mobile 1x Wide",
            fps: 24,
            shutterAngle: "180 degrees (1/48s)",
            iso: "auto",
            aperture: "f/1.78 (1x lens fixed)",
            whiteBalance: "auto",
            filter: "none",
          },
          movementSpec: { moveType: shotNumber % 2 ? "Static" : "Slow Push-In", speed: "slow", stabilizationRequired: shotNumber % 2 === 0, stabilizationTool: "phone tripod", rigType: "Phone tripod" },
        },
      };
    });
    return {
      data: {
        storyboardId: "storyboard-script-mock",
        scriptId,
        projectId: body.projectId || "00000000-0000-4000-8000-000000000001",
        ideaId: body.ideaId || "idea-she-almost",
        title: "She Almost Didn't Go",
        screenType: body.screenType || "vertical",
        renderWidth: body.screenType === "horizontal" ? 1280 : 1024,
        renderHeight: body.screenType === "horizontal" ? 720 : 1792,
        durationSeconds: 30,
        totalShots: scenes.length,
        status: "GENERATED",
        scenes,
        createdAt: new Date().toISOString(),
      }
    };
  }

  const tenantWalletMatch = key.match(/^\/billing\/([^/]+)\/wallet$/);
  if (tenantWalletMatch) {
    const [, tenantId] = tenantWalletMatch;
    return {
      data: {
        tenantId,
        balance: 1250,
        currency: "INR",
        lastUpdated: Date.now()
      }
    };
  }

  const tenantWalletRechargeMatch = key.match(/^\/billing\/([^/]+)\/wallet\/recharge$/);
  if (tenantWalletRechargeMatch) {
    const [, tenantId] = tenantWalletRechargeMatch;
    return {
      data: {
        tenantId,
        success: true,
        rechargeId: "wallet-recharge-mock",
        transactionId: "txn_creator_recharge_mock",
        currency: "INR",
        paymentUrl: "https://billing.dalaillama.in/mock/recharge"
      }
    };
  }

  if (key === "/tenants/me/apps") {
    return {
      data: [
        {
          id: "tenant-app-creator-mock",
          tenantId: "tenant-demo",
          subscriptionId: "sub-creator-mock",
          appType: "CREATOR",
          displayName: "Creator AI Short Planner",
          productCode: "CREATOR",
          planCode: "CREATOR_PRO",
          deploymentStatus: "COMPLETED",
          status: "ACTIVE",
          createdAt: "2026-05-14T10:00:00.000Z",
          url: "https://creator-demo.dalaillama.in"
        }
      ]
    };
  }

  if (key === "/subscriptions" && method === "POST") {
    return {
      data: {
        subscriptionId: "sub-creator-mock",
        status: "PENDING_PROVISION",
        requiredAmount: 0,
        productCode: "CREATOR",
        planCode: "CREATOR_PRO"
      }
    };
  }

  const subscriptionStatusMatch = key.match(/^\/subscriptions\/([^/]+)$/);
  if (subscriptionStatusMatch) {
    const [, subscriptionId] = subscriptionStatusMatch;
    return {
      data: {
        subscriptionId,
        status: "ACTIVE",
        productCode: "CREATOR",
        planCode: "CREATOR_PRO"
      }
    };
  }

  const tenantSubscriptionMatch = key.match(/^\/tenants\/([^/]+)\/subscriptions\/([^/]+)$/);
  if (tenantSubscriptionMatch) {
    const [, tenantId, subscriptionId] = tenantSubscriptionMatch;
    return {
      data: {
        id: "mock-subscription-detail",
        tenantId,
        subscriptionId,
        appType: "CONTACT_CENTER",
        displayName: "AI Contact Center",
        subdomain: "cc-acme",
        productCode: "AI_CC",
        planCode: "AI_CC_PROFESSIONAL",
        planTier: "PROFESSIONAL",
        deploymentStatus: "COMPLETED",
        createdAt: "2026-05-09T14:23:11.482+00:00",
        deployedAt: "2026-05-09T14:31:47.215Z",
        adminUsername: "admin@acmecorp.com",
        adminPassword: "ChangeMe@123",
        appPanels: [
          {
            appType: "CONTACT_CENTER",
            displayName: "Agent Dashboard",
            subdomain: "agent",
            url: "https://agent-acme.dalaillama.in",
            displayOrder: 0,
            keycloakClientId: "agent-ui",
            requiredRoles: "AGENT",
          },
          {
            appType: "SUPERVISOR",
            displayName: "Supervisor Dashboard",
            subdomain: "supervisor",
            url: "https://supervisor-acme.dalaillama.in",
            displayOrder: 1,
            keycloakClientId: "supervisor-ui",
            requiredRoles: "SUPERVISOR,AGENT",
          },
          {
            appType: "ADMIN_PANEL",
            displayName: "Admin Panel",
            subdomain: "admin",
            url: "https://admin-acme.dalaillama.in",
            displayOrder: 2,
            keycloakClientId: "admin-ui",
            requiredRoles: "ADMIN,SUPERVISOR,AGENT",
          },
        ],
        dashboardUrl: "https://admin-acme.dalaillama.in",
        agentSeats: 25,
        maxAgents: 25,
        maxSupervisors: 5,
        didDisplayNumber: "+91 98765 43210",
      },
    };
  }

  const creatorStoryboardMatch = key.match(/^\/creator\/storyboard\/([^/]+)$/);
  if (creatorStoryboardMatch) {
    const [, projectId] = creatorStoryboardMatch;
    return {
      data: {
        projectId,
        title: "She Almost Didn't Go",
        durationSeconds: 30,
        ideas: MOCK_RESPONSES["/creator/ideas/generate"].ideas,
        scenes: [
          { id: "scene-01", timestamp: "0-2 sec", description: "Priya sits at the edge of her bed, gym bag untouched.", vo: "I almost didn't go today.", shotType: "Wide bedroom still" },
          { id: "scene-02", timestamp: "2-4 sec", description: "Close-up of her thumb hovering over a cancel alarm.", vo: "My mind had already made excuses.", shotType: "Insert close-up" },
          { id: "scene-03", timestamp: "4-6 sec", description: "She looks at herself in the mirror, unsure but awake.", vo: "But something felt different.", shotType: "Mirror medium" },
          { id: "scene-04", timestamp: "6-8 sec", description: "Shoes hit the floor beside the bed.", vo: "Not motivation. Just a tiny push.", shotType: "Low angle detail" },
          { id: "scene-05", timestamp: "8-10 sec", description: "Priya ties her laces slowly.", vo: "I told myself: only ten minutes.", shotType: "Hands close-up" },
          { id: "scene-06", timestamp: "10-12 sec", description: "Apartment door opens into morning light.", vo: "That was enough to start.", shotType: "Backlit doorway" },
          { id: "scene-07", timestamp: "12-14 sec", description: "She walks past a glass storefront reflection.", vo: "No dramatic change. No perfect plan.", shotType: "Tracking side shot" },
          { id: "scene-08", timestamp: "14-16 sec", description: "Priya enters the gym and pauses near the entrance.", vo: "Just me, showing up scared.", shotType: "Wide gym entrance" },
          { id: "scene-09", timestamp: "16-18 sec", description: "She adjusts a light dumbbell with both hands.", vo: "And still showing up.", shotType: "Object close-up" },
          { id: "scene-10", timestamp: "18-20 sec", description: "First gentle rep, awkward but real.", vo: "The first rep was not pretty.", shotType: "Medium action" },
          { id: "scene-11", timestamp: "20-22 sec", description: "She smiles faintly after finishing the set.", vo: "But it was mine.", shotType: "Close-up reaction" },
          { id: "scene-12", timestamp: "22-24 sec", type: "text", description: "Text card with the core emotional line.", vo: "Just one decision... to show up.", shotType: "Text on screen" },
          { id: "scene-13", timestamp: "24-28 sec", description: "Priya walks out brighter, gym bag on shoulder.", vo: "Tomorrow can be bigger.", shotType: "Exit tracking shot" },
          { id: "scene-14", timestamp: "End Frame", description: "Final frame: Priya outside, morning city behind her.", vo: "Today, I just began.", shotType: "Hero end frame" }
        ]
      },
    };
  }

  const creatorRegenerateSceneMatch = key.match(/^\/creator\/storyboard\/([^/]+)\/scenes\/([^/]+)\/regenerate$/);
  if (creatorRegenerateSceneMatch) {
    const [, projectId, sceneId] = creatorRegenerateSceneMatch;
    return {
      data: {
        projectId,
        sceneId,
        status: "queued",
        message: "Scene image regeneration queued"
      },
    };
  }

  const creatorExportMatch = key.match(/^\/creator\/export\/([^/]+)$/);
  if (creatorExportMatch) {
    const [, exportId] = creatorExportMatch;
    return {
      data: {
        exportId,
        status: "ready",
        downloadUrl: "/mocks/storyboard/she-almost-storyboard.pdf"
      },
    };
  }

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
  prepareHeaders: (headers, { getState }) => {
    const token = getAccessToken() || localStorage.getItem("auth_token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const state = /** @type {any} */ (getState?.() || {});
    const tenantId = state.tenant?.tenantId || state.auth?.user?.tenantId || localStorage.getItem("tenantId");
    if (tenantId) headers.set("X-Tenant-ID", String(tenantId));
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

/** @param {unknown} args */
const getRequestPath = (args) => {
  if (typeof args === "string") return args;
  if (args && typeof args === "object" && "url" in args) {
    return String(/** @type {{ url?: unknown }} */ (args).url || "");
  }
  return "";
};

/** @param {string} path */
const isTenantOnboardingProbe = (path) => {
  const normalized = path.split("?")[0].replace(/^\/api\/v1/, "");
  return normalized === "/tenants/me" || normalized === "/me";
};

/* -------------------------------------------------------------------------- */
/*                        WRAPPED BASE QUERY (FINAL)                          */
/* -------------------------------------------------------------------------- */

/**
 * @type {import("@reduxjs/toolkit/query").BaseQueryFn}
 */
const baseQueryWithMetrics = async (args, api, extra) => {
  const start = performance.now();
  const requestPath = getRequestPath(args);

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
    } else if (status === 403 && !isTenantOnboardingProbe(requestPath)) {
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
    const serverMessage = error.message || "Something went wrong. Please try again.";
    api.dispatch(showFlash({ message: serverMessage, type: "error" }));
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
  tagTypes: ["CreatorTrends", "CreatorMasterData", "CreatorProfiles", "Storyboard", "CreatorWallet", "CreatorSubscription", "CreatorOrganization", "CreatorAiProviders", "CreatorProjects"],

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
      providesTags: ["CreatorWallet"],
    }),
    addWalletBalance: builder.mutation({
      query: (/** @type {{ tenantId?: string, amount?: number, currency?: string, [key: string]: any } | undefined} */ body) => {
        const { tenantId, ...payload } = body || {};
        return {
          url: tenantId ? `/billing/${tenantId}/wallet/recharge` : "/wallet/add-balance",
          method: "POST",
          body: payload,
        };
      },
      invalidatesTags: ["CreatorWallet"],
    }),

    getLiveCall: builder.query({
      /** @param {void} _ */
      query: (_) => "/calls/live",
    }),

    saveDisposition: builder.mutation({
      query: (/** @type {{ disposition?: string, notes?: string, ts?: number, [key: string]: any }} */ body) => ({
        url: "/calls/disposition",
        method: "POST",
        body,
      }),
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
       * @param {Record<string, any>} body
       */
      query: (body) => ({
        url: "/agent/add",
        method: "POST",
        body
      })
    }),
    updateAgent: builder.mutation({
      /**
       * @param {Record<string, any>} body
       */
      query: (body) => ({
        url: "/agent/update",
        method: "PUT",
        body
      })
    }),
    disableAgent: builder.mutation({
      /**
       * @param {Record<string, any>} body
       */
      query: (body) => ({
        url: "/agent/disable",
        method: "post",
        body
      })
    }),
    addQueue: builder.mutation({
      /**
       * @param {Record<string, any>} body
       */
      query: (body) => ({
        url: "/queue/add",
        method: "POST",
        body
      })
    }),
    updateQueue: builder.mutation({
      /**
       * @param {Record<string, any>} body
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
       * @param {Record<string, any>} body
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
       * @param {Record<string, any>} body
       */
      query: (body) => ({
        url: "/routingrule/save",
        method: "POST",
        body
      })
    }),
    deleteRoutingRule: builder.mutation({
      /**
       * @param {Record<string, any>} body
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
    getTenantSubscriptionDetails: builder.query({
      /** @param {{ tenantId: string, subscriptionId: string }} params */
      query: ({ tenantId, subscriptionId }) => `/tenants/${tenantId}/subscriptions/${subscriptionId}`,
      transformResponse: (response) => unwrapJavaTypedJson(response),
    }),
    /* ---------------- TENANT APPS & PROVISIONING ---------------- */
    getMyApps: builder.query({
      query: () => "/tenants/me/apps",
      transformResponse: (response) => unwrapJavaTypedJson(response),
    }),
    retryProvision: builder.mutation({
      query: (tenantAppId) => ({
        url: `/tenants/apps/${tenantAppId}/retry`,
        method: "POST",
      }),
    }),
    deleteApp: builder.mutation({
      query: (tenantAppId) => ({
        url: `/tenants/apps/${tenantAppId}`,
        method: "DELETE",
      }),
    }),
    getTenantApp: builder.query({
      query: (tenantAppId) => `/tenants/apps/${tenantAppId}`,
      transformResponse: (response) => unwrapJavaTypedJson(response),
    }),
    getProvisionStatus: builder.query({
      query: (tenantAppId) => `/tenants/apps/${tenantAppId}/provision/status`,
    }),
    /* ---------------- DID MANAGEMENT ---------------- */
    getMyDids: builder.query({
      query: () => "/tenants/me/dids",
    }),
    releaseDid: builder.mutation({
      query: (didId) => ({
        url: `/tenants/me/dids/${didId}`,
        method: "DELETE",
      }),
    }),
    cancelSubscription: builder.mutation({
      query: (subscriptionId) => ({
        url: `/tenants/me/subscriptions/${subscriptionId}`,
        method: "DELETE",
      }),
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
       * @param {Record<string, any>} body
       */
      query: (body) => ({
        url: "/monitor/call",
        method: "POST",
        body
      })
    }),
    whisperToAgent:builder.mutation({
      /**
       * @param {Record<string, any>} body
       */
      query: (body) => ({
        url: "/whisper/agent",
        method: "POST",
        body
      })
    }),
    bargeInCall:builder.mutation({
      /**
       * @param {Record<string, any>} body
       */
      query: (body) => ({
        url: "/barge/call",
        method: "POST",
        body
      })
    }),
    takeoverCall:builder.mutation({
      /**
       * @param {Record<string, any>} body
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
       * @param {Record<string, any>} body
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
       * @param {Record<string, any>} body
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
       * @param {Record<string, any>} body
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
  useSaveDispositionMutation,
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
  useLazyGetTenantSubscriptionDetailsQuery,

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
  useSearchAvailableDidsQuery,
  useGetMyAppsQuery,
  useRetryProvisionMutation,
  useDeleteAppMutation,
  useLazyGetTenantAppQuery,
  useGetProvisionStatusQuery,
  useLazyGetProvisionStatusQuery,
  useGetMyDidsQuery,
  useReleaseDidMutation,
  useCancelSubscriptionMutation,
} = api;
