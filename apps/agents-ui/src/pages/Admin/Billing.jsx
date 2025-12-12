// src/pages/admin/Billing/BillingPage.jsx

/**
 * @file Billing Management
 * 
 * Enterprise SaaS interface for managing billing, invoices, and payment methods.
 */

import React, { useState } from "react";

import {
  useGetBillingSummaryQuery,
  useGetInvoicesQuery,
  useGetPaymentMethodsQuery,
  useAddPaymentMethodMutation,
  useUpdateAutoDebitMutation,
  useDownloadInvoiceMutation
} from "@dalaillama/shared-store";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Invoice status
 * @typedef {"paid" | "pending" | "overdue" | "failed"} InvoiceStatus
 */

/**
 * Current month billing summary
 * @typedef {Object} BillingSummary
 * @property {number} minutes - Total call minutes used
 * @property {number} botMinutes - Bot/AI minutes used
 * @property {number} storageGB - Storage in gigabytes
 * @property {number} dids - Number of DIDs (phone numbers)
 * @property {number} sipTrunks - Number of SIP trunks
 * @property {number} estimatedAmount - Estimated bill amount
 */

/**
 * Invoice record
 * @typedef {Object} Invoice
 * @property {string} id - Invoice ID
 * @property {string} date - Invoice date (YYYY-MM format)
 * @property {number} amount - Invoice amount
 * @property {string} currency - Currency code (INR, USD, etc.)
 * @property {InvoiceStatus} status - Payment status
 * @property {string} invoiceUrl - URL to download invoice PDF
 */

/**
 * Payment method
 * @typedef {Object} PaymentMethod
 * @property {string} id - Payment method ID
 * @property {string} type - Type (card, upi, etc.)
 * @property {string} last4 - Last 4 digits of card
 * @property {string} brand - Card brand (Visa, Mastercard, etc.)
 * @property {string} expiryMonth - Expiry month
 * @property {string} expiryYear - Expiry year
 * @property {boolean} isDefault - Is default payment method
 */

/**
 * Props for AddPaymentMethodModal
 * @typedef {Object} AddPaymentMethodModalProps
 * @property {() => void} onClose - Close callback
 * @property {() => void} onSuccess - Success callback
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** @type {Record<InvoiceStatus, {label: string, className: string}>} */
const INVOICE_STATUS_CONFIG = {
  paid: {
    label: "Paid",
    className: "bg-green-100 text-green-800"
  },
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800"
  },
  overdue: {
    label: "Overdue",
    className: "bg-red-100 text-red-800"
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-800"
  }
};

// ============================================================================
// ADD PAYMENT METHOD MODAL
// ============================================================================

/**
 * Add Payment Method Modal
 * 
 * @param {AddPaymentMethodModalProps} props
 * @returns {React.ReactElement}
 */
function AddPaymentMethodModal(props) {
  const { onClose, onSuccess } = props;
  const [addPaymentMethod] = useAddPaymentMethodMutation();

  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [cardNumber, setCardNumber] = useState("");

  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [cardName, setCardName] = useState("");

  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [expiryMonth, setExpiryMonth] = useState("");

  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [expiryYear, setExpiryYear] = useState("");

  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [cvv, setCvv] = useState("");

  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Handles form submission
   * @returns {Promise<void>}
   */
  const handleSubmit = async () => {
    if (!cardNumber || !cardName || !expiryMonth || !expiryYear || !cvv) {
      alert("Please fill in all fields");
      return;
    }

    setIsSaving(true);
    try {
      await addPaymentMethod({
        cardNumber,
        cardName,
        expiryMonth,
        expiryYear,
        cvv
      }).unwrap();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to add payment method:", error);
      alert("Failed to add payment method. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Add Payment Method
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

      {/* Form Content */}
      <div className="px-6 py-6 space-y-4">
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Card Number
          </label>
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
            placeholder="1234 5678 9012 3456"
            maxLength={19}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900
                       placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Cardholder Name
          </label>
          <input
            type="text"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            placeholder="JOHN DOE"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900
                       placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Month
            </label>
            <input
              type="text"
              value={expiryMonth}
              onChange={(e) => setExpiryMonth(e.target.value.replace(/\D/g, "").slice(0, 2))}
              placeholder="MM"
              maxLength={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900
                         placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Year
            </label>
            <input
              type="text"
              value={expiryYear}
              onChange={(e) => setExpiryYear(e.target.value.replace(/\D/g, "").slice(0, 2))}
              placeholder="YY"
              maxLength={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900
                         placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              CVV
            </label>
            <input
              type="text"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
              placeholder="123"
              maxLength={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900
                         placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 
                     rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md 
                     hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Adding..." : "Add Card"}
        </button>
      </div>

    </div>
  );
}

// ============================================================================
// MAIN BILLING PAGE
// ============================================================================

/**
 * Billing Page Component
 * 
 * @returns {React.ReactElement}
 */
export default function BillingPage() {
  const { data: summary, isLoading: summaryLoading } = useGetBillingSummaryQuery();
  const { data: invoices = [], isLoading: invoicesLoading } = useGetInvoicesQuery();
  const { data: paymentMethods = [], isLoading: paymentMethodsLoading } = useGetPaymentMethodsQuery();
  
  const [updateAutoDebit] = useUpdateAutoDebitMutation();
  const [downloadInvoice] = useDownloadInvoiceMutation();

  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [autoDebitEnabled, setAutoDebitEnabled] = useState(true);

  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [showAddCardModal, setShowAddCardModal] = useState(false);

  /**
   * Handles auto-debit toggle
   * @param {boolean} enabled
   * @returns {Promise<void>}
   */
  const handleAutoDebitToggle = async (enabled) => {
    try {
      await updateAutoDebit({ enabled }).unwrap();
      setAutoDebitEnabled(enabled);
    } catch (error) {
      console.error("Failed to update auto-debit:", error);
      alert("Failed to update auto-debit setting. Please try again.");
    }
  };

  /**
   * Handles invoice download
   * @param {string} invoiceId
   * @returns {Promise<void>}
   */
  const handleDownloadInvoice = async (invoiceId) => {
    try {
      const result = await downloadInvoice(invoiceId).unwrap();
      // Open invoice URL in new tab
      window.open(result.url, "_blank");
    } catch (error) {
      console.error("Failed to download invoice:", error);
      alert("Failed to download invoice. Please try again.");
    }
  };

  /**
   * Formats currency amount
   * @param {number} amount
   * @param {string} currency
   * @returns {string}
   */
  const formatCurrency = (amount, currency = "INR") => {
    if (currency === "INR") {
      return `₹${amount.toLocaleString("en-IN")}`;
    }
    return `$${amount.toLocaleString("en-US")}`;
  };

  /**
   * Formats date from YYYY-MM format
   * @param {string} dateStr
   * @returns {string}
   */
  const formatInvoiceDate = (dateStr) => {
    if (!dateStr) return "—";
    const [year, month] = dateStr.split("-");
    if (!year || !month) return dateStr;
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  if (summaryLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-slate-600">Loading billing information...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-semibold text-slate-900">
            Billing
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your billing, invoices, and payment methods
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Current Month Summary */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Current Month Summary</h2>
            <p className="text-sm text-slate-600 mt-1">
              Usage and billing for {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          </div>
          
          <div className="px-6 py-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              
              {/* Minutes */}
              <div>
                <div className="text-sm font-medium text-slate-600 mb-1">Minutes</div>
                <div className="text-2xl font-semibold text-slate-900">
                  {summary?.minutes?.toLocaleString() ?? "—"}
                </div>
              </div>

              {/* Bot Minutes */}
              <div>
                <div className="text-sm font-medium text-slate-600 mb-1">Bot Minutes</div>
                <div className="text-2xl font-semibold text-slate-900">
                  {summary?.botMinutes?.toLocaleString() ?? "—"}
                </div>
              </div>

              {/* Storage */}
              <div>
                <div className="text-sm font-medium text-slate-600 mb-1">Storage</div>
                <div className="text-2xl font-semibold text-slate-900">
                  {summary?.storageGB ? `${summary.storageGB}GB` : "—"}
                </div>
              </div>

              {/* DIDs */}
              <div>
                <div className="text-sm font-medium text-slate-600 mb-1">DIDs</div>
                <div className="text-2xl font-semibold text-slate-900">
                  {summary?.dids ?? "—"}
                </div>
              </div>

              {/* SIP Trunks */}
              <div>
                <div className="text-sm font-medium text-slate-600 mb-1">SIP Trunks</div>
                <div className="text-2xl font-semibold text-slate-900">
                  {summary?.sipTrunks ?? "—"}
                </div>
              </div>

            </div>

            {/* Estimated Amount */}
            {summary?.estimatedAmount && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-600">
                    Estimated Amount (Month to Date)
                  </div>
                  <div className="text-xl font-semibold text-slate-900">
                    {formatCurrency(summary.estimatedAmount)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Invoices */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Invoices</h2>
            <p className="text-sm text-slate-600 mt-1">
              View and download past invoices
            </p>
          </div>

          {invoicesLoading ? (
            <div className="px-6 py-8 text-center text-slate-500">Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-sm text-slate-500">No invoices yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {invoices.map(
                    /**
                     * @param {Invoice} invoice
                     */
                    (invoice) => (
                    <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {formatInvoiceDate(invoice.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          INVOICE_STATUS_CONFIG[invoice.status]?.className || "bg-slate-100 text-slate-800"
                        }`}>
                          {INVOICE_STATUS_CONFIG[invoice.status]?.label || invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDownloadInvoice(invoice.id)}
                          className="text-slate-600 hover:text-slate-900"
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Payment Methods</h2>
            <p className="text-sm text-slate-600 mt-1">
              Manage your payment methods and auto-debit settings
            </p>
          </div>
          
          <div className="px-6 py-6 space-y-6">
            
            {/* Add Card Button */}
            <div>
              <button
                onClick={() => setShowAddCardModal(true)}
                className="inline-flex items-center px-4 py-2 bg-slate-900 text-white text-sm font-medium 
                           rounded-lg hover:bg-slate-800 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Card
              </button>
            </div>

            {/* Payment Methods List */}
            {paymentMethodsLoading ? (
              <div className="text-sm text-slate-500">Loading payment methods...</div>
            ) : paymentMethods.length > 0 ? (
              <div className="space-y-3">
                {paymentMethods.map(
                  /**
                   * @param {PaymentMethod} method
                   */
                  (method) => (
                  <div 
                    key={method.id} 
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-8 bg-slate-100 rounded flex items-center justify-center">
                        <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {method.brand} •••• {method.last4}
                        </div>
                        <div className="text-xs text-slate-500">
                          Expires {method.expiryMonth}/{method.expiryYear}
                        </div>
                      </div>
                      {method.isDefault && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <button className="text-sm text-slate-600 hover:text-slate-900">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Auto-Debit Toggle */}
            <div className="pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-900">Auto-Debit</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Automatically charge your default payment method on due date
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAutoDebitToggle(true)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      autoDebitEnabled
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Enabled
                  </button>
                  <button
                    onClick={() => handleAutoDebitToggle(false)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      !autoDebitEnabled
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Disabled
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Add Card Modal */}
      {showAddCardModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
              onClick={() => setShowAddCardModal(false)}
            />

            {/* Modal */}
            <div className="relative">
              <AddPaymentMethodModal
                onClose={() => setShowAddCardModal(false)}
                onSuccess={() => {/* Refresh payment methods */}}
              />
            </div>

          </div>
        </div>
      )}

    </div>
  );
}