// @ts-nocheck
import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  useAdminDisconnectPlatformYouTubeMutation,
  useAdminOnboardingBackfillMutation,
  useAdminPlatformYouTubeQuery,
  useAdminStartPlatformYouTubeMutation,
  useAdminShowcaseHealthQuery,
  useAdminShowcaseHideItemMutation,
  useAdminShowcaseProbeMutation,
  useAdminShowcaseProfileStatusMutation,
  useAdminShowcaseReportsQuery,
  useAdminShowcaseRescoreMutation,
} from "../../api/showcaseEndpoints.js";

/** Ops tools for the Creator Showcase: re-score, reported videos, the kill switch, the
 * video-host health panel and the one-time onboarding backfill. No alerting by design: this
 * panel is where ops looks. */
export default function ShowcaseAdminTab() {
  const { data: health, isFetching: healthLoading } = useAdminShowcaseHealthQuery();
  const { data: reports = [] } = useAdminShowcaseReportsQuery();
  const [rescore, rescoreState] = useAdminShowcaseRescoreMutation();
  const [probe, probeState] = useAdminShowcaseProbeMutation();
  const [hideItem] = useAdminShowcaseHideItemMutation();
  const [setProfileStatus, profileState] = useAdminShowcaseProfileStatusMutation();
  const [backfill, backfillState] = useAdminOnboardingBackfillMutation();
  const { data: platformChannel } = useAdminPlatformYouTubeQuery();
  const [startPlatform, startPlatformState] = useAdminStartPlatformYouTubeMutation();
  const [disconnectPlatform] = useAdminDisconnectPlatformYouTubeMutation();
  const [handle, setHandle] = useState("");
  const [message, setMessage] = useState(null);

  const run = async (action, describe) => {
    setMessage(null);
    try {
      const result = await action().unwrap();
      setMessage({ ok: true, text: describe(result) });
    } catch (e) {
      setMessage({ ok: false, text: e?.data?.message || `Failed (${e?.status || "?"})` });
    }
  };

  return (
    <section className="space-y-5 text-sm">
      {message && (
        <p className={`rounded-md border px-3 py-2 text-xs font-semibold ${message.ok ? "border-emerald-400/30 text-emerald-200" : "border-rose-400/30 text-rose-200"}`}>
          {message.text}
        </p>
      )}

      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">Official Dalaillama YouTube channel</p>
        <p className="mt-1 text-xs text-slate-500">Sign in as the channel's owner (a Google account with access to the brand channel). Official uploads use it.</p>
        {platformChannel && (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-slate-200">
              {!platformChannel.oauthConfigured ? "Google OAuth client not configured"
                : platformChannel.channelId ? `${platformChannel.channelTitle} · ${platformChannel.connected ? "connected" : "access expired"}` : "Not connected"}
            </span>
            <div className="flex gap-2">
              <button type="button" disabled={!platformChannel.oauthConfigured || startPlatformState.isLoading}
                      onClick={() => run(startPlatform, (r) => { window.location.assign(r.authorizationUrl); return "Opening Google…"; })}
                      className="creator-primary px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50">
                {platformChannel.channelId ? "Reconnect" : "Connect"}
              </button>
              {platformChannel.channelId && (
                <button type="button" onClick={() => window.confirm("Disconnect the official channel?") && run(disconnectPlatform, () => "Disconnected")}
                        className="creator-control px-3 py-1.5 text-[11px] font-bold text-slate-200">Disconnect</button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">Video host</p>
        {healthLoading && <Loader2 size={14} className="mt-2 animate-spin text-slate-400" />}
        {health && (
          <dl className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <div><dt className="text-slate-500">YouTube API key</dt><dd className="font-bold text-slate-200">{health.youtubeApiConfigured ? "Set" : "Missing"}</dd></div>
            <div><dt className="text-slate-500">Official channel</dt><dd className="font-bold text-slate-200">{health.officialChannelConnected ? "Connected" : "Not connected"}</dd></div>
            <div><dt className="text-slate-500">Platform films play from</dt><dd className="font-bold text-slate-200">{health.platformFilmsHost}</dd></div>
            <div><dt className="text-slate-500">Last probe</dt>
              <dd className={`font-bold ${health.lastProbe?.ok ? "text-emerald-300" : "text-amber-200"}`}>
                {health.lastProbe ? `${health.lastProbe.message} (${new Date(health.lastProbe.at).toLocaleString()})` : "Not run yet"}
              </dd>
            </div>
          </dl>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => run(probe, (p) => p.message)} disabled={probeState.isLoading}
                  className="creator-control h-8 px-3 text-xs font-bold text-slate-200 disabled:opacity-50">Run probe now</button>
          <button type="button" onClick={() => run(rescore, (r) => `Ranked ${r.creatorsRanked} creators, ${r.itemsScored} videos. Floors: landing ${r.landingFloor}, top ${r.topFloor}, picks ${r.autoFloor}. Maturity ${r.maturity}.`)}
                  disabled={rescoreState.isLoading} className="creator-control h-8 px-3 text-xs font-bold text-slate-200 disabled:opacity-50">
            Re-score now
          </button>
          <button type="button" onClick={() => run(backfill, (b) => `Onboarded ${b.onboardedCount}, skipped ${b.skippedNotSubscribedCount} not subscribed, ${b.incompleteTenantIds.length} incomplete.`)}
                  disabled={backfillState.isLoading} className="creator-control h-8 px-3 text-xs font-bold text-slate-200 disabled:opacity-50">
            Backfill email + profiles
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">Hide or restore a profile</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <label htmlFor="adminHandle" className="sr-only">Handle</label>
          <input id="adminHandle" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="handle"
                 className="creator-input px-2.5 py-1.5 text-xs" />
          <button type="button" disabled={!handle || profileState.isLoading} onClick={() => run(() => setProfileStatus({ handle, status: "HIDDEN" }), () => `${handle} hidden`)}
                  className="creator-control h-8 px-3 text-xs font-bold text-rose-200 disabled:opacity-50">Hide</button>
          <button type="button" disabled={!handle || profileState.isLoading} onClick={() => run(() => setProfileStatus({ handle, status: "ACTIVE" }), () => `${handle} restored`)}
                  className="creator-control h-8 px-3 text-xs font-bold text-slate-200 disabled:opacity-50">Restore</button>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">Reported videos</p>
        {reports.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">No reports.</p>
        ) : (
          <table className="mt-2 w-full text-left text-xs">
            <thead className="text-slate-500"><tr><th className="py-1">Video</th><th>Reports</th><th>State</th><th /></tr></thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.publicId} className="border-t border-white/5">
                  <td className="py-1.5">
                    <a href={`https://www.youtube.com/watch?v=${r.youtubeVideoId}`} target="_blank" rel="noreferrer" className="text-purple-200">{r.publicId}</a>
                  </td>
                  <td className="font-bold text-slate-200">{r.reportCount}</td>
                  <td className={r.hiddenByOps ? "text-rose-200" : "text-slate-300"}>{r.hiddenByOps ? "Hidden" : "Live"}</td>
                  <td className="text-right">
                    <button type="button" onClick={() => run(() => hideItem({ publicId: r.publicId, hidden: !r.hiddenByOps }), () => "Updated")}
                            className="creator-control h-7 px-2.5 text-[11px] font-bold text-slate-200">{r.hiddenByOps ? "Show again" : "Hide"}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
