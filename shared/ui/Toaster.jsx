import React from "react";
import { useSelector } from "react-redux";

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
 * @returns {React.ReactElement | null}
 */
export const Toaster = () => {
  const flash = useSelector(
    /**
     * @param {{ flash?: { message?: string | null, type?: FlashType | "info" } }} state
     */
    (state) => state.flash || { message: null, type: "info" }
  );
  const messages = flash?.message
    ? [{ text: flash.message, type: flash.type || "info" }]
    : [];

  if (!messages.length) return null;

  return (
    <div className="fixed top-6 right-6 z-50 space-y-3">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`px-5 py-3 rounded-xl shadow-lg text-white font-semibold text-sm animate-fadeIn ${
            msg.type === "error"
              ? "bg-red-600"
              : msg.type === "warning"
              ? "bg-yellow-500"
              : msg.type === "info"
              ? "bg-sky-600"
              : "bg-green-600"
          }`}
        >
          {msg.text}
        </div>
      ))}
    </div>
  );
};
