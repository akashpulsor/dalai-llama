// shared/ui/components/FormSelect.jsx
import React from "react";

/**
 * @typedef {{ label: string, value: string }} FormOption
 *
 * @typedef {Object} FormSelectProps
 * @property {string} label
 * @property {string} value
 * @property {(value: string) => void} onChange
 * @property {FormOption[]} options
 */

/**
 * @param {FormSelectProps} props
 */
export default function FormSelect(props) {
  const { label, value, onChange, options } = props;

  return (
    <div className="flex flex-col gap-1 mb-3">
      <label className="text-sm font-medium text-gray-700">{label}</label>

      <select
        className="border p-2 rounded focus:ring focus:border-blue-400"
        value={value}
        /**
         * @param {React.ChangeEvent<HTMLSelectElement>} e
         */
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(
          /**
           * @param {FormOption} opt
           */
          (opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          )
        )}
      </select>
    </div>
  );
}
