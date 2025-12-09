// shared/ui/components/FormInput.jsx
import React from "react";

/**
 * @typedef {Object} FormInputProps
 * @property {string} label
 * @property {string} value
 * @property {(value: string) => void} onChange
 * @property {string} [placeholder]
 */

/**
 * @param {FormInputProps} props
 */
export default function FormInput(props) {
  const { label, value, onChange, placeholder = "" } = props;

  return (
    <div className="flex flex-col gap-1 mb-3">
      <label className="text-sm font-medium text-gray-700">{label}</label>

      <input
        className="border p-2 rounded focus:ring focus:border-blue-400"
        value={value}
        placeholder={placeholder}
        /**
         * @param {React.ChangeEvent<HTMLInputElement>} e
         */
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
