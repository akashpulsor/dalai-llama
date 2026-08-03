// @ts-nocheck
import React, { useMemo, useState } from "react";
import { Heart, MessageCircle, MoreHorizontal, Pause, Play, Share2 } from "lucide-react";

export default function MobileFrame({
  scene,
  scenes = [],
  cursorMs,
  durationMs,
  isPlaying,
  onToggle,
  onSeek,
  onRefreshMedia,
  videoRun,
  finalVideoUrl,
  screenplay,
  productionStyle = "full_ai",
}) {
  const safeDurationMs = Math.max(1000, Number(durationMs) || 1000);
  const cursorSeconds = Math.max(0, Number(cursorMs) || 0) / 1000;
  const progress = Math.max(0, Math.min(100, (cursorMs / safeDurationMs) * 100));
  const [liked, setLiked] = useState(false);
  const [message, setMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const runScenes = useMemo(() => normalizePreviewScenes(videoRun, scenes), [videoRun, scenes]);
  const activeScene = useMemo(
    () => sceneForCursor(scene, runScenes, cursorSeconds, safeDurationMs),
    [cursorSeconds, runScenes, safeDurationMs, scene]
  );
  const captions = useMemo(() => captionCuesFrom(videoRun, screenplay, runScenes), [runScenes, screenplay, videoRun]);
  const activeCaption = activeCaptionFor(captions, cursorSeconds, activeScene);
  const resolvedFinalVideoUrl = firstText(finalVideoUrl, finalVideoUrlFrom(videoRun));
  const posterUrl = storyboardImageUrl(activeScene);
  const isUgcPlaceholder = isHybridUgcScene(activeScene, productionStyle || videoRun?.productionStyle);
  const title = firstText(
    activeScene?.title,
    activeScene?.beatTitle,
    activeScene?.narrativeBeat,
    screenplay?.title,
    screenplay?.scriptJson?.projectTitle,
    "Creator preview"
  );
  const sceneText = firstText(
    activeCaption?.text,
    activeScene?.textOverlay,
    activeScene?.caption,
    activeScene?.dialogue,
    activeScene?.voiceOver,
    activeScene?.vo,
    activeScene?.description,
    activeScene?.action
  );
  const previewMode = resolvedFinalVideoUrl ? "Final video" : isUgcPlaceholder ? "UGC placeholder" : posterUrl ? "Storyboard animatic" : "Scene animatic";

  const flash = (text) => {
    setMessage(text);
    window.clearTimeout(window.__creatorPreviewNotice);
    window.__creatorPreviewNotice = window.setTimeout(() => setMessage(""), 1800);
  };

  const share = async () => {
    const shareText = "Preview link copied";
    try {
      await navigator.clipboard?.writeText?.(resolvedFinalVideoUrl || window.location.href);
      flash(shareText);
    } catch {
      flash("Preview link ready");
    }
  };

  return (
    <section className="creator-panel sticky top-5 p-4">
      <div className="mb-4">
        <h2 className="text-lg font-bold">Mobile Preview</h2>
        <p className="text-sm font-medium text-slate-400">{previewMode}</p>
      </div>
      <div className="mx-auto w-full max-w-[18.5rem] rounded-[2.2rem] border border-slate-700/80 bg-black p-3 shadow-2xl">
        <div className="relative overflow-hidden rounded-[1.7rem] bg-slate-950">
          <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-3 text-[11px] font-bold">
            <span>9:41</span>
            <span>5G 100%</span>
          </div>
          <div className="relative h-[34rem] bg-black">
            {resolvedFinalVideoUrl ? (
              <video
                src={resolvedFinalVideoUrl}
                className="h-full w-full bg-black object-contain"
                controls
                playsInline
                onError={() => onRefreshMedia?.()}
              />
            ) : isUgcPlaceholder ? (
              <div className="flex h-full w-full items-center justify-center bg-black px-6 text-center">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-normal text-slate-500">UGC scene</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-300">Human footage slot</p>
                </div>
              </div>
            ) : posterUrl ? (
              <img src={posterUrl} alt="" className="h-full w-full bg-black object-contain" />
            ) : (
              <div className="scene-sketch h-full w-full" />
            )}
            {!resolvedFinalVideoUrl && (
              <div className="absolute inset-x-4 top-12 z-10 flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-normal text-white/75">
                <span className="rounded-md border border-white/10 bg-black/35 px-2 py-1 backdrop-blur">{previewMode}</span>
                <span className="rounded-md border border-white/10 bg-black/35 px-2 py-1 backdrop-blur">
                  Scene {activeScene?.sceneNumber || activeScene?.shotNumber || 1}
                </span>
              </div>
            )}
          </div>
          <EngagementRail
            liked={liked}
            menuOpen={menuOpen}
            onLike={() => {
              setLiked((value) => !value);
              flash(liked ? "Like removed" : "Liked preview");
            }}
            onComment={() => flash("Mock comments opened")}
            onShare={share}
            onMore={() => setMenuOpen((value) => !value)}
            onMenuAction={(action) => {
              setMenuOpen(false);
              flash(action);
            }}
          />
          {message && (
            <div className="absolute left-5 right-5 top-14 z-30 rounded-lg border border-white/10 bg-black/70 px-3 py-2 text-center text-xs font-semibold backdrop-blur">
              {message}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black via-black/58 to-transparent p-5">
            <p className="max-w-[12rem] text-lg font-bold leading-6">
              {title}
            </p>
            <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm font-black leading-5 text-white">
              {sceneText}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <button type="button" onClick={onToggle} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black">
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
              </button>
              <span className="text-xs font-bold">{formatTime(cursorMs)} / {formatTime(safeDurationMs)}</span>
            </div>
            <button type="button" onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const ratio = (event.clientX - rect.left) / rect.width;
              const nextMs = Math.max(0, Math.min(safeDurationMs, safeDurationMs * ratio));
              onSeek?.(nextMs);
              flash(`Scrubbed to ${formatTime(nextMs)}`);
            }} className="mt-3 block h-3 w-full rounded-full bg-white/20 p-0">
              <span className="block h-1.5 rounded-full bg-purple-500" style={{ width: `${progress}%` }} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function EngagementRail({ liked, menuOpen, onLike, onComment, onShare, onMore, onMenuAction }) {
  const items = [
    [Heart, liked ? "12.5K" : "12.4K", onLike, liked],
    [MessageCircle, "156", onComment, false],
    [Share2, "323", onShare, false],
    [MoreHorizontal, "", onMore, false],
  ];
  return (
    <div className="absolute bottom-32 right-4 z-20 space-y-4 text-center">
      {items.map(([Icon, label, action, active]) => (
        <div key={label || "more"} className="relative">
          <button type="button" onClick={action} className={`drop-shadow transition ${active ? "text-rose-300" : "text-white"}`}>
            <Icon size={24} className="mx-auto" fill={Icon === Heart && active ? "currentColor" : "none"} />
            {label && <p className="mt-1 text-[10px] font-bold">{label}</p>}
          </button>
          {Icon === MoreHorizontal && menuOpen && (
            <div className="absolute bottom-0 right-8 w-32 rounded-lg border border-white/10 bg-black/80 p-2 text-left text-xs font-semibold shadow-2xl backdrop-blur">
              <button type="button" onClick={() => onMenuAction?.("Preview duplicated")} className="block w-full rounded px-2 py-1.5 text-left hover:bg-white/10">Duplicate</button>
              <button type="button" onClick={() => onMenuAction?.("Mock report saved")} className="block w-full rounded px-2 py-1.5 text-left hover:bg-white/10">Report mock</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function normalizePreviewScenes(videoRun = {}, fallbackScenes = []) {
  const backendScenes = firstArray(
    videoRun?.scenes,
    videoRun?.sceneClips,
    videoRun?.clips,
    videoRun?.timeline?.scenes,
    videoRun?.renderManifest?.scenes
  );
  const source = backendScenes.length ? backendScenes : arrayValue(fallbackScenes);
  let runningStart = 0;
  return source.map((scene, index) => {
    const durationSeconds = Number(
      scene?.durationSeconds
      || scene?.duration_seconds
      || secondsBetween(scene?.startTime, scene?.endTime)
      || 0
    ) || 0;
    const startSeconds = Number(scene?.startSeconds ?? scene?.start_seconds ?? runningStart);
    const endSeconds = Number(scene?.endSeconds ?? scene?.end_seconds ?? (startSeconds + (durationSeconds || 3)));
    runningStart = endSeconds;
    return {
      ...scene,
      sceneNumber: Number(scene?.sceneNumber || scene?.scene_number || scene?.shotNumber || scene?.shot_number || index + 1),
      shotNumber: Number(scene?.shotNumber || scene?.shot_number || scene?.sceneNumber || scene?.scene_number || index + 1),
      startSeconds,
      endSeconds,
      durationSeconds: Math.max(1, endSeconds - startSeconds),
    };
  });
}

function sceneForCursor(selectedScene, scenes, cursorSeconds, durationMs) {
  if (scenes.length) {
    const byRange = scenes.find((scene) => cursorSeconds >= Number(scene.startSeconds || 0) && cursorSeconds < Number(scene.endSeconds || 0));
    if (byRange) return byRange;
    const sceneMs = durationMs / Math.max(1, scenes.length);
    const index = Math.min(scenes.length - 1, Math.max(0, Math.floor((cursorSeconds * 1000) / sceneMs)));
    return scenes[index] || selectedScene || scenes[0];
  }
  return selectedScene || {};
}

function captionCuesFrom(videoRun = {}, screenplay = {}, scenes = []) {
  const directCues = firstArray(
    videoRun?.srtCues,
    videoRun?.srt_cues,
    screenplay?.scriptJson?.srtCues,
    screenplay?.scriptJson?.srt_cues,
    screenplay?.srtCues,
    screenplay?.srt_cues
  );
  if (directCues.length) return directCues.map(normalizeCue).filter(Boolean);
  const srtContent = firstText(
    videoRun?.srtFile?.content,
    videoRun?.srt_file?.content,
    videoRun?.srt,
    screenplay?.scriptJson?.srtFile?.content,
    screenplay?.scriptJson?.srt,
    screenplay?.srt
  );
  const parsed = parseSrt(srtContent);
  if (parsed.length) return parsed;
  return scenes.map((scene) => ({
    startSeconds: Number(scene.startSeconds || 0),
    endSeconds: Number(scene.endSeconds || scene.startSeconds || 0) || Number(scene.startSeconds || 0) + Number(scene.durationSeconds || 3),
    text: firstText(scene.textOverlay, scene.caption, scene.dialogue, scene.voiceOver, scene.vo, scene.description, scene.action),
  })).filter((cue) => cue.text);
}

function activeCaptionFor(cues = [], cursorSeconds, scene = {}) {
  return cues.find((cue) => cursorSeconds >= cue.startSeconds && cursorSeconds <= cue.endSeconds)
    || {
      text: firstText(scene?.textOverlay, scene?.caption, scene?.dialogue, scene?.voiceOver, scene?.vo, scene?.description, scene?.action),
    };
}

function normalizeCue(cue) {
  const value = cue && typeof cue === "object" ? cue : { text: cue };
  const startSeconds = Number(value.startSeconds ?? value.start_seconds ?? value.start ?? value.from ?? 0);
  const endSeconds = Number(value.endSeconds ?? value.end_seconds ?? value.end ?? value.to ?? startSeconds + 3);
  const text = firstText(value.text, value.caption, value.line, value.words);
  if (!text) return null;
  return { startSeconds, endSeconds: Math.max(startSeconds + 0.5, endSeconds), text };
}

function parseSrt(content = "") {
  const text = String(content || "").trim();
  if (!text) return [];
  return text.split(/\n\s*\n/).map((block) => {
    const lines = block.split(/\r?\n/).filter(Boolean);
    const timing = lines.find((line) => line.includes("-->"));
    if (!timing) return null;
    const [start, end] = timing.split("-->").map((value) => value.trim());
    const textLines = lines.slice(lines.indexOf(timing) + 1).join(" ").trim();
    if (!textLines) return null;
    return {
      startSeconds: srtTimeToSeconds(start),
      endSeconds: srtTimeToSeconds(end),
      text: textLines,
    };
  }).filter(Boolean);
}

function srtTimeToSeconds(value = "") {
  const parts = String(value).replace(",", ".").split(":");
  if (parts.length < 3) return Number(value) || 0;
  return (Number(parts[0]) || 0) * 3600 + (Number(parts[1]) || 0) * 60 + (Number(parts[2]) || 0);
}

function secondsBetween(start, end) {
  const startSeconds = timeValueToSeconds(start);
  const endSeconds = timeValueToSeconds(end);
  return endSeconds > startSeconds ? endSeconds - startSeconds : 0;
}

function timeValueToSeconds(value) {
  if (value === undefined || value === null || value === "") return 0;
  if (typeof value === "number") return value;
  const text = String(value).trim();
  if (/^\d+(\.\d+)?$/.test(text)) return Number(text);
  return srtTimeToSeconds(text);
}

function storyboardImageUrl(scene = {}) {
  return firstText(
    scene?.storyboardImageUrl,
    scene?.storyboard_image_url,
    scene?.imageUrl,
    scene?.image_url,
    scene?.signedUrl,
    scene?.signed_url,
    scene?.publicUrl,
    scene?.public_url,
    scene?.assetUrl,
    scene?.asset_url,
    scene?.storyboardImage?.signedUrl,
    scene?.storyboardImage?.publicUrl,
    scene?.storyboardAsset?.signedUrl,
    scene?.storyboardAsset?.publicUrl,
    imageUrlByKind(scene?.assets, "storyboard"),
    imageUrlByKind(scene?.imageAssets, "storyboard"),
    imageUrlByKind(scene?.shotImages, "storyboard")
  );
}

function imageUrlByKind(assets, kind) {
  return arrayValue(assets).map((asset) => {
    const assetKind = String(asset?.kind || asset?.imageKind || asset?.image_kind || asset?.assetKind || "").toLowerCase();
    if (assetKind && !assetKind.includes(kind)) return "";
    return firstText(asset?.signedUrl, asset?.signed_url, asset?.publicUrl, asset?.public_url, asset?.url, asset?.assetUrl);
  }).find(Boolean) || "";
}

function finalVideoUrlFrom(value = {}) {
  return firstText(
    value?.finalVideoUrl,
    value?.final_video_url,
    value?.finalAssetUrl,
    value?.final_asset_url,
    value?.videoUrl,
    value?.video_url,
    value?.publicUrl,
    value?.public_url,
    value?.signedUrl,
    value?.signed_url,
    value?.finalVideo?.videoUrl,
    value?.finalVideo?.publicUrl,
    value?.finalVideo?.signedUrl,
    value?.renderManifest?.finalVideoUrl,
    value?.renderManifest?.finalVideo?.videoUrl,
    value?.renderManifest?.finalVideo?.publicUrl,
    value?.renderManifest?.finalVideo?.signedUrl
  );
}

function isHybridUgcScene(scene = {}, productionStyle = "") {
  const style = String(productionStyle || "").toLowerCase();
  const mode = String(firstText(scene?.generationMode, scene?.generation_mode, scene?.assetCaptureMode, scene?.asset_capture_mode, scene?.targetProvider)).toLowerCase();
  return style.includes("hybrid") && /ugc|talking|human|recorded|creator|real/.test(mode);
}

function firstArray(...values) {
  return values.find(Array.isArray) || [];
}

function arrayValue(value) {
  return Array.isArray(value) ? value : [];
}

function firstText(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return "";
}
