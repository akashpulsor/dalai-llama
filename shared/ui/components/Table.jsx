// shared/ui/components/Table.jsx
import React from "react";

/**
 * @typedef {Object} TableProps
 * @property {React.ReactNode} children
 */

/**
 * @param {TableProps} props
 */
export default function Table(props) {
  const { children } = props;

  return (
    <table className="min-w-full border bg-white">
      {children}
    </table>
  );
}
