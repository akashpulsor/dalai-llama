import React, { useState } from 'react';
import { CreditCard, Smartphone, ArrowRight, Lock, CheckCircle } from 'lucide-react';

/**
 * @typedef {Object} PaymentDetails
 * @property {'CARD' | 'UPI'} method - The chosen payment method.
 * @property {string} [upiId] - The UPI VPA ID (only if method is UPI).
 * @property {string} [last4] - Mock last 4 digits for UI feedback.
 */

/**
 * @typedef {Object} PaymentGatewayProps
 * @property {number} amount - The total amount to be charged.
 * @property {'SHARED' | 'DEDICATED'} planType - The infrastructure plan type for display.
 * @property {(details: PaymentDetails) => void} onComplete - Callback triggered upon successful payment simulation.
 */

/**
 * PaymentGateway component for processing wallet recharges and setup fees.
 * Integrates visual styles for Stripe and Razorpay SDK simulations.
 * * @component
 * @param {PaymentGatewayProps} props
 * @returns {React.JSX.Element}
 */
export const PaymentGateway = ({ amount, planType, onComplete }) => {
  /** * Explicitly cast the state to the union type to avoid narrow inference.
   * @type {['CARD' | 'UPI', React.Dispatch<React.SetStateAction<'CARD' | 'UPI'>>]} 
   */
  const [method, setMethod] = useState(/** @type {'CARD' | 'UPI'} */ ('CARD'));
  
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [upiId, setUpiId] = useState('');

  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = () => {
    setIsProcessing(true);
    // Simulate SDK latency
    setTimeout(() => {
      onComplete({
        method,
        upiId: method === 'UPI' ? upiId : undefined,
        last4: method === 'CARD' ? '4242' : undefined
      });
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">Wallet Recharge</h2>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-600 rounded-full border border-purple-100">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-tight">{planType} Instance</span>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-slate-900 rounded-3xl p-6 mb-8 text-white relative overflow-hidden shadow-2xl shadow-slate-200">
        <div className="relative z-10">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Authorization</p>
          <h3 className="text-4xl font-black">${amount.toFixed(2)}</h3>
          <div className="mt-4 flex items-center gap-2 text-slate-400 text-[10px]">
            <Lock size={12} />
            <span>Encrypted by 256-bit SSL</span>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-4 -mt-4 p-8 bg-white/5 rounded-full">
          <CreditCard size={80} className="rotate-12 opacity-20" />
        </div>
      </div>

      {/* Method Switcher */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6">
        <button 
          type="button"
          onClick={() => setMethod('CARD')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${method === 'CARD' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <CreditCard size={14} /> Stripe Card
        </button>
        <button 
          type="button"
          onClick={() => setMethod('UPI')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${method === 'UPI' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Smartphone size={14} /> Razorpay UPI
        </button>
      </div>

      {/* Dynamic Form Fields */}
      <div className="min-h-[100px] mb-8">
        {(method === 'CARD') ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 focus-within:ring-2 ring-purple-500/20 transition-all">
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Card Details</label>
              <div className="flex items-center gap-3">
                <CreditCard size={18} className="text-slate-300" />
                <input 
                  type="text" 
                  readOnly 
                  value="4242 4242 4242 4242" 
                  className="w-full text-sm font-mono outline-none text-slate-600 bg-transparent"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 focus-within:ring-2 ring-purple-500/20 transition-all">
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">VPA / UPI ID</label>
              <div className="flex items-center gap-3">
                <Smartphone size={18} className="text-slate-300" />
                <input 
                  type="text" 
                  placeholder="username@bank" 
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full text-sm font-mono outline-none text-slate-900 bg-transparent"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 px-1 italic">We will send a payment request to your UPI app.</p>
          </div>
        )}
      </div>

      <button 
        type="button"
        disabled={isProcessing || (method === 'UPI' && !upiId)}
        onClick={handlePayment}
        className="group relative w-full py-4 bg-purple-600 text-white rounded-2xl font-bold shadow-xl shadow-purple-200 hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
      >
        <span className={`flex items-center justify-center gap-2 transition-transform duration-300 ${isProcessing ? '-translate-y-12' : ''}`}>
          Authorize & Provision <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </span>
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-purple-700 animate-in slide-in-from-bottom-full duration-300">
            <span className="flex items-center gap-2 text-sm">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Contacting Banks...
            </span>
          </div>
        )}
      </button>

      <div className="mt-8 flex items-center justify-center gap-6 opacity-30 grayscale pointer-events-none">
        <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-4" />
        <div className="w-px h-3 bg-slate-300" />
        <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="h-4" />
      </div>
    </div>
  );
};