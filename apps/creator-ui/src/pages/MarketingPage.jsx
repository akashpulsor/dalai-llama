// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { showFlash } from "@dalaillama/shared-store";
import { AlertCircle, Copy, Loader2, Mail, RotateCw } from "lucide-react";
import { useGetMyEmailIdentityQuery, useRotateMyEmailPasswordMutation } from "../api/leadEndpoints.js";
import TemplateOutreach from "../components/outreach/TemplateOutreach.jsx";
import TemplatesPanel from "../components/outreach/TemplatesPanel.jsx";
import AudiencesPanel from "../components/outreach/AudiencesPanel.jsx";
import AnalyticsPanel from "../components/outreach/AnalyticsPanel.jsx";
import YouTubePanel from "../components/outreach/YouTubePanel.jsx";
import ChannelLinkWizard from "../components/showcase/ChannelLinkWizard.jsx";
import ShowcaseManager from "../components/showcase/ShowcaseManager.jsx";
import VideoPickerGrid from "../components/showcase/VideoPickerGrid.jsx";

const TABS = [
  ["send", "Send"],
  ["templates", "Templates"],
  ["audiences", "Audiences"],
  ["videos", "Videos"],
  ["analytics", "Analytics"],
  ["youtube", "YouTube"],
  ["email", "Business email"],
];

/** Marketing (CREATOR_SHOWCASE.md rules 21-29): everything outreach in one place. Send (template +
 * film + audience or typed addresses), Templates (Dalai Llama's and your own), Audiences (CSV upload,
 * de-duplicated leads, validated contact points), Videos (the channel films templates carry),
 * Analytics, and the business email identity. Brands are reached only through templates. */
/** What Google's redirect (?youtube=...) means for the creator. */
const YOUTUBE_RESULT = {
  connected: ["Your YouTube channel is connected", "success"],
  denied: ["You didn't allow access, so nothing changed", "error"],
  expired: ["That sign-in took too long; please connect again", "error"],
  missing_permission: ["Please allow YouTube access on Google's page to connect", "error"],
  no_offline_access: ["Google didn't give lasting access; please connect again", "error"],
  no_channel: ["That Google account has no YouTube channel", "error"],
  taken: ["That channel is connected to another Dalai Llama account", "error"],
  other_channel: ["Your account already uses a different channel; disconnect it first", "error"],
  failed: ["Connecting YouTube failed; please try again", "error"],
};

export default function MarketingPage() {
  const dispatch = useDispatch();
  const [tab, setTab] = useState(() => (new URLSearchParams(window.location.search).get("youtube") ? "youtube" : "send"));
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = YOUTUBE_RESULT[params.get("youtube")];
    if (!result) return;
    dispatch(showFlash({ message: result[0], type: result[1] }));
    params.delete("youtube");
    window.history.replaceState(null, "", window.location.pathname + (params.toString() ? `?${params}` : ""));
  }, [dispatch]);
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

  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(null);

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
    if (!window.confirm("Rotate the mailbox password? The old password will stop working immediately.")) return;
    try {
      await rotate().unwrap();
      setShowPassword(true);
    } catch {
      // Rotation failure -- rely on the visible error text via rotateState.
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
      {tab === "youtube" && <YouTubePanel />}
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

      </>)}
    </div>
  );
}
