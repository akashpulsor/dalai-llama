import React from "react";
import { Check } from "lucide-react";
import ConfirmDialog from "../videoStudio/videoPrompt/ConfirmDialog.jsx";
import { shotLengthChangeNote } from "../videoStudio/studioState.js";

/**
 * Asks before a shot's length in the film changes. The shot's length is the film's running time;
 * the clip the model renders is a separate choice in the video studio. Both are worth changing,
 * but only one of them changes the whole video, so that one says so before it happens.
 *
 * @param {{ change: { from: number, to: number } | null, onConfirm: () => void, onCancel: () => void }} props
 */
export default function ShotLengthConfirm({ change, onConfirm, onCancel }) {
  const note = change ? shotLengthChangeNote(change.from, change.to) : null;
  return (
    <ConfirmDialog
      open={!!note}
      title={note?.title ?? ""}
      body={note && (
        <div className="space-y-1.5">
          <p>{note.film}</p>
          <p className="text-slate-400">{note.clip}</p>
        </div>
      )}
      primary={{ label: change ? `Make the shot ${change.to}s` : "", icon: Check, onClick: onConfirm }}
      secondary={{ label: "Cancel", onClick: onCancel }}
      onCancel={onCancel}
    />
  );
}
