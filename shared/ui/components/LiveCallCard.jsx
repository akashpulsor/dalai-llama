// shared/ui/components/LiveCallCard.jsx
import React from "react";
import StatusTag from "./StatusTag.jsx";
import SentimentBadge from "./SentimentBadge.jsx";

/**
 * @typedef {"ringing"|"connected"|"hold"|"ended"} LiveCallStatus
 * @typedef {"positive"|"neutral"|"negative"} SentimentType
 */

/**
 * @typedef {Object} LiveCallCardProps
 * @property {string} id
 * @property {string} from
 * @property {string} to
 * @property {LiveCallStatus} status
 * @property {SentimentType} sentiment
 */

/**
 * @param {LiveCallCardProps} props
 */
export default function LiveCallCard(props) {
  const { id, from, to, status, sentiment } = props;

  return (
    <div className="p-4 border rounded-2xl bg-white shadow-md hover:shadow-lg transition-all duration-150">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-gray-800">Call #{id}</div>
        <StatusTag status={status} />
      </div>

      <div className="text-sm text-gray-700 mb-1">
        <strong>From:</strong> {from}
      </div>

      <div className="text-sm text-gray-700 mb-3">
        <strong>To:</strong> {to}
      </div>

      <div className="flex justify-end">
        <SentimentBadge sentiment={sentiment} />
      </div>
    </div>
  );
}
