// @ts-nocheck
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Check, Crown, Loader2, Pause, Play, X } from "lucide-react";
import {
  selectTenantId,
  showFlash,
  useAddWalletBalanceMutation,
  useGetWalletBalanceQuery,
  useVerifyWalletPaymentMutation,
} from "@dalaillama/shared-store";
import {
  useCancelCreatorVideoSubscriptionMutation,
  useListCreatorVideoPlansQuery,
  usePauseCreatorVideoSubscriptionMutation,
  useResumeCreatorVideoSubscriptionMutation,
  useSubscribeCreatorVideoMutation,
} from "../api/creatorEndpoints.js";
import useCreatorVideoEntitlements from "../hooks/useCreatorVideoEntitlements.js";
import { runWalletRecharge, walletRechargeErrorMessage } from "../utils/walletRecharge.js";

const rupee = (n, code = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: code || "INR", maximumFractionDigits: 0 }).format(Number(n) || 0);

const CYCLE_LABEL = { MONTHLY: "Monthly", QUARTERLY: "Quarterly", YEARLY: "Yearly" };

const FEATURE_ROWS = [
  ["editsEnabled", "AI edits & repairs"],
  ["imageUploadEnabled", "Upload a reference image for a character"],
  ["upscalingEnabled", "Upscaling"],
  ["upscalePreviewEnabled", "Upscale preview"],
  ["characterVoiceUploadEnabled", "Upload a voice sample for a character"],
  ["briefUrlShareEnabled", "Share a brief/review link with clients"],
];

/** Subscribe / cancel / pause / resume for the creator-video product. The plan catalog and the
 * current subscription state both come straight from product-service -- no plan codes or prices
 * are hardcoded here, so a price change or a new cadence needs no frontend deploy. */
export default function SubscriptionPage() {
  const dispatch = useDispatch();
  const tenantId = useSelector(selectTenantId);
  const { data: plans = [], isLoading: plansLoading } = useListCreatorVideoPlansQuery();
  const { subscriptionId, planCode, status, currentPeriodEnd, entitlements, isLoading } = useCreatorVideoEntitlements();

  const [subscribe, { isLoading: subscribing }] = useSubscribeCreatorVideoMutation();
  const [cancel, { isLoading: cancelling }] = useCancelCreatorVideoSubscriptionMutation();
  const [pause, { isLoading: pausing }] = usePauseCreatorVideoSubscriptionMutation();
  const [resume, { isLoading: resuming }] = useResumeCreatorVideoSubscriptionMutation();
  const { data: wallet, refetch: refetchWallet } = useGetWalletBalanceQuery(tenantId, { skip: !tenantId });
  const [createWalletRecharge] = useAddWalletBalanceMutation();
  const [verifyWalletPayment] = useVerifyWalletPaymentMutation();
  const [toppingUp, setToppingUp] = useState(false);

  const proPlans = plans.filter((p) => p.tier !== "FREE");
  const busy = subscribing || cancelling || pausing || resuming || toppingUp;

  /** A 402 from subscribe means "pay for this", and paying is what the button is for -- so every
   * shape of it has to route to checkout.
   *
   * product-service answers in two different ways and only one was being recognised. Its
   * pre-flight check returns the full CreatorVideoSubscriptionResponse
   * (status=INSUFFICIENT_BALANCE, with shortFallAmount); an InsufficientBalanceException thrown
   * later goes through GlobalExceptionHandler instead and returns {error, message} with no
   * shortfall at all. The second shape fell through to "Could not subscribe", which is how a
   * subscribe button ends up showing a balance error instead of opening Razorpay.
   *
   * RTK Query rejects on non-2xx, so either shape is only reachable from the error object. When
   * the body carries no shortfall, it is derived from the plan price against the current wallet
   * balance -- both of which this page already has. */
  const insufficientBalancePayload = (error, plan) => {
    if (error?.status !== 402) return null;
    const payload = error?.data || {};
    const flagged = payload.status === "INSUFFICIENT_BALANCE" || payload.error === "INSUFFICIENT_BALANCE";
    if (!flagged) return null;
    if (payload.shortFallAmount != null) return payload;
    const price = Number(plan?.monthlyPrice ?? plan?.price ?? 0);
    const balance = Number(wallet?.balance ?? 0);
    return {
      ...payload,
      currency: payload.currency || wallet?.currency || "INR",
      currentWalletBalance: balance,
      shortFallAmount: Math.max(0, price - balance),
    };
  };

  /** Razorpay rejects anything under 1 rupee, and a fractional shortfall would still leave the
   * wallet a paisa short on retry -- round the gap up to the next whole rupee. */
  const topUpAmountFor = (shortFall) => Math.max(1, Math.ceil(Number(shortFall) || 0));

  const handleSubscribe = async (plan) => {
    try {
      await subscribe({ tenantId, planCode: plan.planCode }).unwrap();
      dispatch(showFlash({ message: `Subscribed to ${plan.planName}`, type: "success" }));
      return;
    } catch (error) {
      const shortfall = insufficientBalancePayload(error, plan);
      if (!shortfall) {
        dispatch(showFlash({ message: error?.data?.message || "Could not subscribe", type: "error" }));
        return;
      }
      await topUpThenSubscribe(plan, shortfall);
    }
  };

  /** Wallet top-up and subscribe are two separate server calls, so this cannot be atomic: the
   * recharge is verified and credited first, then the subscribe is retried. If that retry fails
   * the money is already in the wallet (not lost) and the user can subscribe again. */
  const topUpThenSubscribe = async (plan, shortfall) => {
    const amount = topUpAmountFor(shortfall.shortFallAmount);
    setToppingUp(true);
    try {
      dispatch(showFlash({
        message: `You're ${rupee(shortfall.shortFallAmount, shortfall.currency)} short — opening payment for ${rupee(amount, shortfall.currency)}.`,
        type: "info",
      }));
      await runWalletRecharge({
        tenantId,
        body: { amount, currency: shortfall.currency || wallet?.currency },
        currencyFallback: wallet?.currency,
        createWalletRecharge,
        verifyWalletPayment,
      });
      await refetchWallet?.();
      await subscribe({ tenantId, planCode: plan.planCode }).unwrap();
      dispatch(showFlash({ message: `Subscribed to ${plan.planName}`, type: "success" }));
    } catch (error) {
      dispatch(showFlash({
        message: error?.data?.message || error?.message || walletRechargeErrorMessage(error),
        type: error?.paymentCancelled ? "warning" : "error",
      }));
    } finally {
      setToppingUp(false);
    }
  };

  const handleCancel = async () => {
    try {
      await cancel(subscriptionId).unwrap();
      dispatch(showFlash({ message: "Subscription cancelled", type: "success" }));
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not cancel", type: "error" }));
    }
  };

  const handlePause = async () => {
    try {
      await pause(subscriptionId).unwrap();
      dispatch(showFlash({ message: "Subscription paused", type: "success" }));
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not pause", type: "error" }));
    }
  };

  const handleResume = async () => {
    try {
      await resume(subscriptionId).unwrap();
      dispatch(showFlash({ message: "Subscription resumed", type: "success" }));
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not resume", type: "error" }));
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center gap-2.5">
        <Crown size={22} className="text-amber-300" />
        <h1 className="text-2xl font-bold text-white">Subscription</h1>
      </div>
      <p className="mt-1 text-sm font-medium text-slate-400">
        Edits, upscaling, character voice/image uploads and client sharing links are Pro features. Creating and downloading videos is always free.
      </p>

      <div className="creator-panel mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-purple-300">Current plan</p>
            <p className="mt-0.5 text-lg font-bold text-white">
              {isLoading ? <Loader2 size={16} className="inline animate-spin" /> : planCode}
            </p>
            {status === "ACTIVE" && currentPeriodEnd && (
              <p className="mt-0.5 text-xs font-medium text-slate-400">
                Renews {new Date(currentPeriodEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            )}
            {status === "PAUSED" && <p className="mt-0.5 text-xs font-medium text-amber-300">Paused — entitlements are on the free tier until you resume</p>}
            {status === "PAST_DUE" && <p className="mt-0.5 text-xs font-medium text-rose-300">Renewal failed — recharge your wallet to restore Pro access</p>}
          </div>
          {status === "ACTIVE" && (
            <div className="flex gap-2">
              <button type="button" disabled={busy} onClick={handlePause} className="creator-control flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-200 disabled:opacity-60">
                {pausing ? <Loader2 size={13} className="animate-spin" /> : <Pause size={13} />} Pause
              </button>
              <button type="button" disabled={busy} onClick={handleCancel} className="creator-control flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-200 disabled:opacity-60">
                {cancelling ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />} Cancel
              </button>
            </div>
          )}
          {status === "PAUSED" && (
            <button type="button" disabled={busy} onClick={handleResume} className="creator-primary flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white disabled:opacity-60">
              {resuming ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />} Resume
            </button>
          )}
        </div>

        <div className="mt-4 grid gap-1.5 sm:grid-cols-2">
          {FEATURE_ROWS.map(([key, label]) => (
            <p key={key} className={`flex items-center gap-1.5 text-[11px] font-semibold ${entitlements[key] ? "text-emerald-300" : "text-slate-500"}`}>
              {entitlements[key] ? <Check size={12} /> : <X size={12} />} {label}
            </p>
          ))}
        </div>
      </div>

      {status !== "ACTIVE" && (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {plansLoading ? (
            <p className="text-xs font-medium text-slate-500">Loading plans…</p>
          ) : (
            proPlans.map((plan) => (
              <div key={plan.planCode} className="creator-panel flex flex-col p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-purple-300">{CYCLE_LABEL[plan.billingCycle] || plan.billingCycle}</p>
                <p className="mt-1 text-2xl font-bold text-white">{rupee(plan.price, plan.currency)}</p>
                <p className="text-[11px] font-medium text-slate-500">per {(CYCLE_LABEL[plan.billingCycle] || "cycle").toLowerCase()}</p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleSubscribe(plan)}
                  className="creator-primary mt-4 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-white disabled:opacity-60"
                >
                  {subscribing ? <Loader2 size={13} className="animate-spin" /> : null}
                  Subscribe
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
