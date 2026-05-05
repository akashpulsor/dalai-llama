import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { clearFlash } from "@dalaillama/shared-store";

/**
 * @typedef {"error" | "warning" | "success" | "info"} FlashType
 */

/**
 * @typedef {object} FlashMessage
 * @property {FlashType} type
 * @property {string} text
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
  }, [hasMessage, isError, dispatch]);

  if (!hasMessage) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] pointer-events-none">
      <div
        className={`pointer-events-auto flex items-center gap-3 max-w-sm px-5 py-3.5 rounded-xl shadow-2xl text-white font-semibold text-sm toast-animate ${
          isError
            ? "bg-red-600"
            : "bg-emerald-600"
        }`}
      >
        <span className="flex-1">{flash.message}</span>
        {isError && (
          <button
            type="button"
            onClick={() => dispatch(clearFlash())}
            className="opacity-80 hover:opacity-100 text-white font-bold text-base leading-none ml-2"
            aria-label="Close notification"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};
