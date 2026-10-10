// @ts-nocheck
import React, { useMemo, useState } from "react";
import { AlertCircle, Copy, KeyRound, Loader2, Mail, RotateCw, Send } from "lucide-react";
import {
  useGetMyEmailIdentityQuery,
  useRotateMyEmailPasswordMutation,
  useSendCreatorEmailMutation,
} from "../api/leadEndpoints.js";
import TemplateOutreach from "../components/outreach/TemplateOutreach.jsx";
import TemplatesPanel from "../components/outreach/TemplatesPanel.jsx";
import AudiencesPanel from "../components/outreach/AudiencesPanel.jsx";
import AnalyticsPanel from "../components/outreach/AnalyticsPanel.jsx";
import ChannelLinkWizard from "../components/showcase/ChannelLinkWizard.jsx";
import ShowcaseManager from "../components/showcase/ShowcaseManager.jsx";
import VideoPickerGrid from "../components/showcase/VideoPickerGrid.jsx";

const TABS = [
  ["send", "Send"],
  ["templates", "Templates"],
  ["audiences", "Audiences"],
  ["videos", "Videos"],
  ["analytics", "Analytics"],
  ["email", "Business email"],
];

/** Marketing (CREATOR_SHOWCASE.md rules 21-29): everything outreach in one place. Send (template +
 * film + audience or typed addresses), Templates (Dalai Llama's and your own), Audiences (CSV upload,
 * de-duplicated leads, validated contact points), Videos (the channel films templates carry),
 * Analytics, and the business email identity with a free-form composer for one-to-one mail. */
export default function MarketingPage() {
  const [tab, setTab] = useState("send");
  const [templateId, setTemplateId] = useState(null);
  const chooseTemplate = (id) => { setTemplateId(id); setTab("send"); };
  const {
    data: identity,
    isLoading: identityLoading,
    isFetching: identityFetching,
    isError: identityError,
    refetch: refetchIdentity,
  } = useGetMyEmailIdentityQuery();
  const [rotate, rotateState] = useRotateMyEmailPasswordMutation();
  const [sendMail, sendState] = useSendCreatorEmailMutation();

  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(null);
  const [sendResult, setSendResult] = useState(null);

  const parsedRecipients = useMemo(
    () => (to || "")
      .split(/[,\s;]+/)
      .map((s) => s.trim())
      .filter(Boolean),
    [to],
  );
  const canSend = parsedRecipients.length > 0 && subject.trim().length > 0 && body.trim().length > 0;

  const copyToClipboard = async (label, value) => {
    try {
      await navigator.clipboard.writeText(value || "");
      setCopied(label);
      window.setTimeout(() => setCopied((current) => (current === label ? null : current)), 1500);
    } catch {
      // Clipboard blocked by browser -- user can still select+copy manually.
    }
  };

  const handleRotate = async () => {
    setSendResult(null);
    if (!window.confirm("Rotate the mailbox password? The old password will stop working immediately.")) return;
    try {
      await rotate().unwrap();
      setShowPassword(true);
    } catch {
      // Rotation failure -- rely on the visible error text via rotateState.
    }
  };

  const handleSend = async () => {
    setSendResult(null);
    if (!canSend) return;
    try {
      const result = await sendMail({
        to: parsedRecipients,
        subject: subject.trim(),
        bodyText: body,
      }).unwrap();
      setSendResult({ ok: true, message: `Sent to ${parsedRecipients.length} recipient(s).` });
    } catch (error) {
      const status = error?.status;
      const detail = error?.data?.error || error?.error || "Unknown send error";
      setSendResult({
        ok: false,
        message: status === 503
          ? "SMTP relay is not configured yet. Ask ops to set SMTP_USERNAME/PASSWORD/FROM on tenant-service."
          : `Send failed (${status || "?"}): ${detail}`,
      });
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/20 text-purple-100">
          <Mail size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Marketing</h1>
          <p className="text-sm font-medium text-slate-400">
            Send your work to brands, manage who you reach, and see what works.
          </p>
        </div>
      </div>

      <div role="tablist" aria-label="Marketing sections" className="mb-5 flex flex-wrap gap-2">
        {TABS.map(([id, text]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                  className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === id ? "bg-purple-600 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
            {text}
          </button>
        ))}
      </div>

      {tab === "send" && <TemplateOutreach templateId={templateId} onTemplateChange={setTemplateId} />}
      {tab === "templates" && <TemplatesPanel onUse={chooseTemplate} />}
      {tab === "audiences" && <AudiencesPanel />}
      {tab === "analytics" && <AnalyticsPanel />}
      {tab === "videos" && (
        <div className="space-y-6">
          <p className="text-xs text-slate-400">
            Films made on Dalai Llama that your client paid for and agreed to marketing use of are what templates can send.
            Your channel's own videos show on your public profile.
          </p>
          <ChannelLinkWizard />
          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-normal text-slate-300">On your profile</h2>
            <ShowcaseManager />
          </section>
          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-normal text-slate-300">Your channel's videos</h2>
            <VideoPickerGrid />
          </section>
        </div>
      )}

      {tab === "email" && (<>
      {/* ---- Business email identity card ---- */}
      <section className="creator-panel mb-6 p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-normal text-slate-300">
            Your business email
          </h2>
          <button
            type="button"
            onClick={() => refetchIdentity()}
            disabled={identityFetching}
            className="creator-control px-2 py-1 text-[11px] font-bold text-slate-200 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {identityLoading && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 size={14} className="animate-spin" /> Loading identity...
          </div>
        )}

        {identityError && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-100">
            <AlertCircle size={14} /> Could not load your email identity. Try Refresh.
          </div>
        )}

        {identity && (
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-normal text-slate-500">Address</p>
              <p className="mt-1 break-all font-mono text-sm text-white">{identity.email}</p>
              {identity.displayName && (
                <p className="mt-1 text-xs text-slate-400">
                  Sent as <span className="font-semibold text-slate-200">"{identity.displayName}"</span> in recipient inboxes.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard("email", identity.email)}
              className="creator-control flex h-8 items-center gap-1.5 self-start px-3 text-xs font-bold text-slate-200"
            >
              <Copy size={13} /> {copied === "email" ? "Copied" : "Copy"}
            </button>

            <div className="min-w-0 sm:col-span-1">
              <p className="text-[10px] font-bold uppercase tracking-normal text-slate-500">Password</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="break-all font-mono text-sm text-white">
                  {showPassword ? (identity.password || "—") : "•".repeat(Math.max(8, (identity.password || "").length))}
                </p>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-[11px] font-bold text-purple-300 hover:text-purple-200"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Provisional password. Rotation invalidates the old one immediately.
              </p>
            </div>
            <div className="flex items-start gap-2 self-start sm:col-span-1 sm:justify-end">
              <button
                type="button"
                onClick={() => copyToClipboard("password", identity.password)}
                disabled={!identity.password}
                className="creator-control flex h-8 items-center gap-1.5 px-3 text-xs font-bold text-slate-200 disabled:opacity-50"
              >
                <Copy size={13} /> {copied === "password" ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                onClick={handleRotate}
                disabled={rotateState.isLoading}
                className="creator-control flex h-8 items-center gap-1.5 px-3 text-xs font-bold text-slate-200 disabled:opacity-50"
              >
                {rotateState.isLoading ? <Loader2 size={13} className="animate-spin" /> : <RotateCw size={13} />}
                Rotate
              </button>
            </div>
          </div>
        )}

        {rotateState.isError && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100">
            <AlertCircle size={14} /> Rotation failed.
          </div>
        )}
      </section>

      {/* ---- Free-form composer (one-to-one mail) ---- */}
      <section className="creator-panel p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-normal text-slate-300">
          Write your own email
        </h2>

        <label className="mb-3 block">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-normal text-slate-500">
            To (comma / space separated)
          </span>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="lead@example.com, another@example.com"
            className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400/60"
          />
          {parsedRecipients.length > 0 && (
            <span className="mt-1 block text-[11px] text-slate-500">
              {parsedRecipients.length} recipient(s)
            </span>
          )}
        </label>

        <label className="mb-3 block">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-normal text-slate-500">
            Subject
          </span>
          <input
            type="text"
            value={subject}
            maxLength={300}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Quick intro from Dalaillama"
            className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400/60"
          />
        </label>

        <label className="mb-3 block">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-normal text-slate-500">
            Body (plain text; paste your own template)
          </span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={"Hi {name},\n\n[Your outreach copy here]\n\n— " + (identity?.displayName || "Creator")}
            rows={12}
            className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400/60"
          />
        </label>

        {sendResult && (
          <div
            className={`mb-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
              sendResult.ok
                ? "border-emerald-300/20 bg-emerald-500/10 text-emerald-100"
                : "border-rose-300/20 bg-rose-500/10 text-rose-100"
            }`}
          >
            {sendResult.ok ? <Send size={14} /> : <AlertCircle size={14} />}
            {sendResult.message}
          </div>
        )}

        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend || sendState.isLoading}
          className="creator-primary flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sendState.isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          Send email
        </button>

        <p className="mt-3 flex items-start gap-1.5 text-[11px] text-slate-500">
          <KeyRound size={12} className="mt-0.5 shrink-0" />
          Sent through the shared Hostinger relay for now. Recipients see your business email
          address as the sender; replies route back to it via Cloudflare Email Routing.
        </p>
      </section>
      </>)}
    </div>
  );
}
