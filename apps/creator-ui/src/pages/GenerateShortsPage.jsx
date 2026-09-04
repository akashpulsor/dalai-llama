// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Captions,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  Clock3,
  Code2,
  Database,
  Download,
  Eye,
  FileVideo,
  GitBranch,
  Layers3,
  Loader2,
  Lock,
  PanelRight,
  Pause,
  Pin,
  Play,
  RefreshCw,
  Save,
  Scissors,
  Search,
  ShieldCheck,
  UploadCloud,
  XCircle,
  Zap,
} from "lucide-react";
import GenerationStatusBar from "../components/jobs/GenerationStatusBar.jsx";
import {
  useCompleteShortMultipartUploadMutation,
  useCompleteTimelineIngestionMutation,
  useCreateShortMultipartUploadMutation,
  useCreateTimelineIngestionMutation,
  useGenerateShortsMutation,
  useGetJobQuery,
  useGetShortVideoQuery,
  useGetTimelineIngestionQuery,
  usePauseShortGenerationMutation,
  usePresignShortMultipartUploadPartMutation,
  useResumeShortGenerationMutation,
  useReviewShortCandidateMutation,
  useRequestTimelineFabricMutation,
  useRequestTimelineStoryShotsMutation,
  useRequestTimelineTranscriptMutation,
  useRequestTimelineVideoAnalysisMutation,
  useRunShortVisualAnalysisMutation,
  useSaveShortProcessingTimelineMutation,
  useUploadTimelineIngestionPartMutation,
} from "../api/creatorEndpoints.js";

const DIRECT_UPLOAD_THRESHOLD_BYTES = 64 * 1024 * 1024;
const DIRECT_UPLOAD_PART_SIZE_BYTES = 64 * 1024 * 1024;
const MAX_DIRECT_UPLOAD_BYTES = 10 * 1024 * 1024 * 1024;
const FABRIC_CDN_URL = "https://cdn.jsdelivr.net/npm/fabric@5.3.0/dist/fabric.min.js";
let fabricLibraryPromise = null;

const targetDurations = [30, 60, 90];
const requestedShortOptions = [10, 20, 50];
const platforms = [
  { value: "youtube_shorts", label: "YouTube Shorts", ratio: "9:16" },
  { value: "tiktok", label: "TikTok", ratio: "9:16" },
  { value: "instagram_reels", label: "Instagram Reels", ratio: "9:16" },
  { value: "linkedin", label: "LinkedIn", ratio: "4:5" },
  { value: "x", label: "X", ratio: "1:1" },
  { value: "facebook_reels", label: "Facebook Reels", ratio: "9:16" },
];

const transitionPresets = [
  { id: "CUT", label: "Cut", transition: { type: "CUT", durationSeconds: 0.08, easing: "linear" }, tags: ["clean", "fast"] },
  { id: "SWIPE_TRANSITION", label: "Swipe", transition: { type: "SWIPE_TRANSITION", durationSeconds: 0.28, direction: "left", easing: "easeOut" }, tags: ["news", "pace"] },
  { id: "WHITE_FLASH", label: "Flash", transition: { type: "WHITE_FLASH", durationSeconds: 0.18, easing: "easeOut" }, tags: ["reveal", "impact"] },
  { id: "BLUR_TRANSITION", label: "Blur", transition: { type: "BLUR_TRANSITION", durationSeconds: 0.32, easing: "easeInOut" }, tags: ["soft", "documentary"] },
  { id: "GLITCH_TRANSITION", label: "Glitch", transition: { type: "GLITCH_TRANSITION", durationSeconds: 0.22, intensity: 0.62 }, tags: ["viral", "shock"] },
];

const clipEffectPresets = [
  { id: "PUNCH_ZOOM", label: "Punch", effect: { type: "PUNCH_ZOOM", intensity: 0.72, durationSeconds: 0.45 }, tags: ["hook", "claim"] },
  { id: "HIGHLIGHT_PULSE", label: "Pulse", effect: { type: "HIGHLIGHT_PULSE", intensity: 0.56, durationSeconds: 0.65 }, tags: ["evidence", "proof"] },
  { id: "QUOTE_POP", label: "Quote", effect: { type: "QUOTE_POP", intensity: 0.7, durationSeconds: 0.4 }, tags: ["caption", "speech"] },
  { id: "FREEZE_FRAME", label: "Freeze", effect: { type: "FREEZE_FRAME", durationSeconds: 0.35 }, tags: ["reaction", "proof"] },
  { id: "SPEED_RAMP", label: "Ramp", effect: { type: "SPEED_RAMP", speedFrom: 1, speedTo: 1.22, durationSeconds: 0.6 }, tags: ["energy", "pace"] },
  { id: "CAMERA_SHAKE", label: "Shake", effect: { type: "CAMERA_SHAKE", intensity: 0.22, durationSeconds: 0.3 }, tags: ["shock", "viral"] },
];

const ambientLightingPresets = [
  { id: "NONE", label: "None", lighting: { type: "NONE", opacity: 0 } },
  { id: "NEWS_COOL", label: "News", lighting: { type: "NEWS_COOL", color: "#38bdf8", secondaryColor: "#ffffff", opacity: 0.16, vignette: 0.24 } },
  { id: "DOCUMENTARY_WARM", label: "Doc", lighting: { type: "DOCUMENTARY_WARM", color: "#f59e0b", secondaryColor: "#fef3c7", opacity: 0.14, vignette: 0.3 } },
  { id: "VIRAL_NEON", label: "Neon", lighting: { type: "VIRAL_NEON", color: "#22d3ee", secondaryColor: "#f43f5e", opacity: 0.2, vignette: 0.18 } },
  { id: "EVIDENCE_SPOT", label: "Spot", lighting: { type: "EVIDENCE_SPOT", color: "#f8fafc", secondaryColor: "#94a3b8", opacity: 0.18, vignette: 0.42 } },
  { id: "PODCAST_SOFT", label: "Soft", lighting: { type: "PODCAST_SOFT", color: "#a7f3d0", secondaryColor: "#bae6fd", opacity: 0.13, vignette: 0.22 } },
];

const workspaceViews = [
  { id: "candidates", label: "Candidates", icon: Scissors },
  { id: "inspect", label: "Inspect", icon: Database },
  { id: "transcript", label: "Transcript", icon: FileVideo },
  { id: "graph", label: "Graph", icon: GitBranch },
  { id: "trace", label: "Trace", icon: PanelRight },
];

const pipelineStages = [
  { stage: "INGESTION", label: "Ingestion", maturity: "real" },
  { stage: "TRANSCRIPT", label: "Transcript", maturity: "real" },
  { stage: "TRANSCRIPT_CRITIC", label: "Transcript Critic", maturity: "real" },
  { stage: "VIDEO_TYPE_CLASSIFICATION", label: "Video Type", maturity: "real" },
  { stage: "VIDEO_TYPE_CRITIC", label: "Type Critic", maturity: "real" },
  { stage: "CONVERSATION_STRUCTURE", label: "Conversation", maturity: "real" },
  { stage: "SCENE_ANALYSIS", label: "Scene Analysis", maturity: "real" },
  { stage: "SCENE_CRITIC", label: "Scene Critic", maturity: "real" },
  { stage: "VIDEO_GRAPH_BUILDER", label: "Graph Builder", maturity: "real" },
  { stage: "STORY_UNDERSTANDING", label: "Story", maturity: "ai" },
  { stage: "STORY_CRITIC", label: "Story Critic", maturity: "real" },
  { stage: "INTERESTINGNESS", label: "Interest", maturity: "real" },
  { stage: "INTERESTINGNESS_CRITIC", label: "Interest Critic", maturity: "real" },
  { stage: "STORY_BEAT_PLANNING", label: "Story Beats", maturity: "real" },
  { stage: "VISUAL_STORY_COMPOSITION", label: "Visual Composition", maturity: "real" },
  { stage: "COMPRESSION", label: "Compression", maturity: "real" },
  { stage: "COMPRESSION_CRITIC", label: "Compression Critic", maturity: "real" },
  { stage: "HOOK_GENERATION", label: "Hook", maturity: "real" },
  { stage: "HOOK_CRITIC", label: "Hook Critic", maturity: "real" },
  { stage: "CAPTION_PLANNING", label: "Captions", maturity: "real" },
  { stage: "CAPTION_CRITIC", label: "Caption Critic", maturity: "real" },
  { stage: "VISUAL_ENHANCEMENT", label: "Visual Enhancement", maturity: "real" },
  { stage: "VISUAL_CRITIC", label: "Visual Critic", maturity: "real" },
  { stage: "CONTINUITY_CRITIC", label: "Continuity", maturity: "real" },
  { stage: "CANDIDATE_RANKING", label: "Ranking", maturity: "real" },
  { stage: "GLOBAL_CRITIC", label: "Global Critic", maturity: "real" },
  { stage: "TARGETED_REPAIR", label: "Repair", maturity: "real" },
  { stage: "RENDERING", label: "Rendering", maturity: "real" },
  { stage: "POST_RENDER_QA", label: "Render QA", maturity: "real" },
  { stage: "COMPLETED", label: "Completed", maturity: "real" },
];

const manualCheckpointStages = [
  "INGESTION",
  "VIDEO_TYPE_CLASSIFICATION",
  "TRANSCRIPT",
  "TRANSCRIPT_CRITIC",
  "VIDEO_TYPE_CRITIC",
  "SCENE_ANALYSIS",
  "SCENE_REPAIR",
  "SCENE_CRITIC",
  "VIDEO_GRAPH_BUILDER",
  "STORY_CRITIC",
  "INTERESTINGNESS",
  "INTERESTINGNESS_CRITIC",
  "STORY_UNDERSTANDING",
  "STORY_BEAT_PLANNING",
  "VISUAL_STORY_COMPOSITION",
  "COMPRESSION",
  "HOOK_GENERATION",
  "TARGETED_REPAIR",
  "VISUAL_ENHANCEMENT",
  "VISUAL_CRITIC",
  "CONTINUITY_CRITIC",
  "CANDIDATE_RANKING",
  "GLOBAL_CRITIC",
  "RENDERING",
  "POST_RENDER_QA",
];

const graphViews = ["Conversation Graph", "Story Graph", "Scene Graph", "Compression Graph"];
const terminalJobStatuses = new Set(["COMPLETED", "FAILED", "ERROR", "CANCELLED", "SUCCEEDED", "SUCCESS"]);

function liveJobIdFromVideo(video, terminalJobIds = new Set()) {
  const jobId = video?.generationJobId || null;
  const status = String(video?.status || "").toUpperCase();
  if (!jobId || terminalJobIds.has(jobId) || terminalJobStatuses.has(status)) return null;
  return jobId;
}

export default function GenerateShortsPage() {
  const location = useLocation();
  const inputRef = useRef(null);
  const openedFromHistoryRef = useRef(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [targetDuration, setTargetDuration] = useState(60);
  const [platform, setPlatform] = useState("youtube_shorts");
  const [requestedShorts, setRequestedShorts] = useState(20);
  const [reviewMode, setReviewMode] = useState("REVIEW");
  const [manualStepModeEnabled, setManualStepModeEnabled] = useState(false);
  const [activeView, setActiveView] = useState("candidates");
  const [graphView, setGraphView] = useState(graphViews[0]);
  const [search, setSearch] = useState("");
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [activeJobId, setActiveJobId] = useState(null);
  const [timelineIngestionVideoId, setTimelineIngestionVideoId] = useState(null);
  const [queuedTimelineIngestion, setQueuedTimelineIngestion] = useState(null);
  const [terminalJobIds, setTerminalJobIds] = useState(() => new Set());
  const [queuedVideo, setQueuedVideo] = useState(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [graphEditorNode, setGraphEditorNode] = useState(null);
  const [graphEditorDraft, setGraphEditorDraft] = useState(() => emptyGraphNodeDraft());
  const [lockedSegments, setLockedSegments] = useState(new Set());
  const [timelineDraft, setTimelineDraft] = useState([]);
  const [timelineDirty, setTimelineDirty] = useState(false);
  const [candidateEditDraft, setCandidateEditDraft] = useState(() => emptyCandidateEditDraft());
  const [stageAuditCollapsed, setStageAuditCollapsed] = useState(true);
  const [showAdvancedWorkspace, setShowAdvancedWorkspace] = useState(true);
  const [stageOutputCopied, setStageOutputCopied] = useState(false);
  const [directUploadProgress, setDirectUploadProgress] = useState(null);
  const [visualAnalysisJobId, setVisualAnalysisJobId] = useState(null);
  const linkedRun = useMemo(() => {
    const params = new URLSearchParams(location.search || "");
    return {
      videoId: params.get("videoId") || "",
      jobId: params.get("jobId") || "",
    };
  }, [location.search]);

  const [generateShorts, generateState] = useGenerateShortsMutation();
  const [createShortMultipartUpload, createMultipartState] = useCreateShortMultipartUploadMutation();
  const [presignShortMultipartUploadPart, presignMultipartState] = usePresignShortMultipartUploadPartMutation();
  const [completeShortMultipartUpload, completeMultipartState] = useCompleteShortMultipartUploadMutation();
  const [createTimelineIngestion, createTimelineIngestionState] = useCreateTimelineIngestionMutation();
  const [uploadTimelineIngestionPart, uploadTimelinePartState] = useUploadTimelineIngestionPartMutation();
  const [completeTimelineIngestion, completeTimelineIngestionState] = useCompleteTimelineIngestionMutation();
  const [requestTimelineFabric, requestTimelineFabricState] = useRequestTimelineFabricMutation();
  const [requestTimelineTranscript, requestTimelineTranscriptState] = useRequestTimelineTranscriptMutation();
  const [requestTimelineVideoAnalysis, requestTimelineVideoAnalysisState] = useRequestTimelineVideoAnalysisMutation();
  const [requestTimelineStoryShots, requestTimelineStoryShotsState] = useRequestTimelineStoryShotsMutation();
  const [reviewShortCandidate, reviewState] = useReviewShortCandidateMutation();
  const [pauseShortGeneration, pauseState] = usePauseShortGenerationMutation();
  const [saveShortProcessingTimeline, saveTimelineState] = useSaveShortProcessingTimelineMutation();
  const [resumeShortGeneration, resumeState] = useResumeShortGenerationMutation();
  const [runShortVisualAnalysis, visualAnalysisRunState] = useRunShortVisualAnalysisMutation();
  const hasLiveActiveJob = Boolean(activeJobId && !terminalJobIds.has(activeJobId));
  const {
    data: fetchedVideo,
    refetch: refetchShortVideo,
    isFetching: isVideoFetching,
  } = useGetShortVideoQuery(activeVideoId, {
    skip: !activeVideoId,
    pollingInterval: hasLiveActiveJob || visualAnalysisJobId ? 2400 : 0,
    refetchOnMountOrArgChange: true,
  });
  const {
    data: fetchedTimelineIngestion,
    refetch: refetchTimelineIngestion,
    isFetching: isTimelineIngestionFetching,
  } = useGetTimelineIngestionQuery(timelineIngestionVideoId, {
    skip: !timelineIngestionVideoId,
    pollingInterval: timelineIngestionVideoId ? 1600 : 0,
    refetchOnMountOrArgChange: true,
  });

  const currentVideo = fetchedVideo || queuedVideo || null;
  const currentTimelineIngestion = fetchedTimelineIngestion || queuedTimelineIngestion || null;
  const jobId = hasLiveActiveJob ? activeJobId : null;
  const { data: job } = useGetJobQuery(jobId, {
    skip: !jobId,
    pollingInterval: jobId ? 1600 : 0,
  });
  const { data: visualAnalysisJob } = useGetJobQuery(visualAnalysisJobId, {
    skip: !visualAnalysisJobId,
    pollingInterval: visualAnalysisJobId ? 1800 : 0,
  });

  const livePayload = jobPayload(job);
  const jobStatus = String(job?.status || currentVideo?.status || "IDLE").toUpperCase();
  const isJobTerminal = terminalJobStatuses.has(jobStatus);
  const isPaused = jobStatus === "PAUSED" || String(currentVideo?.status || "").toUpperCase() === "PAUSED";
  const pauseRequested = Boolean(livePayload.pauseRequested);
  const traceRows = useMemo(() => traceFrom(currentVideo, job), [currentVideo, job]);
  const candidates = useMemo(() => arrayValue(currentVideo?.candidates), [currentVideo]);
  const transcript = useMemo(() => transcriptFrom(currentVideo, job), [currentVideo, job]);
  const workingTranscript = isPaused ? timelineDraft : transcript;
  const graph = useMemo(() => graphFrom(currentVideo, job), [currentVideo, job]);
  const transcriptGraph = useMemo(() => transcriptGraphFrom(currentVideo, job, transcript), [currentVideo, job, transcript]);
  const workingTranscriptGraph = useMemo(
    () => (isPaused ? buildTranscriptGraph(workingTranscript, "human_processing_timeline_draft") : transcriptGraph),
    [isPaused, transcriptGraph, workingTranscript]
  );
  const sceneTimeline = useMemo(() => sceneTimelineFrom(currentVideo, job, workingTranscript), [currentVideo, job, workingTranscript]);
  const selectedPlatform = platforms.find((item) => item.value === platform) || platforms[0];
  const selectedCandidate = candidates.find((candidate) => idOf(candidate) === selectedCandidateId) || candidates[0] || null;
  const rerenderJobId = useMemo(() => rerenderJobIdFor(selectedCandidate, currentVideo), [selectedCandidate, currentVideo]);
  const { data: rerenderJob } = useGetJobQuery(rerenderJobId, {
    skip: !rerenderJobId,
    pollingInterval: hasLiveActiveJob && activeJobId === rerenderJobId ? 1600 : 0,
  });
  const frameLookup = useMemo(() => buildFrameLookup(currentVideo, job), [currentVideo, job]);
  const sourcePreviewUrl = sourceVideoUrlFor(currentVideo);
  const timelineIngestionProgress = timelineProgress(currentTimelineIngestion, directUploadProgress);
  const progress = Math.max(0, Math.min(100, Number(job?.progress ?? (currentVideo ? (isJobTerminal ? 100 : 10) : 0))));
  const latestStage = latestStageLabel(traceRows, job);
  const apiError = errorMessage(
    generateState.error ||
    createMultipartState.error ||
    presignMultipartState.error ||
    completeMultipartState.error ||
    createTimelineIngestionState.error ||
    uploadTimelinePartState.error ||
    completeTimelineIngestionState.error ||
    requestTimelineFabricState.error ||
    requestTimelineTranscriptState.error ||
    requestTimelineVideoAnalysisState.error ||
    requestTimelineStoryShotsState.error ||
    reviewState.error ||
    pauseState.error ||
    saveTimelineState.error ||
    resumeState.error ||
    visualAnalysisRunState.error ||
    (directUploadProgress?.status === "ERROR" ? directUploadProgress.message : null)
  );
  const manualStage = manualCurrentStage(currentVideo, job, traceRows);
  const manualNextStage = manualNextStageFor(currentVideo, job, manualStage);
  const isManualStepRun = manualRunEnabled(currentVideo, job);
  const isDirectUploading = Boolean(directUploadProgress && directUploadProgress.status !== "ERROR");
  const isTimelineUploading = createTimelineIngestionState.isLoading || uploadTimelinePartState.isLoading || completeTimelineIngestionState.isLoading || requestTimelineFabricState.isLoading;
  const isStartingUpload = generateState.isLoading || createMultipartState.isLoading || presignMultipartState.isLoading || completeMultipartState.isLoading || isTimelineUploading || isDirectUploading;
  const isExecutingStage = Boolean((job && !isJobTerminal && !isPaused) || isStartingUpload || resumeState.isLoading);
  const manualStageOutput = useMemo(
    () => stageOutputFor(manualStage, currentVideo, job, workingTranscript, graph, sceneTimeline, candidates),
    [candidates, currentVideo, graph, job, manualStage, sceneTimeline, workingTranscript]
  );
  const manualStageJson = useMemo(() => JSON.stringify(manualStageOutput, null, 2), [manualStageOutput]);

  const filteredTranscript = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return workingTranscript;
    return workingTranscript.filter((node) =>
      [node?.id, node?.start, node?.end, node?.speaker, node?.transcript, node?.text]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [search, workingTranscript]);

  useEffect(() => {
    if (!linkedRun.videoId) {
      if (openedFromHistoryRef.current) {
        openedFromHistoryRef.current = false;
        setQueuedVideo(null);
        setActiveVideoId(null);
        setActiveJobId(null);
        setVisualAnalysisJobId(null);
        setSelectedCandidateId(null);
      }
      return;
    }
    openedFromHistoryRef.current = true;
    if (linkedRun.videoId === activeVideoId && (!linkedRun.jobId || linkedRun.jobId === activeJobId)) return;
    setQueuedVideo(null);
    setActiveVideoId(linkedRun.videoId);
    setActiveJobId(linkedRun.jobId && !terminalJobIds.has(linkedRun.jobId) ? linkedRun.jobId : null);
    setVisualAnalysisJobId(null);
    setSelectedCandidateId(null);
  }, [activeJobId, activeVideoId, linkedRun.jobId, linkedRun.videoId, terminalJobIds]);

  useEffect(() => {
    if (!linkedRun.videoId || currentVideo?.videoId !== linkedRun.videoId) return;
    const nextJobId = liveJobIdFromVideo(currentVideo, terminalJobIds);
    if (nextJobId && nextJobId !== activeJobId) {
      setActiveJobId(nextJobId);
    }
  }, [activeJobId, currentVideo?.generationJobId, currentVideo?.status, currentVideo?.videoId, linkedRun.videoId, terminalJobIds]);

  useEffect(() => {
    if (!currentVideo?.videoId) return;
    const visualState = firstObject(currentVideo?.metadata?.visualAnalysis);
    const visualStatus = String(visualState.status || "").toUpperCase();
    if (terminalJobStatuses.has(visualStatus)) return;
    const nextJobId = visualAnalysisJobIdFrom(currentVideo);
    if (nextJobId && nextJobId !== visualAnalysisJobId) {
      setVisualAnalysisJobId(nextJobId);
    }
  }, [currentVideo?.metadata, currentVideo?.videoId, visualAnalysisJobId]);

  useEffect(() => {
    const status = String(visualAnalysisJob?.status || "").toUpperCase();
    if (!visualAnalysisJobId || !terminalJobStatuses.has(status)) return;
    void refetchShortVideo?.();
    setVisualAnalysisJobId(null);
  }, [refetchShortVideo, visualAnalysisJob?.status, visualAnalysisJobId]);

  useEffect(() => {
    if (candidates.length > 0 && !candidates.some((candidate) => idOf(candidate) === selectedCandidateId)) {
      setSelectedCandidateId(idOf(candidates[0]));
    }
  }, [candidates, selectedCandidateId]);

  useEffect(() => {
    const candidateId = idOf(selectedCandidate);
    if (!candidateId) {
      setCandidateEditDraft(emptyCandidateEditDraft());
      return;
    }
    setCandidateEditDraft((current) => {
      if (current.candidateId === candidateId && current.dirty) return current;
      return candidateEditDraftFrom(selectedCandidate);
    });
  }, [selectedCandidate]);

  useEffect(() => {
    if (isJobTerminal && activeVideoId) {
      const observedJobId = job?.jobId || job?.id || jobId || currentVideo?.generationJobId;
      if (observedJobId) {
        setTerminalJobIds((current) => {
          if (current.has(observedJobId)) return current;
          const next = new Set(current);
          next.add(observedJobId);
          return next;
        });
      }
      void refetchShortVideo?.();
      setActiveJobId(null);
    }
  }, [activeVideoId, currentVideo?.generationJobId, isJobTerminal, job?.id, job?.jobId, jobId, refetchShortVideo]);

  useEffect(() => {
    if (isPaused) {
      if (!timelineDirty || timelineDraft.length === 0) {
        setTimelineDraft(normalizeTranscriptNodes(transcript));
      }
      return;
    }
    setTimelineDraft(normalizeTranscriptNodes(transcript));
    setTimelineDirty(false);
  }, [isPaused, timelineDirty, timelineDraft.length, transcript]);

  const startGeneration = async () => {
    if (!selectedFile) {
      inputRef.current?.click();
      return;
    }
    if (selectedFile.size > MAX_DIRECT_UPLOAD_BYTES) {
      setDirectUploadProgress({
        status: "ERROR",
        percent: 0,
        uploadedBytes: 0,
        totalBytes: selectedFile.size,
        message: "Choose a video up to 10 GB.",
      });
      return;
    }
    try {
      setQueuedVideo(null);
      setActiveVideoId(null);
      setActiveJobId(null);
      setVisualAnalysisJobId(null);
      setSelectedCandidateId(null);
      setDirectUploadProgress({
        status: "STARTING",
        percent: 2,
        uploadedBytes: 0,
        totalBytes: selectedFile.size,
        message: "Creating timeline ingestion",
      });
      const session = await createTimelineIngestion({
        title: title || stripExtension(selectedFile.name),
        originalFilename: selectedFile.name,
        contentType: selectedFile.type || "application/octet-stream",
        sizeBytes: selectedFile.size,
        expectedParts: 1,
        partDurationSeconds: 600,
        sceneWindowSeconds: Math.max(10, Math.min(60, targetDuration)),
        thumbnailIntervalSeconds: 5,
        platform,
      }).unwrap();
      if (!session?.videoId) return;
      setQueuedTimelineIngestion(session);
      setTimelineIngestionVideoId(session.videoId);
      setDirectUploadProgress({
        status: "UPLOADING",
        percent: 35,
        uploadedBytes: 0,
        totalBytes: selectedFile.size,
        partNumber: 1,
        totalParts: 1,
        message: "Uploading playable timeline part 1/1",
      });
      const uploaded = await uploadTimelineIngestionPart({
        videoId: session.videoId,
        partNumber: 1,
        part: selectedFile,
        partStartSeconds: 0,
        finalPart: true,
      }).unwrap();
      setQueuedTimelineIngestion(uploaded);
      setDirectUploadProgress({
        status: "PROCESSING",
        percent: 65,
        uploadedBytes: selectedFile.size,
        totalBytes: selectedFile.size,
        partNumber: 1,
        totalParts: 1,
        message: "Upload stored. Starting Fabric timeline stage",
      });
      const fabricQueued = await requestTimelineFabric({
        videoId: session.videoId,
        reason: "upload_complete_render_browser_timeline",
      }).unwrap();
      setQueuedTimelineIngestion(fabricQueued);
      setDirectUploadProgress({
        status: "PROCESSING",
        percent: 75,
        uploadedBytes: selectedFile.size,
        totalBytes: selectedFile.size,
        partNumber: 1,
        totalParts: 1,
        message: "Fabric timeline is rendering",
      });
      void refetchTimelineIngestion?.();
      setDirectUploadProgress(null);
    } catch (error) {
      setDirectUploadProgress({
        status: "ERROR",
        percent: 0,
        uploadedBytes: 0,
        totalBytes: selectedFile.size,
        message: errorMessage(error) || "Timeline ingestion failed.",
      });
    }
  };

  const requestTimelineStage = async (stage) => {
    const videoId = currentTimelineIngestion?.videoId || timelineIngestionVideoId;
    if (!videoId) return;
    const stageLabel = stage === "transcript" ? "transcript timeline" : stage === "analysis" ? "video analysis" : stage === "stories" ? "stories and shots" : "Fabric timeline";
    try {
      setDirectUploadProgress({
        status: "PROCESSING",
        percent: stage === "fabric" ? 70 : stage === "transcript" ? 82 : 92,
        uploadedBytes: selectedFile?.size || 0,
        totalBytes: selectedFile?.size || 0,
        message: `Starting ${stageLabel}`,
      });
      const mutation = stage === "transcript"
        ? requestTimelineTranscript
        : stage === "analysis"
          ? requestTimelineVideoAnalysis
          : stage === "stories"
            ? requestTimelineStoryShots
            : requestTimelineFabric;
      const result = await mutation({
        videoId,
        reason: `user_requested_${stageLabel.replace(/\s+/g, "_")}`,
      }).unwrap();
      setQueuedTimelineIngestion(result);
      void refetchTimelineIngestion?.();
      setDirectUploadProgress(null);
    } catch (error) {
      setDirectUploadProgress({
        status: "ERROR",
        percent: 0,
        uploadedBytes: selectedFile?.size || 0,
        totalBytes: selectedFile?.size || 0,
        message: errorMessage(error) || `Could not start ${stageLabel}.`,
      });
    }
  };

  const uploadLargeSourceVideo = async (file, requestFields) => {
    try {
      setDirectUploadProgress({
        status: "STARTING",
        percent: 0,
        uploadedBytes: 0,
        totalBytes: file.size,
        message: "Creating direct upload session",
      });
      const session = await createShortMultipartUpload({
        originalFilename: file.name,
        contentType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        chunkSizeBytes: DIRECT_UPLOAD_PART_SIZE_BYTES,
      }).unwrap();
      const uploadId = session.uploadId;
      const totalParts = Number(session.totalParts || Math.ceil(file.size / DIRECT_UPLOAD_PART_SIZE_BYTES));
      const partSizeBytes = Number(session.partSizeBytes || DIRECT_UPLOAD_PART_SIZE_BYTES);
      for (let partNumber = 1; partNumber <= totalParts; partNumber += 1) {
        const startByte = (partNumber - 1) * partSizeBytes;
        const endByte = Math.min(file.size, startByte + partSizeBytes);
        setDirectUploadProgress({
          status: "UPLOADING",
          percent: Math.round((startByte / Math.max(1, file.size)) * 100),
          uploadedBytes: startByte,
          totalBytes: file.size,
          partNumber,
          totalParts,
          message: `Uploading part ${partNumber}/${totalParts}`,
        });
        const signedPart = await presignShortMultipartUploadPart({
          uploadId,
          partNumber,
          videoId: session.videoId,
          storageUploadId: session.storageUploadId,
          originalFilename: file.name,
          contentType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          totalParts,
          partSizeBytes,
        }).unwrap();
        const uploadResponse = await fetch(signedPart.uploadUrl, {
          method: signedPart.method || "PUT",
          body: file.slice(startByte, endByte),
        });
        if (!uploadResponse.ok) {
          throw new Error(`Direct upload failed on part ${partNumber}/${totalParts}. Storage returned ${uploadResponse.status}.`);
        }
        setDirectUploadProgress({
          status: "UPLOADING",
          percent: Math.round((endByte / Math.max(1, file.size)) * 100),
          uploadedBytes: endByte,
          totalBytes: file.size,
          partNumber,
          totalParts,
          message: `Uploaded part ${partNumber}/${totalParts}`,
        });
      }
      setDirectUploadProgress({
        status: "FINALIZING",
        percent: 100,
        uploadedBytes: file.size,
        totalBytes: file.size,
        partNumber: totalParts,
        totalParts,
        message: "Finalizing upload and queueing ingestion",
      });
      const response = await completeShortMultipartUpload({
        uploadId,
        videoId: session.videoId,
        storageUploadId: session.storageUploadId,
        originalFilename: file.name,
        contentType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        totalParts,
        partSizeBytes,
        ...requestFields,
      }).unwrap();
      setDirectUploadProgress(null);
      return response;
    } catch (error) {
      setDirectUploadProgress({
        status: "ERROR",
        percent: 0,
        uploadedBytes: 0,
        totalBytes: file.size,
        message: errorMessage(error) || "Direct upload failed.",
      });
      throw error;
    }
  };

  const reviewCandidate = async (action) => {
    if (!currentVideo?.videoId || !selectedCandidate) return;
    await reviewShortCandidate({
      videoId: currentVideo.videoId,
      candidateId: idOf(selectedCandidate),
      action,
      payload: {},
    }).unwrap();
    await refetchShortVideo?.();
  };

  const removeCandidateSegment = (segmentId) => {
    setCandidateEditDraft((current) => {
      const target = arrayValue(current.segments).find((segment) => segment.segmentId === segmentId);
      const nextSegments = normalizeDraftSegments(arrayValue(current.segments).filter((segment) => segment.segmentId !== segmentId));
      if (!target || !nextSegments.length) return current;
      const nextCaptions = arrayValue(current.captions).filter((caption) => !captionOverlapsSegment(caption, target));
      return {
        ...current,
        segments: nextSegments,
        captions: nextCaptions,
        dirty: true,
        timelineDirty: true,
        captionsDirty: nextCaptions.length !== arrayValue(current.captions).length || current.captionsDirty,
        removedSegmentIds: uniqueStrings([...arrayValue(current.removedSegmentIds), segmentId]),
        removedCaptionIds: uniqueStrings([
          ...arrayValue(current.removedCaptionIds),
          ...arrayValue(current.captions)
            .filter((caption) => captionOverlapsSegment(caption, target))
            .map((caption) => caption.id || caption.captionId)
            .filter(Boolean),
        ]),
      };
    });
  };

  const removeCandidateCaption = (captionId) => {
    setCandidateEditDraft((current) => ({
      ...current,
      captions: arrayValue(current.captions).filter((caption) => (caption.id || caption.captionId) !== captionId),
      dirty: true,
      captionsDirty: true,
      removedCaptionIds: uniqueStrings([...arrayValue(current.removedCaptionIds), captionId]),
    }));
  };

  const resetCandidateDraft = () => {
    setCandidateEditDraft(candidateEditDraftFrom(selectedCandidate));
  };

  const addCandidateRetentionEffect = (type = "PUNCH_ZOOM") => {
    setCandidateEditDraft((current) => {
      const candidateId = idOf(selectedCandidate);
      const draft = current?.candidateId === candidateId ? current : candidateEditDraftFrom(selectedCandidate);
      const segments = arrayValue(draft.segments);
      const duration = Math.max(1, totalDraftDuration(segments) || numberValue(selectedCandidate?.durationSeconds, targetDuration));
      const existing = arrayValue(draft.retentionPlan);
      const start = roundSeconds(Math.min(Math.max(0, existing.length * 3), Math.max(0, duration - 0.8)));
      const end = roundSeconds(Math.min(duration, start + 2.4));
      return {
        ...draft,
        retentionPlan: [
          ...existing,
          {
            id: `manual-retention-${Date.now()}`,
            type,
            start,
            end: Math.max(start + 0.5, end),
            text: type === "TEXT_POP" ? "Key moment" : "",
            reason: "Manual retention effect",
            instruction: retentionInstructionFor(type),
            intensity: 0.65,
            manual: true,
          },
        ],
        dirty: true,
        retentionDirty: true,
      };
    });
  };

  const updateCandidateRetentionEffect = (effectId, patch) => {
    setCandidateEditDraft((current) => ({
      ...current,
      retentionPlan: arrayValue(current.retentionPlan).map((effect) => effect.id === effectId ? { ...effect, ...patch } : effect),
      dirty: true,
      retentionDirty: true,
    }));
  };

  const removeCandidateRetentionEffect = (effectId) => {
    setCandidateEditDraft((current) => ({
      ...current,
      retentionPlan: arrayValue(current.retentionPlan).filter((effect) => effect.id !== effectId),
      dirty: true,
      retentionDirty: true,
    }));
  };

  const acceptManualStoryline = ({ storyline, reason, matches }) => {
    if (!selectedCandidate || !arrayValue(matches).length) return;
    const acceptedSegments = normalizeDraftSegments(arrayValue(matches).map((match, index) => ({
      ...match.segment,
      segmentId: match.segment.segmentId || `manual-story-scene-${index + 1}`,
      label: match.segment.label || match.sceneLabel || `Story scene ${index + 1}`,
      locked: true,
      manualStorylineMatch: true,
      storylineReason: match.reason,
      matchScore: match.score,
    })));
    const captions = captionsFromCandidateSegments(acceptedSegments);
    setCandidateEditDraft((current) => ({
      ...current,
      candidateId: idOf(selectedCandidate),
      segments: acceptedSegments,
      captions,
      manualStoryline: storyline,
      storylineReason: reason,
      storylineMatches: arrayValue(matches).map((match) => ({
        id: match.id,
        sceneId: match.sceneId,
        nodeId: match.nodeId,
        score: match.score,
        reason: match.reason,
        time: timeRange(match.segment),
      })),
      dirty: true,
      timelineDirty: true,
      captionsDirty: true,
      removedSegmentIds: arrayValue(current.removedSegmentIds),
      removedCaptionIds: arrayValue(current.removedCaptionIds),
    }));
  };

  const saveCandidateDraft = async ({ rerender = false } = {}) => {
    if (!currentVideo?.videoId || !selectedCandidate || !candidateEditDraft?.dirty) return;
    const candidateId = idOf(selectedCandidate);
    const payload = candidateManualEditPayload(selectedCandidate, candidateEditDraft);
    let latestVideo = await reviewShortCandidate({
      videoId: currentVideo.videoId,
      candidateId,
      action: "UPDATE_SHORT_TIMELINE",
      payload,
    }).unwrap();

    if (candidateEditDraft.captionsDirty) {
      latestVideo = await reviewShortCandidate({
        videoId: currentVideo.videoId,
        candidateId,
        action: "MODIFY_CAPTIONS",
        payload,
      }).unwrap();
    }

    if (rerender) {
      latestVideo = await reviewShortCandidate({
        videoId: currentVideo.videoId,
        candidateId,
        action: "RERENDER_SHORT_CANDIDATE",
        payload,
      }).unwrap();
      const updatedCandidate = arrayValue(latestVideo?.candidates).find((candidate) => idOf(candidate) === candidateId);
      const nextRerenderJobId = rerenderJobIdFor(updatedCandidate, latestVideo);
      if (nextRerenderJobId) setActiveJobId(nextRerenderJobId);
    }

    if (latestVideo) setQueuedVideo(latestVideo);
    setCandidateEditDraft((current) => ({ ...current, dirty: false, timelineDirty: false, captionsDirty: false, retentionDirty: false }));
    await refetchShortVideo?.();
  };

  const requestPause = async () => {
    if (!currentVideo?.videoId || isPaused || isJobTerminal) return;
    const response = await pauseShortGeneration({
      videoId: currentVideo.videoId,
      reason: "user_requested_timeline_edit",
    }).unwrap();
    if (response) setQueuedVideo(response);
    await refetchShortVideo?.();
  };

  const updateTimelineNode = (nodeId, patch) => {
    setTimelineDraft((current) => normalizeTranscriptDraftNodes(current.map((node) => {
      if (node.id !== nodeId) return node;
      const next = { ...node, ...patch };
      const start = numberValue(next.start, numberValue(node.start, 0));
      const end = Math.max(start + 0.1, numberValue(next.end, numberValue(node.end, start + 1)));
      return {
        ...next,
        start: roundSeconds(start),
        end: roundSeconds(end),
        time: `${formatTimestamp(start)} - ${formatTimestamp(end)}`,
      };
    })));
    setTimelineDirty(true);
  };

  const saveTimelineEdits = async () => {
    if (!currentVideo?.videoId || !isPaused || !timelineDraft.length) return null;
    const transcriptPayload = normalizeTranscriptNodes(timelineDraft);
    const graphPayload = buildTranscriptGraph(transcriptPayload, "human_processing_timeline_edit");
    const response = await saveShortProcessingTimeline({
      videoId: currentVideo.videoId,
      transcript: transcriptPayload,
      graph: graphPayload,
    }).unwrap();
    if (response) setQueuedVideo(response);
    setTimelineDraft(transcriptPayload);
    setTimelineDirty(false);
    await refetchShortVideo?.();
    return response;
  };

  const resumeGeneration = async (options = {}) => {
    if (!currentVideo?.videoId || !isPaused) return;
    const runManualStep = options?.manualStep === true || (options?.manualStep !== false && isManualStepRun);
    const transcriptPayload = normalizeTranscriptNodes(timelineDraft);
    const graphPayload = buildTranscriptGraph(transcriptPayload, "human_processing_timeline_edit");
    const response = await resumeShortGeneration({
      videoId: currentVideo.videoId,
      executionMode: runManualStep ? "MANUAL_STEP" : "AUTO",
      manualStepMode: runManualStep,
      ...(runManualStep ? { advanceFromStage: manualStage } : {}),
      ...(timelineDirty ? { transcript: transcriptPayload, graph: graphPayload } : {}),
    }).unwrap();
    if (response) {
      setQueuedVideo(response);
      setActiveJobId(response?.generationJobId || activeJobId);
    }
    setTimelineDirty(false);
    await refetchShortVideo?.();
  };

  const requestVisualAnalysis = async () => {
    if (!currentVideo?.videoId) return;
    const response = await runShortVisualAnalysis({
      videoId: currentVideo.videoId,
      reason: "user_requested_optional_visual_analysis",
    }).unwrap();
    if (response) {
      setQueuedVideo(response);
      const nextJobId = visualAnalysisJobIdFrom(response);
      if (nextJobId) setVisualAnalysisJobId(nextJobId);
    }
    await refetchShortVideo?.();
  };

  const openGraphNodeEditor = (node) => {
    if (!node || (node.type !== "SHORT_CANDIDATE" && !node.ui?.editable)) return;
    setGraphEditorNode(node);
    setGraphEditorDraft(draftFromGraphNode(node));
    if (node.candidateId) setSelectedCandidateId(node.candidateId);
  };

  const closeGraphNodeEditor = () => {
    setGraphEditorNode(null);
    setGraphEditorDraft(emptyGraphNodeDraft());
  };

  const saveGraphNodeEditor = async ({ rerender = false } = {}) => {
    const candidateId = graphEditorNode?.candidateId;
    if (!currentVideo?.videoId || !candidateId) return;
    const savedVideo = await reviewShortCandidate({
      videoId: currentVideo.videoId,
      candidateId,
      action: "UPDATE_STORY_GRAPH_NODE",
      payload: {
        graphNodeId: graphEditorNode.id,
        intent: graphEditorDraft.intent,
        hook: graphEditorDraft.hook,
        beats: arrayValue(graphEditorDraft.beats).map((beat) => ({
          beatId: beat.beatId,
          nodeId: beat.nodeId,
          text: beat.text,
        })),
        segments: arrayValue(graphEditorDraft.segments).map((segment) => ({
          segmentId: segment.segmentId,
          nodeId: segment.nodeId,
          sceneId: segment.sceneId,
          sourceStart: Number(segment.sourceStart),
          sourceEnd: Number(segment.sourceEnd),
          locked: Boolean(segment.locked),
        })),
      },
    }).unwrap();
    if (savedVideo) setQueuedVideo(savedVideo);
    if (rerender) {
      const rerenderVideo = await reviewShortCandidate({
        videoId: currentVideo.videoId,
        candidateId,
        action: "RERENDER_SHORT_CANDIDATE",
        payload: { graphNodeId: graphEditorNode.id },
      }).unwrap();
      if (rerenderVideo) {
        setQueuedVideo(rerenderVideo);
        const updatedCandidate = arrayValue(rerenderVideo.candidates).find((candidate) => idOf(candidate) === candidateId);
        const nextRerenderJobId = rerenderJobIdFor(updatedCandidate, rerenderVideo);
        if (nextRerenderJobId) setActiveJobId(nextRerenderJobId);
      }
    }
    await refetchShortVideo?.();
    closeGraphNodeEditor();
  };

  const toggleSegmentLock = (nodeId) => {
    setLockedSegments((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const copyStageOutput = async () => {
    try {
      await navigator.clipboard.writeText(manualStageJson);
      setStageOutputCopied(true);
      window.setTimeout(() => setStageOutputCopied(false), 1400);
    } catch (_error) {
      setStageOutputCopied(false);
    }
  };

  const handleFileChange = (file) => {
    setSelectedFile(file);
    setDirectUploadProgress(null);
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">
      <section className="creator-section space-y-5" id="generate-shorts">
        <CanvaUploadPanel
          inputRef={inputRef}
          selectedFile={selectedFile}
          onFileChange={handleFileChange}
          title={title}
          onTitleChange={setTitle}
          notes={notes}
          onNotesChange={setNotes}
          targetDuration={targetDuration}
          onTargetDurationChange={setTargetDuration}
          requestedShorts={requestedShorts}
          onRequestedShortsChange={setRequestedShorts}
          platform={platform}
          onPlatformChange={setPlatform}
          reviewMode={reviewMode}
          onReviewModeChange={setReviewMode}
          selectedPlatform={selectedPlatform}
          currentVideo={currentTimelineIngestion || currentVideo}
          progress={currentTimelineIngestion ? timelineIngestionProgress : progress}
          latestStage={currentTimelineIngestion ? "Timeline ingestion" : latestStage}
          jobStatus={currentTimelineIngestion?.status || jobStatus}
          isPaused={isPaused}
          isStarting={isStartingUpload}
          directUploadProgress={directUploadProgress}
          canStart={Boolean(selectedFile)}
          onStart={startGeneration}
        />

        {apiError && (
          <div className="rounded-lg border border-rose-300/20 bg-rose-300/[0.08] px-4 py-3 text-sm font-semibold text-rose-100">
            {apiError}
          </div>
        )}

        {currentTimelineIngestion && (
          <TimelineIngestionStudio
            ingestion={currentTimelineIngestion}
            progress={timelineIngestionProgress}
            isLoading={isTimelineIngestionFetching || isStartingUpload}
            onRenderFabricTimeline={() => requestTimelineStage("fabric")}
            onGenerateTranscriptTimeline={() => requestTimelineStage("transcript")}
            onRunVideoAnalysis={() => requestTimelineStage("analysis")}
            onGenerateStoryShots={() => requestTimelineStage("stories")}
            stageBusy={{
              fabric: requestTimelineFabricState.isLoading,
              transcript: requestTimelineTranscriptState.isLoading,
              analysis: requestTimelineVideoAnalysisState.isLoading,
              stories: requestTimelineStoryShotsState.isLoading,
            }}
          />
        )}

        {!currentTimelineIngestion && (currentVideo || isStartingUpload) && (
          <CanvasTimelineStudio
            currentVideo={currentVideo}
            job={job}
            jobStatus={jobStatus}
            progress={progress}
            latestStage={latestStage}
            isPaused={isPaused}
            candidates={candidates}
            selectedCandidate={selectedCandidate}
            selectedCandidateId={selectedCandidateId}
            onSelectCandidate={setSelectedCandidateId}
            sourcePreviewUrl={sourcePreviewUrl}
            rerenderJob={rerenderJob}
            transcript={workingTranscript}
            selectedPlatform={selectedPlatform}
            requestedShorts={currentVideo?.requestedShorts || requestedShorts}
            isLoading={isVideoFetching && !candidates.length}
            isReviewing={reviewState.isLoading}
            onRenderSelected={() => reviewCandidate(videoUrlFor(selectedCandidate) ? "RERENDER_SHORT_CANDIDATE" : "RENDER_SHORT_CANDIDATE")}
            canPause={Boolean(currentVideo?.videoId && job && !isJobTerminal && !isPaused)}
            canResume={Boolean(currentVideo?.videoId && isPaused && !isJobTerminal)}
            onPause={requestPause}
            onResume={() => resumeGeneration({ manualStep: false })}
            isPausing={pauseState.isLoading}
            isResuming={resumeState.isLoading}
          />
        )}
      </section>
    </div>
  );
}

function CanvaUploadPanel({
  inputRef,
  selectedFile,
  onFileChange,
  title,
  onTitleChange,
  notes,
  onNotesChange,
  targetDuration,
  onTargetDurationChange,
  requestedShorts,
  onRequestedShortsChange,
  platform,
  onPlatformChange,
  reviewMode,
  onReviewModeChange,
  selectedPlatform,
  currentVideo,
  progress,
  latestStage,
  jobStatus,
  isPaused,
  isStarting,
  directUploadProgress,
  canStart,
  onStart,
}) {
  const uploadPercent = clampNumber(numberValue(directUploadProgress?.percent, progress), 0, 100);
  const busy = Boolean(isStarting || (directUploadProgress && directUploadProgress.status !== "ERROR"));
  const hasVideo = Boolean(currentVideo?.videoId);

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) onFileChange(file);
  };

  return (
    <section className="creator-panel overflow-hidden p-4 sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(18rem,0.62fr)_minmax(0,1fr)] lg:items-stretch">
        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          className="relative flex min-h-[16rem] flex-col justify-between rounded-lg border border-dashed border-cyan-300/35 bg-[linear-gradient(135deg,rgba(8,47,73,0.5),rgba(15,23,42,0.88))] p-4"
        >
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(event) => onFileChange(event.target.files?.[0] || null)}
          />
          <div className="flex items-start justify-between gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-cyan-300/15 text-cyan-100">
              <UploadCloud size={20} />
            </span>
            <StatusPill status={isPaused ? "PAUSED" : hasVideo ? jobStatus : "READY"} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-black text-white">{selectedFile?.name || currentVideo?.title || "Upload source video"}</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-300">
              {selectedFile ? fileSizeLabel(selectedFile.size) : hasVideo ? currentVideo.videoId : "Drop video here or choose a file"}
            </p>
            {(busy || hasVideo) && (
              <div className="mt-4">
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full rounded-full transition-all ${directUploadProgress?.status === "ERROR" ? "bg-rose-300" : "bg-cyan-300"}`} style={{ width: `${uploadPercent}%` }} />
                </div>
                <p className="mt-2 truncate text-xs font-bold text-slate-300">
                  {directUploadProgress?.message || latestStage || "Preparing timeline"}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="creator-control mt-4 flex min-h-[2.5rem] w-full items-center justify-center gap-2 px-3 text-sm font-black text-slate-100"
              title="Choose source video"
            >
              <FileVideo size={15} />
              Choose video
            </button>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="min-w-0">
              <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Title</span>
              <input value={title} onChange={(event) => onTitleChange(event.target.value)} className="creator-input h-10 w-full" placeholder="Source title" />
            </label>
            <label className="min-w-0">
              <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Format</span>
              <select value={platform} onChange={(event) => onPlatformChange(event.target.value)} className="creator-input h-10 w-full">
                {platforms.map((item) => (
                  <option key={item.value} value={item.value}>{item.label} | {item.ratio}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <SegmentedChoice label="Length" value={targetDuration} options={targetDurations} suffix="s" onChange={onTargetDurationChange} />
            <SegmentedChoice label="Shorts" value={requestedShorts} options={requestedShortOptions} onChange={onRequestedShortsChange} />
            <label className="min-w-0">
              <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Review</span>
              <select value={reviewMode} onChange={(event) => onReviewModeChange(event.target.value)} className="creator-input h-10 w-full">
                <option value="REVIEW">Review first</option>
                <option value="AUTO">Auto render</option>
              </select>
            </label>
          </div>

          <label className="min-w-0">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Notes</span>
            <textarea value={notes} onChange={(event) => onNotesChange(event.target.value)} className="creator-input min-h-[4.25rem] w-full resize-y py-2" placeholder="Optional direction for the shorts" />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2 text-xs font-black text-slate-300">
              <span className="rounded border border-white/10 bg-black/25 px-2.5 py-1">{selectedPlatform.label}</span>
              <span className="rounded border border-white/10 bg-black/25 px-2.5 py-1">{selectedPlatform.ratio}</span>
              <span className="rounded border border-white/10 bg-black/25 px-2.5 py-1">{requestedShorts} candidates</span>
            </div>
            <button
              type="button"
              onClick={onStart}
              disabled={!canStart || busy}
              className="flex min-h-[2.75rem] items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 text-sm font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              title="Upload and generate timeline"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              {busy ? "Uploading" : hasVideo ? "Generate again" : "Upload and generate"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineIngestionStudio({
  ingestion,
  progress,
  isLoading,
  onRenderFabricTimeline,
  onGenerateTranscriptTimeline,
  onRunVideoAnalysis,
  onGenerateStoryShots,
  stageBusy = {},
}) {
  const videoRef = useRef(null);
  const project = timelineProjectFromIngestion(ingestion);
  const stageStates = timelineStageStates(ingestion);
  const [editableTracks, setEditableTracks] = useState(() => timelineProjectTracks(project));
  const [selectedClipRef, setSelectedClipRef] = useState(null);
  const [canvasOverlays, setCanvasOverlays] = useState(() => defaultCanvasOverlays());
  const [selectedOverlayId, setSelectedOverlayId] = useState("safe-frame");
  const selectedClip = selectedClipRef
    ? findClipInTracks(editableTracks, selectedClipRef.trackId, selectedClipRef.clipId)
    : firstThumbnailClip(editableTracks) || firstClipInTracks(editableTracks);
  const selectedTrack = selectedClip
    ? editableTracks.find((track) => track.trackId === (selectedClipRef?.trackId || selectedClip.trackId))
    : null;
  const sourcePart = selectedClip ? timelinePartForClip(ingestion, selectedClip) : null;
  const sourceUrl = timelinePartUrl(sourcePart, selectedClip);
  const localSeek = selectedClip
    ? numberValue(selectedClip.localTimestampSeconds, Math.max(0, numberValue(selectedClip.timestampSeconds ?? selectedClip.start, 0) - numberValue(sourcePart?.start, 0)))
    : 0;
  const duration = canvasTimelineDuration(editableTracks, timelineCandidateFromIngestion(ingestion));
  const status = String(ingestion?.status || "TIMELINE_INGESTING").toUpperCase();
  const received = numberValue(ingestion?.receivedParts, arrayValue(ingestion?.sourceParts).length);
  const processed = numberValue(ingestion?.processedParts, 0);
  const expected = Math.max(1, numberValue(ingestion?.expectedParts, received || 1));
  const mediaAssets = useMemo(() => filmoraMediaAssets(ingestion, editableTracks), [ingestion, editableTracks]);
  const editPayload = useMemo(
    () => buildClientEditPayload(ingestion, editableTracks, canvasOverlays, selectedClip),
    [ingestion, editableTracks, canvasOverlays, selectedClip]
  );
  const [editJsonCopied, setEditJsonCopied] = useState(false);

  useEffect(() => {
    setEditableTracks(timelineProjectTracks(project));
    setSelectedClipRef(null);
    setCanvasOverlays(defaultCanvasOverlays());
    setSelectedOverlayId("safe-frame");
  }, [ingestion?.videoId, ingestion?.updatedAt, JSON.stringify(project?.tracks || [])]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !sourceUrl) return;
    const seek = () => {
      try {
        video.currentTime = Math.max(0, localSeek);
      } catch (_error) {
        // Metadata may not be ready yet; loadedmetadata retries.
      }
    };
    seek();
    video.addEventListener("loadedmetadata", seek, { once: true });
    return () => video.removeEventListener("loadedmetadata", seek);
  }, [sourceUrl, localSeek, selectedClip?.clipId]);

  const selectClip = (clip, track) => {
    if (!clip) return;
    setSelectedClipRef({ trackId: track?.trackId || clip.trackId || "", clipId: clip.clipId || clip.id || "" });
  };

  const updateClip = (patch) => {
    if (!selectedClip) return;
    setEditableTracks((current) => updateClipInTracks(current, selectedTrack?.trackId || selectedClip.trackId, selectedClip.clipId || selectedClip.id, patch));
  };

  const updateOverlay = (overlayId, patch) => {
    setCanvasOverlays((current) => arrayValue(current).map((overlay) => (
      overlay.id === overlayId ? { ...overlay, ...patch } : overlay
    )));
  };

  const addOrUpdateOverlay = (overlay) => {
    setCanvasOverlays((current) => {
      const exists = arrayValue(current).some((item) => item.id === overlay.id);
      if (exists) {
        return arrayValue(current).map((item) => (item.id === overlay.id ? { ...item, ...overlay } : item));
      }
      return [...arrayValue(current), overlay];
    });
    setSelectedOverlayId(overlay.id);
  };

  const splitClip = () => {
    if (!selectedClip) return;
    setEditableTracks((current) => splitClipInTracks(current, selectedTrack?.trackId || selectedClip.trackId, selectedClip.clipId || selectedClip.id));
  };

  const deleteClip = () => {
    if (!selectedClip) return;
    setEditableTracks((current) => deleteClipInTracks(current, selectedTrack?.trackId || selectedClip.trackId, selectedClip.clipId || selectedClip.id));
    setSelectedClipRef(null);
  };

  const addCaption = () => {
    if (!selectedClip) return;
    const captionTextValue = selectedClip.caption || selectedClip.label || "New caption";
    setEditableTracks((current) => addCaptionClipToTracks(current, selectedClip, captionTextValue));
    addOrUpdateOverlay(textOverlayForClip(selectedClip, captionTextValue));
  };

  const addZoom = () => {
    if (!selectedClip) return;
    const effects = Array.from(new Set([...arrayValue(selectedClip.effects), "PUNCH_ZOOM"]));
    updateClip({ effects });
    addOrUpdateOverlay(focusOverlayForClip(selectedClip));
  };

  const applyTransitionPreset = (preset, side = "out") => {
    if (!selectedClip || !preset) return;
    const patch = side === "in"
      ? { transitionIn: preset.transition, transitionPresetId: preset.id }
      : { transitionOut: preset.transition, transitionPresetId: preset.id };
    updateClip(patch);
  };

  const applyEffectPreset = (preset) => {
    if (!selectedClip || !preset) return;
    const effects = mergeEffectPresets(selectedClip.effects, preset.effect);
    updateClip({ effects });
    if (preset.id === "PUNCH_ZOOM" || preset.id === "HIGHLIGHT_PULSE") {
      addOrUpdateOverlay(focusOverlayForClip(selectedClip));
    }
    if (preset.id === "QUOTE_POP") {
      addOrUpdateOverlay(textOverlayForClip(selectedClip, selectedClip.caption || selectedClip.label || "Quote"));
    }
  };

  const applyAmbientLightingPreset = (preset) => {
    if (!selectedClip || !preset) return;
    updateClip({ ambientLighting: preset.lighting, ambientLightingPresetId: preset.id });
  };

  const applySmartRecipe = () => {
    if (!selectedClip) return;
    const recipe = smartEffectRecipeForClip(selectedClip);
    updateClip({
      transitionIn: recipe.transitionIn,
      transitionOut: recipe.transitionOut,
      effects: mergeEffectPresets(selectedClip.effects, ...recipe.effects),
      ambientLighting: recipe.ambientLighting,
      ambientLightingPresetId: recipe.ambientLightingPresetId,
      aiSuggestedRecipe: recipe.metadata,
    });
    if (recipe.effects.some((effect) => effect.type === "PUNCH_ZOOM" || effect.type === "HIGHLIGHT_PULSE")) {
      addOrUpdateOverlay(focusOverlayForClip(selectedClip));
    }
  };

  const copyEditJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(editPayload, null, 2));
      setEditJsonCopied(true);
      window.setTimeout(() => setEditJsonCopied(false), 1400);
    } catch (_error) {
      setEditJsonCopied(false);
    }
  };

  const seekToSelected = () => {
    if (!videoRef.current) return;
    try {
      videoRef.current.currentTime = Math.max(0, localSeek);
      videoRef.current.play?.();
    } catch (_error) {
      // Browser playback can reject before metadata/user gesture; controls remain available.
    }
  };

  return (
    <section className="creator-panel min-w-0 overflow-hidden p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-normal text-cyan-200">Browser editor</p>
          <h2 className="mt-1 truncate text-xl font-black text-white sm:text-2xl">{ingestion?.title || "Editable timeline"}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusPill status={status} />
            <span className="rounded border border-white/10 bg-black/25 px-2.5 py-1 text-xs font-black text-slate-300">{Math.round(progress)}%</span>
            <span className="rounded border border-white/10 bg-black/25 px-2.5 py-1 text-xs font-black text-slate-300">{processed}/{expected} parts processed</span>
            <span className="rounded border border-white/10 bg-black/25 px-2.5 py-1 text-xs font-black text-slate-300">{received} uploaded</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button type="button" onClick={seekToSelected} disabled={!selectedClip || !sourceUrl} className="creator-control flex min-h-9 items-center justify-center gap-2 px-3 text-xs font-black text-slate-100 disabled:opacity-50" title="Play selected clip">
            <Play size={14} /> Play
          </button>
          <button type="button" onClick={copyEditJson} className="creator-control flex min-h-9 items-center justify-center gap-2 px-3 text-xs font-black text-slate-100" title="Copy client edit JSON">
            <Code2 size={14} /> {editJsonCopied ? "Copied" : "Edit JSON"}
          </button>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-cyan-300 transition-all" style={{ width: `${clampNumber(numberValue(progress, 0), 0, 100)}%` }} />
      </div>

      <TimelineStageControls
        stageStates={stageStates}
        receivedParts={received}
        onRenderFabricTimeline={onRenderFabricTimeline}
        onGenerateTranscriptTimeline={onGenerateTranscriptTimeline}
        onRunVideoAnalysis={onRunVideoAnalysis}
        onGenerateStoryShots={onGenerateStoryShots}
        busy={stageBusy}
      />

      <div className="mt-5 grid gap-4 xl:grid-cols-[14rem_minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-3">
          <FilmoraMediaBin
            assets={mediaAssets}
            selectedClipId={selectedClip?.clipId || selectedClip?.id || ""}
            onSelectClip={selectClip}
          />
          <FilmoraEffectsLibrary
            selectedClip={selectedClip}
            onApplyTransition={applyTransitionPreset}
            onApplyEffect={applyEffectPreset}
            onApplyAmbient={applyAmbientLightingPreset}
            onSmartApply={applySmartRecipe}
          />
        </div>

        <div className="min-w-0 rounded-lg border border-white/10 bg-black/25 p-3">
          <FilmoraEditorToolbar
            selectedClip={selectedClip}
            overlays={canvasOverlays}
            sourceUrl={sourceUrl}
            onPlay={seekToSelected}
            onCopyEditJson={copyEditJson}
            copied={editJsonCopied}
          />
          <div className="mt-3">
            {sourceUrl ? (
              <ClientCanvasVideoEditor
                videoRef={videoRef}
                sourceUrl={sourceUrl}
                overlays={canvasOverlays}
                activeClip={selectedClip}
                selectedOverlayId={selectedOverlayId}
                onSelectOverlay={setSelectedOverlayId}
                onUpdateOverlay={updateOverlay}
              />
            ) : (
              <EmptyState icon={isLoading ? Loader2 : FileVideo} title={isLoading ? "Processing part" : "No preview yet"} detail="Upload a playable part to preview and edit timeline thumbnails." spinning={isLoading} />
            )}
          </div>
        </div>

        <TimelineClipPropertiesPanel
          clip={selectedClip}
          track={selectedTrack}
          onUpdate={updateClip}
          onSplit={splitClip}
          onDelete={deleteClip}
          onZoom={addZoom}
          onAddCaption={addCaption}
          selectedOverlay={arrayValue(canvasOverlays).find((overlay) => overlay.id === selectedOverlayId) || null}
          onOverlayUpdate={(patch) => selectedOverlayId && updateOverlay(selectedOverlayId, patch)}
          onAddTextOverlay={() => selectedClip && addOrUpdateOverlay(textOverlayForClip(selectedClip, selectedClip.caption || "Text overlay"))}
          onAddFocusOverlay={() => selectedClip && addOrUpdateOverlay(focusOverlayForClip(selectedClip))}
        />
      </div>

      <div className="mt-4 space-y-3">
        <FilmoraProjectStrip
          project={project}
          tracks={editableTracks}
          duration={duration}
          overlays={canvasOverlays}
          editPayload={editPayload}
        />
        <CanvasTimelineBoard
          candidate={timelineCandidateFromIngestion(ingestion)}
          tracks={editableTracks}
          duration={duration}
          selectedClipId={selectedClip?.clipId || selectedClip?.id || ""}
          onClipSelect={selectClip}
        />
      </div>
    </section>
  );
}

function TimelineStageControls({
  stageStates,
  receivedParts,
  onRenderFabricTimeline,
  onGenerateTranscriptTimeline,
  onRunVideoAnalysis,
  onGenerateStoryShots,
  busy = {},
}) {
  const upload = stageStateFor(stageStates, "upload");
  const fabric = stageStateFor(stageStates, "fabricTimeline");
  const transcript = stageStateFor(stageStates, "transcriptTimeline");
  const analysis = stageStateFor(stageStates, "videoAnalysis");
  const stories = stageStateFor(stageStates, "storyShots");
  const fabricReady = completedStage(fabric);
  const transcriptReady = completedStage(transcript) || String(transcript.status || "").toUpperCase() === "WARN";
  const analysisReady = completedStage(analysis) || String(analysis.status || "").toUpperCase() === "WARN";
  const hasUpload = numberValue(receivedParts, 0) > 0 || completedStage(upload);
  return (
    <div className="mt-3 grid gap-2 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
      <div className="flex min-w-0 flex-wrap gap-2">
        <StageChip label="Upload" state={upload} />
        <StageChip label="Timeline" state={fabric} />
        <StageChip label="Transcript" state={transcript} />
        <StageChip label="Analysis" state={analysis} />
        <StageChip label="Stories" state={stories} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onRenderFabricTimeline} disabled={!hasUpload || busy.fabric || runningStage(fabric)} className="creator-control flex h-9 items-center gap-2 px-3 text-xs font-black text-slate-100 disabled:opacity-50" title="Render Fabric timeline">
          {busy.fabric || runningStage(fabric) ? <Loader2 size={14} className="animate-spin" /> : <Layers3 size={14} />} Timeline
        </button>
        <button type="button" onClick={onGenerateTranscriptTimeline} disabled={!fabricReady || busy.transcript || runningStage(transcript)} className="creator-control flex h-9 items-center gap-2 px-3 text-xs font-black text-slate-100 disabled:opacity-50" title="Generate transcript timeline">
          {busy.transcript || runningStage(transcript) ? <Loader2 size={14} className="animate-spin" /> : <Captions size={14} />} Transcript
        </button>
        <button type="button" onClick={onRunVideoAnalysis} disabled={!transcriptReady || busy.analysis || runningStage(analysis)} className="creator-control flex h-9 items-center gap-2 px-3 text-xs font-black text-slate-100 disabled:opacity-50" title="Run video analysis">
          {busy.analysis || runningStage(analysis) ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />} Analysis
        </button>
        <button type="button" onClick={onGenerateStoryShots} disabled={!analysisReady || busy.stories || runningStage(stories)} className="creator-control flex h-9 items-center gap-2 px-3 text-xs font-black text-slate-100 disabled:opacity-50" title="Generate stories and shots">
          {busy.stories || runningStage(stories) ? <Loader2 size={14} className="animate-spin" /> : <Scissors size={14} />} Stories
        </button>
      </div>
    </div>
  );
}

function StageChip({ label, state }) {
  const status = String(state?.status || "PENDING").toUpperCase();
  const tone = status === "COMPLETED"
    ? "border-emerald-300/30 bg-emerald-300/[0.08] text-emerald-100"
    : status === "RUNNING" || status === "QUEUED"
      ? "border-cyan-300/30 bg-cyan-300/[0.08] text-cyan-100"
      : status === "FAILED"
        ? "border-rose-300/30 bg-rose-300/[0.08] text-rose-100"
        : status === "WARN"
          ? "border-amber-300/30 bg-amber-300/[0.08] text-amber-100"
          : "border-white/10 bg-black/25 text-slate-300";
  return (
    <span className={`inline-flex min-h-8 max-w-full items-center gap-2 rounded border px-2.5 py-1 text-[10px] font-black uppercase tracking-normal ${tone}`}>
      {runningStage(state) ? <Loader2 size={12} className="animate-spin" /> : completedStage(state) ? <CheckCircle2 size={12} /> : <Circle size={12} />}
      <span className="truncate">{label}</span>
      <span className="truncate opacity-75">{status}</span>
    </span>
  );
}

function FilmoraMediaBin({ assets, selectedClipId, onSelectClip }) {
  const visible = arrayValue(assets);
  return (
    <aside className="min-w-0 rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-normal text-slate-400">Media</p>
        <span className="rounded bg-white/10 px-2 py-1 text-[10px] font-black uppercase text-slate-300">{visible.length}</span>
      </div>
      <div className="max-h-[28rem] space-y-2 overflow-auto pr-1">
        {visible.length ? visible.map((asset) => {
          const active = selectedClipId && selectedClipId === (asset.clip?.clipId || asset.clip?.id);
          return (
            <button
              key={asset.id}
              type="button"
              onClick={() => asset.clip && onSelectClip?.(asset.clip, asset.track)}
              className={`flex w-full min-w-0 gap-2 rounded-lg border p-2 text-left transition ${
                active ? "border-cyan-300/50 bg-cyan-300/[0.1]" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
              }`}
            >
              <span className="grid h-12 w-16 shrink-0 place-items-center overflow-hidden rounded bg-slate-950">
                {asset.thumbnailUrl ? (
                  <img src={asset.thumbnailUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <FileVideo size={16} className="text-slate-500" />
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-black text-white">{asset.label}</span>
                <span className="mt-1 block truncate text-[10px] font-bold uppercase tracking-normal text-slate-500">{asset.type}</span>
                <span className="mt-1 block truncate text-[10px] font-semibold text-slate-400">{asset.time}</span>
              </span>
            </button>
          );
        }) : (
          <p className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs font-semibold leading-5 text-slate-400">Media appears after FFmpeg extracts scenes and thumbnails.</p>
        )}
      </div>
    </aside>
  );
}

function FilmoraEffectsLibrary({
  selectedClip,
  onApplyTransition,
  onApplyEffect,
  onApplyAmbient,
  onSmartApply,
}) {
  const canApply = Boolean(selectedClip);
  return (
    <aside className="min-w-0 rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-normal text-slate-400">Library</p>
        <button type="button" onClick={onSmartApply} disabled={!canApply} className="creator-control flex h-7 items-center gap-1.5 px-2 text-[10px] font-black uppercase text-cyan-100 disabled:opacity-50" title="Apply smart AI-style recipe">
          <Zap size={12} /> Smart
        </button>
      </div>

      <EffectShelf title="Transitions">
        {transitionPresets.map((preset) => (
          <EffectPresetButton
            key={preset.id}
            label={preset.label}
            active={activeTransition(selectedClip, preset.id)}
            disabled={!canApply}
            onClick={() => onApplyTransition?.(preset, "out")}
            meta={preset.transition.type}
          />
        ))}
      </EffectShelf>

      <EffectShelf title="Effects">
        {clipEffectPresets.map((preset) => (
          <EffectPresetButton
            key={preset.id}
            label={preset.label}
            active={activeEffect(selectedClip, preset.id)}
            disabled={!canApply}
            onClick={() => onApplyEffect?.(preset)}
            meta={preset.effect.type}
          />
        ))}
      </EffectShelf>

      <EffectShelf title="Ambient">
        {ambientLightingPresets.map((preset) => (
          <EffectPresetButton
            key={preset.id}
            label={preset.label}
            active={String(selectedClip?.ambientLightingPresetId || selectedClip?.ambientLighting?.type || "").toUpperCase() === preset.id}
            disabled={!canApply}
            onClick={() => onApplyAmbient?.(preset)}
            meta={preset.lighting.type}
            swatch={preset.lighting.color}
          />
        ))}
      </EffectShelf>
    </aside>
  );
}

function EffectShelf({ title, children }) {
  return (
    <div className="mt-3">
      <p className="mb-2 text-[10px] font-black uppercase tracking-normal text-slate-500">{title}</p>
      <div className="grid grid-cols-2 gap-1.5">{children}</div>
    </div>
  );
}

function EffectPresetButton({ label, meta, active, disabled, onClick, swatch }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`min-w-0 rounded border px-2 py-2 text-left transition disabled:opacity-45 ${
        active ? "border-cyan-300/50 bg-cyan-300/[0.1]" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]"
      }`}
      title={meta}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        {swatch && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: swatch }} />}
        <span className="truncate text-[11px] font-black text-white">{label}</span>
      </span>
    </button>
  );
}

function FilmoraEditorToolbar({ selectedClip, overlays, sourceUrl, onPlay, onCopyEditJson, copied }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="rounded border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-black uppercase text-cyan-100">Fabric.js</span>
        <span className="rounded border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-black uppercase text-slate-300">{arrayValue(overlays).length} overlays</span>
        <span className="max-w-[18rem] truncate rounded border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-black uppercase text-slate-300">
          {selectedClip ? canvasClipLabel(selectedClip) : "No clip selected"}
        </span>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onPlay} disabled={!sourceUrl} className="creator-control grid h-9 w-9 place-items-center text-slate-100 disabled:opacity-50" title="Play">
          <Play size={15} />
        </button>
        <button type="button" onClick={onCopyEditJson} className="creator-control grid h-9 w-9 place-items-center text-slate-100" title={copied ? "Copied" : "Copy edit JSON"}>
          {copied ? <CheckCircle2 size={15} /> : <Code2 size={15} />}
        </button>
      </div>
    </div>
  );
}

function FilmoraProjectStrip({ project, tracks, duration, overlays, editPayload }) {
  const clipCount = arrayValue(tracks).reduce((total, track) => total + arrayValue(track.clips).length, 0);
  const trackCount = arrayValue(tracks).length;
  const partCount = arrayValue(editPayload?.masterVideo?.sourceParts).length;
  const storyCount = arrayValue(editPayload?.storyShots?.stories).length;
  const projectTitle = project?.project?.title || editPayload?.project?.title || "Browser edit";
  return (
    <div className="grid gap-2 rounded-lg border border-white/10 bg-black/25 p-3 sm:grid-cols-2 xl:grid-cols-5">
      <DetailTile label="Project" value={projectTitle} icon={Layers3} />
      <DetailTile label="Tracks" value={String(trackCount)} icon={PanelRight} />
      <DetailTile label="Clips" value={String(clipCount)} icon={Scissors} />
      <DetailTile label="Duration" value={`${formatSecondsShort(duration)}s`} icon={Clock3} />
      <DetailTile label="Stories" value={`${storyCount} stories / ${partCount} parts`} icon={Eye} />
    </div>
  );
}

function ClientCanvasVideoEditor({
  videoRef,
  sourceUrl,
  overlays,
  activeClip,
  selectedOverlayId,
  onSelectOverlay,
  onUpdateOverlay,
}) {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const syncingFabricRef = useRef(false);
  const [fabricReady, setFabricReady] = useState(() => typeof window !== "undefined" && Boolean(window.fabric));
  const [fabricError, setFabricError] = useState("");

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || fabricCanvasRef.current) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    arrayValue(overlays).forEach((overlay) => drawEditorOverlay(ctx, overlay, width, height, overlay.id === selectedOverlayId));
  };

  useEffect(() => {
    let cancelled = false;
    loadFabricLibrary()
      .then(() => {
        if (!cancelled) setFabricReady(true);
      })
      .catch((error) => {
        if (!cancelled) setFabricError(error?.message || "Fabric.js could not load.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!fabricReady || !window.fabric || !canvasRef.current || fabricCanvasRef.current) return;
    const fabricCanvas = new window.fabric.Canvas(canvasRef.current, {
      backgroundColor: "rgba(0,0,0,0)",
      preserveObjectStacking: true,
      selection: true,
    });
    fabricCanvasRef.current = fabricCanvas;
    fabricCanvas.on("selection:created", (event) => {
      const target = event.selected?.[0] || event.target;
      if (target?.overlayId) onSelectOverlay?.(target.overlayId);
    });
    fabricCanvas.on("selection:updated", (event) => {
      const target = event.selected?.[0] || event.target;
      if (target?.overlayId) onSelectOverlay?.(target.overlayId);
    });
    fabricCanvas.on("selection:cleared", () => onSelectOverlay?.(""));
    const updateFromFabric = (event) => {
      if (syncingFabricRef.current) return;
      const target = event.target;
      if (!target?.overlayId) return;
      const width = Math.max(1, fabricCanvas.getWidth());
      const height = Math.max(1, fabricCanvas.getHeight());
      onUpdateOverlay?.(target.overlayId, {
        x: round3(numberValue(target.left, 0) / width),
        y: round3(numberValue(target.top, 0) / height),
        width: round3(Math.max(0.04, target.getScaledWidth() / width)),
        height: round3(Math.max(0.04, target.getScaledHeight() / height)),
      });
    };
    fabricCanvas.on("object:modified", updateFromFabric);
    fabricCanvas.on("object:moving", updateFromFabric);
    return () => {
      fabricCanvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [fabricReady, onSelectOverlay, onUpdateOverlay]);

  useEffect(() => {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;
    const syncSize = () => {
      const rect = stageRef.current?.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect?.width || 1));
      const height = Math.max(1, Math.round(rect?.height || 1));
      fabricCanvas.setWidth(width);
      fabricCanvas.setHeight(height);
      const wrapper = fabricCanvas.wrapperEl;
      if (wrapper) {
        wrapper.style.position = "absolute";
        wrapper.style.inset = "0";
        wrapper.style.width = "100%";
        wrapper.style.height = "100%";
      }
      fabricCanvas.getElement().style.width = "100%";
      fabricCanvas.getElement().style.height = "100%";
      syncFabricObjects(fabricCanvas, overlays, selectedOverlayId);
    };
    syncSize();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(syncSize) : null;
    if (observer && stageRef.current) observer.observe(stageRef.current);
    window.addEventListener("resize", syncSize);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", syncSize);
    };
  }, [fabricReady, overlays, selectedOverlayId]);

  useEffect(() => {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) {
      drawCanvas();
      return;
    }
    syncFabricObjects(fabricCanvas, overlays, selectedOverlayId, syncingFabricRef);
  }, [fabricReady, overlays, selectedOverlayId]);

  useEffect(() => {
    drawCanvas();
    const video = videoRef?.current;
    const handleResize = () => drawCanvas();
    const handleTime = () => drawCanvas();
    window.addEventListener("resize", handleResize);
    video?.addEventListener("timeupdate", handleTime);
    video?.addEventListener("loadedmetadata", handleTime);
    return () => {
      window.removeEventListener("resize", handleResize);
      video?.removeEventListener("timeupdate", handleTime);
      video?.removeEventListener("loadedmetadata", handleTime);
    };
  }, [overlays, selectedOverlayId, sourceUrl]);

  return (
    <div ref={stageRef} className="relative overflow-hidden rounded-lg bg-black">
      <video
        ref={videoRef}
        src={sourceUrl}
        controls
        playsInline
        preload="metadata"
        className="aspect-video w-full bg-black object-contain"
        onLoadedMetadata={drawCanvas}
        onTimeUpdate={drawCanvas}
      />
      <div className="pointer-events-none absolute inset-0" style={ambientLightingPreviewStyle(activeClip?.ambientLighting)} />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
      />
      <div className="pointer-events-none absolute left-2 top-2 rounded bg-black/60 px-2 py-1 text-[10px] font-black uppercase text-cyan-100">
        {fabricReady ? "Fabric.js" : fabricError ? "Canvas" : "Loading editor"}
      </div>
    </div>
  );
}

function TimelineClipPropertiesPanel({
  clip,
  track,
  onUpdate,
  onSplit,
  onDelete,
  onZoom,
  onAddCaption,
  selectedOverlay,
  onOverlayUpdate,
  onAddTextOverlay,
  onAddFocusOverlay,
}) {
  if (!clip) {
    return (
      <div className="rounded-lg border border-white/10 bg-black/25 p-3">
        <p className="text-xs font-black uppercase tracking-normal text-slate-400">Properties</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">Click a scene or thumbnail to edit it.</p>
      </div>
    );
  }
  const start = canvasClipStart(clip, 0);
  const end = canvasClipEnd(clip, start);
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-normal text-slate-400">Properties</p>
          <p className="mt-1 truncate text-sm font-black text-white">{canvasClipLabel(clip)}</p>
        </div>
        <span className="rounded bg-white/10 px-2 py-1 text-[10px] font-black uppercase text-slate-300">{canvasTrackLabel(track || {})}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label>
          <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Start</span>
          <input
            type="number"
            step="0.1"
            value={start}
            onChange={(event) => onUpdate({ start: roundSeconds(event.target.value) })}
            className="creator-input h-9 w-full"
          />
        </label>
        <label>
          <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">End</span>
          <input
            type="number"
            step="0.1"
            value={end}
            onChange={(event) => onUpdate({ end: roundSeconds(Math.max(start + 0.1, numberValue(event.target.value, end))) })}
            className="creator-input h-9 w-full"
          />
        </label>
      </div>
      <label className="mt-3 block">
        <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Caption</span>
        <input
          value={clip.caption || ""}
          onChange={(event) => onUpdate({ caption: event.target.value })}
          className="creator-input h-9 w-full"
          placeholder="Add caption text"
        />
      </label>

      <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
        <p className="text-[10px] font-black uppercase tracking-normal text-slate-500">Look</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label>
            <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Transition</span>
            <select
              value={String(clip.transitionOut?.type || clip.transitionPresetId || "CUT").toUpperCase()}
              onChange={(event) => {
                const preset = transitionPresets.find((item) => item.id === event.target.value) || transitionPresets[0];
                onUpdate({ transitionOut: preset.transition, transitionPresetId: preset.id });
              }}
              className="creator-input h-9 w-full"
            >
              {transitionPresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Lighting</span>
            <select
              value={String(clip.ambientLightingPresetId || clip.ambientLighting?.type || "NONE").toUpperCase()}
              onChange={(event) => {
                const preset = ambientLightingPresets.find((item) => item.id === event.target.value) || ambientLightingPresets[0];
                onUpdate({ ambientLighting: preset.lighting, ambientLightingPresetId: preset.id });
              }}
              className="creator-input h-9 w-full"
            >
              {ambientLightingPresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {arrayValue(clip.effects).length ? arrayValue(clip.effects).map((effect, index) => (
            <button
              key={effect?.id || effect?.effectId || `${effect?.type || effect || "effect"}-${index}`}
              type="button"
              onClick={() => onUpdate({ effects: arrayValue(clip.effects).filter((_, effectIndex) => effectIndex !== index) })}
              className="rounded border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-black uppercase text-slate-200"
              title="Remove effect"
            >
              {effect?.type || effect}
            </button>
          )) : (
            <span className="rounded border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-black uppercase text-slate-500">No effects</span>
          )}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={onSplit} className="creator-control flex min-h-9 items-center justify-center gap-2 px-2 text-xs font-black text-slate-100" title="Split clip">
          <Scissors size={13} /> Split
        </button>
        <button type="button" onClick={onZoom} className="creator-control flex min-h-9 items-center justify-center gap-2 px-2 text-xs font-black text-slate-100" title="Add zoom effect">
          <Search size={13} /> Zoom
        </button>
        <button type="button" onClick={onAddCaption} className="creator-control flex min-h-9 items-center justify-center gap-2 px-2 text-xs font-black text-slate-100" title="Add caption clip">
          <Captions size={13} /> Caption
        </button>
        <button type="button" onClick={onDelete} className="creator-control flex min-h-9 items-center justify-center gap-2 border-rose-300/25 bg-rose-300/[0.08] px-2 text-xs font-black text-rose-100" title="Delete clip">
          <XCircle size={13} /> Delete
        </button>
      </div>
      <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[10px] font-black uppercase tracking-normal text-slate-500">Canvas layer</p>
          <div className="flex gap-1">
            <button type="button" onClick={onAddTextOverlay} className="creator-control grid h-7 w-7 place-items-center text-slate-100" title="Add text overlay">
              <Captions size={13} />
            </button>
            <button type="button" onClick={onAddFocusOverlay} className="creator-control grid h-7 w-7 place-items-center text-slate-100" title="Add zoom/focus overlay">
              <Search size={13} />
            </button>
          </div>
        </div>
        {selectedOverlay ? (
          <div className="grid grid-cols-2 gap-2">
            <label>
              <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">X</span>
              <input type="number" min="0" max="1" step="0.01" value={numberValue(selectedOverlay.x, 0)} onChange={(event) => onOverlayUpdate?.({ x: clampNumber(numberValue(event.target.value, 0), 0, 1) })} className="creator-input h-8 w-full" />
            </label>
            <label>
              <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Y</span>
              <input type="number" min="0" max="1" step="0.01" value={numberValue(selectedOverlay.y, 0)} onChange={(event) => onOverlayUpdate?.({ y: clampNumber(numberValue(event.target.value, 0), 0, 1) })} className="creator-input h-8 w-full" />
            </label>
            <label>
              <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">W</span>
              <input type="number" min="0.05" max="1" step="0.01" value={numberValue(selectedOverlay.width, 0.3)} onChange={(event) => onOverlayUpdate?.({ width: clampNumber(numberValue(event.target.value, 0.3), 0.05, 1) })} className="creator-input h-8 w-full" />
            </label>
            <label>
              <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">H</span>
              <input type="number" min="0.05" max="1" step="0.01" value={numberValue(selectedOverlay.height, 0.2)} onChange={(event) => onOverlayUpdate?.({ height: clampNumber(numberValue(event.target.value, 0.2), 0.05, 1) })} className="creator-input h-8 w-full" />
            </label>
          </div>
        ) : (
          <p className="text-xs font-semibold leading-5 text-slate-400">Select or add an overlay to edit its position.</p>
        )}
      </div>
    </div>
  );
}

function CanvasTimelineStudio({
  currentVideo,
  job,
  jobStatus,
  progress,
  latestStage,
  isPaused,
  candidates,
  selectedCandidate,
  selectedCandidateId,
  onSelectCandidate,
  sourcePreviewUrl,
  rerenderJob,
  transcript,
  selectedPlatform,
  requestedShorts,
  isLoading,
  isReviewing,
  onRenderSelected,
  canPause,
  canResume,
  onPause,
  onResume,
  isPausing,
  isResuming,
}) {
  const project = uiTimelineProjectForCandidate(selectedCandidate);
  const tracks = useMemo(() => canvasTracksForCandidate(selectedCandidate), [selectedCandidate]);
  const duration = canvasTimelineDuration(tracks, selectedCandidate);
  const assetRequests = arrayValue(project.assetRequests);
  const hasCandidate = Boolean(selectedCandidate);
  const hasRenderedVideo = Boolean(videoUrlFor(selectedCandidate));
  const transcriptCount = arrayValue(transcript).length;

  return (
    <section className="creator-panel min-w-0 overflow-hidden p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-normal text-cyan-200">Timeline canvas</p>
          <h2 className="mt-1 truncate text-xl font-black text-white sm:text-2xl">
            {selectedCandidate?.title || currentVideo?.title || "Generating editable timeline"}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusPill status={isPaused ? "PAUSED" : jobStatus} />
            <span className="rounded border border-white/10 bg-black/25 px-2.5 py-1 text-xs font-black text-slate-300">{Math.round(progress)}%</span>
            <span className="rounded border border-white/10 bg-black/25 px-2.5 py-1 text-xs font-black text-slate-300">{latestStage || "Waiting"}</span>
            <span className="rounded border border-white/10 bg-black/25 px-2.5 py-1 text-xs font-black text-slate-300">{selectedPlatform.label}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {canPause && (
            <button
              type="button"
              onClick={onPause}
              disabled={isPausing}
              className="creator-control flex min-h-[2.5rem] items-center justify-center gap-2 px-3 text-xs font-black text-slate-100 disabled:opacity-50"
              title="Pause generation"
            >
              {isPausing ? <Loader2 size={14} className="animate-spin" /> : <Pause size={14} />}
              Pause
            </button>
          )}
          {canResume && (
            <button
              type="button"
              onClick={onResume}
              disabled={isResuming}
              className="creator-control flex min-h-[2.5rem] items-center justify-center gap-2 border-emerald-300/25 bg-emerald-300/[0.1] px-3 text-xs font-black text-emerald-100 disabled:opacity-50"
              title="Resume generation"
            >
              {isResuming ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              Resume
            </button>
          )}
          <button
            type="button"
            onClick={onRenderSelected}
            disabled={!hasCandidate || isReviewing}
            className="flex min-h-[2.5rem] items-center justify-center gap-2 rounded-lg bg-white px-3 text-xs font-black text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
            title="Render selected candidate to MP4"
          >
            {isReviewing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {hasRenderedVideo ? "Rerender MP4" : "Render MP4"}
          </button>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-cyan-300 transition-all" style={{ width: `${clampNumber(numberValue(progress, 0), 0, 100)}%` }} />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(17rem,0.36fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4">
          {hasCandidate ? (
            <CandidatePreview
              candidate={selectedCandidate}
              candidates={candidates}
              selectedCandidateId={selectedCandidateId}
              onSelectCandidate={onSelectCandidate}
              rerenderJob={rerenderJob}
              sourcePreviewUrl={sourcePreviewUrl}
            />
          ) : (
            <EmptyState icon={isLoading ? Loader2 : Scissors} title={isLoading ? "Building timeline" : "No candidates yet"} detail="Once the upload finishes, ranked clips will appear as editable timeline rows." spinning={isLoading} />
          )}
          <CanvasCandidateStrip
            candidates={candidates}
            selectedCandidateId={selectedCandidateId}
            onSelectCandidate={onSelectCandidate}
            requestedShorts={requestedShorts}
          />
        </div>

        <div className="min-w-0 space-y-4">
          <CanvasProjectSummary
            project={project}
            selectedCandidate={selectedCandidate}
            tracks={tracks}
            duration={duration}
            transcriptCount={transcriptCount}
            assetRequests={assetRequests}
          />
          <CanvasTimelineBoard candidate={selectedCandidate} tracks={tracks} duration={duration} />
          <CanvasAssetRequests requests={assetRequests} />
        </div>
      </div>
    </section>
  );
}

function CanvasCandidateStrip({ candidates, selectedCandidateId, onSelectCandidate, requestedShorts }) {
  const visible = arrayValue(candidates);
  if (!visible.length) {
    return (
      <div className="rounded-lg border border-white/10 bg-black/25 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-normal text-slate-400">Candidate queue</p>
          <span className="rounded bg-white/10 px-2 py-1 text-[10px] font-black uppercase text-slate-300">0/{requestedShorts}</span>
        </div>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-400">Ranked shorts will land here after analysis.</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-normal text-slate-400">Candidate queue</p>
        <span className="rounded bg-white/10 px-2 py-1 text-[10px] font-black uppercase text-slate-300">{visible.length}/{requestedShorts}</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 xl:max-h-[28rem] xl:flex-col xl:overflow-y-auto xl:overflow-x-hidden xl:pr-1">
        {visible.map((candidate, index) => {
          const candidateId = idOf(candidate);
          const active = candidateId === selectedCandidateId || (!selectedCandidateId && index === 0);
          const segments = candidateSegments(candidate);
          const duration = canvasCandidateDuration(candidate);
          return (
            <button
              key={candidateId || `candidate-${index}`}
              type="button"
              onClick={() => candidateId && onSelectCandidate(candidateId)}
              className={`min-w-[13rem] rounded-lg border p-3 text-left transition xl:min-w-0 ${
                active ? "border-cyan-300/50 bg-cyan-300/[0.1]" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-white/10 text-xs font-black text-white">{index + 1}</span>
                <StatusPill status={candidateRenderStatus(candidate)} />
              </div>
              <p className="mt-2 line-clamp-2 text-sm font-black leading-5 text-white">{candidate.title || `Candidate ${index + 1}`}</p>
              <p className="mt-2 text-[11px] font-bold text-slate-400">{segments.length} cuts | {formatSecondsShort(duration)}s | score {formatScore(candidate.score)}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CanvasProjectSummary({ project, selectedCandidate, tracks, duration, transcriptCount, assetRequests }) {
  const projectName = project?.project?.name || project?.project?.title || project?.project?.projectId || "Editable project";
  const version = arrayValue(project.timelineVersions)[0]?.version || 1;
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <DetailTile label="Project" value={selectedCandidate ? projectName : "Waiting"} icon={Layers3} />
      <DetailTile label="Tracks" value={String(arrayValue(tracks).length)} icon={PanelRight} />
      <DetailTile label="Duration" value={`${formatSecondsShort(duration)}s`} icon={Clock3} />
      <DetailTile label="Transcript" value={String(transcriptCount)} icon={Captions} />
      <DetailTile label="Version" value={`v${version}`} icon={Save} />
      <DetailTile label="Assets" value={String(assetRequests.length)} icon={Database} />
      <DetailTile label="Render" value={selectedCandidate ? candidateRenderStatus(selectedCandidate) : "Pending"} icon={FileVideo} />
      <DetailTile label="Layout" value={canvasDominantLayout(tracks)} icon={Eye} />
    </div>
  );
}

function CanvasTimelineBoard({ candidate, tracks, duration, selectedClipId = "", onClipSelect }) {
  if (!candidate) {
    return <EmptyState icon={Layers3} title="Timeline will generate here" detail="The browser editor will show project tracks, cuts, captions, effects, and requested assets after upload." />;
  }
  if (!arrayValue(tracks).length) {
    return <EmptyState icon={AlertTriangle} title="Timeline JSON missing" detail="This candidate has no timeline project or edit decision list yet." />;
  }
  const marks = canvasTimelineMarks(duration);
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/70 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-normal text-cyan-200">Editable timeline</p>
          <p className="mt-1 text-sm font-semibold text-slate-400">Preview is reconstructed from master video, captions, assets, and edit JSON.</p>
        </div>
        {videoUrlFor(candidate) && (
          <a href={videoUrlFor(candidate)} target="_blank" rel="noreferrer" className="creator-control flex min-h-[2.25rem] shrink-0 items-center justify-center gap-2 px-3 text-xs font-black text-slate-100">
            <Download size={13} />
            MP4
          </a>
        )}
      </div>
      <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-2 border-b border-white/10 pb-2 text-[10px] font-black uppercase tracking-normal text-slate-500 sm:grid-cols-[8rem_minmax(0,1fr)]">
        <span>Track</span>
        <div className="relative h-5">
          {marks.map((mark) => (
            <span key={mark} className="absolute top-0 -translate-x-1/2 font-mono" style={{ left: `${duration ? (mark / duration) * 100 : 0}%` }}>
              {formatTimestamp(mark)}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-2 space-y-2">
        {arrayValue(tracks).map((track, index) => (
          <CanvasTimelineTrack
            key={track.trackId || track.id || `track-${index}`}
            track={track}
            duration={duration}
            index={index}
            selectedClipId={selectedClipId}
            onClipSelect={onClipSelect}
          />
        ))}
      </div>
    </div>
  );
}

function CanvasTimelineTrack({ track, duration, index, selectedClipId = "", onClipSelect }) {
  const clips = arrayValue(track.clips);
  const tone = canvasTrackTone(track.type || track.trackType, index);
  return (
    <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
      <div className="min-w-0 rounded-lg border border-white/10 bg-black/25 px-2 py-2">
        <p className="truncate text-xs font-black text-white">{canvasTrackLabel(track)}</p>
        <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-normal text-slate-500">{clips.length} clips</p>
      </div>
      <div className="relative min-h-[4.25rem] overflow-hidden rounded-lg border border-white/10 bg-black/20">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[length:10%_100%]" />
        {clips.length ? clips.map((clip, clipIndex) => {
          const start = canvasClipStart(clip, clipIndex);
          const end = canvasClipEnd(clip, start);
          const left = duration ? clampNumber((start / duration) * 100, 0, 100) : 0;
          const width = duration ? clampNumber(((end - start) / duration) * 100, 3, 100 - left) : 10;
          return (
            <button
              key={clip.clipId || clip.id || `${track.trackId}-${clipIndex}`}
              type="button"
              onClick={() => onClipSelect?.(clip, track)}
              className={`absolute top-2 flex h-[3.25rem] min-w-[2.5rem] flex-col justify-between overflow-hidden rounded-md border px-2 py-1 text-left ${
                selectedClipId && selectedClipId === (clip.clipId || clip.id) ? "ring-2 ring-white/80 " : ""
              }${tone.clipClass}`}
              style={{ left: `${left}%`, width: `${width}%` }}
              title={`${canvasClipLabel(clip)} ${formatTimestamp(start)} - ${formatTimestamp(end)}`}
            >
              {clip.thumbnailUrl && (
                <img src={clip.thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" loading="lazy" />
              )}
              <span className="relative truncate text-[11px] font-black text-white drop-shadow">{canvasClipLabel(clip)}</span>
              <span className="relative truncate text-[10px] font-bold text-white/80 drop-shadow">{canvasClipMeta(clip, start, end)}</span>
            </button>
          );
        }) : (
          <div className="relative grid min-h-[4.25rem] place-items-center text-xs font-semibold text-slate-500">Empty track</div>
        )}
      </div>
    </div>
  );
}

function CanvasAssetRequests({ requests }) {
  const visible = arrayValue(requests);
  if (!visible.length) return null;
  return (
    <div className="rounded-lg border border-amber-300/20 bg-amber-300/[0.06] p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-normal text-amber-100">
        <Zap size={14} />
        Asset requests
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {visible.slice(0, 6).map((request, index) => (
          <div key={request.id || request.requestId || `${request.type || "asset"}-${request.query || request.reason || index}`} className="rounded border border-white/10 bg-black/20 px-3 py-2">
            <p className="truncate text-xs font-black text-white">{request.type || request.assetType || "asset"}</p>
            <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-300">{request.reason || request.description || request.query || "Additional visual requested"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ManualDebugConsole({
  inputRef,
  selectedFile,
  onFileChange,
  title,
  onTitleChange,
  notes,
  onNotesChange,
  targetDuration,
  onTargetDurationChange,
  requestedShorts,
  onRequestedShortsChange,
  platform,
  onPlatformChange,
  reviewMode,
  onReviewModeChange,
  manualStepModeEnabled,
  onManualStepModeChange,
  selectedPlatform,
  currentVideo,
  job,
  progress,
  traceRows,
  manualStage,
  manualNextStage,
  manualStageOutput,
  manualStageJson,
  onCopyStageOutput,
  stageOutputCopied,
  transcript,
  sceneTimeline,
  candidates,
  sourcePreviewUrl,
  isPaused,
  isExecutingStage,
  isManualStepRun,
  isStarting,
  directUploadProgress,
  isResuming,
  isPausing,
  canRunNext,
  canPause,
  onStart,
  onRunNext,
  onResumeAuto,
  onPause,
  apiError,
}) {
  const jobStatus = String(job?.status || currentVideo?.status || "READY").toUpperCase();
  const uploadPercent = Math.max(0, Math.min(100, Number(directUploadProgress?.percent || 0)));
  const displayProgress = directUploadProgress ? uploadPercent : progress;
  const primaryLabel = !currentVideo
    ? (isStarting ? `Uploading ${uploadPercent}%` : manualStepModeEnabled ? "Upload and run ingestion" : "Upload and run pipeline")
    : isPaused
      ? (isResuming ? "Running" : isManualStepRun ? `Run ${labelForStage(manualNextStage) || "next stage"}` : "Resume pipeline")
      : isExecutingStage
        ? `Running ${labelForStage(manualStage) || "stage"}`
        : jobStatus === "COMPLETED"
          ? "Completed"
          : "Waiting";
  const primaryDisabled = isStarting || isResuming || (Boolean(currentVideo) && !canRunNext);

  return (
    <div className="space-y-4">
      <section className="creator-panel p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-purple-300/15 text-purple-100">
                <Play size={17} />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-black text-white sm:text-2xl">Generate Shorts Runner</h1>
                <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-normal">
                  <StatusPill status={jobStatus} />
                  <span className="rounded bg-white/10 px-2 py-1 text-slate-300">{isManualStepRun || manualStepModeEnabled ? "Manual" : "Auto"}</span>
                  <span className="rounded bg-white/10 px-2 py-1 text-slate-300">{labelForStage(manualStage) || "Ready"}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
            {canPause && (
              <button
                type="button"
                onClick={onPause}
                disabled={isPausing}
                className="creator-control flex min-h-[2.75rem] items-center justify-center gap-2 px-4 text-sm font-black text-slate-100 disabled:opacity-50"
              >
                {isPausing ? <Loader2 size={16} className="animate-spin" /> : <Pause size={16} />}
                Pause
              </button>
            )}
            {currentVideo && isPaused && isManualStepRun && (
              <button
                type="button"
                onClick={onResumeAuto}
                disabled={isResuming}
                className="creator-control flex min-h-[2.75rem] items-center justify-center gap-2 px-4 text-sm font-black text-slate-100 disabled:opacity-50"
              >
                {isResuming ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Continue auto
              </button>
            )}
            <button
              type="button"
              onClick={currentVideo ? onRunNext : onStart}
              disabled={primaryDisabled}
              className="flex min-h-[2.75rem] items-center justify-center gap-2 rounded-lg bg-purple-500 px-4 text-sm font-black text-white shadow-lg shadow-purple-950/25 transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isStarting || isResuming || isExecutingStage ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              <span className="truncate">{primaryLabel}</span>
            </button>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-purple-400 transition-all" style={{ width: `${displayProgress}%` }} />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <ManualUploadSettings
            inputRef={inputRef}
            selectedFile={selectedFile}
            onFileChange={onFileChange}
            directUploadProgress={directUploadProgress}
            title={title}
            onTitleChange={onTitleChange}
            notes={notes}
            onNotesChange={onNotesChange}
            targetDuration={targetDuration}
            onTargetDurationChange={onTargetDurationChange}
            requestedShorts={requestedShorts}
            onRequestedShortsChange={onRequestedShortsChange}
            platform={platform}
            onPlatformChange={onPlatformChange}
            reviewMode={reviewMode}
            onReviewModeChange={onReviewModeChange}
            manualStepModeEnabled={manualStepModeEnabled}
            onManualStepModeChange={onManualStepModeChange}
          />
          <ManualRunState
            currentVideo={currentVideo}
            selectedPlatform={selectedPlatform}
            manualStage={manualStage}
            manualNextStage={manualNextStage}
            traceRows={traceRows}
            requestedShorts={requestedShorts}
            targetDuration={targetDuration}
          />
        </div>
        {apiError && <ErrorAlert message={apiError} />}
      </section>

      <div className="grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <ManualStageRail traceRows={traceRows} manualStage={manualStage} manualNextStage={manualNextStage} />
        <ManualOutputPanel
          manualStage={manualStage}
          manualNextStage={manualNextStage}
          output={manualStageOutput}
          json={manualStageJson}
          onCopy={onCopyStageOutput}
          copied={stageOutputCopied}
        />
      </div>

      <ManualTimelinePreview
        transcript={transcript}
        sceneTimeline={sceneTimeline}
        candidates={candidates}
        sourcePreviewUrl={sourcePreviewUrl}
      />
    </div>
  );
}

function ManualUploadSettings({
  inputRef,
  selectedFile,
  onFileChange,
  directUploadProgress,
  title,
  onTitleChange,
  notes,
  onNotesChange,
  targetDuration,
  onTargetDurationChange,
  requestedShorts,
  onRequestedShortsChange,
  platform,
  onPlatformChange,
  reviewMode,
  onReviewModeChange,
  manualStepModeEnabled,
  onManualStepModeChange,
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(12rem,0.8fr)_minmax(16rem,1fr)]">
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(event) => onFileChange(event.target.files?.[0] || null)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex min-h-[9rem] w-full flex-col justify-between rounded-lg border border-dashed border-purple-300/30 bg-black/25 p-4 text-left transition hover:border-purple-200/60"
        >
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-purple-300/15 text-purple-100">
            <UploadCloud size={19} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-black text-white">{selectedFile?.name || "Select source video"}</span>
            <span className="mt-1 block truncate text-xs font-semibold text-slate-400">{selectedFile ? fileSizeLabel(selectedFile.size) : "MP4, MOV, WEBM, MKV"}</span>
            {directUploadProgress && (
              <span className="mt-3 block">
                <span className="block h-1.5 overflow-hidden rounded-full bg-white/10">
                  <span
                    className={`block h-full rounded-full ${directUploadProgress.status === "ERROR" ? "bg-rose-300" : "bg-purple-300"}`}
                    style={{ width: `${Math.max(0, Math.min(100, Number(directUploadProgress.percent || 0)))}%` }}
                  />
                </span>
                <span className="mt-2 block truncate text-[11px] font-bold text-slate-300">
                  {directUploadProgress.message || "Direct upload in progress"}
                </span>
              </span>
            )}
          </span>
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="min-w-0">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Title</span>
          <input value={title} onChange={(event) => onTitleChange(event.target.value)} className="creator-input h-10 w-full" placeholder="Source title" />
        </label>
        <label className="min-w-0">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Format</span>
          <select value={platform} onChange={(event) => onPlatformChange(event.target.value)} className="creator-input h-10 w-full">
            {platforms.map((item) => (
              <option key={item.value} value={item.value}>{item.label} | {item.ratio}</option>
            ))}
          </select>
        </label>
        <SegmentedChoice label="Length" value={targetDuration} options={targetDurations} suffix="s" onChange={onTargetDurationChange} />
        <SegmentedChoice label="Shorts" value={requestedShorts} options={requestedShortOptions} onChange={onRequestedShortsChange} />
        <label className="min-w-0">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Review</span>
          <select value={reviewMode} onChange={(event) => onReviewModeChange(event.target.value)} className="creator-input h-10 w-full">
            <option value="REVIEW">Human review</option>
            <option value="AUTO">Auto</option>
          </select>
        </label>
        <label className="flex min-h-10 items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/25 px-3 py-2">
          <span className="min-w-0">
            <span className="block truncate text-[10px] font-black uppercase tracking-normal text-slate-500">Manual checkpoints</span>
            <span className="block truncate text-xs font-bold text-slate-300">{manualStepModeEnabled ? "On" : "Off"}</span>
          </span>
          <input
            type="checkbox"
            checked={manualStepModeEnabled}
            onChange={(event) => onManualStepModeChange(event.target.checked)}
            className="h-4 w-4 accent-purple-400"
          />
        </label>
        <label className="min-w-0 sm:col-span-2">
          <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Notes</span>
          <textarea value={notes} onChange={(event) => onNotesChange(event.target.value)} className="creator-input min-h-[4.25rem] w-full resize-y py-2" placeholder="Optional notes" />
        </label>
      </div>
    </div>
  );
}

function SegmentedChoice({ label, value, options, suffix = "", onChange }) {
  return (
    <div>
      <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">{label}</span>
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-black/25 p-1">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`min-h-8 rounded-md px-2 text-xs font-black transition ${Number(value) === Number(option) ? "bg-purple-400 text-white" : "text-slate-300 hover:bg-white/10"}`}
          >
            {option}{suffix}
          </button>
        ))}
      </div>
    </div>
  );
}

function ManualRunState({ currentVideo, selectedPlatform, manualStage, manualNextStage, traceRows, requestedShorts, targetDuration }) {
  const jobId = currentVideo?.generationJobId || "";
  const completedCount = manualCheckpointStages.filter((stage) => traceRows.some((row) => normalizeStage(row.stage) === stage)).length;
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-4">
      <div className="grid grid-cols-2 gap-2">
        <DetailTile label="Current" value={labelForStage(manualStage) || "Ready"} icon={GitBranch} />
        <DetailTile label="Next" value={labelForStage(manualNextStage) || "Done"} icon={Play} />
        <DetailTile label="Format" value={`${selectedPlatform.label} | ${selectedPlatform.ratio}`} icon={FileVideo} />
        <DetailTile label="Plan" value={`${requestedShorts} x ${targetDuration}s`} icon={Scissors} />
      </div>
      <div className="mt-3 rounded-lg bg-black/30 p-3">
        <p className="text-[10px] font-black uppercase tracking-normal text-slate-500">Job</p>
        <p className="mt-1 break-all font-mono text-xs font-semibold text-slate-300">{jobId || "Not started"}</p>
        <p className="mt-2 text-[10px] font-black uppercase tracking-normal text-slate-500">{completedCount}/{manualCheckpointStages.length} checkpoints</p>
      </div>
    </div>
  );
}

function ManualStageRail({ traceRows, manualStage, manualNextStage }) {
  const completed = new Set(traceRows.map((row) => normalizeStage(row.stage)).filter(Boolean));
  return (
    <section className="creator-panel p-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-normal text-slate-400">Stages</p>
        <span className="rounded bg-white/10 px-2 py-1 text-[10px] font-black uppercase text-slate-300">{completed.size}</span>
      </div>
      <div className="max-h-[38rem] space-y-1 overflow-auto pr-1">
        {manualCheckpointStages.map((stage, index) => {
          const active = stage === manualStage;
          const next = stage === manualNextStage;
          const done = completed.has(stage);
          const visual = active ? "border-purple-300/45 bg-purple-500/[0.16]" : next ? "border-sky-300/30 bg-sky-300/[0.08]" : done ? "border-emerald-300/25 bg-emerald-300/[0.07]" : "border-white/10 bg-black/20";
          return (
            <div key={stage} className={`grid grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-2 rounded-lg border px-2 py-2 ${visual}`}>
              <span className={`grid h-6 w-6 place-items-center rounded-md text-[10px] font-black ${done ? "bg-emerald-300/15 text-emerald-100" : active ? "bg-purple-300/20 text-purple-100" : "bg-white/10 text-slate-400"}`}>
                {done ? <CheckCircle2 size={13} /> : index + 1}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-black text-white">{labelForStage(stage)}</span>
                <span className="block truncate text-[10px] font-bold uppercase tracking-normal text-slate-500">{active ? "current" : next ? "next" : done ? "done" : "pending"}</span>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ManualOutputPanel({ manualStage, manualNextStage, output, json, onCopy, copied }) {
  const metrics = output?.metrics || {};
  const trace = output?.trace || {};
  return (
    <section className="creator-panel min-w-0 p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-normal text-slate-400">Current Output</p>
          <h2 className="mt-1 truncate text-lg font-black text-white">{labelForStage(manualStage) || "Ready"}</h2>
          <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-slate-400">{trace.summary || output?.message || "No backend output yet."}</p>
        </div>
        <button type="button" onClick={onCopy} className="creator-control flex min-h-[2.5rem] shrink-0 items-center justify-center gap-2 px-3 text-xs font-black text-slate-100">
          <Code2 size={14} />
          {copied ? "Copied" : "Copy JSON"}
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <DetailTile label="Transcript" value={String(metrics.transcriptNodes || 0)} icon={Captions} />
        <DetailTile label="Scenes" value={String(metrics.scenes || 0)} icon={Layers3} />
        <DetailTile label="Frames" value={String(metrics.frames || 0)} icon={FileVideo} />
        <DetailTile label="Candidates" value={String(metrics.candidates || 0)} icon={Scissors} />
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)]">
        <div className="rounded-lg border border-white/10 bg-black/25 p-3">
          <p className="text-[10px] font-black uppercase tracking-normal text-slate-500">Stage Evidence</p>
          <div className="mt-2 space-y-2 text-xs font-semibold leading-5 text-slate-300">
            <p>Status: <span className="font-black text-white">{output?.status || "READY"}</span></p>
            <p>Next: <span className="font-black text-white">{labelForStage(manualNextStage) || "None"}</span></p>
            <p>Confidence: <span className="font-black text-white">{trace.confidence == null ? "n/a" : Number(trace.confidence).toFixed(2)}</span></p>
            <p className="break-words">Message: <span className="text-slate-200">{output?.message || "n/a"}</span></p>
          </div>
        </div>
        <pre className="max-h-[30rem] min-w-0 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 text-[11px] leading-5 text-slate-200">
          {json}
        </pre>
      </div>
    </section>
  );
}

function ManualTimelinePreview({ transcript, sceneTimeline, candidates, sourcePreviewUrl }) {
  const transcriptNodes = normalizeTranscriptNodes(transcript).slice(0, 8);
  const scenes = arrayValue(sceneTimeline?.scenes).slice(0, 6);
  const readyCandidates = arrayValue(candidates).slice(0, 4);
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="creator-panel p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-black uppercase tracking-normal text-slate-400">Timeline</p>
          <span className="rounded bg-white/10 px-2 py-1 text-[10px] font-black uppercase text-slate-300">{transcriptNodes.length}</span>
        </div>
        <div className="mt-3 space-y-2">
          {transcriptNodes.length ? transcriptNodes.map((node) => (
            <div key={node.id} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2 rounded-lg border border-white/10 bg-black/25 p-2">
              <span className="font-mono text-[10px] font-black text-purple-100">{formatTimestamp(node.start)}</span>
              <span className="line-clamp-2 text-xs font-semibold leading-5 text-slate-300">{node.transcript || node.text || "Dialogue"}</span>
            </div>
          )) : <EmptyState icon={Captions} title="No transcript yet" detail="Transcript output appears after the transcript stages." />}
        </div>
      </div>
      <div className="creator-panel p-3 sm:p-4">
        <div className="grid gap-3 lg:grid-cols-[11rem_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-lg border border-white/10 bg-black">
            {sourcePreviewUrl ? (
              <video src={sourcePreviewUrl} controls className="aspect-[9/16] h-full max-h-[24rem] w-full bg-black object-contain" />
            ) : (
              <div className="grid aspect-[9/16] place-items-center text-slate-500">
                <FileVideo size={24} />
              </div>
            )}
          </div>
          <div className="min-w-0 space-y-3">
            <div>
              <p className="text-xs font-black uppercase tracking-normal text-slate-400">Scene Analysis</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {scenes.length ? scenes.map((scene) => (
                  <div key={scene.id} className="rounded-lg border border-white/10 bg-black/25 p-2">
                    <p className="truncate text-xs font-black text-white">{scene.label || scene.id}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-normal text-slate-500">{formatTimestamp(scene.start)} - {formatTimestamp(scene.end)}</p>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-400">{scene.activeSpeaker || scene.continuity?.transitionRisk || scene.visualAnalysis?.source || "scene"}</p>
                    {scene.questionAnswer?.hasQuestionAnswer && (
                      <p className="mt-1 line-clamp-1 text-[10px] font-bold text-cyan-100">{scene.questionAnswer.question}</p>
                    )}
                  </div>
                )) : <p className="rounded-lg border border-white/10 bg-black/25 p-3 text-xs font-semibold text-slate-500">No scenes yet.</p>}
              </div>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-normal text-slate-400">Short Drafts</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {readyCandidates.length ? readyCandidates.map((candidate) => (
                  <div key={idOf(candidate)} className="rounded-lg border border-white/10 bg-black/25 p-2">
                    <p className="truncate text-xs font-black text-white">{candidate.title || "Candidate"}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-normal text-slate-500">{candidateRenderStatus(candidate)}</p>
                  </div>
                )) : <p className="rounded-lg border border-white/10 bg-black/25 p-3 text-xs font-semibold text-slate-500">No short drafts yet.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Header({ currentVideo, job, latestStage }) {
  const renderedCount = arrayValue(currentVideo?.candidates).filter((candidate) => videoUrlFor(candidate)).length;
  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-normal text-purple-200">
          <Scissors size={15} /> Generate Shorts
        </div>
        <h1 className="mt-2 text-3xl font-black text-white">Short Video Cursor</h1>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-400">
          {currentVideo?.title || "Upload a source video and track the backend agents through render."}
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Metric label="Job" value={String(job?.status || currentVideo?.status || "Idle")} icon={Database} />
        <Metric label="Stage" value={latestStage || "Ready"} icon={GitBranch} />
        <Metric label="Rendered" value={`${renderedCount}/${arrayValue(currentVideo?.candidates).length || 0}`} icon={FileVideo} />
      </div>
    </div>
  );
}

function UploadWell({ inputRef, selectedFile, onFileChange }) {
  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="creator-control grid min-h-[10rem] w-full min-w-0 place-items-center overflow-hidden border-dashed p-4 text-center sm:p-5 xl:min-h-[9rem]"
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(event) => onFileChange(event.target.files?.[0] || null)}
      />
      <span className="block w-full min-w-0 max-w-full">
        <UploadCloud size={34} className="mx-auto text-purple-200" />
        <span className="mx-auto mt-3 block max-w-full truncate px-2 text-base font-black text-white sm:text-lg" title={selectedFile?.name || "Upload Video"}>
          {selectedFile?.name || "Upload Video"}
        </span>
        <span className="mt-2 block text-xs font-semibold text-slate-500">
          {selectedFile ? formatBytes(selectedFile.size) : "MP4, MOV, MKV"}
        </span>
      </span>
    </button>
  );
}

function RunSettings({
  title,
  onTitleChange,
  notes,
  onNotesChange,
  targetDuration,
  onTargetDurationChange,
  requestedShorts,
  onRequestedShortsChange,
  platform,
  onPlatformChange,
  reviewMode,
  onReviewModeChange,
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <ControlBlock title="Title">
        <input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          className="creator-control min-h-[2.75rem] w-full px-3 py-2 text-sm font-bold text-slate-100 outline-none"
          placeholder="Optional"
        />
      </ControlBlock>
      <ControlBlock title="Platform">
        <select
          value={platform}
          onChange={(event) => onPlatformChange(event.target.value)}
          className="creator-control min-h-[2.75rem] w-full px-3 py-2 text-sm font-bold text-slate-100 outline-none"
        >
          {platforms.map((item) => (
            <option key={item.value} value={item.value} className="bg-slate-950 text-slate-100">
              {item.label}
            </option>
          ))}
        </select>
      </ControlBlock>
      <ControlBlock title="Target">
        <Segmented values={targetDurations} value={targetDuration} onChange={onTargetDurationChange} suffix="s" />
      </ControlBlock>
      <ControlBlock title="Count">
        <Segmented values={requestedShortOptions} value={requestedShorts} onChange={onRequestedShortsChange} />
      </ControlBlock>
      <ControlBlock title="Mode">
        <div className="grid min-h-[2.75rem] grid-cols-2 gap-1 rounded-lg border border-white/10 bg-black/20 p-1">
          {["AUTO", "REVIEW"].map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onReviewModeChange(mode)}
              className={`rounded-md px-3 py-2 text-xs font-black uppercase transition ${
                reviewMode === mode ? "bg-purple-600 text-white" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {mode.toLowerCase()}
            </button>
          ))}
        </div>
      </ControlBlock>
      <ControlBlock title="Notes">
        <input
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          className="creator-control min-h-[2.75rem] w-full px-3 py-2 text-sm font-bold text-slate-100 outline-none"
          placeholder="Optional"
        />
      </ControlBlock>
    </div>
  );
}

function RunSummary({ selectedPlatform, requestedShorts, targetDuration, selectedFile, isProcessing, onRun }) {
  return (
    <div className="flex h-full min-w-0 flex-col justify-between gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="space-y-2">
        <SummaryRow label="Output" value={`${requestedShorts} shorts`} />
        <SummaryRow label="Length" value={`${targetDuration}s target`} />
        <SummaryRow label="Format" value={`${selectedPlatform.label} | ${selectedPlatform.ratio}`} />
        <SummaryRow label="Source" value={selectedFile ? "Ready" : "Waiting"} />
      </div>
      <button
        type="button"
        onClick={onRun}
        disabled={isProcessing}
        className="creator-primary flex min-h-[2.75rem] w-full items-center justify-center gap-2 px-4 py-3 text-sm font-black text-white disabled:opacity-55"
      >
        {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
        {isProcessing ? "Queueing" : "Generate Shorts"}
      </button>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-md bg-white/[0.035] px-3 py-2">
      <span className="shrink-0 text-[10px] font-black uppercase tracking-normal text-slate-500">{label}</span>
      <span className="min-w-0 truncate whitespace-nowrap text-right text-xs font-extrabold text-white" title={String(value)}>{value}</span>
    </div>
  );
}

function ErrorAlert({ message }) {
  const lowWallet = /wallet|balance|insufficient|recharge/i.test(message);
  return (
    <div className={`mt-4 flex items-start gap-3 rounded-lg border px-3 py-3 ${lowWallet ? "border-amber-300/30 bg-amber-300/[0.08]" : "border-rose-300/30 bg-rose-300/[0.08]"}`}>
      <AlertTriangle size={16} className={lowWallet ? "mt-0.5 text-amber-200" : "mt-0.5 text-rose-200"} />
      <div>
        <p className="text-sm font-black text-white">{lowWallet ? "Wallet needs recharge" : "Request failed"}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-300">{message}</p>
      </div>
    </div>
  );
}

function VisualAnalysisPanel({ currentVideo, sceneTimeline, visualAnalysisJob, isRunning, mainJobRunning, onRun }) {
  const visualState = firstObject(currentVideo?.metadata?.visualAnalysis);
  const payload = jobPayload(visualAnalysisJob);
  const status = String(visualAnalysisJob?.status || visualState.status || (currentVideo ? "READY" : "WAITING")).toUpperCase();
  const active = isRunning || ["PENDING", "RUNNING"].includes(status);
  const sceneCount = countValue(
    payload.sceneCount,
    payload.sceneAnalysis?.sceneCount,
    payload.sceneTimeline?.metadata?.sceneCount,
    visualState.sceneCount,
    sceneTimeline?.metadata?.sceneCount,
    arrayValue(sceneTimeline?.scenes).length
  );
  const frameCount = countValue(
    payload.frameCount,
    payload.sceneAnalysis?.frameCount,
    payload.sceneTimeline?.metadata?.frameCount,
    visualState.frameCount,
    sceneTimeline?.metadata?.frameCount
  );
  const hasVisualEvidence = frameCount > 0;
  const disabled = !currentVideo?.videoId || active || mainJobRunning;
  const buttonLabel = active
    ? "Running visual analysis"
    : hasVisualEvidence
      ? "Refresh visual analysis"
      : "Run visual analysis";
  const detail = mainJobRunning
    ? "Available after the quick generation pass finishes."
    : hasVisualEvidence
      ? "Visual context is available for timeline cuts, review, and story hooks."
      : "Optional slower pass. Quick shorts can be reviewed first, then this adds visual context.";

  return (
    <section className="creator-panel p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-normal text-cyan-200">
            <Eye size={15} />
            Visual analysis
          </div>
          <h2 className="mt-1 text-lg font-black text-white">Visual analysis</h2>
          <p className="mt-1 max-w-3xl text-xs font-semibold leading-5 text-slate-400">
            {detail} This can take time on longer videos.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:justify-end">
          <div className="grid grid-cols-3 gap-2">
            <DetailTile label="Status" value={statusLabel(status)} icon={Clock3} />
            <DetailTile label="Scenes" value={sceneCount || "-"} icon={Layers3} />
            <DetailTile label="Frames" value={frameCount || "-"} icon={FileVideo} />
          </div>
          <button
            type="button"
            onClick={onRun}
            disabled={disabled}
            className="flex min-h-[2.75rem] items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 text-sm font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {active ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            <span className="truncate">{buttonLabel}</span>
          </button>
        </div>
      </div>
      {active && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-cyan-300 transition-all" style={{ width: `${Math.max(8, Math.min(96, Number(visualAnalysisJob?.progress || 8)))}%` }} />
        </div>
      )}
    </section>
  );
}

function PipelineHealthPanel({ currentVideo, job, transcript, sceneTimeline, traceRows }) {
  const payload = jobPayload(job);
  const metadata = currentVideo?.metadata || {};
  const timelineMetadata = sceneTimeline?.metadata || {};
  const aiStageCache = firstObject(metadata.aiStageCache);
  const cacheKeys = Object.keys(aiStageCache);
  const schema = String(sceneTimeline?.schema || timelineMetadata.schema || "timeline_intelligence_v2");
  const transcriptCount = normalizeTranscriptNodes(transcript).length;
  const sceneCount = arrayValue(sceneTimeline?.scenes).length;
  const dialogueCount = arrayValue(sceneTimeline?.dialogue).length || transcriptCount;
  const qaCount = arrayValue(sceneTimeline?.questionAnswerTurns).length;
  const hasVisualEvidence = Boolean(timelineMetadata.hasVisualEvidence) || arrayValue(sceneTimeline?.json?.frames).length > 0;
  const latestDurableStage = firstText(metadata.latestDurableStage, metadata.sceneTimelineSnapshot?.stage, metadata.transcriptSnapshot?.stage);
  const latestLiveStage = firstText(payload.activeStage, arrayValue(traceRows)[arrayValue(traceRows).length - 1]?.stage);
  const snapshotAge = firstText(metadata.latestDurableStageAt, metadata.sceneTimelineSnapshot?.savedAt, metadata.transcriptSnapshot?.savedAt);
  const sourceMode = latestDurableStage
    ? "Durable snapshot"
    : payload.activeStage
      ? "Live job output"
      : currentVideo?.videoId
        ? "Stored video"
        : "Waiting";
  const warnings = [
    currentVideo?.videoId && !transcriptCount ? "Transcript is not available yet." : "",
    transcriptCount && !sceneCount ? "Scene timeline is using transcript fallback." : "",
    sceneCount && !hasVisualEvidence ? "Visual evidence is pending; cuts are transcript-led." : "",
  ].filter(Boolean);

  return (
    <section className="creator-panel p-3 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-normal text-emerald-200">
            <ShieldCheck size={15} />
            Flow map
          </p>
          <h2 className="mt-1 text-lg font-black text-white">{sourceMode}</h2>
          <p className="mt-1 max-w-3xl text-xs font-semibold leading-5 text-slate-400">
            {latestLiveStage || latestDurableStage || "Upload a video to start"}{snapshotAge ? ` | saved ${compactDateTime(snapshotAge)}` : ""}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:w-[34rem] lg:grid-cols-4">
          <DetailTile label="Schema" value={schema.replace("timeline_", "")} icon={Database} />
          <DetailTile label="Dialogue" value={dialogueCount || "-"} icon={Captions} />
          <DetailTile label="Scenes" value={sceneCount || "-"} icon={Layers3} />
          <DetailTile label="Q/A" value={qaCount || "-"} icon={GitBranch} />
        </div>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <HealthFact label="Transcript" value={transcriptCount ? `${transcriptCount} nodes` : "pending"} ok={transcriptCount > 0} />
        <HealthFact label="Timeline" value={sceneCount ? `${sceneCount} slices` : "fallback pending"} ok={sceneCount > 0 || transcriptCount > 0} />
        <HealthFact label="Source cache" value={cacheKeys.length ? `${cacheKeys.length} cached stages` : "not restored"} ok={cacheKeys.length > 0} />
      </div>
      {warnings.length > 0 && (
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {warnings.map((warning) => (
            <div key={warning} className="flex items-start gap-2 rounded-lg border border-amber-300/20 bg-amber-300/[0.06] px-3 py-2">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-200" />
              <p className="text-xs font-semibold leading-5 text-amber-50">{warning}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function HealthFact({ label, value, ok }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
      <span className="truncate text-[10px] font-black uppercase tracking-normal text-slate-500">{label}</span>
      <span className={`shrink-0 rounded px-2 py-1 text-[10px] font-black uppercase ${ok ? "bg-emerald-300/15 text-emerald-100" : "bg-white/10 text-slate-300"}`}>
        {value}
      </span>
    </div>
  );
}

function PipelinePanel({ traceRows, job, currentVideo, progress, collapsed, onCollapsedChange }) {
  const [expandedStages, setExpandedStages] = useState(new Set());
  const traceByStage = useMemo(() => {
    const map = new Map();
    traceRows.forEach((row) => {
      if (row.stage) map.set(String(row.stage).toUpperCase(), row);
    });
    return map;
  }, [traceRows]);
  const activeStage = String(jobPayload(job).activeStage || traceRows[traceRows.length - 1]?.stage || "").toUpperCase();
  const activeIndex = Math.max(0, pipelineStages.findIndex((stage) => stage.stage === activeStage));
  const failed = ["FAILED", "ERROR"].includes(String(job?.status || currentVideo?.status || "").toUpperCase());
  const completedCount = pipelineStages.filter((stage) => traceByStage.has(stage.stage)).length;
  const warningCount = traceRows.filter((row) => ["WARN", "FAILED", "ERROR"].includes(String(row.status || "").toUpperCase())).length;

  const toggleStage = (stageName) => {
    setExpandedStages((current) => {
      const next = new Set(current);
      if (next.has(stageName)) next.delete(stageName);
      else next.add(stageName);
      return next;
    });
  };

  if (collapsed) {
    return (
      <aside className="creator-panel flex min-h-[18rem] items-stretch justify-center p-2 xl:sticky xl:top-5 xl:self-start">
        <button
          type="button"
          onClick={() => onCollapsedChange?.(false)}
          className="flex w-full flex-col items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-2 py-3 text-center transition hover:border-purple-300/35 hover:bg-purple-500/[0.08]"
          aria-label="Expand Stage Audit"
        >
          <ChevronRight size={18} className="text-purple-200" />
          <div className="flex min-h-[9rem] items-center justify-center">
            <span className="[writing-mode:vertical-rl] rotate-180 text-xs font-black uppercase tracking-normal text-purple-200">
              Stage Audit
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-black text-slate-200">
              {Math.round(progress)}%
            </span>
            {warningCount > 0 && (
              <span className="rounded bg-amber-300/15 px-1.5 py-1 text-[9px] font-black text-amber-100">
                {warningCount}
              </span>
            )}
          </div>
        </button>
      </aside>
    );
  }

  return (
    <aside className="creator-panel p-4 xl:sticky xl:top-5 xl:self-start">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-normal text-purple-200">
            Stage Audit
          </p>
          <h2 className="mt-1 truncate text-lg font-extrabold text-white">{labelForStage(activeStage) || "Ready"}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-black text-slate-200">
            {Math.round(progress)}%
          </span>
          <button
            type="button"
            onClick={() => onCollapsedChange?.(true)}
            className="creator-control grid h-8 w-8 place-items-center text-slate-300"
            aria-label="Collapse Stage Audit"
            title="Collapse Stage Audit"
          >
            <ChevronLeft size={15} />
          </button>
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full transition-all ${failed ? "bg-rose-400" : "bg-purple-500"}`} style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <DetailTile label="Done" value={`${completedCount}/${pipelineStages.length}`} icon={CheckCircle2} />
        <DetailTile label="Open" value={labelForStage(activeStage) || "Ready"} icon={GitBranch} />
        <DetailTile label="Warn" value={warningCount} icon={AlertTriangle} />
      </div>
      <div className="mt-4 max-h-[34rem] space-y-1.5 overflow-y-auto pr-1">
        {pipelineStages.map((stage, index) => {
          const evidence = traceByStage.get(stage.stage);
          const status = evidence ? String(evidence.status || "COMPLETED").toUpperCase() : index === activeIndex && progress > 0 ? "RUNNING" : "PENDING";
          return (
            <PipelineRow
              key={stage.stage}
              stage={stage}
              status={status}
              evidence={evidence}
              expanded={expandedStages.has(stage.stage)}
              onToggle={() => toggleStage(stage.stage)}
            />
          );
        })}
      </div>
    </aside>
  );
}

function PipelineRow({ stage, status, evidence, expanded, onToggle }) {
  const visual = visualForStatus(status);
  const Icon = visual.icon;
  return (
    <div className={`rounded-lg border ${visual.className}`}>
      <button type="button" onClick={onToggle} className="flex min-h-[3.2rem] w-full items-start gap-3 px-3 py-2 text-left">
        <Icon size={16} className={`mt-0.5 shrink-0 ${visual.iconClass}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-extrabold text-white">{stage.label}</p>
            <span className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${maturityClass(stage.maturity)}`}>{stage.maturity}</span>
          </div>
          <p className="truncate text-[11px] font-semibold text-slate-500">{evidence?.summary || status.toLowerCase()}</p>
        </div>
        {expanded ? <ChevronDown size={15} className="mt-0.5 shrink-0 text-slate-400" /> : <ChevronRight size={15} className="mt-0.5 shrink-0 text-slate-500" />}
      </button>
      {expanded && (
        <div className="border-t border-white/10 px-3 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={status} />
            {evidence?.confidence != null && (
              <span className="rounded bg-white/10 px-2 py-1 text-[10px] font-black uppercase text-slate-300">
                Confidence {Number(evidence.confidence).toFixed(2)}
              </span>
            )}
          </div>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{evidence?.summary || "Stage has not produced audit evidence yet."}</p>
          {evidence && (
            <pre className="mt-2 max-h-40 overflow-auto rounded-md border border-white/10 bg-slate-950 p-2 text-[10px] font-semibold leading-4 text-slate-400">
              {JSON.stringify(evidence.metadata || evidence.details || {}, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function WorkspaceTabs({ activeView, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
      {workspaceViews.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`creator-control flex min-h-[2.5rem] items-center gap-2 px-3 py-2 text-xs font-black ${
            activeView === id ? "border-purple-300/40 bg-purple-500/20 text-white" : "text-slate-400"
          }`}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );
}

function CandidatesWorkspace({
  selectedPlatform,
  selectedCandidate,
  selectedCandidateId,
  candidates,
  onSelectCandidate,
  requestedShorts,
  reviewMode,
  onReview,
  isReviewing,
  isLoading,
  rerenderJob,
  frameLookup,
  candidateEditDraft,
  onRemoveSegment,
  onRemoveCaption,
  onAddRetentionEffect,
  onUpdateRetentionEffect,
  onRemoveRetentionEffect,
  onResetDraft,
  onSaveDraft,
  onAcceptManualStoryline,
  isSavingDraft,
  sceneTimeline,
  sourceTranscript,
  sourcePreviewUrl,
}) {
  if (isLoading) return <EmptyState icon={Loader2} title="Loading run" detail="Fetching generated shorts." spinning />;
  if (!candidates.length) return <EmptyState icon={Scissors} title="No candidates yet" detail="Queue a run or wait for the worker to finish candidate ranking." />;

  const activeCandidateId = selectedCandidateId || idOf(selectedCandidate);
  const selectedIndex = Math.max(0, candidates.findIndex((candidate) => idOf(candidate) === activeCandidateId));

  return (
    <div className="space-y-4">
      <CandidateReviewHeader
        candidate={selectedCandidate}
        candidates={candidates}
        selectedIndex={selectedIndex}
        selectedPlatform={selectedPlatform}
        requestedShorts={requestedShorts}
      />

      <div className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(18rem,0.58fr)_minmax(18rem,0.42fr)] xl:items-start">
            <div className="min-w-0 space-y-3">
              <CandidatePreview
                candidate={selectedCandidate}
                candidates={candidates}
                selectedCandidateId={activeCandidateId}
                onSelectCandidate={onSelectCandidate}
                rerenderJob={rerenderJob}
                sourcePreviewUrl={sourcePreviewUrl}
              />
              <RerenderProgressPanel candidate={selectedCandidate} job={rerenderJob} />
            </div>
            <CandidateDecisionPanel
              candidate={selectedCandidate}
              candidateEditDraft={candidateEditDraft}
              reviewMode={reviewMode}
              onReview={onReview}
              onResetDraft={onResetDraft}
              onSaveDraft={onSaveDraft}
              isReviewing={isReviewing}
              isSavingDraft={isSavingDraft}
            />
          </div>

          <ManualStorylineWorkbench
            candidate={selectedCandidate}
            candidateEditDraft={candidateEditDraft}
            sceneTimeline={sceneTimeline}
            sourceTranscript={sourceTranscript}
            frameLookup={frameLookup}
            onAccept={onAcceptManualStoryline}
          />
          <CandidateRetentionWorkbench
            candidate={selectedCandidate}
            candidateEditDraft={candidateEditDraft}
            onAddEffect={onAddRetentionEffect}
            onUpdateEffect={onUpdateRetentionEffect}
            onRemoveEffect={onRemoveRetentionEffect}
          />
          <CandidateTimelineWorkbench
            candidate={selectedCandidate}
            candidateEditDraft={candidateEditDraft}
            frameLookup={frameLookup}
            onRemoveSegment={onRemoveSegment}
          />
          <CandidateCaptionWorkbench
            candidate={selectedCandidate}
            candidateEditDraft={candidateEditDraft}
            onRemoveCaption={onRemoveCaption}
          />
        </div>

        <CandidateQueuePanel
          candidates={candidates}
          selectedCandidateId={activeCandidateId}
          onSelectCandidate={onSelectCandidate}
        />
      </div>
    </div>
  );
}

function CandidatePreview({ candidate, candidates = [], selectedCandidateId, onSelectCandidate, rerenderJob, sourcePreviewUrl }) {
  const videoRef = useRef(null);
  const renderedCandidates = useMemo(() => arrayValue(candidates).filter((item) => videoUrlFor(item)), [candidates]);
  const playerCandidate = candidate || renderedCandidates[0] || {};
  const playerCandidateId = idOf(playerCandidate);
  const url = videoUrlFor(playerCandidate);
  const manifest = playerCandidate?.renderManifest || {};
  const renderStatus = manifest.renderStatus || playerCandidate?.status || "PENDING";
  const playerIndex = Math.max(0, renderedCandidates.findIndex((item) => idOf(item) === playerCandidateId));
  const hasFeed = renderedCandidates.length > 1;

  const selectRenderedAt = (index) => {
    if (!renderedCandidates.length) return;
    const next = renderedCandidates[(index + renderedCandidates.length) % renderedCandidates.length];
    const nextId = idOf(next);
    if (nextId) onSelectCandidate?.(nextId);
  };

  useEffect(() => {
    if (!url || !videoRef.current) return;
    const video = videoRef.current;
    video.muted = true;
    video.currentTime = 0;
    const playPromise = video.play();
    if (playPromise?.catch) {
      playPromise.catch(() => {});
    }
  }, [url, playerCandidateId]);

  if (url) {
    return (
      <div className="min-w-0 rounded-lg border border-white/10 bg-black/25 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-normal text-purple-200">Mobile Shorts</p>
          <StatusPill status={renderStatus || "READY"} />
        </div>
        <div className="mt-3 grid place-items-center">
          <div className="w-full max-w-[18rem] rounded-[1.75rem] border border-white/15 bg-slate-950 p-2 shadow-2xl shadow-black/40 sm:max-w-xs">
            <div className="relative overflow-hidden rounded-[1.35rem] bg-black">
              <video
                ref={videoRef}
                src={url}
                controls
                autoPlay
                muted
                playsInline
                preload="auto"
                onEnded={() => hasFeed && selectRenderedAt(playerIndex + 1)}
                className="aspect-[9/16] max-h-[34rem] w-full bg-black object-contain"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-3 pb-4 pt-12">
                <p className="truncate text-sm font-black text-white" title={playerCandidate?.title || "Short candidate"}>{playerCandidate?.title || "Short candidate"}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-normal text-slate-300">
                  {renderedCandidates.length ? `${playerIndex + 1}/${renderedCandidates.length}` : "1/1"}
                </p>
              </div>
            </div>
          </div>
        </div>
        {hasFeed && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => selectRenderedAt(playerIndex - 1)}
              className="creator-control flex min-h-[2.5rem] items-center justify-center gap-2 px-3 text-xs font-black text-slate-200"
              title="Previous short"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button
              type="button"
              onClick={() => selectRenderedAt(playerIndex + 1)}
              className="creator-control flex min-h-[2.5rem] items-center justify-center gap-2 px-3 text-xs font-black text-slate-200"
              title="Next short"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {renderedCandidates.map((item, index) => (
            <button
              key={idOf(item) || `rendered-${index}`}
              type="button"
              onClick={() => selectRenderedAt(index)}
              className={`h-1.5 min-w-8 rounded-full transition ${idOf(item) === playerCandidateId ? "bg-purple-300" : "bg-white/15 hover:bg-white/30"}`}
              title={item.title || `Short ${index + 1}`}
              aria-label={item.title || `Short ${index + 1}`}
            />
          ))}
        </div>
      </div>
    );
  }
  if (sourcePreviewUrl && candidateSegments(playerCandidate).length) {
    return (
      <JsonTimelinePreview
        candidate={playerCandidate}
        sourceUrl={sourcePreviewUrl}
        renderStatus={renderStatus}
        rerenderJob={rerenderJob}
      />
    );
  }
  return (
    <div className="grid min-h-[20rem] place-items-center rounded-lg border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.94),rgba(15,23,42,0.78))] p-4 text-center sm:min-h-[28rem] sm:p-5">
      <div className="min-w-0">
        <FileVideo size={34} className="mx-auto text-slate-500" />
        <p className="mt-3 text-lg font-black text-white">{renderStatus}</p>
        {rerenderJob && (
          <p className="mt-1 text-xs font-black uppercase tracking-normal text-purple-100">
            Rerender {String(rerenderJob.status || "queued").toLowerCase()} | {Math.round(Number(rerenderJob.progress || 0))}%
          </p>
        )}
        <p className="mt-2 max-w-full truncate text-sm font-semibold text-slate-400">{playerCandidate?.title || "Rendered short will appear here."}</p>
      </div>
    </div>
  );
}

function JsonTimelinePreview({ candidate, sourceUrl, renderStatus, rerenderJob }) {
  const videoRef = useRef(null);
  const candidateId = idOf(candidate);
  const segments = useMemo(() => candidateSegments(candidate).filter((segment) => {
    const start = numberValue(segment.sourceStart ?? segment.start, 0);
    const end = numberValue(segment.sourceEnd ?? segment.end, start);
    return end > start + 0.05;
  }), [candidate]);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState("");
  const activeSegment = segments[Math.min(segmentIndex, Math.max(0, segments.length - 1))] || {};
  const activeStart = numberValue(activeSegment.sourceStart ?? activeSegment.start, 0);
  const activeEnd = Math.max(activeStart + 0.1, numberValue(activeSegment.sourceEnd ?? activeSegment.end, activeStart + 0.1));
  const progress = segments.length ? ((Math.min(segmentIndex + 1, segments.length) / segments.length) * 100) : 0;
  const captions = captionsForSegment(candidateCaptions(candidate), activeSegment);

  useEffect(() => {
    setSegmentIndex(0);
    setIsPlaying(false);
    setVideoError("");
  }, [candidateId, sourceUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !sourceUrl || !segments.length) return;
    try {
      video.currentTime = activeStart;
      if (isPlaying) {
        const playPromise = video.play();
        if (playPromise?.catch) playPromise.catch(() => setIsPlaying(false));
      }
    } catch (_error) {
      // Browser seek can fail while metadata is loading; loadedmetadata will retry.
    }
  }, [activeStart, candidateId, segmentIndex, sourceUrl, segments.length]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!isPlaying) {
      video.pause();
      return;
    }
    if (video.currentTime < activeStart || video.currentTime > activeEnd) {
      video.currentTime = activeStart;
    }
    const playPromise = video.play();
    if (playPromise?.catch) playPromise.catch(() => setIsPlaying(false));
  }, [activeEnd, activeStart, isPlaying]);

  const jumpToSegment = (nextIndex, shouldPlay = isPlaying) => {
    const clamped = clampNumber(nextIndex, 0, Math.max(0, segments.length - 1));
    setSegmentIndex(clamped);
    setIsPlaying(Boolean(shouldPlay));
  };

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    const video = videoRef.current;
    if (video && (video.currentTime < activeStart || video.currentTime >= activeEnd)) {
      video.currentTime = activeStart;
    }
    setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !segments.length) return;
    if (video.currentTime >= activeEnd - 0.05) {
      if (segmentIndex < segments.length - 1) {
        jumpToSegment(segmentIndex + 1, isPlaying);
      } else {
        video.pause();
        video.currentTime = activeEnd;
        setIsPlaying(false);
      }
    }
  };

  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-normal text-purple-200">JSON Preview</p>
          <p className="mt-1 truncate text-sm font-extrabold text-white">{candidate?.title || "Candidate cut"}</p>
        </div>
        <StatusPill status={renderStatus || "JSON_PREVIEW"} />
      </div>
      <div className="mt-3 grid place-items-center">
        <div className="w-full max-w-[18rem] rounded-[1.75rem] border border-white/15 bg-slate-950 p-2 shadow-2xl shadow-black/40 sm:max-w-xs">
          <div className="relative overflow-hidden rounded-[1.35rem] bg-black">
            <video
              ref={videoRef}
              src={sourceUrl}
              playsInline
              preload="metadata"
              onLoadedMetadata={() => {
                try {
                  if (videoRef.current) videoRef.current.currentTime = activeStart;
                } catch (_error) {
                  // Ignore browser seek edge cases while metadata settles.
                }
              }}
              onTimeUpdate={handleTimeUpdate}
              onError={() => setVideoError("Could not load the master video preview URL.")}
              className="aspect-[9/16] max-h-[34rem] w-full bg-black object-contain"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent px-3 pb-4 pt-14">
              <p className="truncate text-sm font-black text-white">{activeSegment.label || activeSegment.transcript || candidate?.title || "JSON cut"}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-normal text-slate-300">
                Cut {Math.min(segmentIndex + 1, segments.length)}/{segments.length} | {formatTimestamp(activeStart)} - {formatTimestamp(activeEnd)}
              </p>
              {captions[0] && (
                <p className="mt-2 line-clamp-2 rounded bg-black/50 px-2 py-1 text-center text-xs font-black text-white">
                  {captionText(captions[0])}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-cyan-300 transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => jumpToSegment(segmentIndex - 1, false)}
          disabled={segmentIndex <= 0}
          className="creator-control flex min-h-[2.5rem] items-center justify-center gap-2 px-3 text-xs font-black text-slate-200 disabled:cursor-not-allowed disabled:opacity-45"
          title="Previous cut"
        >
          <ChevronLeft size={14} /> Cut
        </button>
        <button
          type="button"
          onClick={togglePlay}
          disabled={!segments.length}
          className="creator-control flex min-h-[2.5rem] items-center justify-center gap-2 bg-cyan-600 px-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-45"
          title={isPlaying ? "Pause JSON preview" : "Play JSON preview"}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          onClick={() => jumpToSegment(segmentIndex + 1, false)}
          disabled={segmentIndex >= segments.length - 1}
          className="creator-control flex min-h-[2.5rem] items-center justify-center gap-2 px-3 text-xs font-black text-slate-200 disabled:cursor-not-allowed disabled:opacity-45"
          title="Next cut"
        >
          Cut <ChevronRight size={14} />
        </button>
      </div>
      <div className="mt-3 max-h-28 space-y-1 overflow-auto pr-1">
        {segments.map((segment, index) => (
          <button
            key={segment.segmentId || segment.id || `cut-segment-${index}`}
            type="button"
            onClick={() => jumpToSegment(index, false)}
            className={`grid w-full grid-cols-[3.25rem_minmax(0,1fr)] gap-2 rounded border px-2 py-1.5 text-left ${
              index === segmentIndex ? "border-cyan-300/40 bg-cyan-300/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
            }`}
          >
            <span className="font-mono text-[10px] font-black text-cyan-100">{formatTimestamp(segment.sourceStart)}</span>
            <span className="truncate text-[11px] font-semibold text-slate-300">{segment.label || segment.transcript || segment.nodeId || `Cut ${index + 1}`}</span>
          </button>
        ))}
      </div>
      {rerenderJob && (
        <p className="mt-2 text-xs font-black uppercase tracking-normal text-purple-100">
          Backend render {String(rerenderJob.status || "queued").toLowerCase()} | {Math.round(Number(rerenderJob.progress || 0))}%
        </p>
      )}
      {videoError && <p className="mt-2 text-xs font-semibold text-rose-200">{videoError}</p>}
      <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">
        This is rendered in the browser from the master video plus edit JSON. Use backend Render selected only when you need an MP4 export.
      </p>
    </div>
  );
}

function RerenderProgressPanel({ candidate, job }) {
  const rerenderJobId = rerenderJobIdFor(candidate);
  const status = String(job?.status || candidate?.renderManifest?.renderStatus || candidate?.status || "").toUpperCase();
  const shouldShow = rerenderJobId || status.includes("RERENDER") || status.includes("NEEDS_RENDER");
  if (!shouldShow) return null;
  const progress = Math.max(0, Math.min(100, Number(job?.progress ?? (status.includes("QUEUED") ? 8 : status.includes("FAILED") ? 100 : 35))));
  const message = job?.message || job?.outputPayload?.message || candidate?.renderManifest?.renderStatus || "Rerender queued";
  const failed = ["FAILED", "ERROR"].includes(String(job?.status || "").toUpperCase()) || status.includes("FAILED");
  return (
    <div className={`rounded-lg border p-3 ${failed ? "border-rose-300/25 bg-rose-300/[0.07]" : "border-purple-300/25 bg-purple-500/[0.08]"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-normal text-purple-100">Rerender job</p>
          <p className="mt-1 truncate text-sm font-extrabold text-white">{message}</p>
        </div>
        <StatusPill status={job?.status || status || "QUEUED"} />
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full transition-all ${failed ? "bg-rose-400" : "bg-purple-400"}`} style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-2 truncate text-[11px] font-semibold text-slate-400">{rerenderJobId || "Waiting for rerender job id"}</p>
    </div>
  );
}

function CandidateDetails({ candidate }) {
  if (!candidate) return null;
  const edl = candidate.editDecisionList || {};
  const captionPlan = candidate.captionPlan || {};
  const manifest = candidate.renderManifest || {};
  const url = videoUrlFor(candidate);
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <DetailTile label="Score" value={formatScore(candidate.score)} icon={BarChart3} />
      <DetailTile label="Duration" value={`${candidate.durationSeconds || edl.actualDurationSeconds || 0}s`} icon={Clock3} />
      <DetailTile label="Render" value={manifest.renderStatus || candidate.status || "Pending"} icon={FileVideo} />
      <DetailTile label="Hook" value={candidate.hookType || "Hook"} icon={Zap} />
      <DetailTile label="Segments" value={arrayValue(edl.segments).length} icon={Scissors} />
      <DetailTile label="Captions" value={arrayValue(captionPlan.captions).length} icon={Captions} />
      {url && (
        <a href={url} target="_blank" rel="noreferrer" className="creator-control flex min-h-[2.75rem] items-center justify-center gap-2 px-3 py-2 text-sm font-black text-slate-100 md:col-span-3">
          <Download size={15} /> Open rendered MP4
        </a>
      )}
    </div>
  );
}

function CandidateReviewHeader({ candidate, candidates, selectedIndex, selectedPlatform, requestedShorts }) {
  const segments = candidateSegments(candidate);
  const captions = candidateCaptions(candidate);
  const renderStatus = candidateRenderStatus(candidate);
  return (
    <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(28rem,0.45fr)] xl:items-end">
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-normal text-purple-200">Candidate Workspace</p>
        <h2 className="mt-1 truncate text-lg font-black text-white sm:text-xl">{candidate?.title || "Short candidate"}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-black text-slate-300">
            Rank {selectedIndex + 1}/{Math.max(1, candidates.length)}
          </span>
          <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-black text-slate-300">
            {requestedShorts} requested
          </span>
          <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-black text-slate-300">
            {selectedPlatform.label} | {selectedPlatform.ratio}
          </span>
          <StatusPill status={renderStatus} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
        <CandidateKpi label="Score" value={formatScore(candidate?.score)} icon={BarChart3} tone="emerald" />
        <CandidateKpi label="Timeline" value={`${segments.length} cuts`} icon={Layers3} tone="cyan" />
        <CandidateKpi label="Captions" value={`${captions.length} lines`} icon={Captions} tone="amber" />
      </div>
    </div>
  );
}

function CandidateKpi({ label, value, icon: Icon, tone = "purple" }) {
  const tones = {
    emerald: "text-emerald-100 bg-emerald-300/10",
    cyan: "text-cyan-100 bg-cyan-300/10",
    amber: "text-amber-100 bg-amber-300/10",
    purple: "text-purple-100 bg-purple-300/10",
  };
  return (
    <div className={`min-w-0 rounded-lg border border-white/10 p-3 ${tones[tone] || tones.purple}`}>
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-normal text-slate-400">
        <Icon size={13} /> {label}
      </div>
      <p className="mt-1 truncate text-sm font-extrabold text-white">{value}</p>
    </div>
  );
}

function CandidateDecisionPanel({ candidate, candidateEditDraft, reviewMode, onReview, onResetDraft, onSaveDraft, isReviewing, isSavingDraft }) {
  const url = videoUrlFor(candidate);
  const review = candidateReview(candidate);
  const draftActive = candidateEditDraft?.candidateId === idOf(candidate);
  const dirty = draftActive && candidateEditDraft?.dirty;
  const draftSegments = draftActive ? arrayValue(candidateEditDraft.segments) : candidateSegments(candidate);
  const draftCaptions = draftActive ? arrayValue(candidateEditDraft.captions) : candidateCaptions(candidate);
  return (
    <div className="min-w-0 space-y-3">
      <div className="rounded-lg border border-white/10 bg-black/25 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-normal text-purple-200">Decision Desk</p>
            <p className="mt-1 truncate text-sm font-extrabold text-white">{candidate?.hookType || candidate?.editDecisionList?.strategy || "Candidate cut"}</p>
          </div>
          <StatusPill status={candidateRenderStatus(candidate)} />
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {candidateChecks(candidate).map((check) => (
            <CandidateCheck key={check.label} check={check} />
          ))}
        </div>
        {url && (
          <a href={url} target="_blank" rel="noreferrer" className="creator-control mt-3 flex min-h-[2.5rem] items-center justify-center gap-2 px-3 py-2 text-xs font-black text-slate-100">
            <Download size={14} /> Open MP4
          </a>
        )}
        <button
          type="button"
          onClick={() => onReview(url ? "RERENDER_SHORT_CANDIDATE" : "RENDER_SHORT_CANDIDATE")}
          disabled={isReviewing || !candidate}
          className="creator-control mt-3 flex min-h-[2.5rem] w-full items-center justify-center gap-2 bg-emerald-600 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isReviewing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {url ? "Rerender selected" : "Render selected"}
        </button>
      </div>
      <div className={`rounded-lg border p-3 ${dirty ? "border-amber-300/25 bg-amber-300/[0.07]" : "border-white/10 bg-black/25"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-normal text-slate-400">Final Cut Draft</p>
            <p className="mt-1 truncate text-sm font-extrabold text-white">
              {draftSegments.length} scenes | {formatSecondsShort(totalDraftDuration(draftSegments))}s | {draftCaptions.length} captions
            </p>
          </div>
          <StatusPill status={dirty ? "WARN" : "READY"} />
        </div>
        <div className="mt-3 grid gap-2 min-[420px]:grid-cols-3">
          <button
            type="button"
            onClick={onResetDraft}
            disabled={!dirty || isSavingDraft}
            className="creator-control flex min-h-[2.5rem] items-center justify-center gap-2 px-3 text-xs font-black text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={14} /> Reset
          </button>
          <button
            type="button"
            onClick={() => onSaveDraft?.({ rerender: false })}
            disabled={!dirty || isSavingDraft || draftSegments.length === 0}
            className="creator-control flex min-h-[2.5rem] items-center justify-center gap-2 px-3 text-xs font-black text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSavingDraft ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save
          </button>
          <button
            type="button"
            onClick={() => onSaveDraft?.({ rerender: true })}
            disabled={!dirty || isSavingDraft || draftSegments.length === 0}
            className="creator-control flex min-h-[2.5rem] items-center justify-center gap-2 bg-emerald-600 px-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSavingDraft ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            Render
          </button>
        </div>
      </div>
      <SemanticReviewBanner review={review} />
      <ReviewActions mode={reviewMode} onReview={onReview} disabled={isReviewing || !candidate} />
    </div>
  );
}

function CandidateCheck({ check }) {
  const visual = visualForStatus(check.status);
  const Icon = check.icon || visual.icon;
  return (
    <div className="rounded-md bg-white/[0.04] px-2 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Icon size={13} className={visual.iconClass} />
          <p className="truncate text-[10px] font-black uppercase tracking-normal text-slate-500">{check.label}</p>
        </div>
        <span className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${visual.pillClass}`}>{check.status}</span>
      </div>
      <p className="mt-1 truncate text-xs font-extrabold text-white">{check.value}</p>
    </div>
  );
}

function ManualStorylineWorkbench({ candidate, candidateEditDraft, sceneTimeline, sourceTranscript, frameLookup, onAccept }) {
  const candidateId = idOf(candidate);
  const generatedStory = candidateStorylineText(candidate);
  const generatedReason = candidateStoryGenerationReason(candidate);
  const [storyText, setStoryText] = useState(generatedStory);
  const suggestions = useMemo(
    () => matchStorylineToTimeline(storyText, sceneTimeline, sourceTranscript, candidate).slice(0, 8),
    [storyText, sceneTimeline, sourceTranscript, candidate]
  );
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    setStoryText(generatedStory);
  }, [candidateId, generatedStory]);

  useEffect(() => {
    setSelectedIds(new Set(suggestions.slice(0, Math.min(4, suggestions.length)).map((item) => item.id)));
  }, [candidateId, storyText, suggestions.length]);

  const selectedMatches = suggestions.filter((item) => selectedIds.has(item.id));
  const acceptedStoryline = candidateEditDraft?.candidateId === candidateId ? candidateEditDraft?.manualStoryline : "";
  const acceptReason = storylineAcceptReason(storyText, selectedMatches);

  return (
    <section className="min-w-0 rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(19rem,0.55fr)]">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-normal text-purple-200">Storyline Builder</p>
              <h3 className="mt-1 truncate text-base font-black text-white sm:text-lg">Manual story to source timeline</h3>
            </div>
            <StatusPill status={acceptedStoryline ? "READY" : suggestions.length ? "PARTIAL" : "PENDING"} />
          </div>
          <label className="mt-3 block">
            <span className="text-[10px] font-black uppercase tracking-normal text-slate-500">Storyline</span>
            <textarea
              value={storyText}
              onChange={(event) => setStoryText(event.target.value)}
              rows={4}
              maxLength={700}
              className="mt-2 w-full resize-y rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm font-semibold leading-6 text-slate-100 outline-none focus:border-purple-300/45"
              placeholder="Write the short storyline"
            />
          </label>
          <div className="mt-3 rounded-md bg-white/[0.04] px-3 py-2">
            <p className="text-[10px] font-black uppercase tracking-normal text-slate-500">Generated Reason</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-300">{generatedReason}</p>
          </div>
        </div>

        <div className="min-w-0 rounded-lg border border-white/10 bg-slate-950 p-3">
          <p className="text-[10px] font-black uppercase tracking-normal text-slate-500">Generated Storyline</p>
          <p className="mt-2 line-clamp-5 text-sm font-semibold leading-6 text-slate-300">{generatedStory || "No generated story intent is available yet."}</p>
          {acceptedStoryline && (
            <div className="mt-3 rounded-md border border-emerald-300/20 bg-emerald-300/[0.06] px-2 py-2">
              <p className="text-[10px] font-black uppercase tracking-normal text-emerald-100">Accepted Manual Story</p>
              <p className="mt-1 line-clamp-3 text-xs font-semibold leading-5 text-slate-200">{acceptedStoryline}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-normal text-slate-500">Detected Scenes</p>
          <p className="mt-1 truncate text-xs font-semibold text-slate-400">{acceptReason}</p>
        </div>
        <button
          type="button"
          onClick={() => onAccept?.({ storyline: storyText, reason: acceptReason, matches: selectedMatches })}
          disabled={!storyText.trim() || selectedMatches.length === 0}
          className="creator-control flex min-h-[2.5rem] items-center justify-center gap-2 bg-emerald-600 px-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCircle2 size={14} /> Accept Storyline
        </button>
      </div>

      {suggestions.length ? (
        <div className="mt-3 grid gap-2 xl:grid-cols-2">
          {suggestions.map((suggestion) => {
            const checked = selectedIds.has(suggestion.id);
            const frames = arrayValue(suggestion.segment.frames);
            return (
              <label
                key={suggestion.id}
                className={`block rounded-lg border p-3 transition ${checked ? "border-emerald-300/30 bg-emerald-300/[0.07]" : "border-white/10 bg-slate-950"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-white">{suggestion.sceneLabel || suggestion.id}</p>
                    <p className="mt-1 truncate text-[10px] font-bold text-slate-500">{timeRange(suggestion.segment)} | score {Math.round(suggestion.score * 100)}%</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      setSelectedIds((current) => {
                        const next = new Set(current);
                        if (event.target.checked) next.add(suggestion.id);
                        else next.delete(suggestion.id);
                        return next;
                      });
                    }}
                    className="mt-1 h-4 w-4 shrink-0 accent-emerald-500"
                  />
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {(frames.length ? frames : [suggestion.sceneId || suggestion.nodeId || suggestion.id]).slice(0, 4).map((frame, frameIndex) => (
                    <FrameThumb key={`${suggestion.id}-manual-story-frame-${frameIndex}`} frame={frame} frameLookup={frameLookup} />
                  ))}
                </div>
                <p className="mt-3 line-clamp-3 text-xs font-semibold leading-5 text-slate-300">{suggestion.transcript || "Timeline evidence"}</p>
                <p className="mt-2 line-clamp-2 text-[11px] font-semibold leading-5 text-emerald-100">{suggestion.reason}</p>
              </label>
            );
          })}
        </div>
      ) : (
        <div className="mt-3 rounded-md border border-white/10 bg-slate-950 px-3 py-4 text-sm font-semibold text-slate-400">
          Storyline matches will appear when transcript or scene timeline evidence is available.
        </div>
      )}
    </section>
  );
}

function CandidateRetentionWorkbench({ candidate, candidateEditDraft, onAddEffect, onUpdateEffect, onRemoveEffect }) {
  const draftActive = candidateEditDraft?.candidateId === idOf(candidate);
  const retentionPlan = draftActive ? arrayValue(candidateEditDraft.retentionPlan) : candidateRetentionPlan(candidate);
  const segments = draftActive ? arrayValue(candidateEditDraft.segments) : candidateSegments(candidate);
  const duration = Math.max(1, totalDraftDuration(segments) || numberValue(candidate?.durationSeconds, 60));
  const options = [
    ["PUNCH_ZOOM", "Zoom", RefreshCw],
    ["TEXT_POP", "Text", Captions],
    ["B_ROLL", "B-roll", FileVideo],
    ["HIGHLIGHT", "Highlight", Zap],
  ];
  return (
    <section className="min-w-0 rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-normal text-purple-200">Retention Effects</p>
          <h3 className="mt-1 truncate text-base font-black text-white sm:text-lg">{retentionPlan.length ? `${retentionPlan.length} manual pattern interrupts` : "No manual effects"}</h3>
          <p className="mt-1 max-w-2xl text-xs font-semibold leading-5 text-slate-400">Add effects only to this candidate, then Render. Nothing is applied automatically to other shorts.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[21rem]">
          {options.map(([type, label, Icon]) => (
            <button
              key={type}
              type="button"
              onClick={() => onAddEffect?.(type)}
              disabled={!candidate}
              className="creator-control flex min-h-[2.4rem] items-center justify-center gap-2 px-2 text-xs font-black text-slate-100 disabled:opacity-50"
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {retentionPlan.length ? retentionPlan.map((effect, index) => (
          <div key={effect.id || effect.effectId || `retention-effect-${index}`} className="rounded-lg border border-white/10 bg-slate-950 p-3">
            <div className="grid gap-2 md:grid-cols-[9rem_5rem_5rem_minmax(0,1fr)_2.25rem] md:items-end">
              <label>
                <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Effect</span>
                <select
                  value={effect.type || "PUNCH_ZOOM"}
                  onChange={(event) => onUpdateEffect?.(effect.id, { type: event.target.value, instruction: retentionInstructionFor(event.target.value) })}
                  className="creator-input h-9 w-full text-xs"
                >
                  <option value="PUNCH_ZOOM">Punch zoom</option>
                  <option value="ZOOM_IN">Zoom in</option>
                  <option value="ZOOM_OUT">Zoom out</option>
                  <option value="TEXT_POP">Text pop</option>
                  <option value="B_ROLL">B-roll marker</option>
                  <option value="HIGHLIGHT">Highlight</option>
                </select>
              </label>
              <label>
                <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Start</span>
                <input
                  type="number"
                  min="0"
                  max={duration}
                  step="0.1"
                  value={numberValue(effect.start, 0)}
                  onChange={(event) => onUpdateEffect?.(effect.id, { start: roundSeconds(Number(event.target.value)) })}
                  className="creator-input h-9 w-full text-xs"
                />
              </label>
              <label>
                <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">End</span>
                <input
                  type="number"
                  min="0"
                  max={duration}
                  step="0.1"
                  value={numberValue(effect.end, 0)}
                  onChange={(event) => onUpdateEffect?.(effect.id, { end: roundSeconds(Number(event.target.value)) })}
                  className="creator-input h-9 w-full text-xs"
                />
              </label>
              <label className="min-w-0">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Text / note</span>
                <input
                  value={effect.text || ""}
                  onChange={(event) => onUpdateEffect?.(effect.id, { text: event.target.value })}
                  className="creator-input h-9 w-full text-xs"
                  placeholder={effect.type === "TEXT_POP" ? "Overlay text" : "Optional note"}
                />
              </label>
              <button
                type="button"
                onClick={() => onRemoveEffect?.(effect.id)}
                className="creator-control grid h-9 w-9 place-items-center text-rose-100"
                title="Remove retention effect"
                aria-label="Remove retention effect"
              >
                <XCircle size={14} />
              </button>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-purple-400"
                style={{
                  marginLeft: `${Math.min(100, Math.max(0, (numberValue(effect.start, 0) / duration) * 100))}%`,
                  width: `${Math.min(100, Math.max(2, ((numberValue(effect.end, 0) - numberValue(effect.start, 0)) / duration) * 100))}%`,
                }}
              />
            </div>
            <p className="mt-2 truncate text-[11px] font-semibold text-slate-500">{effect.instruction || retentionInstructionFor(effect.type)}</p>
          </div>
        )) : (
          <div className="rounded-md border border-white/10 bg-slate-950 px-3 py-4 text-sm font-semibold text-slate-400">
            Add a zoom, text pop, b-roll marker, or highlight to this selected short.
          </div>
        )}
      </div>
    </section>
  );
}

function CandidateTimelineWorkbench({ candidate, candidateEditDraft, frameLookup, onRemoveSegment }) {
  const draftActive = candidateEditDraft?.candidateId === idOf(candidate);
  const segments = draftActive ? arrayValue(candidateEditDraft.segments) : candidateSegments(candidate);
  const captions = draftActive ? arrayValue(candidateEditDraft.captions) : candidateCaptions(candidate);
  const total = totalDraftDuration(segments);
  const strategy = candidate?.editDecisionList?.strategy || candidate?.metadata?.chain || "ranked edit";
  return (
    <section className="min-w-0 rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-normal text-purple-200">Story Picks</p>
          <h3 className="mt-1 truncate text-base font-black text-white sm:text-lg">{segments.length ? `${segments.length} picked scenes | ${formatSecondsShort(total)}s final timeline` : "No edit decision list"}</h3>
        </div>
        <span className="max-w-full truncate rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-black text-slate-300">{strategy}</span>
      </div>
      {segments.length ? (
        <>
          <TimelinePreview segments={segments} frameLookup={frameLookup} />
          <div className="mt-3 grid gap-2 xl:grid-cols-2">
            {segments.map((segment, index) => {
              const segmentCaptions = captionsForSegment(captions, segment);
              const frames = arrayValue(segment.frames);
              return (
              <div key={segment.segmentId || segment.id || segment.nodeId || `picked-segment-${index}`} className="rounded-md border border-white/10 bg-slate-950 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-white">{segment.label || segment.nodeId || `Picked scene ${index + 1}`}</p>
                    <p className="mt-1 truncate text-[10px] font-bold text-slate-500">
                      Source {formatTimestamp(segment.sourceStart)} - {formatTimestamp(segment.sourceEnd)} | Final {formatTimestamp(segment.timelineStart)} - {formatTimestamp(segment.timelineEnd)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveSegment?.(segment.segmentId)}
                    disabled={segments.length <= 1}
                    className="creator-control grid h-8 w-8 shrink-0 place-items-center text-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Remove scene, frames, voice, and overlapping captions"
                    aria-label="Remove scene, frames, voice, and overlapping captions"
                  >
                    <XCircle size={15} />
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {(frames.length ? frames : [segment.sceneId || segment.nodeId || `S${index + 1}`]).slice(0, 4).map((frame, frameIndex) => (
                    <FrameThumb key={`${segment.segmentId || segment.id || segment.nodeId || `picked-segment-${index}`}-picked-frame-${frame?.id || frame?.frameId || frame?.nodeId || frame || frameIndex}`} frame={frame} frameLookup={frameLookup} />
                  ))}
                </div>
                <div className="mt-3 rounded-md bg-white/[0.04] px-2 py-2">
                  <p className="text-[9px] font-black uppercase tracking-normal text-slate-500">Voice</p>
                  <p className="mt-1 line-clamp-3 text-xs font-semibold leading-5 text-slate-300">{segment.transcript || segment.text || segment.summary || segment.reason || "Source audio from this timestamp is kept with the scene."}</p>
                </div>
                <div className="mt-2 rounded-md bg-white/[0.04] px-2 py-2">
                  <p className="text-[9px] font-black uppercase tracking-normal text-slate-500">Captions</p>
                  {segmentCaptions.length ? (
                    <div className="mt-1 space-y-1">
                      {segmentCaptions.slice(0, 3).map((caption, captionIndex) => (
                        <p key={caption.id || caption.captionId || `caption-${caption.start || caption.timelineStart || captionIndex}`} className="truncate text-xs font-semibold text-slate-300">
                          {timeRange(caption)} | {captionText(caption)}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs font-semibold text-slate-500">No captions overlap this pick.</p>
                  )}
                </div>
                <div className="mt-2 flex min-w-0 flex-wrap gap-1.5">
                  {segment.sceneId && <span className="max-w-full truncate rounded bg-cyan-300/10 px-2 py-1 text-[10px] font-black text-cyan-100">{segment.sceneId}</span>}
                  {segment.nodeId && <span className="max-w-full truncate rounded bg-purple-300/10 px-2 py-1 text-[10px] font-black text-purple-100">{segment.nodeId}</span>}
                  {segment.locked && <span className="rounded bg-emerald-300/10 px-2 py-1 text-[10px] font-black text-emerald-100">locked</span>}
                  <span className="rounded bg-white/10 px-2 py-1 text-[10px] font-black text-slate-300">{formatSecondsShort(numberValue(segment.sourceEnd, 0) - numberValue(segment.sourceStart, 0))}s</span>
                </div>
              </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="mt-3 rounded-md border border-white/10 bg-slate-950 px-3 py-4 text-sm font-semibold text-slate-400">
          Edit decisions will appear after candidate ranking completes.
        </div>
      )}
    </section>
  );
}

function CandidateCaptionWorkbench({ candidate, candidateEditDraft, onRemoveCaption }) {
  const draftActive = candidateEditDraft?.candidateId === idOf(candidate);
  const captions = draftActive ? arrayValue(candidateEditDraft.captions) : candidateCaptions(candidate);
  const firstCaption = captions[0];
  const captionStatus = captions.length ? "READY" : "WARN";
  return (
    <section className="min-w-0 rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-normal text-purple-200">Caption Layout</p>
          <h3 className="mt-1 truncate text-base font-black text-white sm:text-lg">{captions.length ? `${captions.length} timed captions` : "Captions pending"}</h3>
        </div>
        <StatusPill status={captionStatus} />
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <div className="relative mx-auto aspect-[9/16] w-full max-w-[12rem] overflow-hidden rounded-lg border border-white/10 bg-slate-950">
          <div className="absolute inset-x-[11%] top-[12%] bottom-[16%] rounded border border-dashed border-white/20" />
          <div className="absolute inset-x-[8%] bottom-[13%] rounded-md bg-black/70 px-2 py-2 text-center text-xs font-black leading-5 text-white">
            {captionText(firstCaption) || "Caption safe zone"}
          </div>
        </div>
        <div className="grid max-h-[28rem] content-start gap-2 overflow-y-auto pr-1">
          {captions.length ? captions.map((caption, index) => (
            <div key={caption.id || caption.captionId || `caption-${caption.start || caption.timelineStart || index}`} className="rounded-md border border-white/10 bg-slate-950 px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-black uppercase tracking-normal text-slate-500">{timeRange(caption)}</p>
                  <span className="mt-1 inline-flex rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-300">{caption.style || caption.placement || "lower"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveCaption?.(caption.id || caption.captionId)}
                  className="creator-control grid h-7 w-7 shrink-0 place-items-center text-rose-100"
                  title="Remove caption"
                  aria-label="Remove caption"
                >
                  <XCircle size={13} />
                </button>
              </div>
              <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-slate-200">{captionText(caption)}</p>
            </div>
          )) : (
            <div className="rounded-md border border-white/10 bg-slate-950 px-3 py-4 text-sm font-semibold text-slate-400">
              Caption plan will appear after caption planning and critic stages complete.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CandidateQueuePanel({ candidates, selectedCandidateId, onSelectCandidate }) {
  return (
    <aside className="order-first min-w-0 rounded-lg border border-white/10 bg-black/25 p-3 2xl:order-none 2xl:sticky 2xl:top-5 2xl:self-start">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-normal text-purple-200">Candidate Queue</p>
          <p className="mt-1 truncate text-sm font-extrabold text-white">{candidates.length} ranked shorts</p>
        </div>
        <Scissors size={16} className="text-purple-200" />
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 pr-1 2xl:block 2xl:max-h-[42rem] 2xl:space-y-2 2xl:overflow-y-auto 2xl:pb-0">
        {candidates.map((candidate, index) => (
          <CandidateCard
            key={idOf(candidate) || `candidate-card-${index}`}
            candidate={candidate}
            rank={index + 1}
            active={idOf(candidate) === selectedCandidateId}
            onSelect={() => onSelectCandidate(idOf(candidate))}
          />
        ))}
      </div>
    </aside>
  );
}

function emptyCandidateEditDraft() {
  return {
    candidateId: "",
    segments: [],
    captions: [],
    removedSegmentIds: [],
    removedCaptionIds: [],
    retentionPlan: [],
    dirty: false,
    timelineDirty: false,
    captionsDirty: false,
    retentionDirty: false,
  };
}

function candidateEditDraftFrom(candidate) {
  if (!candidate) return emptyCandidateEditDraft();
  return {
    candidateId: idOf(candidate),
    segments: candidateSegments(candidate),
    captions: candidateCaptions(candidate),
    removedSegmentIds: [],
    removedCaptionIds: [],
    retentionPlan: candidateRetentionPlan(candidate),
    dirty: false,
    timelineDirty: false,
    captionsDirty: false,
    retentionDirty: false,
  };
}

function candidateManualEditPayload(candidate, draft) {
  const segments = normalizeDraftSegments(arrayValue(draft?.segments));
  const captions = arrayValue(draft?.captions).map(captionPayload);
  const retentionPlan = arrayValue(draft?.retentionPlan).map(retentionEffectPayload);
  return {
    source: draft?.manualStoryline ? "manual_storyline_scene_picker" : "candidate_workspace_final_cut_editor",
    graphNodeId: candidate?.graphNodeId || candidate?.metadata?.graphNodeId || `short-${idOf(candidate)}`,
    candidateId: idOf(candidate),
    intent: String(draft?.manualStoryline || "").slice(0, 700),
    manualStoryline: draft?.manualStoryline || "",
    storylineReason: draft?.storylineReason || "",
    storylineMatches: arrayValue(draft?.storylineMatches),
    deleteFramesAndVoiceTogether: true,
    preserveSourceContext: true,
    segments: segments.map(segmentPayload),
    captions,
    captionPlan: {
      ...(candidate?.captionPlan || {}),
      captions,
      humanEdited: true,
      source: "candidate_workspace_final_cut_editor",
    },
    retentionPlan,
    manualRetentionPlan: retentionPlan,
    removedSegmentIds: arrayValue(draft?.removedSegmentIds),
    removedCaptionIds: arrayValue(draft?.removedCaptionIds),
    timelineDurationSeconds: roundSeconds(totalDraftDuration(segments)),
    updatedAt: new Date().toISOString(),
  };
}

function segmentPayload(segment = {}) {
  return {
    segmentId: segment.segmentId || segment.id || "",
    nodeId: segment.nodeId || "",
    sceneId: segment.sceneId || "",
    sourceStart: numberValue(segment.sourceStart, 0),
    sourceEnd: numberValue(segment.sourceEnd, numberValue(segment.sourceStart, 0) + 0.1),
    originalSourceStart: numberValue(segment.originalSourceStart, numberValue(segment.sourceStart, 0)),
    originalSourceEnd: numberValue(segment.originalSourceEnd, numberValue(segment.sourceEnd, 0)),
    timelineStart: numberValue(segment.timelineStart, 0),
    timelineEnd: numberValue(segment.timelineEnd, 0),
    locked: true,
  };
}

function captionPayload(caption = {}) {
  return {
    ...caption,
    id: caption.id || caption.captionId || "",
    start: numberValue(caption.start ?? caption.sourceStart ?? caption.timelineStart, 0),
    end: numberValue(caption.end ?? caption.sourceEnd ?? caption.timelineEnd, 0),
    text: captionText(caption),
    humanEdited: true,
  };
}

function retentionEffectPayload(effect = {}) {
  const start = Math.max(0, numberValue(effect.start ?? effect.timelineStart, 0));
  const end = Math.max(start + 0.25, numberValue(effect.end ?? effect.timelineEnd, start + 2.4));
  const type = normalizeStage(effect.type || "PUNCH_ZOOM");
  return {
    id: effect.id || effect.effectId || `retention-${start}`,
    type,
    start: roundSeconds(start),
    end: roundSeconds(end),
    text: String(effect.text || "").slice(0, 120),
    reason: effect.reason || "Manual retention effect",
    instruction: effect.instruction || retentionInstructionFor(type),
    intensity: Math.max(0, Math.min(1, numberValue(effect.intensity, 0.65))),
    manual: true,
  };
}

function retentionInstructionFor(type = "PUNCH_ZOOM") {
  const normalized = normalizeStage(type);
  if (normalized === "TEXT_POP") return "Show a short text pop over the selected time window.";
  if (normalized === "B_ROLL") return "Mark this point for a visual cutaway or source-frame change.";
  if (normalized === "HIGHLIGHT") return "Add a visual emphasis marker for this moment.";
  if (normalized === "ZOOM_OUT") return "Apply a subtle zoom-out style crop change.";
  if (normalized === "ZOOM_IN") return "Apply a subtle zoom-in style crop change.";
  return "Apply a punch zoom crop change for a pattern interrupt.";
}

function uniqueStrings(values = []) {
  return Array.from(new Set(arrayValue(values).map(String).filter(Boolean)));
}

function captionOverlapsSegment(caption = {}, segment = {}) {
  const captionStart = numberValue(caption.start ?? caption.sourceStart ?? caption.timelineStart, 0);
  const captionEnd = Math.max(captionStart + 0.1, numberValue(caption.end ?? caption.sourceEnd ?? caption.timelineEnd, captionStart + 0.1));
  const sourceStart = numberValue(segment.sourceStart, 0);
  const sourceEnd = Math.max(sourceStart + 0.1, numberValue(segment.sourceEnd, sourceStart + 0.1));
  const timelineStart = numberValue(segment.timelineStart, sourceStart);
  const timelineEnd = Math.max(timelineStart + 0.1, numberValue(segment.timelineEnd, timelineStart + 0.1));
  return rangesOverlap(captionStart, captionEnd, sourceStart, sourceEnd) || rangesOverlap(captionStart, captionEnd, timelineStart, timelineEnd);
}

function captionsForSegment(captions = [], segment = {}) {
  return arrayValue(captions).filter((caption) => captionOverlapsSegment(caption, segment));
}

function rangesOverlap(leftStart, leftEnd, rightStart, rightEnd) {
  return leftStart < rightEnd && leftEnd > rightStart;
}

function candidateStorylineText(candidate = {}) {
  const metadata = candidate?.metadata || {};
  const intent = firstObject(metadata.storyIntent, metadata.compressionPlanMetadata?.storyIntent, candidate.storyIntent);
  const hookPlan = firstObject(metadata.hookPlan, candidate.hookPlan);
  return [
    intent.humanIntent,
    intent.viewerIntent,
    intent.storyPromise,
    intent.intent,
    hookPlan.openingLine,
    hookPlan.hook,
    candidate.title,
  ].map((item) => String(item || "").trim()).find(Boolean) || "";
}

function candidateStoryGenerationReason(candidate = {}) {
  const metadata = candidate?.metadata || {};
  const edl = candidate?.editDecisionList || {};
  const intent = firstObject(metadata.storyIntent, metadata.compressionPlanMetadata?.storyIntent, candidate.storyIntent);
  const reason = metadata.storylineReason
    || metadata.selectionReason
    || metadata.rankingReason
    || intent.reason
    || edl.reason
    || edl.strategy
    || metadata.chain
    || "Generated from ranked transcript/story nodes, scene continuity, hook strength, and target duration fit.";
  const score = candidate?.score ? ` Score ${formatScore(candidate.score)}.` : "";
  return `${reason}${score}`;
}

function candidateTranscriptRows(candidate = {}, sourceTranscript = []) {
  const segments = candidateSegments(candidate);
  const sourceNodes = normalizeTranscriptNodes(sourceTranscript);
  if (!segments.length) return sourceNodes.slice(0, 80);
  const rows = [];
  segments.forEach((segment, index) => {
    const directText = segmentTranscriptText(segment);
    const nodeMatches = sourceNodes.filter((node) => {
      const sameNode = segment.nodeId && node.id === segment.nodeId;
      const sameScene = segment.sceneId && node.sceneId === segment.sceneId;
      const overlaps = rangesOverlap(
        numberValue(node.start, 0),
        numberValue(node.end, 0),
        numberValue(segment.sourceStart, 0),
        numberValue(segment.sourceEnd, 0)
      );
      return sameNode || sameScene || overlaps;
    });
    if (nodeMatches.length) {
      nodeMatches.forEach((node) => rows.push({
        ...node,
        segmentId: segment.segmentId,
        segmentLabel: segment.label,
      }));
      return;
    }
    if (directText) {
      rows.push({
        id: `candidate-transcript-${index + 1}`,
        segmentId: segment.segmentId,
        speaker: segment.speaker || "Segment",
        start: numberValue(segment.timelineStart, numberValue(segment.sourceStart, index)),
        end: numberValue(segment.timelineEnd, numberValue(segment.sourceEnd, index + 1)),
        transcript: directText,
      });
    }
  });
  return rows.length ? rows.slice(0, 120) : sourceNodes.slice(0, 80);
}

function matchStorylineToTimeline(storyline, sceneTimeline, sourceTranscript, candidate) {
  const tokens = keywordTokens(storyline);
  const options = sourceTimelineOptions(sceneTimeline, sourceTranscript, candidate);
  if (!options.length) return [];
  return options
    .map((option) => {
      const evidenceTokens = keywordTokens([option.sceneLabel, option.transcript, option.visualSummary, option.reasonSeed].join(" "));
      const matched = tokens.filter((token) => evidenceTokens.includes(token));
      const overlapScore = tokens.length ? matched.length / Math.max(4, tokens.length) : 0;
      const duration = Math.max(0.1, numberValue(option.segment.sourceEnd, 0) - numberValue(option.segment.sourceStart, 0));
      const durationFit = duration >= 1.2 && duration <= 18 ? 0.12 : 0.04;
      const score = Math.max(0.05, Math.min(1, overlapScore + durationFit + Math.min(0.12, numberValue(option.segment.interestingness, 0) / 800)));
      return {
        ...option,
        score,
        reason: matched.length
          ? `Matched ${matched.slice(0, 6).join(", ")} in transcript or scene evidence.`
          : "Included as nearby timeline evidence; no strong keyword overlap.",
      };
    })
    .sort((left, right) => right.score - left.score || numberValue(left.segment.sourceStart, 0) - numberValue(right.segment.sourceStart, 0));
}

function sourceTimelineOptions(sceneTimeline, sourceTranscript, candidate) {
  const scenes = arrayValue(sceneTimeline?.scenes);
  const transcriptNodes = normalizeTranscriptNodes(sourceTranscript);
  if (scenes.length) {
    return scenes.map((scene, index) => optionFromScene(scene, transcriptNodes, index));
  }
  if (transcriptNodes.length) {
    return transcriptNodes.map((node, index) => optionFromTranscriptNode(node, index));
  }
  return candidateSegments(candidate).map((segment, index) => ({
    id: segment.segmentId || `candidate-segment-${index + 1}`,
    sceneId: segment.sceneId || "",
    nodeId: segment.nodeId || "",
    sceneLabel: segment.label || `Candidate segment ${index + 1}`,
    transcript: segmentTranscriptText(segment),
    visualSummary: segment.reason || segment.summary || "",
    reasonSeed: segment.reason || segment.summary || "",
    segment,
  }));
}

function optionFromScene(scene = {}, transcriptNodes = [], index = 0) {
  const start = numberValue(scene.start ?? scene.sourceStart, index);
  const end = Math.max(start + 0.1, numberValue(scene.end ?? scene.sourceEnd, start + 1));
  const sceneId = scene.id || scene.sceneId || `scene-${index + 1}`;
  const sceneTranscript = arrayValue(scene.transcript).length
    ? arrayValue(scene.transcript)
    : transcriptNodes.filter((node) => numberValue(node.end, 0) >= start && numberValue(node.start, 0) <= end);
  const transcript = sceneTranscript.map((node) => node.transcript || node.text || node.summary || "").filter(Boolean).join(" ");
  const frames = arrayValue(scene.frames).length ? arrayValue(scene.frames) : arrayValue(scene.frameIds);
  const firstNode = sceneTranscript[0] || {};
  const label = scene.label || `Scene ${index + 1}`;
  const visualSummary = selectedSceneSummary(scene);
  const segment = normalizeDraftSegments([{
    segmentId: `source-scene-${sceneId}`,
    nodeId: firstNode.id || firstNode.nodeId || "",
    sceneId,
    label,
    sourceStart: start,
    sourceEnd: end,
    originalSourceStart: start,
    originalSourceEnd: end,
    transcript,
    summary: visualSummary,
    frames,
    transcriptNodes: sceneTranscript,
    interestingness: averageInterestingness(sceneTranscript),
    source: "manual_storyline_scene_timeline",
  }])[0];
  return {
    id: segment.segmentId,
    sceneId,
    nodeId: segment.nodeId,
    sceneLabel: label,
    transcript,
    visualSummary,
    reasonSeed: [visualSummary, scene?.visualAnalysis?.source, scene?.continuity?.notes].filter(Boolean).join(" "),
    segment,
  };
}

function optionFromTranscriptNode(node = {}, index = 0) {
  const start = numberValue(node.start, index);
  const end = Math.max(start + 0.1, numberValue(node.end, start + 1));
  const segment = normalizeDraftSegments([{
    segmentId: `source-node-${node.id || index + 1}`,
    nodeId: node.id || node.nodeId || "",
    sceneId: node.sceneId || "",
    label: node.speaker || node.role || `Dialogue ${index + 1}`,
    sourceStart: start,
    sourceEnd: end,
    originalSourceStart: start,
    originalSourceEnd: end,
    transcript: node.transcript || node.text || node.summary || "",
    frames: arrayValue(node.frames),
    transcriptNodes: [node],
    interestingness: numberValue(node.interestingness ?? node.interestingnessScore, 0),
    source: "manual_storyline_transcript_timeline",
  }])[0];
  return {
    id: segment.segmentId,
    sceneId: segment.sceneId,
    nodeId: segment.nodeId,
    sceneLabel: segment.label,
    transcript: segment.transcript,
    visualSummary: node.summary || "",
    reasonSeed: [node.speaker, node.role, node.summary].filter(Boolean).join(" "),
    segment,
  };
}

function averageInterestingness(nodes = []) {
  const values = arrayValue(nodes).map((node) => numberValue(node.interestingness ?? node.interestingnessScore, 0)).filter((value) => value > 0);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 42;
}

function keywordTokens(value) {
  const stop = new Set(["the", "and", "that", "this", "with", "from", "into", "they", "them", "their", "there", "then", "than", "for", "you", "your", "are", "was", "were", "but", "not", "can", "will", "about", "because", "how", "why", "what", "when", "where", "who", "short", "story"]);
  return Array.from(new Set(String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !stop.has(token))));
}

function storylineAcceptReason(storyline, matches) {
  const count = arrayValue(matches).length;
  const duration = totalDraftDuration(arrayValue(matches).map((match) => match.segment));
  if (!String(storyline || "").trim()) return "Write a storyline to detect source scenes.";
  if (!count) return "No source scenes selected yet.";
  return `${count} source scenes selected for ${formatSecondsShort(duration)}s based on transcript and scene evidence.`;
}

function loadFabricLibrary() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Fabric.js is only available in the browser."));
  }
  if (window.fabric) {
    return Promise.resolve(window.fabric);
  }
  if (fabricLibraryPromise) {
    return fabricLibraryPromise;
  }
  fabricLibraryPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-editor-library="fabric"]`);
    if (existing) {
      existing.addEventListener("load", () => window.fabric ? resolve(window.fabric) : reject(new Error("Fabric.js loaded without a fabric global.")), { once: true });
      existing.addEventListener("error", () => reject(new Error("Could not load Fabric.js.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = FABRIC_CDN_URL;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.editorLibrary = "fabric";
    script.onload = () => window.fabric ? resolve(window.fabric) : reject(new Error("Fabric.js loaded without a fabric global."));
    script.onerror = () => reject(new Error("Could not load Fabric.js."));
    document.head.appendChild(script);
  });
  return fabricLibraryPromise;
}

function syncFabricObjects(fabricCanvas, overlays = [], selectedOverlayId = "", syncingRef = null) {
  if (!fabricCanvas || !window.fabric) return;
  const width = Math.max(1, fabricCanvas.getWidth());
  const height = Math.max(1, fabricCanvas.getHeight());
  const overlayIds = new Set(arrayValue(overlays).map((overlay) => overlay.id));
  const existing = new Map();
  fabricCanvas.getObjects().forEach((object) => {
    if (object.overlayId) existing.set(object.overlayId, object);
  });
  if (syncingRef) syncingRef.current = true;
  try {
    arrayValue(overlays).forEach((overlay) => {
      let object = existing.get(overlay.id);
      if (!object) {
        object = fabricObjectForOverlay(overlay);
        fabricCanvas.add(object);
      }
      updateFabricObject(object, overlay, width, height);
    });
    fabricCanvas.getObjects().forEach((object) => {
      if (object.overlayId && !overlayIds.has(object.overlayId)) {
        fabricCanvas.remove(object);
      }
    });
    const selected = selectedOverlayId
      ? fabricCanvas.getObjects().find((object) => object.overlayId === selectedOverlayId)
      : null;
    if (selected && fabricCanvas.getActiveObject() !== selected) {
      fabricCanvas.setActiveObject(selected);
    } else if (!selectedOverlayId) {
      fabricCanvas.discardActiveObject();
    }
    fabricCanvas.requestRenderAll();
  } finally {
    if (syncingRef) {
      window.setTimeout(() => {
        syncingRef.current = false;
      }, 0);
    }
  }
}

function fabricObjectForOverlay(overlay = {}) {
  const fabric = window.fabric;
  const common = {
    overlayId: overlay.id,
    hasRotatingPoint: true,
    transparentCorners: false,
    cornerColor: overlay.color || "#22d3ee",
    borderColor: overlay.color || "#22d3ee",
    cornerSize: 8,
  };
  if (overlay.type === "text") {
    const object = new fabric.Textbox(overlay.text || overlay.label || "Text", {
      ...common,
      fill: "#ffffff",
      fontFamily: "Inter, Arial, sans-serif",
      fontWeight: "700",
      textAlign: "center",
      backgroundColor: "rgba(0,0,0,0.48)",
      padding: 8,
    });
    object.overlayId = overlay.id;
    return object;
  }
  const object = new fabric.Rect({
    ...common,
    fill: "rgba(8,145,178,0.08)",
    stroke: overlay.color || "#22d3ee",
    strokeWidth: 2,
    rx: 8,
    ry: 8,
  });
  object.overlayId = overlay.id;
  return object;
}

function updateFabricObject(object, overlay = {}, canvasWidth = 1, canvasHeight = 1) {
  const left = numberValue(overlay.x, 0) * canvasWidth;
  const top = numberValue(overlay.y, 0) * canvasHeight;
  const width = Math.max(16, numberValue(overlay.width, 0.2) * canvasWidth);
  const height = Math.max(16, numberValue(overlay.height, 0.15) * canvasHeight);
  object.set({
    left,
    top,
    originX: "left",
    originY: "top",
    borderColor: overlay.color || "#22d3ee",
    cornerColor: overlay.color || "#22d3ee",
  });
  if (object.type === "textbox") {
    object.set({
      text: overlay.text || overlay.label || "Text",
      width,
      fontSize: clampNumber(height * 0.34, 12, 28),
      fill: "#ffffff",
      backgroundColor: "rgba(0,0,0,0.48)",
      scaleX: 1,
      scaleY: 1,
    });
    return;
  }
  object.set({
    width,
    height,
    fill: overlay.type === "focus" ? "rgba(8,145,178,0.08)" : "rgba(0,0,0,0.18)",
    stroke: overlay.color || "#22d3ee",
    scaleX: 1,
    scaleY: 1,
  });
}

function defaultCanvasOverlays() {
  return [
    {
      id: "safe-frame",
      type: "focus",
      label: "Mobile crop",
      x: 0.32,
      y: 0.08,
      width: 0.36,
      height: 0.84,
      color: "#22d3ee",
    },
  ];
}

function textOverlayForClip(clip = {}, text = "Text overlay") {
  const clipId = clip.clipId || clip.id || "clip";
  return {
    id: `text-${clipId}`,
    type: "text",
    label: text,
    text,
    x: 0.18,
    y: 0.72,
    width: 0.64,
    height: 0.13,
    color: "#facc15",
  };
}

function focusOverlayForClip(clip = {}) {
  const clipId = clip.clipId || clip.id || "clip";
  return {
    id: `focus-${clipId}`,
    type: "focus",
    label: "Zoom focus",
    x: 0.28,
    y: 0.16,
    width: 0.44,
    height: 0.58,
    color: "#34d399",
  };
}

function drawEditorOverlay(ctx, overlay = {}, width = 1, height = 1, selected = false) {
  const x = numberValue(overlay.x, 0) * width;
  const y = numberValue(overlay.y, 0) * height;
  const w = Math.max(8, numberValue(overlay.width, 0.2) * width);
  const h = Math.max(8, numberValue(overlay.height, 0.15) * height);
  const color = overlay.color || (overlay.type === "text" ? "#facc15" : "#22d3ee");
  ctx.save();
  ctx.lineWidth = selected ? 3 : 2;
  ctx.strokeStyle = color;
  ctx.fillStyle = overlay.type === "text" ? "rgba(0,0,0,0.48)" : "rgba(8,145,178,0.08)";
  roundRectPath(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${Math.max(11, Math.min(18, h * 0.3))}px Inter, ui-sans-serif, system-ui`;
  ctx.textBaseline = "middle";
  const label = overlay.type === "text" ? (overlay.text || overlay.label || "Text") : (overlay.label || "Focus");
  ctx.fillText(truncateCanvasText(ctx, label, w - 18), x + 9, y + h / 2);
  if (selected) {
    ctx.fillStyle = color;
    const handles = [
      [x, y],
      [x + w, y],
      [x, y + h],
      [x + w, y + h],
    ];
    handles.forEach(([handleX, handleY]) => {
      ctx.beginPath();
      ctx.arc(handleX, handleY, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  ctx.restore();
}

function pointInsideOverlay(point, overlay = {}) {
  const x = numberValue(overlay.x, 0) * point.width;
  const y = numberValue(overlay.y, 0) * point.height;
  const w = numberValue(overlay.width, 0.2) * point.width;
  const h = numberValue(overlay.height, 0.15) * point.height;
  return point.x >= x && point.x <= x + w && point.y >= y && point.y <= y + h;
}

function roundRectPath(ctx, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
}

function truncateCanvasText(ctx, text, maxWidth) {
  const value = String(text || "");
  if (ctx.measureText(value).width <= maxWidth) return value;
  let next = value;
  while (next.length > 1 && ctx.measureText(`${next}...`).width > maxWidth) {
    next = next.slice(0, -1);
  }
  return `${next}...`;
}

function filmoraMediaAssets(ingestion = {}, tracks = []) {
  const assets = [];
  arrayValue(tracks).forEach((track) => {
    const trackType = String(track.type || track.trackId || "").toUpperCase();
    arrayValue(track.clips).forEach((clip, index) => {
      const start = canvasClipStart(clip, index);
      const end = canvasClipEnd(clip, start);
      assets.push({
        id: `${track.trackId || "track"}-${clip.clipId || clip.id || index}`,
        type: trackType.includes("THUMB") ? "thumbnail" : trackType.includes("SCENE") ? "scene" : titleizeToken(track.type || "clip"),
        label: canvasClipLabel(clip),
        thumbnailUrl: clip.thumbnailUrl || "",
        time: `${formatTimestamp(start)} - ${formatTimestamp(end)}`,
        clip: { ...clip, trackId: track.trackId },
        track,
      });
    });
  });
  if (assets.length) return assets;
  return arrayValue(ingestion?.sourceParts).map((part, index) => ({
    id: `source-part-${part.partNumber || index + 1}`,
    type: "source part",
    label: `Part ${part.partNumber || index + 1}`,
    thumbnailUrl: "",
    time: `${formatTimestamp(numberValue(part.start, 0))} - ${formatTimestamp(numberValue(part.end, 0))}`,
    clip: null,
    track: null,
  }));
}

function buildClientEditPayload(ingestion = {}, tracks = [], overlays = [], selectedClip = null) {
  const project = timelineProjectFromIngestion(ingestion);
  const normalizedTracks = arrayValue(tracks).map((track) => ({
    trackId: track.trackId || track.id || "",
    type: track.type || track.trackType || "",
    label: track.label || canvasTrackLabel(track),
    clips: arrayValue(track.clips).map((clip, index) => {
      const start = canvasClipStart(clip, index);
      const end = canvasClipEnd(clip, start);
      return {
        clipId: clip.clipId || clip.id || `${track.trackId || "track"}-${index + 1}`,
        start,
        end,
        partNumber: clip.partNumber || null,
        timestampSeconds: numberValue(clip.timestampSeconds ?? clip.start, start),
        sourceUrl: clip.sourceUrl || "",
        thumbnailUrl: clip.thumbnailUrl || "",
        layout: clip.layout || defaultLayoutForTrack(track.type),
        purpose: clip.purpose || track.type || "CLIP",
        caption: clip.caption || clip.text || "",
        effects: arrayValue(clip.effects),
        transitionIn: firstObject(clip.transitionIn),
        transitionOut: firstObject(clip.transitionOut),
        ambientLighting: firstObject(clip.ambientLighting),
        aiSuggestedRecipe: firstObject(clip.aiSuggestedRecipe),
        assets: arrayValue(clip.assets),
        editable: clip.editable !== false,
      };
    }),
  }));
  return {
    project: {
      projectId: ingestion?.videoId || project?.project?.projectId || "",
      title: ingestion?.title || project?.project?.title || "Browser edit",
      source: "filmora_style_browser_editor",
      renderMode: "CLIENT_SIDE",
      editorLibrary: "fabric.js",
      updatedAt: new Date().toISOString(),
    },
    masterVideo: firstObject(ingestion?.masterVideo, project?.masterVideo),
    tracks: normalizedTracks,
    storyShots: firstObject(
      ingestion?.timelineProject?.storyShots,
      ingestion?.metadata?.timelineIngestion?.storyShots,
      ingestion?.metadata?.storyShotsSnapshot
    ),
    overlays: arrayValue(overlays).map((overlay) => ({
      id: overlay.id,
      type: overlay.type,
      label: overlay.label || "",
      text: overlay.text || "",
      x: round3(numberValue(overlay.x, 0)),
      y: round3(numberValue(overlay.y, 0)),
      width: round3(numberValue(overlay.width, 0)),
      height: round3(numberValue(overlay.height, 0)),
      color: overlay.color || "",
    })),
    effectLibrary: {
      transitions: transitionPresets,
      effects: clipEffectPresets,
      ambientLighting: ambientLightingPresets,
      smartRecipesEnabled: true,
      renderMapping: "client_side_renderer_or_ffmpeg_wasm_can_map_metadata_to_actual_transition_effect_lighting",
    },
    selectedClipId: selectedClip?.clipId || selectedClip?.id || "",
    downstreamUse: {
      generateShortsFromTimeline: true,
      backendRenderingRequired: false,
      clientSideRenderPreferred: true,
    },
  };
}

function mergeEffectPresets(existing = [], ...nextEffects) {
  const merged = [];
  [...arrayValue(existing), ...nextEffects].forEach((effect) => {
    const item = typeof effect === "string" ? { type: effect } : firstObject(effect);
    const type = String(item.type || item.effect || "").toUpperCase();
    if (!type) return;
    const index = merged.findIndex((entry) => String(entry.type || "").toUpperCase() === type);
    if (index >= 0) {
      merged[index] = { ...merged[index], ...item, type };
    } else {
      merged.push({ ...item, type });
    }
  });
  return merged;
}

function activeEffect(clip = {}, presetId = "") {
  const id = String(presetId || "").toUpperCase();
  return arrayValue(clip?.effects).some((effect) => String(effect?.type || effect || "").toUpperCase() === id);
}

function activeTransition(clip = {}, presetId = "") {
  const id = String(presetId || "").toUpperCase();
  return String(clip?.transitionPresetId || clip?.transitionOut?.type || "").toUpperCase() === id;
}

function smartEffectRecipeForClip(clip = {}) {
  const purpose = String(clip.purpose || clip.sceneType || "").toUpperCase();
  const text = `${clip.caption || ""} ${clip.label || ""} ${clip.transcript || ""}`.toLowerCase();
  const attention = numberValue(clip.attentionScore ?? clip.importance, text.includes("?") ? 0.7 : 0.5);
  const isHook = purpose.includes("HOOK") || attention >= 0.72;
  const isEvidence = purpose.includes("EVIDENCE") || purpose.includes("PROOF") || text.includes("proof") || text.includes("source");
  const isReveal = purpose.includes("REVEAL") || text.includes("but") || text.includes("changed") || text.includes("decision");
  const transitionPreset = isReveal
    ? presetById(transitionPresets, "WHITE_FLASH")
    : isEvidence
      ? presetById(transitionPresets, "SWIPE_TRANSITION")
      : isHook
        ? presetById(transitionPresets, "GLITCH_TRANSITION")
        : presetById(transitionPresets, "BLUR_TRANSITION");
  const effectPreset = isEvidence
    ? presetById(clipEffectPresets, "HIGHLIGHT_PULSE")
    : isReveal
      ? presetById(clipEffectPresets, "QUOTE_POP")
      : isHook
        ? presetById(clipEffectPresets, "PUNCH_ZOOM")
        : presetById(clipEffectPresets, "SPEED_RAMP");
  const ambientPreset = isEvidence
    ? presetById(ambientLightingPresets, "EVIDENCE_SPOT")
    : isReveal
      ? presetById(ambientLightingPresets, "VIRAL_NEON")
      : purpose.includes("DOCUMENTARY")
        ? presetById(ambientLightingPresets, "DOCUMENTARY_WARM")
        : presetById(ambientLightingPresets, "NEWS_COOL");
  return {
    transitionIn: transitionPreset.transition,
    transitionOut: transitionPreset.transition,
    effects: [effectPreset.effect],
    ambientLighting: ambientPreset.lighting,
    ambientLightingPresetId: ambientPreset.id,
    metadata: {
      source: "client_smart_effect_recipe",
      reason: isEvidence ? "evidence/proof section" : isReveal ? "reveal or contrast section" : isHook ? "high-attention hook" : "maintain pacing",
      confidence: round3(Math.max(0.62, Math.min(0.94, attention))),
      generatedAt: new Date().toISOString(),
    },
  };
}

function presetById(presets = [], id = "") {
  return presets.find((preset) => preset.id === id) || presets[0] || {};
}

function ambientLightingPreviewStyle(lighting = {}) {
  const safe = firstObject(lighting);
  const opacity = clampNumber(numberValue(safe.opacity, 0), 0, 0.35);
  if (!opacity || String(safe.type || "").toUpperCase() === "NONE") {
    return { display: "none" };
  }
  const color = safe.color || "#38bdf8";
  const secondary = safe.secondaryColor || "#ffffff";
  const vignette = clampNumber(numberValue(safe.vignette, 0.24), 0, 0.6);
  return {
    background: `linear-gradient(135deg, ${color} 0%, transparent 38%, ${secondary} 100%)`,
    opacity,
    mixBlendMode: "screen",
    boxShadow: `inset 0 0 ${Math.round(120 * vignette)}px rgba(0,0,0,${vignette})`,
  };
}

function timelineProgress(ingestion = {}, uploadProgress = null) {
  if (uploadProgress?.status === "ERROR") return 0;
  const expected = Math.max(1, numberValue(ingestion?.expectedParts, 1));
  const received = clampNumber(numberValue(ingestion?.receivedParts, 0), 0, expected);
  const processed = clampNumber(numberValue(ingestion?.processedParts, 0), 0, expected);
  const uploadPercent = clampNumber(numberValue(uploadProgress?.percent, 0), 0, 100);
  const computed = Math.max(uploadPercent * 0.45, (received / expected) * 45 + (processed / expected) * 55);
  return clampNumber(computed, 0, 100);
}

function timelineProjectFromIngestion(ingestion = {}) {
  return firstObject(
    ingestion?.timelineProject,
    ingestion?.metadata?.timelineIngestionProject,
    ingestion?.metadata?.timelineIngestion?.timelineProject
  );
}

function timelineStageStates(ingestion = {}) {
  return firstObject(
    ingestion?.timelineProject?.stageStates,
    ingestion?.metadata?.timelineIngestion?.stageStates,
    ingestion?.metadata?.timelineIngestionProject?.stageStates
  );
}

function stageStateFor(stageStates = {}, key = "") {
  return firstObject(stageStates?.[key]);
}

function runningStage(state = {}) {
  const status = String(state?.status || "").toUpperCase();
  return status === "RUNNING" || status === "QUEUED" || status === "PROCESSING";
}

function completedStage(state = {}) {
  const status = String(state?.status || "").toUpperCase();
  return status === "COMPLETED" || status === "READY";
}

function timelineProjectTracks(project = {}) {
  return arrayValue(project.tracks).map((track, index) => normalizeCanvasTrack(track, index));
}

function timelineCandidateFromIngestion(ingestion = {}) {
  const project = timelineProjectFromIngestion(ingestion);
  const duration = numberValue(project?.masterVideo?.durationSeconds ?? ingestion?.masterVideo?.durationSeconds, 0);
  return {
    candidateId: ingestion?.videoId ? `timeline-${ingestion.videoId}` : "timeline-ingestion",
    title: ingestion?.title || project?.project?.title || "Editable timeline",
    status: ingestion?.status || "TIMELINE_INGESTING",
    durationSeconds: duration,
    metadata: {
      uiTimelineProject: project,
    },
  };
}

function findClipInTracks(tracks = [], trackId = "", clipId = "") {
  if (!clipId) return null;
  for (const track of arrayValue(tracks)) {
    if (trackId && track.trackId !== trackId) continue;
    const match = arrayValue(track.clips).find((clip) => (clip.clipId || clip.id) === clipId);
    if (match) return { ...match, trackId: track.trackId };
  }
  return null;
}

function firstThumbnailClip(tracks = []) {
  for (const track of arrayValue(tracks)) {
    const isThumbnailTrack = String(track.type || track.trackType || track.trackId || "").toUpperCase().includes("THUMB");
    const match = arrayValue(track.clips).find((clip) => clip.thumbnailUrl || isThumbnailTrack);
    if (match) return { ...match, trackId: track.trackId };
  }
  return null;
}

function firstClipInTracks(tracks = []) {
  for (const track of arrayValue(tracks)) {
    const match = arrayValue(track.clips)[0];
    if (match) return { ...match, trackId: track.trackId };
  }
  return null;
}

function timelinePartForClip(ingestion = {}, clip = {}) {
  const parts = firstArray(
    ingestion?.sourceParts,
    ingestion?.timelineProject?.masterVideo?.sourceParts,
    ingestion?.metadata?.timelineIngestion?.sourceParts
  );
  const partNumber = numberValue(clip.partNumber, 0);
  if (partNumber > 0) {
    const byNumber = parts.find((part) => numberValue(part.partNumber, 0) === partNumber);
    if (byNumber) return byNumber;
  }
  const timestamp = numberValue(clip.timestampSeconds ?? clip.start, 0);
  return parts.find((part) => timestamp >= numberValue(part.start, 0) && timestamp <= numberValue(part.end, Number.MAX_SAFE_INTEGER)) || parts[0] || {};
}

function timelinePartUrl(part = {}, clip = {}) {
  const safePart = part && typeof part === "object" ? part : {};
  const safeClip = clip && typeof clip === "object" ? clip : {};
  return safeClip.sourceUrl || safePart.url || safePart.publicUrl || safePart.signedUrl || "";
}

function updateClipInTracks(tracks = [], trackId = "", clipId = "", patch = {}) {
  return arrayValue(tracks).map((track) => {
    if (trackId && track.trackId !== trackId) return track;
    return {
      ...track,
      clips: arrayValue(track.clips).map((clip) => ((clip.clipId || clip.id) === clipId ? { ...clip, ...patch } : clip)),
    };
  });
}

function splitClipInTracks(tracks = [], trackId = "", clipId = "") {
  return arrayValue(tracks).map((track) => {
    if (trackId && track.trackId !== trackId) return track;
    const nextClips = [];
    arrayValue(track.clips).forEach((clip) => {
      if ((clip.clipId || clip.id) !== clipId) {
        nextClips.push(clip);
        return;
      }
      const start = canvasClipStart(clip, 0);
      const end = canvasClipEnd(clip, start);
      const midpoint = roundSeconds(start + (end - start) / 2);
      if (midpoint <= start + 0.05 || midpoint >= end - 0.05) {
        nextClips.push(clip);
        return;
      }
      nextClips.push({ ...clip, clipId: `${clipId}-a`, end: midpoint, label: `${canvasClipLabel(clip)} A` });
      nextClips.push({ ...clip, clipId: `${clipId}-b`, start: midpoint, localTimestampSeconds: undefined, label: `${canvasClipLabel(clip)} B` });
    });
    return { ...track, clips: nextClips };
  });
}

function deleteClipInTracks(tracks = [], trackId = "", clipId = "") {
  return arrayValue(tracks).map((track) => {
    if (trackId && track.trackId !== trackId) return track;
    return {
      ...track,
      clips: arrayValue(track.clips).filter((clip) => (clip.clipId || clip.id) !== clipId),
    };
  });
}

function addCaptionClipToTracks(tracks = [], sourceClip = {}, text = "New caption") {
  const start = canvasClipStart(sourceClip, 0);
  const end = canvasClipEnd(sourceClip, start);
  const captionClip = {
    clipId: `caption-${sourceClip.clipId || sourceClip.id || Date.now()}`,
    start,
    end,
    layout: "CAPTION",
    purpose: "CAPTION",
    text,
    label: text,
    editable: true,
    regeneratable: true,
  };
  let found = false;
  const next = arrayValue(tracks).map((track) => {
    const isCaption = String(track.type || track.trackId || "").toUpperCase().includes("CAPTION");
    if (!isCaption) return track;
    found = true;
    return { ...track, clips: [...arrayValue(track.clips), captionClip] };
  });
  if (found) return next;
  return [
    ...next,
    {
      trackId: "captions",
      type: "CAPTIONS",
      label: "Captions",
      clips: [captionClip],
    },
  ];
}

function uiTimelineProjectForCandidate(candidate = {}) {
  return firstObject(
    candidate?.metadata?.uiTimelineProject,
    candidate?.uiTimelineProject,
    candidate?.timelineProject,
    candidate?.project
  );
}

function canvasTracksForCandidate(candidate = {}) {
  const project = uiTimelineProjectForCandidate(candidate);
  const projectTracks = arrayValue(project.tracks).map((track, index) => normalizeCanvasTrack(track, index)).filter((track) => track.clips.length);
  if (projectTracks.length) return projectTracks;

  const segments = candidateSegments(candidate);
  const captions = candidateCaptions(candidate);
  const retention = firstArray(
    candidate?.metadata?.retentionOpportunities,
    candidate?.renderManifest?.manualRetentionPlan,
    candidate?.renderManifest?.retentionPlan,
    candidate?.metadata?.retentionPlan
  );
  const tracks = [];
  if (segments.length) {
    tracks.push({
      trackId: "primary_video",
      type: "PRIMARY_VIDEO",
      clips: segments.map((segment, index) => ({
        clipId: segment.segmentId || `primary-${index + 1}`,
        start: numberValue(segment.timelineStart, index),
        end: numberValue(segment.timelineEnd, numberValue(segment.timelineStart, index) + Math.max(0.1, numberValue(segment.sourceEnd, 0) - numberValue(segment.sourceStart, 0))),
        sourceStart: segment.sourceStart,
        sourceEnd: segment.sourceEnd,
        layout: "FULL_SCREEN_SPEAKER",
        purpose: index === 0 ? "HOOK" : "STORY",
        label: segment.label || `Cut ${index + 1}`,
        editable: true,
        regeneratable: true,
        effects: arrayValue(segment.effects),
        assets: arrayValue(segment.assets),
      })),
    });
  }
  if (captions.length) {
    tracks.push({
      trackId: "captions",
      type: "CAPTIONS",
      clips: captions.map((caption, index) => ({
        clipId: caption.id || `caption-${index + 1}`,
        start: numberValue(caption.start, index),
        end: numberValue(caption.end, numberValue(caption.start, index) + 1),
        layout: "CAPTION",
        purpose: "CAPTION",
        text: captionText(caption),
        editable: true,
        regeneratable: true,
      })),
    });
  }
  if (retention.length) {
    tracks.push({
      trackId: "effects",
      type: "EFFECTS",
      clips: retention.map((effect, index) => ({
        clipId: effect.id || effect.effectId || `effect-${index + 1}`,
        start: numberValue(effect.start ?? effect.startTime, index * 2),
        end: numberValue(effect.end ?? effect.endTime, numberValue(effect.start ?? effect.startTime, index * 2) + 1),
        layout: "EFFECT",
        purpose: effect.reason || effect.effect || "RETENTION",
        effects: [effect.effect || effect.type || "PUNCH_ZOOM"],
        editable: true,
        regeneratable: true,
      })),
    });
  }
  return tracks;
}

function normalizeCanvasTrack(track = {}, index = 0) {
  const type = track.type || track.trackType || (index === 0 ? "PRIMARY_VIDEO" : "OVERLAYS");
  return {
    ...track,
    trackId: track.trackId || track.id || `track-${index + 1}`,
    type,
    clips: arrayValue(track.clips).map((clip, clipIndex) => normalizeCanvasClip(clip, clipIndex, type)),
  };
}

function normalizeCanvasClip(clip = {}, index = 0, trackType = "PRIMARY_VIDEO") {
  const start = canvasClipStart(clip, index);
  return {
    ...clip,
    clipId: clip.clipId || clip.id || `${String(trackType).toLowerCase()}-${index + 1}`,
    start,
    end: canvasClipEnd(clip, start),
    layout: clip.layout || defaultLayoutForTrack(trackType),
    purpose: clip.purpose || clip.sceneType || clip.type || trackType,
    editable: clip.editable !== false,
    regeneratable: clip.regeneratable !== false,
    effects: arrayValue(clip.effects),
    assets: arrayValue(clip.assets),
  };
}

function defaultLayoutForTrack(trackType) {
  const normalized = String(trackType || "").toUpperCase();
  if (normalized.includes("CAPTION")) return "CAPTION";
  if (normalized.includes("EFFECT")) return "EFFECT";
  if (normalized.includes("SCREENSHOT")) return "SCREENSHOT_VIEW";
  if (normalized.includes("MAP")) return "MAP_VIEW";
  if (normalized.includes("CHART")) return "STAT_CARD";
  if (normalized.includes("SUPPORTING")) return "FULL_FOOTAGE";
  return "FULL_SCREEN_SPEAKER";
}

function canvasTimelineDuration(tracks = [], candidate = {}) {
  const trackEnd = arrayValue(tracks).reduce((max, track) => {
    const clipEnd = arrayValue(track.clips).reduce((clipMax, clip) => Math.max(clipMax, canvasClipEnd(clip, canvasClipStart(clip, 0))), 0);
    return Math.max(max, clipEnd);
  }, 0);
  return Math.max(0.1, trackEnd, canvasCandidateDuration(candidate));
}

function canvasCandidateDuration(candidate = {}) {
  const segments = candidateSegments(candidate);
  if (segments.length) return Math.max(...segments.map((segment) => numberValue(segment.timelineEnd, 0)));
  return numberValue(candidate?.durationSeconds ?? candidate?.editDecisionList?.actualDurationSeconds, 0);
}

function canvasTimelineMarks(duration) {
  const total = Math.max(0.1, numberValue(duration, 0.1));
  const desired = total <= 35 ? 5 : total <= 75 ? 10 : 15;
  const marks = [];
  for (let second = 0; second <= total + 0.01; second += desired) {
    marks.push(roundSeconds(second));
  }
  if (marks[marks.length - 1] < total) marks.push(roundSeconds(total));
  return marks;
}

function canvasClipStart(clip = {}, fallback = 0) {
  return roundSeconds(numberValue(clip.start ?? clip.timelineStart ?? clip.offsetSeconds, fallback));
}

function canvasClipEnd(clip = {}, start = 0) {
  const duration = numberValue(clip.duration ?? clip.durationSeconds, 0);
  return roundSeconds(Math.max(start + 0.1, numberValue(clip.end ?? clip.timelineEnd, duration ? start + duration : start + 1)));
}

function canvasTrackLabel(track = {}) {
  const raw = track.label || track.name || track.type || track.trackType || track.trackId || "Track";
  return titleizeToken(raw);
}

function canvasClipLabel(clip = {}) {
  const raw = clip.label
    || clip.title
    || clip.purpose
    || clip.sceneType
    || captionText(clip)
    || clip.layout
    || clip.clipId
    || "Clip";
  return titleizeToken(raw);
}

function canvasClipMeta(clip = {}, start = 0, end = 0) {
  const effect = arrayValue(clip.effects)[0];
  const layout = clip.layout ? titleizeToken(clip.layout) : "";
  const duration = `${formatSecondsShort(Math.max(0, end - start))}s`;
  return [duration, layout, effect ? titleizeToken(effect) : ""].filter(Boolean).join(" | ");
}

function canvasDominantLayout(tracks = []) {
  const layouts = arrayValue(tracks).flatMap((track) => arrayValue(track.clips).map((clip) => clip.layout).filter(Boolean));
  return layouts[0] ? titleizeToken(layouts[0]) : "Timeline";
}

function canvasTrackTone(type, index = 0) {
  const normalized = String(type || "").toUpperCase();
  if (normalized.includes("AI_SCENE") || normalized.includes("SCENE")) {
    return { clipClass: "border-cyan-200/40 bg-cyan-300/20 hover:bg-cyan-300/25" };
  }
  if (normalized.includes("THUMB")) {
    return { clipClass: "border-emerald-200/40 bg-emerald-300/20 hover:bg-emerald-300/25" };
  }
  if (normalized.includes("CAPTION")) {
    return { clipClass: "border-yellow-200/35 bg-yellow-300/20 hover:bg-yellow-300/25" };
  }
  if (normalized.includes("EFFECT")) {
    return { clipClass: "border-rose-200/35 bg-rose-300/20 hover:bg-rose-300/25" };
  }
  if (normalized.includes("SUPPORTING") || normalized.includes("FOOTAGE")) {
    return { clipClass: "border-emerald-200/35 bg-emerald-300/20 hover:bg-emerald-300/25" };
  }
  if (normalized.includes("SCREENSHOT") || normalized.includes("DOCUMENT")) {
    return { clipClass: "border-sky-200/35 bg-sky-300/20 hover:bg-sky-300/25" };
  }
  if (normalized.includes("MAP") || normalized.includes("CHART")) {
    return { clipClass: "border-fuchsia-200/35 bg-fuchsia-300/20 hover:bg-fuchsia-300/25" };
  }
  const fallback = [
    "border-cyan-200/35 bg-cyan-300/20 hover:bg-cyan-300/25",
    "border-violet-200/35 bg-violet-300/20 hover:bg-violet-300/25",
    "border-orange-200/35 bg-orange-300/20 hover:bg-orange-300/25",
  ];
  return { clipClass: fallback[index % fallback.length] };
}

function titleizeToken(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function candidateChecks(candidate) {
  const segments = candidateSegments(candidate);
  const captions = candidateCaptions(candidate);
  const renderStatus = candidateRenderStatus(candidate);
  const review = candidateReview(candidate);
  const reviewStatus = review?.status || candidate?.reviewStatus || (candidate ? "READY" : "PENDING");
  return [
    { label: "Render", value: videoUrlFor(candidate) ? "MP4 ready" : renderStatus, status: videoUrlFor(candidate) ? "PASS" : renderStatus, icon: FileVideo },
    { label: "Timeline", value: segments.length ? `${segments.length} segments` : "Missing EDL", status: segments.length ? "PASS" : "WARN", icon: Layers3 },
    { label: "Captions", value: captions.length ? `${captions.length} lines` : "Missing plan", status: captions.length ? "PASS" : "WARN", icon: Captions },
    { label: "Guard", value: arrayValue(review?.issues).length ? `${arrayValue(review?.issues).length} issues` : reviewStatus, status: reviewStatus, icon: ShieldCheck },
  ];
}

function candidateSegments(candidate = {}) {
  const edl = candidate?.editDecisionList || {};
  const rawSegments = firstArray(edl.segments, candidate?.segments, candidate?.timeline?.segments, candidate?.metadata?.segments);
  return normalizeDraftSegments(rawSegments.map((segment, index) => {
    const sourceStart = numberValue(segment?.sourceStart ?? segment?.start ?? segment?.timelineStart, index);
    const sourceEnd = Math.max(sourceStart + 0.1, numberValue(segment?.sourceEnd ?? segment?.end ?? segment?.timelineEnd, sourceStart + 1));
    return {
      ...segment,
      segmentId: segment?.segmentId || segment?.id || `segment-${index + 1}`,
      nodeId: segment?.nodeId || segment?.sourceNodeId || "",
      sceneId: segment?.sceneId || "",
      label: segment?.label || segment?.summary || segment?.transcript || segment?.text || segment?.nodeId || `Segment ${index + 1}`,
      sourceStart,
      sourceEnd,
      originalSourceStart: numberValue(segment?.originalSourceStart, sourceStart),
      originalSourceEnd: numberValue(segment?.originalSourceEnd, sourceEnd),
      frames: arrayValue(segment?.frames),
      interestingness: numberValue(segment?.interestingness ?? segment?.interestingnessScore, 42),
    };
  }));
}

function candidateCaptions(candidate = {}) {
  const captionPlan = candidate?.captionPlan || {};
  const rawCaptions = firstArray(candidate?.renderManifest?.renderCaptions, captionPlan.captions, candidate?.captions, candidate?.metadata?.captions);
  const normalized = rawCaptions.map((caption, index) => {
    if (typeof caption === "string") {
      return { id: `caption-${index + 1}`, start: index * 2, end: index * 2 + 2, text: caption };
    }
    const start = numberValue(caption?.start ?? caption?.sourceStart ?? caption?.timelineStart, index);
    const end = Math.max(start + 0.1, numberValue(caption?.end ?? caption?.sourceEnd ?? caption?.timelineEnd, start + 2));
    return {
      ...caption,
      id: caption?.id || caption?.captionId || `caption-${index + 1}`,
      start: roundSeconds(start),
      end: roundSeconds(end),
      text: captionText(caption),
    };
  });
  if (normalized.length) return normalized;
  return captionsFromCandidateSegments(candidateSegments(candidate));
}

function candidateRetentionPlan(candidate = {}) {
  return firstArray(
    candidate?.renderManifest?.manualRetentionPlan,
    candidate?.renderManifest?.retentionPlan,
    candidate?.metadata?.manualRetentionPlan,
    candidate?.metadata?.retentionPlan
  ).map(retentionEffectPayload);
}

function captionsFromCandidateSegments(segments = []) {
  const captions = [];
  arrayValue(segments).forEach((segment, segmentIndex) => {
    const text = segmentTranscriptText(segment);
    if (!text) return;
    const start = numberValue(segment.timelineStart, segmentIndex);
    const end = Math.max(start + 0.1, numberValue(segment.timelineEnd, start + Math.max(0.1, numberValue(segment.sourceEnd, 0) - numberValue(segment.sourceStart, 0))));
    const chunks = splitCaptionChunks(text, 64);
    const duration = Math.max(0.8, (end - start) / Math.max(1, chunks.length));
    chunks.forEach((chunk, chunkIndex) => {
      const captionStart = roundSeconds(start + (duration * chunkIndex));
      const captionEnd = roundSeconds(chunkIndex === chunks.length - 1 ? end : Math.min(end, captionStart + duration));
      captions.push({
        id: `timeline-caption-${segmentIndex + 1}-${chunkIndex + 1}`,
        segmentId: segment.segmentId,
        nodeId: segment.nodeId,
        sceneId: segment.sceneId,
        start: captionStart,
        end: Math.max(captionStart + 0.5, captionEnd),
        text: chunk,
        source: "final_edl_transcript",
      });
    });
  });
  return captions;
}

function segmentTranscriptText(segment = {}) {
  const direct = segment.transcript || segment.text || segment.voice || segment.dialogue || segment.sourceTranscript || segment.caption || segment.summary || "";
  if (direct) return String(direct).replace(/\s+/g, " ").trim();
  const nested = firstArray(segment.transcriptNodes, segment.nodes, segment.captions)
    .map((item) => captionText(item) || item?.transcript || item?.text || item?.summary || "")
    .filter(Boolean)
    .join(" ");
  return nested.replace(/\s+/g, " ").trim();
}

function splitCaptionChunks(value, maxChars) {
  const words = String(value || "").trim().replace(/\s+/g, " ").split(" ").filter(Boolean);
  const chunks = [];
  let current = "";
  words.forEach((word) => {
    if (current && current.length + word.length + 1 > maxChars) {
      chunks.push(current);
      current = "";
    }
    current = current ? `${current} ${word}` : word;
  });
  if (current) chunks.push(current);
  return chunks;
}

function captionText(caption = {}) {
  if (typeof caption === "string") return caption;
  return caption?.text || caption?.caption || caption?.line || caption?.displayText || "";
}

function candidateReview(candidate = {}) {
  return firstObject(
    candidate?.metadata?.humanLoopReview,
    candidate?.metadata?.semanticReview,
    candidate?.renderManifest?.humanSemanticReview,
    candidate?.renderManifest?.semanticReview,
    candidate?.review
  );
}

function candidateRenderStatus(candidate = {}) {
  if (videoUrlFor(candidate)) return "COMPLETED";
  return candidate?.renderManifest?.renderStatus || candidate?.status || "PENDING";
}

function DetailTile({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-normal text-slate-500">
        <Icon size={13} className="text-purple-200" /> {label}
      </div>
      <p className="mt-1 truncate text-sm font-extrabold text-white">{value}</p>
    </div>
  );
}

function TranscriptWorkspace({
  search,
  onSearchChange,
  allNodes,
  nodes,
  graph,
  isLive,
  isPaused,
  pauseRequested,
  canPause,
  canEdit,
  isDirty,
  onPause,
  onResume,
  onSaveTimeline,
  isPausing,
  isSaving,
  isResuming,
  onNodeChange,
  lockedSegments,
  onToggleLock,
  frameLookup,
  sourceUrl,
  sceneTimeline,
}) {
  const timelineNodes = arrayValue(allNodes).length ? arrayValue(allNodes) : arrayValue(nodes);
  const normalizedNodes = normalizeTranscriptNodes(timelineNodes);
  const visibleNodes = normalizeTranscriptNodes(nodes);
  const graphEdges = arrayValue(graph?.edges);
  const sceneTimelineScenes = arrayValue(sceneTimeline?.scenes);
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [selectedSceneId, setSelectedSceneId] = useState("");
  const videoRef = useRef(null);
  const selectedNode = normalizedNodes.find((node) => node.id === selectedNodeId) || normalizedNodes[0] || null;
  const selectedScene = sceneTimelineScenes.find((scene) => scene.id === selectedSceneId)
    || sceneTimelineScenes.find((scene) => scene.id === selectedNode?.sceneId)
    || sceneTimelineScenes[0]
    || null;

  useEffect(() => {
    if (!selectedNode?.id) return;
    if (!selectedNodeId) setSelectedNodeId(selectedNode.id);
  }, [selectedNode?.id, selectedNodeId]);

  useEffect(() => {
    if (selectedNode?.sceneId && selectedNode.sceneId !== selectedSceneId) {
      setSelectedSceneId(selectedNode.sceneId);
      return;
    }
    if (!selectedSceneId && selectedScene?.id) {
      setSelectedSceneId(selectedScene.id);
    }
  }, [selectedNode?.sceneId, selectedScene?.id, selectedSceneId]);

  useEffect(() => {
    if (!sourceUrl || !videoRef.current || !selectedNode) return;
    videoRef.current.currentTime = numberValue(selectedNode.start, 0);
    videoRef.current.pause();
  }, [selectedNode?.id, selectedNode?.start, sourceUrl]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-normal text-purple-200">Transcript Explorer</p>
          <h2 className="mt-1 text-xl font-black text-white">{timelineNodes.length} dialogue nodes</h2>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className={`rounded-full border px-3 py-1.5 text-xs font-black uppercase ${isPaused ? "border-amber-300/30 bg-amber-300/[0.1] text-amber-100" : isLive ? "border-purple-300/30 bg-purple-500/[0.12] text-purple-100" : "border-emerald-300/25 bg-emerald-300/[0.08] text-emerald-100"}`}>
            {isPaused ? "Paused" : pauseRequested ? "Pause requested" : isLive ? "Live" : "Saved"}
          </span>
          {canPause && (
            <button
              type="button"
              onClick={onPause}
              disabled={isPausing || pauseRequested}
              className="creator-control flex min-h-[2.5rem] items-center justify-center gap-2 px-3 text-xs font-black text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              title="Pause generation"
            >
              {isPausing ? <Loader2 size={15} className="animate-spin" /> : <Pause size={15} />}
              {pauseRequested ? "Queued" : "Pause"}
            </button>
          )}
          {canEdit && (
            <>
              <button
                type="button"
                onClick={onSaveTimeline}
                disabled={!isDirty || isSaving}
                className="creator-control flex min-h-[2.5rem] items-center justify-center gap-2 px-3 text-xs font-black text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                title="Save timeline edits"
              >
                {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Save
              </button>
              <button
                type="button"
                onClick={onResume}
                disabled={isResuming || isSaving}
                className="creator-control flex min-h-[2.5rem] items-center justify-center gap-2 border-emerald-300/30 bg-emerald-300/[0.1] px-3 text-xs font-black text-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                title="Resume generation"
              >
                {isResuming ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
                Resume
              </button>
            </>
          )}
          <label className="creator-control flex min-h-[2.5rem] items-center gap-2 px-3 text-sm text-slate-300 sm:w-72">
            <Search size={15} />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search"
              className="w-full bg-transparent text-sm font-semibold text-slate-100 outline-none placeholder:text-slate-600"
            />
          </label>
        </div>
      </div>
      {!timelineNodes.length ? (
        <EmptyState icon={FileVideo} title="No transcript yet" detail="Transcript nodes arrive after the worker processes the source video." />
      ) : (
        <div className="mt-4 space-y-4">
          <SceneTimelinePanel
            sceneTimeline={sceneTimeline}
            selectedScene={selectedScene}
            selectedSceneId={selectedScene?.id}
            onSelectScene={setSelectedSceneId}
            frameLookup={frameLookup}
          />
          <TranscriptTimelineGraph
            nodes={normalizedNodes}
            edges={graphEdges}
            selectedNodeId={selectedNode?.id}
            onSelectNode={setSelectedNodeId}
          />
          {sourceUrl && (
            <div className="grid gap-3 rounded-lg border border-white/10 bg-black/25 p-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <video ref={videoRef} src={sourceUrl} controls className="aspect-video w-full rounded-md border border-white/10 bg-slate-950 object-contain" />
              <div className="rounded-md border border-white/10 bg-slate-950 p-3">
                <p className="text-[10px] font-black uppercase tracking-normal text-slate-500">Selected Dialogue</p>
                <p className="mt-2 text-sm font-extrabold text-white">{selectedNode?.id || "Node"} | {timeRange(selectedNode || {})}</p>
                <p className="mt-2 line-clamp-5 text-sm font-semibold leading-6 text-slate-300">{selectedNode?.transcript || selectedNode?.text || "Transcript text pending."}</p>
              </div>
            </div>
          )}
          <div className="grid gap-3 lg:grid-cols-2">
            {visibleNodes.map((node, index) => (
              <TranscriptNode
                key={node.id || `node-${index}`}
                node={node}
                locked={lockedSegments.has(node.id)}
                onToggleLock={() => onToggleLock(node.id)}
                selected={selectedNode?.id === node.id}
                onSelect={() => setSelectedNodeId(node.id)}
                canEdit={canEdit}
                onChange={(patch) => onNodeChange?.(node.id, patch)}
                frameLookup={frameLookup}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GraphWorkspace({ graph, graphView, onGraphViewChange, onEditNode }) {
  const views = arrayValue(graph?.graphViews).length ? arrayValue(graph.graphViews) : graphViews;
  return (
    <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_21rem]">
      <div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-normal text-purple-200">Semantic Graph</p>
            <h2 className="mt-1 text-xl font-black text-white">{graphView}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {views.map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => onGraphViewChange(view)}
                className={`creator-control px-3 py-2 text-xs font-black ${
                  graphView === view ? "border-purple-300/40 bg-purple-500/20 text-white" : "text-slate-400"
                }`}
              >
                {String(view).split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 min-h-[28rem] rounded-lg border border-white/10 bg-black/25 p-4">
          <GraphRail graph={graph} view={graphView} onEditNode={onEditNode} />
        </div>
      </div>
      <div className="space-y-3">
        <AgentPanel title="Nodes" decision={arrayValue(graph?.nodes).length} reason="Stored graph node count." confidence={confidenceFrom(graph)} icon={GitBranch} />
        <AgentPanel title="Edges" decision={arrayValue(graph?.edges).length} reason="Stored graph edge count." confidence={confidenceFrom(graph)} icon={Layers3} />
        <AgentPanel title="Source" decision={graph?.analysisSource || graph?.source || "graph"} reason="Graph payload persisted by backend pipeline." confidence={confidenceFrom(graph)} icon={ShieldCheck} />
      </div>
    </div>
  );
}

function TraceWorkspace({ traceRows }) {
  if (!traceRows.length) return <EmptyState icon={PanelRight} title="No trace yet" detail="Queued and running jobs publish trace rows as stages finish." />;
  return (
    <div>
      <div className="flex items-center gap-2">
        <PanelRight size={16} className="text-purple-200" />
        <div>
          <p className="text-xs font-black uppercase tracking-normal text-purple-200">Trace Log</p>
          <h2 className="mt-1 text-xl font-black text-white">{traceRows.length} decisions</h2>
        </div>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {traceRows.map((row, index) => (
          <div key={row.id || row.traceId || `${row.stage || "stage"}-${row.at || row.timestamp || index}`} className="rounded-lg border border-white/10 bg-black/25 p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-normal text-slate-500">{row.stage || "stage"}</p>
              <StatusPill status={row.status} />
            </div>
            <p className="mt-2 text-sm font-extrabold text-white">{row.summary || row.decision || "Completed"}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">{traceDetail(row)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CandidateInspectorWorkspace({ currentVideo, selectedCandidate, transcript, graph, sceneTimeline, job }) {
  if (!currentVideo && !selectedCandidate) {
    return <EmptyState icon={Database} title="No run selected" detail="Open a generated shorts run to inspect stories, transcripts, and edit JSON." />;
  }
  const candidate = selectedCandidate || {};
  const metadata = candidate.metadata || {};
  const timelinePlanner = firstObject(metadata.timelinePlanner, candidate.timelinePlanner);
  const uiTimelineProject = firstObject(metadata.uiTimelineProject, candidate.uiTimelineProject);
  const criticalScenes = firstArray(metadata.criticalScenes, timelinePlanner.criticalScenes);
  const storyStructure = firstObject(metadata.storyStructure, timelinePlanner.storyStructure);
  const transcriptRows = candidateTranscriptRows(candidate, transcript);
  const editJson = {
    candidateId: idOf(candidate),
    title: candidate.title,
    score: candidate.score,
    editDecisionList: candidate.editDecisionList || {},
    captionPlan: candidate.captionPlan || {},
    renderManifest: candidate.renderManifest || {},
    metadata: {
      videoType: metadata.videoType,
      styleSuggestions: metadata.styleSuggestions,
      criticalScenes: metadata.criticalScenes,
      storyStructure: metadata.storyStructure,
      retentionOpportunities: metadata.retentionOpportunities,
      assetOpportunities: metadata.assetOpportunities,
      timelinePlanner,
      uiTimelineProject,
    },
  };
  const storeJson = {
    video: {
      videoId: currentVideo?.videoId,
      status: currentVideo?.status,
      title: currentVideo?.title,
      platform: currentVideo?.platform,
      targetDurationSeconds: currentVideo?.targetDurationSeconds,
      requestedShorts: currentVideo?.requestedShorts,
      generationJobId: currentVideo?.generationJobId,
      sourceAsset: currentVideo?.sourceAsset || {},
      metadata: currentVideo?.metadata || {},
    },
    selectedCandidate: candidate,
    jobOutput: jobPayload(job),
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-normal text-purple-200">Run Inspector</p>
          <h2 className="mt-1 truncate text-xl font-black text-white">{candidate.title || currentVideo?.title || "Generated short"}</h2>
          <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-slate-400">
            View the selected story, transcript evidence, and editable JSON that the UI/project editor can reload.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[32rem]">
          <DetailTile label="Stories" value={String(criticalScenes.length || (storyStructure?.hook ? 1 : 0))} icon={GitBranch} />
          <DetailTile label="Transcript" value={String(transcriptRows.length)} icon={Captions} />
          <DetailTile label="EDL Cuts" value={String(candidateSegments(candidate).length)} icon={Scissors} />
          <DetailTile label="Project" value={uiTimelineProject?.project ? "ready" : "pending"} icon={Database} />
        </div>
      </div>

      <section className="grid gap-4 2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-4">
          <InspectorSection title="Stories" icon={GitBranch}>
            <div className="grid gap-3 md:grid-cols-2">
              <StoryFact label="Video type" value={metadata.videoType || currentVideo?.videoDna?.primaryType || "unknown"} />
              <StoryFact label="Style" value={timelinePlanner.selectedStyle || uiTimelineProject?.project?.selectedStyle || "not selected"} />
              <StoryFact label="Hook scene" value={storyStructure.hook || criticalScenes[0]?.sceneId || "pending"} />
              <StoryFact label="Conclusion" value={storyStructure.conclusion || criticalScenes[criticalScenes.length - 1]?.sceneId || "pending"} />
            </div>
            <div className="mt-3 space-y-2">
              {criticalScenes.length ? criticalScenes.map((scene, index) => (
                <div key={scene.sceneId || scene.id || `critical-scene-${index}`} className="rounded-lg border border-white/10 bg-slate-950/70 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-white">{scene.sceneId || `Scene ${index + 1}`}</p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">{scene.reason || "Story moment"}</p>
                    </div>
                    <span className="shrink-0 rounded bg-purple-300/15 px-2 py-1 text-[10px] font-black uppercase text-purple-100">{scene.sceneType || "CLAIM"}</span>
                  </div>
                  <p className="mt-2 font-mono text-[11px] font-semibold text-slate-500">{formatTimestamp(scene.start)} - {formatTimestamp(scene.end)}</p>
                </div>
              )) : (
                <p className="rounded-lg border border-dashed border-white/10 bg-slate-950/60 p-3 text-sm font-semibold text-slate-400">Story metadata will appear after candidate ranking completes.</p>
              )}
            </div>
          </InspectorSection>

          <InspectorSection title="Transcripts" icon={Captions}>
            <div className="max-h-[34rem] space-y-2 overflow-auto pr-1">
              {transcriptRows.length ? transcriptRows.map((row, index) => (
                <div key={row.id || `${row.start}-${index}`} className="grid gap-2 rounded-lg border border-white/10 bg-slate-950/70 p-3 sm:grid-cols-[5rem_minmax(0,1fr)]">
                  <span className="font-mono text-[11px] font-black text-purple-100">{formatTimestamp(row.start)}</span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-white/10 px-2 py-1 text-[10px] font-black uppercase text-slate-300">{row.speaker || "Speaker"}</span>
                      {row.segmentId && <span className="rounded bg-cyan-300/10 px-2 py-1 text-[10px] font-black uppercase text-cyan-100">{row.segmentId}</span>}
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-200">{row.transcript || row.text || "Transcript text pending."}</p>
                  </div>
                </div>
              )) : (
                <p className="rounded-lg border border-dashed border-white/10 bg-slate-950/60 p-3 text-sm font-semibold text-slate-400">No transcript rows available for this candidate yet.</p>
              )}
            </div>
          </InspectorSection>
        </div>

        <div className="space-y-4">
          <InspectorJsonBlock title="Edit JSON" value={editJson} />
          <InspectorJsonBlock title="UI Project JSON" value={uiTimelineProject || {}} />
          <InspectorJsonBlock title="Store JSON" value={storeJson} />
          <InspectorJsonBlock title="Scene Timeline JSON" value={sceneTimeline || {}} />
          <InspectorJsonBlock title="Graph JSON" value={graph || {}} />
        </div>
      </section>
    </div>
  );
}

function InspectorSection({ title, icon: Icon, children }) {
  return (
    <section className="rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="flex items-center gap-2">
        <Icon size={15} className="text-purple-200" />
        <p className="text-xs font-black uppercase tracking-normal text-purple-200">{title}</p>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function StoryFact({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/70 p-3">
      <p className="text-[10px] font-black uppercase tracking-normal text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-extrabold text-white">{String(value || "pending")}</p>
    </div>
  );
}

function InspectorJsonBlock({ title, value }) {
  return (
    <section className="min-w-0 rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Code2 size={14} className="text-purple-200" />
        <p className="text-xs font-black uppercase tracking-normal text-purple-200">{title}</p>
      </div>
      <pre className="max-h-[28rem] min-w-0 overflow-auto rounded-lg border border-white/10 bg-slate-950 p-3 text-[10px] font-semibold leading-4 text-slate-300">
        {JSON.stringify(value || {}, null, 2)}
      </pre>
    </section>
  );
}

function Metric({ label, value, icon: Icon }) {
  return (
    <div className="creator-panel-muted flex min-w-[8rem] items-center gap-3 px-3 py-2">
      <Icon size={16} className="text-purple-200" />
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-normal text-slate-500">{label}</p>
        <p className="truncate text-sm font-extrabold text-white">{value}</p>
      </div>
    </div>
  );
}

function ControlBlock({ title, children }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-black uppercase tracking-normal text-slate-500">{title}</p>
      {children}
    </div>
  );
}

function Segmented({ values, value, onChange, suffix = "" }) {
  return (
    <div className="grid min-h-[2.75rem] grid-cols-3 gap-1 rounded-lg border border-white/10 bg-black/20 p-1">
      {values.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={`rounded-md px-3 py-2 text-xs font-black transition ${
            value === item ? "bg-purple-600 text-white" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
          }`}
        >
          {item}{suffix}
        </button>
      ))}
    </div>
  );
}

function SceneTimelinePanel({ sceneTimeline, selectedScene, selectedSceneId, onSelectScene, frameLookup }) {
  const scenes = arrayValue(sceneTimeline?.scenes);
  const [jsonOpen, setJsonOpen] = useState(false);
  if (!scenes.length) return null;
  const timelineStart = Number(sceneTimeline?.timelineStart ?? 0);
  const timelineEnd = Math.max(timelineStart + 0.1, numberValue(sceneTimeline?.timelineEnd, Math.max(...scenes.map((scene) => numberValue(scene.end, 0)))));
  const totalDuration = Math.max(0.1, timelineEnd - timelineStart);
  const selected = selectedScene || scenes[0];
  const selectedFrames = arrayValue(selected?.frames);
  const selectedTranscript = arrayValue(selected?.transcript);
  const selectedDialogue = arrayValue(selected?.dialogue).length ? arrayValue(selected.dialogue) : dialogueFromTranscript(selectedTranscript);
  const selectedSpeakerTurns = arrayValue(selected?.speakerTurns);
  const selectedQuestionAnswer = firstObject(selected?.questionAnswer);
  const visual = selected?.visualAnalysis || {};
  const continuity = selected?.continuity || {};
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-normal text-purple-200">Scene Timeline</p>
          <h3 className="mt-1 text-lg font-black text-white">{scenes.length} timeline slices</h3>
        </div>
        <div className="grid grid-cols-3 gap-2 md:w-[26rem]">
          <DetailTile label="Dialogue" value={sceneTimeline?.metadata?.dialogueCount ?? selectedDialogue.length} icon={Captions} />
          <DetailTile label="Speakers" value={sceneTimeline?.metadata?.speakerTurnCount ?? selectedSpeakerTurns.length} icon={GitBranch} />
          <DetailTile label="Visual" value={sceneTimeline?.metadata?.hasVisualEvidence ? "Ready" : "Optional"} icon={FileVideo} />
        </div>
      </div>
      <div className="mt-3 overflow-x-auto rounded-lg border border-white/10 bg-slate-950">
        <div className="flex min-h-[8rem] min-w-full items-stretch">
          {scenes.map((scene, index) => {
            const start = numberValue(scene.start, 0);
            const end = Math.max(start + 0.1, numberValue(scene.end, start + 0.1));
            const width = Math.max(8, ((end - start) / totalDuration) * 100);
            const hasVisual = Boolean(scene?.visualAnalysis?.hasVisualEvidence);
            const warn = String(scene?.continuity?.status || "").toUpperCase() === "WARN";
            const badge = hasVisual ? "visual" : scene?.metadata?.transcriptOnlyFallback || scene?.visualAnalysis?.source === "transcript_only_timeline" ? "dialogue" : "weak";
            return (
              <button
                key={scene.id || `scene-${index}`}
                type="button"
                onClick={() => onSelectScene?.(scene.id)}
                className={`flex min-w-[8rem] flex-col justify-between border-r border-white/10 p-2 text-left last:border-r-0 ${
                  selectedSceneId === scene.id ? "bg-purple-500/[0.18]" : warn ? "bg-amber-300/[0.08]" : "bg-white/[0.025] hover:bg-white/[0.055]"
                }`}
                style={{ width: `${width}%` }}
                title={`${scene.label || scene.id} ${timeRange(scene)}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[10px] font-black uppercase tracking-normal text-purple-100">{scene.label || scene.id}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${hasVisual ? "bg-emerald-300/15 text-emerald-100" : "bg-amber-300/15 text-amber-100"}`}>
                      {badge}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-xs font-semibold leading-5 text-slate-300">
                    {selectedSceneSummary(scene)}
                  </p>
                </div>
                <div className="mt-2">
                  <p className="truncate text-[10px] font-bold text-slate-500">{timeRange(scene)}</p>
                  <p className="truncate text-[10px] font-bold text-slate-500">{scene.transcriptNodeCount || arrayValue(scene.dialogue).length || 0} dialogue | {scene.activeSpeaker || "speaker"}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      {selected && (
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="rounded-lg border border-white/10 bg-slate-950 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-normal text-slate-500">{selected.id} | {timeRange(selected)}</p>
                <h4 className="mt-1 text-base font-black text-white">{selected.label || "Scene"}</h4>
              </div>
              <StatusPill status={continuity.status || (visual.hasVisualEvidence ? "READY" : "WARN")} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(selectedFrames.length ? selectedFrames : arrayValue(selected.frameIds)).slice(0, 3).map((frame, index) => (
                <FrameThumb key={`${selected.id}-frame-${index}`} frame={frame} frameLookup={frameLookup} />
              ))}
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <SceneFact label="Visual" value={visual.hasVisualEvidence ? `${visual.frameCount || selectedFrames.length} frame evidence` : "weak evidence"} />
              <SceneFact label="Speaker" value={selected.activeSpeaker || "pending"} />
              <SceneFact label="Q/A" value={selectedQuestionAnswer?.hasQuestionAnswer ? `${selectedQuestionAnswer.questionSpeaker || "Q"} -> ${selectedQuestionAnswer.answerSpeaker || "A"}` : "none"} />
              <SceneFact label="Transition in" value={transitionLabel(selected.transitionIn)} />
              <SceneFact label="Transition out" value={transitionLabel(selected.transitionOut)} />
              <SceneFact label="Continuity" value={continuity.notes || continuity.transitionRisk || "pending"} />
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-slate-950 p-3">
            <p className="text-[10px] font-black uppercase tracking-normal text-slate-500">Scene Dialogue</p>
            <div className="mt-2 max-h-44 space-y-2 overflow-y-auto pr-1">
              {selectedDialogue.length ? selectedDialogue.slice(0, 5).map((node, index) => (
                <div key={node.id || node.nodeId || `dialogue-node-${index}`} className="rounded-md bg-white/[0.04] px-2 py-1.5">
                  <p className="text-[10px] font-black text-slate-500">{timeRange(node)} | {node.speaker || "Speaker"}</p>
                  <p className="line-clamp-2 text-xs font-semibold leading-5 text-slate-300">{node.text || node.transcript}</p>
                </div>
              )) : (
                <p className="text-xs font-semibold text-slate-500">No dialogue attached to this visual scene.</p>
              )}
            </div>
            {selectedQuestionAnswer?.hasQuestionAnswer && (
              <div className="mt-3 rounded-md border border-white/10 bg-white/[0.035] px-2 py-2">
                <p className="text-[9px] font-black uppercase tracking-normal text-slate-500">Question / answer</p>
                <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-300">{selectedQuestionAnswer.question}</p>
                <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-400">{selectedQuestionAnswer.answer}</p>
              </div>
            )}
            <button
              type="button"
              onClick={() => setJsonOpen((current) => !current)}
              className="creator-control mt-3 flex min-h-[2.25rem] w-full items-center justify-center gap-2 px-3 text-xs font-black text-slate-200"
            >
              <Code2 size={14} />
              JSON
              {jsonOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>
          {jsonOpen && (
            <pre className="max-h-72 overflow-auto rounded-lg border border-white/10 bg-slate-950 p-3 text-[10px] font-semibold leading-4 text-slate-400 lg:col-span-2">
              {JSON.stringify(sceneTimelineJson(selected), null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function SceneFact({ label, value }) {
  return (
    <div className="rounded-md bg-white/[0.04] px-2 py-1.5">
      <p className="text-[9px] font-black uppercase tracking-normal text-slate-500">{label}</p>
      <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-300">{value || "pending"}</p>
    </div>
  );
}

function TranscriptTimelineGraph({ nodes, edges, selectedNodeId, onSelectNode }) {
  const normalized = normalizeTranscriptNodes(nodes);
  if (!normalized.length) return null;
  const timelineStart = Math.min(...normalized.map((node) => numberValue(node.start, 0)));
  const timelineEnd = Math.max(...normalized.map((node) => numberValue(node.end, numberValue(node.start, 0))));
  const totalDuration = Math.max(0.1, timelineEnd - timelineStart);
  const edgeCount = arrayValue(edges).length || Math.max(0, normalized.length - 1);

  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <DetailTile label="Nodes" value={normalized.length} icon={GitBranch} />
        <DetailTile label="Edges" value={edgeCount} icon={Layers3} />
        <DetailTile label="Timeline" value={`${formatTimestamp(timelineStart)} - ${formatTimestamp(timelineEnd)}`} icon={Clock3} />
      </div>
      <div className="mt-3 overflow-x-auto rounded-lg border border-white/10 bg-slate-950">
        <div className="flex min-h-[9.5rem] min-w-full items-stretch">
          {normalized.map((node, index) => {
            const start = numberValue(node.start, timelineStart);
            const end = Math.max(start + 0.1, numberValue(node.end, start + 0.1));
            const duration = Math.max(0.1, end - start);
            const width = Math.max(7.5, (duration / totalDuration) * 100);
            const score = Math.max(0, Math.min(100, numberValue(node.interestingness ?? node.interestingnessScore, 0)));
            return (
              <button
                key={node.id || `timeline-node-${index}`}
                type="button"
                onClick={() => onSelectNode?.(node.id)}
                className={`relative flex min-w-[7.5rem] flex-col justify-between border-r border-white/10 p-2 text-left last:border-r-0 ${selectedNodeId === node.id ? "bg-purple-500/[0.18]" : "bg-white/[0.025] hover:bg-white/[0.055]"}`}
                style={{ width: `${width}%` }}
                title={`${node.id || `n-${index + 1}`} ${timeRange(node)}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[10px] font-black uppercase tracking-normal text-purple-100">{node.id || `n-${index + 1}`}</span>
                    <span className="text-[10px] font-black text-slate-500">{formatSecondsShort(duration)}s</span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-xs font-semibold leading-5 text-slate-300">{node.transcript || node.text}</p>
                </div>
                <div className="mt-2">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-emerald-300/80" style={{ width: `${score || 18}%` }} />
                  </div>
                  <p className="mt-1 truncate text-[10px] font-bold text-slate-500">{timeRange(node)}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TranscriptNode({ node, locked, onToggleLock, selected, onSelect, canEdit, onChange, frameLookup }) {
  const frames = arrayValue(node.frames);
  return (
    <article
      onClick={onSelect}
      className={`rounded-lg border p-3 transition ${selected ? "border-purple-300/45 bg-purple-500/[0.12]" : "border-white/10 bg-black/25 hover:border-white/20"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-normal text-slate-500">{timeRange(node)}</p>
          {canEdit ? (
            <div className="mt-2 grid gap-2 sm:grid-cols-[5.5rem_5.5rem_minmax(0,1fr)]">
              <label className="rounded-md border border-white/10 bg-slate-950 px-2 py-1.5">
                <span className="block text-[9px] font-black uppercase text-slate-500">Start</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={node.start}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) => onChange?.({ start: Number(event.target.value) })}
                  className="mt-1 w-full bg-transparent text-xs font-black text-white outline-none"
                />
              </label>
              <label className="rounded-md border border-white/10 bg-slate-950 px-2 py-1.5">
                <span className="block text-[9px] font-black uppercase text-slate-500">End</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={node.end}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) => onChange?.({ end: Number(event.target.value) })}
                  className="mt-1 w-full bg-transparent text-xs font-black text-white outline-none"
                />
              </label>
              <label className="rounded-md border border-white/10 bg-slate-950 px-2 py-1.5">
                <span className="block text-[9px] font-black uppercase text-slate-500">Speaker</span>
                <input
                  value={node.speaker || node.role || "Speaker"}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) => onChange?.({ speaker: event.target.value })}
                  className="mt-1 w-full bg-transparent text-xs font-black text-white outline-none"
                />
              </label>
            </div>
          ) : (
            <h3 className="mt-1 text-sm font-extrabold text-white">{node.id ? `${node.id} | ` : ""}{node.speaker || node.role || "Speaker"}</h3>
          )}
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleLock?.();
          }}
          className={`creator-control grid h-8 w-8 place-items-center ${locked ? "border-emerald-300/30 bg-emerald-300/[0.1] text-emerald-100" : "text-slate-400"}`}
          title={locked ? "Unlock segment" : "Lock segment"}
        >
          <Lock size={14} />
        </button>
      </div>
      {canEdit ? (
        <textarea
          value={node.transcript || node.text || ""}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => onChange?.({ transcript: event.target.value })}
          rows={4}
          className="mt-3 w-full resize-y rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm font-semibold leading-6 text-slate-200 outline-none focus:border-purple-300/45"
        />
      ) : (
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">{node.transcript || node.text || "Transcript text pending."}</p>
      )}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {(frames.length ? frames : ["F01", "F02", "F03"]).slice(0, 3).map((frame, index) => (
          <FrameThumb key={`${node.id || "node"}-${index}`} frame={frame} frameLookup={frameLookup} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <MiniBar label="Emotion" value={Number(node.emotion ?? node.emotionScore ?? 0)} />
        <MiniBar label="Interest" value={Number(node.interestingness ?? node.interestingnessScore ?? 0)} />
      </div>
    </article>
  );
}

function FrameThumb({ frame, frameLookup }) {
  const resolved = typeof frame === "string" ? frameLookup?.get?.(frame) || frame : frame;
  const url = typeof resolved === "object" ? resolved.thumbnailDataUrl || resolved.url || resolved.publicUrl : "";
  if (url) {
    return <img src={url} alt="" className="aspect-video rounded-md border border-white/10 bg-slate-900 object-cover" />;
  }
  return (
    <div className="grid aspect-video place-items-center rounded-md border border-white/10 bg-slate-900 text-[10px] font-black text-slate-500">
      {typeof resolved === "string" ? resolved : resolved?.id || resolved?.frameId || "Frame"}
    </div>
  );
}

function MiniBar({ label, value }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div>
      <div className="flex justify-between text-[10px] font-black uppercase tracking-normal text-slate-500">
        <span>{label}</span>
        <span>{Math.round(safeValue)}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-purple-400" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

function GraphRail({ graph, onEditNode }) {
  const allNodes = arrayValue(graph?.nodes);
  const transcriptMode = isDialogueGraph(graph);
  const shortNodes = allNodes.filter((node) => node?.type === "SHORT_CANDIDATE");
  const nodes = (transcriptMode ? allNodes : shortNodes.length ? shortNodes : allNodes).slice(0, transcriptMode ? 120 : 10);
  const edges = arrayValue(graph?.edges).slice(0, transcriptMode ? 120 : 8);
  if (!nodes.length && !edges.length) return <EmptyState icon={GitBranch} title="No graph yet" detail="The graph builder saves nodes and edges after transcript and scene analysis." />;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-normal text-slate-500">Nodes</p>
        {nodes.map((node, index) => {
          const editable = node?.type === "SHORT_CANDIDATE" || node?.ui?.editable;
          const intent = nodeIntentLabel(node);
          return (
            <button
              key={node.id || `node-${index}`}
              type="button"
              disabled={!editable}
              onClick={() => editable && onEditNode?.(node)}
              className={`w-full rounded-lg border px-4 py-3 text-left text-sm font-black text-white transition ${
                editable
                  ? "border-purple-300/35 bg-purple-500/[0.14] hover:border-purple-200/60 hover:bg-purple-500/20"
                  : "border-white/10 bg-black/25"
              } ${editable && node?.ui?.blink ? "animate-pulse" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <GitBranch size={15} className="shrink-0 text-purple-200" />
                  <span className="truncate">{node.label || node.type || node.id || `Node ${index + 1}`}</span>
                </div>
                {editable && <span className="rounded-full bg-emerald-300/15 px-2 py-1 text-[10px] font-black uppercase text-emerald-100">Edit</span>}
              </div>
              <p className="mt-1 truncate text-[11px] font-semibold text-slate-400">{intent || node.type || timeRange(node)}</p>
              {node?.humanPatch && <p className="mt-2 text-[10px] font-black uppercase tracking-normal text-amber-100">Human patch saved</p>}
            </button>
          );
        })}
      </div>
      <div className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-normal text-slate-500">Edges</p>
        {edges.map((edge, index) => (
          <div key={edge.id || edge.edgeId || `${edge.from || edge.source || "src"}-${edge.to || edge.target || "dst"}-${edge.type || edge.reason || index}`} className="rounded-lg border border-white/10 bg-black/25 px-4 py-3 text-sm font-black text-white">
            <p className="truncate">{edge.from || edge.source} {"->"} {edge.to || edge.target}</p>
            <p className="mt-1 truncate text-[11px] font-semibold text-slate-400">{edge.type || edge.reason || "edge"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StoryGraphNodeEditorModal({ node, draft, onDraftChange, onClose, onSubmit, onRender, isSaving, currentVideo, frameLookup, rerenderJob }) {
  const beats = arrayValue(draft.beats);
  const segments = arrayValue(draft.segments);
  const semanticReview = node?.humanPatch?.semanticReview || node?.renderManifest?.humanSemanticReview || {};
  const updateBeat = (index, text) => {
    const nextBeats = beats.map((beat, beatIndex) => (beatIndex === index ? { ...beat, text } : beat));
    onDraftChange({ ...draft, beats: nextBeats });
  };
  const updateSegment = (index, patch) => {
    const nextSegments = segments.map((segment, segmentIndex) => (segmentIndex === index ? { ...segment, ...patch } : segment));
    onDraftChange({ ...draft, segments: normalizeDraftSegments(nextSegments) });
  };
  const moveSegment = (from, to) => {
    if (to < 0 || to >= segments.length) return;
    const nextSegments = [...segments];
    const [moved] = nextSegments.splice(from, 1);
    nextSegments.splice(to, 0, moved);
    onDraftChange({ ...draft, segments: normalizeDraftSegments(nextSegments) });
  };
  const dropSegment = (event, to) => {
    const from = Number(event.dataTransfer.getData("text/plain"));
    if (Number.isFinite(from)) moveSegment(from, to);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-white/10 bg-slate-950 p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-normal text-purple-200">Short Graph Node</p>
            <h3 className="mt-1 truncate text-lg font-black text-white">{node.label || "Short candidate"}</h3>
            <p className="mt-1 text-xs font-semibold text-emerald-100">Source locked</p>
          </div>
          <button type="button" onClick={onClose} className="creator-control grid h-9 w-9 place-items-center text-slate-300" title="Close">
            <XCircle size={16} />
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          <SemanticReviewBanner review={semanticReview} />
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-normal text-slate-500">Intent</span>
            <textarea
              value={draft.intent}
              maxLength={220}
              rows={3}
              onChange={(event) => onDraftChange({ ...draft, intent: event.target.value })}
              className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm font-semibold leading-6 text-slate-100 outline-none focus:border-purple-300/50"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-normal text-slate-500">Hook</span>
            <input
              value={draft.hook}
              maxLength={120}
              onChange={(event) => onDraftChange({ ...draft, hook: event.target.value })}
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm font-semibold text-slate-100 outline-none focus:border-purple-300/50"
            />
          </label>
          <div>
            <p className="text-[10px] font-black uppercase tracking-normal text-slate-500">Beats</p>
            <div className="mt-2 space-y-2">
              {beats.length ? beats.map((beat, index) => (
                <label key={beat.beatId || beat.nodeId || beat.id || `beat-${beat.role || index}`} className="block rounded-lg border border-white/10 bg-black/20 p-2">
                  <span className="mb-1 block truncate text-[10px] font-black uppercase tracking-normal text-slate-500">
                    {beat.role || `Beat ${index + 1}`} {beat.nodeId ? `| ${beat.nodeId}` : ""}
                  </span>
                  <input
                    value={beat.text}
                    maxLength={180}
                    onChange={(event) => updateBeat(index, event.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-slate-100 outline-none"
                  />
                </label>
              )) : (
                <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm font-semibold text-slate-400">No editable beats on this node.</div>
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-normal text-slate-500">Timeline</p>
              <span className="text-[10px] font-black uppercase tracking-normal text-slate-500">{formatSecondsShort(totalDraftDuration(segments))}s</span>
            </div>
            <TimelinePreview segments={segments} frameLookup={frameLookup} />
            <RerenderProgressPanel candidate={candidateFromGraphNode(node, currentVideo)} job={rerenderJob} />
            <div className="mt-2 space-y-2">
              {segments.length ? segments.map((segment, index) => (
                <div
                  key={segment.segmentId || `${segment.nodeId}-${index}`}
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => dropSegment(event, index)}
                  className="rounded-lg border border-white/10 bg-black/20 p-3"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-white">{segment.label || segment.nodeId || `Segment ${index + 1}`}</p>
                      <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-normal text-slate-500">{segment.sceneId || "scene"} | {formatSecondsShort(segment.sourceStart)}-{formatSecondsShort(segment.sourceEnd)}s</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveSegment(index, index - 1)} className="creator-control h-8 px-2 text-xs font-black text-slate-300" title="Move earlier">
                        <ArrowUp size={13} />
                      </button>
                      <button type="button" onClick={() => moveSegment(index, index + 1)} className="creator-control h-8 px-2 text-xs font-black text-slate-300" title="Move later">
                        <ArrowDown size={13} />
                      </button>
                      <label className="creator-control flex h-8 items-center gap-2 px-2 text-xs font-black text-slate-300">
                        <input
                          type="checkbox"
                          checked={Boolean(segment.locked)}
                          onChange={(event) => updateSegment(index, { locked: event.target.checked })}
                          className="h-3.5 w-3.5 accent-purple-500"
                        />
                        Lock
                      </label>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {(arrayValue(segment.frames).length ? arrayValue(segment.frames) : [segment.sceneId || segment.nodeId || `S${index + 1}`]).slice(0, 4).map((frame, frameIndex) => (
                      <FrameThumb key={`${segment.segmentId || segment.id || segment.nodeId || `segment-${index}`}-frame-${frame?.id || frame?.frameId || frame?.nodeId || frame || frameIndex}`} frame={frame} frameLookup={frameLookup} />
                    ))}
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <label>
                      <span className="text-[10px] font-black uppercase tracking-normal text-slate-500">Start</span>
                      <input
                        type="number"
                        step="0.1"
                        min={segment.originalSourceStart}
                        max={Math.max(segment.originalSourceStart, Number(segment.sourceEnd) - 0.1)}
                        value={segment.sourceStart}
                        onChange={(event) => updateSegment(index, { sourceStart: clampSegmentStart(segment, event.target.value) })}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm font-semibold text-slate-100 outline-none focus:border-purple-300/50"
                      />
                    </label>
                    <label>
                      <span className="text-[10px] font-black uppercase tracking-normal text-slate-500">End</span>
                      <input
                        type="number"
                        step="0.1"
                        min={Number(segment.sourceStart) + 0.1}
                        max={segment.originalSourceEnd}
                        value={segment.sourceEnd}
                        onChange={(event) => updateSegment(index, { sourceEnd: clampSegmentEnd(segment, event.target.value) })}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm font-semibold text-slate-100 outline-none focus:border-purple-300/50"
                      />
                    </label>
                  </div>
                </div>
              )) : (
                <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm font-semibold text-slate-400">No editable timeline segments on this node.</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <Lock size={13} className="text-emerald-100" />
            Original story graph only
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="creator-control px-3 py-2 text-xs font-black text-slate-300">
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={onSubmit}
              className="creator-control flex min-h-[2.5rem] items-center gap-2 bg-purple-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Save
            </button>
            <button
              type="button"
              disabled={isSaving || !segments.length}
              onClick={onRender}
              className="creator-control flex min-h-[2.5rem] items-center gap-2 bg-emerald-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              Save & Render
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SemanticReviewBanner({ review }) {
  const issues = arrayValue(review?.issues);
  if (!review || (!review.status && !issues.length)) return null;
  const failed = String(review.status || "").toUpperCase().includes("FAIL") || issues.some((issue) => String(issue.severity || "").toLowerCase() === "high");
  const needsReview = failed || Boolean(review.requiresHumanReview);
  return (
    <div className={`rounded-lg border px-3 py-2 ${needsReview ? "border-amber-300/25 bg-amber-300/[0.07]" : "border-emerald-300/20 bg-emerald-300/[0.06]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-normal text-slate-400">Context guard</p>
          <p className="mt-1 text-xs font-bold text-slate-200">{needsReview ? "Review edits against original story before rendering." : "Edits are currently source-supported."}</p>
        </div>
        <StatusPill status={review.status || "PASS"} />
      </div>
      {issues.length > 0 && (
        <p className="mt-2 line-clamp-2 text-[11px] font-semibold text-slate-400">
          {issues.map((issue) => issue.summary || issue.code).filter(Boolean).join(" | ")}
        </p>
      )}
    </div>
  );
}

function TimelinePreview({ segments, frameLookup }) {
  const normalized = normalizeDraftSegments(segments);
  if (!normalized.length) return null;
  const total = Math.max(0.1, totalDraftDuration(normalized));
  return (
    <div className="mt-2 min-w-0 rounded-lg border border-white/10 bg-black/25 p-2 sm:p-3">
      <div className="overflow-x-auto">
        <div className="flex min-w-[34rem] overflow-hidden rounded-md border border-white/10 bg-slate-950 sm:min-w-0">
        {normalized.map((segment, index) => {
          const width = Math.max(8, ((Number(segment.sourceEnd) - Number(segment.sourceStart)) / total) * 100);
          return (
            <div
              key={segment.segmentId || segment.id || segment.nodeId || `wave-segment-${index}`}
              className="min-h-[4.5rem] border-r border-white/10 bg-white/[0.035] p-1 last:border-r-0"
              style={{ width: `${width}%` }}
              title={`${segment.label || segment.nodeId || "Segment"} ${formatSecondsShort(segment.sourceStart)}-${formatSecondsShort(segment.sourceEnd)}s`}
            >
              <FrameThumb frame={arrayValue(segment.frames)[0] || segment.sceneId || segment.nodeId || `S${index + 1}`} frameLookup={frameLookup} />
            </div>
          );
        })}
        </div>
      </div>
      <WaveformStrip segments={normalized} />
    </div>
  );
}

function WaveformStrip({ segments }) {
  const bars = waveformBars(segments);
  return (
    <div className="mt-3 flex h-14 items-center gap-0.5 rounded-md bg-black/30 px-2">
      {bars.map((bar, index) => (
        <span
          key={`wave-${index}`}
          className="flex-1 rounded-full bg-purple-300/70"
          style={{ height: `${Math.max(12, Math.min(92, bar))}%` }}
        />
      ))}
    </div>
  );
}

function AgentPanel({ title, decision, reason, confidence, icon: Icon }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="flex items-center gap-2">
        <Icon size={15} className="text-purple-200" />
        <p className="text-xs font-black uppercase tracking-normal text-slate-400">{title}</p>
      </div>
      <p className="mt-2 text-sm font-extrabold text-white">{decision}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">{reason}</p>
      <p className="mt-2 text-[11px] font-black uppercase tracking-normal text-emerald-200">Confidence {confidence}</p>
    </div>
  );
}

function CandidateCard({ candidate, active, onSelect, rank }) {
  const url = videoUrlFor(candidate);
  const segments = candidateSegments(candidate);
  const captions = candidateCaptions(candidate);
  const warningCount = candidateChecks(candidate).filter((check) => ["WARN", "FAILED", "ERROR"].includes(String(check.status || "").toUpperCase())).length;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-[17.5rem] shrink-0 rounded-lg border p-3 text-left transition 2xl:w-full ${
        active ? "border-purple-300/45 bg-purple-500/[0.14]" : "border-white/10 bg-white/[0.035] hover:border-purple-300/30"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-2">
          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md text-xs font-black ${active ? "bg-purple-300/20 text-purple-100" : "bg-white/10 text-slate-300"}`}>
            {rank}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-white">{candidate.title || "Short candidate"}</p>
            <p className="mt-1 truncate text-xs font-semibold text-slate-500">{candidate.hookType || candidate.editDecisionList?.strategy || "Hook"}</p>
          </div>
        </div>
        <span className="shrink-0 rounded bg-emerald-300/15 px-2 py-1 text-xs font-black text-emerald-100">{formatScore(candidate.score)}</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5 text-[10px] font-black uppercase text-slate-300">
        <span className="truncate rounded bg-black/30 px-2 py-1.5">{candidate.durationSeconds || candidate.editDecisionList?.actualDurationSeconds || 0}s</span>
        <span className="truncate rounded bg-black/30 px-2 py-1.5">{segments.length} cuts</span>
        <span className="truncate rounded bg-black/30 px-2 py-1.5">{captions.length} caps</span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <StatusPill status={candidateRenderStatus(candidate)} />
        <span className={`text-[10px] font-black uppercase tracking-normal ${warningCount ? "text-amber-100" : url ? "text-emerald-100" : "text-slate-500"}`}>
          {warningCount ? `${warningCount} warn` : url ? "MP4 ready" : "pending"}
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-xs font-semibold leading-5 text-slate-400">{candidate.metadata?.chain || candidate.editDecisionList?.strategy || "Candidate chain"}</p>
    </button>
  );
}

function ReviewActions({ mode, onReview, disabled }) {
  const actions = [
    ["Approve", "APPROVE", CheckCircle2],
    ["Reject", "REJECT", RefreshCw],
    ["Pin", "PIN", Pin],
    ["Lock", "LOCK", Lock],
    ["Regenerate", "REGENERATE", Zap],
    ["Captions", "MODIFY_CAPTIONS", Captions],
    ["Segment", "REPLACE_SEGMENT", Scissors],
    ["Timeline", "LOCK", Layers3],
    ["Analytics", "PIN", BarChart3],
  ];

  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-normal text-slate-400">Human Review</p>
        <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-black uppercase text-slate-300">{mode}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-3">
        {actions.map(([label, action, Icon]) => (
          <button
            key={label}
            type="button"
            disabled={disabled}
            onClick={() => onReview(action)}
            className="creator-control flex min-h-[2.5rem] items-center gap-2 px-3 py-2 text-left text-xs font-bold text-slate-200 disabled:opacity-50"
          >
            <Icon size={13} className="shrink-0 text-purple-200" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, detail, spinning = false }) {
  return (
    <div className="grid min-h-[20rem] place-items-center rounded-lg border border-white/10 bg-black/20 p-6 text-center">
      <div>
        <Icon size={30} className={`mx-auto text-slate-500 ${spinning ? "animate-spin" : ""}`} />
        <p className="mt-3 text-lg font-black text-white">{title}</p>
        <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-slate-400">{detail}</p>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const normalized = String(status || "PENDING").toUpperCase();
  const visual = visualForStatus(normalized);
  return <span className={`rounded px-2 py-1 text-[10px] font-black uppercase ${visual.pillClass}`}>{normalized}</span>;
}

function visualForStatus(status) {
  const normalized = String(status || "PENDING").toUpperCase();
  if (["FAILED", "ERROR"].includes(normalized)) {
    return { icon: XCircle, className: "border-rose-300/25 bg-rose-300/[0.07]", iconClass: "text-rose-200", pillClass: "bg-rose-300/15 text-rose-100" };
  }
  if (["COMPLETED", "PASS", "DONE", "SUCCESS", "SUCCEEDED"].includes(normalized)) {
    return { icon: CheckCircle2, className: "border-emerald-300/20 bg-emerald-300/[0.07]", iconClass: "text-emerald-200", pillClass: "bg-emerald-300/15 text-emerald-100" };
  }
  if (["WARN", "SKIPPED", "PARTIAL"].includes(normalized)) {
    return { icon: AlertTriangle, className: "border-amber-300/20 bg-amber-300/[0.07]", iconClass: "text-amber-200", pillClass: "bg-amber-300/15 text-amber-100" };
  }
  if (normalized === "PAUSED") {
    return { icon: Pause, className: "border-amber-300/25 bg-amber-300/[0.08]", iconClass: "text-amber-200", pillClass: "bg-amber-300/15 text-amber-100" };
  }
  if (["RUNNING", "ACTIVE", "QUEUED", "RERENDER_QUEUED", "RERENDER_REQUESTED"].includes(normalized) || normalized.includes("RENDERING")) {
    return { icon: Loader2, className: "border-purple-300/30 bg-purple-500/[0.12]", iconClass: "animate-spin text-purple-200", pillClass: "bg-purple-300/15 text-purple-100" };
  }
  return { icon: Circle, className: "border-white/10 bg-black/20", iconClass: "text-slate-500", pillClass: "bg-white/10 text-slate-300" };
}

function maturityClass(maturity) {
  if (maturity === "real") return "bg-emerald-300/15 text-emerald-100";
  if (maturity === "partial") return "bg-amber-300/15 text-amber-100";
  if (maturity === "ai") return "bg-purple-300/15 text-purple-100";
  if (maturity === "remaining") return "bg-rose-300/15 text-rose-100";
  return "bg-white/10 text-slate-300";
}

function jobPayload(job = {}) {
  return firstObject(job?.result, job?.outputPayload);
}

function transcriptFrom(video, job) {
  const payload = jobPayload(job);
  const liveGraph = firstObject(payload.transcriptGraph, isDialogueGraph(payload.graph) ? payload.graph : {});
  return normalizeTranscriptNodes(firstArray(
    payload.transcript,
    payload.transcriptPreview?.nodes,
    video?.transcript,
    video?.metadata?.transcriptSnapshot?.nodes,
    payload.sceneTimeline?.dialogue,
    payload.timelineIntelligence?.dialogue,
    video?.metadata?.sceneTimeline?.dialogue,
    video?.metadata?.timelineIntelligence?.dialogue,
    liveGraph.nodes
  ));
}

function graphFrom(video, job) {
  const payload = jobPayload(job);
  return firstObject(payload.graph, video?.graph, payload.graphPreview, payload.transcriptGraph, buildTranscriptGraph(transcriptFrom(video, job), "client_transcript_timeline"));
}

function sceneTimelineFrom(video, job, transcript) {
  const payload = jobPayload(job);
  const timelineCandidates = [
    payload.sceneTimeline,
    payload.timelineIntelligence,
    video?.metadata?.sceneTimeline,
    video?.metadata?.timelineIntelligence,
    video?.metadata?.visualAnalysis?.sceneTimeline,
    video?.metadata?.visualAnalysis?.timelineIntelligence,
    payload.sceneTimelinePreview,
  ];
  for (const candidate of timelineCandidates) {
    const normalized = normalizeTimelineIntelligence(candidate, transcript);
    if (arrayValue(normalized.scenes).length || arrayValue(normalized.dialogue).length) return normalized;
  }
  const sceneAnalysis = firstObject(payload.sceneAnalysis, video?.metadata?.sceneAnalysis);
  const scenes = firstArray(payload.scenes, sceneAnalysis.scenes, sceneAnalysis.metadata?.scenes);
  const frames = firstArray(payload.frames, sceneAnalysis.frames, sceneAnalysis.metadata?.frames);
  const built = buildSceneTimeline(scenes, frames, transcript, firstObject(payload.sceneCritic, video?.metadata?.deepSceneCritic?.sceneCritic), firstObject(payload.continuityCritic, video?.metadata?.continuityCritic));
  if (arrayValue(built.scenes).length || arrayValue(built.dialogue).length) return built;
  return buildTranscriptOnlyTimeline(transcript);
}

function transcriptGraphFrom(video, job, transcript) {
  const payload = jobPayload(job);
  return firstObject(
    payload.transcriptGraph,
    isDialogueGraph(payload.graph) ? payload.graph : {},
    isDialogueGraph(video?.graph) ? video.graph : {},
    buildTranscriptGraph(transcript, "client_transcript_timeline")
  );
}

function traceFrom(video, job) {
  const payload = jobPayload(job);
  return firstArray(payload.trace, video?.trace, job?.outputPayload?.trace, job?.result?.trace)
    .map((row) => (typeof row === "object" && row ? row : { stage: "TRACE", status: "INFO", summary: String(row) }))
    .filter(Boolean);
}

function latestStageLabel(traceRows, job) {
  const active = jobPayload(job).activeStage;
  if (active) return labelForStage(active);
  const last = traceRows[traceRows.length - 1];
  return labelForStage(last?.stage);
}

function visualAnalysisJobIdFrom(video) {
  return firstText(video?.metadata?.visualAnalysis?.jobId, video?.metadata?.visualAnalysisJobId);
}

function statusLabel(status) {
  const normalized = String(status || "").toUpperCase();
  if (!normalized || normalized === "WAITING") return "Not run";
  if (normalized === "PENDING") return "Queued";
  if (normalized === "RUNNING") return "Running";
  if (normalized === "COMPLETED" || normalized === "SUCCESS" || normalized === "SUCCEEDED") return "Done";
  if (normalized === "FAILED" || normalized === "ERROR") return "Failed";
  return normalized.replace(/_/g, " ").toLowerCase();
}

function labelForStage(stageName) {
  const normalized = String(stageName || "").toUpperCase();
  return pipelineStages.find((stage) => stage.stage === normalized)?.label || normalized;
}

function normalizeStage(stageName) {
  return String(stageName || "").trim().toUpperCase().replace(/[-\s]+/g, "_");
}

function manualCurrentStage(video, job, traceRows = []) {
  const payload = jobPayload(job);
  const pauseState = video?.metadata?.pauseState || {};
  const lastTrace = traceRows[traceRows.length - 1] || {};
  const stage = firstText(
    payload.pausedStage,
    payload.activeStage,
    pauseState.stage,
    lastTrace.stage,
    video?.status ? "INGESTION" : "READY"
  );
  return normalizeStage(stage || "READY");
}

function manualNextStageFor(video, job, currentStage) {
  const payload = jobPayload(job);
  const pauseState = video?.metadata?.pauseState || {};
  const explicit = normalizeStage(firstText(payload.manualNextStage, pauseState.nextStage));
  if (explicit) return explicit;
  return nextManualCheckpoint(currentStage);
}

function nextManualCheckpoint(stage) {
  const normalized = normalizeStage(stage);
  const index = manualCheckpointStages.indexOf(normalized);
  if (index < 0 || index + 1 >= manualCheckpointStages.length) return "";
  return manualCheckpointStages[index + 1];
}

function manualRunEnabled(video, job) {
  const payload = jobPayload(job);
  const settings = video?.settings || {};
  const metadata = video?.metadata || {};
  return payload.manualStepMode === true
    || settings.manualStepMode === true
    || normalizeStage(payload.executionMode) === "MANUAL_STEP"
    || normalizeStage(settings.executionMode) === "MANUAL_STEP"
    || normalizeStage(metadata.executionMode) === "MANUAL_STEP";
}

function stageOutputFor(stageName, video, job, transcript, graph, sceneTimeline, candidates) {
  const stage = normalizeStage(stageName);
  const payload = jobPayload(job);
  const traceRows = traceFrom(video, job);
  const trace = [...traceRows].reverse().find((row) => normalizeStage(row.stage) === stage) || traceRows[traceRows.length - 1] || {};
  const sceneAnalysis = firstObject(payload.sceneAnalysis, video?.metadata?.sceneAnalysis);
  const sceneTimelinePayload = firstObject(payload.sceneTimeline, video?.metadata?.sceneTimeline, sceneTimeline);
  const candidatePayloads = firstArray(payload.candidatePayloads, payload.candidates);
  const transcriptNodeCount = countValue(payload.transcriptNodeCount, payload.transcriptPreview?.metadata?.nodeCount, normalizeTranscriptNodes(transcript).length);
  const graphNodeCount = countValue(payload.graphNodeCount, payload.graphPreview?.metadata?.nodeCount, payload.graphBuild?.nodeCount, arrayValue(graph?.nodes).length);
  const graphEdgeCount = countValue(payload.graphEdgeCount, payload.graphPreview?.metadata?.edgeCount, payload.graphBuild?.edgeCount, arrayValue(graph?.edges).length);
  const sceneCount = countValue(payload.sceneCount, payload.sceneTimelinePreview?.metadata?.sceneCount, sceneTimelinePayload?.metadata?.sceneCount, arrayValue(sceneTimelinePayload?.scenes).length, arrayValue(sceneAnalysis?.scenes).length);
  const frameCount = countValue(payload.frameCount, payload.sceneTimelinePreview?.metadata?.frameCount, sceneTimelinePayload?.metadata?.frameCount, sceneAnalysis?.metadata?.frameCount, arrayValue(sceneAnalysis?.frames).length);
  const detail = stageDetailFor(stage, {
    payload,
    video,
    transcript,
    graph,
    sceneTimeline: sceneTimelinePayload,
    sceneAnalysis,
    candidates,
    candidatePayloads,
  });
  return pruneEmpty({
    stage,
    stageLabel: labelForStage(stage),
    status: String(job?.status || video?.status || "READY").toUpperCase(),
    progress: job?.progress ?? null,
    message: payload.message || job?.message || "",
    nextStage: manualNextStageFor(video, job, stage),
    videoId: video?.videoId || "",
    generationJobId: video?.generationJobId || job?.jobId || job?.id || "",
    sourceAssetId: video?.sourceAssetId || payload.sourceAssetId || "",
    trace,
    metrics: {
      traceRows: traceRows.length,
      transcriptNodes: transcriptNodeCount,
      graphNodes: graphNodeCount,
      graphEdges: graphEdgeCount,
      scenes: sceneCount,
      frames: frameCount,
      candidates: arrayValue(candidates).length || arrayValue(candidatePayloads).length,
    },
    output: detail,
  });
}

function stageDetailFor(stage, context) {
  const { payload, video, transcript, graph, sceneTimeline, sceneAnalysis, candidates, candidatePayloads } = context;
  const base = {
    activeStage: payload.activeStage,
    pausedStage: payload.pausedStage,
    manualAdvanceFromStage: payload.manualAdvanceFromStage,
    manualNextStage: payload.manualNextStage,
  };
  if (stage === "INGESTION") {
    return pruneEmpty({
      ...base,
      source: {
        fileName: video?.originalFileName,
        sourceAssetId: video?.sourceAssetId || payload.sourceAssetId,
        sourceBucket: video?.metadata?.sourceBucket,
        sourceObjectKey: video?.metadata?.sourceObjectKey,
        contentType: video?.metadata?.ingestion?.contentType,
        sizeBytes: video?.metadata?.ingestion?.sizeBytes,
      },
    });
  }
  if (["VIDEO_TYPE_CLASSIFICATION", "VIDEO_TYPE_CRITIC"].includes(stage)) {
    return pruneEmpty({
      ...base,
      videoDna: payload.videoDna,
      videoTypeCritic: payload.videoTypeCritic,
      mediaBackedUnderstanding: payload.mediaBackedUnderstanding,
    });
  }
  if (["TRANSCRIPT", "TRANSCRIPT_CRITIC"].includes(stage)) {
    return pruneEmpty({
      ...base,
      transcript,
      transcriptPreview: payload.transcriptPreview,
      transcriptGraph: payload.transcriptGraph,
      transcriptCritic: payload.transcriptCritic,
      fullTranscriptWorker: payload.fullTranscriptWorker,
    });
  }
  if (["SCENE_ANALYSIS", "SCENE_REPAIR", "SCENE_CRITIC"].includes(stage)) {
    return pruneEmpty({
      ...base,
      sceneTimeline,
      sceneAnalysis,
      sceneCritic: payload.sceneCritic,
      sceneRepair: payload.sceneRepair,
      scenes: payload.scenes,
      frames: payload.frames,
    });
  }
  if (stage === "VIDEO_GRAPH_BUILDER") {
    return pruneEmpty({
      ...base,
      graph,
      graphPreview: payload.graphPreview,
      transcriptPreview: payload.transcriptPreview,
      graphBuild: payload.graphBuild,
    });
  }
  if (["STORY_CRITIC", "INTERESTINGNESS", "INTERESTINGNESS_CRITIC", "STORY_UNDERSTANDING"].includes(stage)) {
    return pruneEmpty({
      ...base,
      storyCritic: payload.storyCritic,
      storyUnderstanding: payload.storyUnderstanding,
      interestingnessScoring: payload.interestingnessScoring,
      interestingnessCritic: payload.interestingnessCritic,
      graph,
      transcript,
      candidatePayloads,
    });
  }
  if (["STORY_BEAT_PLANNING", "VISUAL_STORY_COMPOSITION", "COMPRESSION", "HOOK_GENERATION", "TARGETED_REPAIR"].includes(stage)) {
    return pruneEmpty({
      ...base,
      storyBeatPlanning: payload.storyBeatPlanning,
      storyBeatPlans: payload.storyBeatPlans,
      storyBeatIntents: payload.storyBeatIntents,
      visualStoryComposition: payload.visualStoryComposition,
      visualStoryPlans: payload.visualStoryPlans,
      compressionPlans: payload.compressionPlans,
      compressionPlanning: payload.compressionPlanning,
      hookGeneration: payload.hookGeneration,
      hooks: payload.hooks,
      criticRepair: payload.criticRepair,
      candidatePayloads,
    });
  }
  if (["VISUAL_ENHANCEMENT", "VISUAL_CRITIC", "CONTINUITY_CRITIC", "CANDIDATE_RANKING", "GLOBAL_CRITIC"].includes(stage)) {
    return pruneEmpty({
      ...base,
      visualEnhancement: payload.visualEnhancement,
      visualCritic: payload.visualCritic,
      continuityCritic: payload.continuityCritic,
      candidateRanking: payload.candidateRanking,
      globalCritic: payload.globalCritic,
      sceneTimeline,
      candidatePayloads,
    });
  }
  if (["RENDERING", "POST_RENDER_QA"].includes(stage)) {
    return pruneEmpty({
      ...base,
      rendering: payload.rendering,
      postRenderQa: payload.postRenderQa,
      candidates,
    });
  }
  return pruneEmpty({
    ...base,
    payloadKeys: Object.keys(payload || {}),
    transcript,
    graph,
    sceneTimeline,
    candidatePayloads,
    candidates,
  });
}

function firstText(...values) {
  const found = values.find((value) => value !== undefined && value !== null && String(value).trim() !== "");
  return found == null ? "" : String(found);
}

function countValue(...values) {
  for (const value of values) {
    const number = numberValue(value, NaN);
    if (Number.isFinite(number) && number > 0) return number;
  }
  return 0;
}

function pruneEmpty(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  return Object.entries(value).reduce((acc, [key, item]) => {
    if (item === undefined || item === null || item === "") return acc;
    if (Array.isArray(item) && item.length === 0) return acc;
    if (typeof item === "object" && !Array.isArray(item)) {
      const nested = pruneEmpty(item);
      if (!Object.keys(nested).length) return acc;
      acc[key] = nested;
      return acc;
    }
    acc[key] = item;
    return acc;
  }, {});
}

function fileSizeLabel(bytes = 0) {
  const value = Number(bytes || 0);
  if (value >= 1024 * 1024 * 1024) return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${value} B`;
}

function traceDetail(row = {}) {
  const confidence = row.confidence == null ? "" : `confidence ${Number(row.confidence).toFixed(2)}`;
  const detail = row.detail || row.reason || row.decision || "";
  const details = row.details || row.metadata || {};
  const compact = Object.entries(details)
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value).slice(0, 60) : value}`)
    .join(" | ");
  return [detail, confidence, compact].filter(Boolean).join(" | ") || "No detail";
}

function firstArray(...values) {
  return values.find((value) => Array.isArray(value) && value.length) || [];
}

function firstObject(...values) {
  return values.find((value) => value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length) || {};
}

function buildSceneTimeline(scenes = [], frames = [], transcript = [], sceneCritic = {}, continuityCritic = {}) {
  const normalizedScenes = arrayValue(scenes);
  const normalizedTranscript = normalizeTranscriptNodes(transcript);
  if (!normalizedScenes.length) return buildTranscriptOnlyTimeline(normalizedTranscript);
  const normalizedFrames = arrayValue(frames);
  const timelineScenes = normalizedScenes.map((scene, index) => {
    const start = numberValue(scene.start ?? scene.sourceStart, index);
    const end = Math.max(start + 0.1, numberValue(scene.end ?? scene.sourceEnd, start + 1));
    const sceneId = scene.id || scene.sceneId || `scene-${String(index + 1).padStart(3, "0")}`;
    const sceneFrames = framesForScene(sceneId, scene, normalizedFrames);
    const sceneTranscript = normalizedTranscript.filter((node) => {
      const sameScene = node.sceneId && node.sceneId === sceneId;
      const overlaps = numberValue(node.end, 0) >= start && numberValue(node.start, 0) <= end;
      return sameScene || overlaps;
    });
    const sceneDialogue = dialogueFromTranscript(sceneTranscript);
    const sceneSpeakerTurns = speakerTurnsFromTranscript(sceneTranscript);
    const sceneQuestionAnswer = questionAnswerForTimeline(sceneTranscript, scene);
    const activeSpeaker = dominantSpeakerForTranscript(sceneTranscript, scene);
    return {
      id: sceneId,
      index: Number(scene.index || index + 1),
      label: scene.label || `Scene ${index + 1}`,
      start: roundSeconds(start),
      end: roundSeconds(end),
      durationSeconds: roundSeconds(end - start),
      transcript: sceneTranscript,
      dialogue: sceneDialogue,
      speakerTurns: sceneSpeakerTurns,
      questionAnswer: sceneQuestionAnswer,
      activeSpeaker,
      speakerFocus: firstObject(scene.speakerFocus, speakerFocusForSpeaker(activeSpeaker)),
      speakerFocusCropAnchor: firstText(scene.speakerFocusCropAnchor, speakerFocusForSpeaker(activeSpeaker).cropAnchor),
      transcriptNodeCount: sceneTranscript.length,
      frames: sceneFrames,
      frameIds: sceneFrames.map((frame) => frame.id || frame.frameId).filter(Boolean),
      visualAnalysis: {
        scene,
        visualSummary: scene.visualSummary || scene.summary || scene.description || "",
        activeSpeaker,
        shotType: scene.shotType || "",
        transitionReason: scene.transitionReason || "",
        bRollOpportunity: scene.bRollOpportunity || "",
        captionSafeArea: scene.captionSafeArea || {},
        representativeFrameId: scene.representativeFrameId || "",
        frameCount: sceneFrames.length,
        hasVisualEvidence: sceneFrames.length > 0,
        source: scene.source || "scene_analysis",
        critic: sceneCritic,
        criticStatus: sceneCritic.status || "",
        criticConfidence: Number(sceneCritic.confidence || 0),
      },
      continuity: {
        status: sceneFrames.length ? "READY" : "WARN",
        coverage: {
          transcriptNodeCount: sceneTranscript.length,
          frameCount: sceneFrames.length,
          hasVisualEvidence: sceneFrames.length > 0,
        },
        continuityCritic,
        transitionRisk: sceneFrames.length ? "NORMAL" : "VISUAL_EVIDENCE_WEAK",
        notes: sceneFrames.length ? "Scene has transcript and visual evidence for timeline review." : "No representative frame was available for this scene.",
      },
      transitionIn: transitionFor(normalizedScenes[index - 1], scene, "IN", index),
      transitionOut: transitionFor(scene, normalizedScenes[index + 1], "OUT", index + 1),
      json: {
        scene,
        transcript: sceneTranscript,
        dialogue: sceneDialogue,
        speakerTurns: sceneSpeakerTurns,
        questionAnswer: sceneQuestionAnswer,
        frames: sceneFrames,
      },
    };
  });
  const dialogue = dialogueFromTranscript(normalizedTranscript);
  const speakerTurns = speakerTurnsFromTranscript(normalizedTranscript);
  const questionAnswerTurns = questionAnswerTurnsFromTranscript(normalizedTranscript, timelineScenes);
  return {
    source: "client_scene_timeline",
    schema: "timeline_intelligence_v2",
    timelineStart: 0,
    timelineEnd: Math.max(...timelineScenes.map((scene) => numberValue(scene.end, 0))),
    dialogue,
    speakerTurns,
    questionAnswerTurns,
    scenes: timelineScenes,
    json: {
      sceneMap: timelineScenes,
      frames: normalizedFrames,
      dialogue,
      speakerTurns,
      questionAnswerTurns,
    },
    metadata: {
      source: "client_scene_timeline",
      schema: "timeline_intelligence_v2",
      sceneCount: timelineScenes.length,
      frameCount: normalizedFrames.length,
      transcriptNodeCount: normalizedTranscript.length,
      dialogueCount: dialogue.length,
      speakerTurnCount: speakerTurns.length,
      questionAnswerCount: questionAnswerTurns.length,
      hasVisualEvidence: normalizedFrames.length > 0,
      hasContinuityCritic: Object.keys(continuityCritic || {}).length > 0,
    },
  };
}

function normalizeTimelineIntelligence(timeline = {}, transcript = []) {
  const payload = firstObject(timeline);
  if (!Object.keys(payload).length) return {};
  const fallbackTranscript = normalizeTranscriptNodes(firstArray(
    transcript,
    payload.transcript,
    payload.dialogue,
    payload.json?.dialogue
  ));
  const rawScenes = arrayValue(payload.scenes);
  if (!rawScenes.length) return buildTranscriptOnlyTimeline(fallbackTranscript);
  const frames = firstArray(payload.frames, payload.json?.frames, payload.frameMap);
  const timelineStart = numberValue(payload.timelineStart, 0);
  const timelineScenes = rawScenes.map((scene, index) => normalizeTimelineScene(scene, index, fallbackTranscript, frames));
  const dialogue = arrayValue(payload.dialogue).length ? normalizeDialogueNodes(payload.dialogue) : dialogueFromTranscript(fallbackTranscript);
  const speakerTurns = arrayValue(payload.speakerTurns).length ? normalizeSpeakerTurns(payload.speakerTurns) : speakerTurnsFromTranscript(fallbackTranscript);
  const questionAnswerTurns = arrayValue(payload.questionAnswerTurns).length
    ? arrayValue(payload.questionAnswerTurns)
    : questionAnswerTurnsFromTranscript(fallbackTranscript, timelineScenes);
  const timelineEnd = Math.max(
    timelineStart + 0.1,
    numberValue(payload.timelineEnd, Math.max(...timelineScenes.map((scene) => numberValue(scene.end, 0))))
  );
  const metadata = {
    ...firstObject(payload.metadata),
    source: payload.source || payload.metadata?.source || "timeline_intelligence",
    schema: payload.schema || payload.metadata?.schema || "timeline_intelligence_v2",
    sceneCount: timelineScenes.length,
    frameCount: countValue(payload.metadata?.frameCount, frames.length, timelineScenes.reduce((total, scene) => total + arrayValue(scene.frames).length, 0)),
    transcriptNodeCount: countValue(payload.metadata?.transcriptNodeCount, fallbackTranscript.length, dialogue.length),
    dialogueCount: countValue(payload.metadata?.dialogueCount, dialogue.length),
    speakerTurnCount: countValue(payload.metadata?.speakerTurnCount, speakerTurns.length),
    questionAnswerCount: countValue(payload.metadata?.questionAnswerCount, questionAnswerTurns.length),
    hasVisualEvidence: Boolean(payload.metadata?.hasVisualEvidence) || timelineScenes.some((scene) => scene.visualAnalysis?.hasVisualEvidence),
  };
  return {
    ...payload,
    source: payload.source || metadata.source,
    schema: metadata.schema,
    timelineStart,
    timelineEnd: roundSeconds(timelineEnd),
    dialogue,
    speakerTurns,
    questionAnswerTurns,
    scenes: timelineScenes,
    json: {
      ...firstObject(payload.json),
      sceneMap: timelineScenes,
      frames,
      dialogue,
      speakerTurns,
      questionAnswerTurns,
    },
    metadata,
  };
}

function normalizeTimelineScene(scene = {}, index = 0, transcript = [], frames = []) {
  const start = numberValue(scene.start ?? scene.sourceStart, index);
  const end = Math.max(start + 0.1, numberValue(scene.end ?? scene.sourceEnd, start + 1));
  const sceneId = scene.id || scene.sceneId || `scene-${String(index + 1).padStart(3, "0")}`;
  const sceneTranscript = normalizeTranscriptNodes(firstArray(scene.transcript, scene.dialogue));
  const attachedTranscript = sceneTranscript.length
    ? sceneTranscript
    : normalizeTranscriptNodes(transcript).filter((node) => {
      const sameScene = node.sceneId && node.sceneId === sceneId;
      const overlaps = numberValue(node.end, 0) >= start && numberValue(node.start, 0) <= end;
      return sameScene || overlaps;
    });
  const sceneFrames = firstArray(scene.frames, framesForScene(sceneId, scene, frames));
  const sceneDialogue = arrayValue(scene.dialogue).length ? normalizeDialogueNodes(scene.dialogue) : dialogueFromTranscript(attachedTranscript);
  const sceneSpeakerTurns = arrayValue(scene.speakerTurns).length ? normalizeSpeakerTurns(scene.speakerTurns) : speakerTurnsFromTranscript(attachedTranscript);
  const sceneQuestionAnswer = firstObject(scene.questionAnswer, questionAnswerForTimeline(attachedTranscript, scene));
  const activeSpeaker = firstText(scene.activeSpeaker, dominantSpeakerForTranscript(attachedTranscript, scene));
  const visual = firstObject(scene.visualAnalysis);
  const continuity = firstObject(scene.continuity);
  return {
    ...scene,
    id: sceneId,
    index: Number(scene.index || index + 1),
    label: scene.label || `Scene ${index + 1}`,
    start: roundSeconds(start),
    end: roundSeconds(end),
    durationSeconds: roundSeconds(end - start),
    transcript: attachedTranscript,
    dialogue: sceneDialogue,
    speakerTurns: sceneSpeakerTurns,
    questionAnswer: sceneQuestionAnswer,
    activeSpeaker,
    speakerFocus: firstObject(scene.speakerFocus, speakerFocusForSpeaker(activeSpeaker)),
    speakerFocusCropAnchor: firstText(scene.speakerFocusCropAnchor, speakerFocusForSpeaker(activeSpeaker).cropAnchor),
    transcriptNodeCount: countValue(scene.transcriptNodeCount, attachedTranscript.length),
    frames: sceneFrames,
    frameIds: firstArray(scene.frameIds, sceneFrames.map((frame) => frame.id || frame.frameId).filter(Boolean)),
    visualAnalysis: {
      scene,
      ...visual,
      visualSummary: firstText(visual.visualSummary, scene.visualSummary, scene.summary, scene.description),
      activeSpeaker,
      shotType: firstText(visual.shotType, scene.shotType),
      transitionReason: firstText(visual.transitionReason, scene.transitionReason),
      bRollOpportunity: firstText(visual.bRollOpportunity, scene.bRollOpportunity),
      captionSafeArea: firstObject(visual.captionSafeArea, scene.captionSafeArea),
      frameCount: countValue(visual.frameCount, sceneFrames.length),
      hasVisualEvidence: Boolean(visual.hasVisualEvidence) || sceneFrames.length > 0,
      source: firstText(visual.source, scene.source, "timeline_intelligence"),
    },
    continuity: {
      ...continuity,
      status: firstText(continuity.status, sceneFrames.length ? "READY" : "WARN"),
      transitionRisk: firstText(continuity.transitionRisk, sceneFrames.length ? "NORMAL" : "VISUAL_EVIDENCE_WEAK"),
      notes: firstText(continuity.notes, scene.continuityNotes, scene.transitionReason, sceneFrames.length ? "Scene has timeline evidence." : "Visual evidence is pending."),
      coverage: firstObject(continuity.coverage, {
        transcriptNodeCount: attachedTranscript.length,
        frameCount: sceneFrames.length,
        hasVisualEvidence: sceneFrames.length > 0,
      }),
    },
    transitionIn: firstObject(scene.transitionIn),
    transitionOut: firstObject(scene.transitionOut),
    json: firstObject(scene.json, {
      scene,
      transcript: attachedTranscript,
      dialogue: sceneDialogue,
      speakerTurns: sceneSpeakerTurns,
      questionAnswer: sceneQuestionAnswer,
      frames: sceneFrames,
    }),
  };
}

function buildTranscriptOnlyTimeline(transcript = []) {
  const nodes = normalizeTranscriptNodes(transcript);
  if (!nodes.length) return {};
  const groups = [];
  let current = null;
  nodes.forEach((node, index) => {
    const speaker = node.speaker || "Speaker";
    const shouldStart = !current
      || current.nodes.length >= 6
      || numberValue(node.end, 0) - numberValue(current.start, 0) > 45
      || (speaker !== current.speaker && current.nodes.length >= 2);
    if (shouldStart) {
      current = {
        id: `transcript-scene-${String(groups.length + 1).padStart(3, "0")}`,
        index: groups.length + 1,
        speaker,
        start: node.start,
        end: node.end,
        nodes: [],
      };
      groups.push(current);
    }
    current.nodes.push(node);
    current.end = Math.max(numberValue(current.end, node.end), numberValue(node.end, node.start));
    if (!current.label) current.label = `${speaker} ${index + 1}`;
  });
  const scenes = groups.map((group, index) => {
    const sceneTranscript = normalizeTranscriptNodes(group.nodes);
    const sceneDialogue = dialogueFromTranscript(sceneTranscript);
    const sceneSpeakerTurns = speakerTurnsFromTranscript(sceneTranscript);
    const sceneQuestionAnswer = questionAnswerForTimeline(sceneTranscript, group);
    const activeSpeaker = dominantSpeakerForTranscript(sceneTranscript, group);
    return {
      id: group.id,
      index: index + 1,
      label: group.label || `Dialogue ${index + 1}`,
      start: roundSeconds(group.start),
      end: roundSeconds(group.end),
      durationSeconds: roundSeconds(group.end - group.start),
      transcript: sceneTranscript,
      dialogue: sceneDialogue,
      speakerTurns: sceneSpeakerTurns,
      questionAnswer: sceneQuestionAnswer,
      activeSpeaker,
      speakerFocus: speakerFocusForSpeaker(activeSpeaker),
      speakerFocusCropAnchor: speakerFocusForSpeaker(activeSpeaker).cropAnchor,
      transcriptNodeCount: sceneTranscript.length,
      frames: [],
      frameIds: [],
      visualAnalysis: {
        source: "transcript_only_timeline",
        activeSpeaker,
        frameCount: 0,
        hasVisualEvidence: false,
        visualSummary: sceneDialogue.map((item) => item.text).join(" ").slice(0, 240),
      },
      continuity: {
        status: "READY",
        transitionRisk: "TRANSCRIPT_LED",
        notes: "Transcript-led timeline slice. Optional visual analysis can enrich this later.",
        coverage: {
          transcriptNodeCount: sceneTranscript.length,
          frameCount: 0,
          hasVisualEvidence: false,
        },
      },
      transitionIn: transitionFor(groups[index - 1], group, "IN", index),
      transitionOut: transitionFor(group, groups[index + 1], "OUT", index + 1),
      json: {
        transcript: sceneTranscript,
        dialogue: sceneDialogue,
        speakerTurns: sceneSpeakerTurns,
        questionAnswer: sceneQuestionAnswer,
        frames: [],
      },
    };
  });
  const dialogue = dialogueFromTranscript(nodes);
  const speakerTurns = speakerTurnsFromTranscript(nodes);
  const questionAnswerTurns = questionAnswerTurnsFromTranscript(nodes, scenes);
  return {
    source: "client_transcript_timeline",
    schema: "timeline_intelligence_v2",
    timelineStart: numberValue(nodes[0]?.start, 0),
    timelineEnd: Math.max(...nodes.map((node) => numberValue(node.end, 0))),
    dialogue,
    speakerTurns,
    questionAnswerTurns,
    scenes,
    json: {
      sceneMap: scenes,
      frames: [],
      dialogue,
      speakerTurns,
      questionAnswerTurns,
    },
    metadata: {
      source: "client_transcript_timeline",
      schema: "timeline_intelligence_v2",
      sceneCount: scenes.length,
      frameCount: 0,
      transcriptNodeCount: nodes.length,
      dialogueCount: dialogue.length,
      speakerTurnCount: speakerTurns.length,
      questionAnswerCount: questionAnswerTurns.length,
      hasVisualEvidence: false,
      transcriptOnlyFallback: true,
    },
  };
}

function normalizeDialogueNodes(nodes = []) {
  return normalizeTranscriptNodes(nodes).map((node, index) => ({
    id: node.id || `d-${String(index + 1).padStart(3, "0")}`,
    index: Number(node.index || index + 1),
    start: node.start,
    end: node.end,
    speaker: node.speaker || "Speaker",
    text: node.text || node.transcript || "",
    transcript: node.transcript || node.text || "",
    isQuestion: Boolean(node.isQuestion) || questionLikeText(node.text || node.transcript),
    sceneId: node.sceneId || "",
    speakerFocus: firstObject(node.speakerFocus, speakerFocusForSpeaker(node.speaker || "Speaker")),
  }));
}

function dialogueFromTranscript(nodes = []) {
  return normalizeDialogueNodes(nodes);
}

function normalizeSpeakerTurns(turns = []) {
  return arrayValue(turns).map((turn, index) => ({
    ...turn,
    id: turn.id || `turn-${String(index + 1).padStart(3, "0")}`,
    index: Number(turn.index || index + 1),
    speaker: turn.speaker || "Speaker",
    start: roundSeconds(numberValue(turn.start, index)),
    end: roundSeconds(Math.max(numberValue(turn.start, index) + 0.1, numberValue(turn.end, numberValue(turn.start, index) + 1))),
    text: String(turn.text || turn.transcript || "").trim(),
    isQuestion: Boolean(turn.isQuestion) || questionLikeText(turn.text || turn.transcript),
    dialogueIds: arrayValue(turn.dialogueIds),
  })).filter((turn) => turn.text);
}

function speakerTurnsFromTranscript(nodes = []) {
  const dialogue = dialogueFromTranscript(nodes);
  const turns = [];
  let current = null;
  dialogue.forEach((node) => {
    const speaker = node.speaker || "Speaker";
    if (!current || current.speaker !== speaker) {
      current = {
        id: `turn-${String(turns.length + 1).padStart(3, "0")}`,
        index: turns.length + 1,
        speaker,
        start: node.start,
        end: node.end,
        text: "",
        isQuestion: false,
        dialogueIds: [],
      };
      turns.push(current);
    }
    current.end = node.end;
    current.text = joinText(current.text, node.text || node.transcript);
    current.isQuestion = current.isQuestion || Boolean(node.isQuestion);
    current.dialogueIds = [...current.dialogueIds, node.id].filter(Boolean);
  });
  return turns;
}

function questionAnswerForTimeline(transcript = [], scene = {}) {
  return questionAnswerTurnsFromTranscript(transcript, [scene])[0] || {
    hasQuestionAnswer: false,
    question: "",
    answer: "",
    questionSpeaker: "",
    answerSpeaker: "",
  };
}

function questionAnswerTurnsFromTranscript(transcript = [], scenes = []) {
  const turns = speakerTurnsFromTranscript(transcript);
  const pairs = [];
  turns.forEach((turn, index) => {
    if (!turn.isQuestion) return;
    const answerTurn = turns.slice(index + 1).find((candidate) => candidate.speaker !== turn.speaker || !candidate.isQuestion) || {};
    pairs.push({
      id: `qa-${String(pairs.length + 1).padStart(3, "0")}`,
      index: pairs.length + 1,
      hasQuestionAnswer: Boolean(answerTurn.text),
      sceneId: sceneIdForRange(scenes, turn.start, answerTurn.end ?? turn.end),
      questionSpeaker: turn.speaker,
      question: turn.text,
      questionStart: turn.start,
      questionEnd: turn.end,
      answerSpeaker: answerTurn.speaker || "",
      answer: answerTurn.text || "",
      answerStart: answerTurn.start,
      answerEnd: answerTurn.end,
      speakerFocus: {
        question: speakerFocusForSpeaker(turn.speaker),
        answer: speakerFocusForSpeaker(answerTurn.speaker || ""),
      },
    });
  });
  return pairs;
}

function questionLikeText(text = "") {
  const value = String(text || "").trim();
  return value.includes("?") || /^(what|why|how|when|where|who|which|can|could|do|does|did|is|are|will|would|should)\b/i.test(value);
}

function sceneIdForRange(scenes = [], start = 0, end = start) {
  const midpoint = numberValue(start, 0) + Math.max(0, numberValue(end, start) - numberValue(start, 0)) / 2;
  const scene = arrayValue(scenes).find((item) => numberValue(item.start, 0) <= midpoint && numberValue(item.end, 0) >= midpoint) || {};
  return scene.id || scene.sceneId || "";
}

function dominantSpeakerForTranscript(transcript = [], scene = {}) {
  const explicit = firstText(scene.activeSpeaker, scene.speaker);
  if (explicit) return explicit;
  const counts = new Map();
  normalizeTranscriptNodes(transcript).forEach((node) => {
    const speaker = node.speaker || "Speaker";
    counts.set(speaker, (counts.get(speaker) || 0) + 1);
  });
  let best = "";
  let bestCount = 0;
  counts.forEach((count, speaker) => {
    if (count > bestCount) {
      best = speaker;
      bestCount = count;
    }
  });
  return best || "Speaker";
}

function speakerFocusForSpeaker(speaker = "") {
  const label = String(speaker || "").toLowerCase();
  const cropAnchor = /guest|speaker 2|speaker_2|right|answer/.test(label)
    ? "right"
    : /host|speaker 1|speaker_1|left|question/.test(label)
      ? "left"
      : "center";
  return {
    mode: "speaker_focus",
    speaker: speaker || "Speaker",
    cropAnchor,
  };
}

function joinText(left = "", right = "") {
  return [left, right].map((item) => String(item || "").trim()).filter(Boolean).join(" ");
}

function framesForScene(sceneId, scene, frames = []) {
  const frameIds = arrayValue(scene?.frameIds).map(String);
  const byIds = frameIds
    .map((id) => arrayValue(frames).find((frame) => String(frame?.id || frame?.frameId || "") === id))
    .filter(Boolean);
  if (byIds.length) return byIds;
  return arrayValue(frames).filter((frame) => String(frame?.sceneId || "") === sceneId);
}

function transitionFor(left, right, direction, index) {
  if (!right) return { type: "NONE", direction, reason: "No adjacent scene." };
  const leftEnd = left ? numberValue(left.end ?? left.sourceEnd, 0) : numberValue(right.start ?? right.sourceStart, 0);
  const rightStart = numberValue(right.start ?? right.sourceStart, leftEnd);
  const gap = roundSeconds(rightStart - leftEnd);
  return {
    id: `transition-${Math.max(1, index)}-${String(direction).toLowerCase()}`,
    direction,
    type: Math.abs(gap) <= 0.25 ? "CUT" : gap > 0 ? "GAP" : "OVERLAP",
    fromSceneId: left?.id || left?.sceneId || "",
    toSceneId: right?.id || right?.sceneId || "",
    at: roundSeconds(rightStart),
    gapSeconds: gap,
    reason: Math.abs(gap) <= 0.25 ? "Adjacent visual scene boundary." : gap > 0 ? "Small timeline gap between scenes." : "Scene windows overlap around boundary.",
  };
}

function emptyGraphNodeDraft() {
  return { intent: "", hook: "", beats: [], segments: [] };
}

function draftFromGraphNode(node = {}) {
  const storyIntent = node.storyIntent || {};
  const hookPlan = node.hookPlan || {};
  const storyBeatPlan = node.storyBeatPlan || {};
  const patch = node.humanPatch || {};
  const edl = node.editDecisionList || {};
  const beats = firstArray(storyBeatPlan.storyBeats, storyBeatPlan.beats, storyBeatPlan.moments).map((beat, index) => ({
    beatId: beat.beatId || beat.id || `beat-${index}`,
    nodeId: beat.nodeId || beat.sourceNodeId || "",
    role: beat.role || beat.beatType || "",
    text: beat.humanText || beat.text || beat.summary || beat.description || "",
  }));
  const segments = normalizeDraftSegments(firstArray(patch.segments, edl.segments).map((segment, index) => {
    const sourceStart = numberValue(segment.sourceStart ?? segment.start, 0);
    const sourceEnd = numberValue(segment.sourceEnd ?? segment.end, sourceStart + 1);
    return {
      segmentId: segment.segmentId || segment.id || `segment-${index}`,
      nodeId: segment.nodeId || "",
      sceneId: segment.sceneId || "",
      label: segment.label || segment.transcript || segment.text || segment.nodeId || `Segment ${index + 1}`,
      sourceStart,
      sourceEnd,
      originalSourceStart: numberValue(segment.originalSourceStart, sourceStart),
      originalSourceEnd: numberValue(segment.originalSourceEnd, sourceEnd),
      frames: arrayValue(segment.frames),
      interestingness: numberValue(segment.interestingness ?? segment.interestingnessScore, 0),
      locked: Boolean(segment.locked),
    };
  }));
  return {
    intent: storyIntent.humanIntent || storyIntent.viewerIntent || storyIntent.storyPromise || storyIntent.intent || "",
    hook: hookPlan.openingLine || hookPlan.hook || node.hook || "",
    beats,
    segments,
  };
}

function normalizeDraftSegments(segments = []) {
  let timeline = 0;
  return arrayValue(segments).map((segment, index) => {
    const originalSourceStart = numberValue(segment.originalSourceStart, numberValue(segment.sourceStart, 0));
    const originalSourceEnd = Math.max(originalSourceStart + 0.1, numberValue(segment.originalSourceEnd, numberValue(segment.sourceEnd, originalSourceStart + 1)));
    const sourceStart = clampNumber(numberValue(segment.sourceStart, originalSourceStart), originalSourceStart, originalSourceEnd - 0.1);
    const sourceEnd = clampNumber(numberValue(segment.sourceEnd, originalSourceEnd), sourceStart + 0.1, originalSourceEnd);
    const duration = Math.max(0.1, sourceEnd - sourceStart);
    const normalized = {
      ...segment,
      segmentId: segment.segmentId || `segment-${index}`,
      sourceStart: roundSeconds(sourceStart),
      sourceEnd: roundSeconds(sourceEnd),
      originalSourceStart: roundSeconds(originalSourceStart),
      originalSourceEnd: roundSeconds(originalSourceEnd),
      timelineStart: roundSeconds(timeline),
      timelineEnd: roundSeconds(timeline + duration),
    };
    timeline += duration;
    return normalized;
  });
}

function clampSegmentStart(segment, value) {
  const originalSourceStart = numberValue(segment.originalSourceStart, 0);
  const sourceEnd = numberValue(segment.sourceEnd, originalSourceStart + 0.2);
  return roundSeconds(clampNumber(numberValue(value, originalSourceStart), originalSourceStart, sourceEnd - 0.1));
}

function clampSegmentEnd(segment, value) {
  const originalSourceEnd = numberValue(segment.originalSourceEnd, numberValue(segment.sourceEnd, 1));
  const sourceStart = numberValue(segment.sourceStart, 0);
  return roundSeconds(clampNumber(numberValue(value, originalSourceEnd), sourceStart + 0.1, originalSourceEnd));
}

function totalDraftDuration(segments = []) {
  return arrayValue(segments).reduce((total, segment) => total + Math.max(0, numberValue(segment.sourceEnd, 0) - numberValue(segment.sourceStart, 0)), 0);
}

function normalizeTranscriptNodes(nodes = []) {
  return arrayValue(nodes)
    .map((node, index) => {
      const start = numberValue(node?.start ?? node?.sourceStart ?? node?.timelineStart, index);
      const end = Math.max(start + 0.1, numberValue(node?.end ?? node?.sourceEnd ?? node?.timelineEnd, start + 1));
      const transcript = String(node?.transcript || node?.text || node?.summary || "").trim();
      return {
        ...node,
        id: node?.id || node?.nodeId || `n-${String(index + 1).padStart(4, "0")}`,
        type: node?.type || "DIALOGUE",
        start: roundSeconds(start),
        end: roundSeconds(end),
        time: node?.time || `${formatTimestamp(start)} - ${formatTimestamp(end)}`,
        speaker: node?.speaker || node?.role || "Speaker",
        transcript,
        interestingness: numberValue(node?.interestingness ?? node?.interestingnessScore, 0),
        emotion: numberValue(node?.emotion ?? node?.emotionScore, 0),
        motion: numberValue(node?.motion ?? node?.motionScore, 0),
        frames: arrayValue(node?.frames),
      };
    })
    .filter((node) => node.transcript)
    .sort((a, b) => numberValue(a.start, 0) - numberValue(b.start, 0));
}

function normalizeTranscriptDraftNodes(nodes = []) {
  return arrayValue(nodes)
    .map((node, index) => {
      const start = numberValue(node?.start ?? node?.sourceStart ?? node?.timelineStart, index);
      const end = Math.max(start + 0.1, numberValue(node?.end ?? node?.sourceEnd ?? node?.timelineEnd, start + 1));
      return {
        ...node,
        id: node?.id || node?.nodeId || `n-${String(index + 1).padStart(4, "0")}`,
        type: node?.type || "DIALOGUE",
        start: roundSeconds(start),
        end: roundSeconds(end),
        time: `${formatTimestamp(start)} - ${formatTimestamp(end)}`,
        speaker: node?.speaker || node?.role || "Speaker",
        transcript: String(node?.transcript ?? node?.text ?? node?.summary ?? ""),
        interestingness: numberValue(node?.interestingness ?? node?.interestingnessScore, 0),
        emotion: numberValue(node?.emotion ?? node?.emotionScore, 0),
        motion: numberValue(node?.motion ?? node?.motionScore, 0),
        frames: arrayValue(node?.frames),
      };
    })
    .sort((a, b) => numberValue(a.start, 0) - numberValue(b.start, 0));
}

function isDialogueGraph(graph = {}) {
  const nodes = arrayValue(graph?.nodes);
  if (!nodes.length) return false;
  const source = String(graph?.analysisSource || graph?.source || "").toLowerCase();
  return source.includes("transcript") || nodes.some((node) => String(node?.type || "").toUpperCase() === "DIALOGUE");
}

function buildTranscriptGraph(nodes = [], source = "transcript_timeline") {
  const normalized = normalizeTranscriptNodes(nodes);
  if (!normalized.length) return {};
  return {
    graphViews: ["Transcript Timeline Graph", "Conversation Graph", "Story Graph", "Scene Graph", "Compression Graph"],
    analysisSource: source,
    source,
    confidence: 0.9,
    nodes: normalized.map((node, index) => ({
      ...node,
      label: `${node.speaker || "Speaker"} ${index + 1}`,
      type: "DIALOGUE",
      ordinal: index + 1,
    })),
    edges: normalized.slice(1).map((node, index) => ({
      from: normalized[index].id,
      to: node.id,
      type: "NEXT_DIALOGUE",
      reason: "Adjacent transcript dialogue in source timeline.",
    })),
    metadata: {
      source,
      nodeType: "DIALOGUE",
      nodeCount: normalized.length,
      edgeCount: Math.max(0, normalized.length - 1),
      graphReadyDuringProcessing: true,
    },
  };
}

function numberValue(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function roundSeconds(value) {
  return Math.round(Math.max(0, Number(value) || 0) * 10) / 10;
}

function round3(value) {
  return Math.round((Number(value) || 0) * 1000) / 1000;
}

function formatSecondsShort(value) {
  return roundSeconds(value).toFixed(1);
}

function nodeIntentLabel(node = {}) {
  const intent = node.storyIntent || {};
  const patch = node.humanPatch || {};
  return patch.intent || intent.humanIntent || intent.viewerIntent || intent.storyPromise || node.hookType || "";
}

function arrayValue(value) {
  return Array.isArray(value) ? value : [];
}

function idOf(candidate) {
  return candidate?.candidateId || candidate?.id || "";
}

function videoUrlFor(candidate) {
  return candidate?.renderManifest?.publicUrl
    || candidate?.renderManifest?.signedUrl
    || candidate?.metadata?.renderedAssetUrl
    || candidate?.metadata?.publicUrl
    || "";
}

function sourceVideoUrlFor(video) {
  return video?.sourceAsset?.url
    || video?.sourceAsset?.publicUrl
    || video?.sourceAsset?.signedUrl
    || video?.sourceAsset?.metadata?.sourceSignedUrl
    || video?.metadata?.sourceSignedUrl
    || "";
}

function timeRange(node = {}) {
  if (node.time) return node.time;
  const start = Number(node.start ?? node.sourceStart ?? 0);
  const end = Number(node.end ?? node.sourceEnd ?? start);
  return `${formatTimestamp(start)} - ${formatTimestamp(end)}`;
}

function selectedSceneSummary(scene = {}) {
  const transcript = arrayValue(scene.transcript);
  const firstLine = transcript.find((node) => node?.transcript || node?.text);
  return firstLine?.transcript || firstLine?.text || scene.visualAnalysis?.source || scene.continuity?.notes || "Visual scene segment";
}

function transitionLabel(transition = {}) {
  if (!transition || transition.type === "NONE") return "none";
  const gap = Number(transition.gapSeconds || 0);
  const gapText = Math.abs(gap) > 0.25 ? ` (${gap > 0 ? "+" : ""}${gap.toFixed(1)}s)` : "";
  return `${transition.type || "CUT"}${gapText}`;
}

function sceneTimelineJson(scene = {}) {
  return {
    id: scene.id,
    start: scene.start,
    end: scene.end,
    transcript: arrayValue(scene.transcript),
    dialogue: arrayValue(scene.dialogue),
    speakerTurns: arrayValue(scene.speakerTurns),
    questionAnswer: scene.questionAnswer || {},
    activeSpeaker: scene.activeSpeaker || "",
    speakerFocus: scene.speakerFocus || {},
    visualAnalysis: scene.visualAnalysis || {},
    continuity: scene.continuity || {},
    transitionIn: scene.transitionIn || {},
    transitionOut: scene.transitionOut || {},
    frames: arrayValue(scene.frames),
    json: scene.json || {},
  };
}

function formatTimestamp(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  const mins = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function compactDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 19);
  return date.toLocaleString([], {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function confidenceFrom(graph = {}) {
  const confidence = Number(graph.confidence ?? graph.metadata?.confidence ?? 0);
  return confidence > 0 ? confidence.toFixed(2) : "0.80";
}

function formatScore(value) {
  const score = Number(value || 0);
  if (!Number.isFinite(score) || score <= 0) return "0";
  return score % 1 ? score.toFixed(1) : String(score);
}

function rerenderJobIdFor(candidate, video) {
  const candidateId = idOf(candidate);
  return candidate?.renderManifest?.rerenderJobId
    || candidate?.metadata?.rerenderJobId
    || candidate?.renderManifest?.lastRerenderJobId
    || candidate?.metadata?.lastRerenderJobId
    || (candidateId && video?.metadata?.lastManualRerenderCandidateId === candidateId ? video?.metadata?.lastManualRerenderJobId : "")
    || "";
}

function candidateFromGraphNode(node, video) {
  const candidateId = node?.candidateId;
  if (!candidateId) return null;
  return arrayValue(video?.candidates).find((candidate) => idOf(candidate) === candidateId) || {
    candidateId,
    status: node?.status,
    reviewStatus: node?.reviewStatus,
    renderManifest: node?.renderManifest || {},
    metadata: node?.metadata || {},
  };
}

function buildFrameLookup(video, job) {
  const lookup = new Map();
  const payload = jobPayload(job);
  const containers = [
    payload.frames,
    arrayValue(payload.sceneTimeline?.scenes).flatMap((scene) => arrayValue(scene.frames)),
    arrayValue(video?.metadata?.sceneTimeline?.scenes).flatMap((scene) => arrayValue(scene.frames)),
    payload.sceneAnalysis?.frames,
    payload.sceneAnalysis?.metadata?.frames,
    video?.metadata?.sceneAnalysis?.frames,
    video?.metadata?.sceneAnalysis?.metadata?.frames,
    video?.metadata?.postRenderQa?.frames,
    payload.graph?.frames,
    video?.graph?.frames,
  ];
  containers.forEach((container) => {
    arrayValue(container).forEach((frame) => {
      if (!frame || typeof frame !== "object") return;
      const ids = [frame.id, frame.frameId, frame.label, frame.name].filter(Boolean);
      ids.forEach((id) => lookup.set(String(id), frame));
    });
  });
  return lookup;
}

function waveformBars(segments = []) {
  const normalized = arrayValue(segments);
  const totalDuration = Math.max(1, totalDraftDuration(normalized));
  const bars = [];
  normalized.forEach((segment, segmentIndex) => {
    const duration = Math.max(0.1, numberValue(segment.sourceEnd, 0) - numberValue(segment.sourceStart, 0));
    const count = Math.max(3, Math.round((duration / totalDuration) * 48));
    const seed = String(segment.nodeId || segment.sceneId || segment.segmentId || segmentIndex)
      .split("")
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const intensity = Math.max(18, Math.min(92, numberValue(segment.interestingness, 42) || 42));
    for (let index = 0; index < count; index += 1) {
      const wave = Math.sin((index + 1 + seed) * 0.85) * 0.5 + 0.5;
      const pulse = Math.cos((index + seed) * 0.37) * 0.5 + 0.5;
      bars.push(18 + (intensity * 0.45) + (wave * 28) + (pulse * 16));
    }
  });
  if (!bars.length) return Array.from({ length: 24 }, (_, index) => 24 + ((index * 17) % 44));
  return bars.slice(0, 64);
}

function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function stripExtension(filename = "") {
  return String(filename).replace(/\.[^.]+$/, "");
}

function errorMessage(error) {
  if (!error) return "";
  const data = error.data || error.error || error;
  if (typeof data === "string") return data;
  return data?.message || data?.error || data?.detail || error?.message || "Something went wrong.";
}
