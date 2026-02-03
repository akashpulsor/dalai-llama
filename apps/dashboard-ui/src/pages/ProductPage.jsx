// @ts-check
// apps/dashboard-ui/src/pages/ProductPage.jsx

import React, { useState, useCallback, useMemo } from "react";
import {

  ArrowLeft,
  Phone,
  PhoneOutgoing,
  UserCircle,
  ArrowRight,
  PhoneCall,
  Headphones,
  MessageSquare,
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
  HelpCircle,
  Menu,
  CreditCard,
  UserCheck,
  BarChart3,
  MapPin,
  Clock,
  Loader2,
  AlertCircle,
  Cpu,
  Sparkles,
  Wallet,
  ChevronDown,
  User,
  Plus,
  History,
  AlertTriangle,
  Globe
} from "lucide-react";

import TenantSetupCard from "./components/TenantSetupCard.jsx";
import NumberPicker from "./components/NumberPicker.jsx";
import { PaymentGateway } from "./components/PaymentGateway.jsx";
import { ActivationSuccess } from "./components/ActivationSuccess.jsx";
import {ProductCard} from "./components/ProductCard.jsx";
import KYCBadge from "./components/KYCBadge.jsx";

import { useGetProductsQuery } from "@dalaillama/shared-store";

/* ============================================================================
 * TYPES
 * ========================================================================== */

/** @typedef {'AI_CONTACT_CENTER'|'CONVERSATIONAL_IVR'|'BASIC_PBX'|'OUTBOUND_DIALER'|'VIRTUAL_RECEPTIONIST'} ProductType */
/** @typedef {'SHARED'|'DEDICATED'} DeploymentModel */
/** @typedef {'TENANT_INFO'|'NUMBER_PICKER'|'PAYMENT'|'SUCCESS'} WizardStep */

/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} code
 * @property {string} name
 * @property {string} description
 * @property {ProductType} type
 * @property {boolean} active@property {Object.<string, boolean>} [features] - Key-value map of feature flags.
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
 * @property {number} monthlyFee
 * @property {number} setupFee
 */

/* ============================================================================
 * CONFIG
 * ========================================================================== */

/** @type {WizardStep[]} */
const STEPS = ["TENANT_INFO", "NUMBER_PICKER", "PAYMENT", "SUCCESS"];

/** @type {Record<ProductType, { basePrice: number }>} */
const PRODUCT_PRICING = {
  AI_CONTACT_CENTER: { basePrice: 25 },
  CONVERSATIONAL_IVR: { basePrice: 15 },
  BASIC_PBX: { basePrice: 5 },
  OUTBOUND_DIALER: { basePrice: 30 },
  VIRTUAL_RECEPTIONIST: { basePrice: 10 },
};

/** @type {Record<ProductType, import('lucide-react').LucideIcon>} */
const ICONS = {
  AI_CONTACT_CENTER: Headphones,
  CONVERSATIONAL_IVR: MessageSquare,
  BASIC_PBX: Phone,
  OUTBOUND_DIALER: PhoneOutgoing,
  VIRTUAL_RECEPTIONIST: UserCircle,
};

/** @type {Product[]} */
const MOCK_PRODUCTS = [
  {
    id: "1",
    code: "CONV_IVR",
    name: "Conversational IVR",
    description: "Natural language IVR",
    type: "CONVERSATIONAL_IVR",
    active: true,
  },
  {
    id: "2",
    code: "AI_CC",
    name: "AI Contact Center",
    description: "AI powered contact center",
    type: "AI_CONTACT_CENTER",
    active: true,
  },
];


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

/* ============================================================================
 * MAIN PAGE
 * ========================================================================== */

/**
 * @param {{ demo?: boolean; initialTenantInfo?: Partial<TenantInfo> }} props
 */
export default function ProductPage({ demo = true, initialTenantInfo }) {
  /* ------------------------------------------------------------------------
   * TENANT GATE (MOST IMPORTANT PART)
   * ---------------------------------------------------------------------- */

  /** @type {[string|null, React.Dispatch<React.SetStateAction<string|null>>]} */
  const [tenantId, setTenantId] = useState(() => {
    return localStorage.getItem("tenantId");
  });

  /** @type {(id: string) => void} */
  const handleTenantCreated = useCallback((id) => {
    localStorage.setItem("tenantId", id);
    setTenantId(id);
    if (activeProduct) {
      setWizardStep(1); 
    }
  }, []);

    /* ------------------------------------------------------------------------
   * API
   * ---------------------------------------------------------------------- */

  const { data, isLoading, isError, refetch } = useGetProductsQuery();
  /** @type {Product[]} */
  const products = demo ? MOCK_PRODUCTS : data || [];

  if (!tenantId) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center
                bg-slate-900/40 backdrop-blur-md">
        <TenantSetupCard
          authProfile={{
            email: initialTenantInfo?.primaryContactEmail,
            username: initialTenantInfo?.name,
          }}
          onCreated={handleTenantCreated}
        />
      </div>
    );
  }



  /* ------------------------------------------------------------------------
   * STATE
   * ---------------------------------------------------------------------- */

  const [search, setSearch] = useState("");
  const [wizardStep, setWizardStep] = useState(0);

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

  const [balance] = useState(1240.50);
  const [kycStatus] = useState("action_required"); 

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const showSetupModal = !tenantId;
  /* ------------------------------------------------------------------------
   * HANDLERS
   * ---------------------------------------------------------------------- */

  const selectProduct = useCallback(
    /** @param {Product} product */
    (product) => {
      setActiveProduct(product);
          if (!tenantId) {
      setWizardStep(0);
    } else {
      setWizardStep(1);
    };
      setTenantInfo((p) => ({ ...p, productCode: product.code }));
    },
    []
  );

  /** @type {(did: AvailableDid) => void} */
  const handleDidSelect = useCallback((did) => {
    setSelectedDid(did);
    setWizardStep(2);
  }, []);

  const handlePaymentComplete = useCallback(() => {
    setWizardStep(3);
  }, []);

  const closeWizard = useCallback(() => {
    setActiveProduct(null);
    setWizardStep(0);
    setSelectedDid(null);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("tenantId");
    setTenantId(null);
  };


  /* ------------------------------------------------------------------------
   * DERIVED
   * ---------------------------------------------------------------------- */

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q)
    );
  }, [products, search]);

  const pricing = activeProduct
    ? PRODUCT_PRICING[activeProduct.type]
    : null;

  const totalAmount =
    pricing ? pricing.basePrice + (selectedDid?.setupFee || 0) : 0;

  /* ------------------------------------------------------------------------
   * WIZARD CONTENT
   * ---------------------------------------------------------------------- */

  const renderWizard = () => {
    if (!activeProduct) return null;
    const currentStepName = STEPS[wizardStep];
    switch (currentStepName) {
      case "NUMBER_PICKER":
        return (
          <NumberPicker
            tenantId={tenantId}
            onSelect={handleDidSelect}
          />
        );

      case "PAYMENT":
        return (
          <PaymentGateway
            amount={totalAmount}
            planType={tenantInfo.deploymentModel}
            onComplete={handlePaymentComplete}
          />
        );

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
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (isError && !demo) {
    return (
      <div className="h-screen flex items-center justify-center">
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }

/* ------------------------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------------------- */

  if (isLoading && !demo) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F9FAFB] text-slate-900 font-sans selection:bg-purple-100 overflow-x-hidden">
      
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
          {isExpanded && <span className="ml-3 font-bold text-lg tracking-tight whitespace-nowrap animate-in fade-in duration-500">DALAI LLAMA</span>}
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
              {isExpanded && <span className="text-[11px] font-bold uppercase tracking-[0.1em] whitespace-nowrap animate-in fade-in duration-500">{item.label}</span>}
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
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Compliance</span>
               </div>
               <p className="text-[13px] font-bold leading-tight mb-2">Upgrade Your Business Limits</p>
               <p className="text-[11px] text-slate-400 mb-4 font-medium leading-relaxed">Complete KYC to unlock $10,000 monthly spending limit.</p>
               <div className="w-full bg-slate-700/50 h-1.5 rounded-full mb-4 overflow-hidden">
                  <div className="w-1/3 h-full bg-purple-500 rounded-full" />
               </div>
               <button className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-purple-900/20">
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50 px-6 py-3 flex justify-between items-center shadow-2xl">
        <LayoutDashboard className="text-slate-400" size={24} />
        <ShoppingBag className="text-purple-600" size={24} />
        <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white -mt-8 shadow-xl shadow-purple-200">
            <Menu size={24} />
        </div>
        <BarChart3 className="text-slate-400" size={24} />
        <UserCheck className="text-slate-400" size={24} />
      </nav>

      {/* MAIN CONTENT */}
      <main className={`flex-grow transition-all duration-500 w-full ${isExpanded ? 'md:pl-64' : 'md:pl-20'} ${activeProduct || !tenantId ? 'blur-2xl scale-[0.99] opacity-40 pointer-events-none' : ''}`}>
        
        {/* HEADER */}
        <header className="h-20 px-6 md:px-12 flex items-center justify-between sticky top-0 bg-[#F9FAFB]/80 backdrop-blur-xl z-40">
          <div className="relative group w-full max-w-xs">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-purple-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-100 rounded-2xl pl-11 pr-5 py-2.5 text-sm font-medium outline-none focus:ring-4 focus:ring-purple-100 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-4 md:gap-6 ml-auto">
            {/* Credit Balance Card */}
            <div className="hidden lg:flex items-center gap-3 bg-white border border-slate-100 p-1.5 pr-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
               <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all">
                  <Wallet size={18} />
               </div>
               <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Balance</p>
                  <p className="text-sm font-bold text-slate-900">${balance.toLocaleString()}</p>
               </div>
               <div className="ml-2 w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100">
                  <Plus size={14} />
               </div>
            </div>

            {/* Profile & Account Actions */}
            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={`flex items-center gap-3 p-1.5 pr-3 rounded-2xl transition-all border ${showProfileMenu ? 'bg-slate-50 border-slate-200 shadow-inner' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}
              >
                <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-xs">JD</div>
                <div className="text-left hidden md:block">
                   <p className="text-[11px] font-bold leading-none mb-1">Jane Doe</p>
                   <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Admin</p>
                </div>
                <ChevronDown size={14} className={`text-slate-300 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-64 bg-white border border-slate-100 rounded-3xl shadow-2xl py-3 z-[60] animate-in fade-in slide-in-from-top-2">
                   <div className="px-5 py-3 border-b border-slate-50 mb-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Account</p>
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
        </header>

        <div className="px-6 md:px-12 py-8 md:py-12 max-w-7xl mx-auto pb-24 md:pb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-3">Marketplace</h1>
              <p className="text-lg text-slate-400 font-medium">Provision global voice infrastructure in 60 seconds.</p>
            </div>
            {kycStatus === 'action_required' && (
               <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 px-5 py-3 rounded-2xl">
                  <AlertTriangle className="text-rose-500" size={20} />
                  <div>
                    <p className="text-xs font-bold text-rose-900 leading-none mb-1">KYC REQUIRED</p>
                    <p className="text-[10px] text-rose-600 font-medium">Some services may be restricted.</p>
                  </div>
                  <button className="ml-4 text-[10px] font-black uppercase text-rose-500 hover:underline">Fix Now</button>
               </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredProducts.map(p => (
              <div 
                key={p.id}
                onClick={() => selectProduct(p)}
                className="group bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-10 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer flex flex-col"
              >
                <div className="flex justify-between items-start mb-10">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-purple-600 group-hover:text-white transition-all">
                    {p.type.includes("AI") ? <Cpu size={28} /> : <PhoneCall size={28} />}
                  </div>
                  <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest">Active</div>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900 group-hover:text-purple-600 transition-colors">{p.name}</h3>
                <p className="text-slate-400 font-medium text-sm leading-relaxed mb-10 flex-grow">{p.description}</p>
                <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block mb-1">Base Cost</span>
                    <span className="text-xl font-bold text-slate-900">${PRODUCT_PRICING[p.type]?.basePrice}<span className="text-xs text-slate-300 font-medium ml-1">/mo</span></span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-purple-600 group-hover:text-white transition-all">
                    <ArrowRight size={20} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>


      {/* ADAPTIVE OVERLAY WIZARD */}
      {(activeProduct || showSetupModal) && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 md:p-6 bg-slate-900/10 backdrop-blur-[2px] animate-in fade-in duration-300">
          {/* Modal Container: Max width on desktop, full width but not full height on mobile */}
          <div className="w-full max-w-lg bg-white rounded-t-[2.5rem] md:rounded-[3.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.18)] overflow-hidden flex flex-col animate-in slide-in-from-bottom-12 md:slide-in-from-bottom-8 duration-500 max-h-[90vh] md:max-h-none">
            
            {/* Handle for mobile visual cue */}
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mt-4 md:hidden" />

            <div className="p-6 md:p-8 border-b border-slate-50 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg">
                  {wizardStep === 0 ? <Globe size={20} className="md:w-6 md:h-6" /> : (activeProduct?.type?.includes('AI') ? <Cpu size={20} className="md:w-6 md:h-6" /> : <PhoneCall size={20} className="md:w-6 md:h-6" />)}
                </div>
                <div>
                  <h4 className="font-bold text-base md:text-lg text-slate-900 leading-tight">
                    {wizardStep === 0 ? "Account Setup" : activeProduct?.name}
                  </h4>
                  <div className="flex items-center gap-1.5 md:gap-2 mt-1.5 md:mt-2">
                    {STEPS.map((s, idx) => (
                      <div 
                        key={s} 
                        className={`h-1 md:h-1.5 rounded-full transition-all duration-700 ${idx === wizardStep ? 'w-6 md:w-8 bg-purple-600' : idx < wizardStep ? 'w-3 md:w-4 bg-emerald-400' : 'w-1.5 md:w-2 bg-slate-100'}`} 
                      />
                    ))}
                  </div>
                </div>
              </div>
              {tenantId && (
                <button 
                  onClick={closeWizard} 
                  className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 active:bg-slate-200 transition-all"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Scrollable content area for smaller mobile screens */}
            <div className="p-8 md:p-12 overflow-y-auto bg-white flex items-center justify-center min-h-[300px] md:min-h-[420px]">
              <div className="w-full">
                {renderWizard()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

}
