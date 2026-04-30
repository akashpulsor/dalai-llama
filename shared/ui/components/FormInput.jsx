// shared/ui/components/FormInput.jsx
import React from "react";

/**
 * @typedef {Object} FormInputProps
 * @property {string} label
 * @property {string} value
 * @property {(value: string) => void} onChange
 * @property {string} [placeholder]
 * @property {string} [type]
 * @property {string} [wrapperClassName]
 * @property {string} [labelClassName]
 * @property {string} [inputClassName]
 */

/**
 * @param {FormInputProps} props
 */
export default function FormInput(props) {
  const {
    label,
    value,
    onChange,
    placeholder = "",
    type = "text",
    wrapperClassName = "",
    labelClassName = "",
    inputClassName = "",
  } = props;

  return (
    <div className={`mb-3 flex flex-col gap-1 ${wrapperClassName}`.trim()}>
      <label className={`text-sm font-medium text-gray-700 ${labelClassName}`.trim()}>{label}</label>

      <input
        type={type}
        className={`rounded border p-2 focus:border-blue-400 focus:ring ${inputClassName}`.trim()}
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
