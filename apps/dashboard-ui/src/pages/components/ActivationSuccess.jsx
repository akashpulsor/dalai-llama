import React from 'react';
import { CheckCircle2, ShieldAlert, Terminal, ArrowRight, Copy, ExternalLink } from 'lucide-react';

/**
 * @typedef {Object} ActivationSuccessProps
 * @property {string} number - The provisioned DID number.
 * @property {string} planType - The infrastructure plan type (DEDICATED/SHARED).

 */

/**
 * ActivationSuccess component displayed after successful tenant provisioning.
 * Highlights the active DID and provides a call-to-action for KYC.
 * * @component
 * @param {ActivationSuccessProps} props
 * @returns {React.JSX.Element}
 */
export const ActivationSuccess = ({ number, planType}) => {
  /**
   * Helper to copy the DID to clipboard
   */
  const copyToClipboard = () => {
    document.execCommand('copy');
    // In a real app, you'd use a toast notification here
  };

  return (
    // AFTER:
<div className="flex flex-col h-full animate-in zoom-in-95 duration-500">
  {/* Fixed Header */}
  <div className="text-center shrink-0">
    <div className="relative mb-8">
      <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto relative z-10 border-4 border-white shadow-xl shadow-emerald-100/50">
        <CheckCircle2 size={48} strokeWidth={2.5} />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-emerald-100 rounded-full animate-ping opacity-20" />
    </div>

    <h2 className="text-2xl font-black text-slate-900 mb-2">Tenant Active</h2>
    <p className="text-slate-500 text-sm mb-6 max-w-[280px] mx-auto">
      Your {planType.toLowerCase()} instance has been provisioned and is ready for traffic.
    </p>
  </div>

  {/* Scrollable Content */}
  <div className="flex-1 overflow-y-auto min-h-0">
    {/* Info Grid */}
    <div className="space-y-4 mb-8 text-left">
      {/* Active DID Card */}
      <div className="bg-slate-900 rounded-2xl p-5 relative overflow-hidden">
        <div className="flex justify-between items-start mb-3">
          <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Active DID</span>
          <button onClick={copyToClipboard} className="text-slate-500 hover:text-white transition-colors"><Copy size={14} /></button>
        </div>
        <p className="text-white font-mono text-lg font-bold">{number}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-slate-400">Routing Live</span>
        </div>
      </div>

      {/* Tenant Details */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Workspace Details</h3>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Plan</span>
          <span className="font-medium text-slate-900">{planType}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Region</span>
          <span className="font-medium text-slate-900">ap-south-1</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Status</span>
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <CheckCircle2 size={14} /> Active
          </span>
        </div>
      </div>
    </div>

    {/* Bottom Actions */}
    <div className="space-y-3">
      <button 
        onClick={() => window.location.href = "/designer"}
        className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold shadow-xl shadow-purple-200 hover:bg-purple-700 transition-all flex items-center justify-center gap-2 group"
      >
        Open App Designer 
        <ExternalLink size={18} className="opacity-50 group-hover:opacity-100 transition-opacity" />
      </button>
      
      <p className="text-[10px] text-slate-400 font-medium text-center">
        Workspace ID: <span className="font-mono">{Math.random().toString(36).substring(7).toUpperCase()}</span>
      </p>
    </div>
  </div>
</div>
  );
};
