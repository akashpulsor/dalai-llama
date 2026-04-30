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
 * @property {string} [wrapperClassName]
 * @property {string} [labelClassName]
 * @property {string} [selectClassName]
 */

/**
 * @param {FormSelectProps} props
 */
export default function FormSelect(props) {
  const {
    label,
    value,
    onChange,
    options,
    wrapperClassName = "",
    labelClassName = "",
    selectClassName = "",
  } = props;

  return (
    <div className={`mb-3 flex flex-col gap-1 ${wrapperClassName}`.trim()}>
      <label className={`text-sm font-medium text-gray-700 ${labelClassName}`.trim()}>{label}</label>

      <select
        className={`rounded border p-2 focus:border-blue-400 focus:ring ${selectClassName}`.trim()}
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
