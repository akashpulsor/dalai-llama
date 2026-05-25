// @ts-nocheck
import React from "react";
import { Link } from "react-router-dom";

export default function StoryboardsListPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-3xl font-black">Storyboards</h1>
      <Link to="/#storyboard" className="mt-6 block rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-purple-300/40">
        <p className="text-xl font-black">She Almost Didn't Go</p>
        <p className="mt-2 text-sm font-semibold text-slate-400">30 Second Short · 14 Shots · Fitness</p>
      </Link>
    </div>
  );
}
