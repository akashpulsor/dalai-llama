// @ts-nocheck
import React from "react";
import { Check, Download, RefreshCw, Save, Sparkles } from "lucide-react";
import SceneCard from "./SceneCard.jsx";

export default function StoryboardGrid({
  scenes,
  title,
  durationSeconds,
  readySceneIds,
  imageReadySceneIds,
  imageLoadingKeys = [],
  activeSceneIndex,
  onSelectScene,
  onGenerateImage,
  onExport,
  onSave,
  isSaved,
  onGenerateAgain,
  isGenerating,
  screenType,
  renderWidth,
  renderHeight,
}) {
  const frame = frameSpec(screenType, renderWidth, renderHeight);
  return (
    <section className="creator-panel p-4">
      <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-lg font-bold">5. Storyboard - {title || "She Almost Didn't Go"}</h2>
          <p className="text-sm font-medium text-slate-400">{durationSeconds || 30} Second Short - {scenes?.length || 0} Shots</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ToolbarButton icon={Download} label="Export" onClick={onExport} />
          <ToolbarButton icon={isSaved ? Check : Save} label={isSaved ? "Saved" : "Save"} onClick={onSave} active={isSaved} />
          <button type="button" onClick={onGenerateAgain} disabled={isGenerating} className="creator-primary flex items-center gap-2 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-60">
            <RefreshCw size={15} className={isGenerating ? "animate-spin" : ""} /> Generate Again
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {scenes.map((scene, index) => {
          const sceneId = scene.id || `shot-${scene.shotNumber || index + 1}`;
          const shotNumber = Number(scene.shotNumber || index + 1);
          const imageReady = imageReadySceneIds.includes(sceneId) || hasShotImage(scene);
          const loadingImageKinds = imageLoadingKindsForShot(imageLoadingKeys, shotNumber, sceneId);
          return (
            <SceneCard
              key={sceneId}
              scene={scene}
              index={index}
              frameAspectRatio={scene.renderWidth && scene.renderHeight ? `${scene.renderWidth} / ${scene.renderHeight}` : frame.aspectRatio}
              frameOrientation={scene.screenType || frame.orientation}
              active={activeSceneIndex === index}
              jsonReady={readySceneIds.includes(sceneId)}
              imageReady={imageReady}
              loadingImageKinds={loadingImageKinds}
              onClick={() => onSelectScene?.(index)}
              onGenerateImage={onGenerateImage}
            />
          );
        })}
      </div>
      <div className="mt-4 rounded-lg border border-purple-400/20 bg-purple-500/10 p-4 text-sm font-medium leading-6 text-purple-100">
        <Sparkles size={15} className="mr-2 inline" />
        Tip: Shoot in natural light where possible. Keep phone stable and record in 4K/1080p 60fps for best results.
      </div>
    </section>
  );
}

function imageLoadingKindsForShot(keys = [], shotNumber, sceneId) {
  const prefixes = [`${Number(shotNumber || 1)}:`, `${sceneId}:`];
  return (Array.isArray(keys) ? keys : [])
    .filter((key) => prefixes.some((prefix) => String(key).startsWith(prefix)))
    .map((key) => String(key).split(":").pop())
    .filter(Boolean);
}

function hasShotImage(scene = {}) {
  return Boolean(
    scene.signedUrl
    || scene.signed_url
    || scene.imageUrl
    || scene.image_url
    || scene.storyboardImageUrl
    || scene.storyboard_image_url
    || scene.publicUrl
    || scene.public_url
    || scene.assetUrl
    || scene.asset_url
    || scene.lightingImageUrl
    || scene.lighting_image_url
    || scene.cameraPlanImageUrl
    || scene.camera_plan_image_url
  );
}

function frameSpec(screenType, renderWidth, renderHeight) {
  if (renderWidth && renderHeight) {
    return {
      aspectRatio: `${renderWidth} / ${renderHeight}`,
      orientation: renderWidth > renderHeight ? "horizontal" : "vertical",
    };
  }
  const horizontal = String(screenType || "").toLowerCase().includes("horizontal");
  return {
    aspectRatio: horizontal ? "16 / 9" : "9 / 16",
    orientation: horizontal ? "horizontal" : "vertical",
  };
}

function ToolbarButton({ icon: Icon, label, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`creator-control flex items-center gap-2 px-4 py-2 text-xs font-bold ${active ? "text-emerald-200" : "text-slate-300"}`}
    >
      <Icon size={15} /> {label}
    </button>
  );
}
