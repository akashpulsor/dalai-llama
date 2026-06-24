// @ts-nocheck
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  History,
  Loader2,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Search,
} from "lucide-react";
import {
  useGetJobsQuery,
  useGetShortVideosQuery,
  useResumeShortGenerationMutation,
  useRestartShortGenerationMutation,
} from "../api/creatorEndpoints.js";

const terminalStatuses = new Set(["COMPLETED", "FAILED", "ERROR", "CANCELLED", "SUCCEEDED", "SUCCESS"]);
const replayStages = [
  "TRANSCRIPT",
  "TRANSCRIPT_CRITIC",
  "VIDEO_TYPE_CLASSIFICATION",
  "SCENE_ANALYSIS",
  "SCENE_CRITIC",
  "VIDEO_GRAPH_BUILDER",
  "STORY_UNDERSTANDING",
  "STORY_BEAT_PLANNING",
  "VISUAL_STORY_COMPOSITION",
  "COMPRESSION",
  "HOOK_GENERATION",
  "CAPTION_PLANNING",
  "VISUAL_ENHANCEMENT",
  "CANDIDATE_RANKING",
  "RENDERING",
  "POST_RENDER_QA",
];

export default function ShortsHistoryPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [stageByVideoId, setStageByVideoId] = useState({});
  const [busyVideoId, setBusyVideoId] = useState(null);
  const [message, setMessage] = useState("");
  const { data: videos = [], isFetching: videosLoading, refetch: refetchVideos } = useGetShortVideosQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { data: jobs = [], isFetching: jobsLoading, refetch: refetchJobs } = useGetJobsQuery({ jobType: "SHORTS_GENERATE" }, {
    refetchOnMountOrArgChange: true,
  });
  const [resumeShortGeneration, resumeState] = useResumeShortGenerationMutation();
  const [restartShortGeneration, restartState] = useRestartShortGenerationMutation();

  const rows = useMemo(() => {
    const attemptsByVideoId = new Map();
    arrayValue(jobs).forEach((job) => {
      const videoId = job?.inputPayload?.shortVideoId || job?.outputPayload?.shortVideoId;
      if (!videoId) return;
      if (!attemptsByVideoId.has(videoId)) attemptsByVideoId.set(videoId, []);
      attemptsByVideoId.get(videoId).push(job);
    });

    const normalizedQuery = query.trim().toLowerCase();
    return arrayValue(videos)
      .map((video) => {
        const attempts = attemptsByVideoId.get(video.videoId) || [];
        const currentJob = attempts.find((job) => job.jobId === video.generationJobId) || attempts[0] || null;
        return { video, attempts, currentJob };
      })
      .filter(({ video, currentJob }) => {
        if (!normalizedQuery) return true;
        return [
          video?.title,
          video?.status,
          video?.platform,
          video?.videoId,
          currentJob?.status,
          currentJob?.message,
        ].join(" ").toLowerCase().includes(normalizedQuery);
      });
  }, [jobs, query, videos]);

  const openRun = (video, jobId) => {
    const params = new URLSearchParams();
    params.set("videoId", video.videoId);
    const liveJobId = jobId || video.generationJobId;
    if (liveJobId && !terminalStatuses.has(String(video.status || "").toUpperCase())) {
      params.set("jobId", liveJobId);
    }
    navigate(`/generate-shorts?${params.toString()}`);
  };

  const restartRun = async (video, replayStage = "") => {
    if (!video?.videoId) return;
    setBusyVideoId(video.videoId);
    setMessage("");
    try {
      const response = await restartShortGeneration({
        videoId: video.videoId,
        mode: replayStage ? "REPLAY_STAGE" : "RESTART_FROM_INGESTED",
        replayStage,
        reason: replayStage ? `Replay requested from ${labelForStage(replayStage)}` : "Restart requested from shorts history",
      }).unwrap();
      await Promise.allSettled([refetchVideos?.(), refetchJobs?.()]);
      openRun(response, response?.generationJobId);
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusyVideoId(null);
    }
  };

  const resumeRun = async (video) => {
    if (!video?.videoId) return;
    setBusyVideoId(video.videoId);
    setMessage("");
    try {
      const response = await resumeShortGeneration({
        videoId: video.videoId,
        executionMode: "AUTO",
        manualStepMode: false,
      }).unwrap();
      await Promise.allSettled([refetchVideos?.(), refetchJobs?.()]);
      openRun(response, response?.generationJobId);
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusyVideoId(null);
    }
  };

  const isLoading = videosLoading || jobsLoading;

  return (
    <section className="creator-section min-h-screen space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 rounded-lg border border-white/10 bg-black/25 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-slate-400">
            <History size={18} />
            <span className="text-[11px] font-black uppercase tracking-normal">Shorts History</span>
          </div>
          <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">Generated Shorts Jobs</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            void refetchVideos?.();
            void refetchJobs?.();
          }}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-black text-white hover:bg-white/[0.08]"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="flex min-h-11 items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3">
        <Search size={16} className="shrink-0 text-slate-500" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search shorts history"
          className="min-w-0 flex-1 bg-transparent py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-600"
        />
      </div>

      {message && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm font-semibold text-amber-100">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <div className="space-y-3">
        {isLoading && rows.length === 0 ? (
          <EmptyHistory />
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 bg-black/20 p-6 text-center">
            <p className="text-sm font-black text-white">No shorts history found</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Generated shorts will appear here after upload.</p>
          </div>
        ) : (
          rows.map(({ video, attempts, currentJob }) => {
            const lastReplayStage = latestReplayStage(video, currentJob);
            const stage = stageByVideoId[video.videoId] || lastReplayStage || replayStages[0];
            const status = String(currentJob?.status || video.status || "UNKNOWN").toUpperCase();
            const isPaused = status === "PAUSED" || String(video.status || "").toUpperCase() === "PAUSED";
            const canRestart = terminalStatuses.has(status);
            const busy = busyVideoId === video.videoId || restartState.isLoading || resumeState.isLoading;
            return (
              <article key={video.videoId} className="rounded-lg border border-white/10 bg-black/25 p-4">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill status={status} />
                      <span className="rounded bg-white/[0.06] px-2 py-1 text-[10px] font-black uppercase text-slate-300">
                        {video.platform || "platform"}
                      </span>
                      <span className="rounded bg-white/[0.06] px-2 py-1 text-[10px] font-black uppercase text-slate-300">
                        {attempts.length || 1} attempts
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-black text-white">{video.title || "Untitled short source"}</h2>
                      <p className="mt-1 truncate text-xs font-semibold text-slate-500">{video.videoId}</p>
                    </div>
                    <div className="grid gap-2 text-xs font-semibold text-slate-400 sm:grid-cols-3">
                      <Metric icon={Clock3} label="Updated" value={formatDate(video.updatedAt || video.createdAt)} />
                      <Metric icon={Activity} label="Stage" value={latestStage(video, currentJob)} />
                      <Metric icon={PlayCircle} label="Job" value={currentJob?.jobId ? currentJob.jobId.slice(0, 8) : "none"} />
                    </div>
                    {currentJob?.message && <p className="line-clamp-2 text-sm font-semibold text-slate-300">{currentJob.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => openRun(video, currentJob?.jobId)}
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-black text-white hover:bg-white/[0.08]"
                    >
                      <Eye size={16} />
                      Open
                    </button>
                    {isPaused && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => resumeRun(video)}
                        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 text-sm font-black text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {busy ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />}
                        Resume
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={!canRestart || busy}
                      onClick={() => restartRun(video)}
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-3 text-sm font-black text-white hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {busy ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                      Restart
                    </button>
                    <button
                      type="button"
                      disabled={!canRestart || busy || !lastReplayStage}
                      onClick={() => restartRun(video, lastReplayStage)}
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 text-sm font-black text-cyan-100 hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {busy ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />}
                      Replay last
                    </button>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                      <select
                        value={stage}
                        onChange={(event) => setStageByVideoId((current) => ({ ...current, [video.videoId]: event.target.value }))}
                        className="h-10 min-w-0 rounded-lg border border-white/10 bg-[#080b12] px-2 text-xs font-black uppercase text-white outline-none"
                      >
                        {replayStages.map((item) => (
                          <option key={item} value={item}>{labelForStage(item)}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={!canRestart || busy}
                        onClick={() => restartRun(video, stage)}
                        className="flex h-10 items-center justify-center gap-2 rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 text-xs font-black text-cyan-100 hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <PlayCircle size={15} />
                        Replay
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

function StatusPill({ status }) {
  const isFailure = ["FAILED", "ERROR", "CANCELLED"].includes(status);
  const isSuccess = ["COMPLETED", "SUCCEEDED", "SUCCESS"].includes(status);
  const Icon = isFailure ? AlertTriangle : isSuccess ? CheckCircle2 : Loader2;
  const tone = isFailure
    ? "border-rose-400/30 bg-rose-400/10 text-rose-100"
    : isSuccess
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
      : "border-cyan-300/30 bg-cyan-300/10 text-cyan-100";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-[10px] font-black uppercase ${tone}`}>
      <Icon size={13} className={!terminalStatuses.has(status) ? "animate-spin" : ""} />
      {status}
    </span>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="min-w-0 rounded border border-white/10 bg-white/[0.03] px-2 py-2">
      <div className="flex items-center gap-1.5 text-slate-500">
        <Icon size={13} />
        <span className="text-[10px] font-black uppercase">{label}</span>
      </div>
      <p className="mt-1 truncate text-xs font-black text-slate-200">{value || "none"}</p>
    </div>
  );
}

function EmptyHistory() {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-6 text-center">
      <Loader2 className="mx-auto animate-spin text-slate-500" size={22} />
      <p className="mt-3 text-sm font-black text-white">Loading shorts history</p>
    </div>
  );
}

function latestStage(video, job) {
  const outputTrace = arrayValue(job?.outputPayload?.trace);
  const videoTrace = arrayValue(video?.trace);
  const trace = outputTrace.length ? outputTrace : videoTrace;
  const stage = trace[trace.length - 1]?.stage || job?.outputPayload?.activeStage || video?.metadata?.restartState?.replayStage || "";
  return labelForStage(stage || "Queued");
}

function latestReplayStage(video, job) {
  const outputTrace = arrayValue(job?.outputPayload?.trace);
  const videoTrace = arrayValue(video?.trace);
  const trace = outputTrace.length ? outputTrace : videoTrace;
  const activeStage = normalizeStage(job?.outputPayload?.activeStage);
  if (replayStages.includes(activeStage)) return activeStage;
  for (const row of [...trace].reverse()) {
    const stage = normalizeStage(row?.stage);
    if (replayStages.includes(stage)) return stage;
  }
  const restartedStage = normalizeStage(video?.metadata?.restartState?.replayStage);
  return replayStages.includes(restartedStage) ? restartedStage : "";
}

function labelForStage(stage) {
  return String(stage || "")
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeStage(stage) {
  return String(stage || "").trim().toUpperCase().replace(/[-\s]+/g, "_");
}

function formatDate(value) {
  if (!value) return "unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function arrayValue(value) {
  return Array.isArray(value) ? value : [];
}

function errorMessage(error) {
  return error?.data?.message || error?.data?.error || error?.error || "Could not restart this short job.";
}
