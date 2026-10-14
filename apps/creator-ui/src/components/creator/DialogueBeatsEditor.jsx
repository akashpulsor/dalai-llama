// @ts-nocheck
import React from "react";
import { useDispatch } from "react-redux";
import { Loader2, Mic, Trash2 } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useListShotDialogueBeatsQuery,
  useCreateShotDialogueBeatMutation,
  useDeleteShotDialogueBeatMutation,
} from "../../api/creatorEndpoints.js";

/** A "beat" is a dialogue timestamp -- which second within this shot's timeline a line starts and
 * how long it runs. With at least one beat present, video-generation-service turns off the video
 * model's native audio and dubs in the cast member's cloned voice instead. Everything a beat needs
 * -- the line, the character, the shot's planned duration, the actor's voice sample -- is already
 * decided upstream (script -> shot -> cast assignment), so this is a one-click switch against
 * that plan, not a form for typing timestamps by hand.
 *
 * <p>It used to be a "Dialogue" box of its own that repeated the line, played the same recordings
 * the Spoken take shows and recorded new ones through the same clone call -- two boxes for one
 * thing. What only it did is this switch, so it now sits inside the Spoken take as one row. */
export default function DialogueBeatsEditor({ shot, projectId, hasLine, disabled }) {
  const dispatch = useDispatch();
  const shotId = shot?.id;
  const { data: beats = [] } = useListShotDialogueBeatsQuery(shotId, { skip: !shotId });
  const [createBeat, { isLoading: adding }] = useCreateShotDialogueBeatMutation();
  const [deleteBeat, { isLoading: removing }] = useDeleteShotDialogueBeatMutation();
  const cast = shot?.cast;

  if (!hasLine && beats.length === 0) return null;

  // Only orderIndex/startSeconds describe this beat's placement -- everything else (line,
  // character, duration) already lives on the persisted Shot row, so the backend derives it from
  // shotId rather than being handed a copy of what's already in the DB.
  const turnOn = async () => {
    try {
      await createBeat({ shotId, projectId, orderIndex: beats.length, startSeconds: 0 }).unwrap();
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not dub this line into the clip", type: "error" }));
    }
  };
  const turnOff = async () => {
    try {
      for (const beat of beats) {
        // eslint-disable-next-line no-await-in-loop
        await deleteBeat({ shotId, beatId: beat.id, projectId }).unwrap();
      }
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not turn the dub off", type: "error" }));
    }
  };

  const on = beats.length > 0;
  const noVoice = !cast?.hasVoiceSample;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-white/10 bg-black/20 px-2.5 py-1.5">
      <p className="min-w-0 flex-1 text-[10px] font-medium text-slate-400">
        <span className={`font-bold ${on ? "text-purple-200" : "text-slate-300"}`}>{on ? "Dubbed in the reader's voice" : "The video model voices the line"}</span>
        {" — "}
        {on
          ? `the model's own audio is muted and the line is laid in at ${beats.map((b) => `${Number(b.startSeconds).toFixed(1)}–${(Number(b.startSeconds) + Number(b.durationSeconds)).toFixed(1)}s`).join(", ")}.`
          : "in a voice of its own, not the one chosen below."}
      </p>
      {on ? (
        <button type="button" disabled={disabled || removing} onClick={turnOff}
          className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-rose-300 disabled:opacity-60">
          {removing ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />} Let the model voice it
        </button>
      ) : (
        <button type="button" disabled={disabled || adding || noVoice} onClick={turnOn}
          title={noVoice ? "Choose who reads it first — they need a voice sample or a built-in voice" : undefined}
          className="flex items-center gap-1.5 text-[10px] font-bold text-purple-300 hover:text-purple-200 disabled:opacity-50">
          {adding ? <Loader2 size={11} className="animate-spin" /> : <Mic size={11} />}
          Dub in the reader's voice
        </button>
      )}
    </div>
  );
}
