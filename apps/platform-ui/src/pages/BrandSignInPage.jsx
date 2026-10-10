// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, MailCheck } from "lucide-react";
import PublicHeader from "../showcase/PublicHeader.jsx";
import { completeSignIn, requestSignIn } from "../showcase/brandApi.js";
import { INDUSTRIES } from "../showcase/labels.js";

/** Where a pending action ("follow:<handle>", "request:<handle>") goes once signed in. */
function afterSignIn(pendingAction) {
  const [action, handle] = (pendingAction || "").split(":");
  if (handle && (action === "follow" || action === "request")) return `/c/${handle}?then=${action}`;
  return "/brands/home";
}

/** /brands/sign-in: one form for sign-up and sign-in; we email a link. /brands/sign-in/:token is
 * where that link lands. No password anywhere. */
export default function BrandSignInPage() {
  const { token } = useParams();
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef4ff_0%,#f6f8fc_100%)]">
      <PublicHeader />
      <main className="mx-auto w-full max-w-md px-4 pb-24">
        {token ? <CompleteSignIn token={token} /> : <SignInForm />}
      </main>
    </div>
  );
}

function SignInForm() {
  const next = new URLSearchParams(window.location.search).get("next") || "";
  const [form, setForm] = useState({ email: "", contactName: "", companyName: "", websiteUrl: "", industry: "", autoPicksOptIn: false });
  const [state, setState] = useState("idle");
  const [error, setError] = useState("");
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setState("sending");
    setError("");
    try {
      await requestSignIn({ ...form, industry: form.industry || null, pendingAction: next || null });
      setState("sent");
    } catch (e) {
      setError(e.message);
      setState("idle");
    }
  };

  if (state === "sent") {
    return (
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
        <MailCheck className="mx-auto text-indigo-700" size={32} />
        <h1 className="mt-3 text-xl font-bold text-slate-900">Check your inbox</h1>
        <p className="mt-2 text-sm text-slate-600">We sent a sign-in link to <strong>{form.email}</strong>. It works once, for 30 minutes.</p>
      </div>
    );
  }

  const input = "mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm font-normal";
  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <div>
        <h1 className="text-2xl font-bold text-indigo-900">Sign in as a brand</h1>
        <p className="mt-1 text-sm text-slate-600">Follow creators and request videos. No password: we email you a link.</p>
      </div>
      <label className="block text-sm font-semibold text-slate-700">Work email
        <input type="email" required maxLength={254} value={form.email} onChange={set("email")} className={input} autoComplete="email" />
      </label>
      <label className="block text-sm font-semibold text-slate-700">Your name
        <input maxLength={80} value={form.contactName} onChange={set("contactName")} className={input} autoComplete="name" />
      </label>
      <label className="block text-sm font-semibold text-slate-700">Company
        <input maxLength={120} value={form.companyName} onChange={set("companyName")} className={input} autoComplete="organization" />
      </label>
      <label className="block text-sm font-semibold text-slate-700">Website
        <input type="url" maxLength={255} value={form.websiteUrl} onChange={set("websiteUrl")} placeholder="https://" className={input} />
      </label>
      <label className="block text-sm font-semibold text-slate-700">Industry
        <select value={form.industry} onChange={set("industry")} className={input}>
          <option value="">Choose…</option>
          {INDUSTRIES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
        </select>
      </label>
      <label className="flex items-start gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={form.autoPicksOptIn} onChange={set("autoPicksOptIn")} className="mt-1" />
        Email me new films from creators in my industry (at most once a week; unsubscribe any time)
      </label>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button type="submit" disabled={state === "sending"} className="w-full rounded-lg bg-indigo-700 py-2.5 text-sm font-bold text-white disabled:opacity-50">
        {state === "sending" ? "Sending…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}

function CompleteSignIn({ token }) {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  useEffect(() => {
    completeSignIn(token)
      .then((signedIn) => navigate(afterSignIn(signedIn.pendingAction), { replace: true }))
      .catch((e) => setError(e.message));
  }, [token, navigate]);

  if (error) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
        <p className="text-slate-700">{error}</p>
        <a href="/brands/sign-in" className="mt-3 inline-block font-bold text-indigo-700">Get a new link</a>
      </div>
    );
  }
  return <p className="flex items-center justify-center gap-2 text-slate-500"><Loader2 size={16} className="animate-spin" /> Signing you in…</p>;
}
