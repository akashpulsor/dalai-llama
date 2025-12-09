// shared/hooks/useWallet.js
// --------------------------------------------------------------
// Wallet + Billing Hook
// --------------------------------------------------------------

import { useEffect } from "react";
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

export function useWallet() {
  useEffect(() => {
    const load = async () => {
      try {
        const wallet = await dispatchAny(api.endpoints.getWalletBalance.initiate()).unwrap();
        store.dispatch(setWallet(wallet));
      } catch {}

      try {
        const invoices = await dispatchAny(api.endpoints.getInvoices?.initiate()).unwrap();
        if (Array.isArray(invoices)) {
          store.dispatch(setInvoices(invoices));
        }
      } catch {}
    };

    load();
  }, []);

  return {
    get wallet() {
      return store.getState().billing.wallet;
    },
    get invoices() {
      return store.getState().billing.invoices;
    },
  };
}

export default useWallet;
