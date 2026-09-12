// @ts-nocheck
import React, { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { AudioLines, Loader2, Mic, Play, Square, Trash2 } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useListShotDialogueBeatsQuery,
  useCreateShotDialogueBeatMutation,
  useDeleteShotDialogueBeatMutation,
  useListPreProductionShotImagesQuery,
  useTestShotVoiceMutation,
} from "../../api/creatorEndpoints.js";
import { useCachedImageUrl } from "../../utils/cachedImageUrl.js";

/** A "beat" is a dialogue timestamp -- which second within this shot's timeline a line starts and
 * how long it runs. With at least one beat present, video-generation-service turns off the video
 * model's native audio and dubs in the cast member's cloned voice instead. Everything a beat needs
 * -- the line, the character, the shot's planned duration, the actor's voice sample -- is already
 * decided upstream (script -> shot -> cast assignment), so this is a one-click "clone it" against
 * that plan, not a form for typing timestamps by hand. */
export default function DialogueBeatsEditor({ shot, projectId }) {
  const dispatch = useDispatch();
  const shotId = shot?.id;

  const { data: beats = [] } = useListShotDialogueBeatsQuery(shotId, { skip: !shotId });
  const { data: images = [] } = useListPreProductionShotImagesQuery(shotId, { skip: !shotId });
  const [createBeat, { isLoading: cloning }] = useCreateShotDialogueBeatMutation();
  const [deleteBeat] = useDeleteShotDialogueBeatMutation();
  const [testVoice, { isLoading: testing }] = useTestShotVoiceMutation();
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  // Keyed by the exact line tested, so editing the dialogue invalidates the cache but replaying
  // the same line -- which is the common case, checking a pick sounds right -- doesn't spend
  // another ElevenLabs call for audio already sitting in memory.
  const [cachedAudio, setCachedAudio] = useState(null); // { text, dataUri }

  // PRODUCTION (photoreal) is generated on demand and may not exist yet -- STORYBOARD (sketch)
  // is generated eagerly with the rest of the shot list, so it's there from the start as a stand-in.
  const frame = images.find((img) => img.kind === "PRODUCTION") || images.find((img) => img.kind === "STORYBOARD");
  // Same object as ShotVideoCard's thumbnail -- shares its blob cache slot key so opening this
  // panel reuses the already-fetched bytes instead of re-downloading a freshly re-signed URL.
  const frameSrc = useCachedImageUrl(frame && `${shotId}:${frame.kind}`, frame?.signedUrl);
  // shot.voiceOver is the actual line to be spoken. shot.scriptLine is the shot's CREATIVE brief
  // -- for ACTION/B_ROLL/MOTION_GRAPHIC shots that's a visual scene description ("Priya smiling
  // in slow motion"), NOT dialogue; cloning it would produce a voice-over of scene direction,
  // which was the reported bug ("dialogues are not written, narration/scene details are given").
  // Only fall back for DIALOGUE-type shots where scriptLine actually IS what's being said (even
  // when it's "Narrator: '...'" -- still the spoken line, not visual direction).
  const dialogueText = (shot?.voiceOver || (shot?.shotType === "DIALOGUE" ? shot?.scriptLine : "") || "").trim();
  const cast = shot?.cast;

  // Only orderIndex/startSeconds describe this beat's placement -- everything else (line,
  // character, duration) already lives on the persisted Shot row, so the backend derives it from
  // shotId rather than being handed a copy of what's already in the DB.
  const handleClone = async () => {
    if (!dialogueText) return;
    try {
      await createBeat({ shotId, projectId, orderIndex: beats.length, startSeconds: 0 }).unwrap();
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not clone this dialogue", type: "error" }));
    }
  };

  // "Test voice" hits video-generation-service /v1/clone, which resolves the shot's
  // character identity and returns audio rendered with the real voice -- cloned from the actor's
  // sample if uploaded, or direct TTS with the built-in voice pick, matching what
  // BeatDubbingService runs at approve() time. Plays the returned base64 audio inline so the
  // creator can hear whether the pick is right before spending a full dispatch on it.
  const handleTest = async () => {
    if (playing) {
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.currentTime = 0;
      setPlaying(false);
      return;
    }
    // Already cloned this exact line -- replay it instead of paying for another clone/TTS call.
    if (cachedAudio?.text === dialogueText && audioRef.current) {
      audioRef.current.src = cachedAudio.dataUri;
      audioRef.current.play().catch(() => {});
      setPlaying(true);
      return;
    }
    try {
      const result = await testVoice({ projectId, shotId, text: dialogueText || undefined }).unwrap();
      if (!result?.audioDataUri || !audioRef.current) return;
      setCachedAudio({ text: dialogueText, dataUri: result.audioDataUri });
      audioRef.current.src = result.audioDataUri;
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not test this voice", type: "error" }));
    }
  };

  const handleDelete = async (beatId) => {
    try {
      await deleteBeat({ shotId, beatId, projectId }).unwrap();
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not remove this beat", type: "error" }));
    }
  };

  if (!dialogueText && beats.length === 0) return null;

  return (
    <div className="rounded-md border border-white/10 bg-white/[0.02] p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <AudioLines size={13} className="text-purple-300" />
        <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
          Dialogue {beats.length > 0 && <span className="text-purple-300">— auto-dub on</span>}
        </p>
      </div>

      <div className="mb-2.5 flex items-start gap-2.5">
        {frameSrc && (
          <img
            src={frameSrc}
            alt={frame.kind === "PRODUCTION" ? "Production frame" : "Storyboard sketch"}
            className="h-14 w-14 shrink-0 rounded border border-white/10 object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          {dialogueText ? (
            <p className="text-[11px] font-medium leading-snug text-slate-300">"{dialogueText}"</p>
          ) : (
            <p className="text-[11px] font-medium italic text-slate-500">No dialogue planned for this shot.</p>
          )}
          {cast && (
            <p className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
              {cast.castFaceImageUrl && (
                <img src={cast.castFaceImageUrl} alt="" className="h-4 w-4 rounded-full border border-white/10 object-cover" />
              )}
              {cast.characterName}
              {cast.castDisplayName ? ` — ${cast.castDisplayName}` : ""}
              {!cast.hasVoiceSample && " (no voice sample yet)"}
            </p>
          )}
        </div>
      </div>

      {beats.length > 0 && (
        <div className="mb-2 space-y-1.5">
          {beats.map((beat) => (
            <div key={beat.id} className="flex items-center gap-2 rounded border border-white/10 bg-black/20 px-2.5 py-1.5">
              <span className="shrink-0 rounded bg-purple-500/15 px-1.5 py-0.5 text-[10px] font-bold text-purple-200">
                {Number(beat.startSeconds).toFixed(1)}s–{(Number(beat.startSeconds) + Number(beat.durationSeconds)).toFixed(1)}s
              </span>
              <span className="flex-1 truncate text-[11px] font-medium text-slate-300">{beat.text}</span>
              <button
                type="button"
                onClick={() => handleDelete(beat.id)}
                className="shrink-0 text-slate-500 hover:text-rose-300"
                title="Remove this beat — the shot reverts to the video model's own native audio"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {dialogueText && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={testing || !cast?.hasVoiceSample}
            onClick={handleTest}
            title={!cast?.hasVoiceSample ? "Assign a cast member with a voice sample or built-in voice first" : "Preview this line in the character's voice"}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-200 hover:border-purple-400/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {testing ? <Loader2 size={12} className="animate-spin" /> : playing ? <Square size={12} /> : <Play size={12} />}
          </button>
          {beats.length === 0 && (
            <button
              type="button"
              disabled={cloning || !cast?.hasVoiceSample}
              onClick={handleClone}
              title={!cast?.hasVoiceSample ? "Assign a cast member with a voice sample or built-in voice first" : undefined}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-purple-400/30 bg-purple-500/10 py-1.5 text-[11px] font-bold text-purple-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {cloning ? <Loader2 size={12} className="animate-spin" /> : <Mic size={12} />}
              {cloning ? "Adding beat…" : `Dub in ${cast?.castDisplayName || "actor"}'s voice`}
            </button>
          )}
          <audio ref={audioRef} onEnded={() => setPlaying(false)} preload="none" className="hidden" />
        </div>
      )}
    </div>
  );
}
