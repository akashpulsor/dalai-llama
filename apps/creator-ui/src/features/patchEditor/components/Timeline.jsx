// @ts-nocheck
import React, { useCallback, useRef, useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { usePatchEditor } from "../state/PatchEditorProvider.jsx";
import { clamp, formatTimecode } from "../utils/time.js";

const MIN_PX_PER_SEC = 4;
const MAX_PX_PER_SEC = 400;
const TRACK_EDGE_PADDING_PX = 10;

export default function Timeline() {
  const { state, actions } = usePatchEditor();
  const { duration, selection, playback, thumbnails, edl } = state;
  const scrollRef = useRef(null);
  const trackRef = useRef(null);
  const [pxPerSec, setPxPerSec] = useState(0);

  const containerWidth = scrollRef.current?.clientWidth || 800;
  const fitPxPerSec = duration
    ? Math.max((containerWidth - TRACK_EDGE_PADDING_PX * 2) / duration, MIN_PX_PER_SEC)
    : MIN_PX_PER_SEC;
  const effectivePxPerSec = pxPerSec || fitPxPerSec;
  const contentWidth = Math.max(duration * effectivePxPerSec, containerWidth - TRACK_EDGE_PADDING_PX * 2);
  const trackWidth = contentWidth + TRACK_EDGE_PADDING_PX * 2;

  // Edge padding keeps the IN/OUT handles fully grabbable even when the selection
  // starts at 0 or ends at duration - without it, a handle at the very edge sits
  // half outside the scrollable track and is easy to miss/clip.
  const timeFromClientX = useCallback(
    (clientX) => {
      const rect = trackRef.current.getBoundingClientRect();
      const x = clamp(clientX - rect.left - TRACK_EDGE_PADDING_PX, 0, contentWidth);
      return clamp(x / effectivePxPerSec, 0, duration);
    },
    [effectivePxPerSec, duration, contentWidth]
  );

  const beginDrag = (onMove) => (event) => {
    event.preventDefault();
    event.stopPropagation();
    // Pointer capture keeps pointermove/pointerup delivered to this element even if
    // the cursor moves faster than the browser can track it and leaves the element's
    // bounds mid-drag - without it, a fast drag can silently stop updating.
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const handleMove = (moveEvent) => onMove(moveEvent.clientX);
    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    onMove(event.clientX);
  };

  const handleTrackPointerDown = beginDrag((clientX) => {
    actions.setPlaying(false);
    actions.setCurrentTime(timeFromClientX(clientX));
  });

  const handleInDrag = beginDrag((clientX) => {
    if (!selection) return;
    actions.setViewMode("original");
    actions.setSelection(timeFromClientX(clientX), selection.outPoint);
  });

  const handleOutDrag = beginDrag((clientX) => {
    if (!selection) return;
    actions.setViewMode("original");
    actions.setSelection(selection.inPoint, timeFromClientX(clientX));
  });

  const zoomIn = () => setPxPerSec((value) => clamp((value || fitPxPerSec) * 1.5, MIN_PX_PER_SEC, MAX_PX_PER_SEC));
  const zoomOut = () => setPxPerSec((value) => clamp((value || fitPxPerSec) / 1.5, MIN_PX_PER_SEC, MAX_PX_PER_SEC));
  const zoomFit = () => setPxPerSec(0);

  const playheadLeft = playback.currentTime * effectivePxPerSec + TRACK_EDGE_PADDING_PX;
  const selectionLeft = selection ? selection.inPoint * effectivePxPerSec + TRACK_EDGE_PADDING_PX : 0;
  const selectionWidth = selection ? (selection.outPoint - selection.inPoint) * effectivePxPerSec : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono text-sm font-bold text-slate-100">{formatTimecode(playback.currentTime)}</span>
          <span className="text-slate-600">/</span>
          <span className="font-mono text-slate-500">{formatTimecode(duration)}</span>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={zoomOut} title="Zoom out" className="rounded p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-white">
            <ZoomOut size={14} />
          </button>
          <button
            type="button"
            onClick={zoomFit}
            className="rounded px-2 py-1 text-[10px] font-black uppercase tracking-normal text-slate-400 hover:bg-white/[0.06] hover:text-white"
          >
            Fit
          </button>
          <button type="button" onClick={zoomIn} title="Zoom in" className="rounded p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-white">
            <ZoomIn size={14} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="overflow-x-auto rounded-lg border border-white/10 bg-black/20">
        <div
          ref={trackRef}
          onPointerDown={handleTrackPointerDown}
          className="relative h-24 cursor-pointer select-none"
          style={{ width: trackWidth, touchAction: "none" }}
        >
          <div
            className="absolute inset-y-0 flex overflow-hidden rounded-lg"
            style={{ left: TRACK_EDGE_PADDING_PX, width: contentWidth }}
          >
            {thumbnails.items.length === 0 && thumbnails.status === "loading" && (
              <div className="flex w-full items-center justify-center text-[11px] text-slate-600">Generating thumbnails…</div>
            )}
            {thumbnails.items.map((thumb) => (
              <img key={thumb.time} src={thumb.url} alt="" draggable={false} className="h-full w-auto flex-1 object-cover opacity-70" />
            ))}
          </div>

          {edl.map((entry) => (
            <div
              key={entry.id}
              title={`Patched with ${entry.replacementName}`}
              className="pointer-events-none absolute top-0 h-full border-x-2 border-emerald-400/70 bg-emerald-400/10"
              style={{ left: entry.start * effectivePxPerSec + TRACK_EDGE_PADDING_PX, width: (entry.end - entry.start) * effectivePxPerSec }}
            />
          ))}

          {selection && (
            <div className="absolute top-0 h-full bg-purple-500/20" style={{ left: selectionLeft, width: selectionWidth, touchAction: "none" }}>
              <div
                onPointerDown={handleInDrag}
                title="Drag IN marker"
                style={{ touchAction: "none" }}
                className="absolute -left-2.5 top-0 flex h-full w-5 cursor-ew-resize items-center justify-center rounded-sm bg-purple-400 hover:bg-purple-300 active:bg-purple-200"
              >
                <span className="h-8 w-0.5 rounded-full bg-white/80" />
              </div>
              <div
                onPointerDown={handleOutDrag}
                title="Drag OUT marker"
                style={{ touchAction: "none" }}
                className="absolute -right-2.5 top-0 flex h-full w-5 cursor-ew-resize items-center justify-center rounded-sm bg-purple-400 hover:bg-purple-300 active:bg-purple-200"
              >
                <span className="h-8 w-0.5 rounded-full bg-white/80" />
              </div>
            </div>
          )}

          <div className="pointer-events-none absolute top-0 h-full w-px bg-white" style={{ left: playheadLeft }}>
            <div className="absolute -left-[5px] -top-1 h-2.5 w-2.5 rotate-45 bg-white" />
          </div>
        </div>
      </div>

      <p className="text-[11px] font-semibold text-slate-600">
        Drag the purple handles to set IN / OUT. Click the track to move the playhead. Shortcuts: Space play/pause · I set in · O set out.
      </p>
    </div>
  );
}
