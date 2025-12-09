// shared/ui/components/TableRow.jsx
import React from "react";

/**
 * @typedef {Object} TableRowProps
 * @property {React.ReactNode[]} cells
 */

/**
 * @param {TableRowProps} props
 */
export default function TableRow(props) {
  const { cells } = props;

  return (
    <tr className="border-b">
      {cells.map(
        /**
         * @param {React.ReactNode} cell
         * @param {number} idx
         */
        (cell, idx) => (
          <td key={idx} className="p-3 text-sm text-gray-700">
            {cell}
          </td>
        )
      )}
    </tr>
  );
}
