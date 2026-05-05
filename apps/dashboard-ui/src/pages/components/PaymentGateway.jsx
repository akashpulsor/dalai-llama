import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  ArrowRight,
  Users,
  Cpu,
  Phone,
  Clock,
  Info,
  ShieldCheck,
  Loader2,
  Wallet,
  X,
} from 'lucide-react';

import {
  showFlash,
  useCreateSubscriptionMutation,
  useLazyGetSubscriptionStatusQuery,
  useGetWalletBalanceQuery,
} from '@dalaillama/shared-store';

/** @typedef {{ provider: string, model: string, cost: number, icon: string, color: string }} AiProviderInfo */
/** @typedef {{ stt: AiProviderInfo, tts: AiProviderInfo, llm: AiProviderInfo }} AiStack */
/** @typedef {{ id: string, code: string, name: string, tier: 'BUDGET'|'STANDARD'|'PREMIUM'|'ENTERPRISE', platformFee: number, perAgentFee: number, includedAgents: number, maxAgents: number, includedMinutes: number, aiStackType?: string, aiRatePerMin?: number, stack?: AiStack }} PlanPricing */
/** @typedef {{ number: string, country: string, city: string, type: string, monthlyFee: string, setupFee: string, provider: string, currency: string, inboundPrice: string, outboundPrice: string }} AvailableDid */
/** @typedef {{ plan: PlanPricing, selectedDid: AvailableDid, agentCount: number, tenantId: string, productCode: string, onComplete: () => void, onRechargeRequired?: (amount: number) => void }} PaymentGatewayProps */
/** @typedef {'idle'|'creating_subscription'|'polling_status'} CheckoutStage */
/** @typedef {'success'|'error'|'info'} ToastType */
/** @typedef {{ subscriptionId: string, gatewayOrderId?: string, requiredAmount?: number, paymentId?: string, status?: string }} SubscriptionCreateResponse */
/** @typedef {{ status: string, subscriptionId?: string }} SubscriptionStatusResponse */
/** @typedef {{ type: ToastType, message: string, onClose: () => void }} InlineToastProps */

/** @param {number | string | null | undefined} value */
const formatMoney = (value) => `INR ${Number(value || 0).toLocaleString('en-IN')}`;

/** @param {InlineToastProps} props */
const InlineToast = ({ type, message, onClose }) => {
  const toneClass =
    type === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : type === 'error'
        ? 'border-rose-200 bg-rose-50 text-rose-700'
        : 'border-sky-200 bg-sky-50 text-sky-700';

  return (
    <div className={`fixed right-4 top-4 z-[140] max-w-sm rounded-2xl border px-4 py-3 shadow-xl ${toneClass}`}>
      <div className="flex items-start gap-3">
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button type="button" onClick={onClose} className="rounded-lg p-1 opacity-70 hover:opacity-100" aria-label="Close notification">
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

/** @param {PaymentGatewayProps} props */
export const PaymentGateway = ({ plan, selectedDid, agentCount, tenantId, productCode, onComplete, onRechargeRequired }) => {
  const dispatch = useDispatch();
  const pollIntervalRef = useRef(/** @type {ReturnType<typeof setInterval> | null} */ (null));
  const provisioningNoticeShownRef = useRef(false);
  const [createSubscriptionMutation] = useCreateSubscriptionMutation();
  const [fetchSubscriptionStatus] = useLazyGetSubscriptionStatusQuery();

  const extraAgents = Math.max(0, agentCount - plan.includedAgents);
  const agentFees = extraAgents * plan.perAgentFee;
  const platformTotal = plan.platformFee + agentFees;
  const didMonthly = Number(selectedDid.monthlyFee);
  const didSetup = Number(selectedDid.setupFee);
  const orderTotal = platformTotal + didMonthly + didSetup;
  const { data: walletInfo, refetch: refetchWallet } = useGetWalletBalanceQuery(tenantId, { skip: !tenantId });
  const walletBalance = walletInfo?.balance ?? 0;
  const amountDue = Math.max(0, orderTotal - walletBalance);
  const hasEnoughWalletBalance = walletBalance >= orderTotal;
  const hasAi = !!plan.aiStackType && !!plan.stack;

  const [checkoutStage, setCheckoutStage] = useState(/** @type {CheckoutStage} */ ('idle'));

  // Listen for wallet-funded WebSocket event and refetch balance
  useEffect(() => {
    const handleWalletFunded = () => {
      refetchWallet();
    };
    window.addEventListener('wallet-funded', handleWalletFunded);
    return () => window.removeEventListener('wallet-funded', handleWalletFunded);
  }, [refetchWallet]);
  const [toast, setToast] = useState(/** @type {{ message: string, type: ToastType } | null} */ (null));

  const isBusy = checkoutStage !== 'idle';

  /** @type {(message: string, type?: ToastType) => void} */
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    dispatch(showFlash({ message, type }));
  }, [dispatch]);

  const clearPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => () => clearPolling(), [clearPolling]);

  const createSubscription = useCallback(async () => {
    const payload = {
      tenantId,
      productCode,
      planCode: plan.code,
      agentCount,
      did: {
        number: selectedDid.number,
        country: selectedDid.country || 'IN',
        region: selectedDid.city || selectedDid.country || '',
        city: selectedDid.city || '',
        monthlyFee: Number(selectedDid.monthlyFee),
        setupFee: Number(selectedDid.setupFee),
      },
    };

    return /** @type {Promise<SubscriptionCreateResponse>} */ (
      createSubscriptionMutation(payload).unwrap()
    );
  }, [agentCount, createSubscriptionMutation, plan.code, productCode, selectedDid, tenantId]);

  const handleActivated = useCallback(() => {
    clearPolling();
    setCheckoutStage('idle');
    showToast('Subscription activated successfully', 'success');
    onComplete();
  }, [clearPolling, onComplete, showToast]);

  const handleProvisioningFailure = useCallback(() => {
    clearPolling();
    setCheckoutStage('idle');
    showToast('Activation failed. Please contact support.', 'error');
  }, [clearPolling, showToast]);

  useEffect(() => {
    /** @param {Event} nativeEvent */
    const handleProvisioningEvent = (nativeEvent) => {
      const event = /** @type {CustomEvent<any>} */ (nativeEvent).detail || {};
      const normalizedStatus = String(event.status || "").toUpperCase();
      const normalizedEvent = String(event.event || "").toUpperCase();

      if (normalizedStatus === "FAILED" || normalizedStatus === "ERROR" || normalizedStatus === "PARTIAL_FAILURE") {
        handleProvisioningFailure();
        return;
      }

      if (
        normalizedStatus === "ACTIVE" ||
        normalizedStatus === "COMPLETED" ||
        normalizedStatus === "SUCCESS" ||
        normalizedStatus === "READY"
      ) {
        handleActivated();
        return;
      }

      if (event.message) {
        showToast(event.message, "info");
        return;
      }

      if (normalizedEvent === "SUBSCRIPTION_ACTIVATED") {
        showToast("Subscription activated. Provisioning started...", "info");
      }
    };

    window.addEventListener("tenant-provisioning-event", handleProvisioningEvent);
    window.addEventListener("tenant-app-event", handleProvisioningEvent);

    return () => {
      window.removeEventListener("tenant-provisioning-event", handleProvisioningEvent);
      window.removeEventListener("tenant-app-event", handleProvisioningEvent);
    };
  }, [handleActivated, handleProvisioningFailure, showToast]);

  /** @type {(subscriptionId: string) => void} */
  const pollSubscriptionStatus = useCallback((subscriptionId) => {
    provisioningNoticeShownRef.current = false;
    clearPolling();
    setCheckoutStage('polling_status');

    const checkStatus = async () => {
      try {
        const response = /** @type {SubscriptionStatusResponse} */ (
          await fetchSubscriptionStatus(subscriptionId, false).unwrap()
        );

        if (response.status === 'ACTIVE') {
          handleActivated();
          return;
        }

        if (response.status === 'PENDING_PROVISION' && !provisioningNoticeShownRef.current) {
          provisioningNoticeShownRef.current = true;
          showToast('Provisioning in progress...', 'info');
        }

        if (response.status === 'FAILED' || response.status === 'PARTIAL_FAILURE') {
          handleProvisioningFailure();
        }
      } catch {
        handleProvisioningFailure();
      }
    };

    void checkStatus();
    pollIntervalRef.current = setInterval(() => {
      void checkStatus();
    }, 3000);
  }, [clearPolling, fetchSubscriptionStatus, handleActivated, handleProvisioningFailure, showToast]);

  const handleSubscribe = useCallback(async () => {
    if (!hasEnoughWalletBalance) {
      onRechargeRequired?.(amountDue);
      showToast('Wallet balance is low. Please recharge to continue.', 'info');
      return;
    }

    try {
      setCheckoutStage('creating_subscription');
      let subscriptionData = await createSubscription();
      let requiredAmount = Number(subscriptionData?.requiredAmount || 0);
      let subscriptionId = subscriptionData?.subscriptionId;

      if (requiredAmount > 0) {
        // Ensure we base the decision on the latest balance.
        // If balance is actually low, we must show the recharge modal.
        const refetchResult = await refetchWallet();
        const latestWalletBalance = Number(refetchResult?.data?.balance ?? walletBalance ?? 0);
        const hasEnoughAfterRefetch = Number.isFinite(latestWalletBalance) && latestWalletBalance >= orderTotal;

        if (!hasEnoughAfterRefetch) {
          setCheckoutStage('idle');
          onRechargeRequired?.(requiredAmount);
          showToast('Recharge is required before activation.', 'info');
          return;
        }

        if (subscriptionId) {
          pollSubscriptionStatus(subscriptionId);
          return;
        }
        subscriptionData = await createSubscription();
        requiredAmount = Number(subscriptionData?.requiredAmount || 0);
        subscriptionId = subscriptionData?.subscriptionId;
        if (subscriptionId) {
          pollSubscriptionStatus(subscriptionId);
          return;
        }
        setCheckoutStage('idle');
        showToast('Activation could not start. Please try Activate again.', 'info');
        return;
      }

      if (!subscriptionId) {
        throw new Error('Missing subscriptionId');
      }

      pollSubscriptionStatus(subscriptionId);
    } catch (/** @type {any} */ err) {
      setCheckoutStage('idle');
      const apiMessage = err?.data?.message || err?.message || null;
      showToast(apiMessage || 'Unable to create subscription. Please try again.', 'error');
    }
  }, [amountDue, createSubscription, hasEnoughWalletBalance, onRechargeRequired, orderTotal, pollSubscriptionStatus, refetchWallet, showToast, walletBalance]);

  const paymentCtaLabel = hasEnoughWalletBalance ? 'Activate Subscription' : 'Recharge Wallet';
  const buttonAmount = hasEnoughWalletBalance ? orderTotal : amountDue;
  const stageMessage = checkoutStage === 'creating_subscription'
    ? 'Creating subscription...'
    : checkoutStage === 'polling_status'
      ? 'Provisioning subscription...'
      : null;

  return (
    <>
      {toast && <InlineToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex h-full min-h-0 flex-col animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Complete Payment</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">Review the order and continue with wallet-first activation.</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-purple-100 bg-purple-50 px-2.5 py-1 text-purple-600">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-600" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-tight">{plan.name} Plan</span>
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
                      {extraAgents > 0 && <span className="text-xs text-slate-500">({plan.includedAgents} incl + {extraAgents} extra)</span>}
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
                    <span className="text-xs text-emerald-400">{plan.includedMinutes.toLocaleString()} mins included</span>
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
                    <span className="text-[10px] uppercase tracking-widest text-slate-400">Amount Due</span>
                    <span className="text-xl font-black">{formatMoney(amountDue)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900">Wallet Check</h3>
                <p className="mt-1 text-xs font-medium text-slate-500">This flow checks wallet balance first and avoids invoice-based checkout.</p>
              </div>

              <div className={`rounded-2xl border p-4 ${hasEnoughWalletBalance ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${hasEnoughWalletBalance ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'}`}>
                    <Wallet size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">
                      {hasEnoughWalletBalance ? 'Wallet balance is sufficient' : 'Wallet recharge required'}
                    </p>
                    <p className="mt-1 text-xs font-medium leading-5 text-slate-600">
                      {hasEnoughWalletBalance
                        ? 'Subscription activation will continue using the available wallet balance.'
                        : `Your wallet is short by ${formatMoney(amountDue)}. Recharge first, then continue with activation.`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="flex items-start gap-2 text-xs font-medium text-slate-500">
                <ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                <p>Your wallet balance will be used first. If more funds are needed, you can recharge and continue activation.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-white pt-4">
          {stageMessage && (
            <div className="mb-3 flex items-center gap-2 rounded-2xl border border-purple-100 bg-purple-50 px-4 py-3 text-sm font-medium text-purple-700">
              <Loader2 size={16} className="animate-spin" />
              <span>{stageMessage}</span>
            </div>
          )}

          <button
            type="button"
            disabled={isBusy}
            onClick={handleSubscribe}
            className="group relative w-full overflow-hidden rounded-2xl bg-purple-600 py-4 font-bold text-white shadow-xl shadow-purple-200 transition-all hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className={`flex items-center justify-center gap-2 transition-transform duration-300 ${isBusy ? '-translate-y-12' : ''}`}>
              {paymentCtaLabel} for {formatMoney(buttonAmount)}
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </span>

            {isBusy && (
              <div className="absolute inset-0 flex items-center justify-center bg-purple-700 animate-in slide-in-from-bottom-full duration-300">
                <Loader2 size={18} className="animate-spin text-white" />
              </div>
            )}
          </button>
        </div>
      </div>
    </>
  );
};
