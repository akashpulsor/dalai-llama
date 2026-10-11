// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import PublicHeader, { PublicFooter } from "../showcase/PublicHeader.jsx";
import { finishBrandLogin, startBrandLogin } from "../showcase/brandAuth.js";

/** Where a pending action ("follow:<handle>", "request:<handle>") goes once signed in. */
function afterSignIn(pendingAction) {
  const [action, handle] = (pendingAction || "").split(":");
  if (handle && (action === "follow" || action === "request")) return `/c/${handle}?then=${action}`;
  return "/brands/home";
}

function Shell({ children }) {
  return (
    <div className="min-h-screen creator-app text-slate-100">
      <PublicHeader />
      <main className="mx-auto w-full max-w-md px-4 pb-24">{children}</main>
      <PublicFooter />
    </div>
  );
}

/** /brands/sign-in: brands sign in or create their account with Keycloak (email and password, or
 * whatever the realm offers). Watching films never needs this. */
export default function BrandSignInPage() {
  const returnTo = afterSignIn(new URLSearchParams(window.location.search).get("next"));
  const [busy, setBusy] = useState(false);
  const go = (register) => { setBusy(true); startBrandLogin({ register, returnTo }); };
  return (
    <Shell>
      <div className="space-y-5 rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white">For brands</h1>
          <p className="mt-1 text-sm text-slate-400">
            Follow creators, request videos and keep track of your requests. Browsing and watching films needs no account.
          </p>
        </div>
        <button type="button" onClick={() => go(false)} disabled={busy}
                className="w-full rounded-lg bg-purple-600 py-2.5 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-50">
          Sign in
        </button>
        <button type="button" onClick={() => go(true)} disabled={busy}
                className="w-full rounded-lg py-2.5 text-sm font-bold text-purple-200 ring-1 ring-white/15 hover:bg-white/5 disabled:opacity-50">
          Create a brand account
        </button>
        <p className="text-xs text-slate-500">Use your work email. You'll be asked to confirm it before you can contact creators.</p>
      </div>
    </Shell>
  );
}

/** /brands/callback: Keycloak sends the brand back here with a code. */
export function BrandCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  useEffect(() => {
    finishBrandLogin(window.location.search)
      .then((next) => navigate(next, { replace: true }))
      .catch((e) => setError(e.message));
  }, [navigate]);
  return (
    <Shell>
      <div className="rounded-2xl bg-white/[0.04] p-6 text-center ring-1 ring-white/10">
        {error ? (
          <>
            <h1 className="text-xl font-bold text-white">Sign-in didn't finish</h1>
            <p className="mt-2 text-sm text-rose-300">{error}</p>
            <a href="/brands/sign-in" className="mt-4 inline-block text-sm font-bold text-purple-300">Try again</a>
          </>
        ) : (
          <p className="flex items-center justify-center gap-2 text-sm text-slate-300"><Loader2 size={16} className="animate-spin" /> Signing you in…</p>
        )}
      </div>
    </Shell>
  );
}
