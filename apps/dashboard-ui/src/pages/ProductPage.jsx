// apps/dashboard-ui/src/pages/ProductPage.jsx
import React from "react";
import { ArrowRight, PhoneCall, Globe2, Lock } from "lucide-react";
import PartnerSideNav from "./components/PartnerSideNav.jsx";

/**
 * @typedef ProductCardProps
 * @property {React.ComponentType<any>} icon  // Lucide icon type-safe for JS
 * @property {string} title
 * @property {string} description
 * @property {boolean} [disabled]
 * @property {() => void} [onClick]
 */

/**
 * Styled product card used on Product Page
 * @param {ProductCardProps} props
 */
const ProductCard = ({ icon: Icon, title, description, disabled = false, onClick }) => {
  return (
    <div
      className={`p-6 rounded-3xl border-2 border-purple-200 shadow-xl bg-white bg-opacity-90 
        transition-all hover:shadow-2xl relative
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-[1.02]"}`}
      onClick={!disabled ? onClick : undefined}
    >
      {disabled && (
        <div className="absolute top-3 right-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
          Coming Soon
        </div>
      )}

      {/* Icon + Title */}
      <div className="flex items-center gap-4 mb-4">
        <div className="p-4 rounded-2xl bg-purple-100 shadow-inner flex items-center justify-center">
          {/* ✔ LucideProps allows size + className */}
          <Icon size={32} className="text-purple-700" />
        </div>
        <h2 className="text-2xl font-bold text-purple-700">{title}</h2>
      </div>

      <p className="text-gray-700 text-sm mb-6 leading-relaxed">{description}</p>

      {!disabled && (
        <button className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-purple-700 transition-all font-semibold">
          Start <ArrowRight size={18} />
        </button>
      )}
    </div>
  );
};

/**
 * @typedef ProductPageProps
 * @property {boolean} demo
 */

/**
 * Product Landing Page (Dashboard App)
 * Includes sliding partner sidebar + product grid
 * @param {ProductPageProps} props
 */
export default function ProductPage({ demo }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const handleStartContactCenter = () => {
    window.location.href = "/onboarding";
  };

  const handleStartWebsiteBuilder = () => {
    alert("Website Builder is not available yet.");
  };

  return (
    <div className="flex min-h-screen bg-[#d3d3d3]">
      {/* Left Sliding Sidebar */}
      <PartnerSideNav open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Main Page Content - adjusts based on sidebar state */}
      <div 
        className={`flex-1 p-4 flex flex-col transition-all duration-300 ${
          sidebarOpen ? "md:ml-72" : "md:ml-20"
        }`}
      >
        {/* Header */}
        <div className="pt-10 pb-6 text-center">
          <div className="w-24 h-24 bg-purple-200 rounded-full flex items-center justify-center text-6xl mx-auto shadow-lg">
            🦙
          </div>

          <h1 className="text-4xl font-extrabold text-purple-700 mt-4 mb-1">
            Dalai Llama Platform
          </h1>

          <p className="text-gray-800 text-lg font-medium">
            Choose the module you want to activate
          </p>

          <div className="mt-3 inline-block px-4 py-1.5 rounded-full text-sm font-semibold 
            bg-gray-800 text-white shadow-md">
            Mode: {demo ? "DEMO" : "REAL"}
          </div>
        </div>

        {/* Product Grid Card */}
        <div className="bg-white bg-opacity-90 rounded-3xl shadow-2xl w-full max-w-4xl mx-auto p-10 mt-4 border-2 border-purple-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

            {/* Contact Center */}
            <ProductCard
              icon={PhoneCall}
              title="AI Contact Center"
              description="Automate outbound calls, configure agents, manage analytics, and enable IVR flows."
              onClick={handleStartContactCenter}
            />

            {/* Website Builder */}
            <ProductCard
              icon={Globe2}
              title="AI Website Builder"
              description="Create and manage your D2C AI-powered storefront. (Coming soon)"
              disabled={true}
              onClick={handleStartWebsiteBuilder}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-700 mt-8 mb-10 flex items-center justify-center gap-2">
          <span className="text-purple-700">
            <Lock size={16} />
          </span>
          <span>More apps coming soon to the Dalai Llama ecosystem.</span>
        </div>
      </div>
    </div>
  );
}