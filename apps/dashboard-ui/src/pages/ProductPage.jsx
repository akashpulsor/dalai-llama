// @ts-check
// apps/dashboard-ui/src/pages/ProductPage.jsx

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Phone,
  ArrowRight,
  PhoneCall,
  X,
  Search,
  ShoppingBag,
  LogOut,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Menu,
  CreditCard,
  UserCheck,
  BarChart3,
  Loader2,
  Cpu,
  Sparkles,
  Wallet,
  ChevronDown,
  User,
  Plus,
  History,
  AlertTriangle,
  Globe,
  RefreshCw
} from "lucide-react";

import TenantSetupCard from "./components/TenantSetupCard.jsx";
import NumberPicker from "./components/NumberPicker.jsx";
import { PaymentGateway } from "./components/PaymentGateway.jsx";
import { ActivationSuccess } from "./components/ActivationSuccess.jsx";
// 1. Import PlanSelector and add PlanPricing type at top
import { PlanSelector } from "./components/PlanSelector.jsx";

import KYCBadge from "./components/KYCBadge.jsx";

import {
  clearTenant,
  selectTenantId,
  setTenantIdentity,
  useAddWalletBalanceMutation,
  useGetMyTenantQuery,
  useGetProductsQuery,
  useGetProductPlansQuery,
  useGetWalletBalanceQuery,
} from "@dalaillama/shared-store";
import { useKeycloakLogoutMutation } from "@dalaillama/shared-hooks/keycloakApi";
/* ============================================================================
 * TYPE DEFINITIONS & CONSTANTS
 * ========================================================================== */
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 2000; 

/* ============================================================================
 * TYPES
 * ========================================================================== */
// 2. Add type imports (after existing typedefs)
/**
 * @typedef {import('./components/PlanSelector.jsx').PlanPricing} PlanPricing
 */

/**
 * @typedef {Object} PlanSelection
 * @property {PlanPricing} plan
 * @property {number} agentCount
 */

/** @typedef {'AI_CONTACT_CENTER'|'CONVERSATIONAL_IVR'|'BASIC_PBX'|'OUTBOUND_DIALER'|'VIRTUAL_RECEPTIONIST'} ProductType */
/** @typedef {'SHARED'|'DEDICATED'} DeploymentModel */
/** @typedef {'TENANT_INFO'|'NUMBER_PICKER'|'PLAN_SELECTION'|'PAYMENT'|'SUCCESS'} WizardStep */

/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} code
 * @property {string} name
 * @property {string} description
 * @property {ProductType} type
 * @property {boolean} active
 * @property {Object.<string, boolean>} [features] - Key-value map of feature flags.
 */

/**
 * @typedef {Object} TenantInfo
 * @property {string} name
 * @property {string} companyName
 * @property {string} primaryContactName
 * @property {string} primaryContactEmail
 * @property {string} primaryContactPhone
 * @property {string} country
 * @property {string} timezone
 * @property {string} productCode
 * @property {DeploymentModel} deploymentModel
 */

/**
 * @typedef {Object} AvailableDid
 * @property {string} number
 * @property {string} country
 * @property {string} city
 * @property {string} type
 * @property {string} monthlyFee
 * @property {string } setupFee
 * @property {string} provider
 * @property {string} currency
 * @property {string} inboundPrice
 * @property {string} outboundPrice
 */

/* ============================================================================
 * CONFIG
 * ========================================================================== */

/** @type {WizardStep[]} */
const STEPS = ["TENANT_INFO", "NUMBER_PICKER", "PLAN_SELECTION", "PAYMENT", "SUCCESS"];

/**
 * @returns {TenantInfo}
 */
const createInitialTenantInfo = () => ({
  name: "",
  companyName: "",
  primaryContactName: "",
  primaryContactEmail: "",
  primaryContactPhone: "",
  country: "IN",
  timezone: "Asia/Kolkata",
  productCode: "",
  deploymentModel: /** @type {DeploymentModel} */ ("SHARED"),
});

const DEFAULT_CURRENCY = "INR";
const sanitizeTenantId = (tenantId) => {
  if (!tenantId) return null;
  const normalized = String(tenantId).trim();
  return normalized && normalized.toLowerCase() !== "default" ? normalized : null;
};

const BRANDED_SPINNER = "h-10 w-10 animate-spin rounded-full border-[3px] border-purple-600/20 border-t-purple-600 shadow-[0_0_0_6px_rgba(168,85,247,0.08)]";

const formatCurrencyAmount = (amount, currency = DEFAULT_CURRENCY) => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: amount >= 1000 ? 0 : 2,
    }).format(Number(amount || 0));
  } catch {
    return `${currency} ${Number(amount || 0).toLocaleString("en-IN")}`;
  }
};

const extractNumericPrice = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const extractProductStartingPrice = (product, plans) => {
  const productCandidates = [
    product?.minimumPrice,
    product?.minimum_price,
    product?.minPrice,
    product?.min_price,
    product?.startingPrice,
    product?.starting_price,
    product?.monthlyPrice,
    product?.monthly_price,
    product?.price,
    product?.amount,
    product?.pricing?.minimumPrice,
    product?.pricing?.minimum_price,
    product?.pricing?.startingPrice,
    product?.pricing?.starting_price,
    product?.pricing?.monthlyPrice,
    product?.pricing?.monthly_price,
    product?.pricing?.price,
    product?.pricing?.amount,
  ]
    .map(extractNumericPrice)
    .filter((value) => value != null);

  if (productCandidates.length) {
    return {
      amount: Math.min(...productCandidates),
      currency:
        product?.currency ||
        product?.pricing?.currency ||
        DEFAULT_CURRENCY,
    };
  }

  const planPrices = (Array.isArray(plans) ? plans : [])
    .map((plan) => {
      const candidate =
        extractNumericPrice(plan?.minimumPrice) ??
        extractNumericPrice(plan?.minimum_price) ??
        extractNumericPrice(plan?.platformFee) ??
        extractNumericPrice(plan?.platform_fee) ??
        extractNumericPrice(plan?.monthlyFee) ??
        extractNumericPrice(plan?.monthly_fee) ??
        extractNumericPrice(plan?.price) ??
        extractNumericPrice(plan?.amount);

      if (candidate == null) return null;

      return {
        amount: candidate,
        currency:
          plan?.currency ||
          plan?.billingCurrency ||
          plan?.billing_currency ||
          DEFAULT_CURRENCY,
      };
    })
    .filter(Boolean);

  if (!planPrices.length) return null;

  return planPrices.reduce((lowest, current) =>
    current.amount < lowest.amount ? current : lowest
  );
};

const BrandedLoaderScreen = ({ title, description }) => (
  <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB] px-4">
    <div className="w-full max-w-sm rounded-[2rem] border border-purple-100 bg-white p-8 text-center shadow-[0_24px_80px_rgba(88,28,135,0.08)]">
      <div className={`mx-auto mb-5 ${BRANDED_SPINNER}`} />
      <h1 className="mb-2 text-lg font-bold text-slate-900">{title}</h1>
      <p className="text-sm leading-6 text-slate-500">{description}</p>
    </div>
  </div>
);

const ProductStartingPrice = ({ product }) => {
  const { data: plansData = [] } = useGetProductPlansQuery(product.code, {
    skip: !product?.code,
  });

  const startingPrice = useMemo(
    () => extractProductStartingPrice(product, plansData),
    [plansData, product]
  );

  if (!startingPrice) {
    return (
      <>
        <span className="mb-1 block text-xs font-bold uppercase tracking-[0.08em] text-slate-400">Pricing</span>
        <span className="text-sm font-bold text-slate-500 sm:text-base">View plans</span>
      </>
    );
  }

  return (
    <>
      <span className="mb-1 block text-xs font-bold uppercase tracking-[0.08em] text-slate-400">Starts At</span>
      <span className="text-lg font-bold text-slate-900 sm:text-xl">
        {formatCurrencyAmount(startingPrice.amount, startingPrice.currency)}
        <span className="ml-1 text-xs font-medium text-slate-400">/mo</span>
      </span>
    </>
  );
};

/* ============================================================================
 * MAIN PAGE
 * ========================================================================== */

/**
 * @param {{ demo?: boolean; initialTenantInfo?: Partial<TenantInfo> }} props
 */
export default function ProductPage({ demo = true, initialTenantInfo }) {
  const dispatch = useDispatch();
  const reduxTenantId = sanitizeTenantId(useSelector(selectTenantId));
  const authTenantId = sanitizeTenantId(useSelector((s) => s.auth.user?.tenantId || null));
  /* ------------------------------------------------------------------------
   * TENANT GATE (MOST IMPORTANT PART)
   * ---------------------------------------------------------------------- */

  /** @type {[string|null, React.Dispatch<React.SetStateAction<string|null>>]} */
  const [localTenantId, setLocalTenantId] = useState(() => {
    return sanitizeTenantId(localStorage.getItem("tenantId"));
  });
  const tenantId = reduxTenantId || sanitizeTenantId(localTenantId) || authTenantId;

  useEffect(() => {
    const resolvedTenantId = sanitizeTenantId(reduxTenantId || authTenantId);
    if (!resolvedTenantId || resolvedTenantId === localTenantId) return;

    localStorage.setItem("tenantId", resolvedTenantId);
    setLocalTenantId(resolvedTenantId);
    dispatch(setTenantIdentity({ tenantId: resolvedTenantId }));
  }, [authTenantId, dispatch, localTenantId, reduxTenantId]);

  /* ------------------------------------------------------------------------
   * API
   * ---------------------------------------------------------------------- */

  const { data, isLoading, isError, refetch } = useGetProductsQuery(undefined);
  const {
    data: myTenant,
    isFetching: isMyTenantLoading,
    refetch: refetchMyTenant,
  } = useGetMyTenantQuery();
  const walletTenantId = tenantId ?? undefined;
  const { data: walletData, refetch: refetchWallet } = useGetWalletBalanceQuery(walletTenantId, { skip: !walletTenantId });
  const [addWalletBalance] = useAddWalletBalanceMutation();
  /** @type {Product[]} */
  const products = Array.isArray(data) ? data : [];
  const [keycloakLogout] = useKeycloakLogoutMutation();

  /** @type {(tenant: any) => Promise<void>} */
  const handleTenantCreated = useCallback(async (tenant) => {
    const nextTenantId = tenant?.id ?? tenant?.tenantId ?? tenant;
    const nextSlug = tenant?.slug ?? null;

    if (!nextTenantId) return;

    localStorage.setItem("tenantId", nextTenantId);
    if (nextSlug) {
      localStorage.setItem("tenant_slug", nextSlug);
      localStorage.setItem(
        "dashboard_tenant_context",
        JSON.stringify({ tenantId: nextTenantId, slug: nextSlug })
      );
    }

    dispatch(
      setTenantIdentity({
        tenantId: nextTenantId,
        slug: nextSlug,
        name: tenant?.name ?? null,
        companyName: tenant?.company_name ?? tenant?.companyName ?? null,
      })
    );
    setLocalTenantId(nextTenantId);
    setIsTenantSetupDismissed(false);
    setWizardStep(1);
    try {
      const refreshed = await refetchMyTenant();
      if (refreshed?.data?.hasTenant && !refreshed?.data?.needsOnboarding) {
        setIsSettingUpOrg(false);
      }
    } catch (error) {
      console.error("Failed to refresh /tenants/me after tenant setup:", error);
    }
  }, [dispatch, refetchMyTenant]);


  /* ------------------------------------------------------------------------
   * STATE
   * ---------------------------------------------------------------------- */

  const [search, setSearch] = useState("");
  const [wizardStep, setWizardStep] = useState(0);

    const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  /** @type {React.MutableRefObject<ReturnType<typeof setTimeout> | null>} */
  const retryTimerRef = useRef(null);

/** @type {[PlanSelection | null, React.Dispatch<React.SetStateAction<PlanSelection | null>>]} */
  const [planSelection, setPlanSelection] = useState(/** @type {PlanSelection | null} */ (null));

  // Background Auto-Retry Logic
  useEffect(() => {
    if (isError && retryCount < MAX_RETRIES) {
      setIsRetrying(true);
      const nextDelay = Math.pow(2, retryCount) * RETRY_DELAY_BASE;
      
      retryTimerRef.current = setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        refetch();
      }, nextDelay);
    } else if (!isError) {
      setRetryCount(0);
      setIsRetrying(false);
    }

    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, [isError, retryCount, refetch]);


  /** @type {[Product | null, React.Dispatch<React.SetStateAction<Product | null>>]} */
  const [activeProduct, setActiveProduct] = useState(
    /** @type {Product | null} */ (null)
  );


    /** * Controls the visual state of the sidebar navigation.
   * @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} 
   */
  const [isExpanded, setIsExpanded] = useState(true);

  /** @type {[TenantInfo, React.Dispatch<React.SetStateAction<TenantInfo>>]} */
  const [tenantInfo, setTenantInfo] = useState(() => ({
    ...createInitialTenantInfo(),
    ...(initialTenantInfo || {}),
  }));

  /** @type {[AvailableDid | null, React.Dispatch<React.SetStateAction<AvailableDid | null>>]} */
  const [selectedDid, setSelectedDid] = useState(
    /** @type {AvailableDid | null} */ (null)
  );

  const balance = walletData?.balance ?? 0;
  const balanceCurrency = walletData?.currency || DEFAULT_CURRENCY;
  const [kycStatus] = useState("action_required"); 

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSettingUpOrg, setIsSettingUpOrg] = useState(false);
  const [isTenantSetupDismissed, setIsTenantSetupDismissed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const needsOnboarding = Boolean(myTenant?.needsOnboarding);

  useEffect(() => {
    if (!myTenant) return;

    if (myTenant.hasTenant && myTenant.tenantId) {
      const nextTenantId = sanitizeTenantId(myTenant.tenantId);
      const nextSlug = myTenant.slug ?? null;

      if (nextTenantId) {
        localStorage.setItem("tenantId", nextTenantId);
        setLocalTenantId(nextTenantId);
      }
      if (nextSlug) {
        localStorage.setItem("tenant_slug", nextSlug);
        localStorage.setItem(
          "dashboard_tenant_context",
          JSON.stringify({ tenantId: nextTenantId, slug: nextSlug })
        );
      }

      dispatch(
        setTenantIdentity({
          tenantId: nextTenantId,
          slug: nextSlug,
          name: myTenant.name ?? null,
        })
      );
      return;
    }

    if (myTenant.hasTenant === false) {
      localStorage.removeItem("tenantId");
      localStorage.removeItem("tenant_slug");
      localStorage.removeItem("dashboard_tenant_context");
      setLocalTenantId(null);
      dispatch(clearTenant());
    }
  }, [dispatch, myTenant]);

  useEffect(() => {
    if (isMyTenantLoading) return;

    if (needsOnboarding && !isSettingUpOrg && !isTenantSetupDismissed && !isLoggingOut) {
      setIsSettingUpOrg(true);
      setWizardStep(0);
    }
  }, [isLoggingOut, isMyTenantLoading, isSettingUpOrg, isTenantSetupDismissed, needsOnboarding]);

  useEffect(() => {
    if (!needsOnboarding && (tenantId || myTenant?.hasTenant) && isSettingUpOrg && wizardStep === 0) {
      setIsSettingUpOrg(false);
    }
  }, [isSettingUpOrg, myTenant?.hasTenant, needsOnboarding, tenantId, wizardStep]);
  /* ------------------------------------------------------------------------
   * HANDLERS
   * ---------------------------------------------------------------------- */

  const selectProduct = useCallback(
    /** @param {Product} product */
    (product) => {
      setActiveProduct(product);
      if (!tenantId) {
      setIsTenantSetupDismissed(false);
      setIsSettingUpOrg(true);
      setWizardStep(0);
    } else {
      setWizardStep(1);
    };
      setTenantInfo((p) => ({ ...p, productCode: product.code }));
    },
    [tenantId]
  );

  /** @type {(did: AvailableDid, tenantId: string) => void} */
  const handleDidSelect = useCallback((did, incomingTenantId) => {
    console.log("Selected DID:", did);

    if (!tenantId && incomingTenantId) {
      localStorage.setItem("tenantId", incomingTenantId);
      setLocalTenantId(incomingTenantId);
      dispatch(setTenantIdentity({ tenantId: incomingTenantId }));
    }

    setSelectedDid(did);
    setIsSettingUpOrg(false);
    setWizardStep(2);
  }, [dispatch, tenantId]);

  /** @type {(plan: PlanPricing, agentCount: number) => void} */
  const handlePlanSelect = useCallback((plan, agentCount) => {
    setPlanSelection({ plan, agentCount });
    setWizardStep(3);
  }, []);

  const handlePaymentComplete = useCallback(() => {
    setWizardStep(4);
  }, []);

  /** @type {(amount?: number | null) => void} */
  const openRechargeModal = useCallback((amount = null) => {
    setRechargeAmount(amount ? String(Math.max(100, Math.ceil(amount))) : "");
    setShowRechargeModal(true);
  }, []);

  const closeRechargeModal = useCallback(() => {
    if (rechargeLoading) return;
    setShowRechargeModal(false);
    setRechargeAmount("");
  }, [rechargeLoading]);

  const handleRecharge = useCallback(async () => {
    const amount = Number(rechargeAmount);
    if (!tenantId || !Number.isFinite(amount) || amount < 100) return;

    setRechargeLoading(true);
    try {
      await addWalletBalance({ tenantId, amount, currency: balanceCurrency }).unwrap();
      await refetchWallet();
      setShowRechargeModal(false);
      setRechargeAmount("");
    } catch (error) {
      console.error("Recharge failed:", error);
    } finally {
      setRechargeLoading(false);
    }
  }, [addWalletBalance, balanceCurrency, rechargeAmount, refetchWallet, tenantId]);

  const closeWizard = useCallback(() => {
    setActiveProduct(null);
    setIsSettingUpOrg(false);
    setIsTenantSetupDismissed(true);
    setWizardStep(0);
    setSelectedDid(null);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await keycloakLogout(undefined).unwrap();
    } finally {
      localStorage.removeItem("tenantId");
      localStorage.removeItem("tenant_slug");
      localStorage.removeItem("dashboard_tenant_context");
      setLocalTenantId(null);
      dispatch(clearTenant());
      setIsTenantSetupDismissed(false);
      setShowProfileMenu(false);
      window.location.assign(window.location.origin + '/');
    }
  };


  /* ------------------------------------------------------------------------
   * DERIVED
   * ---------------------------------------------------------------------- */

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        String(p.name || "").toLowerCase().includes(q) ||
        String(p.description || "").toLowerCase().includes(q) ||
        String(p.code || "").toLowerCase().includes(q)
    );
  }, [products, search]);

  const totalAmount = useMemo(() => {
    if (!planSelection || !selectedDid) return 0;
    const plan = planSelection.plan;
    const agentCount = planSelection.agentCount;
    const extraAgents = Math.max(0, agentCount - plan.includedAgents);
    return (
      plan.platformFee +
      extraAgents * plan.perAgentFee +
      Number(selectedDid.setupFee)
    );
  }, [planSelection, selectedDid]);

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const userDisplayName = currentUser?.name || currentUser?.email || "Dashboard User";
  const userRole = currentUser?.role || "admin";
  const userInitials = userDisplayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(/** @param {string} part */ (part) => part[0]?.toUpperCase() || "")
    .join("") || "DU";

  const handleManualRetry = () => {
    setRetryCount(0);
    setIsRetrying(false);
    refetch();
  };


  /* ------------------------------------------------------------------------
   * WIZARD CONTENT
   * ---------------------------------------------------------------------- */

  const renderWizard = () => {
    if (!tenantId || isSettingUpOrg) {
      return (
        <TenantSetupCard
          authProfile={{ email: tenantInfo.primaryContactEmail }}
          onCreated={handleTenantCreated}
        />
      );
    }

    const currentStepName = STEPS[wizardStep];
    switch (currentStepName) {
      case "NUMBER_PICKER":
        return <NumberPicker tenantId={tenantId} onSelect={handleDidSelect} />;

      case "PLAN_SELECTION":
        return selectedDid && activeProduct ? (
          <PlanSelector
            productCode={activeProduct.code}
            selectedDid={selectedDid}
            onSelect={handlePlanSelect}
          />
        ) : null;

      case "PAYMENT":
        return planSelection && selectedDid ? (
          <PaymentGateway
            plan={planSelection.plan}
            selectedDid={selectedDid}
            agentCount={planSelection.agentCount}
            tenantId={/** @type {string} */ (tenantId)}
            productCode={activeProduct?.code || tenantInfo.productCode}
            onComplete={handlePaymentComplete}
            onRechargeRequired={openRechargeModal}
          />
        ) : null;

      case "SUCCESS":
        return (
          <ActivationSuccess
            number={selectedDid?.number || ""}
            planType={tenantInfo.deploymentModel}
          />
        );

      default:
        return null;
    }
  };

  /* ------------------------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------------------- */

  if (isLoading && !demo) {
    return <BrandedLoaderScreen title="Loading marketplace" description="Fetching the latest products and pricing for your workspace." />;
  }

  if (isError && !demo) {
        return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F9FAFB] p-6 animate-in fade-in duration-500">
        <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mx-auto mb-6 shadow-xl shadow-rose-100">
                <AlertTriangle size={36} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Connection Interrupted</h2>
            <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                Our servers are taking longer than usual to respond. We've tried reconnecting 3 times without success.
            </p>
            <div className="flex flex-col gap-3">
                <button 
                    onClick={handleManualRetry}
                    className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-slate-200"
                >
                    <RefreshCw size={18} />
                    <span>Try One More Time</span>
                </button>
                <button 
                    className="w-full bg-white border border-slate-200 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all text-sm"
                >
                    System Status
                </button>
            </div>
        </div>
      </div>
    );
  }

    // Combined logic for UI effects (blur/dim)
  const isAnyOverlayActive = !!activeProduct || isSettingUpOrg;
  const shouldBlockMainContent = (!tenantId && !isTenantSetupDismissed) || isAnyOverlayActive;
/* ------------------------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------------------- */

  if (isLoggingOut) {
    return <BrandedLoaderScreen title="Signing you out" description="Closing your session and returning to the login screen." />;
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#F9FAFB] text-[15px] text-slate-900 selection:bg-purple-100 md:flex-row">
      
      {/* SIDEBAR (Desktop) */}
      <aside className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-100 transition-all duration-500 ease-in-out ${isExpanded ? 'w-64' : 'w-20'}`}>
        {/* Toggle Button */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -right-3 top-24 w-6 h-6 bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-md z-50 text-slate-400 hover:text-purple-600 transition-colors"
        >
          {isExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        <div className={`h-20 flex items-center shrink-0 transition-all duration-300 ${isExpanded ? 'px-6' : 'px-0 justify-center'}`}>
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-100 shrink-0">
            <PhoneCall size={22} />
          </div>
          {isExpanded && <span className="ml-3 whitespace-nowrap text-base font-bold tracking-tight animate-in fade-in duration-500">DALAI LLAMA</span>}
        </div>

        <nav className={`px-3 space-y-1 mt-4 flex-grow transition-all duration-300 ${!isExpanded && 'flex flex-col items-center'}`}>
          {[
            { icon: LayoutDashboard, label: "Overview" },
            { icon: ShoppingBag, label: "Marketplace", active: true },
            { icon: BarChart3, label: "Analytics" },
            { icon: CreditCard, label: "Billing" },
            { icon: ShieldCheck, label: "Business KYC", highlight: kycStatus === 'action_required' },
            { icon: Settings, label: "Settings" },
          ].map(item => (
            <div 
              key={item.label} 
              className={`group flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all relative w-full ${
                item.active 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-100' 
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon size={20} className="shrink-0" />
              {isExpanded && <span className="whitespace-nowrap text-xs font-bold uppercase tracking-[0.08em] animate-in fade-in duration-500">{item.label}</span>}
              {item.highlight && (
                <div className={`absolute w-2 h-2 bg-rose-500 rounded-full animate-pulse ${isExpanded ? 'right-4' : 'top-2 right-2'}`} />
              )}
            </div>
          ))}
        </nav>

        {/* KYC Strategy Card - Sidebar Footer */}
        <div className={`px-3 transition-all duration-300 ${isExpanded ? 'mb-4' : 'mb-8'}`}>
          {isExpanded ? (
            <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl text-white shadow-xl shadow-slate-200 animate-in zoom-in-95 duration-300">
               <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-purple-500/20 rounded-lg">
                    <Sparkles size={14} className="text-purple-400" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-slate-300">Compliance</span>
               </div>
               <p className="mb-2 text-sm font-bold leading-tight">Upgrade Your Business Limits</p>
               <p className="mb-4 text-xs font-medium leading-relaxed text-slate-300">Complete KYC to unlock $10,000 monthly spending limit.</p>
               <div className="w-full bg-slate-700/50 h-1.5 rounded-full mb-4 overflow-hidden">
                  <div className="w-1/3 h-full bg-purple-500 rounded-full" />
               </div>
               <button className="w-full rounded-xl bg-purple-600 py-3 text-xs font-black uppercase tracking-[0.08em] text-white transition-all shadow-lg shadow-purple-900/20 hover:bg-purple-500">
                 Verify Business
               </button>
            </div>
          ) : (
            <div className="group relative flex justify-center">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 cursor-pointer hover:bg-rose-500 hover:text-white transition-all">
                <ShieldCheck size={20} />
              </div>
              <div className="absolute left-14 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all bg-slate-900 text-white p-3 rounded-2xl w-48 text-xs font-medium z-50">
                Complete KYC to unlock full limits
                <div className="absolute left-0 top-1/2 -translate-x-1 w-2 h-2 bg-slate-900 rotate-45" />
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto p-3 mb-4">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all group">
            <LogOut size={22} />
            {isExpanded && <span className="text-[11px] font-bold uppercase tracking-[0.1em]">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* MOBILE NAV BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t border-slate-100 bg-white px-4 py-3 shadow-2xl md:hidden">
        <LayoutDashboard className="text-slate-400" size={24} />
        <ShoppingBag className="text-purple-600" size={24} />
        <button
          type="button"
          onClick={() => setShowProfileMenu((prev) => !prev)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white -mt-8 shadow-xl shadow-purple-200"
          aria-label="Open account menu"
        >
          <Menu size={24} />
        </button>
        <BarChart3 className="text-slate-400" size={24} />
        <button
          onClick={handleLogout}
          className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400"
          aria-label="Log out"
        >
          <LogOut size={22} />
        </button>
      </nav>

      {/* MAIN CONTENT */}
      <main className={`w-full flex-grow transition-all duration-500 ${isExpanded ? "md:pl-64" : "md:pl-20"} ${shouldBlockMainContent ? "pointer-events-none scale-[0.99] opacity-40 blur-2xl" : ""}`}>
        
        {/* HEADER */}
        <header className="sticky top-0 z-40 flex min-h-20 flex-col gap-4 bg-[#F9FAFB]/80 px-4 py-4 backdrop-blur-xl sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-12">
          <div className="relative group w-full lg:max-w-xs">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-purple-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-100 bg-white py-3 pl-11 pr-5 text-base font-medium outline-none transition-all shadow-sm focus:ring-4 focus:ring-purple-100"
            />
          </div>
          <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:gap-4 lg:ml-auto lg:w-auto lg:flex-nowrap lg:justify-end lg:gap-6">
            {/* Credit Balance Card */}
            <div className="hidden items-center gap-3 bg-white border border-slate-100 p-1.5 pr-4 rounded-2xl shadow-sm transition-shadow cursor-pointer group hover:shadow-md xl:flex">
               <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all">
                  <Wallet size={18} />
               </div>
               <div>
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] leading-none text-slate-400">Balance</p>
                  <p className="text-sm font-bold text-slate-900">{formatCurrencyAmount(balance, balanceCurrency)}</p>
               </div>
               <button
                 type="button"
                 onClick={() => openRechargeModal()}
                 className="ml-2 flex h-6 w-6 items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100"
                 aria-label="Recharge wallet"
               >
                  <Plus size={14} />
               </button>
            </div>

            {/* Profile & Account Actions */}
            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={`flex items-center gap-3 rounded-2xl border p-1.5 pr-3 transition-all ${showProfileMenu ? "border-slate-200 bg-slate-50 shadow-inner" : "border-slate-100 bg-white shadow-sm hover:shadow-md"}`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white">
                  {userInitials}
                </div>
                <div className="hidden text-left sm:block">
                   <p className="mb-1 text-xs font-bold leading-none">{userDisplayName}</p>
                   <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">{userRole}</p>
                </div>
                <ChevronDown size={14} className={`text-slate-300 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 z-[60] mt-3 w-72 max-w-[calc(100vw-2rem)] rounded-3xl border border-slate-100 bg-white py-3 shadow-2xl animate-in fade-in slide-in-from-top-2">
                   <div className="px-5 py-3 border-b border-slate-50 mb-2">
                      <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-slate-400">Account</p>
                      <div className="space-y-3">
                         <div className="flex items-center gap-3 text-slate-600 hover:text-purple-600 cursor-pointer group">
                            <User size={18} className="text-slate-300 group-hover:text-purple-600" />
                            <span className="text-sm font-medium">My Profile</span>
                         </div>
                         <div className="flex items-center gap-3 text-slate-600 hover:text-purple-600 cursor-pointer group">
                            <History size={18} className="text-slate-300 group-hover:text-purple-600" />
                            <span className="text-sm font-medium">Activity Log</span>
                         </div>
                      </div>
                   </div>
                   <div className="px-5 py-3">
                      <KYCBadge status={/** @type {"verified" | "pending" | "action_required"} */ (kycStatus)} />

                   </div>
                   <div className="px-5 py-3 mt-2">
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 text-rose-500 hover:text-rose-600 py-2 border-t border-slate-50">
                         <LogOut size={16} />
                         <span className="text-sm font-bold">Log Out</span>
                      </button>
                   </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex w-full items-center gap-3 rounded-2xl border border-purple-100 bg-white px-3 py-3 shadow-sm xl:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
              <Wallet size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">Wallet Balance</p>
              <p className="truncate text-sm font-bold text-slate-900 sm:text-base">
                {formatCurrencyAmount(balance, balanceCurrency)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => openRechargeModal()}
              className="shrink-0 rounded-xl bg-purple-600 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-purple-200 transition-all hover:bg-purple-700"
            >
              Recharge
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-12 lg:py-10">
          <div className="mb-8 flex flex-col gap-5 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                Service Catalog
              </p>
              <h1 className="mb-3 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Marketplace
              </h1>
              <p className="text-xs font-medium leading-6 text-slate-500 sm:text-sm">
                Provision global voice infrastructure in 60 seconds.
              </p>
            </div>
            {kycStatus === 'action_required' && (
               <div className="flex w-full items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 sm:w-auto sm:px-5">
                  <AlertTriangle className="text-rose-500" size={20} />
                  <div>
                    <p className="mb-1 text-xs font-bold leading-none text-rose-900">KYC REQUIRED</p>
                    <p className="text-xs font-medium text-rose-600 sm:text-sm">Some services may be restricted.</p>
                  </div>
                  <button className="ml-2 text-xs font-black uppercase tracking-[0.08em] text-rose-500 hover:underline sm:ml-4">Fix Now</button>
               </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 xl:gap-8">
            {filteredProducts.map((p, index) => {
              const productKey = p.id || p.code || `${p.name || "product"}-${index}`;
              return (
                <div 
                  key={productKey}
                  onClick={() => selectProduct(p)}
                  className="group flex min-h-[320px] cursor-pointer flex-col rounded-[2rem] border border-slate-100 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-xl sm:rounded-[2.25rem] sm:p-8 lg:min-h-[360px] lg:p-10"
                >
                  <div className="mb-8 flex items-start justify-between sm:mb-10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 transition-all group-hover:bg-purple-600 group-hover:text-white sm:h-14 sm:w-14">
                      {String(p.type || p.code || "").includes("AI") ? <Cpu size={28} /> : <PhoneCall size={28} />}
                    </div>
                    <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest">Active</div>
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-slate-900 transition-colors group-hover:text-purple-600 sm:text-2xl">{p.name}</h3>
                  <p className="mb-8 flex-grow text-sm font-medium leading-6 text-slate-500 sm:mb-10">{p.description}</p>
                  <div className="flex items-center justify-between border-t border-slate-50 pt-6 sm:pt-8">
                    <div>
                      <ProductStartingPrice product={p} />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-purple-600 group-hover:text-white transition-all">
                      <ArrowRight size={20} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>


      {/* OVERLAY WIZARD */}
      {isAnyOverlayActive && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/10 p-0 backdrop-blur-sm animate-in fade-in duration-300 md:items-center md:p-6">
          <div className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-2xl animate-in slide-in-from-bottom-12 duration-500 md:max-h-[90vh] md:rounded-[3rem]">
            
            <div className="flex shrink-0 items-center justify-between border-b border-slate-50 p-5 md:p-8">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
                  {isSettingUpOrg ? <Globe size={20} className="md:w-6 md:h-6" /> : <Sparkles size={20} className="md:w-6 md:h-6" />}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm md:text-base text-slate-900 truncate">
                    {isSettingUpOrg ? "Setup Organization" : activeProduct?.name}
                  </h4>
                  <div className="flex gap-1.5 mt-1.5 md:mt-2">
                    {STEPS.map((s, idx) => (
                      <div key={s} className={`h-1 md:h-1.5 rounded-full transition-all duration-700 ${idx === wizardStep ? 'w-6 md:w-8 bg-purple-600' : idx < wizardStep ? 'w-3 md:w-4 bg-emerald-400' : 'w-1.5 md:w-2 bg-slate-100'}`} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={closeWizard}
                  className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 shrink-0"
                  aria-label="Close setup modal"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex flex-grow overflow-y-auto bg-white p-5 touch-pan-y md:p-8">
              <div className="w-full py-2">
                {renderWizard()}
              </div>
            </div>
            
            {/* Visual indicator for mobile dragging/home bar space */}
            <div className="h-4 md:hidden shrink-0" />
          </div>
        </div>
      )}

      {showRechargeModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Recharge Wallet</h3>
                <p className="mt-1 text-xs font-medium text-slate-500">Add funds before activating the subscription.</p>
              </div>
              <button
                type="button"
                onClick={closeRechargeModal}
                disabled={rechargeLoading}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 disabled:opacity-50"
                aria-label="Close recharge modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">Current Wallet Balance</p>
              <p className="mt-2 text-2xl font-black text-slate-900">
                {formatCurrencyAmount(balance, balanceCurrency)}
              </p>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-[10px] font-bold uppercase text-slate-400">Recharge Amount</label>
              <input
                type="number"
                min="100"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-purple-300 focus:ring-4 focus:ring-purple-100"
              />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {[500, 1000, 2000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRechargeAmount(String(preset))}
                  className={`rounded-2xl border px-3 py-3 text-xs font-bold transition-all ${
                    rechargeAmount === String(preset)
                      ? "border-purple-600 bg-purple-50 text-purple-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {formatCurrencyAmount(preset, balanceCurrency)}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleRecharge}
              disabled={rechargeLoading || Number(rechargeAmount) < 100}
              className="mt-5 w-full rounded-2xl bg-purple-600 py-4 text-sm font-bold text-white transition-all hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {rechargeLoading ? "Processing..." : "Recharge Wallet"}
            </button>
          </div>
        </div>
      )}
    </div>
  );

}
