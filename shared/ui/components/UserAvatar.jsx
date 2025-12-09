// shared/ui/components/UserAvatar.jsx
import React from "react";

/**
 * @typedef {Object} UserAvatarProps
 * @property {string} name
 * @property {number} [size]
 */

/**
 * @param {UserAvatarProps} props
 */
export default function UserAvatar(props) {
  const { name, size = 36 } = props;

  /** @type {string} */
  const initials = name
    .split(" ")
    .map(
      /**
       * @param {string} n
       * @returns {string}
       */
      (n) => n[0]?.toUpperCase() || ""
    )
    .join("");

  return (
    <div
      className="rounded-full bg-blue-600 text-white flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <span className="font-medium">{initials}</span>
    </div>
  );
}
