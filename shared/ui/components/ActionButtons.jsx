// shared/ui/components/ActionButtons.jsx
import React from "react";

/**
 * @typedef {Object} ActionButtonsProps
 * @property {() => void} onMute
 * @property {() => void} onHold
 * @property {() => void} onHangup
 * @property {boolean} muted
 * @property {boolean} holdState
 */

/**
 * @param {ActionButtonsProps} props
 */
export default function ActionButtons({
  onMute,
  onHold,
  onHangup,
  muted,
  holdState,
}) {
  return (
    <div className="flex justify-around p-3 bg-gray-100 border-t">
      <button
        onClick={onMute}
        className={`px-4 py-2 rounded ${
          muted ? "bg-yellow-200" : "bg-white"
        } border`}
      >
        {muted ? "Unmute" : "Mute"}
      </button>

      <button
        onClick={onHold}
        className={`px-4 py-2 rounded ${
          holdState ? "bg-yellow-200" : "bg-white"
        } border`}
      >
        {holdState ? "Resume" : "Hold"}
      </button>

      <button
        onClick={onHangup}
        className="px-4 py-2 rounded bg-red-600 text-white"
      >
        Hangup
      </button>
    </div>
  );
}
