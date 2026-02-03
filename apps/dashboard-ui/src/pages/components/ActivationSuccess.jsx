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
    <div className="text-center animate-in zoom-in-95 duration-500">
      {/* Success Animation Header */}
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto relative z-10 border-4 border-white shadow-xl shadow-emerald-100/50">
          <CheckCircle2 size={48} strokeWidth={2.5} />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-emerald-100 rounded-full animate-ping opacity-20" />
      </div>

      <h2 className="text-2xl font-black text-slate-900 mb-2">Tenant Active</h2>
      <p className="text-slate-500 text-sm mb-10 max-w-[280px] mx-auto">
        Your {planType.toLowerCase()} instance has been provisioned and is ready for traffic.
      </p>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Active Routing Card */}
        <div className="bg-slate-900 rounded-[2.5rem] p-6 text-left relative overflow-hidden group border border-slate-800 shadow-2xl">
          <Terminal className="absolute -right-6 -bottom-6 text-white opacity-5 group-hover:opacity-10 transition-all duration-500 scale-150" size={120} />
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest px-2 py-0.5 bg-purple-500/10 rounded-md">
                Active DID
              </span>
              <button 
                onClick={copyToClipboard}
                className="text-slate-500 hover:text-white transition-colors p-1"
                title="Copy Number"
              >
                <Copy size={14} />
              </button>
            </div>
            <p className="text-white font-mono text-lg font-bold tracking-tight mb-2">
              {number}
            </p>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Routing Live</span>
            </div>
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
        
        <p className="text-[10px] text-slate-400 font-medium">
          Workspace ID: <span className="font-mono">{Math.random().toString(36).substring(7).toUpperCase()}</span>
        </p>
      </div>
    </div>
  );
};