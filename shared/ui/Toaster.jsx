import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { clearFlash } from "@dalaillama/shared-store";

/**
 * @typedef {"error" | "warning" | "success" | "info"} FlashType
 */

/**
 * @typedef {object} FlashMessage
 * @property {FlashType} type
 * @property {string} message
 */

/**
 * Toast notification component that listens to flash messages from Redux.
 * Auto-dismisses after a short delay.
 * @returns {React.ReactElement | null}
 */
export const Toaster = () => {
  const dispatch = useDispatch();
  const flash = useSelector(
    /**
     * @param {{ flash?: { message?: string | null, type?: FlashType | "info" } }} state
     */
    (state) => state.flash || { message: null, type: "info" }
  );

  const hasMessage = !!flash?.message;
  const flashType = flash?.type || "info";

  const isError = flashType === "error" || flashType === "warning";

  useEffect(() => {
    if (!hasMessage || isError) return;
    const timer = setTimeout(() => dispatch(clearFlash()), 3000);
    return () => clearTimeout(timer);
  }, [flash?.message, flashType, hasMessage, isError, dispatch]);

  if (!hasMessage) return null;

  return (
    <div className="fixed inset-x-3 top-6 z-[9999] pointer-events-none flex justify-end sm:inset-x-auto sm:right-6">
      <div
        className={`pointer-events-auto flex max-h-[45vh] w-full max-w-[min(92vw,34rem)] items-start gap-3 overflow-hidden px-5 py-3.5 rounded-xl shadow-2xl text-white font-semibold text-sm toast-animate ${
          isError
            ? "bg-red-600"
            : "bg-emerald-600"
        }`}
      >
        <span className="custom-scrollbar min-w-0 flex-1 overflow-y-auto whitespace-pre-wrap break-words leading-5">{flash.message}</span>
        {isError && (
          <button
            type="button"
            onClick={() => dispatch(clearFlash())}
            className="ml-2 shrink-0 opacity-80 hover:opacity-100 text-white font-bold text-base leading-none"
            aria-label="Close notification"
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
};
