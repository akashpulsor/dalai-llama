// @ts-nocheck
import React from "react";
import { useDispatch } from "react-redux";
import { Check, ChevronDown, Loader2, Music, PlayCircle, Sparkles, X } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useGenerateShotBackgroundMusicMutation,
  useGetShotBackgroundMusicQuery,
  useListPreProductionShotImagesQuery,
} from "../../api/creatorEndpoints.js";
import DialogueBeatsEditor from "./DialogueBeatsEditor.jsx";
import MotionGraphicPanel from "./MotionGraphicPanel.jsx";
import CritiqueFindingsPanel from "./CritiqueFindingsPanel.jsx";
import ShotThoughtLog from "./ShotThoughtLog.jsx";
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
export default function ShotVideoCard({ shot, projectId, isOpen, onToggle, info, busy, video, onPrepare, onApprove, onReject, onAutoFix }) {
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
  // Signed URLs are re-signed (new query string) on every images refetch even when the object
  // itself hasn't changed, which would otherwise force the browser to re-download the frame on
  // every open. Cache the bytes locally keyed by shot+kind instead of the ever-changing URL.
  const frameSrc = useCachedImageUrl(frame && `${shot.id}:${frame.kind}`, frame?.signedUrl);

  return (
    <div className={`overflow-hidden rounded-lg border border-white/10 bg-white/[0.02] ${isOpen ? "col-span-full" : ""}`}>
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
            <span className="rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-bold text-white">
              #{shot.shotNumber} <span className="font-medium text-slate-300">{shot.shotType}</span>
            </span>
            <div className="flex flex-col items-end gap-1">
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

      {isOpen && isMotionGraphic && (
        <div className="border-t border-white/10 px-4 py-3.5">
          <MotionGraphicPanel shotId={shot.id} />
        </div>
      )}

      {isOpen && !isMotionGraphic && (
        <div className="space-y-3 border-t border-white/10 px-4 py-3.5">
          {video?.outputUri && (
            <video
              src={video.outputUri}
              controls
              className="mx-auto w-full max-w-md rounded-lg border border-white/10 bg-black"
              style={{ aspectRatio: aspect }}
            />
          )}

          {!info && <DialogueBeatsEditor shot={shot} projectId={projectId} />}
          {!info && <BackgroundMusicControl shotId={shot.id} />}
          <ShotThoughtLog shotId={shot.id} />

          {!info && (
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

          {info && info.critiqueVerdict === "NEEDS_HUMAN_REVIEW" && (
            <CritiqueFindingsPanel
              findings={info.findings}
              fixing={busy}
              onAutoFix={onAutoFix}
              onReject={onReject}
            />
          )}

          {info && info.externalJobId && !video && (
            <>
              <div className="flex flex-wrap gap-2">
                {info.recommendedModel && (
                  <span className="rounded-full border border-purple-400/20 bg-purple-500/10 px-2.5 py-1 text-[11px] font-bold text-purple-200">
                    Suggested model: {info.recommendedModel}
                  </span>
                )}
                {info.estimatedCost != null && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300">
                    Est. cost: {info.estimatedCost}
                  </span>
                )}
              </div>
              {info.recommendationReasoning && (
                <p className="text-[11px] font-medium italic text-slate-400">"{info.recommendationReasoning}"</p>
              )}
              {info.prompt && (
                <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
                  <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Prompt</p>
                  <p className="whitespace-pre-wrap text-[11px] font-medium leading-relaxed text-slate-300">
                    {info.prompt.promptCompressed || info.prompt.promptOriginal}
                  </p>
                  {info.prompt.negativePrompt && (
                    <p className="mt-2 text-[10px] font-medium text-slate-500">Negative: {info.prompt.negativePrompt}</p>
                  )}
                  {info.prompt.referenceImageUrls?.length > 0 && (
                    <div className="mt-2.5">
                      <p className="mb-1.5 text-[10px] font-medium text-slate-500">
                        Reference image{info.prompt.referenceImageUrls.length > 1 ? "s" : ""} sent to the model
                      </p>
                      <div className="flex gap-1.5 overflow-x-auto">
                        {info.prompt.referenceImageUrls.map((url, i) => (
                          <img key={i} src={url} alt="Reference" className="h-14 w-14 shrink-0 rounded border border-white/10 object-cover" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onReject}
                  className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-300"
                >
                  <X size={13} />
                  Reject
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={onApprove}
                  className="creator-primary flex flex-1 items-center justify-center gap-2 py-2 text-xs font-bold text-white disabled:opacity-60"
                >
                  {busy && <Loader2 size={13} className="animate-spin" />}
                  {busy ? "Generating… (can take a few minutes)" : "Approve & generate"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
