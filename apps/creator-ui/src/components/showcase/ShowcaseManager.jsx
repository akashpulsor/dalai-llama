// @ts-nocheck
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Pencil, Trash2 } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useGetMyShowcaseQuery,
  useRemoveShowcaseItemMutation,
  useReorderShowcaseMutation,
  useUpdateShowcaseItemMutation,
} from "../../api/showcaseEndpoints.js";
import ShowcaseFields from "./ShowcaseFields.jsx";
import { FORMAT_LABEL, INDUSTRY_LABEL, errorMessage } from "./showcaseLabels.js";

/** The videos on the creator's profile, in their order. */
export default function ShowcaseManager() {
  const dispatch = useDispatch();
  const { data: items = [], isLoading } = useGetMyShowcaseQuery();
  const [update, updateState] = useUpdateShowcaseItemMutation();
  const [remove] = useRemoveShowcaseItemMutation();
  const [reorder] = useReorderShowcaseMutation();
  const [editing, setEditing] = useState(null);

  const fail = (e, fallback) => dispatch(showFlash({ message: errorMessage(e, fallback), type: "error" }));

  const move = async (index, delta) => {
    const ids = items.map((i) => i.id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    try {
      await reorder(ids).unwrap();
    } catch (e) {
      fail(e, "Could not reorder");
    }
  };

  const setVisible = async (item, visible) => {
    try {
      await update({ itemId: item.id, industry: item.industry, format: item.format, clientLabel: item.clientLabel,
        titleOverride: item.titleOverride, visible }).unwrap();
    } catch (e) {
      fail(e, "Could not change this video");
    }
  };

  const onRemove = async (item) => {
    try {
      await remove(item.id).unwrap();
      dispatch(showFlash({ message: "Removed from your profile", type: "success" }));
    } catch (e) {
      fail(e, "Could not remove this video");
    }
  };

  const onSaveEdit = async () => {
    try {
      await update({ itemId: editing.id, industry: editing.industry, format: editing.format,
        clientLabel: editing.clientLabel || null, titleOverride: editing.titleOverride || null,
        visible: editing.status === "LIVE" }).unwrap();
      setEditing(null);
    } catch (e) {
      fail(e, "Could not save");
    }
  };

  if (isLoading) return <Loader2 size={16} className="animate-spin text-slate-400" />;
  if (items.length === 0) {
    return <p className="text-sm text-slate-400">Nothing on your profile yet. Pick videos from your channel below.</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
          <div className="h-14 w-20 shrink-0 overflow-hidden rounded bg-black">
            {item.thumbnailUrl && <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{item.title}</p>
            <p className="text-xs text-slate-400">
              {item.origin === "PLATFORM" && <span className="mr-1.5 rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-bold text-purple-100">Made on Dalaillama</span>}
              {INDUSTRY_LABEL[item.industry]} · {FORMAT_LABEL[item.format]} · {item.playCount} plays
              {item.status === "HIDDEN" && " · Hidden"}
              {item.hiddenByOps && " · Hidden by Dalaillama"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <IconButton label="Move up" onClick={() => move(index, -1)} disabled={index === 0}><ArrowUp size={14} /></IconButton>
            <IconButton label="Move down" onClick={() => move(index, 1)} disabled={index === items.length - 1}><ArrowDown size={14} /></IconButton>
            <IconButton label={item.status === "LIVE" ? "Hide" : "Show"} onClick={() => setVisible(item, item.status !== "LIVE")}>
              {item.status === "LIVE" ? <EyeOff size={14} /> : <Eye size={14} />}
            </IconButton>
            <IconButton label="Edit" onClick={() => setEditing({ ...item, clientLabel: item.clientLabel || "", titleOverride: item.titleOverride || "" })}>
              <Pencil size={14} />
            </IconButton>
            <IconButton label="Remove" onClick={() => onRemove(item)}><Trash2 size={14} /></IconButton>
          </div>
        </div>
      ))}

      {editing && (
        <div role="dialog" aria-modal="true" aria-labelledby="edit-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="creator-panel w-full max-w-md p-5">
            <h3 id="edit-title" className="text-base font-bold text-white">Edit video</h3>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-normal text-slate-500">Title on Dalaillama</span>
              <input id="titleOverride" value={editing.titleOverride} maxLength={120} placeholder={editing.title}
                     onChange={(e) => setEditing({ ...editing, titleOverride: e.target.value })}
                     className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400/60" />
            </label>
            <ShowcaseFields value={editing} onChange={(v) => setEditing({ ...editing, ...v })} showRights={false} />
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="creator-control h-9 px-4 text-xs font-bold text-slate-200">Cancel</button>
              <button type="button" onClick={onSaveEdit} disabled={updateState.isLoading}
                      className="creator-primary flex h-9 items-center gap-2 px-4 text-xs font-black text-white disabled:opacity-50">
                {updateState.isLoading && <Loader2 size={13} className="animate-spin" />} Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IconButton({ label, onClick, disabled, children }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled}
            className="creator-control flex h-9 w-9 items-center justify-center text-slate-200 disabled:opacity-40">
      {children}
    </button>
  );
}
