// @ts-nocheck
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { PatchEditorProvider, usePatchEditor } from "../features/patchEditor/state/PatchEditorProvider.jsx";
import Toolbar from "../features/patchEditor/components/Toolbar.jsx";
import Timeline from "../features/patchEditor/components/Timeline.jsx";
import VideoPlayer from "../features/patchEditor/components/VideoPlayer.jsx";
import PatchedPreviewPlayer from "../features/patchEditor/components/PatchedPreviewPlayer.jsx";
import VideoMetadataPanel from "../features/patchEditor/components/VideoMetadataPanel.jsx";
import SelectionPanel from "../features/patchEditor/components/SelectionPanel.jsx";
import AiEditPanel from "../features/patchEditor/components/AiEditPanel.jsx";
import DubPanel from "../features/patchEditor/components/DubPanel.jsx";
import UpscalePanel from "../features/patchEditor/components/UpscalePanel.jsx";
import PatchList from "../features/patchEditor/components/PatchList.jsx";
import UploadDropzone from "../features/patchEditor/components/UploadDropzone.jsx";
import ProjectPickerPanel from "../features/patchEditor/components/ProjectPickerPanel.jsx";
import { clamp } from "../features/patchEditor/utils/time.js";

const FRAME_STEP = 1 / 30;

function PatchEditorWorkspace() {
  const { state, actions } = usePatchEditor();
  const location = useLocation();
  const hasVideo = state.status === "ready" && state.sourceFile;

  useEffect(() => {
    const incomingAssetUrl = location.state?.assetUrl;
    if (!incomingAssetUrl || state.status !== "empty") return;
    actions.loadSourceFromUrl(incomingAssetUrl, location.state?.assetName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, state.status]);

  useEffect(() => {
    if (!hasVideo) return undefined;

    const handleKeyDown = (event) => {
      const target = event.target;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;

      if (event.code === "Space") {
        event.preventDefault();
        actions.setPlaying(!state.playback.isPlaying);
        return;
      }
      if (event.key === "i" || event.key === "I") {
        if (state.selection) actions.setSelection(state.playback.currentTime, state.selection.outPoint);
        return;
      }
      if (event.key === "o" || event.key === "O") {
        if (state.selection) actions.setSelection(state.selection.inPoint, state.playback.currentTime);
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        const step = (event.shiftKey ? 1 : FRAME_STEP) * (event.key === "ArrowLeft" ? -1 : 1);
        actions.setCurrentTime(clamp(state.playback.currentTime + step, 0, state.duration));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasVideo, state.playback, state.selection, state.duration, actions]);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">
      <section className="creator-section space-y-4" id="editor">
        <div>
          <p className="text-xs font-black uppercase tracking-normal text-purple-200">AI Editor</p>
          <h1 className="mt-1 text-xl font-black text-white sm:text-2xl">Repair a section of an AI-generated video</h1>
          <p className="mt-1 max-w-2xl text-sm font-semibold text-slate-400">
            Cut the broken section, fix it in Kling / Seedance / Veo / your tool of choice, then bring it back in and patch it into place.
          </p>
        </div>

        {!hasVideo ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <UploadDropzone />
            <ProjectPickerPanel />
          </div>
        ) : (
          <section className="creator-panel overflow-hidden p-4 sm:p-5">
            <Toolbar />

            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="min-h-[22rem] overflow-hidden rounded-lg border border-white/10 bg-black">
                {state.viewMode === "patched" ? <PatchedPreviewPlayer /> : <VideoPlayer />}
              </div>
              <aside className="space-y-3">
                <VideoMetadataPanel />
                <SelectionPanel />
                <AiEditPanel />
                <DubPanel />
                <UpscalePanel />
                <PatchList />
              </aside>
            </div>

            <div className="mt-4">
              <Timeline />
            </div>
          </section>
        )}
      </section>
    </div>
  );
}

export default function PatchEditorPage() {
  return (
    <PatchEditorProvider>
      <PatchEditorWorkspace />
    </PatchEditorProvider>
  );
}
