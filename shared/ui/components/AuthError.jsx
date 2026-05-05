import React from "react";

/**
 * Consistent full-screen auth/config error used across all UIs.
 *
 * @param {{ title?: string, message?: string }} props
 */
export default function AuthError({
  title = "Configuration Error",
  message = "Something went wrong during authentication.",
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB] px-4">
      <div className="w-full max-w-sm rounded-[2rem] border border-red-100 bg-white p-8 text-center shadow-[0_24px_80px_rgba(220,38,38,0.06)]">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
          <svg
            className="h-7 w-7 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h1 className="mb-2 text-lg font-bold text-slate-900">{title}</h1>
        <p className="text-sm leading-6 text-slate-500">{message}</p>
      </div>
    </div>
  );
}
