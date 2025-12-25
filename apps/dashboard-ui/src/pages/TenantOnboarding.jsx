// apps/dashboard-ui/src/pages/tenant-onboarding/TenantOnboarding.jsx

/**
 * Tenant Onboarding Wizard
 * Fully styled like ProductPage + PartnerSideNav + JS + JSDoc + TS-safe.
 */

import React, { useState, useMemo } from "react";
import { ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";

/* Layout */
import PartnerSideNav from "./components/PartnerSideNav.jsx";

/* Steps */
import { Step1TenantRegistration } from "./components/Step1TenantRegistration.jsx";
import { Step2NumberPurchase } from "./components/Step2NumberPurchase.jsx";
import { Step3PlanSelection } from "./components/Step3PlanSelection.jsx";
import { Step4Billing } from "./components/Step4Billing.jsx";
import { Step5AdminTelephony } from "./components/Step5AdminTelephony.jsx";
import store, { api } from "@dalaillama/shared-store";
import { setRuntimeKeycloakConfig } from "@dalaillama/shared-config";
/* Shared API Hooks */
import {
  useTenantRegisterMutation,
  useTenantPhonePurchaseMutation,
  useTenantAssignDIDMutation,
  useTenantPlanSelectionMutation,
  useTenantBillingAddCardMutation,
  useTenantToggleWalletMutation,
  useTenantConfigureTrunkMutation,
  useTenantEnableAIMutation,
  useTenantGetSummaryQuery,
  useGetPlansQuery,
  useGetDidInventoryQuery,
  useGetKeycloakConfigQuery
} from "@dalaillama/shared-store";

/**
 * @typedef {Object} OnboardingState
 * @property {string} companyName
 * @property {File|null} brandImage
 * @property {string|null} brandImagePreview
 * @property {string} realm
 * @property {string} contactEmail
 * @property {string} country
 * @property {string|null} selectedDid
 * @property {string[]} purchasedDids
 * @property {string|null} planId
 * @property {{ number?: string, cardId?: string|null } | null} card
 * @property {boolean} enableWallet
 * @property {number} walletThreshold
 * @property {string} adminEmail
 * @property {string} sipHost
 * @property {string} defaultDid
 */

/**
 * @param {{ onFinished?: (result: any) => void }} props
 */
export default function TenantOnboarding({ onFinished }) {
  const TOTAL_STEPS = 6;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [step, setStep] = useState(0);

/** @type {[OnboardingState, React.Dispatch<React.SetStateAction<OnboardingState>>]} */
const [state, setState] = useState(
  /** @type {OnboardingState} */ ({
    companyName: "",
    brandImage: null,
    brandImagePreview: null,
    realm: "",
    contactEmail: "",
    country: "",
    selectedDid: null,
    purchasedDids: [],
    planId: null,
    card: null,
    enableWallet: false,
    walletThreshold: 1000,
    adminEmail: "",
    sipHost: "",
    defaultDid: "",
  })
);

  /** @type {(k: keyof OnboardingState, v: OnboardingState[keyof OnboardingState]) => void} */
  const set = (k, v) => setState((s) => ({ ...s, [k]: v }));

  /* --------------------- API Hooks --------------------- */
  const [tenantRegister] = useTenantRegisterMutation();
  const [tenantPhonePurchase] = useTenantPhonePurchaseMutation();
  const [tenantAssignDID] = useTenantAssignDIDMutation();
  const [tenantPlanSelection] = useTenantPlanSelectionMutation();
  const [tenantBillingAddCard] = useTenantBillingAddCardMutation();
  const [tenantToggleWallet] = useTenantToggleWalletMutation();
  const [tenantConfigureTrunk] = useTenantConfigureTrunkMutation();
  const [tenantEnableAI] = useTenantEnableAIMutation();

  const { data: didInventory } = useGetDidInventoryQuery();
  const { data: plansData } = useGetPlansQuery();
  const plans = plansData?.plans ?? [];

  const { data: tenantSummarySample } = useTenantGetSummaryQuery();

  
  /**
 * Update the auto-generated realm based on company name.
 * @param {string} name
 */
  const updateRealmPreview = (name) =>
    set(
      "realm",
      name
        ? `${name.toLowerCase().replace(/\s+/g, "-")}.user(parahit).dalaillama`
        : ""
    );

  const next = () => setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const progress = useMemo(() => ((step + 1) / TOTAL_STEPS) * 100, [step]);

/**
 * @param {string} didId
 */
const handlePurchaseDid = async (didId) => {

    if (!didId) return alert("Select DID first");

    try {
      const res = await tenantPhonePurchase({ didId }).unwrap?.();
      const purchased = res?.did ?? didId;

      set("purchasedDids", [...state.purchasedDids, purchased]);
      set("selectedDid", purchased);

      alert("DID purchased");
    } catch (e) {
      console.error("purchase error", e);
    }
  };

/**
 * @param {{ id: string }} plan
 */
const handleSelectPlan = async (plan) => {

    try {
      await tenantPlanSelection({ planId: plan.id }).unwrap?.();
      set("planId", plan.id);
    } catch (e) {
      console.error("plan error", e);
    }
  };

/**
 * @param {{ number: string }} card
 */
const handleAddCard = async (card) => {

    if (!card.number) return alert("Enter card number");

    try {
      const res = await tenantBillingAddCard({ card }).unwrap?.();
      set("card", { ...card, cardId: res?.cardId ?? null });
    } catch (e) {
      console.error("billing error", e);
    }
  };

  /* ---------------- Final Launch / Provision ---------------- */
const onLaunch = async () => {
  try {
    const reg = await tenantRegister({
      tenant: {
        companyName: state.companyName,
        realm: state.realm,
        contactEmail: state.contactEmail,
      },
    }).unwrap?.();

    const tenantId = reg?.tenantId ?? "tenant_local";

    if (state.selectedDid && !state.purchasedDids.includes(state.selectedDid)) {
      await tenantPhonePurchase({ didId: state.selectedDid }).unwrap?.();
    }

    if (state.selectedDid) {
      await tenantAssignDID({ tenantId, did: state.selectedDid }).unwrap?.();
    }

    if (state.planId) {
      await tenantPlanSelection({ tenantId, planId: state.planId }).unwrap?.();
    }

    if (state.card?.number) {
      await tenantBillingAddCard({ tenantId, card: state.card }).unwrap?.();
    }

    if (state.enableWallet) {
      await tenantToggleWallet({ tenantId }).unwrap?.();
    }

    await tenantConfigureTrunk({
      tenantId,
      sipHost: state.sipHost,
      adminEmail: state.adminEmail,
      defaultDid:
        state.defaultDid ||
        state.selectedDid ||
        state.purchasedDids[0] ||
        null,
    }).unwrap?.();

    await tenantEnableAI({ tenantId }).unwrap?.();

    const summary =
      tenantSummarySample ?? {
        tenantId,
        companyName: state.companyName,
        realm: state.realm,
        planId: state.planId,
        agentDomain: `${state.realm}.agent.dalaillama.io`, // mock fallback
      };

    // ---------------- GET TENANT DOMAIN ----------------
    const domain = summary.agentDomain;

    // ---------------- GET KEYCLOAK CONFIG ----------------
    const result = await store.dispatch(
      api.endpoints.getKeycloakConfig.initiate(domain)
    );

    const keycloakCfg = result.data;
    // ---------------- STORE KEYCLOAK CONFIG ----------------
    setRuntimeKeycloakConfig({
      url: keycloakCfg.keycloakUrl,
      realm: keycloakCfg.realm,
      clientId: keycloakCfg.clientId,
    });

    // Store for second login
    localStorage.setItem("kc_cfg", JSON.stringify(keycloakCfg));

    onFinished?.(summary);

    alert("Tenant launched 🎉");

    // ---------------- REDIRECT TO TENANT LOGIN ----------------
    window.location.href = `https://${domain}/login`;

  } catch (err) {
    console.error(err);
    alert("Launch failed");
  }
};

  /* ---------------- Render Step ---------------- */
  const renderStep = useMemo(() => {
    switch (step) {
      case 0:
        return (
          <Step1TenantRegistration
  data={state}
  onChange={(k, v) => {
    set(k, v);

    if (k === "companyName") {
      /** @type {string} */
      const name = String(v ?? "");
      updateRealmPreview(name);
    }
  }}
/>

        );

      case 1:
        return (
          <Step2NumberPurchase
            data={state}
            didInventory={didInventory ?? []}
            onChange={(k, v) => set(k, v)}
            onPurchase={handlePurchaseDid}
          />
        );

      case 2:
        return (
          <Step3PlanSelection
            data={state}
            plans={plans}
            onChange={(k, v) => set(k, v)}
            onSelect={handleSelectPlan}
          />
        );

      case 3:
        return (
          <Step4Billing
            data={state}
            onChange={(k, v) => set(k, v)}
            onAddCard={handleAddCard}
          />
        );

      case 4:
        return (
          <Step5AdminTelephony
            data={state}
            onChange={(k, v) => set(k, v)}
          />
        );

      case 5:
        return (
          <div className="text-left space-y-4">
            <h2 className="text-xl font-bold text-purple-700">Review & Launch</h2>

            <pre className="bg-gray-50 p-4 rounded-xl text-sm border border-purple-200">
              {JSON.stringify(state, null, 2)}
            </pre>
          </div>
        );

      default:
        return null;
    }
  }, [step, state, didInventory, plans]);

  /* ---------------- Final JSX ---------------- */
  return (
    <div className="flex min-h-screen bg-[#d3d3d3]">
      {/* LEFT SIDEBAR */}
      <PartnerSideNav open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* CONTENT AREA */}
      <div
        className={`flex-1 p-6 flex flex-col transition-all duration-300 ${
          sidebarOpen ? "md:ml-72" : "md:ml-20"
        }`}
      >
        {/* HEADER */}
        <div className="pt-6 text-center">
          <div className="w-24 h-24 bg-purple-200 rounded-full mx-auto flex items-center justify-center text-6xl shadow-lg">
            🦙
          </div>

          <h1 className="text-4xl font-extrabold text-purple-700 mt-4">
            AI Contact Center Onboarding
          </h1>

          <p className="text-gray-700 text-lg font-medium mt-1">
            Step {step + 1} of {TOTAL_STEPS}
          </p>
        </div>

        {/* PROGRESS BAR */}
        <div className="w-full max-w-4xl mx-auto mt-6">
          <div className="h-3 bg-gray-300 rounded-full overflow-hidden">
            <div
              className="h-3 bg-purple-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-right mt-1 text-gray-600">
            {Math.round(progress)}% complete
          </p>
        </div>

        {/* MAIN CARD */}
        <div className="bg-white bg-opacity-90 rounded-3xl shadow-2xl w-full max-w-4xl mx-auto p-10 mt-6 border-2 border-purple-200">
          {renderStep}
        </div>

        {/* FOOTER BUTTONS */}
        <div className="w-full max-w-4xl mx-auto flex justify-between mt-8">

          {/* BACK */}
          {step > 0 ? (
            <button
              onClick={back}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-200 text-gray-800 font-semibold shadow hover:bg-gray-300"
            >
              <ArrowLeft size={18} />
              Back
            </button>
          ) : (
            <div />
          )}

          {/* NEXT / LAUNCH */}
          {step < TOTAL_STEPS - 1 ? (
            <button
              onClick={next}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-purple-600 text-white font-semibold shadow hover:bg-purple-700"
            >
              Next Step <ArrowRight size={20} />
            </button>
          ) : (
            <button
              onClick={onLaunch}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-emerald-600 text-white font-semibold shadow hover:bg-emerald-700"
            >
              <CheckCircle size={20} />
              Launch Contact Center
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
