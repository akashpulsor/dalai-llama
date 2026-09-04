// @ts-nocheck
import React from "react";
import { BookLock } from "lucide-react";
import { useGetContinuityBibleQuery } from "../../api/creatorEndpoints.js";

const CATEGORY_LABEL = {
  CHARACTER_IDENTITY: "Character identity",
  WARDROBE_APPEARANCE: "Wardrobe / appearance",
  SET_PROP: "Set / location",
  CAMERA_LANGUAGE: "Camera language",
  LIGHTING_COLOR: "Lighting / color",
};

/** Deterministically recomputed whenever the shot list regenerates (see ContinuityBibleService) --
 * these are the locks every shot's continuity anchors are built from, shown here so the creator
 * can see what consistency the project is actually being held to. */
export default function ContinuityBiblePanel({ projectId }) {
  const { data, error } = useGetContinuityBibleQuery(projectId, { skip: !projectId });
  if (!data || error?.status === 404) return null;

  const byCategory = data.locks.reduce((acc, lock) => {
    (acc[lock.category] ||= []).push(lock.value);
    return acc;
  }, {});

  return (
    <div className="creator-panel mt-6 p-6">
      <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-purple-300">
        <BookLock size={12} />
        Continuity bible
      </p>
      <p className="mt-0.5 mb-4 text-xs font-medium text-slate-400">
        Locked across every shot so identity, wardrobe, sets, camera language, and lighting stay consistent.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(byCategory).map(([category, values]) => (
          <div key={category} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">{CATEGORY_LABEL[category] || category}</p>
            <ul className="space-y-1">
              {values.map((value, i) => (
                <li key={i} className="text-[11px] font-medium text-slate-300">{value}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
