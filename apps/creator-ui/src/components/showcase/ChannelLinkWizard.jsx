// @ts-nocheck
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { CheckCircle2, Copy, ExternalLink, Loader2, RefreshCw, Youtube } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useGetMyChannelQuery,
  useLinkChannelMutation,
  useSyncChannelMutation,
  useVerifyChannelMutation,
} from "../../api/showcaseEndpoints.js";
import { errorMessage } from "./showcaseLabels.js";

const CREATE_CHANNEL_HELP = "https://support.google.com/youtube/answer/1646861";

/** Links the creator's YouTube channel without a Google login: we give a code, they paste it into
 * their channel description, we read it back. */
export default function ChannelLinkWizard() {
  const dispatch = useDispatch();
  const { data: channel, error, isLoading } = useGetMyChannelQuery();
  const [link, linkState] = useLinkChannelMutation();
  const [verify, verifyState] = useVerifyChannelMutation();
  const [sync, syncState] = useSyncChannelMutation();
  const [input, setInput] = useState("");
  const [verifyMessage, setVerifyMessage] = useState(null);
  const [copied, setCopied] = useState(false);

  const flashError = (e, fallback) => dispatch(showFlash({ message: errorMessage(e, fallback), type: "error" }));

  const onLink = async () => {
    setVerifyMessage(null);
    try {
      await link(input.trim()).unwrap();
    } catch (e) {
      flashError(e, "Could not find that channel");
    }
  };

  const onVerify = async () => {
    setVerifyMessage(null);
    try {
      await verify().unwrap();
      dispatch(showFlash({ message: "Channel verified. Your videos are imported.", type: "success" }));
    } catch (e) {
      if (e?.status === 409) setVerifyMessage(errorMessage(e, "We couldn't find the code yet"));
      else flashError(e, "Could not verify your channel");
    }
  };

  const onSync = async () => {
    try {
      await sync().unwrap();
      dispatch(showFlash({ message: "Channel synced", type: "success" }));
    } catch (e) {
      flashError(e, "Could not sync your channel");
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(channel.verificationCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked: the code is on screen to copy by hand.
    }
  };

  if (isLoading) {
    return <p className="flex items-center gap-2 text-sm text-slate-400"><Loader2 size={14} className="animate-spin" /> Loading…</p>;
  }

  const hasChannel = channel && !error;

  if (hasChannel && channel.status === "VERIFIED") {
    return (
      <section className="creator-panel flex flex-wrap items-center gap-4 p-5">
        {channel.channelThumbnailUrl && (
          <img src={channel.channelThumbnailUrl} alt="" className="h-12 w-12 rounded-full border border-white/10" />
        )}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-bold text-white">
            <CheckCircle2 size={15} className="text-emerald-300" /> {channel.channelTitle}
          </p>
          <a href={channel.channelUrl} target="_blank" rel="noreferrer" className="text-xs text-purple-200 hover:text-purple-100">
            Open on YouTube <ExternalLink size={11} className="inline" />
          </a>
          {channel.lastSyncedAt && (
            <p className="text-xs text-slate-500">Last synced {new Date(channel.lastSyncedAt).toLocaleString()}</p>
          )}
        </div>
        <button type="button" onClick={onSync} disabled={syncState.isLoading}
                className="creator-control flex h-9 items-center gap-2 px-3 text-xs font-bold text-slate-200 disabled:opacity-50">
          {syncState.isLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Sync videos
        </button>
      </section>
    );
  }

  return (
    <section className="creator-panel p-5">
      <div className="mb-4 flex items-center gap-3">
        <Youtube size={20} className="text-rose-300" />
        <h2 className="text-sm font-bold uppercase tracking-normal text-slate-300">Link your YouTube channel</h2>
      </div>

      <ol className="space-y-4 text-sm text-slate-300">
        <li>
          <p className="font-semibold text-white">1. Paste your channel link or @handle</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <label htmlFor="channel" className="sr-only">Channel link or handle</label>
            <input
              id="channel"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="https://www.youtube.com/@yourchannel"
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400/60"
            />
            <button type="button" onClick={onLink} disabled={!input.trim() || linkState.isLoading}
                    className="creator-primary flex min-h-10 items-center gap-2 px-4 text-xs font-black text-white disabled:opacity-50">
              {linkState.isLoading && <Loader2 size={13} className="animate-spin" />} Get my code
            </button>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            No channel yet? <a href={CREATE_CHANNEL_HELP} target="_blank" rel="noreferrer" className="text-purple-200">Create one for free</a>; it takes a minute.
          </p>
        </li>

        {hasChannel && channel.status === "PENDING" && (
          <>
            <li>
              <p className="font-semibold text-white">2. Add this code anywhere in your channel description</p>
              <p className="text-xs text-slate-400">
                YouTube Studio → Customization → Basic info → Description. You can remove it once verified.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="rounded-lg border border-purple-400/30 bg-purple-500/10 px-3 py-2 font-mono text-base font-bold text-purple-100">
                  {channel.verificationCode}
                </code>
                <button type="button" onClick={copyCode} className="creator-control flex h-9 items-center gap-1.5 px-3 text-xs font-bold text-slate-200">
                  <Copy size={13} /> {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">For channel: {channel.channelTitle}</p>
            </li>
            <li>
              <p className="font-semibold text-white">3. Verify</p>
              <button type="button" onClick={onVerify} disabled={verifyState.isLoading}
                      className="creator-primary mt-2 flex min-h-10 items-center gap-2 px-4 text-xs font-black text-white disabled:opacity-50">
                {verifyState.isLoading && <Loader2 size={13} className="animate-spin" />} I've added it, verify
              </button>
              {verifyMessage && <p className="mt-2 text-xs font-semibold text-amber-200">{verifyMessage}</p>}
            </li>
          </>
        )}
      </ol>
    </section>
  );
}
