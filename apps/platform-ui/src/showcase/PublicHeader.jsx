// @ts-nocheck
import React from "react";
import { isSignedIn } from "./brandApi.js";

/** Header for the public showcase pages, matching the landing page's. */
export default function PublicHeader({ right }) {
  return (
    <header className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
      <a href="/" className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-200 text-2xl">DL</span>
        <span className="text-xl font-bold text-slate-900">Dalai Llama</span>
      </a>
      <nav className="flex items-center gap-3">
        <a href="/creators" className="rounded-lg px-3 py-2 text-sm font-bold text-slate-700 hover:bg-white/70">Creators</a>
        {right}
        <a href={isSignedIn() ? "/brands/home" : "/brands/sign-in"}
           className="rounded-lg bg-indigo-900 px-3 py-2 text-sm font-bold text-white hover:bg-indigo-800">
          {isSignedIn() ? "Your brand" : "Brand sign in"}
        </a>
      </nav>
    </header>
  );
}
