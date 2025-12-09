// shared/ui/components/CallHeader.jsx
import React from "react";
import UserAvatar from "./UserAvatar.jsx";
import SentimentBadge from "./SentimentBadge.jsx";

/**
 * @typedef {"positive"|"neutral"|"negative"} SentimentType
 */

/**
 * @typedef {Object} CallHeaderProps
 * @property {string} caller
 * @property {string} callee
 * @property {SentimentType} [sentiment]
 * @property {React.ReactNode} [timer]
 */

/**
 * @param {CallHeaderProps} props
 */
export default function CallHeader(props) {
  const { caller, callee, sentiment = "neutral", timer } = props;

  return (
    <div className="flex items-center justify-between p-4 bg-white border-b rounded-t-2xl shadow-sm">

      <div className="flex items-center gap-3">
        <UserAvatar name={caller} size={42} />
        <div>
          <div className="font-semibold text-gray-800 text-base">{caller}</div>
          <div className="text-sm text-gray-500">Talking with {callee}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {timer}
        <SentimentBadge sentiment={sentiment} />
      </div>
    </div>
  );
}
