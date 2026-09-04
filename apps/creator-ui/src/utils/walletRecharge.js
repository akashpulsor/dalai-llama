// @ts-nocheck
// Shared Razorpay wallet-recharge flow -- previously lived only inside PlannerPage, which meant
// the sidebar's "Recharge" button (rendered globally via CreatorShell on every page) only ever
// worked while the user happened to be on /planner: it dispatches a "creator:open-recharge"
// window event, and PlannerPage was the only listener. Extracted here so both PlannerPage and
// GlobalRechargeModal (mounted in CreatorShell, for every other page) run the exact same live
// payment logic instead of two copies that could quietly drift apart.

const RAZORPAY_CHECKOUT_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
let razorpayCheckoutScriptPromise = null;

export function loadRazorpayCheckoutScript() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("Razorpay checkout is only available in the browser."));
  }
  if (window.Razorpay) return Promise.resolve();
  if (razorpayCheckoutScriptPromise) return razorpayCheckoutScriptPromise;

  razorpayCheckoutScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${RAZORPAY_CHECKOUT_SCRIPT_SRC}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Could not load Razorpay checkout.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_SCRIPT_SRC;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Could not load Razorpay checkout."));
    document.body.appendChild(script);
  });

  return razorpayCheckoutScriptPromise;
}

export function firstText(...values) {
  return values.find((value) => typeof value === "string" && value.trim()) || "";
}

export function normalizeCurrencyCode(value = "INR") {
  const currency = String(value || "INR").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(currency) ? currency : "INR";
}

function orderCheckoutDetails(order = {}) {
  return order.checkoutDetails || order.checkout_details || order.checkout || {};
}

function paymentOrderId(order = {}) {
  const checkout = orderCheckoutDetails(order);
  return firstText(
    checkout.order_id, checkout.orderId, checkout.gatewayOrderId, checkout.gateway_order_id,
    order.order_id, order.orderId, order.gatewayOrderId, order.gateway_order_id
  );
}

function paymentKeyId(order = {}) {
  const checkout = orderCheckoutDetails(order);
  const runtimeEnv = typeof window !== "undefined" && window.__ENV__ ? window.__ENV__ : {};
  return firstText(
    checkout.key, checkout.keyId, checkout.key_id,
    order.key, order.keyId, order.key_id,
    runtimeEnv.RAZORPAY_KEY_ID, runtimeEnv.VITE_RAZORPAY_KEY_ID,
    import.meta.env?.VITE_RAZORPAY_KEY_ID
  );
}

function paymentAmountPaise(order = {}, requestedAmount) {
  const checkout = orderCheckoutDetails(order);
  const amountPaise = Number(
    checkout.amount ?? checkout.amountPaise ?? checkout.amount_paise
    ?? order.amountPaise ?? order.amount_paise ?? order.amountInPaise ?? order.amount_in_paise
  );
  if (Number.isFinite(amountPaise) && amountPaise >= 100) return Math.round(amountPaise);
  const amount = Number(order.amount ?? checkout.amountMajor ?? checkout.amount_major ?? requestedAmount);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

export function walletRechargeErrorMessage(error, fallback = "Could not start Razorpay checkout.") {
  const data = error?.data || error?.response?.data || null;
  if (data?.message) return String(data.message);
  if (data?.error) return String(data.error);
  return error?.message || fallback;
}

/** Generic Razorpay checkout for a payment where the ORDER already exists (created server-side).
 * Used by the client pay-to-lock flow: billing-service creates the order, this opens Razorpay's
 * own modal, and `onVerify(response)` runs on a successful payment (the caller then calls its own
 * verify endpoint). `order` = {gatewayOrderId, amount (major units), currency, keyId, name?,
 * description?}. Resolves after onVerify succeeds; rejects (tagged paymentCancelled/paymentFailed)
 * otherwise. */
export async function runRazorpayCheckout(order, onVerify) {
  const checkoutDetails = orderCheckoutDetails(order);
  const keyId = paymentKeyId(order);
  const gatewayOrderId = paymentOrderId(order);
  const amountPaise = paymentAmountPaise(order, order.amount);
  const currency = normalizeCurrencyCode(firstText(checkoutDetails.currency, order.currency));

  if (!gatewayOrderId) throw new Error("Payment order is missing its gateway order id.");
  if (!keyId) throw new Error("Razorpay public key is not configured for checkout.");
  if (amountPaise < 100) throw new Error("Amount is below the Razorpay minimum.");

  await loadRazorpayCheckoutScript();
  await new Promise((resolve, reject) => {
    let settled = false;
    const rejectOnce = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    const checkout = new window.Razorpay({
      key: keyId,
      amount: amountPaise,
      currency,
      name: firstText(order.name, checkoutDetails.name, "Dalai Llama Studio"),
      description: firstText(order.description, checkoutDetails.description, "Approve & lock creative package"),
      order_id: gatewayOrderId,
      handler: async (response) => {
        if (settled) return;
        settled = true;
        try {
          await onVerify(response);
          resolve(response);
        } catch (error) {
          reject(new Error(walletRechargeErrorMessage(error, "Payment verification failed.")));
        }
      },
      modal: {
        ondismiss: () => {
          const error = new Error("Payment cancelled.");
          error.paymentCancelled = true;
          rejectOnce(error);
        },
      },
      theme: { color: "#8b5cf6" },
    });
    checkout.on("payment.failed", (response) => {
      const error = new Error(response?.error?.description || "Payment failed.");
      error.paymentFailed = true;
      rejectOnce(error);
    });
    checkout.open();
  });
}

/** Runs one full recharge round-trip: create the order, open Razorpay's own checkout, verify the
 * payment. Resolves on a verified, credited payment; rejects with an Error otherwise (tagged
 * {@code error.paymentCancelled} / {@code error.paymentFailed} where applicable so a caller can
 * choose a "warning" vs "error" flash). Callers own all UI side effects (flashing, closing the
 * modal, refetching the wallet) -- this only runs the payment itself. */
export async function runWalletRecharge({ tenantId, body, currencyFallback, createWalletRecharge, verifyWalletPayment }) {
  const requestedCurrency = normalizeCurrencyCode(body?.currency || currencyFallback);
  const order = await createWalletRecharge({ tenantId, ...body, currency: requestedCurrency }).unwrap();
  const checkoutDetails = orderCheckoutDetails(order);
  const gatewayOrderId = paymentOrderId(order);
  const paymentId = firstText(order.paymentId, order.payment_id);
  const keyId = paymentKeyId(order);
  const amountPaise = paymentAmountPaise(order, body?.amount);
  const currency = normalizeCurrencyCode(firstText(checkoutDetails.currency, order.currency, body?.currency, requestedCurrency));

  if (!gatewayOrderId) throw new Error("Razorpay order response is missing checkout details.");
  if (!paymentId) throw new Error("Billing did not return a payment tracking id for this recharge.");
  if (!keyId) throw new Error("Razorpay public key is not configured for checkout.");
  if (amountPaise < 100) throw new Error("Recharge amount is below Razorpay minimum amount.");

  await loadRazorpayCheckoutScript();
  await new Promise((resolve, reject) => {
    let settled = false;
    const rejectOnce = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    const checkout = new window.Razorpay({
      key: keyId,
      amount: amountPaise,
      currency,
      name: firstText(checkoutDetails.name, "Dalai Llama Platform"),
      description: firstText(checkoutDetails.description, "Wallet recharge"),
      order_id: gatewayOrderId,
      handler: async (response) => {
        if (settled) return;
        settled = true;
        try {
          await verifyWalletPayment({
            tenantId,
            paymentId,
            gatewayOrderId: response.razorpay_order_id,
            gatewayPaymentId: response.razorpay_payment_id,
            gatewaySignature: response.razorpay_signature,
          }).unwrap();
          resolve(response);
        } catch (error) {
          reject(new Error(walletRechargeErrorMessage(error, "Payment verification failed. Wallet was not credited.")));
        }
      },
      modal: {
        ondismiss: () => {
          const error = new Error("Payment cancelled. Wallet was not recharged.");
          error.paymentCancelled = true;
          rejectOnce(error);
        },
      },
      theme: { color: "#8b5cf6" },
    });

    checkout.on("payment.failed", (response) => {
      const error = new Error(response?.error?.description || "Payment failed. Wallet was not recharged.");
      error.paymentFailed = true;
      rejectOnce(error);
    });

    checkout.open();
  });
}
