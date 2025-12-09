// shared/store/slices/billingSlice.js
// --------------------------------------------------------------
// Billing State (Wallet + Invoices + Usage)
// --------------------------------------------------------------

import { createSlice } from "@reduxjs/toolkit";

/**
 * @typedef {object} Invoice
 * @property {string} id
 * @property {string} period
 * @property {number} amount
 * @property {boolean} paid
 */

/**
 * @typedef {object} WalletInfo
 * @property {number} balance
 * @property {string} currency
 */

/**
 * @typedef {object} BillingState
 * @property {WalletInfo|null} wallet
 * @property {Invoice[]} invoices
 */

/** @type {BillingState} */
const initialState = {
  wallet: null,
  invoices: [],
};

const billingSlice = createSlice({
  name: "billing",
  initialState,
  reducers: {
    /**
     * @param {BillingState} state
     * @param {{payload: WalletInfo}} action
     */
    setWallet(state, action) {
      state.wallet = action.payload;
    },

    /**
     * @param {BillingState} state
     * @param {{payload: Invoice[]}} action
     */
    setInvoices(state, action) {
      state.invoices = action.payload;
    },

    resetBilling() {
      return initialState;
    },
  },
});

export const { setWallet, setInvoices, resetBilling } = billingSlice.actions;

export default billingSlice.reducer;
