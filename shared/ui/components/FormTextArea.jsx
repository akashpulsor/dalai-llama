// shared/ui/components/FormTextArea.jsx
import React from "react";

/**
 * @typedef {Object} FormTextAreaProps
 * @property {string} label
 * @property {string} value
 * @property {(value: string) => void} onChange
 * @property {string} [placeholder]
 */

/**
 * @param {FormTextAreaProps} props
 */
export default function FormTextArea(props) {
  const { label, value, onChange, placeholder = "" } = props;

  return (
    <div className="flex flex-col gap-1 mb-3">
      <label className="text-sm font-medium text-gray-700">{label}</label>

      <textarea
        className="border p-2 rounded h-24 resize-none focus:ring focus:border-blue-400"
        value={value}
        placeholder={placeholder}
        /**
         * @param {React.ChangeEvent<HTMLTextAreaElement>} e
         */
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
