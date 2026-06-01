// @ts-nocheck
import React from "react";
import { Check, Download, Loader2, Plus, RefreshCw, Save, Sparkles, Wand2 } from "lucide-react";
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
  onEditShot,
  onInsertShot,
  onExport,
  onSave,
  isSaved,
  onGenerateAgain,
  onGenerateShots,
  canGenerateShots,
  generateShotsBlockedReason,
  canExport,
  exportBlockedReason,
  isExporting,
  shotsGenerated,
  isGeneratingShots,
  isEditingShot,
  isInsertingShot,
  isGenerating,
  screenType,
  renderWidth,
  renderHeight,
}) {
  const frame = frameSpec(screenType, renderWidth, renderHeight);
  const [shotPrompts, setShotPrompts] = React.useState({});
  return (
    <section className="creator-panel p-4">
      <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-lg font-bold">5. Storyboard - {title || "She Almost Didn't Go"}</h2>
          <p className="text-sm font-medium text-slate-400">{durationSeconds || 30} Second Short - {scenes?.length || 0} Shots</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ToolbarButton icon={isSaved ? Check : Save} label={isSaved ? "Production Saved" : "Save Production"} onClick={onSave} active={isSaved} />
          <button
            type="button"
            onClick={onGenerateShots}
            disabled={!canGenerateShots || isGeneratingShots}
            title={!canGenerateShots ? generateShotsBlockedReason : shotsGenerated ? "Generate the full shot image set again" : "Generate storyboard, lighting, and DP image cards"}
            className="creator-primary flex items-center gap-2 px-4 py-2 text-xs font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles size={15} className={isGeneratingShots ? "animate-pulse" : ""} />
            {isGeneratingShots ? "Generating Shots" : shotsGenerated ? "Generate Shots Again" : "Generate Shots"}
          </button>
          <button type="button" onClick={onGenerateAgain} disabled={isGenerating} className="creator-primary flex items-center gap-2 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-60">
            <RefreshCw size={15} className={isGenerating ? "animate-spin" : ""} /> Shot Plans
          </button>
          <ToolbarButton
            icon={Download}
            label={isExporting ? "Opening PDF" : "Export PDF"}
            onClick={onExport}
            disabled={!canExport || isExporting}
            title={!canExport ? exportBlockedReason : "Export a branded DalaiLlama PDF after all shots are generated"}
          />
        </div>
      </div>
      {!canExport && (
        <div className="mb-4 rounded-lg border border-amber-300/20 bg-amber-400/[0.07] px-4 py-3 text-xs font-bold text-amber-100">
          {exportBlockedReason || "Please export after generating all the shots."}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {scenes.map((scene, index) => {
          const sceneId = scene.id || `shot-${scene.shotNumber || index + 1}`;
          const shotNumber = Number(scene.shotNumber || index + 1);
          const imageReady = imageReadySceneIds.includes(sceneId) || hasShotImage(scene);
          const loadingImageKinds = imageLoadingKindsForShot(imageLoadingKeys, shotNumber, sceneId);
          const promptKey = `${shotNumber}:${sceneId}`;
          const active = activeSceneIndex === index;
          return (
            <div key={sceneId} className="space-y-2">
              <SceneCard
                scene={scene}
                index={index}
                frameAspectRatio={scene.renderWidth && scene.renderHeight ? `${scene.renderWidth} / ${scene.renderHeight}` : frame.aspectRatio}
                frameOrientation={scene.screenType || frame.orientation}
                active={active}
                jsonReady={readySceneIds.includes(sceneId) || hasShotJson(scene)}
                imageReady={imageReady}
                loadingImageKinds={loadingImageKinds}
                onClick={() => onSelectScene?.(index)}
                onGenerateImage={onGenerateImage}
              />
              {active && (onEditShot || onInsertShot) && (
                <ShotAiComposer
                  scene={scene}
                  value={shotPrompts[promptKey] || ""}
                  onChange={(value) => setShotPrompts((current) => ({ ...current, [promptKey]: value }))}
                  onEdit={() => onEditShot?.(scene, shotPrompts[promptKey] || "")}
                  onInsert={() => onInsertShot?.(scene, shotPrompts[promptKey] || "")}
                  isEditing={isEditingShot}
                  isInserting={isInsertingShot}
                />
              )}
            </div>
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

function ShotAiComposer({ scene, value, onChange, onEdit, onInsert, isEditing, isInserting }) {
  const shotNumber = Number(scene?.shotNumber || 1);
  const busy = Boolean(isEditing || isInserting);
  const disabled = busy || !String(value || "").trim();
  return (
    <div className="mx-auto w-full max-w-[22rem] rounded-lg border border-white/10 bg-slate-950/80 p-3 shadow-lg shadow-black/25 xl:max-w-none">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-purple-100">AI Shot Brief</p>
        <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-black uppercase tracking-normal text-slate-400">
          Shot {String(shotNumber).padStart(2, "0")}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        rows={3}
        maxLength={1200}
        placeholder="Change background, lighting, framing, action, props, or add a bridge beat..."
        className="custom-scrollbar min-h-20 w-full resize-y rounded-md border border-white/10 bg-black/35 px-3 py-2 text-xs font-semibold leading-5 text-white outline-none transition placeholder:text-slate-600 focus:border-purple-300"
      />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onEdit}
          disabled={disabled}
          className="creator-primary flex h-9 items-center justify-center gap-2 px-3 text-[11px] font-black text-white disabled:cursor-not-allowed disabled:opacity-55"
        >
          {isEditing ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
          Apply Edit
        </button>
        <button
          type="button"
          onClick={onInsert}
          disabled={disabled}
          className="creator-control flex h-9 items-center justify-center gap-2 px-3 text-[11px] font-black text-slate-200 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {isInserting ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          Add After
        </button>
      </div>
    </div>
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

function hasShotJson(scene = {}) {
  return Boolean(
    scene?.storyboardTag
    || scene?.lightingBuildSheetTag
    || scene?.cameraPlanSheetTag
    || scene?.action
    || scene?.description
    || scene?.visualDirection
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

function ToolbarButton({ icon: Icon, label, onClick, active, disabled, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`creator-control flex items-center gap-2 px-4 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-60 ${active ? "text-emerald-200" : "text-slate-300"}`}
    >
      <Icon size={15} /> {label}
    </button>
  );
}
