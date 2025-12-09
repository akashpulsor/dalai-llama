// shared/ui/components/WaveformBar.jsx
import React from "react";

/**
 * @typedef {Object} WaveformBarProps
 * @property {number[]} samples
 */

/**
 * @param {WaveformBarProps} props
 */
export default function WaveformBar(props) {
  const { samples } = props;

  return (
    <div className="flex items-end gap-1 h-20 bg-gray-50 p-2 rounded-xl overflow-hidden border">
      {samples.map(
        /**
         * @param {number} v
         * @param {number} idx
         */
        (v, idx) => (
          <div
            key={idx}
            className="bg-purple-500 rounded-full transition-all duration-150"
            style={{
              width: "3px",
              height: `${Math.max(4, Math.min(80, v * 80))}px`,
            }}
          />
        )
      )}
    </div>
  );
}
