// shared/hooks/useDispositionForm.js
// --------------------------------------------------------------
//  useDispositionForm Hook (ACW Form Handling)
// --------------------------------------------------------------

import { useCallback, useState } from "react";
import store from "@dalaillama/shared-store";

import {
  updateACW,
  completeACW,
} from "@dalaillama/shared-store/slices/callSlice.js";

import { appConfig } from "@dalaillama/shared-config";
import { api } from "@dalaillama/shared-store/slices/apiSlice.js";

/** @type {any} */
const dispatchAny = store.dispatch;

/**
 * @typedef {object} ACWForm
 * @property {string} [disposition]
 * @property {string} [notes]
 */

/**
 * @typedef {object} UseDispositionFormResult
 * @property {ACWForm} form
 * @property {(name: string, value: string) => void} updateField
 * @property {() => Promise<void>} saveAndComplete
 * @property {boolean} isSaving
 */

/**
 * useDispositionForm:
 * Handles ACW form field updates + backend save (RTK Query)
 *
 * @returns {UseDispositionFormResult}
 */
export function useDispositionForm() {
  const state = store.getState();
  /** @type {ACWForm} */
  const form = state.call.acwForm ?? {};

  const [isSaving, setSaving] = useState(false);

  /**
   * Update a single ACW form field.
   *
   * @param {string} name
   * @param {string} value
   */
  const updateField = useCallback(
    /**
     * @param {string} name
     * @param {string} value
     */
    (name, value) => {
      store.dispatch(updateACW({ [name]: value }));
    },
    []
  );

  /**
   * Persist ACW form → backend (real) or console (mock)
   *
   * @returns {Promise<void>}
   */
  const saveAndComplete = useCallback(async () => {
    setSaving(true);

    try {
      if (appConfig.MOCK_MODE) {
        console.log("📝 MOCK ACW SAVE:", form);
      } else {
        // RTK Query mutation (typed via apiSlice)
        await dispatchAny(
          api.endpoints.saveDisposition.initiate({
            ...form,
            ts: Date.now(),
          })
        ).unwrap();
      }

      // Finalize ACW
      store.dispatch(completeACW());
    } catch (err) {
      console.error("ACW save failed:", err);
    } finally {
      setSaving(false);
    }
  }, [form]);

  return {
    form,
    updateField,
    saveAndComplete,
    isSaving,
  };
}

export default useDispositionForm;
