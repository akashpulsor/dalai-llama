// @ts-check
import React, { useState } from 'react';
import { CheckCircle2, Sparkles, Zap, Crown, Building2, ChevronRight, Minus, Plus, Users, Info } from 'lucide-react';
import { useGetProductPlansQuery } from "@dalaillama/shared-store";

/**
 * @typedef {Object} AiProviderInfo
 * @property {string} provider
 * @property {string} model
 * @property {number} cost
 * @property {string} icon
 * @property {string} color
 */

/**
 * @typedef {Object} AiStack
 * @property {AiProviderInfo} stt
 * @property {AiProviderInfo} tts
 * @property {AiProviderInfo} llm
 */

/**
 * @typedef {Object} PlanPricing
 * @property {string} id
 * @property {string} code
 * @property {string} name
 * @property {'BUDGET'|'STANDARD'|'PREMIUM'|'ENTERPRISE'} tier
 * @property {number} platformFee
 * @property {number} perAgentFee
 * @property {number} includedAgents
 * @property {number} maxAgents
 * @property {number} includedMinutes
 * @property {string} [aiStackType]
 * @property {number} [aiRatePerMin]
 * @property {AiStack} [stack]
 */

/**
 * @typedef {Object} AvailableDid
 * @property {string} number
 * @property {string} country
 * @property {string} city
 * @property {string} type
 * @property {string} monthlyFee
 * @property {string} setupFee
 * @property {string} provider
 * @property {string} currency
 * @property {string} inboundPrice
 * @property {string} outboundPrice
 */

/** @type {Record<string, PlanPricing[]>} */
const MOCK_PLANS = {
  AI_CC: [
    {
      id: 'aicc-budget', code: 'AICC_BUDGET', name: 'Budget', tier: 'BUDGET',
      platformFee: 4999, perAgentFee: 699, includedAgents: 3, maxAgents: 25,
      includedMinutes: 3000, aiStackType: 'BUDGET', aiRatePerMin: 4.00,
      stack: {
        stt: { provider: 'Groq', model: 'whisper-large-v3', cost: 0.10, icon: 'https://groq.com/favicon.ico', color: '#F55036' },
        tts: { provider: 'Google', model: 'wavenet', cost: 1.00, icon: 'https://www.gstatic.com/favicon.ico', color: '#4285F4' },
        llm: { provider: 'Groq', model: 'llama-3.1-70b', cost: 0.15, icon: 'https://groq.com/favicon.ico', color: '#F55036' }
      }
    },
    {
      id: 'aicc-standard', code: 'AICC_STANDARD', name: 'Standard', tier: 'STANDARD',
      platformFee: 4999, perAgentFee: 699, includedAgents: 5, maxAgents: 50,
      includedMinutes: 3000, aiStackType: 'STANDARD', aiRatePerMin: 6.00,
      stack: {
        stt: { provider: 'Deepgram', model: 'nova-2', cost: 0.50, icon: 'https://deepgram.com/favicon.ico', color: '#13EF93' },
        tts: { provider: 'OpenAI', model: 'tts-1', cost: 1.25, icon: 'https://openai.com/favicon.ico', color: '#000' },
        llm: { provider: 'OpenAI', model: 'gpt-4o-mini', cost: 0.80, icon: 'https://openai.com/favicon.ico', color: '#000' }
      }
    },
    {
      id: 'aicc-premium', code: 'AICC_PREMIUM', name: 'Premium', tier: 'PREMIUM',
      platformFee: 7999, perAgentFee: 599, includedAgents: 10, maxAgents: 100,
      includedMinutes: 5000, aiStackType: 'PREMIUM', aiRatePerMin: 12.00,
      stack: {
        stt: { provider: 'Deepgram', model: 'nova-2', cost: 0.50, icon: 'https://deepgram.com/favicon.ico', color: '#13EF93' },
        tts: { provider: 'ElevenLabs', model: 'multilingual-v2', cost: 2.50, icon: 'https://elevenlabs.io/favicon.ico', color: '#000' },
        llm: { provider: 'OpenAI', model: 'gpt-4o', cost: 4.00, icon: 'https://openai.com/favicon.ico', color: '#000' }
      }
    }
  ],
  CONV_IVR: [
    {
      id: 'ivr-budget', code: 'IVR_BUDGET', name: 'Budget', tier: 'BUDGET',
      platformFee: 1999, perAgentFee: 399, includedAgents: 2, maxAgents: 10,
      includedMinutes: 2000, aiStackType: 'BUDGET', aiRatePerMin: 3.50,
      stack: {
        stt: { provider: 'Groq', model: 'whisper-large-v3', cost: 0.10, icon: 'https://groq.com/favicon.ico', color: '#F55036' },
        tts: { provider: 'Google', model: 'wavenet', cost: 1.00, icon: 'https://www.gstatic.com/favicon.ico', color: '#4285F4' },
        llm: { provider: 'Groq', model: 'llama-3.1-70b', cost: 0.15, icon: 'https://groq.com/favicon.ico', color: '#F55036' }
      }
    },
    {
      id: 'ivr-standard', code: 'IVR_STANDARD', name: 'Standard', tier: 'STANDARD',
      platformFee: 1999, perAgentFee: 399, includedAgents: 3, maxAgents: 20,
      includedMinutes: 2000, aiStackType: 'STANDARD', aiRatePerMin: 5.50,
      stack: {
        stt: { provider: 'Deepgram', model: 'nova-2', cost: 0.50, icon: 'https://deepgram.com/favicon.ico', color: '#13EF93' },
        tts: { provider: 'OpenAI', model: 'tts-1', cost: 1.25, icon: 'https://openai.com/favicon.ico', color: '#000' },
        llm: { provider: 'OpenAI', model: 'gpt-4o-mini', cost: 0.80, icon: 'https://openai.com/favicon.ico', color: '#000' }
      }
    }
  ],
  BASIC_PBX: [
    { id: 'pbx-starter', code: 'PBX_STARTER', name: 'Starter', tier: 'BUDGET', platformFee: 999, perAgentFee: 299, includedAgents: 2, maxAgents: 10, includedMinutes: 1000 },
    { id: 'pbx-business', code: 'PBX_BUSINESS', name: 'Business', tier: 'STANDARD', platformFee: 1999, perAgentFee: 249, includedAgents: 5, maxAgents: 25, includedMinutes: 3000 }
  ],
  VIRTUAL_RECEPTIONIST: [
    {
      id: 'vr-budget', code: 'VR_BUDGET', name: 'Budget', tier: 'BUDGET',
      platformFee: 1499, perAgentFee: 0, includedAgents: 1, maxAgents: 1,
      includedMinutes: 500, aiStackType: 'BUDGET', aiRatePerMin: 3.00,
      stack: {
        stt: { provider: 'Groq', model: 'whisper-large-v3', cost: 0.10, icon: 'https://groq.com/favicon.ico', color: '#F55036' },
        tts: { provider: 'Google', model: 'wavenet', cost: 1.00, icon: 'https://www.gstatic.com/favicon.ico', color: '#4285F4' },
        llm: { provider: 'Groq', model: 'llama-3.1-70b', cost: 0.15, icon: 'https://groq.com/favicon.ico', color: '#F55036' }
      }
    },
    {
      id: 'vr-standard', code: 'VR_STANDARD', name: 'Standard', tier: 'STANDARD',
      platformFee: 1499, perAgentFee: 0, includedAgents: 1, maxAgents: 1,
      includedMinutes: 500, aiStackType: 'STANDARD', aiRatePerMin: 5.00,
      stack: {
        stt: { provider: 'Deepgram', model: 'nova-2', cost: 0.50, icon: 'https://deepgram.com/favicon.ico', color: '#13EF93' },
        tts: { provider: 'OpenAI', model: 'tts-1', cost: 1.25, icon: 'https://openai.com/favicon.ico', color: '#000' },
        llm: { provider: 'OpenAI', model: 'gpt-4o-mini', cost: 0.80, icon: 'https://openai.com/favicon.ico', color: '#000' }
      }
    }
  ],
  OUTBOUND_DIALER: [
    { id: 'dialer-starter', code: 'DIALER_STARTER', name: 'Starter', tier: 'BUDGET', platformFee: 2499, perAgentFee: 499, includedAgents: 3, maxAgents: 15, includedMinutes: 5000 },
    {
      id: 'dialer-ai', code: 'DIALER_AI', name: 'AI-Powered', tier: 'STANDARD',
      platformFee: 6999, perAgentFee: 499, includedAgents: 5, maxAgents: 50,
      includedMinutes: 10000, aiStackType: 'STANDARD', aiRatePerMin: 4.00,
      stack: {
        stt: { provider: 'Deepgram', model: 'nova-2', cost: 0.50, icon: 'https://deepgram.com/favicon.ico', color: '#13EF93' },
        tts: { provider: 'OpenAI', model: 'tts-1', cost: 1.25, icon: 'https://openai.com/favicon.ico', color: '#000' },
        llm: { provider: 'OpenAI', model: 'gpt-4o-mini', cost: 0.80, icon: 'https://openai.com/favicon.ico', color: '#000' }
      }
    }
  ]
};

/** @type {Record<string, {icon: import('lucide-react').LucideIcon, color: string}>} */
const TIER_CONFIG = {
  BUDGET: { icon: Zap, color: 'emerald' },
  STANDARD: { icon: Sparkles, color: 'purple' },
  PREMIUM: { icon: Crown, color: 'amber' },
  ENTERPRISE: { icon: Building2, color: 'slate' }
};

/** @type {string[]} */
const AI_STACK_KEYS = ['stt', 'tts', 'llm'];

/**
 * @param {{productCode: string, selectedDid: AvailableDid, onSelect: (plan: PlanPricing, agentCount: number) => void}} props
 */
export const PlanSelector = ({ productCode, selectedDid, onSelect }) => {
  const { data: apiPlans = [], isLoading } = useGetProductPlansQuery(productCode);
  const plans = apiPlans.length > 0 ? apiPlans : MOCK_PLANS[productCode] || MOCK_PLANS['BASIC_PBX'];

  const [selectedPlanId, setSelectedPlanId] = useState(/** @type {string|null} */ (null));
  const [agentCounts, setAgentCounts] = useState(/** @type {Record<string, number>} */ ({}));

  /** @param {PlanPricing} plan */
  const getAgentCount = (plan) => agentCounts[plan.id] ?? plan.includedAgents;

  /**
   * @param {string} planId
   * @param {number} delta
   */
  const updateAgentCount = (planId, delta) => {
    const plan = plans.find((/** @type {PlanPricing} */ p) => p.id === planId);
    if (!plan) return;
    
    setAgentCounts(prev => {
      const current = prev[planId] ?? plan.includedAgents;
      const next = Math.max(plan.includedAgents, Math.min(plan.maxAgents, current + delta));
      return { ...prev, [planId]: next };
    });
  };

  /** @param {PlanPricing} plan */
  const calculatePrice = (/** @type {PlanPricing} */ plan) => {
    const agents = getAgentCount(plan);
    const extraAgents = Math.max(0, agents - plan.includedAgents);
    return plan.platformFee + (extraAgents * plan.perAgentFee);
  };

  const handleContinue = () => {
    const plan = plans.find((/** @type {PlanPricing} */ p) => p.id === selectedPlanId);
    if (plan) onSelect(plan, getAgentCount(plan));
  };

  /**
   * @param {AiStack} stack
   * @param {string} key
   */
  const getStackInfo = (stack, key) => {
    if (key === 'stt') return stack.stt;
    if (key === 'tts') return stack.tts;
    return stack.llm;
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">Choose Your Plan</h2>
        <div className="text-xs text-slate-400 font-medium">
          DID: <span className="text-slate-600 font-mono">+{selectedDid.number}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3 mb-6 max-h-[380px] overflow-y-auto pr-1">
        {plans.map((/** @type {PlanPricing} */ plan) => {
          const tierConfig = TIER_CONFIG[plan.tier] || TIER_CONFIG.STANDARD;
          const TierIcon = tierConfig.icon;
          const isSelected = selectedPlanId === plan.id;
          const hasAi = !!plan.aiStackType && !!plan.stack;
          const agentCount = getAgentCount(plan);
          const totalPrice = calculatePrice(plan);
          const showAgentSelector = plan.perAgentFee > 0 && plan.maxAgents > plan.includedAgents;

          return (
            <div
              key={plan.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedPlanId(plan.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedPlanId(plan.id);
                }
              }}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                isSelected 
                  ? 'border-purple-500 bg-purple-50/50 shadow-lg shadow-purple-100' 
                  : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <TierIcon size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{plan.name}</span>
                      {plan.tier === 'STANDARD' && (
                        <span className="text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">Popular</span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      {plan.includedAgents} agents + {plan.includedMinutes.toLocaleString()} mins included
                    </span>
                  </div>
                </div>
                {isSelected && <CheckCircle2 size={20} className="text-purple-600 shrink-0" />}
              </div>

            {hasAi && plan.stack && (
                    <div className="flex items-center gap-2 mb-3 py-2 px-3 bg-slate-50 rounded-xl">
                        <div className="flex -space-x-1.5">
                        {AI_STACK_KEYS.map((key) => {
                            const stack = plan.stack;
                            if (!stack) return null;
                            const info = getStackInfo(stack, key);
                            return (
                            <div 
                                key={key}
                                className="w-6 h-6 rounded-full bg-white border-2 border-white shadow-sm flex items-center justify-center overflow-hidden"
                                title={info.provider}
                            >
                                <img 
                                src={info.icon} 
                                alt="" 
                                className="w-4 h-4" 
                                onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                                />
                            </div>
                            );
                        })}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{plan.aiStackType}</span>
                        <span className="ml-auto text-xs font-bold text-slate-600">₹{plan.aiRatePerMin}/min</span>
                        <div className="ml-2 group relative flex items-center">
                          <Info size={13} className="text-slate-400" />
                          <div className="pointer-events-none absolute right-0 top-6 z-20 w-52 rounded-xl bg-slate-900 px-3 py-2 text-[10px] font-medium leading-4 text-white opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100">
                            This rate may change based on the model you choose.
                          </div>
                        </div>
                    </div>
            )}          

              {showAgentSelector && isSelected && (
                <div className="flex items-center justify-between py-3 px-4 bg-white border border-slate-200 rounded-xl mb-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-600">Agent Seats</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={(e) => { e.stopPropagation(); updateAgentCount(plan.id, -1); }} disabled={agentCount <= plan.includedAgents} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed">
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center font-bold text-slate-900">{agentCount}</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); updateAgentCount(plan.id, 1); }} disabled={agentCount >= plan.maxAgents} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-end justify-between">
                <div>
                  <span className="text-2xl font-black text-slate-900">₹{totalPrice.toLocaleString()}</span>
                  <span className="text-slate-400 text-sm">/mo</span>
                </div>
                {showAgentSelector && agentCount > plan.includedAgents && (
                  <span className="text-xs text-slate-400">+{agentCount - plan.includedAgents} extra @ ₹{plan.perAgentFee}/ea</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      <button type="button" disabled={!selectedPlanId || isLoading} onClick={handleContinue} className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold shadow-xl shadow-purple-200 hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        Continue to Payment <ChevronRight size={18} />
      </button>
    </div>
  );
};

