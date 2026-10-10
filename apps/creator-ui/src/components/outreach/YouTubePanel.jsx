// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { ExternalLink, ImagePlus, Loader2, Puzzle, RotateCw, Upload, X } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useCancelPublishJobMutation,
  useDisconnectYouTubeMutation,
  useEditYouTubeVideoMutation,
  useGetExtensionTokensQuery,
  useGetPublishableFilmsQuery,
  useGetPublishJobsQuery,
  useGetYouTubeAnalyticsQuery,
  useGetYouTubeConnectionQuery,
  usePairExtensionMutation,
  usePublishToYouTubeMutation,
  useRetryPublishJobMutation,
  useRevokeExtensionTokenMutation,
  useSetYouTubeThumbnailMutation,
  useStartYouTubeConnectMutation,
} from "../../api/showcaseEndpoints.js";
import { errorMessage } from "../showcase/showcaseLabels.js";

const input = "w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400/60";
const label = "mb-1.5 block text-[10px] font-bold uppercase tracking-normal text-slate-500";
const JOB_STATUS = {
  QUEUED: ["Waiting", "bg-white/10 text-slate-300"],
  UPLOADING: ["Uploading", "bg-sky-500/15 text-sky-300"],
  PUBLISHED: ["On YouTube", "bg-emerald-500/15 text-emerald-300"],
  SCHEDULED: ["Scheduled", "bg-purple-500/20 text-purple-200"],
  FAILED: ["Failed", "bg-rose-500/15 text-rose-300"],
  CANCELLED: ["Cancelled", "bg-white/10 text-slate-500"],
};
/** Set at deploy time; the extension only accepts pairing from our own pages (rule 38). */
const EXTENSION_ID = (typeof window !== "undefined" && window.__ENV__?.DALAI_EXTENSION_ID) || import.meta.env.VITE_DALAI_EXTENSION_ID || "";

/** Marketing → YouTube (rules 31–38): connect your channel with Google, see its analytics, publish
 * your finished films to it, and pair the Chrome extension. */
export default function YouTubePanel() {
  const { data: connection, isLoading } = useGetYouTubeConnectionQuery();
  if (isLoading) return <p className="flex items-center gap-2 text-sm text-slate-400"><Loader2 size={14} className="animate-spin" /> Loading…</p>;
  return (
    <div className="space-y-6">
      <ConnectionCard connection={connection} />
      {connection?.connected && connection.canReadAnalytics && <AnalyticsCard />}
      {connection?.connected && connection.canPublish && <PublishCard />}
      <ExtensionCard />
    </div>
  );
}

function useFail() {
  const dispatch = useDispatch();
  return (e, fallback) => dispatch(showFlash({ message: errorMessage(e, fallback), type: "error" }));
}

function ConnectionCard({ connection }) {
  const fail = useFail();
  const [start, startState] = useStartYouTubeConnectMutation();
  const [disconnect, disconnectState] = useDisconnectYouTubeMutation();
  const connect = async () => {
    try { window.location.assign((await start().unwrap()).authorizationUrl); } catch (e) { fail(e, "Couldn't start connecting"); }
  };
  const remove = async () => {
    if (!window.confirm("Disconnect your YouTube channel? Publishing and analytics stop until you connect again.")) return;
    try { await disconnect().unwrap(); } catch (e) { fail(e, "Couldn't disconnect"); }
  };

  return (
    <section className="creator-panel p-5">
      <h2 className="text-sm font-bold uppercase tracking-normal text-slate-300">Your YouTube channel</h2>
      {!connection?.oauthConfigured ? (
        <p className="mt-2 text-sm text-slate-400">Connecting YouTube isn't switched on yet.</p>
      ) : !connection?.channelId ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-slate-300">
            Connect with Google to publish your films to your channel, import your videos and see your YouTube analytics here.
            You'll sign in on Google's page; we never see your password.
          </p>
          <button type="button" onClick={connect} disabled={startState.isLoading} className="creator-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
            Connect YouTube
          </button>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {connection.channelThumbnail && <img src={connection.channelThumbnail} alt="" className="h-11 w-11 rounded-full object-cover" />}
            <div>
              <p className="font-bold text-white">{connection.channelTitle}</p>
              <p className="text-xs text-slate-400">
                {connection.connected ? "Connected" : "Access expired: reconnect to keep publishing"}
                {connection.connected && !connection.canReadAnalytics && " · analytics not allowed"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {(!connection.connected || !connection.canReadAnalytics) && (
              <button type="button" onClick={connect} disabled={startState.isLoading} className="creator-primary flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white">
                <RotateCw size={13} /> Reconnect
              </button>
            )}
            <button type="button" onClick={remove} disabled={disconnectState.isLoading} className="creator-control px-3 py-2 text-xs font-bold text-slate-300">
              Disconnect
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function AnalyticsCard() {
  const [days, setDays] = useState(28);
  const { data, isLoading, isError, error } = useGetYouTubeAnalyticsQuery(days);
  const max = useMemo(() => Math.max(1, ...(data?.daily || []).map((d) => d.views)), [data]);
  return (
    <section className="creator-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-normal text-slate-300">YouTube analytics</h2>
        <label className="flex items-center gap-2 text-xs text-slate-400">Last
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="rounded-lg border border-white/10 bg-[#0b0f19] px-2 py-1 text-xs text-white">
            {[7, 28, 90].map((d) => <option key={d} value={d}>{d} days</option>)}
          </select>
        </label>
      </div>
      {isLoading && <p className="mt-3 text-sm text-slate-400">Loading…</p>}
      {isError && <p className="mt-3 text-sm text-rose-300">{errorMessage(error, "Analytics couldn't load")}</p>}
      {data && (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[["Views", data.totals.views], ["Watch time (min)", data.totals.minutesWatched],
              ["Avg view (sec)", data.totals.averageViewDurationSeconds], ["Likes", data.totals.likes],
              ["Subscribers gained", data.totals.subscribersGained]].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                <dt className="text-[10px] font-bold uppercase tracking-normal text-slate-500">{k}</dt>
                <dd className="text-lg font-bold text-white">{Number(v).toLocaleString()}</dd>
              </div>
            ))}
          </dl>
          {data.daily.length > 0 && (
            <figure className="mt-4">
              <div className="flex h-24 items-end gap-[2px]" role="img" aria-label={`Daily views, ${data.startDate} to ${data.endDate}`}>
                {data.daily.map((d) => (
                  <div key={d.date} title={`${d.date}: ${d.views} views`} className="flex-1 rounded-t bg-purple-500/70"
                       style={{ height: `${Math.max(2, (d.views / max) * 100)}%` }} />
                ))}
              </div>
              <figcaption className="mt-1 flex justify-between text-[10px] text-slate-500"><span>{data.startDate}</span><span>Daily views</span><span>{data.endDate}</span></figcaption>
            </figure>
          )}
          {data.topVideos.length > 0 && (
            <table className="mt-4 w-full text-left text-sm">
              <thead><tr className="text-[10px] uppercase tracking-normal text-slate-500">
                <th scope="col" className="pb-2">Top videos</th><th scope="col" className="pb-2 text-right">Views</th><th scope="col" className="pb-2 text-right">Minutes</th>
              </tr></thead>
              <tbody className="divide-y divide-white/5">
                {data.topVideos.map((v) => (
                  <tr key={v.videoId} className="text-slate-200">
                    <td className="py-2"><a href={`https://www.youtube.com/watch?v=${v.videoId}`} target="_blank" rel="noreferrer" className="hover:underline">{v.title || v.videoId}</a></td>
                    <td className="py-2 text-right tabular-nums">{v.views.toLocaleString()}</td>
                    <td className="py-2 text-right tabular-nums">{v.minutesWatched.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="mt-3 text-[11px] text-slate-500">From YouTube Analytics, updated with about a two-day delay.</p>
        </>
      )}
    </section>
  );
}

const newKey = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));

function PublishCard() {
  const fail = useFail();
  const dispatch = useDispatch();
  const { data: films = [], isLoading: filmsLoading } = useGetPublishableFilmsQuery();
  const [polling, setPolling] = useState(0);
  const { data: jobs = [] } = useGetPublishJobsQuery(undefined, { pollingInterval: polling });
  const [publish, publishState] = usePublishToYouTubeMutation();
  const [form, setForm] = useState({ projectId: "", title: "", description: "", tags: "", privacy: "PRIVATE", publishAt: "", confirmPublic: false });
  const [key, setKey] = useState(newKey);

  useEffect(() => {
    setPolling(jobs.some((j) => j.status === "QUEUED" || j.status === "UPLOADING") ? 4000 : 0);
  }, [jobs]);
  const film = films.find((f) => f.projectId === form.projectId) || films[0];
  useEffect(() => {
    if (film && !form.projectId) setForm((f) => ({ ...f, projectId: film.projectId, title: film.name?.slice(0, 100) || "" }));
  }, [film, form.projectId]);

  const goesPublic = form.privacy === "PUBLIC" || Boolean(form.publishAt);
  const submit = async (event) => {
    event.preventDefault();
    try {
      await publish({
        projectId: film.projectId, title: form.title, description: form.description,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        privacy: form.privacy, publishAt: form.publishAt ? new Date(form.publishAt).toISOString() : null,
        confirmPublic: form.confirmPublic, idempotencyKey: key,
      }).unwrap();
      setKey(newKey());
      setForm((f) => ({ ...f, confirmPublic: false }));
      dispatch(showFlash({ message: "Queued. It uploads in the background; you can leave this page.", type: "success" }));
    } catch (e) { fail(e, "Couldn't start publishing"); }
  };

  return (
    <section className="creator-panel p-5">
      <h2 className="text-sm font-bold uppercase tracking-normal text-slate-300">Publish a film to YouTube</h2>
      {filmsLoading ? <p className="mt-3 text-sm text-slate-400">Loading your films…</p> : films.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">No finished films yet. A film appears here once it's published in your project.</p>
      ) : (
        <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2"><span className={label}>Film</span>
            <select value={film?.projectId || ""} onChange={(e) => {
              const next = films.find((f) => f.projectId === e.target.value);
              setForm({ ...form, projectId: e.target.value, title: next?.name?.slice(0, 100) || form.title, privacy: next?.clientConsented ? form.privacy : "PRIVATE" });
            }} className="w-full rounded-lg border border-white/10 bg-[#0b0f19] px-3 py-2.5 text-sm text-white">
              {films.map((f) => <option key={f.projectId} value={f.projectId}>{f.name}{f.clientConsented ? "" : " (private only)"}</option>)}
            </select>
          </label>
          <label className="block sm:col-span-2"><span className={label}>Title</span>
            <input required maxLength={100} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value.replace(/[<>]/g, "") })} className={input} />
          </label>
          <label className="block sm:col-span-2"><span className={label}>Description</span>
            <textarea maxLength={5000} rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value.replace(/[<>]/g, "") })} className={input} />
          </label>
          <label className="block"><span className={label}>Tags (comma separated)</span>
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className={input} />
          </label>
          <label className="block"><span className={label}>Schedule (optional)</span>
            <input type="datetime-local" value={form.publishAt} onChange={(e) => setForm({ ...form, publishAt: e.target.value })} className={input} disabled={!film?.clientConsented} />
          </label>
          <fieldset className="sm:col-span-2">
            <legend className={label}>Visibility</legend>
            <div className="flex flex-wrap gap-2">
              {[["PRIVATE", "Private"], ["UNLISTED", "Unlisted"], ["PUBLIC", "Public"]].map(([v, text]) => (
                <label key={v} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${form.privacy === v ? "border-purple-400/70 bg-purple-500/15 text-white" : "border-white/10 text-slate-300"} ${v !== "PRIVATE" && !film?.clientConsented ? "opacity-40" : ""}`}>
                  <input type="radio" name="privacy" value={v} checked={form.privacy === v} disabled={v !== "PRIVATE" && !film?.clientConsented}
                         onChange={() => setForm({ ...form, privacy: v })} />
                  {text}
                </label>
              ))}
            </div>
            {!film?.clientConsented && <p className="mt-2 text-[11px] text-slate-500">Your client hasn't agreed to marketing use of this film, so it can only be private.</p>}
          </fieldset>
          {goesPublic && (
            <label className="flex items-start gap-2 rounded-lg border border-amber-300/30 bg-amber-500/10 p-3 text-sm text-amber-100 sm:col-span-2">
              <input type="checkbox" checked={form.confirmPublic} onChange={(e) => setForm({ ...form, confirmPublic: e.target.checked })} className="mt-1" />
              I understand this video will be public on my YouTube channel{form.publishAt ? " at the scheduled time" : ""}.
            </label>
          )}
          <div className="sm:col-span-2">
            <button type="submit" disabled={publishState.isLoading || !form.title || (goesPublic && !form.confirmPublic)}
                    className="creator-primary flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
              {publishState.isLoading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Publish
            </button>
          </div>
        </form>
      )}
      {jobs.length > 0 && (
        <ul className="mt-6 space-y-3">
          {jobs.map((j) => <JobRow key={j.id} job={j} />)}
        </ul>
      )}
    </section>
  );
}

function JobRow({ job }) {
  const fail = useFail();
  const fileRef = useRef(null);
  const [cancel] = useCancelPublishJobMutation();
  const [retry] = useRetryPublishJobMutation();
  const [thumbnail, thumbState] = useSetYouTubeThumbnailMutation();
  const [editing, setEditing] = useState(false);
  const [text, tone] = JOB_STATUS[job.status];
  const onFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) await thumbnail({ id: job.id, file }).unwrap().catch((e) => fail(e, "Couldn't set the thumbnail"));
  };

  return (
    <li className="rounded-xl border border-white/10 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-white">{job.title}</p>
          <p className="text-xs text-slate-400">
            {job.privacy.toLowerCase()}{job.publishAt ? ` · goes public ${new Date(job.publishAt).toLocaleString()}` : ""}
            {job.via === "EXTENSION" ? " · from the extension" : ""}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${tone}`}>{text}</span>
      </div>
      {(job.status === "UPLOADING" || job.status === "QUEUED") && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={job.progressPercent} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-sky-400 transition-all" style={{ width: `${job.progressPercent}%` }} />
        </div>
      )}
      {job.lastError && <p className="mt-2 text-xs text-rose-300">{job.lastError}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {job.youtubeUrl && (
          <a href={job.youtubeUrl} target="_blank" rel="noreferrer" className="creator-control flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-200">
            Open on YouTube <ExternalLink size={12} />
          </a>
        )}
        {["QUEUED", "UPLOADING"].includes(job.status) && (
          <button type="button" onClick={() => cancel(job.id).unwrap().catch((e) => fail(e, "Couldn't cancel"))} className="creator-control px-3 py-1.5 text-xs font-bold text-slate-300">Cancel</button>
        )}
        {job.status === "FAILED" && (
          <button type="button" onClick={() => retry(job.id).unwrap().catch((e) => fail(e, "Couldn't retry"))} className="creator-primary px-3 py-1.5 text-xs font-bold text-white">Retry</button>
        )}
        {["QUEUED", "UPLOADING", "PUBLISHED", "SCHEDULED"].includes(job.status) && (
          <>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png" onChange={onFile} className="hidden" />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={thumbState.isLoading} className="creator-control flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-200">
              <ImagePlus size={12} /> {job.hasThumbnail ? "Change thumbnail" : "Thumbnail"}
            </button>
          </>
        )}
        {["PUBLISHED", "SCHEDULED"].includes(job.status) && (
          <button type="button" onClick={() => setEditing(!editing)} className="creator-control px-3 py-1.5 text-xs font-bold text-slate-200">{editing ? "Close" : "Edit"}</button>
        )}
      </div>
      {editing && <EditForm job={job} onDone={() => setEditing(false)} />}
    </li>
  );
}

function EditForm({ job, onDone }) {
  const fail = useFail();
  const [edit, state] = useEditYouTubeVideoMutation();
  const toLocal = (iso) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");
  const [form, setForm] = useState({ title: job.title, description: job.description, tags: job.tags.join(", "), privacy: job.privacy,
    publishAt: toLocal(job.publishAt), confirmPublic: false });
  const goesPublic = form.privacy === "PUBLIC" || Boolean(form.publishAt);
  const save = async (event) => {
    event.preventDefault();
    try {
      await edit({ id: job.id, title: form.title, description: form.description, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        privacy: form.privacy, publishAt: form.publishAt ? new Date(form.publishAt).toISOString() : null, confirmPublic: form.confirmPublic }).unwrap();
      onDone();
    } catch (e) { fail(e, "Couldn't update the video"); }
  };
  return (
    <form onSubmit={save} className="mt-3 space-y-3 rounded-lg border border-white/10 p-3">
      <input required maxLength={100} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value.replace(/[<>]/g, "") })} className={input} aria-label="Title" />
      <textarea rows={3} maxLength={5000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value.replace(/[<>]/g, "") })} className={input} aria-label="Description" />
      <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className={input} aria-label="Tags" />
      <div className="flex flex-wrap gap-2">
        <select value={form.privacy} onChange={(e) => setForm({ ...form, privacy: e.target.value })} aria-label="Visibility"
                className="rounded-lg border border-white/10 bg-[#0b0f19] px-3 py-2 text-sm text-white">
          <option value="PRIVATE">Private</option><option value="UNLISTED">Unlisted</option><option value="PUBLIC">Public</option>
        </select>
        <input type="datetime-local" value={form.publishAt} onChange={(e) => setForm({ ...form, publishAt: e.target.value })} aria-label="Schedule" className={`${input} w-auto`} />
      </div>
      {goesPublic && (
        <label className="flex items-start gap-2 text-xs text-amber-100">
          <input type="checkbox" checked={form.confirmPublic} onChange={(e) => setForm({ ...form, confirmPublic: e.target.checked })} className="mt-0.5" />
          I understand this video will be public.
        </label>
      )}
      <button type="submit" disabled={state.isLoading} className="creator-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Save on YouTube</button>
    </form>
  );
}

function ExtensionCard() {
  const fail = useFail();
  const dispatch = useDispatch();
  const { data: tokens = [] } = useGetExtensionTokensQuery();
  const [pair, pairState] = usePairExtensionMutation();
  const [revoke] = useRevokeExtensionTokenMutation();
  const canMessage = Boolean(EXTENSION_ID && typeof window !== "undefined" && window.chrome?.runtime?.sendMessage);

  const connect = async () => {
    try {
      const minted = await pair(navigator.userAgentData?.platform ? `Chrome on ${navigator.userAgentData.platform}` : "Chrome").unwrap();
      // Handed straight to the extension (externally_connectable); this page doesn't keep it.
      window.chrome.runtime.sendMessage(EXTENSION_ID, { type: "DALAI_PAIR", token: minted.token, expiresAt: minted.expiresAt }, (reply) => {
        const ok = !window.chrome.runtime.lastError && reply?.ok;
        dispatch(showFlash({ message: ok ? "Extension connected" : "The extension didn't answer. Is it installed in this browser?", type: ok ? "success" : "error" }));
        if (!ok) revoke(minted.id);
      });
    } catch (e) { fail(e, "Couldn't connect the extension"); }
  };

  return (
    <section className="creator-panel p-5">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-normal text-slate-300"><Puzzle size={15} /> Chrome extension</h2>
      <p className="mt-1 text-xs text-slate-400">
        Add the YouTube video you're watching to your profile, or publish one of your films, from the browser toolbar.
      </p>
      <button type="button" onClick={connect} disabled={!canMessage || pairState.isLoading}
              className="creator-primary mt-3 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
        Connect the extension in this browser
      </button>
      {!canMessage && <p className="mt-2 text-[11px] text-slate-500">Install the Dalai Llama extension in Chrome, then reload this page.</p>}
      {tokens.length > 0 && (
        <ul className="mt-4 divide-y divide-white/10 rounded-lg border border-white/10 text-sm">
          {tokens.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-2 px-3 py-2">
              <span className="text-slate-200">{t.label}<span className="ml-2 text-xs text-slate-500">
                {t.lastUsedAt ? `used ${new Date(t.lastUsedAt).toLocaleDateString()}` : "not used yet"} · until {new Date(t.expiresAt).toLocaleDateString()}</span></span>
              <button type="button" onClick={() => revoke(t.id)} aria-label={`Disconnect ${t.label}`} className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-rose-300"><X size={14} /></button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
