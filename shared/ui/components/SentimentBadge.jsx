// shared/ui/components/SentimentBadge.jsx
import React from "react";

/**
 * @typedef {"positive"|"neutral"|"negative"} SentimentType
 */

/**
 * @typedef {Object} SentimentBadgeProps
 * @property {SentimentType} sentiment
 */

/**
 * @param {SentimentBadgeProps} props
 */
export default function SentimentBadge(props) {
  const { sentiment } = props;

  /** @type {Record<SentimentType, string>} */
  const colors = {
    positive: "bg-green-500",
    neutral: "bg-gray-400",
    negative: "bg-red-500",
  };

  const color = colors[sentiment] || "bg-gray-400";

  return (
    <span
      className={`px-3 py-1 rounded-full text-white text-xs font-semibold shadow ${color}`}
    >
      {sentiment.toUpperCase()}
    </span>
  );
}
