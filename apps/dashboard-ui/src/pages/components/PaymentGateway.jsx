import React, { useState } from 'react';
import {
  CreditCard,
  Smartphone,
  ArrowRight,
  CheckCircle,
  Users,
  Cpu,
  Phone,
  Clock,
  Info,
  ShieldCheck,
  Landmark,
} from 'lucide-react';

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

/**
 * @typedef {Object} PaymentGatewayProps
 * @property {PlanPricing} plan
 * @property {AvailableDid} selectedDid
 * @property {number} agentCount
 * @property {() => void} onComplete
 */

/** @typedef {'RAZORPAY' | 'CARD' | 'UPI'} PaymentMethod */

const formatMoney = (value) => `INR ${Number(value || 0).toLocaleString('en-IN')}`;

/**
 * @param {PaymentGatewayProps} props
 * @returns {React.JSX.Element}
 */
export const PaymentGateway = ({ plan, selectedDid, agentCount, onComplete }) => {
  const extraAgents = Math.max(0, agentCount - plan.includedAgents);
  const agentFees = extraAgents * plan.perAgentFee;
  const platformTotal = plan.platformFee + agentFees;
  const didMonthly = Number(selectedDid.monthlyFee);
  const didSetup = Number(selectedDid.setupFee);
  const orderTotal = platformTotal + didMonthly + didSetup;
  const walletBalance = 50;
  const amountDue = Math.max(0, orderTotal - walletBalance);
  const hasAi = !!plan.aiStackType && !!plan.stack;

  /** @type {[{id: string, last4: string, brand: string}[], React.Dispatch<any>]} */
  const [savedCards] = useState([{ id: 'card_1', last4: '4242', brand: 'Visa' }]);
  const [selectedCard, setSelectedCard] = useState(savedCards[0]?.id || 'new');
  const [saveCard, setSaveCard] = useState(true);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');
  const [upiId, setUpiId] = useState('');
  const [method, setMethod] = useState(/** @type {PaymentMethod} */ ('RAZORPAY'));
  const [isProcessing, setIsProcessing] = useState(false);

  const isUsingNewCard = method === 'CARD' && selectedCard === 'new';
  const isCardValid = selectedCard !== 'new' || (
    cardNumber.trim().length >= 12 &&
    expiry.trim().length >= 4 &&
    cvv.trim().length >= 3 &&
    nameOnCard.trim().length >= 2
  );
  const isUpiValid = upiId.includes('@');
  const isPayDisabled =
    isProcessing ||
    amountDue <= 0 ||
    (method === 'UPI' && !isUpiValid) ||
    (method === 'CARD' && !isCardValid);

  const handlePayment = () => {
    if (isPayDisabled) return;
    setIsProcessing(true);
    setTimeout(() => {
      onComplete();
      setIsProcessing(false);
    }, 1600);
  };

  const paymentCtaLabel =
    method === 'RAZORPAY'
      ? 'Subscribe'
      : method === 'UPI'
        ? 'Pay with UPI'
        : 'Pay Securely';

  return (
    <div className="flex h-full min-h-0 flex-col animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Complete Payment</h2>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Review the order and continue with your preferred payment gateway.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-purple-100 bg-purple-50 px-2.5 py-1 text-purple-600">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-600" />
          </span>
          <span className="text-[10px] font-black uppercase tracking-tight">
            {plan.name} Plan
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="space-y-5 pb-4">
          <div className="overflow-hidden rounded-3xl bg-slate-900 p-5 text-white shadow-2xl shadow-slate-200">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-500/20">
                    <Cpu size={12} className="text-purple-400" />
                  </div>
                  <span className="text-slate-400">{plan.name} Platform</span>
                </div>
                <span>{formatMoney(plan.platformFee)}</span>
              </div>

              {agentCount > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/20">
                      <Users size={12} className="text-blue-400" />
                    </div>
                    <span className="text-slate-400">{agentCount} Agents</span>
                    {extraAgents > 0 && (
                      <span className="text-xs text-slate-500">
                        ({plan.includedAgents} incl + {extraAgents} extra)
                      </span>
                    )}
                  </div>
                  <span>{extraAgents > 0 ? formatMoney(agentFees) : 'Included'}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20">
                    <Phone size={12} className="text-emerald-400" />
                  </div>
                  <span className="text-slate-400">DID ({selectedDid.type})</span>
                </div>
                <span>{formatMoney(didMonthly)}/mo</span>
              </div>

              {didSetup > 0 && (
                <div className="flex items-center justify-between text-slate-500">
                  <span className="pl-8">Setup Fee (one-time)</span>
                  <span>{formatMoney(didSetup)}</span>
                </div>
              )}

              {hasAi && plan.stack && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      <img src={plan.stack.stt.icon} className="h-5 w-5 rounded-full border border-slate-800" alt="" />
                      <img src={plan.stack.tts.icon} className="h-5 w-5 rounded-full border border-slate-800" alt="" />
                      <img src={plan.stack.llm.icon} className="h-5 w-5 rounded-full border border-slate-800" alt="" />
                    </div>
                    <span className="text-slate-400">AI ({plan.aiStackType})</span>
                    <div className="group relative flex items-center">
                      <Info size={13} className="text-slate-500" />
                      <div className="pointer-events-none absolute left-0 top-6 z-20 w-56 rounded-xl bg-slate-950 px-3 py-2 text-[10px] font-medium leading-4 text-white opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100">
                        This rate may change based on the model you choose.
                      </div>
                    </div>
                  </div>
                  <span>{formatMoney(plan.aiRatePerMin)}/min</span>
                </div>
              )}

              {plan.includedMinutes > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2">
                  <Clock size={14} className="text-emerald-400" />
                  <span className="text-xs text-emerald-400">
                    {plan.includedMinutes.toLocaleString()} mins included
                  </span>
                </div>
              )}

              <div className="space-y-2 border-t border-slate-700 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">First Month Total</span>
                  <span>{formatMoney(orderTotal)}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Wallet Balance</span>
                  <span>-{formatMoney(Math.min(walletBalance, orderTotal))}</span>
                </div>
                <div className="flex justify-between border-t border-slate-700 pt-2">
                  <span className="text-[10px] uppercase tracking-widest text-slate-400">
                    Amount Due
                  </span>
                  <span className="text-xl font-black">{formatMoney(amountDue)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900">Payment Method</h3>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Use Razorpay checkout, pay by UPI, or enter card details directly.
              </p>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                { id: 'RAZORPAY', label: 'Razorpay', icon: Landmark },
                { id: 'UPI', label: 'UPI', icon: Smartphone },
                { id: 'CARD', label: 'Card', icon: CreditCard },
              ].map((option) => {
                const Icon = option.icon;
                const isActive = method === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setMethod(/** @type {PaymentMethod} */ (option.id))}
                    className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-bold transition-all ${
                      isActive
                        ? 'border-purple-500 bg-purple-50 text-slate-900 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>

            {method === 'RAZORPAY' && (
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#072654] text-white">
                    <Landmark size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Hosted Gateway Checkout</p>
                    <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                      We’ll redirect you to Razorpay or an equivalent secure gateway to complete
                      payment with cards, netbanking, wallet, or UPI.
                    </p>
                  </div>
                </div>
                <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                  <div className="rounded-xl bg-white px-3 py-2">Order amount: {formatMoney(amountDue)}</div>
                  <div className="rounded-xl bg-white px-3 py-2">Merchant: Dalai Llama Cloud</div>
                </div>
              </div>
            )}

            {method === 'UPI' && (
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="bg-white border border-slate-200 rounded-xl p-3 focus-within:ring-2 ring-purple-500/20">
                  <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                    UPI ID
                  </label>
                  <input
                    type="text"
                    placeholder="username@bank"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full bg-transparent text-sm font-mono outline-none"
                  />
                </div>
                <p className="text-[11px] font-medium text-slate-500">
                  Payment will continue in your UPI app after gateway verification.
                </p>
              </div>
            )}

            {method === 'CARD' && (
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                {savedCards.length > 0 && (
                  <div className="space-y-2">
                    {savedCards.map((card) => (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => setSelectedCard(card.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                          selectedCard === card.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <CreditCard size={16} className="text-slate-400" />
                        <span className="font-mono text-sm">•••• {card.last4}</span>
                        <span className="text-xs text-slate-400">{card.brand}</span>
                        {selectedCard === card.id && (
                          <CheckCircle size={16} className="ml-auto text-purple-600" />
                        )}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setSelectedCard('new')}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                        selectedCard === 'new'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <CreditCard size={16} className="text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">Use a new card</span>
                    </button>
                  </div>
                )}

                {isUsingNewCard && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-white p-3">
                      <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                        Card Number
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4242 4242 4242 4242"
                        className="w-full bg-transparent text-sm outline-none"
                      />
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                        Expiry
                      </label>
                      <input
                        type="text"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full bg-transparent text-sm outline-none"
                      />
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                        CVV
                      </label>
                      <input
                        type="password"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        placeholder="123"
                        className="w-full bg-transparent text-sm outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-white p-3">
                      <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                        Name on Card
                      </label>
                      <input
                        type="text"
                        value={nameOnCard}
                        onChange={(e) => setNameOnCard(e.target.value)}
                        placeholder="Cardholder name"
                        className="w-full bg-transparent text-sm outline-none"
                      />
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <input
                    type="checkbox"
                    checked={saveCard}
                    onChange={(e) => setSaveCard(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  Save card for future renewals
                </label>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex items-start gap-2 text-xs font-medium text-slate-500">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-500" />
              <p>
                Your payment will be processed through a secure hosted gateway. Final charges,
                taxes, and gateway options may vary based on the payment method and model choices.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-100 bg-white pt-4">
        <button
          type="button"
          disabled={isPayDisabled}
          onClick={handlePayment}
          className="group relative w-full overflow-hidden rounded-2xl bg-purple-600 py-4 font-bold text-white shadow-xl shadow-purple-200 transition-all hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span
            className={`flex items-center justify-center gap-2 transition-transform duration-300 ${
              isProcessing ? '-translate-y-12' : ''
            }`}
          >
            {paymentCtaLabel} for {formatMoney(amountDue)}
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </span>

          {isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center bg-purple-700 animate-in slide-in-from-bottom-full duration-300">
              <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};
