import React from "react";

/**
 * Consistent full-screen auth loader used across all UIs.
 *
 * @param {{ message?: string }} props
 */
export default function AuthLoader({ message = "Preparing your workspace" }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB] px-4">
      <div className="w-full max-w-sm rounded-[2rem] border border-purple-100 bg-white p-8 text-center shadow-[0_24px_80px_rgba(88,28,135,0.08)]">
        <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-[3px] border-purple-600/20 border-t-purple-600 shadow-[0_0_0_6px_rgba(168,85,247,0.08)]" />
        <h1 className="mb-2 text-lg font-bold text-slate-900">{message}</h1>
        <p className="text-sm leading-6 text-slate-500">
          Loading your workspace and securing the session.
        </p>
      </div>
    </div>
  );
}
