// @ts-nocheck
import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Crown } from "lucide-react";
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
import ComingSoon from "../features/patchEditor/components/ComingSoon.jsx";
import PatchList from "../features/patchEditor/components/PatchList.jsx";
import UploadDropzone from "../features/patchEditor/components/UploadDropzone.jsx";
import ProjectPickerPanel from "../features/patchEditor/components/ProjectPickerPanel.jsx";
import { clamp } from "../features/patchEditor/utils/time.js";
import useCreatorVideoEntitlements from "../hooks/useCreatorVideoEntitlements.js";

const FRAME_STEP = 1 / 30;

function PatchEditorWorkspace() {
  const { state, actions } = usePatchEditor();
  const location = useLocation();
  const hasVideo = state.status === "ready" && state.sourceFile;
  const { entitlements } = useCreatorVideoEntitlements();

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

        {/* The editor itself stays visible and usable up to the point of spending. Blocking the
          * whole page behind FeatureLock meant someone could not load a video, scrub it, or see
          * what the tool does before being asked to pay for it -- which is a poor way to sell
          * anything. The gate lives on the actions that actually cost money (AiEditPanel's
          * generate), where a ProCta shows the crown and routes to the plans page. */}
        {!entitlements.editsEnabled && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-400/25 bg-amber-500/[0.06] px-4 py-3">
            <Crown size={16} className="shrink-0 text-amber-300" />
            <p className="min-w-0 flex-1 text-xs font-semibold text-amber-100">
              Look around freely — loading a video and marking a section are free. Generating the repair is a Pro
              feature.
            </p>
            <Link
              to="/subscription"
              className="creator-primary shrink-0 rounded-md px-3.5 py-2 text-xs font-black text-white"
            >
              See plans
            </Link>
          </div>
        )}
        <>
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
                  {/* Neither is wired to a working backend yet. Shown rather than hidden so the
                      editor reads as complete and the creator can see what is coming. */}
                  <ComingSoon>
                    <AiEditPanel />
                  </ComingSoon>
                  <ComingSoon>
                    <DubPanel />
                  </ComingSoon>
                  {/* Upscaling does work, so it is not hidden behind FeatureLock: the panel and its
                      model list stay visible and the action itself carries the subscribe CTA. */}
                  <UpscalePanel locked={!entitlements.upscalingEnabled} />
                  <PatchList />
                </aside>
              </div>

              <div className="mt-4">
                <Timeline />
              </div>
            </section>
          )}
        </>
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
