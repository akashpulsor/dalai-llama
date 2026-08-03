// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { Camera, Image as ImageIcon, Info, Lightbulb, Loader2, Maximize2, Sparkles, Wand2, X, ZoomIn, ZoomOut } from "lucide-react";

export default function SceneCard({
  scene,
  index,
  active,
  jsonReady,
  imageReady,
  frameAspectRatio = "9 / 16",
  frameOrientation = "vertical",
  loadingImageKinds = [],
  productMode = false,
  onClick,
  onGenerateImage,
}) {
  const [selectedAssetKind, setSelectedAssetKind] = useState("storyboard");
  const [failedAssetKeys, setFailedAssetKeys] = useState({});
  const [assetLoadState, setAssetLoadState] = useState({});
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const shot = normalizeShot(scene, index);
  const isTextCard = scene.type === "text";
  const fallbackSceneImage = `/mocks/creator/story-scene-${String(index + 1).padStart(2, "0")}.png`;
  const loadingKindSet = useMemo(() => new Set((Array.isArray(loadingImageKinds) ? loadingImageKinds : []).map(normalizeImageAssetKind)), [loadingImageKinds]);
  const storyboardImageUrl = sceneImageUrl(scene, "storyboard");
  const lightingImageUrl = sceneImageUrl(scene, "lighting");
  const cameraPlanImageUrl = sceneImageUrl(scene, "dp");
  const productionImageUrl = sceneImageUrl(scene, "production");
  const hasRealShotImage = Boolean(storyboardImageUrl || lightingImageUrl || cameraPlanImageUrl || productionImageUrl);
  const assetSlots = [
    {
      kind: "storyboard",
      title: "Storyboard",
      icon: ImageIcon,
      src: storyboardImageUrl || (!hasRealShotImage && imageReady ? fallbackSceneImage : ""),
      isFallback: !storyboardImageUrl && !hasRealShotImage && imageReady,
      isGenerating: loadingKindSet.has("storyboard"),
    },
    { kind: "lighting", title: "Lighting", icon: Lightbulb, src: lightingImageUrl, isGenerating: loadingKindSet.has("lighting") },
    { kind: "dp", title: "DP Plan", icon: Camera, src: cameraPlanImageUrl, isGenerating: loadingKindSet.has("dp") },
    ...(productMode ? [{
      kind: "production",
      title: "Product Frame",
      icon: Sparkles,
      src: productionImageUrl,
      isGenerating: loadingKindSet.has("production"),
    }] : []),
  ];
  const generatingAsset = assetSlots.find((asset) => asset.isGenerating);
  const imageAssets = assetSlots.filter((asset) => asset.src);
  const selectedAsset = imageAssets.find((asset) => asset.kind === selectedAssetKind) || imageAssets[0];
  const selectedAssetKey = selectedAsset ? `${selectedAsset.kind}:${selectedAsset.src}` : "";
  const shouldUseAsset = Boolean(selectedAsset?.src) && !failedAssetKeys[selectedAssetKey];
  const selectedAssetLoading = shouldUseAsset && assetLoadState[selectedAssetKey] !== "loaded";
  const hasImageAsset = Boolean(selectedAsset?.src);
  const showCreativeLoader = Boolean(generatingAsset) || selectedAssetLoading;
  const minHeight = frameOrientation === "horizontal" ? "20rem" : "30rem";
  const maxWidth = frameOrientation === "horizontal" ? "100%" : "22rem";

  useEffect(() => {
    if (!shouldUseAsset || !selectedAssetKey) return;
    setAssetLoadState((current) => current[selectedAssetKey] ? current : { ...current, [selectedAssetKey]: "loading" });
  }, [selectedAssetKey, shouldUseAsset]);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.(event);
        }
      }}
      style={{ aspectRatio: frameAspectRatio, minHeight, maxWidth }}
      className={`relative mx-auto block w-full overflow-visible rounded-lg border bg-[#080d16] text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 ${
        active ? "border-purple-300 shadow-[0_0_0_1px_rgba(168,85,247,0.35)]" : "border-white/10 hover:border-purple-300/45"
      }`}
    >
      <div className="absolute inset-0 overflow-hidden rounded-lg bg-black">
        {!hasImageAsset && !imageReady && !generatingAsset ? (
          <div className="h-full w-full animate-pulse bg-gradient-to-br from-slate-800 via-slate-700 to-slate-950" />
        ) : shouldUseAsset ? (
          <>
            <img
              src={selectedAsset.src}
              alt=""
              className="h-full w-full bg-black object-contain"
              loading="lazy"
              onLoad={() => setAssetLoadState((current) => ({ ...current, [selectedAssetKey]: "loaded" }))}
              onError={() => {
                setAssetLoadState((current) => ({ ...current, [selectedAssetKey]: "failed" }));
                setFailedAssetKeys((current) => ({ ...current, [selectedAssetKey]: true }));
              }}
            />
            {showCreativeLoader && (
              <CreativeImageLoader
                label={generatingAsset ? `Rendering ${generatingAsset.title}` : `Loading ${selectedAsset.title}`}
                detail={generatingAsset ? "Composing storyboard sheet" : "Opening generated image"}
              />
            )}
          </>
        ) : isTextCard ? (
          <div className="flex h-full w-full items-center justify-center bg-[#0B1020] p-8 text-center text-2xl font-black leading-9 text-white">
            "Just one decision... to show up."
          </div>
        ) : generatingAsset ? (
          <CreativeImageLoader label={`Rendering ${generatingAsset.title}`} detail="Building the technical frame" />
        ) : (
          <div className="scene-sketch h-full w-full" />
        )}
      </div>

      {shot.overlayPlan?.enabled !== false && shot.overlayPlan?.text && (
        <div className={`pointer-events-none absolute inset-x-[8%] z-10 flex ${
          String(shot.overlayPlan.position || "").toLowerCase().includes("upper") ? "top-[12%]" : "bottom-[15%]"
        } ${
          String(shot.overlayPlan.position || "").toLowerCase().includes("left")
            ? "justify-start text-left"
            : String(shot.overlayPlan.position || "").toLowerCase().includes("right")
              ? "justify-end text-right"
              : "justify-center text-center"
        }`}>
          <div className="max-w-[88%]">
            <p
              className="leading-[1.02] tracking-[-0.035em] text-white [text-shadow:0_3px_16px_rgba(0,0,0,.85)]"
              style={{
                fontFamily: `${shot.overlayPlan.fontFamily || "Montserrat"}, sans-serif`,
                fontWeight: shot.overlayPlan.fontWeight || 800,
                fontSize: `clamp(1.25rem, 3.2vw, ${Math.min(72, Number(shot.overlayPlan.fontSizePx) || 52)}px)`,
              }}
            >
              {shot.overlayPlan.text}
            </p>
            <span className="mt-2 inline-flex rounded-full border border-white/15 bg-black/65 px-2 py-1 text-[9px] font-black uppercase tracking-normal text-slate-200 backdrop-blur">
              {shot.overlayPlan.entrance || "Fade"} / {shot.overlayPlan.speed || "Measured"}
            </span>
          </div>
        </div>
      )}

      <div className="absolute right-2 top-2 z-20 flex items-center gap-1.5">
        <button
          type="button"
          title="Open shot details"
          onClick={(event) => {
            event.stopPropagation();
            setDetailsOpen((open) => !open);
          }}
          className="flex h-8 items-center gap-1.5 rounded-md border border-white/15 bg-slate-950 px-2 text-[11px] font-black uppercase tracking-normal text-white shadow-lg shadow-black/35 transition hover:border-purple-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-200"
        >
          <Info size={13} />
          Details
        </button>
        <button
          type="button"
          title="Open image zoom"
          aria-label="Open image zoom"
          disabled={!shouldUseAsset}
          onClick={(event) => {
            event.stopPropagation();
            setZoomLevel(1);
            setZoomOpen(true);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-white/15 bg-slate-950 text-white shadow-lg shadow-black/35 transition hover:border-purple-200 disabled:cursor-not-allowed disabled:opacity-45 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-200"
        >
          <Maximize2 size={14} />
        </button>
      </div>

      {detailsOpen && (
        <ShotDetailsPanel
          shot={shot}
          scene={scene}
          jsonReady={jsonReady}
          imageReady={imageReady}
          assetSlots={assetSlots}
          selectedAsset={selectedAsset}
          storyboardImageUrl={storyboardImageUrl}
          onClose={(event) => {
            event.stopPropagation();
            setDetailsOpen(false);
          }}
          onSelectAsset={(asset, event) => {
            event?.stopPropagation();
            if (asset?.src) setSelectedAssetKind(asset.kind);
          }}
          onPreviewAssetKind={setSelectedAssetKind}
          onGenerateImage={onGenerateImage}
        />
      )}

      {zoomOpen && selectedAsset?.src && (
        <ImageZoomModal
          asset={selectedAsset}
          assets={imageAssets}
          frameOrientation={frameOrientation}
          zoomLevel={zoomLevel}
          onZoomChange={setZoomLevel}
          onSelectAsset={(asset) => setSelectedAssetKind(asset.kind)}
          onClose={() => setZoomOpen(false)}
        />
      )}
    </article>
  );
}

function ShotDetailsPanel({
  shot,
  scene,
  jsonReady,
  imageReady,
  assetSlots,
  selectedAsset,
  storyboardImageUrl,
  onClose,
  onSelectAsset,
  onPreviewAssetKind,
  onGenerateImage,
}) {
  const availableAsset = selectedAsset || assetSlots.find((asset) => asset.src) || assetSlots[0];

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose(event);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[110] bg-black/45 text-white" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Shot ${shot.number} details`}
        onClick={(event) => event.stopPropagation()}
        className="absolute bottom-3 right-3 top-3 flex w-[min(31rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-lg border border-white/10 bg-[#0a0f1a] shadow-2xl shadow-black/70"
      >
        <header className="shrink-0 border-b border-white/10 bg-slate-950/95 px-3.5 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-purple-300/30 bg-purple-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-normal text-purple-100">
                  Shot {String(shot.number).padStart(2, "0")}
                </span>
                <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-black uppercase tracking-normal text-slate-300">
                  {shot.timeRange}
                </span>
                {shot.difficulty && (
                  <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-black uppercase tracking-normal text-slate-300">
                    {shot.difficulty}
                  </span>
                )}
              </div>
              <h3 className="mt-2 line-clamp-2 text-base font-black leading-6 text-white">{shot.title}</h3>
              <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-400">{shot.purpose}</p>
            </div>
            <button
              type="button"
              title="Close details"
              aria-label="Close details"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-slate-200 transition hover:border-purple-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-200"
            >
              <X size={15} />
            </button>
          </div>
        </header>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-3 p-3.5">
            <section className="rounded-lg border border-white/10 bg-black/22 p-3">
              <AssetPreview asset={availableAsset} />

              <div className={`mt-2 grid gap-1.5 ${assetSlots.length > 3 ? "grid-cols-2" : "grid-cols-3"}`}>
                {assetSlots.map((asset) => (
                  <AssetStripButton
                    key={asset.kind}
                    asset={asset}
                    selected={asset.kind === availableAsset?.kind}
                    onSelect={(event) => onSelectAsset(asset, event)}
                    onGenerateImage={onGenerateImage ? (event) => {
                      event.stopPropagation();
                      onPreviewAssetKind?.(asset.kind);
                      onGenerateImage(scene, asset.kind);
                    } : null}
                  />
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <QuickMetric label="Storyboard" value={storyboardImageUrl ? "Ready" : imageReady ? "Mock" : "Pending"} />
                <QuickMetric label="Lighting" value={sceneImageUrl(scene, "lighting") ? "Ready" : "Pending"} />
                <QuickMetric label="DP" value={sceneImageUrl(scene, "dp") ? "Ready" : "Pending"} />
                {assetSlots.some((asset) => asset.kind === "production") && (
                  <QuickMetric label="Product" value={sceneImageUrl(scene, "production") ? "Ready" : "Pending"} />
                )}
                <QuickMetric label="Duration" value={`${shot.durationSeconds}s`} />
              </div>
            </section>

            <section>
              {!jsonReady ? (
                <div className="space-y-2 rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <div className="h-3 w-5/6 animate-pulse rounded bg-white/10" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-white/10" />
                </div>
              ) : (
                <div className="space-y-3">
                  <DetailSection title="Shot Direction">
                    <DetailTextBlock label="Action" value={shot.action} prominent />
                    <DetailGrid
                      items={[
                        ["Composition", shot.composition],
                        ["Intent", shot.retentionGoal],
                        ["Direction", shot.creatorDirection],
                      ]}
                    />
                  </DetailSection>

                  <DetailSection title="Performance">
                    <DetailGrid
                      items={[
                        ["Expression", shot.expression],
                        ["Emotion", shot.emotion],
                        ["Body Language", shot.bodyLanguage],
                        ["Dialogue / VO", shot.dialogue],
                        ["Text Overlay", shot.textOverlay],
                        ["Overlay Font", shot.overlayFont],
                        ["Overlay Motion", shot.overlayMotion],
                        ["Overlay Position", shot.overlayPosition],
                        ["Overlay Rationale", shot.overlayRationale],
                      ]}
                    />
                  </DetailSection>

                  <DetailSection title="Camera And Frame">
                    <DetailGrid
                      items={[
                        ["Shot Type", shot.shotType],
                        ["Camera Angle", shot.cameraAngle],
                        ["Movement", shot.cameraMovement],
                        ["Gimbal", shot.gimbalSettings],
                        ["Lens Suggestion", shot.lensSuggestion],
                        ["FPS", shot.fps],
                        ["Visual Treatment", shot.visualTreatment],
                      ]}
                    />
                  </DetailSection>

                  <details className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                    <summary className="cursor-pointer text-xs font-black uppercase tracking-normal text-slate-300">More setup notes</summary>
                    <div className="mt-3">
                      <DetailGrid
                        items={[
                          ["Lighting", shot.lighting],
                          ["Environment", shot.environment],
                          ["Voice Over", shot.voiceOver],
                          ["Sound Design", shot.soundDesign],
                          ["Editing Notes", shot.editingNotes],
                          ["Safe Zone", shot.safeZoneNotes],
                          ["Mobile Focus", shot.mobileFocusArea],
                          ["Subtitle Position", shot.subtitlePosition],
                          ["Transition", shot.transition],
                          ["Capture Mode", shot.captureMode],
                          ["Playback Speed", shot.playbackSpeed],
                          ["Camera Style", shot.cameraStyle],
                          ["Stabilization", shot.stabilization],
                          ["Zoom", shot.zoomRecommendation],
                          ["Rookie Guide", shot.rookieGuide],
                          ["Execution", compactLines([shot.executionLevel, shot.executionScore && `Score ${shot.executionScore}`])],
                          ["Tripod", shot.requiresTripod],
                          ["Helper", shot.requiresHelper],
                          ["Phone Friendly", shot.phoneFriendly],
                        ]}
                      />
                    </div>
                  </details>

                  <details className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                    <summary className="cursor-pointer text-xs font-black uppercase tracking-normal text-slate-400">Raw tags</summary>
                    <pre className="custom-scrollbar mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words text-[11px] font-semibold leading-5 text-slate-300">
{JSON.stringify({
  storyboardTag: scene.storyboardTag || {},
  lightingBuildSheetTag: scene.lightingBuildSheetTag || {},
  cameraPlanSheetTag: scene.cameraPlanSheetTag || {},
}, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </section>
          </div>
        </div>
      </aside>
    </div>
  );
}

function AssetPreview({ asset }) {
  const Icon = asset?.icon || ImageIcon;
  if (asset?.isGenerating) {
    return (
      <div className="h-44 overflow-hidden rounded-lg border border-white/10 bg-black/45">
        <CreativeImageLoader compact label="Rendering" detail={asset.title} />
      </div>
    );
  }
  if (asset?.src) {
    return (
      <div className="h-44 overflow-hidden rounded-lg border border-white/10 bg-black">
        <img src={asset.src} alt="" className="h-full w-full object-contain" loading="lazy" />
      </div>
    );
  }
  return (
    <div className="flex h-36 flex-col items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.035] p-4 text-center">
      <Icon size={22} className="text-slate-500" />
      <p className="mt-2 text-[11px] font-black uppercase tracking-normal text-slate-400">{asset?.title || "Image"} pending</p>
    </div>
  );
}

function AssetStripButton({ asset, selected, onSelect, onGenerateImage }) {
  const Icon = asset.icon;
  const hasImage = Boolean(asset.src);
  const isGenerating = Boolean(asset.isGenerating);
  return (
    <div className={`min-w-0 rounded-md border p-1.5 ${selected ? "border-purple-300 bg-purple-400/10" : "border-white/10 bg-white/[0.035]"}`}>
      <button
        type="button"
        disabled={!hasImage || isGenerating}
        onClick={onSelect}
        className="flex w-full min-w-0 items-center gap-1.5 text-left disabled:cursor-not-allowed"
      >
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${selected ? "bg-purple-400/15 text-purple-100" : "bg-black/35 text-slate-300"}`}>
          {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Icon size={13} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[10px] font-black uppercase tracking-normal text-white">{asset.title}</span>
          <span className="block truncate text-[9px] font-bold uppercase tracking-normal text-slate-500">
            {isGenerating ? "Rendering" : hasImage ? "Image ready" : "Pending"}
          </span>
        </span>
      </button>
      {onGenerateImage && (
        <button
          type="button"
          disabled={isGenerating}
          onClick={onGenerateImage}
          className="mt-1.5 flex h-7 w-full items-center justify-center gap-1 rounded-md border border-white/10 text-[9px] font-black uppercase tracking-normal text-purple-100 transition hover:border-purple-200 hover:bg-purple-500/10 disabled:cursor-wait disabled:opacity-70"
        >
          {isGenerating ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />}
          {hasImage && !asset.isFallback ? "Redo" : "Render"}
        </button>
      )}
    </div>
  );
}

function QuickMetric({ label, value }) {
  const text = toText(value);
  if (!text) return null;
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.035] px-2 py-1">
      <span className="text-[9px] font-black uppercase tracking-normal text-slate-500">{label}</span>
      <span className="ml-1.5 text-[10px] font-black uppercase tracking-normal text-white">{text}</span>
    </div>
  );
}

function DetailSection({ title, children }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.025] px-3 py-3">
      <h4 className="text-[10px] font-black uppercase tracking-[0.16em] text-purple-100">{title}</h4>
      <div className="mt-2.5 space-y-2.5">{children}</div>
    </section>
  );
}

function DetailGrid({ items = [] }) {
  const visibleItems = items
    .map(([label, value]) => [label, toText(value)])
    .filter(([, value]) => value);
  if (!visibleItems.length) return null;
  return (
    <div className="space-y-2">
      {visibleItems.map(([label, value]) => (
        <DetailTextBlock key={label} label={label} value={value} />
      ))}
    </div>
  );
}

function DetailTextBlock({ label, value, prominent }) {
  const text = toText(value);
  if (!text) return null;
  return (
    <div className={prominent ? "rounded-md border border-purple-300/20 bg-purple-400/10 px-3 py-2.5" : ""}>
      <p className="text-[10px] font-black uppercase tracking-normal text-slate-500">{label}</p>
      <p className={`${prominent ? "text-sm leading-6 text-white" : "text-xs leading-5 text-slate-200"} mt-1 whitespace-pre-line font-semibold`}>
        {text}
      </p>
    </div>
  );
}

function ImageZoomModal({ asset, assets, frameOrientation, zoomLevel, onZoomChange, onSelectAsset, onClose }) {
  const baseWidthRem = frameOrientation === "horizontal" ? 68 : 34;
  const imageWidth = `${Math.round(baseWidthRem * zoomLevel)}rem`;
  const controlClass = "flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-slate-200 transition hover:border-purple-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-200";

  return (
    <div className="fixed inset-0 z-[120] bg-black/95 text-white" onClick={onClose}>
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-slate-950 px-4 py-3" onClick={(event) => event.stopPropagation()}>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Image Preview</p>
          <h4 className="line-clamp-1 text-sm font-black text-white">{asset.title}</h4>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" title="Zoom out" aria-label="Zoom out" onClick={() => onZoomChange(Math.max(0.75, Number((zoomLevel - 0.25).toFixed(2))))} className={controlClass}>
            <ZoomOut size={15} />
          </button>
          <span className="min-w-12 text-center text-xs font-black text-slate-300">{Math.round(zoomLevel * 100)}%</span>
          <button type="button" title="Zoom in" aria-label="Zoom in" onClick={() => onZoomChange(Math.min(3, Number((zoomLevel + 0.25).toFixed(2))))} className={controlClass}>
            <ZoomIn size={15} />
          </button>
          <button type="button" onClick={() => onZoomChange(1)} className="hidden rounded-md border border-white/10 px-3 py-2 text-xs font-black uppercase tracking-normal text-slate-200 transition hover:border-purple-200 sm:block">
            Reset
          </button>
          <button type="button" title="Close preview" aria-label="Close preview" onClick={onClose} className={controlClass}>
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="custom-scrollbar absolute inset-x-0 bottom-20 top-16 overflow-auto p-4" onClick={(event) => event.stopPropagation()}>
        <div className="flex min-h-full items-start justify-center">
          <img
            src={asset.src}
            alt=""
            className="max-w-none rounded-lg bg-black object-contain shadow-2xl shadow-black/60"
            style={{ width: imageWidth }}
          />
        </div>
      </div>

      {assets.filter((item) => !item.isFallback).length > 1 && (
        <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-2 border-t border-white/10 bg-slate-950 px-4 py-3" onClick={(event) => event.stopPropagation()}>
          {assets.filter((item) => !item.isFallback).map((item) => (
            <button
              type="button"
              key={item.kind}
              title={`Show ${item.title}`}
              onClick={() => {
                onSelectAsset(item);
                onZoomChange(1);
              }}
              className={`h-14 w-14 overflow-hidden rounded-md border bg-black transition hover:border-purple-200 ${item.kind === asset.kind ? "border-purple-300" : "border-white/15"}`}
            >
              <img src={item.src} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CreativeImageLoader({ label = "Loading Image", detail = "Preparing frame", compact = false }) {
  const steps = compact
    ? ["Prompt", "Light", "Frame"]
    : ["Reading shot plan", "Composing frame", "Rendering image"];
  return (
    <div className={`${compact ? "relative h-full w-full" : "absolute inset-0 z-10"} flex items-center justify-center overflow-hidden bg-black/90 px-4 text-center`}>
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:30px_30px]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-200/70 to-transparent" />
      <div className={`relative w-full ${compact ? "max-w-[13rem] p-3" : "max-w-[17rem] p-4"} overflow-hidden rounded-lg border border-white/10 bg-[#070b12]/95 shadow-2xl shadow-black/55`}>
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/[0.08] to-transparent" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-purple-200/25 bg-purple-300/10 text-purple-100">
            <Sparkles size={16} />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-[11px] font-black uppercase tracking-[0.14em] text-white">{label}</p>
            <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-normal text-slate-400">{detail}</p>
          </div>
          <Loader2 size={17} className="shrink-0 animate-spin text-purple-100" />
        </div>
        <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-purple-200 via-white to-purple-200" />
        </div>
        <div className="relative mt-4 space-y-2">
          {steps.map((step, stepIndex) => (
            <div key={step} className="flex items-center gap-2 text-left">
              <span className={`h-1.5 w-1.5 rounded-full ${stepIndex === 2 ? "animate-pulse bg-purple-200" : "bg-white/35"}`} />
              <span className="shrink-0 text-[10px] font-black uppercase tracking-normal text-slate-300">{step}</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function sceneImageUrl(scene = {}, kind = "storyboard") {
  const normalizedKind = normalizeImageAssetKind(kind);
  const assets = collectSceneImageAssets(scene);
  if (normalizedKind === "production") {
    return firstTextValue(
      scene.productionImageUrl,
      scene.production_image_url,
      scene.generatedProductImageUrl,
      scene.generated_product_image_url,
      scene.imageAnchorUrl,
      scene.image_anchor_url,
      imageUrlFromObject(scene.productionImage),
      imageUrlFromObject(scene.production_image),
      imageUrlFromObject(scene.productionAsset),
      imageUrlFromObject(scene.production_asset),
      imageUrlFromObject(scene.generatedProductImage),
      imageUrlFromObject(scene.generated_product_image),
      imageUrlByKind(assets, "production")
    );
  }
  if (normalizedKind === "lighting") {
    return firstTextValue(
      scene.lightingImageUrl,
      scene.lighting_image_url,
      scene.lightImageUrl,
      scene.light_image_url,
      imageUrlFromObject(scene.lightingImage),
      imageUrlFromObject(scene.lighting_image),
      imageUrlFromObject(scene.lightingAsset),
      imageUrlFromObject(scene.lighting_asset),
      imageUrlByKind(assets, "lighting")
    );
  }
  if (normalizedKind === "dp") {
    return firstTextValue(
      scene.cameraPlanImageUrl,
      scene.camera_plan_image_url,
      scene.dpImageUrl,
      scene.dp_image_url,
      scene.cameraImageUrl,
      scene.camera_image_url,
      imageUrlFromObject(scene.cameraPlanImage),
      imageUrlFromObject(scene.camera_plan_image),
      imageUrlFromObject(scene.cameraPlanAsset),
      imageUrlFromObject(scene.camera_plan_asset),
      imageUrlFromObject(scene.dpImage),
      imageUrlFromObject(scene.dp_image),
      imageUrlFromObject(scene.dpAsset),
      imageUrlFromObject(scene.dp_asset),
      imageUrlByKind(assets, "dp")
    );
  }
  return firstTextValue(
    scene.signedUrl,
    scene.signed_url,
    scene.presignedUrl,
    scene.presigned_url,
    scene.imageUrl,
    scene.image_url,
    scene.storyboardImageUrl,
    scene.storyboard_image_url,
    scene.publicUrl,
    scene.public_url,
    scene.assetUrl,
    scene.asset_url,
    imageUrlFromObject(scene.storyboardImage),
    imageUrlFromObject(scene.storyboard_image),
    imageUrlFromObject(scene.storyboardAsset),
    imageUrlFromObject(scene.storyboard_asset),
    imageUrlByKind(assets, "storyboard")
  );
}

function collectSceneImageAssets(scene = {}) {
  if (!scene || typeof scene !== "object") return [];
  return [
    scene.image,
    scene.asset,
    ...(Array.isArray(scene.images) ? scene.images : []),
    ...(Array.isArray(scene.assets) ? scene.assets : []),
    ...(Array.isArray(scene.imageAssets) ? scene.imageAssets : []),
    ...(Array.isArray(scene.image_assets) ? scene.image_assets : []),
    ...(Array.isArray(scene.shotImages) ? scene.shotImages : []),
    ...(Array.isArray(scene.shot_images) ? scene.shot_images : []),
    ...(Array.isArray(scene.storyboardImages) ? scene.storyboardImages : []),
    ...(Array.isArray(scene.storyboard_images) ? scene.storyboard_images : []),
    ...(Array.isArray(scene.lightingImages) ? scene.lightingImages : []),
    ...(Array.isArray(scene.lighting_images) ? scene.lighting_images : []),
    ...(Array.isArray(scene.cameraPlanImages) ? scene.cameraPlanImages : []),
    ...(Array.isArray(scene.camera_plan_images) ? scene.camera_plan_images : []),
    ...(Array.isArray(scene.dpImages) ? scene.dpImages : []),
    ...(Array.isArray(scene.dp_images) ? scene.dp_images : []),
    ...(Array.isArray(scene.productionImages) ? scene.productionImages : []),
    ...(Array.isArray(scene.production_images) ? scene.production_images : []),
    ...(Array.isArray(scene.productImages) ? scene.productImages : []),
    ...(Array.isArray(scene.product_images) ? scene.product_images : []),
    ...(Array.isArray(scene.generatedProductImageAssets) ? scene.generatedProductImageAssets : []),
    ...(Array.isArray(scene.generated_product_image_assets) ? scene.generated_product_image_assets : []),
  ].filter((item) => item && typeof item === "object");
}

function imageUrlByKind(assets = [], targetKind = "storyboard") {
  const normalizedTarget = normalizeImageAssetKind(targetKind);
  const match = assets.find((asset) => {
    const kind = normalizeImageAssetKind(asset.imageKind || asset.image_kind || asset.kind || asset.assetKind || asset.asset_kind || asset.imageType || asset.image_type || asset.type || asset.role || asset.objectKey || asset.object_key || imageUrlFromObject(asset));
    return kind === normalizedTarget;
  });
  return imageUrlFromObject(match);
}

function imageUrlFromObject(value = {}) {
  if (!value || typeof value !== "object") return "";
  return firstTextValue(
    value.signedUrl,
    value.signed_url,
    value.presignedUrl,
    value.presigned_url,
    value.imageUrl,
    value.image_url,
    value.storyboardImageUrl,
    value.storyboard_image_url,
    value.publicUrl,
    value.public_url,
    value.assetUrl,
    value.asset_url,
    value.downloadUrl,
    value.download_url,
    value.url,
    value.href,
    value.location,
    value.src,
    value.path,
    value.asset?.signedUrl,
    value.asset?.signed_url,
    value.asset?.publicUrl,
    value.asset?.public_url,
    value.asset?.url,
    value.image?.signedUrl,
    value.image?.signed_url,
    value.image?.publicUrl,
    value.image?.public_url,
    value.image?.url,
    value.file?.signedUrl,
    value.file?.signed_url,
    value.file?.url,
    value.media?.signedUrl,
    value.media?.signed_url,
    value.media?.url,
    value.result?.signedUrl,
    value.result?.signed_url,
    value.result?.imageUrl,
    value.result?.image_url,
    value.result?.publicUrl,
    value.result?.public_url,
    value.result?.url,
    value.data?.signedUrl,
    value.data?.signed_url,
    value.data?.imageUrl,
    value.data?.image_url,
    value.data?.publicUrl,
    value.data?.public_url,
    value.data?.url
  );
}

function normalizeImageAssetKind(value = "") {
  const text = String(value || "").toLowerCase();
  if (text.includes("production") || text.includes("product") || text.includes("video_anchor") || text.includes("image_anchor")) return "production";
  if (text.includes("light")) return "lighting";
  if (text.includes("camera") || text.includes("dp") || text.includes("director_photography")) return "dp";
  return "storyboard";
}

function firstTextValue(...values) {
  return values.find((value) => typeof value === "string" && value.trim()) || "";
}

function BriefSection({ label, value, featured, compact }) {
  const text = toText(value);
  if (!text) return null;
  return (
    <div className={`${featured ? "border-purple-400/25 bg-purple-500/10" : "border-white/10 bg-white/[0.045]"} rounded-xl border px-3 py-3`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className={`${featured ? "text-sm text-white" : compact ? "text-xs text-slate-300" : "text-xs text-slate-200"} mt-2 whitespace-pre-line font-semibold leading-5`}>
        {text}
      </p>
    </div>
  );
}

function SpecPanel({ title, children }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.045] px-3 py-3">
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function SpecRow({ label, value }) {
  const text = toText(value);
  if (!text) return null;
  return (
    <div className="flex min-w-0 items-start justify-between gap-3 text-xs">
      <span className="shrink-0 font-bold text-slate-500">{label}</span>
      <span className="min-w-0 whitespace-pre-line break-words text-right font-semibold leading-5 text-slate-200">{text}</span>
    </div>
  );
}

function normalizeShot(scene, index) {
  const rawShot = scene.rawShot || {};
  const cinematic = scene.cinematicExecution || rawShot.cinematicExecution || {};
  const treatment = scene.visualTreatment || rawShot.visualTreatment || {};
  const difficulty = scene.executionDifficulty || {};
  const rookie = scene.rookieFriendlyGuide || {};
  const storyboardTag = scene.storyboardTag || {};
  const lightingTag = scene.lightingBuildSheetTag || {};
  const cameraPlanTag = scene.cameraPlanSheetTag || {};
  const primaryDialogue = storyboardTag.primaryDialogue || {};
  const framePreview = cameraPlanTag.framePreview || {};
  const movementSpec = cameraPlanTag.movementSpec || {};
  const cameraRig = cameraPlanTag.cameraRig || {};
  const startTime = scene.startTime || parseRange(scene.timestamp).start || "";
  const endTime = scene.endTime || parseRange(scene.timestamp).end || "";
  const timeRange = scene.timestamp || (startTime && endTime ? `${startTime}-${endTime}` : "0:00-0:00");
  const expression = toKeyValueText(scene.expression || storyboardTag.expression);
  const bodyLanguage = toKeyValueText(scene.bodyLanguage || storyboardTag.bodyLanguage);
  const dialogue = toKeyValueText(scene.dialogue) || primaryDialogue.line || scene.voiceOver || scene.vo || scene.voiceover || "";
  const voiceOver = scene.voiceOver || scene.vo || scene.voiceover || "";
  const overlayPlan = scene.overlayPlan || scene.overlay_plan || storyboardTag.overlayPlan || storyboardTag.overlay_plan || {};

  return {
    number: scene.shotNumber || index + 1,
    startTime,
    endTime,
    timeRange,
    durationSeconds: scene.durationSeconds || inferDurationSeconds(startTime, endTime, timeRange) || 2,
    title: scene.title || storyboardTag.shotTitle || scene.description || scene.visualDirection || `Shot ${index + 1}`,
    purpose: scene.purpose || storyboardTag.narrativeBeatSummary || scene.hookBeat || scene.scenePurpose || scene.description || "Storyboard beat",
    shotType: scene.shotType || storyboardTag.shotType || cameraPlanTag.shotType || "Shot",
    cameraAngle: scene.cameraAngle || storyboardTag.cameraAngle || cameraPlanTag.cameraAngle || scene.framing || "Camera angle",
    cameraMovement: scene.cameraMovement || storyboardTag.cameraMovement || cameraPlanTag.cameraMovement || scene.transition || "Static",
    gimbalSettings: toText(cameraPlanTag.gimbalSettings || compactGimbalFromMovement(movementSpec)),
    lensSuggestion: scene.lensSuggestion || storyboardTag.lensSuggestion || cameraPlanTag.lensSuggestion || cameraRig.lensSuggestion || "",
    fps: scene.fps || storyboardTag.fps || cameraPlanTag.fps || cinematic.recommendedFPS || "",
    composition: scene.composition || storyboardTag.compositionSummary || scene.visualDirection || scene.description || "",
    expression,
    emotion: toText(scene.emotion || storyboardTag.emotion),
    bodyLanguage,
    lighting: scene.lighting || storyboardTag.lightingAtmosphericDescription || lightingTag.cinematicIntent || "",
    environment: scene.environment || storyboardTag.environment || storyboardTag.setDesign || "",
    action: scene.action || storyboardTag.action || scene.description || scene.visualDirection || "",
    dialogue: dialogue || "No dialogue",
    voiceOver: voiceOver || "None",
    textOverlay: overlayPlan.enabled === false
      ? "No overlay; visual-only beat"
      : overlayPlan.text ?? scene.textOverlay ?? storyboardTag.textOverlay ?? "",
    overlayPlan,
    overlayFont: overlayPlan.fontFamily
      ? `${overlayPlan.fontFamily} ${overlayPlan.fontWeight || ""}`.trim()
      : "",
    overlayMotion: compactLines([
      overlayPlan.entrance,
      overlayPlan.entranceDurationMs && `${overlayPlan.entranceDurationMs} ms in`,
      overlayPlan.holdDurationMs && `${overlayPlan.holdDurationMs} ms hold`,
      overlayPlan.exit,
      overlayPlan.speed,
    ]),
    overlayPosition: compactLines([overlayPlan.position, overlayPlan.safeZone]),
    overlayRationale: overlayPlan.rationale || "",
    transition: scene.transition || storyboardTag.transitionNote || cinematic.transitionStyle || "",
    soundDesign: toText(scene.soundDesign || storyboardTag.soundDesign || storyboardTag.soundCues || storyboardTag.audioCues || storyboardTag.ambientBedDescription || storyboardTag.syncHitDescription || scene.soundNote || scene.musicNote),
    editingNotes: toText(scene.editingNotes),
    retentionGoal: scene.retentionGoal || storyboardTag.targetFocalPoint || scene.intendedImpact || scene.emotionalImpact || "",
    creatorDirection: toKeyValueText(scene.creatorDirection || storyboardTag.creatorTip || storyboardTag.directorNote),
    subtitlePosition: scene.subtitlePosition || storyboardTag.captionStyle?.position,
    mobileFocusArea: scene.mobileFocusArea || framePreview.mobileFocusArea || "",
    safeZoneNotes: scene.safeZoneNotes || framePreview.subjectPlacement || "",
    difficulty: difficulty.level || difficulty.score || "Beginner",
    executionScore: difficulty.score,
    executionLevel: difficulty.level,
    requiresTripod: formatBoolean(difficulty.requiresTripod),
    requiresHelper: formatBoolean(difficulty.requiresHelper),
    phoneFriendly: formatBoolean(difficulty.phoneFriendly),
    recommendedFPS: cinematic.recommendedFPS,
    captureMode: cinematic.captureMode || "",
    playbackSpeed: cinematic.playbackSpeed || "",
    cameraStyle: cinematic.cameraStyle || cameraRig.cameraBody || "",
    stabilization: cinematic.stabilization || movementSpec.stabilizationTool || "",
    transitionStyle: cinematic.transitionStyle || storyboardTag.transitionNote || "",
    zoomRecommendation: cinematic.zoomRecommendation || framePreview.lensCompressionFeel || "",
    motionIntensity: cinematic.motionIntensity || movementSpec.speed || "",
    editingComplexity: cinematic.editingComplexity || cameraPlanTag.coverageSpec?.editorIntent || "",
    visualTreatment: compactLines([
      treatment.motionStyle && `Motion: ${treatment.motionStyle}`,
      treatment.colorGrade && `Colour: ${treatment.colorGrade}`,
      treatment.editorialEffect && treatment.editorialEffect !== "none" && `Effect: ${treatment.editorialEffect}`,
      treatment.notes,
    ]),
    rookieGuide: compactLines([
      rookie.whatIsThis && `What is this: ${rookie.whatIsThis}`,
      rookie.whyThisWorks && `Why it works: ${rookie.whyThisWorks}`,
      rookie.howToShoot && `Shoot: ${toText(rookie.howToShoot)}`,
      rookie.howToMoveCamera && `Camera: ${toText(rookie.howToMoveCamera)}`,
      rookie.howToAct && `Acting: ${toText(rookie.howToAct)}`,
      rookie.editingTip && `Edit tip: ${rookie.editingTip}`,
      rookie.commonMistakes && `Avoid: ${toText(rookie.commonMistakes)}`,
      typeof rookie.phoneOnlyFriendly === "boolean" && `Phone only friendly: ${rookie.phoneOnlyFriendly ? "Yes" : "No"}`,
    ]),
  };
}

function parseRange(timestamp) {
  const parts = String(timestamp || "").split("-");
  return {
    start: parts[0]?.trim() || "",
    end: parts[1]?.trim() || "",
  };
}

function compactGimbalFromMovement(movement = {}) {
  if (!movement || typeof movement !== "object") return "";
  return {
    liveCameraMove: movement.liveCameraMove,
    stabilization: movement.stabilizationTool,
    rig: movement.rigType,
    operatorCue: movement.operatorCue,
  };
}

function formatBoolean(value) {
  if (typeof value !== "boolean") return "";
  return value ? "Yes" : "No";
}

function inferDurationSeconds(start, end, timestamp) {
  const startSeconds = parseTime(start);
  const endSeconds = parseTime(end);
  if (startSeconds !== null && endSeconds !== null) return Math.max(1, endSeconds - startSeconds);
  const parts = String(timestamp || "").split("-");
  if (parts.length >= 2) {
    const first = parseTime(parts[0]);
    const second = parseTime(parts[1]);
    if (first !== null && second !== null) return Math.max(1, second - first);
  }
  return null;
}

function parseTime(value) {
  if (value === undefined || value === null || value === "") return null;
  const text = String(value).trim();
  if (text.includes(":")) {
    const parts = text.split(":").map((part) => Number(part.replace(/\D/g, "")));
    if (parts.length >= 2 && parts.every((part) => Number.isFinite(part))) {
      return parts[0] * 60 + parts[1];
    }
  }
  const match = text.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function compactLines(lines) {
  return lines.filter(Boolean).join("\n");
}

function toKeyValueText(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return toText(value);
  return Object.entries(value)
    .map(([key, item]) => `${humanize(key)}: ${toText(item)}`)
    .join("\n");
}

function toText(value) {
  if (value === undefined || value === null || value === "") return "";
  if (Array.isArray(value)) return value.map(toText).filter(Boolean).join("\n");
  if (typeof value === "object") return toKeyValueText(value);
  return String(value);
}

function humanize(value) {
  return String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
