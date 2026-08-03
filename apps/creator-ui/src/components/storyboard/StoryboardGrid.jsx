// @ts-nocheck
import React from "react";
import { Check, Download, FileDown, Loader2, MonitorPlay, Plus, RefreshCw, Save, Sparkles, Wand2 } from "lucide-react";
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
  onGenerateProductImages,
  onEditShot,
  onInsertShot,
  onExport,
  onPreviewAnimated,
  onDownloadAnimated,
  onSave,
  isSaved,
  onGenerateAgain,
  onGenerateShots,
  onBlockedAction,
  canGenerateShots,
  generateShotsBlockedReason,
  canExport,
  exportBlockedReason,
  isExporting,
  isPreviewingAnimated,
  isExportingAnimated,
  shotsGenerated,
  isGeneratingShots,
  isGeneratingProductImages,
  productMode = false,
  productImageSummary,
  isEditingShot,
  isInsertingShot,
  isGenerating,
  screenType,
  renderWidth,
  renderHeight,
}) {
  const frame = frameSpec(screenType, renderWidth, renderHeight);
  const [shotPrompts, setShotPrompts] = React.useState({});
  const [productImagePrompts, setProductImagePrompts] = React.useState({});
  const runGuarded = (action, blockedReason = "") => {
    if (blockedReason) {
      onBlockedAction?.(blockedReason);
      return;
    }
    action?.();
  };
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
            onClick={() => runGuarded(onGenerateShots, canGenerateShots ? "" : generateShotsBlockedReason || "Save Production before generating shots.")}
            disabled={isGeneratingShots}
            aria-disabled={!canGenerateShots || isGeneratingShots}
            title={!canGenerateShots ? generateShotsBlockedReason : shotsGenerated ? "Generate the full shot image set again" : "Generate storyboard, lighting, and DP image cards"}
            className={`creator-primary flex items-center gap-2 px-4 py-2 text-xs font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              !canGenerateShots ? "opacity-60" : ""
            }`}
          >
            <Sparkles size={15} className={isGeneratingShots ? "animate-pulse" : ""} />
            {isGeneratingShots ? "Generating Shots" : shotsGenerated ? "Generate Shots Again" : "Generate Shots"}
          </button>
          {productMode && (
            <button
              type="button"
              onClick={() => runGuarded(onGenerateProductImages, canGenerateShots ? "" : generateShotsBlockedReason || "Save Production before generating product frames.")}
              disabled={isGeneratingProductImages}
              aria-disabled={!canGenerateShots || isGeneratingProductImages}
              title={!canGenerateShots ? generateShotsBlockedReason : "Generate any missing photoreal product frames"}
              className={`creator-control flex items-center gap-2 px-4 py-2 text-xs font-bold text-purple-100 transition disabled:cursor-not-allowed disabled:opacity-60 ${
                !canGenerateShots ? "opacity-60" : ""
              }`}
            >
              {isGeneratingProductImages ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
              {isGeneratingProductImages
                ? "Generating Product Frames"
                : productImageSummary?.productionReady
                  ? `Product Frames ${productImageSummary.productionReady}/${productImageSummary.expected}`
                  : "Generate Product Frames"}
            </button>
          )}
          <button type="button" onClick={onGenerateAgain} disabled={isGenerating} className="creator-primary flex items-center gap-2 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-60">
            <RefreshCw size={15} className={isGenerating ? "animate-spin" : ""} /> Shot Plans
          </button>
          <ToolbarButton
            icon={Download}
            label={isExporting ? "Opening PDF" : "Export PDF"}
            onClick={onExport}
            disabled={isExporting}
            blockedReason={canExport ? "" : exportBlockedReason || "Generate all shots before exporting the PDF."}
            onBlockedAction={onBlockedAction}
            title={!canExport ? exportBlockedReason : "Export a branded DalaiLlama PDF after all shots are generated"}
          />
          <ToolbarButton
            icon={MonitorPlay}
            label={isPreviewingAnimated ? "Opening Preview" : "Client Preview"}
            onClick={onPreviewAnimated}
            disabled={isPreviewingAnimated}
            blockedReason={scenes?.length ? "" : "Generate storyboard shots before opening the animated client preview."}
            onBlockedAction={onBlockedAction}
            title="Play a GIF-like animated storyboard presentation in a new window"
          />
          <ToolbarButton
            icon={FileDown}
            label={isExportingAnimated ? "Preparing HTML" : "Export HTML"}
            onClick={onDownloadAnimated}
            disabled={isExportingAnimated}
            blockedReason={scenes?.length ? "" : "Generate storyboard shots before exporting animated HTML."}
            onBlockedAction={onBlockedAction}
            title="Download a single animated storyboard HTML presentation"
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
          const effectiveLoadingImageKinds = loadingImageKinds.length
            ? loadingImageKinds
            : isGeneratingShots
              ? ["storyboard"]
              : [];
          const promptKey = `${shotNumber}:${sceneId}`;
          const active = activeSceneIndex === index;
          return (
            <div
              key={sceneId}
              className={`rounded-lg border p-2 transition ${
                active
                  ? "border-purple-300/30 bg-slate-950/55 shadow-lg shadow-purple-950/20"
                  : "border-white/5 bg-white/[0.02]"
              }`}
            >
              <SceneCard
                scene={scene}
                index={index}
                frameAspectRatio={scene.renderWidth && scene.renderHeight ? `${scene.renderWidth} / ${scene.renderHeight}` : frame.aspectRatio}
                frameOrientation={scene.screenType || frame.orientation}
                active={active}
                jsonReady={readySceneIds.includes(sceneId) || hasShotJson(scene)}
                imageReady={imageReady}
                loadingImageKinds={effectiveLoadingImageKinds}
                productMode={productMode}
                onClick={() => onSelectScene?.(index)}
                onGenerateImage={onGenerateImage}
              />
              {active && productMode && (
                <div className="mt-2">
                  <ProductImagePromptComposer
                    scene={scene}
                    value={Object.prototype.hasOwnProperty.call(productImagePrompts, promptKey)
                      ? productImagePrompts[promptKey]
                      : defaultProductImagePrompt(scene)}
                    onChange={(value) => setProductImagePrompts((current) => ({ ...current, [promptKey]: value }))}
                    onGenerate={(prompt) => onGenerateImage?.(scene, "production", { imagePrompt: prompt, productLed: true })}
                    isGenerating={loadingImageKinds.includes("production")}
                    onBlockedAction={onBlockedAction}
                  />
                </div>
              )}
              {active && (onEditShot || onInsertShot) && (
                <div className="mt-2">
                  <ShotAiComposer
                    scene={scene}
                    value={shotPrompts[promptKey] || ""}
                    onChange={(value) => setShotPrompts((current) => ({ ...current, [promptKey]: value }))}
                    onEdit={() => onEditShot?.(scene, shotPrompts[promptKey] || "")}
                    onInsert={() => onInsertShot?.(scene, shotPrompts[promptKey] || "")}
                    isEditing={isEditingShot}
                    isInserting={isInsertingShot}
                    onBlockedAction={onBlockedAction}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 rounded-lg border border-purple-400/20 bg-purple-500/10 p-4 text-sm font-medium leading-6 text-purple-100">
        <Sparkles size={15} className="mr-2 inline" />
        {productMode
          ? "Product workflow: approve the storyboard planning sheets and each photoreal Product Frame before PDF export and Video. Select a shot to change its product-image prompt and regenerate only that frame."
          : "Tip: Storyboard images are sketch previews by design. Generate and approve them before video when you want stronger character, background, and camera consistency across scenes."}
      </div>
    </section>
  );
}

function ProductImagePromptComposer({ scene, value, onChange, onGenerate, isGenerating, onBlockedAction }) {
  const shotNumber = Number(scene?.shotNumber || 1);
  const cleanPrompt = String(value || "").trim();
  const runGenerate = () => {
    if (!cleanPrompt) {
      onBlockedAction?.("Enter a product-image prompt before generating this frame.");
      return;
    }
    onGenerate?.(cleanPrompt);
  };
  return (
    <div className="w-full rounded-lg border border-amber-300/20 bg-amber-400/[0.055] p-3 shadow-lg shadow-black/20">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-100">Product Image Prompt</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-400">Controls the photoreal frame used later as the video shot anchor.</p>
        </div>
        <span className="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-[10px] font-black uppercase tracking-normal text-slate-300">
          Shot {String(shotNumber).padStart(2, "0")}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        rows={4}
        maxLength={12000}
        placeholder="Describe the product framing, surface, lighting, background, camera angle, and exact packaging details to preserve..."
        className="custom-scrollbar min-h-24 w-full resize-y rounded-md border border-white/10 bg-black/35 px-3 py-2 text-xs font-semibold leading-5 text-white outline-none transition placeholder:text-slate-600 focus:border-amber-300"
      />
      <button
        type="button"
        onClick={runGenerate}
        disabled={isGenerating}
        aria-disabled={isGenerating || !cleanPrompt}
        className={`creator-primary mt-2 flex h-9 w-full items-center justify-center gap-2 px-3 text-[11px] font-black text-white disabled:cursor-not-allowed disabled:opacity-55 ${
          !cleanPrompt ? "opacity-55" : ""
        }`}
      >
        {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
        {sceneHasProductImage(scene) ? "Regenerate Product Frame" : "Generate Product Frame"}
      </button>
    </div>
  );
}

function defaultProductImagePrompt(scene = {}) {
  return [
    scene.productImagePrompt,
    scene.productionImagePrompt,
    scene.rawShot?.productImagePrompt,
    scene.rawShot?.productionImagePrompt,
    scene.imagePrompt,
    scene.storyboardImagePrompt,
    scene.visualPrompt,
    scene.sketchPrompt,
    scene.visualDirection,
    scene.description,
    scene.action,
  ].find((value) => typeof value === "string" && value.trim()) || "";
}

function sceneHasProductImage(scene = {}) {
  return Boolean(
    scene.productionImageUrl
    || scene.production_image_url
    || scene.generatedProductImageUrl
    || scene.generated_product_image_url
    || scene.imageAnchorUrl
    || scene.image_anchor_url
    || scene.productionImage?.signedUrl
    || scene.productionImage?.publicUrl
    || scene.productionImage?.assetUrl
  );
}

function ShotAiComposer({ scene, value, onChange, onEdit, onInsert, isEditing, isInserting, onBlockedAction }) {
  const shotNumber = Number(scene?.shotNumber || 1);
  const busy = Boolean(isEditing || isInserting);
  const briefMissing = !String(value || "").trim();
  const runGuarded = (action) => {
    if (briefMissing) {
      onBlockedAction?.("Enter an AI shot brief before applying or inserting a shot.");
      return;
    }
    action?.();
  };
  return (
    <div className="w-full rounded-lg border border-purple-300/20 bg-slate-950/85 p-3 shadow-lg shadow-black/25">
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
        placeholder="Change background, lighting, framing, action, props, add slow motion, apply a black-and-white grade, or add a bridge beat..."
        className="custom-scrollbar min-h-20 w-full resize-y rounded-md border border-white/10 bg-black/35 px-3 py-2 text-xs font-semibold leading-5 text-white outline-none transition placeholder:text-slate-600 focus:border-purple-300"
      />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => runGuarded(onEdit)}
          disabled={busy}
          aria-disabled={busy || briefMissing}
          className={`creator-primary flex h-9 items-center justify-center gap-2 px-3 text-[11px] font-black text-white disabled:cursor-not-allowed disabled:opacity-55 ${
            briefMissing ? "opacity-55" : ""
          }`}
        >
          {isEditing ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
          Apply Edit
        </button>
        <button
          type="button"
          onClick={() => runGuarded(onInsert)}
          disabled={busy}
          aria-disabled={busy || briefMissing}
          className={`creator-control flex h-9 items-center justify-center gap-2 px-3 text-[11px] font-black text-slate-200 disabled:cursor-not-allowed disabled:opacity-55 ${
            briefMissing ? "opacity-55" : ""
          }`}
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
    || scene.lightImageUrl
    || scene.light_image_url
    || scene.cameraPlanImageUrl
    || scene.camera_plan_image_url
    || scene.dpImageUrl
    || scene.dp_image_url
    || scene.cameraImageUrl
    || scene.camera_image_url
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

function ToolbarButton({ icon: Icon, label, onClick, active, disabled, blockedReason, onBlockedAction, title }) {
  return (
    <button
      type="button"
      onClick={() => {
        if (blockedReason) {
          onBlockedAction?.(blockedReason);
          return;
        }
        onClick?.();
      }}
      disabled={disabled}
      aria-disabled={disabled || Boolean(blockedReason)}
      title={title}
      className={`creator-control flex items-center gap-2 px-4 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-60 ${
        blockedReason ? "opacity-60" : ""
      } ${active ? "text-emerald-200" : "text-slate-300"}`}
    >
      <Icon size={15} /> {label}
    </button>
  );
}
