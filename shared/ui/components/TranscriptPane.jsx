// shared/ui/components/TranscriptPane.jsx
import React from "react";

/**
 * @typedef {Object} TranscriptPaneProps
 * @property {string[]} lines
 */

/**
 * @param {TranscriptPaneProps} props
 */
export default function TranscriptPane({ lines }) {
  return (
    <div className="p-3 bg-white border rounded h-48 overflow-y-auto text-sm leading-relaxed">
      {lines.map(
        /**
         * @param {string} line
         * @param {number} idx
         */
        (line, idx) => (
          <div key={idx} className="mb-1 text-gray-700">
            {line}
          </div>
        )
      )}
    </div>
  );
}
