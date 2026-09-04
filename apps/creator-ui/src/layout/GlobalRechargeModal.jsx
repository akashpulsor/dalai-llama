// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectTenantId,
  showFlash,
  useAddWalletBalanceMutation,
  useGetWalletBalanceQuery,
  useVerifyWalletPaymentMutation,
} from "@dalaillama/shared-store";
import RechargeWalletModal from "../components/billing/RechargeWalletModal.jsx";
import { normalizeCurrencyCode, runWalletRecharge, walletRechargeErrorMessage } from "../utils/walletRecharge.js";

/** Mounted once in CreatorShell (every page renders through it), listening for the same
 * "creator:open-recharge" event the Sidebar's Recharge button and low-balance prompts already
 * dispatch. Previously only PlannerPage listened for that event, so the button silently did
 * nothing anywhere else -- this makes it work everywhere, using the exact same recharge logic
 * PlannerPage's own recharge flow runs (see utils/walletRecharge.js). */
export default function GlobalRechargeModal() {
  const dispatch = useDispatch();
  const tenantId = useSelector(selectTenantId);
  const { data: wallet, refetch: refetchWallet } = useGetWalletBalanceQuery(tenantId, { skip: !tenantId });
  const [createWalletRecharge, rechargeState] = useAddWalletBalanceMutation();
  const [verifyWalletPayment, verifyWalletPaymentState] = useVerifyWalletPaymentMutation();
  const [open, setOpen] = useState(false);

  const flash = (message, type = "success") => dispatch(showFlash({ message, type }));

  useEffect(() => {
    const openRecharge = () => {
      if (!tenantId) {
        flash("Set up your organization before wallet recharge", "error");
        return;
      }
      setOpen(true);
    };
    window.addEventListener("creator:open-recharge", openRecharge);
    return () => window.removeEventListener("creator:open-recharge", openRecharge);
  }, [tenantId]);

  const handleRecharge = async (body) => {
    if (!tenantId) {
      flash("Tenant is required before wallet recharge", "error");
      return;
    }
    try {
      await runWalletRecharge({
        tenantId,
        body,
        currencyFallback: wallet?.currency,
        createWalletRecharge,
        verifyWalletPayment,
      });
      await refetchWallet?.();
      flash("Wallet recharge verified and credited.");
      setOpen(false);
    } catch (error) {
      flash(error?.message || walletRechargeErrorMessage(error), error?.paymentCancelled ? "warning" : "error");
    }
  };

  if (!tenantId) return null;

  return (
    <RechargeWalletModal
      open={open}
      onClose={() => setOpen(false)}
      onRecharge={handleRecharge}
      isLoading={rechargeState.isLoading || verifyWalletPaymentState.isLoading}
      currencyCode={normalizeCurrencyCode(wallet?.currency)}
    />
  );
}
