import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Settings, 
  CreditCard, 
  ChevronRight, 
  Zap, 
  Shield, 
  Star, 
  Plus, 
  MoreVertical, 
  Search, 
  Menu,
  CheckCircle2,
  Cpu,
  PhoneCall,
  Activity,
  Filter,
  Layers
} from 'lucide-react';


/**
 * @typedef {Object} Plan
 * @property {string} id - Unique identifier for the plan.
 * @property {string} name - Display name of the plan (e.g., AI CC Starter).
 * @property {string} code - Technical code (e.g., AI_CC_STARTER).
 * @property {string | null} [description] - Optional plan details.
 * @property {'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'} tier - Service tier level.
 * @property {number} monthlyPrice - Recurring cost per month.
 * @property {string} currency - ISO currency code (e.g., INR).
 * @property {boolean} default - Whether this is the primary recommended plan.
 */

/**
 * PlanCard Component
 * Renders commercial tier details including pricing and tier-specific styling.
 * @component
 * @param {Object} props
 * @param {Plan} props.plan - The plan data object.
 * @returns {React.JSX.Element | null}
 */
const PlanCard = ({ plan }) => {
  if (!plan) return null;

  /** @param {Plan['tier']} tier */
  const getTierStyles = (tier) => {
    switch(tier) {
      case 'ENTERPRISE': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'PROFESSIONAL': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'STARTER': return 'bg-sky-50 text-sky-700 border-sky-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: plan.currency || 'INR',
    maximumFractionDigits: 0
  }).format(plan.monthlyPrice);

  return (
    <div className={`relative bg-white border rounded-2xl p-6 transition-all hover:shadow-xl ${plan.default ? 'border-indigo-600 ring-1 ring-indigo-600' : 'border-slate-200'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${getTierStyles(plan.tier)}`}>
          {plan.tier}
        </div>
        <button className="text-slate-300 hover:text-slate-500"><MoreVertical size={18} /></button>
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">{plan.name}</h3>
      <code className="text-[10px] text-slate-400 mb-4 block font-mono">{plan.code}</code>
      <div className="text-2xl font-black text-slate-900 mb-6">
        {formattedPrice}
        <span className="text-xs font-normal text-slate-400 ml-1">/month</span>
      </div>
      <button className="w-full py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-bold hover:bg-indigo-600 hover:text-white transition-all text-sm">
        Edit Parameters
      </button>
    </div>
  );
};