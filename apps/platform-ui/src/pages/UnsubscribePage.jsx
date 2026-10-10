// @ts-nocheck
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { appConfig } from "@dalaillama/shared-config";
import PublicHeader from "../showcase/PublicHeader.jsx";

/** /unsubscribe/:token, from the footer of any outreach email. A button, not an automatic
 * unsubscribe on load, so mail scanners that open links can't unsubscribe anyone. */
export default function UnsubscribePage() {
  const { token } = useParams();
  const [state, setState] = useState("idle");

  const confirm = async () => {
    setState("sending");
    try {
      const response = await fetch(`${appConfig.API_BASE_URL}/public/outreach/unsubscribe/${encodeURIComponent(token)}`, { method: "POST" });
      setState(response.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef4ff_0%,#f6f8fc_100%)]">
      <PublicHeader />
      <main className="mx-auto max-w-md px-4 pb-24">
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          {state === "done" ? (
            <>
              <h1 className="text-xl font-bold text-slate-900">You're unsubscribed</h1>
              <p className="mt-2 text-sm text-slate-600">We won't email this address again, from any creator.</p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-slate-900">Stop emails from Dalai Llama creators?</h1>
              <p className="mt-2 text-sm text-slate-600">This stops every email sent through Dalai Llama to this address.</p>
              <button type="button" onClick={confirm} disabled={state === "sending"}
                      className="mt-5 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                {state === "sending" ? "Unsubscribing…" : "Unsubscribe"}
              </button>
              {state === "error" && <p className="mt-3 text-sm text-rose-600">That didn't work. Please try again.</p>}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
