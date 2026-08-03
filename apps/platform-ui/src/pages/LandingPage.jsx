// @ts-check
// apps/platform-ui/src/pages/LandingPage.jsx
import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Film,
  MessageCircle,
  Play,
  Scissors,
  Sparkles,
  StopCircle,
  WalletCards,
  X,
} from "lucide-react";
import { useInitiateLoginMutation } from "@dalaillama/shared-hooks/keycloakApi";
import { appConfig } from "@dalaillama/shared-config";

/**
 * @typedef {Object} AnimatedCardProps
 * @property {React.ReactNode} children
 * @property {number} [delay]
 * @property {string} [className]
 */

/**
 * Animated fade-in wrapper
 * @param {AnimatedCardProps} props
 * @returns {React.ReactElement}
 */
const AnimatedCard = ({ children, delay = 0, className = "" }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-all duration-700 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
};

const HeroSection = () => (
  <AnimatedCard className="px-4 py-6 text-center sm:px-6 sm:py-10">
    <h1 className="mb-4 text-3xl font-bold tracking-tight text-indigo-900 sm:text-4xl lg:text-5xl xl:text-6xl">
      Your D2C Copilot: Automate, Save, and Scale
    </h1>
    <p className="mx-auto mb-8 max-w-3xl text-base font-medium leading-7 text-slate-700 sm:text-lg lg:text-xl">
      AI automates returns, fraud, logistics, competitor analysis, and more, so
      you can focus on growth.
    </p>
  </AnimatedCard>
);

const AudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("english");

  /**
   * Toggle play/pause state
   * @returns {void}
   */
  const handlePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  /**
   * Handle language change
   * @param {React.ChangeEvent<HTMLSelectElement>} e
   * @returns {void}
   */
  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value);
  };

  return (
    <div className="mx-auto w-full max-w-xl rounded-3xl border border-slate-200 bg-white/85 p-4 shadow-lg shadow-slate-200/70 backdrop-blur sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={handlePlayPause}
          className="flex w-full items-center justify-center gap-3 rounded-full bg-blue-600 px-5 py-3 text-white transition-all hover:bg-blue-700 sm:w-auto"
        >
          {isPlaying ? <StopCircle size={28} /> : <Play size={28} />}
          <span className="text-base font-bold sm:text-lg">
            {isPlaying ? "Stop" : "Play"} Sample
          </span>
        </button>
        <select
          value={selectedLanguage}
          onChange={handleLanguageChange}
          className="min-h-12 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-indigo-900 sm:w-44 sm:text-base"
        >
          <option value="hindi">Hindi</option>
          <option value="english">English</option>
        </select>
      </div>
    </div>
  );
};

const pricingPlans = [
  {
    name: "AI Short Starter",
    price: "Rs 3,999",
    minimumBalance: "Rs 3,999",
    label: "60-second full AI video",
    icon: Film,
    accent: "border-emerald-300",
    button: "Start AI short",
    features: [
      "Idea, outline, screenplay, actor prompts, storyboard path, scene video, final merge",
      "Seedance or Omini generation with consistency seeds and caption/SRT support",
      "Wallet package floor is applied after final video render",
    ],
  },
  {
    name: "AI Short Pro",
    price: "Rs 5,999",
    minimumBalance: "Rs 5,999",
    label: "60-second ad-ready video",
    icon: Sparkles,
    accent: "border-sky-300",
    button: "Start pro short",
    features: [
      "Everything in Starter plus stronger ad angles and conversion-focused script shaping",
      "Storyboard-first generation guidance for better character and location consistency",
      "Includes extra polish budget for scene fixes before final merge",
    ],
  },
  {
    name: "Human Polished",
    price: "Rs 7,999",
    minimumBalance: "Rs 7,999",
    label: "AI video plus human review",
    icon: Scissors,
    accent: "border-amber-300",
    button: "Request polish",
    features: [
      "Includes AI Short Pro, screenplay review, and freelancer editing workflow",
      "Editor receives final clips, assets, music, captions, voice, and editing plan",
      "Creator can request up to 2 revision rounds before approval",
    ],
  },
];

const addOns = [
  ["Screenplay review", "Rs 999"],
  ["Freelancer editing approval", "Rs 1,500"],
  ["Extra 15 seconds", "Rs 999"],
  ["Storyboard consistency pack", "Rs 499"],
];

const walletRequirements = [
  ["Starter video flow", "Rs 3,999"],
  ["Pro video flow", "Rs 5,999"],
  ["Human polished flow", "Rs 7,999"],
  ["Trend moment refresh", "Rs 100"],
  ["Screenplay review", "Rs 999"],
  ["Editor approval reserve", "Rs 1,500"],
];

/**
 * Pricing section for creator video packages
 * @param {{ onStart: () => void }} props
 */
const PricingSection = ({ onStart }) => (
  <section id="pricing" className="py-10 sm:py-14">
    <AnimatedCard className="mb-8">
      <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">
        Creator pricing
      </p>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl lg:text-4xl">
            Packages for 60-second AI videos
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700 sm:text-base">
            Start from ideation and finish with a merged video preview. Human
            review and editing are available as paid add-ons when the script or
            final cut needs expert hands.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
          Minimum wallet balance starts at <span className="text-slate-950">Rs 3,999</span>
        </div>
      </div>
    </AnimatedCard>

    <AnimatedCard className="mb-5">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <WalletCards size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-950">Wallet balance required before paid flows</p>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-emerald-900/80">
                Dalaillama uses wallet debit, not subscription checkout. If the wallet is zero or below the required balance for a selected flow, the studio asks the user to recharge before continuing.
              </p>
            </div>
          </div>
          <div className="grid min-w-[min(100%,30rem)] gap-2 sm:grid-cols-2">
            {walletRequirements.map(([name, amount]) => (
              <div key={name} className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-white/75 px-3 py-2">
                <span className="text-xs font-bold text-emerald-950">{name}</span>
                <span className="text-xs font-black text-emerald-700">{amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AnimatedCard>

    <div className="grid gap-4 lg:grid-cols-3">
      {pricingPlans.map((plan) => {
        const Icon = plan.icon;
        return (
          <AnimatedCard
            key={plan.name}
            className={`rounded-lg border-2 ${plan.accent} bg-white p-5 shadow-lg shadow-slate-200/70`}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-950">{plan.name}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  {plan.label}
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
                <Icon size={22} />
              </div>
            </div>
            <div className="mb-5">
              <p className="text-3xl font-black text-slate-950">{plan.price}</p>
              <p className="text-sm font-medium text-slate-500">debited from wallet</p>
              <p className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                Keep at least {plan.minimumBalance} before starting this flow.
              </p>
            </div>
            <ul className="mb-6 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={onStart}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-700"
            >
              <Sparkles size={18} />
              {plan.button}
            </button>
          </AnimatedCard>
        );
      })}
    </div>

    <AnimatedCard className="mt-6">
      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white/80 p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        {addOns.map(([name, price]) => (
          <div key={name} className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-slate-700">{name}</span>
            <span className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-bold text-slate-950">
              {price}
            </span>
          </div>
        ))}
      </div>
    </AnimatedCard>
  </section>
);

/**
 * @typedef {Object} FloatingContactButtonProps
 * @property {() => void} onClick
 */

/**
 * Floating contact button
 * @param {FloatingContactButtonProps} props
 */
const FloatingContactButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-2xl transition-all hover:bg-blue-700 sm:bottom-6 sm:right-6 sm:px-6 sm:text-base"
  >
    <MessageCircle size={20} />
    <span className="font-bold">Contact Us</span>
  </button>
);

/**
 * @typedef {Object} ContactModalProps
 * @property {boolean} isOpen
 * @property {() => void} onClose
 */

/**
 * @typedef {Object} ContactFormData
 * @property {string} name
 * @property {string} email
 * @property {string} message
 */

/**
 * Contact modal component
 * @param {ContactModalProps} props
 */
const ContactModal = ({ isOpen, onClose }) => {
  /** @type {ContactFormData} */
  const initialFormData = { name: "", email: "", message: "" };
  const [formData, setFormData] = useState(initialFormData);

  if (!isOpen) return null;

  /**
   * Handle form submission
   * @param {React.FormEvent<HTMLFormElement>} e
   * @returns {void}
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    setFormData(initialFormData);
    onClose();
  };

  /**
   * Handle input change
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e
   * @returns {void}
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl sm:p-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        >
          <X size={28} />
        </button>
        <h2 className="mb-6 text-xl font-bold text-indigo-900 sm:text-2xl">
          Contact Us
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 text-sm sm:text-base"
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 text-sm sm:text-base"
          />
          <textarea
            name="message"
            placeholder="Your Message"
            rows={4}
            value={formData.message}
            onChange={handleChange}
            className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 text-sm sm:text-base"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 sm:py-4 sm:text-base"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
};

const LandingPage = () => {
  const [showContactModal, setShowContactModal] = useState(false);
  const [initiateLogin] = useInitiateLoginMutation();

  /**
   * Handle login - redirects to Keycloak
   * @returns {Promise<void>}
   */
  const handleLogin = async () => {
    console.log("Login clicked");
    console.log("Keycloak URL:", appConfig.KEYCLOAK_URL);
    console.log("Realm:", appConfig.KEYCLOAK_REALM);
    console.log("Client:", appConfig.KEYCLOAK_CLIENT);

    try {
      const result = await initiateLogin({}).unwrap();
      console.log("[Auth] initiateLogin result:", result);
    } catch (error) {
      console.error("[Auth] initiateLogin error:", error);
    }
  };

  /**
   * Open contact modal
   * @returns {void}
   */
  const openContactModal = () => {
    setShowContactModal(true);
  };

  /**
   * Close contact modal
   * @returns {void}
   */
  const closeContactModal = () => {
    setShowContactModal(false);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef4ff_0%,#dfe8f7_52%,#f6f8fc_100%)]">
      <header className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-200 text-3xl sm:h-16 sm:w-16 sm:text-4xl">
            DL
          </div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Dalai Llama
          </h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href="#pricing"
            className="rounded-lg px-4 py-2 text-center text-sm font-bold text-slate-700 transition-colors hover:bg-white/70 hover:text-slate-950"
          >
            Pricing
          </a>
          <button
            onClick={handleLogin}
            className="w-full rounded-lg bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-900 sm:w-auto sm:text-base"
          >
            Login
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-24 sm:px-6 lg:px-8">
        <HeroSection />
        <AudioPlayer />
        <PricingSection onStart={handleLogin} />
      </main>

      <FloatingContactButton onClick={openContactModal} />
      <ContactModal isOpen={showContactModal} onClose={closeContactModal} />
    </div>
  );
};

export default LandingPage;
