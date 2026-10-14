// @ts-nocheck
import React from "react";
import { useDispatch } from "react-redux";
import { AudioLines, Check, ChevronDown, Loader2, Mic, Music, Pencil, PlayCircle, RefreshCw, Sparkles, Upload, X } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useListBuiltinVoicesQuery,
  useListCastProfilesQuery,
  useListCastAssignmentsQuery,
  useGetScriptQuery,
  useListPreProductionShotImagesQuery,
  useLazyGetDubJobQuery,
  useQueueShotDubMutation,
  useRejectShotDubMutation,
  useTestShotVoiceMutation,
  useUpdatePreProductionShotMutation,
} from "../../api/creatorEndpoints.js";
import DialogueBeatsEditor from "./DialogueBeatsEditor.jsx";
import DialogueFitPanel from "./DialogueFitPanel.jsx";
import ShotLengthConfirm from "./ShotLengthConfirm.jsx";
import ClipRepairPanel from "./ClipRepairPanel.jsx";
import ClipCutsPanel from "./ClipCutsPanel.jsx";
import BuiltinVoicePicker from "./BuiltinVoicePicker.jsx";
import ShotCanvasPlayer from "./ShotCanvasPlayer.jsx";
import MotionGraphicPanel from "./MotionGraphicPanel.jsx";
import CritiqueFindingsPanel from "./CritiqueFindingsPanel.jsx";
import VideoStudioPanel from "../videoStudio/VideoStudioPanel.jsx";
import VideoPromptCard from "../videoStudio/videoPrompt/VideoPromptCard.jsx";
import ShotControlsPanel from "../videoStudio/ShotControlsPanel.jsx";
import PromptInputsChecklist from "../videoStudio/PromptInputsChecklist.jsx";
import { castReaders } from "../videoStudio/castReaders.js";
import ShotThoughtLog from "./ShotThoughtLog.jsx";
import SoundLayersPanel from "./SoundLayersPanel.jsx";
import useCreatorVideoEntitlements from "../../hooks/useCreatorVideoEntitlements.js";
import { useCachedImageUrl } from "../../utils/cachedImageUrl.js";
import replaceDialogueLine from "../../utils/replaceDialogueLine.js";

/**
 * Who speaks this shot.
 *
 * <p>The voice has always been decided by the cast: the shot's character resolves to a profile and
 * that profile's voice is used, or the project's narrator when the shot has no character of its
 * own. That is the right default, and it is still the default -- but it left no way to say that
 * ONE shot should be read by someone else without re-casting the character, which moves every
 * other shot they speak in.
 *
 * <p>The pick is auditioned before it costs anything: the picker plays each voice's own sample
 * clip, so choosing is free and only the dub afterwards is billable.
 */
function ShotVoiceControl({ shotId, projectId, dubVoiceId, dubCastProfileId, takeVoiceId, hasTake, disabled }) {
  const dispatch = useDispatch();
  const [saveShot, { isLoading: saving }] = useUpdatePreProductionShotMutation();
  const { data: voices = [] } = useListBuiltinVoicesQuery();
  const { data: profiles = [] } = useListCastProfilesQuery({ projectId }, { skip: !projectId });
  const { data: assignments = [] } = useListCastAssignmentsQuery(projectId, { skip: !projectId });
  const { data: script } = useGetScriptQuery(projectId, { skip: !projectId });
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState("characters");

  const readers = castReaders(profiles, assignments, script?.characters ?? []);
  const chosenReader = dubCastProfileId ? readers.find((reader) => reader.id === dubCastProfileId) : null;
  const chosenVoice = dubVoiceId ? voices.find((voice) => voice.providerVoiceId === dubVoiceId) : null;
  // The take on file was recorded in a different voice than the shot now asks for. Same shape of
  // problem as a take of the previous line, and worth saying for the same reason: nothing
  // downstream re-records on its own, so the clip would be mixed with the old read.
  const takeIsOtherVoice = hasTake && !!dubVoiceId && !!takeVoiceId && takeVoiceId !== dubVoiceId;

  /** Choosing a character and choosing a built-in voice are alternatives; the server clears the other. */
  const save = async (change, message) => {
    try {
      await saveShot({ projectId, shotId, ...change }).unwrap();
      setOpen(false);
      dispatch(showFlash({ message, type: "success" }));
    } catch (error) {
      dispatch(showFlash({
        message: error?.data?.message || error?.message || "Could not set the voice for this shot",
        type: "error",
      }));
    }
  };

  const current = chosenReader
    ? `${chosenReader.name}${chosenReader.plays.length ? ` (${chosenReader.plays.join(", ")})` : ""}`
    : dubVoiceId ? (chosenVoice?.displayName || dubVoiceId) : "the shot's own character, else the narrator";

  return (
    <div className="border-t border-white/10 pt-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-medium text-slate-400">
          Read by: <span className="font-bold text-slate-200">{current}</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={disabled || saving}
            onClick={() => setOpen((value) => !value)}
            className="flex items-center gap-1 text-[10px] font-bold text-purple-300 hover:text-purple-200 disabled:opacity-60"
          >
            <Mic size={11} />
            {open ? "Close" : "Choose who reads it"}
          </button>
          {(dubVoiceId || dubCastProfileId) && (
            <button
              type="button"
              disabled={disabled || saving}
              onClick={() => save({ dubVoiceId: "", dubCastProfileId: "" }, "Back to the cast for this shot.")}
              title="Let the shot's own character -- or the narrator -- read it again"
              className="text-[10px] font-bold text-slate-500 hover:text-slate-300 disabled:opacity-60"
            >
              Use the cast
            </button>
          )}
        </div>
      </div>

      {takeIsOtherVoice && (
        <p className="mt-1 text-[10px] font-medium text-amber-200/90">
          The take on file was recorded in a different voice. Dub again to hear this one.
        </p>
      )}

      {open && (
        <div className="mt-2 rounded-md border border-white/10 bg-black/20 p-2.5">
          <div className="mb-2 flex gap-1">
            {[["characters", "Characters"], ["builtin", "Built-in voices"]].map(([key, label]) => (
              <button key={key} type="button" onClick={() => setTab(key)}
                className={`rounded px-2 py-1 text-[10px] font-bold ${tab === key ? "bg-purple-500/20 text-purple-100" : "text-slate-400 hover:text-slate-200"}`}>
                {label}
              </button>
            ))}
          </div>
          {tab === "characters" ? (
            readers.length === 0 ? (
              <p className="text-[10px] text-slate-500">No one is cast in this project yet — add the cast in the Characters tab.</p>
            ) : (
              <ul className="space-y-1">
                {readers.map((reader) => (
                  <li key={reader.id}>
                    <button
                      type="button"
                      disabled={saving || !reader.voice}
                      onClick={() => save({ dubCastProfileId: reader.id },
                        `${reader.name} will read this shot. Dub again to hear it.`)}
                      className={`flex w-full items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-left text-[11px] disabled:opacity-50 ${reader.id === dubCastProfileId ? "border-purple-400/40 bg-purple-500/10" : "border-white/10 hover:border-purple-400/30"}`}
                    >
                      <span>
                        <span className="font-bold text-slate-200">{reader.name}</span>
                        {reader.plays.length > 0 && <span className="text-slate-400"> as {reader.plays.join(", ")}</span>}
                        {reader.narrator && <span className="text-slate-400"> · narrator</span>}
                      </span>
                      <span className="shrink-0 text-[10px] text-slate-500">{reader.voice || "no voice yet — set one in Characters"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <>
              <BuiltinVoicePicker
                label={null}
                showFaceImage={false}
                selectedVoiceId={dubVoiceId || ""}
                onSelect={(voice) => save({ dubVoiceId: voice.providerVoiceId },
                  `This shot will be read by ${voice.displayName}. Dub again to hear it.`)}
              />
              <p className="mt-2 text-[10px] font-medium text-slate-500">
                Press play to hear a voice before you choose it — auditioning is free, only the dub
                afterwards costs anything.
              </p>
            </>
          )}
          <p className="mt-2 text-[10px] font-medium text-slate-500">This changes who reads this shot only.</p>
        </div>
      )}
    </div>
  );
}

/**
 * The shot's spoken take: hear it, and record it again.
 *
 * <p>There was no way to listen. A dubbed shot got a badge saying so and nothing else, which is a
 * poor trade for audio that is about to be baked into a paid render -- and it left the one step the
 * dialogue-fit flow depends on with no button. Accepting a rewrite changes the words, which makes
 * the stored take a recording of something else; only dubbing again turns the report's estimate back
 * into a measurement.
 *
 * <p>Re-dubbing replaces the take rather than versioning it (one row per beat, a fresh object each
 * time), so the previous recording is gone once this runs. That is worth knowing before pressing it,
 * and worth hearing the current one first.
 */
function DubbedVoiceControl({ shotId, projectId, line, dubbed, lineTakes = [], dubVoiceId, dubCastProfileId, onDubbed, children }) {
  const dispatch = useDispatch();
  // Queued, not waited on. Recording a line takes seconds to tens of seconds, and while the request
  // held the connection there was nothing on screen saying so -- which is exactly why pressing the
  // button again was a reasonable thing to do. Now the request returns a job id and this polls it,
  // so the control can say what is happening and stay disabled until it is actually finished.
  const [queueDub] = useQueueShotDubMutation();
  const [rejectDub, rejectState] = useRejectShotDubMutation();
  const [fetchDubJob] = useLazyGetDubJobQuery();
  const [dubbing, setDubbing] = React.useState(false);
  const isLoading = dubbing;

  /** Queues a dub and waits for the job to settle. Returns true when a take was recorded. */
  const runDub = async (text) => {
    setDubbing(true);
    try {
      const job = await queueDub({ projectId, shotId, text }).unwrap();
      for (let attempt = 0; attempt < 90; attempt += 1) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => { setTimeout(resolve, 2000); });
        // eslint-disable-next-line no-await-in-loop
        const latest = await fetchDubJob(job.jobId).unwrap().catch(() => null);
        if (latest?.status === "COMPLETED") {
          // queueShotDub returns before the audio exists, so invalidating when that request is
          // accepted would only reload the same empty result. Refresh after the job commits the
          // take instead. Otherwise the project query can stay cached for 45 minutes and this
          // panel keeps rendering `dubbed = null` even though the file has been generated.
          // A transient reload failure must not report that the already-completed dub itself
          // failed. The normal focus/poll refresh can still recover the saved take afterwards.
          await Promise.resolve(onDubbed?.()).catch(() => {});
          return true;
        }
        if (latest?.status === "FAILED") {
          throw new Error(latest.lastError || "The dub failed");
        }
      }
      throw new Error("Still recording — it will appear here when it finishes");
    } finally {
      setDubbing(false);
    }
  };
  const [saveLine, saveState] = useUpdatePreProductionShotMutation();
  const [draft, setDraft] = React.useState("");
  const [editing, setEditing] = React.useState(false);
  const audioUrl = dubbed?.audioUrl || dubbed?.audioDataUri;
  const [takeLoading, setTakeLoading] = React.useState(true);
  React.useEffect(() => { setTakeLoading(true); }, [audioUrl]);
  // The take on file was made from these words; the shot now says those. When they differ the
  // recording is of a line that no longer exists, which is exactly what the fit report stops
  // treating as a measurement -- so say it here too, next to the button that fixes it.
  // A shot with several lines is recorded line by line, each in its speaker's voice; its "take" is
  // those, and the whole-line comparison below does not apply to it.
  const multiLine = lineTakes.length > 1;
  const stale = !multiLine && !!audioUrl && !!dubbed?.text && !!line && dubbed.text.trim() !== line.trim();
  const otherVoice = !!audioUrl && !!dubVoiceId && !!dubbed?.providerVoiceId && dubbed.providerVoiceId !== dubVoiceId;
  // Recording is only asked for when the take is missing or no longer matches the line or voice.
  // Otherwise it is "Re-record": the same words again, replacing this take -- for a take that
  // sounds wrong, not a step in the flow.
  const recordLabel = !audioUrl ? "Record the line" : stale ? "Record the new line" : otherVoice && !multiLine ? "Record in the new voice" : null;

  // A shot with no line written for it used to render nothing at all, which left no way to give one
  // narration from this page: the beats editor hides once a shot is prepared, so a finished shot
  // with no voice-over was silent with no route out of it. A motion graphic is the usual case --
  // its script_line describes what appears on screen, which is direction, not words anyone speaks.
  // Writing the words and hearing them is one action. A line that exists on the shot but has never
  // been spoken is the state everything downstream mishandles -- the video model invents a delivery
  // for it, and every fit figure falls back to a character count -- so saving without recording is
  // not a step worth offering on its own.
  const saveAndDub = async (text) => {
    await saveLine({ projectId, shotId, voiceOver: text }).unwrap();
    await runDub(text);
  };

  if (!line) {
    const handleAddLine = async () => {
      const text = draft.trim();
      if (!text) return;
      try {
        await saveAndDub(text);
        setDraft("");
        dispatch(showFlash({ message: "Line saved and dubbed. Prepare again so the shot is built around it.", type: "success" }));
      } catch (error) {
        dispatch(showFlash({ message: error?.data?.message || error?.message || "Could not save that line", type: "error" }));
      }
    };
    return (
      <div className="rounded-md border border-white/10 bg-white/[0.02] p-3">
        <div className="mb-2 flex items-center gap-1.5">
          <AudioLines size={13} className="text-slate-400" />
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Spoken take</p>
        </div>
        <p className="mb-2 text-[10px] font-medium text-slate-500">
          Nothing is spoken in this shot, so it generates silent. Write the narration here to give it
          a voice — it is recorded first, then the shot is generated around it.
        </p>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={2}
          placeholder="What should be said over this shot?"
          className="creator-input w-full text-[11px] font-medium leading-relaxed"
        />
        <button
          type="button"
          disabled={saveState.isLoading || isLoading || !draft.trim()}
          onClick={handleAddLine}
          className="mt-2 flex items-center gap-1.5 rounded-md border border-purple-400/30 bg-purple-500/15 px-2.5 py-1.5 text-[10px] font-bold text-purple-200 disabled:opacity-50"
        >
          {(saveState.isLoading || isLoading) ? <Loader2 size={11} className="animate-spin" /> : <AudioLines size={11} />}
          {(saveState.isLoading || isLoading) ? "Saving…" : "Save line and dub it"}
        </button>
      </div>
    );
  }

  const handleRedub = async () => {
    try {
      await runDub(line);
      dispatch(showFlash({ message: "Re-dubbed with the current line.", type: "success" }));
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || error?.message || "Could not dub this shot", type: "error" }));
    }
  };

  // Changing the words was only ever possible through the fit panel's rewrite, which appears when a
  // line overruns its shot and offers a model's phrasing rather than the creator's own. A line can
  // be wrong for reasons arithmetic knows nothing about -- the wrong name, the wrong tone, a take
  // that reads badly out loud -- and there was nowhere to simply say it differently and hear it.
  const handleSaveEdit = async () => {
    const text = draft.trim();
    if (!text || text === line.trim()) {
      setEditing(false);
      return;
    }
    try {
      await saveAndDub(text);
      setEditing(false);
      dispatch(showFlash({
        message: "Line changed and re-dubbed. Size the shot to the new take before generating.",
        type: "success",
      }));
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || error?.message || "Could not save that line", type: "error" }));
    }
  };

  const linkButton = "flex items-center gap-1.5 text-[10px] font-bold disabled:opacity-60";
  return (
    <div className={`space-y-2.5 rounded-md border p-3 ${stale ? "border-amber-400/30 bg-amber-500/[0.06]" : "border-white/10 bg-white/[0.02]"}`}>
      <div>
        <div className="flex items-center gap-1.5">
          <AudioLines size={13} className={stale ? "text-amber-300" : "text-purple-300"} />
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Spoken take</p>
        </div>
        <p className="mt-1 text-[10px] font-medium text-slate-500">
          This shot's line, recorded in the voice chosen below. It is what the audience hears, and the
          shot is timed around it.
        </p>
      </div>

      {/* The words first -- the panel used to offer re-recording a line without saying what it was. */}
      {editing ? (
        <div>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            placeholder="What should be said over this shot?"
            className="creator-input w-full text-[11px] font-medium leading-relaxed"
          />
          <p className="mt-1 text-[10px] font-medium text-slate-500">
            Saving records the new words straight away, so the take on file is always of the line as
            it stands.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={saveState.isLoading || isLoading || !draft.trim()}
              onClick={handleSaveEdit}
              className="flex items-center gap-1.5 rounded-md border border-purple-400/30 bg-purple-500/15 px-2.5 py-1.5 text-[10px] font-bold text-purple-200 disabled:opacity-50"
            >
              {(saveState.isLoading || isLoading) ? <Loader2 size={11} className="animate-spin" /> : <AudioLines size={11} />}
              {(saveState.isLoading || isLoading) ? "Saving…" : "Save and dub it"}
            </button>
            <button
              type="button"
              disabled={saveState.isLoading || isLoading}
              onClick={() => setEditing(false)}
              className="rounded-md border border-white/10 px-2.5 py-1.5 text-[10px] font-bold text-slate-400 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="rounded-md border-l-2 border-purple-400/40 bg-black/20 px-2.5 py-1.5 text-[11px] font-medium leading-relaxed text-slate-200">
          {line}
        </p>
      )}

      {multiLine ? (
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium text-slate-500">
            Each line is recorded on its own, in its speaker's voice, and laid on at its planned moment.
          </p>
          <ol className="space-y-1.5">
            {lineTakes.map((take) => (
              <li key={take.beatId} className="space-y-0.5">
                <p className="text-[10px] font-medium text-slate-300">
                  “{take.text}”{take.durationMs > 0 ? ` · ${(take.durationMs / 1000).toFixed(1)}s` : ""}
                </p>
                <audio controls src={take.audioUrl} preload="metadata" className="h-8 w-full" />
              </li>
            ))}
          </ol>
        </div>
      ) : audioUrl ? (
        <div className="space-y-1">
          {/* Same reason as the clip: a bare audio element is an inert grey bar until the file has
              arrived, which reads as nothing having happened. */}
          <div className="relative">
            <audio
              key={audioUrl}
              controls
              src={audioUrl}
              preload="metadata"
              onLoadedMetadata={() => setTakeLoading(false)}
              onError={() => setTakeLoading(false)}
              className="h-9 w-full"
            />
            {takeLoading && (
              <div className="pointer-events-none absolute inset-0 flex items-center gap-1.5 rounded bg-black/70 px-2">
                <Loader2 size={12} className="animate-spin text-slate-300" />
                <span className="text-[10px] font-bold text-slate-400">Loading the take…</span>
              </div>
            )}
          </div>
          <p className="flex flex-wrap items-center gap-x-2 text-[10px] font-medium text-slate-500">
            {dubbed?.durationMs > 0 && <span>Runs {(dubbed.durationMs / 1000).toFixed(1)}s ·</span>}
            <span className="flex items-center gap-1 text-emerald-300/90"><Check size={11} /> Saved — used by dubbed mixes</span>
          </p>
          {stale && (
            <p className="text-[10px] font-medium text-amber-200/90">
              This recording is of the previous line. Dub again to hear the line as it stands now —
              until then the fit figures are an estimate.
            </p>
          )}
        </div>
      ) : (
        <p className="text-[10px] font-medium text-slate-500">Not recorded yet.</p>
      )}

      {children}

      {/* Reject sits outside the has-audio branch on purpose: a take whose words have since changed
          is hidden above while the cut path still reaches for it, because that path selects by
          recency rather than by text -- exactly when a creator most needs to say "not that one". */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {recordLabel ? (
          <button type="button" disabled={isLoading || editing} onClick={handleRedub}
            className="flex items-center gap-1.5 rounded-md border border-purple-400/30 bg-purple-500/15 px-2.5 py-1.5 text-[10px] font-bold text-purple-100 hover:bg-purple-500/25 disabled:opacity-50">
            {isLoading ? <Loader2 size={11} className="animate-spin" /> : <AudioLines size={11} />}
            {isLoading ? "Recording…" : recordLabel}
          </button>
        ) : (
          <button type="button" disabled={isLoading || editing} onClick={handleRedub}
            title="Records the same words again and replaces this take. Only needed if this one sounds wrong."
            className={`${linkButton} text-slate-400 hover:text-purple-200`}>
            {isLoading ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
            {isLoading ? "Recording…" : multiLine ? "Re-record every line" : "Re-record"}
          </button>
        )}
        {!editing && (
          <button type="button" disabled={isLoading} onClick={() => { setDraft(line); setEditing(true); }}
            className={`${linkButton} text-slate-400 hover:text-slate-200`}>
            <Pencil size={11} /> Change the words
          </button>
        )}
        <button
          type="button"
          disabled={isLoading || editing || rejectState.isLoading}
          onClick={async () => {
            try {
              await rejectDub({ projectId, shotId }).unwrap();
              dispatch(showFlash({
                message: "Take rejected. Nothing will use it — dub again when you are ready.",
                type: "success",
              }));
            } catch (error) {
              dispatch(showFlash({
                message: error?.data?.message || error?.message || "Could not reject this take",
                type: "error",
              }));
            }
          }}
          className={`${linkButton} text-slate-400 hover:text-rose-300`}
        >
          {rejectState.isLoading ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />}
          Reject the latest take
        </button>
      </div>

      <ShotVoiceControl
        shotId={shotId}
        projectId={projectId}
        dubVoiceId={dubVoiceId}
        dubCastProfileId={dubCastProfileId}
        takeVoiceId={dubbed?.providerVoiceId}
        hasTake={!!audioUrl}
        disabled={isLoading || editing}
      />
    </div>
  );
}

/**
 * The finished clip, with something on screen while it arrives.
 *
 * <p>A bare video element is blank until enough of the file has downloaded, and these are megabytes
 * fetched from object storage -- long enough that the card looked broken and the obvious reaction
 * was to press something again. Saying "loading" is the difference between waiting and re-running
 * work that is already running.
 *
 * <p>An error is stated too. A clip whose object is missing failed silently as an empty black box,
 * which is indistinguishable from one that simply has not loaded yet.
 */
function ShotPlayer({ src, aspect }) {
  const [state, setState] = React.useState("loading");
  // A new src is a new load, not the previous one continuing.
  React.useEffect(() => { setState("loading"); }, [src]);
  return (
    <div className="relative mx-auto w-full max-w-md">
      <video
        key={src}
        src={src}
        controls
        preload="metadata"
        onLoadedMetadata={() => setState("ready")}
        onError={() => setState("error")}
        className="w-full rounded-lg border border-white/10 bg-black"
        style={{ aspectRatio: aspect }}
      />
      {state !== "ready" && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5 rounded-lg bg-black/70">
          {state === "loading" ? (
            <>
              <Loader2 size={18} className="animate-spin text-slate-300" />
              <p className="text-[10px] font-bold text-slate-400">Loading the clip…</p>
            </>
          ) : (
            <p className="px-4 text-center text-[10px] font-bold text-rose-300">
              This clip could not be loaded. It may have been replaced by a repair — try an earlier
              cut under Other ways.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * The shot's length, editable, next to how long its voice actually takes.
 *
 * <p>The simplest way through, and the one that avoids every repair: record the line first, then
 * make the shot long enough to hold it, then generate. A clip sized to its audio before it exists
 * needs no tail, no freeze and no remux -- those are all ways of fixing a shot that was generated at
 * the wrong length, and none of them is as good as not doing that.
 *
 * <p>The suggestion is a second longer than the take rather than exactly its length. A second is
 * comfortably more than the breath the fit maths reserves, and generous is the right direction to be
 * wrong in: a clip slightly longer than its line ends in silence, a clip slightly shorter ends
 * mid-word.
 */
function ShotLengthRow({ shot, projectId, dubSeconds, mismatch, overruns }) {
  const dispatch = useDispatch();
  const [saveShot, saveState] = useUpdatePreProductionShotMutation();
  // The typed value while it differs from the saved one. Nothing is saved until Save: a length is a
  // decision about the film, billed per second, and the plan is rebuilt for it only on Update.
  const [draft, setDraft] = React.useState(null);
  // Save asks first: the shot's length is the film's running time, not the clip's.
  const [confirming, setConfirming] = React.useState(false);
  const suggested = dubSeconds != null ? Math.ceil(dubSeconds) + 1 : null;
  const current = shot.durationSeconds ?? null;
  const original = shot.originalDurationSeconds ?? null;
  const typed = draft == null ? null : Math.round(Number(draft));
  const changed = typed != null && typed > 0 && typed !== current;

  const save = async () => {
    setConfirming(false);
    if (!changed) return;
    try {
      await saveShot({ projectId, shotId: shot.id, durationSeconds: typed }).unwrap();
      setDraft(null);
      dispatch(showFlash({ message: `Shot is now ${typed}s in the film. The clip length is unchanged — press Update in the video studio to rebuild the plan.`, type: "success" }));
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not change the shot's length", type: "error" }));
    }
  };

  const chip = "rounded-md border px-2 py-0.5 text-[10px] font-bold disabled:opacity-50";
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-medium">
        <label className="flex items-center gap-1.5 text-slate-400">
          Shot length in the film
          <input
            type="number"
            min="1"
            value={draft ?? current ?? ""}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && changed) setConfirming(true);
              if (event.key === "Escape") setDraft(null);
            }}
            disabled={saveState.isLoading}
            className={`w-12 rounded border bg-white/5 px-1.5 py-0.5 text-center text-[11px] font-bold text-slate-100 disabled:opacity-50 ${changed ? "border-purple-400/60" : "border-white/15"}`}
          />
          s
        </label>
        {changed && (
          <span className="flex items-center gap-1.5">
            <button type="button" onClick={() => setConfirming(true)} disabled={saveState.isLoading}
              className={`${chip} flex items-center gap-1 border-purple-400/30 bg-purple-500/15 text-purple-100`}>
              {saveState.isLoading ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />} Save {typed}s
            </button>
            <button type="button" onClick={() => setDraft(null)} disabled={saveState.isLoading} className={`${chip} border-white/10 text-slate-400`}>Cancel</button>
          </span>
        )}
        {dubSeconds != null && (
          <span className={mismatch ? "text-amber-300" : "text-slate-400"}>
            Voice <strong>{dubSeconds.toFixed(1)}s</strong>
            {mismatch ? ` — ${overruns ? "longer than" : "shorter than"} the shot` : " — fits"}
          </span>
        )}
        {suggested != null && suggested !== current && suggested !== typed && (
          <button type="button" onClick={() => setDraft(String(suggested))} disabled={saveState.isLoading}
            className={`${chip} border-white/15 bg-white/5 text-slate-200 hover:border-purple-400/40`}>
            Fit to voice: {suggested}s
          </button>
        )}
      </div>
      {original != null && original !== current && (
        <p className="text-[10px] text-slate-500">
          Originally planned {original}s.{" "}
          {original !== typed && (
            <button type="button" onClick={() => setDraft(String(original))} className="font-bold text-slate-400 hover:text-slate-200">
              Back to {original}s
            </button>
          )}
        </p>
      )}
      <ShotLengthConfirm change={confirming && changed ? { from: current, to: typed } : null}
        onConfirm={save} onCancel={() => setConfirming(false)} />
    </div>
  );
}

const ASPECT_RATIO_CSS = {
  RATIO_16_9: "16 / 9",
  RATIO_9_16: "9 / 16",
  RATIO_1_1: "1 / 1",
  RATIO_4_5: "4 / 5",
  RATIO_21_9: "21 / 9",
};

/** One shot as a visual card -- the frame (or the finished clip, once generated) IS the card,
 * not a text row that hides the image behind an accordion toggle. Clicking anywhere opens the
 * full prepare/approve panel below it, spanning the grid so it doesn't stretch its neighbors. */
export default function ShotVideoCard({ shot, projectId, isOpen, onToggle, info, busy, video, activeClip, dubbed, lineTakes, onDubbed, selected, onSelectToggle, onPrepare, onSavePrompt, onReject, onAutoFix, onRegenerate, regenerating, previousShot, onStudioGenerated }) {
  // Text handed to the video studio's editor as a new draft: Edit on a sent version, or the prompt
  // being rewritten after Reject. A fresh object each time, so the same text can be seeded twice.
  const [seedDraft, setSeedDraft] = React.useState(null);
  // The prepared job this card already rejected, so Reject & rewrite does not reject it twice.
  const [rejectedJobId, setRejectedJobId] = React.useState(null);
  const { entitlements } = useCreatorVideoEntitlements();

  // What this shot actually plays.
  //
  // video-generation-service only ever knows about the clip IT rendered. Accepting a cut happens
  // in post-production-service and changes which file the film uses; the other service is never
  // told, and never should be -- it did not make that file. Playing video.outputUri here meant
  // accepting a cut flashed success and then went on playing the take it had just replaced.
  const playableUrl = activeClip?.videoUrl || video?.outputUri;

  // "This shot has a clip", which is NOT the same as "this shot has a job row".
  //
  // The project's job listing reports the latest job per shot whatever state it is in -- PENDING
  // approval, QUEUED, and FAILED all come back, with a null videoUrl -- and the page records all
  // of them so a reload can show a render in progress. That made `video` a truthy object long
  // before anything had been rendered, and every gate below reads `video` as "already generated".
  // The effect was that Approve & generate disappeared from prepared shots and a FAILED shot
  // became a dead end: no Approve, no Prepare again, no clip, nothing to do with it.
  //
  // `busy` still comes from the job's status, so a render in flight keeps its loader.
  const hasClip = !!playableUrl;

  // A render that failed. FAILED is terminal server-side, so approving that job again is refused
  // with a 409 -- the way forward is a fresh prompt and a fresh job, which is Prepare again.
  const jobFailed = !hasClip && video?.status === "FAILED";

  /** Editing a sent prompt never changes it: the studio opens with its text as the next draft. */
  const editSent = (text) => {
    setSeedDraft({ text });
    onRegenerate?.();
  };

  const { data: images = [] } = useListPreProductionShotImagesQuery(shot.id, { skip: !shot.id });
  const isMotionGraphic = shot.shotType === "MOTION_GRAPHIC";
  // MG shots don't have PRODUCTION/STORYBOARD (see ShotImagesPanel's kindsForShotType) -- their
  // equivalent frame is the MOTION_GRAPHIC preview. Preferring it first for MG shots means the
  // video card actually shows the graphic instead of the empty-frame Sparkles placeholder.
  const frame = isMotionGraphic
    ? images.find((img) => img.kind === "MOTION_GRAPHIC")
    : images.find((img) => img.kind === "PRODUCTION") || images.find((img) => img.kind === "STORYBOARD");
  const aspect = ASPECT_RATIO_CSS[shot.aspectRatio] || "9 / 16";
  const dialogue = shot.voiceOver || shot.scriptLine;
  // Same rule DialogueBeatsEditor uses to decide whether there's anything to clone -- scriptLine
  // only counts as spoken dialogue for DIALOGUE shots, not as a stand-in for ACTION/B_ROLL/MOTION_
  // GRAPHIC scene direction. A beat-less shot with real dialogue hasn't had its voice dubbed yet.
  const dialogueVoiceText = (shot.voiceOver || (shot.shotType === "DIALOGUE" ? shot.scriptLine : "") || "").trim();
  // "Prepare all dialogues" already cloned+synthesized this shot's line -- distinguish that from
  // a shot that hasn't been dubbed at all yet, since the audio is sitting ready for review, not
  // missing.
  const dubReady = !!(dubbed?.audioUrl || dubbed?.audioDataUri);
  // Compared against the shot's planned length with the same 0.4s breath the backend reserves, so
  // the card and the fit report cannot disagree about whether a line fits.
  const dubSeconds = dubbed?.durationMs > 0 ? dubbed.durationMs / 1000 : null;
  const dubOverruns = dubSeconds != null && shot.durationSeconds
    ? dubSeconds + 0.4 > shot.durationSeconds : false;
  const dubMismatch = dubSeconds != null && shot.durationSeconds
    ? Math.abs(shot.durationSeconds - dubSeconds) > 0.5 : false;
  // Both dub badges resolve from `shot` plus the project-wide cloned-audio query the parent
  // already loads, so the grid paints its real dub state immediately. This deliberately does NOT
  // read `beats`: that is a per-shot request fired once per card, so gating the badge on it left
  // every card blank until N round-trips landed (and briefly showed "Needs voice" on shots that
  // in fact had beats, since an unresolved query reads as an empty list).
  const needsVoice = !hasClip && !!dialogueVoiceText && !dubReady;
  // Signed URLs are re-signed (new query string) on every images refetch even when the object
  // itself hasn't changed, which would otherwise force the browser to re-download the frame on
  // every open. Cache the bytes locally keyed by shot+kind instead of the ever-changing URL.
  const frameSrc = useCachedImageUrl(frame && `${shot.id}:${frame.kind}`, frame?.signedUrl);

  // The shot's length in the film and its voice fit. One control: inside the studio while it is
  // open (next to the clip length it decides), in the Shot group otherwise.
  const lengthRow = (shot.durationSeconds || dubSeconds != null) ? (
    <ShotLengthRow
      shot={shot}
      projectId={projectId}
      dubSeconds={dubSeconds}
      mismatch={dubMismatch}
      overruns={dubOverruns}
    />
  ) : null;

  return (
    <div className={`relative overflow-hidden rounded-lg border bg-white/[0.02] ${selected ? "border-purple-400/50" : "border-white/10"} ${isOpen ? "col-span-full" : ""}`}>
      {/* Sibling of the toggle button, not a child: a checkbox nested inside a <button> is invalid
       * markup and every click would also open/close the panel. */}
      {onSelectToggle && (
        <label
          title="Include this shot when preparing"
          className="absolute left-2 top-2 z-10 flex h-5 w-5 cursor-pointer items-center justify-center rounded bg-black/60"
        >
          <input
            type="checkbox"
            checked={!!selected}
            onChange={onSelectToggle}
            className="h-3.5 w-3.5 cursor-pointer accent-purple-500"
          />
        </label>
      )}
      <button type="button" onClick={onToggle} className="group block w-full text-left">
        <div className="relative w-full bg-black" style={{ aspectRatio: aspect }}>
          {playableUrl ? (
            // One player, not two. This tile and the full player below used to be separate
            // elements holding the same file: two downloads, a tile that could never be heard and
            // a player that could never be glanced at. Now it is the same component, looping
            // quietly like the tile did with the sound one click away.
            <ShotCanvasPlayer
              src={playableUrl}
              aspectRatio={shot.aspectRatio}
              autoLoop
              className="absolute inset-0 h-full w-full border-0"
            />
          ) : frameSrc ? (
            <img src={frameSrc} alt={`Shot ${shot.shotNumber}`} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles size={22} className="text-slate-700" />
            </div>
          )}

          {playableUrl && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
              <PlayCircle size={30} className="text-white/70" />
            </div>
          )}

          <div className="absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/70 to-transparent p-2">
            <span className={`rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-bold text-white ${onSelectToggle ? "ml-7" : ""}`}>
              #{shot.shotNumber} <span className="font-medium text-slate-300">{shot.shotType}</span>
            </span>
            <div className="flex flex-col items-end gap-1">
              {dubReady && (
                <span className="flex items-center gap-1 rounded-full border border-purple-400/25 bg-purple-500/20 px-2 py-0.5 text-[9px] font-bold text-purple-200">
                  <AudioLines size={9} />
                  Dub ready
                </span>
              )}
              {needsVoice && !dubReady && (
                <span className="flex items-center gap-1 rounded-full border border-sky-400/25 bg-sky-500/20 px-2 py-0.5 text-[9px] font-bold text-sky-200">
                  <AudioLines size={9} />
                  Needs voice
                </span>
              )}
              {video?.status === "COMPLETED" && (
                <span className="flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-200">
                  <Check size={9} />
                  Generated
                </span>
              )}
              {video?.muteAudio && video?.dubSucceeded === true && (
                <span className="rounded-full border border-purple-400/25 bg-purple-500/20 px-2 py-0.5 text-[9px] font-bold text-purple-200">
                  Auto-dubbed
                </span>
              )}
              {video?.muteAudio && video?.dubSucceeded === false && (
                <span className="rounded-full border border-amber-400/25 bg-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-200">
                  Dub failed — silent
                </span>
              )}
            </div>
          </div>

          {shot.cast?.castFaceImageUrl && (
            <img
              src={shot.cast.castFaceImageUrl}
              alt={shot.cast.castDisplayName}
              title={`${shot.cast.characterName} — ${shot.cast.castDisplayName}`}
              className="absolute bottom-2 left-2 h-8 w-8 rounded-full border-2 border-white/40 object-cover shadow-lg"
            />
          )}
        </div>

        <div className="flex items-start justify-between gap-2 p-3">
          <p className="line-clamp-2 flex-1 text-[11px] font-medium leading-snug text-slate-300">
            {dialogue || <span className="italic text-slate-500">No dialogue planned</span>}
          </p>
          <ChevronDown size={15} className={`mt-0.5 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* Motion-graphic shots used to stop here: the plan, and nothing else. The backend never
          agreed -- prepare-batch builds prompts for them like any other shot, so both of this
          project's motion graphics have been sitting on PENDING_APPROVAL jobs that the page gave no
          way to approve. They also have a MOTION_GRAPHIC still, which is what image-to-video
          animates from. So the plan stays, as the brief the prompt was built from, and the ordinary
          prepare/approve/regenerate flow runs underneath it. */}
      {isOpen && (
        <div className="space-y-3 border-t border-white/10 px-4 py-3.5">
          {/* One shot, in the order the work happens: the shot itself, who speaks and what plays
              under it, generating, then cutting what came back. Tools the studio and the conform
              step have replaced stay reachable, folded at the bottom. */}
          <CardGroup title="Shot">
            <PromptInputsChecklist projectId={projectId} shotId={shot.id} />
            {isMotionGraphic && <MotionGraphicPanel shotId={shot.id} />}
            {/* The one comparison that decides whether this shot is right, stated before any panel is
                opened: how long the shot is meant to run against how long the voice actually takes.
                It was only visible inside the fit panel, which appears when something is already
                wrong -- so a shot could look fine and not be. */}
            {hasClip && !regenerating && lengthRow}
            {/* Whether the line fits the shot, and what to do if not -- decided before the prompt is
                written, since extending the shot or rephrasing the line both change it. */}
            <DialogueFitPanel
              shot={shot}
              projectId={projectId}
              // Swaps the spoken line inside the prompt that already exists and saves it as a new
              // version, rather than rebuilding everything when only the words changed.
              onDialogueReplaced={info?.prompt && onSavePrompt ? async (oldLine, newLine) => {
                // The text that will actually be sent: the compressed one when compression ran.
                const current = info.prompt.compressionApplied
                  ? (info.prompt.promptCompressed || info.prompt.promptOriginal || "")
                  : (info.prompt.promptOriginal || info.prompt.promptCompressed || "");
                const swapped = replaceDialogueLine(current, oldLine, newLine);
                if (!swapped) return false;
                return onSavePrompt(swapped.text);
              } : undefined}
            />

            {playableUrl && (
              <ShotCanvasPlayer
                // Keyed on the URL so accepting a cut swaps the source instead of leaving the
                // element on the file it already decoded. Without it the player kept the old clip
                // and sat on its loading label, which read as the accept having hung.
                key={playableUrl}
                src={playableUrl}
                aspectRatio={shot.aspectRatio}
                className="mx-auto w-full max-w-md"
                label="Loading the clip…"
              />
            )}

          </CardGroup>

          <CardGroup title="Voice & music" hint="The spoken line — its recording and who reads it — and the music under the shot.">
            {/* Not gated on !info. video-generation-service was changed specifically so a bed
                generated after a shot was prepared still gets mixed in -- when the prompt carries
                no music reference it reads the shot's current track from pre-production. Hiding
                the control once prepared took away the case that fix exists to serve, and left
                no way to add or replace music on a shot you had already prepared. */}
            {/* Not gated on shot type: a motion graphic is as likely as any other shot to carry a
                narrator over it, and the control already renders nothing when the shot has no line.
                Deciding by type would hide the dub -- and with it the dialogue-fit remedy -- from a
                graphic that does have one. */}
            <DubbedVoiceControl
              shotId={shot.id}
              projectId={projectId}
              line={dialogueVoiceText}
              dubbed={dubbed}
              lineTakes={lineTakes}
              dubVoiceId={shot.dubVoiceId}
              dubCastProfileId={shot.dubCastProfileId}
              onDubbed={onDubbed}
            >
              {(!hasClip || regenerating) && <DialogueBeatsEditor shot={shot} projectId={projectId} hasLine={!!dialogueVoiceText} />}
            </DubbedVoiceControl>
            <SoundLayersPanel projectId={projectId} shot={shot} />
          </CardGroup>

          <CardGroup title="Generate" hint={hasClip && !regenerating ? "This shot has a clip. Regenerate to open the video studio again." : undefined}>
            <ShotControlsPanel projectId={projectId} shotId={shot.id} />
            {info?.critiqueVerdict === "NEEDS_HUMAN_REVIEW" && (!hasClip || regenerating) && (
              <CritiqueFindingsPanel findings={info.findings} fixing={busy} onAutoFix={onAutoFix} onReject={onReject} />
            )}
            {/* The video studio replaces prepare-then-approve for a shot with no clip yet, or one being
                redone: analyse, choose settings, build the timeline, read and correct the prompt, then
                generate exactly that text. Every step is its own button, so no failure leaves the shot
                with nothing to do. */}
            {(!hasClip || regenerating) && (
              <VideoStudioPanel
                shot={shot}
                projectId={projectId}
                previousShot={previousShot}
                generating={busy}
                onGenerated={(job) => onStudioGenerated?.(job)}
                onRegeneratePrompt={onPrepare}
                // Rejects the prepared render waiting for approval, when there is one.
                onReject={info?.externalJobId && !jobFailed && rejectedJobId !== info.externalJobId
                  ? async () => { if (await onReject?.()) setRejectedJobId(info.externalJobId); }
                  : undefined}
                seedDraft={seedDraft}
                lengthRow={lengthRow}
              />
            )}

            {hasClip && !regenerating && (
              <VideoPromptCard shotId={shot.id} onEditSent={editSent} editsUnlocked={entitlements.editsEnabled} />
            )}

            {/* Right under the generated clip: slow down & interpolate, remove audio, add the
                recorded take -- each a version to watch, then use or not. No onChanged: accepting
                invalidates the project's current cuts, and the player reads them, so the swap
                happens on its own (wiring it to onPrepare once kicked off a paid prompt rebuild). */}
            {hasClip && !regenerating && (
              <ClipCutsPanel shot={shot} projectId={projectId} aspectRatio={shot.aspectRatio} />
            )}

            {hasClip && !regenerating && onRegenerate && (
              <div className="rounded-md border border-white/10 bg-white/[0.02] p-3">
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
                  Not right?
                </p>
                <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-400">
                  Regenerating rebuilds the prompt from this shot as it stands now — including any
                  change to its length or its line — and asks you to approve before spending again.
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={onRegenerate}
                  className="mt-2 flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-200 hover:border-purple-400/40 hover:text-purple-200 disabled:opacity-50"
                >
                  {busy ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                  {busy ? "Preparing…" : "Regenerate this shot"}
                </button>
              </div>
            )}

            <ShotThoughtLog shotId={shot.id} />
          </CardGroup>

          {hasClip && (
            <CardGroup title="Repairs" hint="Extend the tail, hold the last frame, or bring in your own file.">
              <ClipRepairPanel shot={shot} projectId={projectId} />
            </CardGroup>
          )}

        </div>
      )}
    </div>
  );
}

/** A labelled, collapsible group of a shot's panels. */
function CardGroup({ title, hint, defaultOpen = true, children }) {
  return (
    <details open={defaultOpen} className="group/section rounded-lg border border-white/10 bg-white/[0.015]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2">
        <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-300">{title}</span>
        <ChevronDown size={13} className="text-slate-500 transition-transform group-open/section:rotate-180" />
      </summary>
      <div className="flex flex-col gap-3 border-t border-white/5 px-3 pb-3 pt-2.5">
        {hint && <p className="text-[10px] font-medium text-slate-500">{hint}</p>}
        {children}
      </div>
    </details>
  );
}
