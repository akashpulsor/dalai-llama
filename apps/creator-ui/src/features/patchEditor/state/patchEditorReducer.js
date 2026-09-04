// @ts-nocheck
import { createHistory, pushHistory, redo as redoHistory, undo as undoHistory } from "../services/historyService.js";
import { addReplacement } from "../utils/edl.js";

export const initialPatchEditorState = {
  status: "empty", // empty | loading | ready | error
  error: null,
  sourceFile: null,
  sourceUrl: null,
  // The original hosted URL this source was loaded from (loadSourceFromUrl), if any -- null for
  // a raw local file upload. Upscale needs a URL fal.ai/llm-gateway can actually fetch, which a
  // local blob: sourceUrl never is.
  sourceHostedUrl: null,
  sourceName: "",
  duration: 0,
  width: 0,
  height: 0,
  selection: null, // { inPoint, outPoint }
  playback: { currentTime: 0, isPlaying: false, loopSelection: false },
  viewMode: "original", // "original" | "patched"
  thumbnails: { status: "idle", items: [] },
  history: createHistory([]), // history.present is the EDL array
  extraction: { status: "idle", progress: 0, url: null, filename: null, error: null },
  replacement: { status: "idle", error: null },
  aiEdit: { status: "idle", progress: 0, statusLabel: "", error: null },
  // Whole-video dub / change-language job (post-production-service). On success the dubbed
  // video is loaded as a fresh source, so this only tracks progress of the running job.
  dub: { status: "idle", progress: 0, statusLabel: "", error: null, targetLanguage: null },
  // Manual "Upscale" CTA (post-production-service, type=upscale models). Single blocking call,
  // no job to poll -- see UpscalePanel/upscaleVideo.
  upscale: { status: "idle", error: null, model: null },
  exportState: { status: "idle", progress: 0, url: null, filename: null, error: null },
};

export function patchEditorReducer(state, action) {
  switch (action.type) {
    case "SOURCE_LOADING":
      return { ...initialPatchEditorState, status: "loading" };

    case "SOURCE_READY":
      return {
        ...initialPatchEditorState,
        status: "ready",
        sourceFile: action.file,
        sourceUrl: action.url,
        sourceHostedUrl: action.hostedUrl || null,
        sourceName: action.name,
        duration: action.duration,
        width: action.width,
        height: action.height,
        selection: { inPoint: 0, outPoint: Math.min(action.duration, Math.max(action.duration * 0.2, 1)) },
      };

    case "SOURCE_ERROR":
      return { ...initialPatchEditorState, status: "error", error: action.error };

    case "RESET":
      return initialPatchEditorState;

    case "SET_SELECTION":
      return { ...state, selection: { inPoint: action.inPoint, outPoint: action.outPoint } };

    case "SET_CURRENT_TIME":
      return { ...state, playback: { ...state.playback, currentTime: action.time } };

    case "SET_PLAYING":
      return { ...state, playback: { ...state.playback, isPlaying: action.isPlaying } };

    case "TOGGLE_LOOP":
      return { ...state, playback: { ...state.playback, loopSelection: !state.playback.loopSelection } };

    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.mode };

    case "THUMBNAILS_LOADING":
      return { ...state, thumbnails: { status: "loading", items: [] } };

    case "THUMBNAILS_READY":
      return { ...state, thumbnails: { status: "ready", items: action.items } };

    case "THUMBNAILS_ERROR":
      return { ...state, thumbnails: { status: "error", items: [] } };

    case "EXTRACTION_START":
      return { ...state, extraction: { status: "processing", progress: 0, url: null, filename: null, error: null } };

    case "EXTRACTION_PROGRESS":
      return { ...state, extraction: { ...state.extraction, progress: action.progress } };

    case "EXTRACTION_SUCCESS":
      return { ...state, extraction: { status: "done", progress: 1, url: action.url, filename: action.filename, error: null } };

    case "EXTRACTION_ERROR":
      return { ...state, extraction: { status: "error", progress: 0, url: null, filename: null, error: action.error } };

    case "REPLACEMENT_START":
      return { ...state, replacement: { status: "processing", error: null } };

    case "REPLACEMENT_ERROR":
      return { ...state, replacement: { status: "error", error: action.error } };

    case "AI_EDIT_START":
      return { ...state, aiEdit: { status: "processing", progress: 0, statusLabel: "Starting…", error: null } };

    case "AI_EDIT_PROGRESS":
      return { ...state, aiEdit: { ...state.aiEdit, progress: action.progress, statusLabel: action.statusLabel } };

    case "AI_EDIT_SUCCESS":
      return { ...state, aiEdit: { status: "done", progress: 1, statusLabel: "Applied", error: null } };

    case "AI_EDIT_ERROR":
      return { ...state, aiEdit: { status: "error", progress: 0, statusLabel: "", error: action.error } };

    case "DUB_START":
      return { ...state, dub: { status: "processing", progress: 0, statusLabel: "Starting…", error: null, targetLanguage: action.targetLanguage } };

    case "DUB_PROGRESS":
      return { ...state, dub: { ...state.dub, progress: action.progress, statusLabel: action.statusLabel } };

    case "DUB_SUCCESS":
      return { ...state, dub: { ...state.dub, status: "done", progress: 1, statusLabel: "Dubbed", error: null } };

    case "DUB_ERROR":
      return { ...state, dub: { ...state.dub, status: "error", progress: 0, statusLabel: "", error: action.error } };

    case "UPSCALE_START":
      return { ...state, upscale: { status: "processing", error: null, model: action.model } };

    case "UPSCALE_SUCCESS":
      return { ...state, upscale: { ...state.upscale, status: "done", error: null } };

    case "UPSCALE_ERROR":
      return { ...state, upscale: { ...state.upscale, status: "error", error: action.error } };

    case "APPLY_REPLACEMENT":
      return {
        ...state,
        replacement: { status: "done", error: null },
        history: pushHistory(state.history, addReplacement(state.history.present, action.entry)),
      };

    case "REMOVE_PATCH":
      return {
        ...state,
        history: pushHistory(
          state.history,
          state.history.present.filter((entry) => entry.id !== action.id)
        ),
      };

    case "UNDO":
      return { ...state, history: undoHistory(state.history) };

    case "REDO":
      return { ...state, history: redoHistory(state.history) };

    case "EXPORT_START":
      return { ...state, exportState: { status: "processing", progress: 0, url: null, filename: null, error: null } };

    case "EXPORT_PROGRESS":
      return { ...state, exportState: { ...state.exportState, progress: action.progress } };

    case "EXPORT_SUCCESS":
      return { ...state, exportState: { status: "done", progress: 1, url: action.url, filename: action.filename, error: null } };

    case "EXPORT_ERROR":
      return { ...state, exportState: { status: "error", progress: 0, url: null, filename: null, error: action.error } };

    default:
      return state;
  }
}
