// shared/ui/components/FormTextArea.jsx
import React from "react";

/**
 * @typedef {Object} FormTextAreaProps
 * @property {string} label
 * @property {string} value
 * @property {(value: string) => void} onChange
 * @property {string} [placeholder]
 * @property {string} [wrapperClassName]
 * @property {string} [labelClassName]
 * @property {string} [textAreaClassName]
 */

/**
 * @param {FormTextAreaProps} props
 */
export default function FormTextArea(props) {
  const {
    label,
    value,
    onChange,
    placeholder = "",
    wrapperClassName = "",
    labelClassName = "",
    textAreaClassName = "",
  } = props;

  return (
    <div className={`mb-3 flex flex-col gap-1 ${wrapperClassName}`.trim()}>
      <label className={`text-sm font-medium text-gray-700 ${labelClassName}`.trim()}>{label}</label>

      <textarea
        className={`h-24 resize-none rounded border p-2 focus:border-blue-400 focus:ring ${textAreaClassName}`.trim()}
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
