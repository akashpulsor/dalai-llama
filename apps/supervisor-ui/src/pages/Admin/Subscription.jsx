// src/pages/admin/Subscription/SubscriptionUsagePage.jsx

/**
 * @file Subscription Usage Management
 * 
 * Enterprise SaaS interface for viewing subscription plan details, usage metrics,
 * and purchasing add-ons.
 */

import React, { useState } from "react";

import {
  useGetSubscriptionQuery,
  usePurchaseAddonMutation
} from "@dalaillama/shared-store";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Subscription plan type
 * @typedef {"free" | "starter" | "pro" | "enterprise"} PlanType
 */

/**
 * Add-on type
 * @typedef {"agent_seat" | "storage" | "minutes" | "bot"} AddonType
 */

/**
 * Subscription details
 * @typedef {Object} Subscription
 * @property {string} id - Subscription ID
 * @property {PlanType} plan - Plan type
 * @property {string} planName - Display name of plan
 * @property {number} agentsIncluded - Number of agent seats included
 * @property {number} agentsUsed - Number of agent seats in use
 * @property {number} minutesIncluded - Call minutes included per month
 * @property {number} minutesUsed - Call minutes used this month
 * @property {number} storageGB - Storage in GB included
 * @property {number} storageUsedGB - Storage used in GB
 * @property {number} botsIncluded - Number of bots included
 * @property {number} botsUsed - Number of bots in use
 * @property {string} renewalDate - Next renewal date
 * @property {number} monthlyPrice - Monthly price in INR
 */

/**
 * Add-on product
 * @typedef {Object} Addon
 * @property {AddonType} type - Add-on type
 * @property {string} name - Display name
 * @property {string} description - Description
 * @property {number} price - Price in INR
 * @property {string} unit - Unit (per seat, per GB, etc.)
 */

/**
 * Props for PurchaseAddonModal
 * @typedef {Object} PurchaseAddonModalProps
 * @property {Addon} addon - Add-on to purchase
 * @property {() => void} onClose - Close callback
 * @property {() => void} onSuccess - Success callback
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** @type {readonly Addon[]} */
const AVAILABLE_ADDONS = [
  {
    type: "agent_seat",
    name: "Extra Agent Seat",
    description: "Add one additional concurrent agent seat",
    price: 500,
    unit: "per seat/month"
  },
  {
    type: "storage",
    name: "Additional Storage",
    description: "Add 100GB of storage for recordings",
    price: 200,
    unit: "per 100GB/month"
  },
  {
    type: "minutes",
    name: "Extra Minutes",
    description: "Add 5,000 additional call minutes",
    price: 300,
    unit: "per 5,000 minutes"
  },
  {
    type: "bot",
    name: "Additional Bot",
    description: "Add one more AI bot to your subscription",
    price: 1000,
    unit: "per bot/month"
  }
];

// ============================================================================
// PURCHASE ADDON MODAL
// ============================================================================

/**
 * Purchase Add-on Modal
 * 
 * @param {PurchaseAddonModalProps} props
 * @returns {React.ReactElement}
 */
function PurchaseAddonModal(props) {
  const { addon, onClose, onSuccess } = props;
  const [purchaseAddon] = usePurchaseAddonMutation();

  /** @type {[number, React.Dispatch<React.SetStateAction<number>>]} */
  const [quantity, setQuantity] = useState(1);

  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [isPurchasing, setIsPurchasing] = useState(false);

  /**
   * Calculates total price
   * @returns {number}
   */
  const getTotalPrice = () => {
    return addon.price * quantity;
  };

  /**
   * Handles purchase submission
   * @returns {Promise<void>}
   */
  const handlePurchase = async () => {
    setIsPurchasing(true);
    try {
      await purchaseAddon({
        type: addon.type,
        quantity
      }).unwrap();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to purchase add-on:", error);
      alert("Failed to complete purchase. Please try again.");
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Purchase Add-on
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        
        {/* Add-on Details */}
        <div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            {addon.name}
          </h3>
          <p className="text-sm text-slate-600 mb-3">
            {addon.description}
          </p>
          <div className="text-sm text-slate-500">
            ₹{addon.price.toLocaleString("en-IN")} {addon.unit}
          </div>
        </div>

        {/* Quantity Selector */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Quantity
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 flex items-center justify-center border border-slate-300 rounded-md
                         hover:bg-slate-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              className="w-20 px-3 py-2 border border-slate-300 rounded-md text-center text-sm
                         focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 flex items-center justify-center border border-slate-300 rounded-md
                         hover:bg-slate-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Total */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Total</span>
            <span className="text-xl font-semibold text-slate-900">
              ₹{getTotalPrice().toLocaleString("en-IN")}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            This will be added to your next invoice
          </p>
        </div>

      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={isPurchasing}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 
                     rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={handlePurchase}
          disabled={isPurchasing}
          className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md 
                     hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPurchasing ? "Processing..." : "Purchase"}
        </button>
      </div>

    </div>
  );
}

// ============================================================================
// USAGE METRIC COMPONENT
// ============================================================================

/**
 * @typedef {Object} UsageMetricProps
 * @property {string} label - Metric label
 * @property {number} included - Amount included in plan
 * @property {number} used - Amount currently used
 * @property {string} [unit] - Unit label (optional)
 */

/**
 * Usage Metric Component
 * 
 * @param {UsageMetricProps} props
 * @returns {React.ReactElement}
 */
function UsageMetric(props) {
  const { label, included, used, unit = "" } = props;

  /**
   * Calculates usage percentage
   * @returns {number}
   */
  const getPercentage = () => {
    if (included === 0) return 0;
    return Math.min(100, (used / included) * 100);
  };

  /**
   * Gets color based on usage percentage
   * @returns {string}
   */
  const getColor = () => {
    const percentage = getPercentage();
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-xs text-slate-500">{getPercentage().toFixed(0)}% used</span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
        <div 
          className={`h-full ${getColor()} transition-all duration-300`}
          style={{ width: `${getPercentage()}%` }}
        />
      </div>

      {/* Values */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-900">
          {used.toLocaleString("en-IN")} {unit}
        </span>
        <span className="text-slate-500">
          / {included.toLocaleString("en-IN")} {unit}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN SUBSCRIPTION USAGE PAGE
// ============================================================================

/**
 * Subscription Usage Page Component
 * 
 * @returns {React.ReactElement}
 */
export default function SubscriptionUsagePage() {
  const { data: subscription, isLoading } = useGetSubscriptionQuery();

  /** @type {[Addon | null, React.Dispatch<React.SetStateAction<Addon | null>>]} */
  const [selectedAddon, setSelectedAddon] = useState(/** @type {Addon | null} */ (null));

  /**
   * Opens purchase modal for an add-on
   * @param {Addon} addon
   * @returns {void}
   */
  const handlePurchaseAddon = 
    /**
     * @param {Addon} addon
     */
    (addon) => {
      setSelectedAddon(addon);
    };

  /**
   * Closes the purchase modal
   * @returns {void}
   */
  const handleCloseModal = () => {
    setSelectedAddon(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-slate-600">Loading subscription details...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-semibold text-slate-900">
            Subscription Usage
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Monitor your plan usage and purchase add-ons
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Current Plan */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {subscription?.planName || "Pro Plan"}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Current subscription plan
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900">
                  ₹{(subscription?.monthlyPrice || 0).toLocaleString("en-IN")}
                </div>
                <div className="text-xs text-slate-500">per month</div>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4">
            {subscription?.renewalDate && (
              <p className="text-sm text-slate-600">
                Next renewal: {new Date(subscription.renewalDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric"
                })}
              </p>
            )}
          </div>
        </div>

        {/* Usage Metrics */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Usage Summary</h2>
            <p className="text-sm text-slate-600 mt-1">
              Current month resource consumption
            </p>
          </div>
          
          <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Agents */}
            <UsageMetric
              label="Agents Included"
              included={subscription?.agentsIncluded || 50}
              used={subscription?.agentsUsed || 23}
            />

            {/* Minutes */}
            <UsageMetric
              label="Minutes Included"
              included={subscription?.minutesIncluded || 20000}
              used={subscription?.minutesUsed || 8430}
            />

            {/* Storage */}
            <UsageMetric
              label="Storage"
              included={subscription?.storageGB || 200}
              used={subscription?.storageUsedGB || 3}
              unit="GB"
            />

            {/* Bots */}
            <UsageMetric
              label="Bots"
              included={subscription?.botsIncluded || 5}
              used={subscription?.botsUsed || 2}
            />

          </div>
        </div>

        {/* Add-ons */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Add-ons</h2>
            <p className="text-sm text-slate-600 mt-1">
              Purchase additional resources as needed
            </p>
          </div>
          
          <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {AVAILABLE_ADDONS.map(
              /**
               * @param {Addon} addon
               */
              (addon) => (
              <button
                key={addon.type}
                onClick={() => handlePurchaseAddon(addon)}
                className="p-4 border-2 border-slate-200 rounded-lg hover:border-slate-900 
                           hover:bg-slate-50 transition-all text-left group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-slate-900 group-hover:text-slate-700">
                      {addon.name}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {addon.description}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-slate-900 flex-shrink-0 ml-3" 
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="text-sm font-medium text-slate-900 mt-3">
                  ₹{addon.price.toLocaleString("en-IN")} {addon.unit}
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Purchase Modal */}
      {selectedAddon && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
              onClick={handleCloseModal}
            />

            {/* Modal */}
            <div className="relative">
              <PurchaseAddonModal
                addon={selectedAddon}
                onClose={handleCloseModal}
                onSuccess={() => {/* Refresh subscription */}}
              />
            </div>

          </div>
        </div>
      )}

    </div>
  );
}