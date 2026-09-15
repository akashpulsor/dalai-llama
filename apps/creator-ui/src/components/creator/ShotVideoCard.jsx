// @ts-nocheck
import React from "react";
import { useDispatch } from "react-redux";
import { AudioLines, Check, ChevronDown, History, Loader2, Music, Pencil, PlayCircle, RefreshCw, Save, Sparkles, X } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useGenerateShotBackgroundMusicMutation,
  useGetShotBackgroundMusicQuery,
  useListPreProductionShotImagesQuery,
  useListShotPromptVersionsQuery,
  useTestShotVoiceMutation,
} from "../../api/creatorEndpoints.js";
import DialogueBeatsEditor from "./DialogueBeatsEditor.jsx";
import DialogueFitPanel from "./DialogueFitPanel.jsx";
import MotionGraphicPanel from "./MotionGraphicPanel.jsx";
import CritiqueFindingsPanel from "./CritiqueFindingsPanel.jsx";
import ShotThoughtLog from "./ShotThoughtLog.jsx";
import ProCta from "../common/ProCta.jsx";
import useCreatorVideoEntitlements from "../../hooks/useCreatorVideoEntitlements.js";
import { useCachedImageUrl } from "../../utils/cachedImageUrl.js";

/** On-demand only -- never auto-generated as part of dispatch, one track per shot, sourced from
 * the shot's already-planned ambient_bed sound design. */
function BackgroundMusicControl({ shotId }) {
  const dispatch = useDispatch();
  const { data: music } = useGetShotBackgroundMusicQuery(shotId, { skip: !shotId });
  const [generate, { isLoading }] = useGenerateShotBackgroundMusicMutation();

  const handleGenerate = async () => {
    try {
      await generate(shotId).unwrap();
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not generate background music for this shot", type: "error" }));
    }
  };

  return (
    <div className="rounded-md border border-white/10 bg-white/[0.02] p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <Music size={13} className="text-purple-300" />
        <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Background music</p>
      </div>
      {music?.signedUrl ? (
        <div className="space-y-2">
          <audio controls src={music.signedUrl} className="h-9 w-full" />
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGenerate}
            className="text-[10px] font-bold text-purple-300 hover:text-purple-200 disabled:opacity-60"
          >
            {isLoading ? "Regenerating…" : "Regenerate"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={isLoading}
          onClick={handleGenerate}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-white/15 py-1.5 text-[11px] font-bold text-slate-300 hover:border-purple-400/40 hover:text-purple-200 disabled:opacity-60"
        >
          {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Music size={12} />}
          {isLoading ? "Generating…" : "Generate background music"}
        </button>
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
function DubbedVoiceControl({ shotId, projectId, line, dubbed }) {
  const dispatch = useDispatch();
  const [redub, { isLoading }] = useTestShotVoiceMutation();
  const audioUrl = dubbed?.audioUrl || dubbed?.audioDataUri;
  // The take on file was made from these words; the shot now says those. When they differ the
  // recording is of a line that no longer exists, which is exactly what the fit report stops
  // treating as a measurement -- so say it here too, next to the button that fixes it.
  const stale = !!audioUrl && !!dubbed?.text && !!line && dubbed.text.trim() !== line.trim();

  if (!line) return null;

  const handleRedub = async () => {
    try {
      await redub({ projectId, shotId, text: line }).unwrap();
      dispatch(showFlash({ message: "Re-dubbed with the current line.", type: "success" }));
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not dub this shot", type: "error" }));
    }
  };

  return (
    <div className={`rounded-md border p-3 ${stale ? "border-amber-400/30 bg-amber-500/[0.06]" : "border-white/10 bg-white/[0.02]"}`}>
      <div className="mb-2 flex items-center gap-1.5">
        <AudioLines size={13} className={stale ? "text-amber-300" : "text-purple-300"} />
        <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Spoken take</p>
      </div>
      {audioUrl ? (
        <div className="space-y-2">
          <audio controls src={audioUrl} className="h-9 w-full" />
          {stale && (
            <p className="text-[10px] font-medium text-amber-200/90">
              This recording is of the previous line. Dub again to hear the line as it stands now —
              until then the fit figures are an estimate.
            </p>
          )}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleRedub}
            className="flex items-center gap-1.5 text-[10px] font-bold text-purple-300 hover:text-purple-200 disabled:opacity-60"
          >
            {isLoading ? <Loader2 size={11} className="animate-spin" /> : <AudioLines size={11} />}
            {isLoading ? "Dubbing…" : "Dub again with the current line"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={isLoading}
          onClick={handleRedub}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-white/15 py-1.5 text-[11px] font-bold text-slate-300 hover:border-purple-400/40 hover:text-purple-200 disabled:opacity-60"
        >
          {isLoading ? <Loader2 size={12} className="animate-spin" /> : <AudioLines size={12} />}
          {isLoading ? "Dubbing…" : "Dub this shot to hear it"}
        </button>
      )}
    </div>
  );
}

/** A bare number is not a price. The backend quotes in the wallet's own currency (billing
 * converts the provider's USD before it reaches here), so show the symbol that matches -- a
 * creator reading "0.66" next to a rupee balance cannot tell what they are agreeing to. */
const CURRENCY_SYMBOLS = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };

function formatCost(amount, currency) {
  if (amount == null) return null;
  const code = (currency || "INR").toUpperCase();
  const value = Number(amount);
  const shown = Number.isFinite(value) ? value.toFixed(2) : amount;
  const symbol = CURRENCY_SYMBOLS[code];
  return symbol ? `${symbol}${shown}` : `${shown} ${code}`;
}

const REFERENCE_KIND_LABELS = {
  STORYBOARD: "Shot frame",
  CHARACTER_FACE: "Character",
  PRODUCT_HERO: "Product",
  DP_LIGHTING: "Lighting",
  CAMERA_PLAN_IMAGE: "Camera plan",
  SET: "Set",
  STYLE_ANCHOR: "Style",
  PRIOR_SHOT_LAST_FRAME: "Prev. frame",
  CHARACTER_VOICE: "Voice sample",
  BACKGROUND_MUSIC: "Music bed",
};

/** Where an audio attachment came from. The voice sample is the actor's own recording, uploaded
 * in Cast; the music bed was generated for this shot from its sound design. Worth saying on the
 * card: they look identical as two audio players, and a creator deciding whether to regenerate
 * one needs to know which is their material and which is the machine's. */
const REFERENCE_KIND_ORIGIN = {
  CHARACTER_VOICE: "uploaded",
  BACKGROUND_MUSIC: "generated",
};

/** What this prompt was actually built from -- the frames, the face crops, the voice sample, the
 * music bed -- so the creator can see at a glance that the right assets were picked up instead of
 * inferring it from the prompt text. `references` (kind-tagged, images + audio) comes from
 * video-generation-service 0.2.23 on; older responses only carry the flat image-url list, which
 * still renders, just without labels. */
function PromptAttachments({ info }) {
  const references = info.references || [];
  const fallbackUrls = references.length ? [] : info.prompt?.referenceImageUrls || [];
  if (!references.length && !fallbackUrls.length) return null;

  const images = references.filter((ref) => !ref.audio);
  const audio = references.filter((ref) => ref.audio);

  return (
    <div className="mt-2.5 space-y-2">
      {(images.length > 0 || fallbackUrls.length > 0) && (
        <div>
          <p className="mb-1.5 text-[10px] font-medium text-slate-500">Images sent to the model, in slot order</p>
          <div className="flex gap-1.5 overflow-x-auto">
            {fallbackUrls.map((url, i) => (
              <img key={i} src={url} alt="Reference" className="h-14 w-14 shrink-0 rounded border border-white/10 object-cover" />
            ))}
            {images.map((ref) => (
              <figure key={`${ref.kind}-${ref.slotIndex}`} className="shrink-0">
                <img
                  src={ref.url}
                  alt={REFERENCE_KIND_LABELS[ref.kind] || ref.kind}
                  title={`Slot ${ref.slotIndex} — ${REFERENCE_KIND_LABELS[ref.kind] || ref.kind}`}
                  className="h-14 w-14 rounded border border-white/10 object-cover"
                />
                <figcaption className="mt-0.5 w-14 truncate text-center text-[9px] font-semibold text-slate-500">
                  {REFERENCE_KIND_LABELS[ref.kind] || ref.kind}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}
      {audio.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium text-slate-500">Audio attached to this shot</p>
          {audio.map((ref) => (
            <div key={`${ref.kind}-${ref.slotIndex}`} className="flex items-center gap-2">
              <span className="flex w-24 shrink-0 flex-col">
                <span className="text-[9px] font-semibold text-slate-400">
                  {REFERENCE_KIND_LABELS[ref.kind] || ref.kind}
                </span>
                {REFERENCE_KIND_ORIGIN[ref.kind] && (
                  <span
                    className={`text-[8px] font-bold uppercase tracking-wide ${
                      REFERENCE_KIND_ORIGIN[ref.kind] === "generated" ? "text-purple-300" : "text-slate-500"
                    }`}
                  >
                    {REFERENCE_KIND_ORIGIN[ref.kind]}
                  </span>
                )}
              </span>
              <audio controls src={ref.url} className="h-7 flex-1" />
            </div>
          ))}
          {audio.some((ref) => ref.kind === "BACKGROUND_MUSIC") && (
            <p className="text-[9px] font-medium text-slate-500">
              Mixed under the dialogue when this shot is generated.
            </p>
          )}
        </div>
      )}
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
/** Every prompt this shot has had, newest first.
 *
 * Editing never overwrites -- video-generation-service writes a new row parented to the one it
 * came from -- so a rejected prompt is still here to read, and "Use this" seeds the editor with an
 * older version to save forward as a new one. Nothing is mutated in place and nothing is deleted,
 * which is the whole point: a rewrite that turns out worse than what it replaced is recoverable.
 *
 * Collapsed by default. A shot with one prompt has no history worth the space.
 */
function PromptVersionHistory({ shotId, onUse, canEdit }) {
  const [open, setOpen] = React.useState(false);
  const { data: versions = [], isFetching } = useListShotPromptVersionsQuery(shotId, { skip: !shotId || !open });

  return (
    <div className="rounded-md border border-white/10 bg-white/[0.02] p-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-1.5">
          <History size={12} className="text-slate-400" />
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Prompt history</p>
        </div>
        <ChevronDown size={12} className={`text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-2 space-y-1.5">
          {isFetching ? (
            <p className="flex items-center gap-1.5 py-2 text-[11px] font-semibold text-slate-500">
              <Loader2 size={11} className="animate-spin" /> Loading versions…
            </p>
          ) : versions.length === 0 ? (
            <p className="py-2 text-[11px] font-semibold text-slate-600">No earlier versions for this shot.</p>
          ) : (
            versions.map((version, index) => {
              const text = version.promptCompressed || version.promptOriginal || "";
              const rejected = version.approvalStatus === "REJECTED";
              return (
                <div key={version.promptId} className="rounded border border-white/10 bg-black/20 p-2">
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="text-[9px] font-black uppercase tracking-wide text-slate-500">
                      {index === 0 ? "Current" : `v${versions.length - index}`}
                    </span>
                    {version.approvalStatus && (
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${
                        rejected ? "bg-rose-400/10 text-rose-300" : "bg-white/10 text-slate-400"
                      }`}>
                        {version.approvalStatus}
                      </span>
                    )}
                    {version.shipped && (
                      <span className="rounded bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-black uppercase text-emerald-300">
                        Shipped
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-3 text-[11px] font-medium leading-relaxed text-slate-400">{text || "—"}</p>
                  {index > 0 && canEdit && onUse && (
                    <button
                      type="button"
                      onClick={() => onUse(text)}
                      className="mt-1.5 text-[10px] font-bold text-purple-300 hover:text-purple-200"
                    >
                      Use this
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function ShotVideoCard({ shot, projectId, isOpen, onToggle, info, busy, video, dubbed, selected, onSelectToggle, onPrepare, onSavePrompt, onApprove, onReject, onAutoFix, onRegenerate, regenerating }) {
  // Prompt editing is local to the open card: the draft only leaves here on an explicit Save, so
  // collapsing the card or wandering off never silently rewrites what will be generated.
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const { entitlements } = useCreatorVideoEntitlements();

  /** Rejecting is the start of a rewrite, not the end of the shot. Mark it rejected, then drop
   * straight into the prompt so the creator can say what was wrong with it -- saving writes a
   * new version and leaves the rejected prompt intact as its parent. The card used to vanish
   * on reject, which threw away the one thing they needed to edit. */
  const handleReject = async () => {
    if (!onReject) return;
    const rejected = await onReject();
    if (rejected === false) return;
    if (!onSavePrompt || !info?.prompt) return;
    setDraft(info.prompt.promptCompressed || info.prompt.promptOriginal || "");
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Leave edit mode only if the save actually landed -- otherwise the creator's text is gone
      // and the old prompt silently reappears as if nothing happened.
      if (await onSavePrompt(draft)) setEditing(false);
    } finally {
      setSaving(false);
    }
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
  // Both dub badges resolve from `shot` plus the project-wide cloned-audio query the parent
  // already loads, so the grid paints its real dub state immediately. This deliberately does NOT
  // read `beats`: that is a per-shot request fired once per card, so gating the badge on it left
  // every card blank until N round-trips landed (and briefly showed "Needs voice" on shots that
  // in fact had beats, since an unresolved query reads as an empty list).
  const needsVoice = !video && !!dialogueVoiceText && !dubReady;
  // Signed URLs are re-signed (new query string) on every images refetch even when the object
  // itself hasn't changed, which would otherwise force the browser to re-download the frame on
  // every open. Cache the bytes locally keyed by shot+kind instead of the ever-changing URL.
  const frameSrc = useCachedImageUrl(frame && `${shot.id}:${frame.kind}`, frame?.signedUrl);

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
          {video?.outputUri ? (
            <video src={video.outputUri} muted loop autoPlay playsInline className="absolute inset-0 h-full w-full object-cover" />
          ) : frameSrc ? (
            <img src={frameSrc} alt={`Shot ${shot.shotNumber}`} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles size={22} className="text-slate-700" />
            </div>
          )}

          {video?.outputUri && (
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
          {isMotionGraphic && <MotionGraphicPanel shotId={shot.id} />}
          {video?.outputUri && (
            <video
              src={video.outputUri}
              controls
              className="mx-auto w-full max-w-md rounded-lg border border-white/10 bg-black"
              style={{ aspectRatio: aspect }}
            />
          )}

          {/* Shown before the prompt is built -- the mismatch is knowable from the plan and the
              dubbed audio alone, and that is the cheapest moment to find it -- and shown again on a
              shot that has ALREADY been generated, which is the case this most needs to cover: a
              clip that shipped with its line cut looks finished, and without this there is nothing
              on the card saying why it is wrong or offering to put it right. */}
          <DialogueFitPanel
            shot={shot}
            projectId={projectId}
            onResized={onPrepare}
            // Only offered once there is a job to approve -- "go with the original" is a way of
            // generating, so before prepare there is nothing for it to act on.
            onKeepOriginal={info?.externalJobId && !video ? () => onApprove?.({ dialogueFit: "KEEP_PLANNED" }) : undefined}
          />

          {!info && !isMotionGraphic && <DialogueBeatsEditor shot={shot} projectId={projectId} />}
          {/* Not gated on !info. video-generation-service was changed specifically so a bed
              generated after a shot was prepared still gets mixed in -- when the prompt carries
              no music reference it reads the shot's current track from pre-production. Hiding
              the control once prepared took away the case that fix exists to serve, and left
              no way to add or replace music on a shot you had already prepared. */}
          {!isMotionGraphic && (
            <DubbedVoiceControl
              shotId={shot.id}
              projectId={projectId}
              line={dialogueVoiceText}
              dubbed={dubbed}
            />
          )}
          <BackgroundMusicControl shotId={shot.id} />
          <ShotThoughtLog shotId={shot.id} />

          {!info && !video && (
            <button
              type="button"
              disabled={busy}
              onClick={onPrepare}
              className="creator-primary flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white disabled:opacity-60"
            >
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {busy ? "Preparing…" : "Prepare shot for video"}
            </button>
          )}

          {/* A generated shot was a dead end: the card showed the clip and nothing else, so a shot
              that came back wrong -- the line cut off, the wrong duration, a rewritten line since
              saved -- could only be fixed by never having generated it. Regenerating builds a fresh
              prompt from the shot as it stands now, then goes through the same approve step, so the
              new clip is costed and confirmed exactly like the first one. */}
          {video && !regenerating && onRegenerate && (
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

          {info && info.critiqueVerdict === "NEEDS_HUMAN_REVIEW" && (
            <CritiqueFindingsPanel
              findings={info.findings}
              fixing={busy}
              onAutoFix={onAutoFix}
              onReject={onReject}
            />
          )}

          {info && info.externalJobId && (
            <>
              <div className="flex flex-wrap gap-2">
                {info.recommendedModel && (
                  <span className="rounded-full border border-purple-400/20 bg-purple-500/10 px-2.5 py-1 text-[11px] font-bold text-purple-200">
                    Suggested model: {info.recommendedModel}
                  </span>
                )}
                {info.estimatedCost != null && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300">
                    {/* On a shot already rendered this is what generating it AGAIN would cost, not
                        what was spent -- saying "Est. cost" there would read as a bill already paid. */}
                    {video && !regenerating ? "Regenerating costs: " : "Est. cost: "}
                    {formatCost(info.estimatedCost, info.costCurrency)}
                  </span>
                )}
              </div>
              {info.recommendationReasoning && (
                <p className="text-[11px] font-medium italic text-slate-400">"{info.recommendationReasoning}"</p>
              )}
              {info.prompt && (
                <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Prompt</p>
                    {!editing && onSavePrompt && (
                      <ProCta
                        unlocked={entitlements.editsEnabled}
                        feature="Editing the prompt"
                        onClick={() => {
                          setDraft(info.prompt.promptCompressed || info.prompt.promptOriginal || "");
                          setEditing(true);
                        }}
                        className="flex items-center gap-1 text-[10px] font-bold text-purple-300 hover:text-purple-200"
                      >
                        <Pencil size={10} />
                        Edit
                      </ProCta>
                    )}
                  </div>
                  {editing ? (
                    <>
                      <textarea
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        rows={8}
                        className="creator-input w-full text-[11px] font-medium leading-relaxed"
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          disabled={saving || !draft.trim()}
                          onClick={handleSave}
                          className="flex items-center gap-1.5 rounded-md border border-purple-400/30 bg-purple-500/15 px-3 py-1.5 text-[11px] font-bold text-purple-200 disabled:opacity-50"
                        >
                          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                          {saving ? "Saving…" : "Save prompt"}
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => setEditing(false)}
                          className="rounded-md border border-white/10 px-3 py-1.5 text-[11px] font-bold text-slate-400 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                      <p className="mt-1.5 text-[10px] font-medium text-slate-500">
                        Saving keeps a new version — the original stays in this shot's history, and the reference
                        images below carry over unchanged.
                      </p>
                    </>
                  ) : (
                    <p className="whitespace-pre-wrap text-[11px] font-medium leading-relaxed text-slate-300">
                      {info.prompt.promptCompressed || info.prompt.promptOriginal}
                    </p>
                  )}
                  {info.prompt.negativePrompt && (
                    <p className="mt-2 text-[10px] font-medium text-slate-500">Negative: {info.prompt.negativePrompt}</p>
                  )}
                  <PromptAttachments info={info} />
                  <PromptVersionHistory
                    shotId={shot.id}
                    canEdit={entitlements.editsEnabled && !!onSavePrompt}
                    onUse={(text) => {
                      setDraft(text);
                      setEditing(true);
                    }}
                  />
                </div>
              )}
              {/* Approve and reject belong to a shot that has not been rendered yet. Once a clip
                  exists the prompt above it is a record of what produced it, and the action that
                  makes sense is to generate again -- which is the Regenerate control below. */}
              {(!video || regenerating) && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleReject}
                    className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-300"
                  >
                    <X size={13} />
                    Reject & rewrite
                  </button>
                  <button
                    type="button"
                    disabled={busy || editing}
                    title={editing ? "Save or cancel your prompt edit first." : undefined}
                    onClick={() => onApprove?.()}
                    className="creator-primary flex flex-1 items-center justify-center gap-2 py-2 text-xs font-bold text-white disabled:opacity-60"
                  >
                    {busy && <Loader2 size={13} className="animate-spin" />}
                    {busy ? "Generating… (can take a few minutes)" : "Approve & generate"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
