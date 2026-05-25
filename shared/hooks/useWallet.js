// shared/hooks/useWallet.js
// --------------------------------------------------------------
// Wallet + Billing Hook
// --------------------------------------------------------------

import { useEffect, useCallback } from "react";
import store from "@dalaillama/shared-store";
import { setWallet, setInvoices } from "@dalaillama/shared-store/slices/billingSlice.js";
import { api } from "@dalaillama/shared-store/slices/apiSlice.js";

const dispatchAny = /** @type {any} */ (store.dispatch);

/**
 * @typedef {object} WalletInfo
 * @property {number} balance
 * @property {string} currency
 */

/**
 * @typedef {object} Invoice
 * @property {string} id
 * @property {string} period
 * @property {number} amount
 * @property {boolean} paid
 */

/**
 * Fetches wallet balance from the API and updates the store.
 * @returns {Promise<WalletInfo|null>}
 */
async function fetchWalletBalance() {
  try {
    const wallet = await dispatchAny(api.endpoints.getWalletBalance.initiate()).unwrap();
    store.dispatch(setWallet(wallet));
    return wallet;
  } catch {
    return null;
  }
}

export function useWallet() {
  useEffect(() => {
    const load = async () => {
      await fetchWalletBalance();

      try {
        const invoices = await dispatchAny(api.endpoints.getInvoices?.initiate()).unwrap();
        if (Array.isArray(invoices)) {
          store.dispatch(setInvoices(invoices));
        }
      } catch {}
    };

    load();
  }, []);

  /**
   * Adds balance to the wallet and refreshes the wallet state.
   * @param {number} amount
   * @param {string} [currency]
   * @returns {Promise<{success: boolean, balance?: number, error?: string}>}
   */
  const addBalance = useCallback(async (
    /** @type {number} */ amount,
    /** @type {string} */ currency = "INR"
  ) => {
    try {
      const result = await dispatchAny(
        api.endpoints.addWalletBalance.initiate({ amount, currency })
      ).unwrap();
      await fetchWalletBalance();
      return { success: true, balance: result.balance };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }, []);

  /**
   * Re-fetches wallet balance from the API.
   * @returns {Promise<void>}
   */
  const refreshWallet = useCallback(async () => {
    await fetchWalletBalance();
  }, []);

  return {
    get wallet() {
      return store.getState().billing.wallet;
    },
    get invoices() {
      return store.getState().billing.invoices;
    },
    addBalance,
    refreshWallet,
  };
}

export default useWallet;
