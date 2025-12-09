// shared/ui/components/DialPad.jsx
import React from "react";
import { Delete } from "lucide-react";

/**
 * @typedef {Object} DialPadProps
 * @property {(digit: string) => void} onPress
 * @property {() => void} [onDelete]
 */

/**
 * @param {DialPadProps} props
 */
export default function DialPad({ onPress, onDelete }) {
  const digits = ["1","2","3","4","5","6","7","8","9","*","0","#"];

  return (
    <div className="grid grid-cols-3 gap-4 p-5 bg-white rounded-3xl shadow-md">
      {digits.map((d) => (
        <button
          key={d}
          onClick={() => onPress(d)}
          className="flex items-center justify-center bg-gray-50 border border-gray-300 rounded-2xl py-4 text-2xl font-bold 
                     text-gray-800 shadow-sm hover:shadow transition-all hover:bg-gray-100 hover:scale-105"
        >
          {d}
        </button>
      ))}

      {/* Delete key */}
      <button
        onClick={onDelete}
        className="col-span-3 flex items-center justify-center bg-red-50 border border-red-200 rounded-2xl py-3 shadow hover:bg-red-100 hover:scale-105 transition-all"
      >
        <Delete size={22} className="text-red-600" />
      </button>
    </div>
  );
}
