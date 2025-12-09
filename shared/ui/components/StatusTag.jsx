// shared/ui/components/StatusTag.jsx
import React from "react";

/**
 * @typedef {"online"|"offline"|"busy"|"away"|"connected"|"ringing"|"hold"|"ended"} StatusType
 */

/**
 * @typedef {Object} StatusTagProps
 * @property {StatusType} status
 */

/**
 * @param {StatusTagProps} props
 */
export default function StatusTag(props) {
  const { status } = props;

  /** @type {Record<StatusType, string>} */
  const map = {
    online: "bg-green-500",
    offline: "bg-gray-500",
    busy: "bg-red-500",
    away: "bg-yellow-500",
    connected: "bg-green-600",
    ringing: "bg-blue-500",
    hold: "bg-yellow-600",
    ended: "bg-gray-400",
  };

  return (
    <span
      className={`px-2 py-1 rounded text-white text-xs ${map[status]}`}
    >
      {status.toUpperCase()}
    </span>
  );
}
