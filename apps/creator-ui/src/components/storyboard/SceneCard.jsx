// @ts-nocheck
import React, { useState } from "react";

export default function SceneCard({ scene, index, active, jsonReady, imageReady, onClick }) {
  const [assetAvailable, setAssetAvailable] = useState(true);
  const shot = normalizeShot(scene, index);
  const isTextCard = scene.type === "text";
  const sceneImage = `/mocks/creator/story-scene-${String(index + 1).padStart(2, "0")}.png`;
  const shouldUseAsset = imageReady && assetAvailable;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative block aspect-[9/16] min-h-[30rem] w-full overflow-hidden rounded-lg border bg-[#080d16] text-left transition hover:z-30 focus:z-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 ${
        active ? "border-purple-300 shadow-[0_0_0_1px_rgba(168,85,247,0.35)]" : "border-white/10 hover:border-purple-300/45"
      }`}
    >
      <div className="absolute inset-0">
        {!imageReady ? (
          <div className="h-full w-full animate-pulse bg-gradient-to-br from-slate-800 via-slate-700 to-slate-950" />
        ) : shouldUseAsset ? (
          <img src={sceneImage} alt="" className="h-full w-full object-cover grayscale" loading="lazy" onError={() => setAssetAvailable(false)} />
        ) : isTextCard ? (
          <div className="flex h-full w-full items-center justify-center bg-[#0B1020] p-8 text-center text-2xl font-black leading-9 text-white">
            "Just one decision... to show up."
          </div>
        ) : (
          <div className="scene-sketch h-full w-full" />
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-black/72 via-black/4 to-black/88" />

      <div className="absolute left-3 right-3 top-3 z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-xs font-black text-white shadow-lg shadow-black/30">
            {String(shot.number).padStart(2, "0")}
          </span>
          <span className="rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-xs font-black uppercase tracking-wide text-white backdrop-blur">
            {shot.timeRange}
          </span>
        </div>
        <span className="rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-100 backdrop-blur">
          {shot.difficulty}
        </span>
      </div>

      {shot.textOverlay && (
        <div className={`absolute z-10 ${overlayPositionClass(shot.subtitlePosition)}`}>
          <span className="rounded-md border border-white/15 bg-black/62 px-3 py-2 text-center text-sm font-black uppercase tracking-wide text-white shadow-xl shadow-black/40 backdrop-blur">
            {shot.textOverlay}
          </span>
        </div>
      )}

      <div className="absolute inset-x-3 bottom-3 z-10 rounded-lg border border-white/10 bg-black/58 p-3 shadow-lg shadow-black/35 backdrop-blur">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <MetaChip>{shot.shotType}</MetaChip>
          <MetaChip>{shot.cameraAngle}</MetaChip>
          <MetaChip>{shot.cameraMovement}</MetaChip>
        </div>
        <h3 className="line-clamp-1 text-base font-black leading-5 text-white">{shot.title}</h3>
        <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-300">{shot.purpose}</p>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-2">
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            {shot.fps ? `${shot.fps} FPS` : "Storyboard"}
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-purple-200">Hover Details</span>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-4 top-16 z-[95] opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus:pointer-events-auto group-focus:opacity-100 lg:inset-x-auto lg:right-8 lg:top-24 lg:w-[46rem]">
        <div
          onClick={(event) => event.stopPropagation()}
          className="custom-scrollbar max-h-[min(34rem,calc(100vh-7rem))] overflow-y-auto rounded-[1.6rem] bg-slate-950 px-4 py-4 text-white shadow-2xl ring-1 ring-white/10"
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(17rem,0.8fr)]">
            <div>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Shot {String(shot.number).padStart(2, "0")} Production Brief</p>
                  <h4 className="mt-1 text-xl font-black leading-6 text-white">{shot.title}</h4>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">{shot.purpose}</p>
                </div>
                <span className="shrink-0 rounded-full border border-purple-400/30 bg-purple-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-purple-100">
                  {shot.timeRange}
                </span>
              </div>

              {!jsonReady ? (
                <div className="space-y-2">
                  <div className="h-3 w-5/6 animate-pulse rounded bg-white/10" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
                </div>
              ) : (
                <>
                  <BriefSection label="Action" value={shot.action} featured />
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <BriefSection label="Composition" value={shot.composition} />
                    <BriefSection label="Expression" value={shot.expression} />
                    <BriefSection label="Emotion" value={shot.emotion} />
                    <BriefSection label="Body Language" value={shot.bodyLanguage} />
                    <BriefSection label="Dialogue / VO" value={shot.dialogue} />
                    <BriefSection label="Voice Over" value={shot.voiceOver} />
                    <BriefSection label="Text Overlay" value={shot.textOverlay} />
                    <BriefSection label="Sound Design" value={shot.soundDesign} />
                    <BriefSection label="Editing Notes" value={shot.editingNotes} />
                    <BriefSection label="Creator Direction" value={shot.creatorDirection} />
                    <BriefSection label="Retention Goal" value={shot.retentionGoal} />
                  </div>
                </>
              )}
            </div>

            <div className="space-y-3">
              <SpecPanel title="Timeline">
                <SpecRow label="Shot No." value={shot.number} />
                <SpecRow label="Start" value={shot.startTime} />
                <SpecRow label="End" value={shot.endTime} />
                <SpecRow label="Duration" value={`${shot.durationSeconds}s`} />
              </SpecPanel>

              <SpecPanel title="Camera">
                <SpecRow label="Shot Type" value={shot.shotType} />
                <SpecRow label="Camera Angle" value={shot.cameraAngle} />
                <SpecRow label="Movement" value={shot.cameraMovement} />
                <SpecRow label="Lens Suggestion" value={shot.lensSuggestion} />
                <SpecRow label="FPS" value={shot.fps} />
                <SpecRow label="Transition" value={shot.transition} />
              </SpecPanel>

              <SpecPanel title="Set And Safe Zone">
                <SpecRow label="Lighting" value={shot.lighting} />
                <SpecRow label="Environment" value={shot.environment} />
                <SpecRow label="Subtitle Position" value={shot.subtitlePosition} />
                <SpecRow label="Mobile Focus Area" value={shot.mobileFocusArea} />
                <SpecRow label="Safe Zone Notes" value={shot.safeZoneNotes} />
              </SpecPanel>

              <SpecPanel title="Execution Difficulty">
                <SpecRow label="Score" value={shot.executionScore} />
                <SpecRow label="Level" value={shot.executionLevel} />
                <SpecRow label="Requires Tripod" value={shot.requiresTripod} />
                <SpecRow label="Requires Helper" value={shot.requiresHelper} />
                <SpecRow label="Phone Friendly" value={shot.phoneFriendly} />
              </SpecPanel>

              <SpecPanel title="Cinematic Execution">
                <SpecRow label="Recommended FPS" value={shot.recommendedFPS} />
                <SpecRow label="Capture Mode" value={shot.captureMode} />
                <SpecRow label="Playback Speed" value={shot.playbackSpeed} />
                <SpecRow label="Camera Style" value={shot.cameraStyle} />
                <SpecRow label="Stabilization" value={shot.stabilization} />
                <SpecRow label="Transition Style" value={shot.transitionStyle} />
                <SpecRow label="Zoom" value={shot.zoomRecommendation} />
                <SpecRow label="Motion Intensity" value={shot.motionIntensity} />
                <SpecRow label="Editing Complexity" value={shot.editingComplexity} />
              </SpecPanel>
            </div>
          </div>

          {(shot.rookieGuide || shot.sketchPrompt) && (
            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)]">
              <BriefSection label="Rookie Friendly Guide" value={shot.rookieGuide} compact />
              <BriefSection label="Sketch Prompt" value={shot.sketchPrompt} compact />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function MetaChip({ children }) {
  if (!children) return null;
  return (
    <span className="max-w-full truncate rounded-full border border-white/15 bg-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-100">
      {children}
    </span>
  );
}

function BriefSection({ label, value, featured, compact }) {
  if (!value) return null;
  return (
    <div className={`${featured ? "border-purple-400/25 bg-purple-500/10" : "border-white/10 bg-white/[0.045]"} rounded-xl border px-3 py-3`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className={`${featured ? "text-sm text-white" : compact ? "text-xs text-slate-300" : "text-xs text-slate-200"} mt-2 whitespace-pre-line font-semibold leading-5`}>
        {value}
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
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="shrink-0 font-bold text-slate-500">{label}</span>
      <span className="text-right font-semibold leading-5 text-slate-200">{String(value)}</span>
    </div>
  );
}

function normalizeShot(scene, index) {
  const cinematic = scene.cinematicExecution || {};
  const difficulty = scene.executionDifficulty || {};
  const rookie = scene.rookieFriendlyGuide || {};
  const startTime = scene.startTime || parseRange(scene.timestamp).start || "";
  const endTime = scene.endTime || parseRange(scene.timestamp).end || "";
  const timeRange = scene.timestamp || (startTime && endTime ? `${startTime}-${endTime}` : "0:00-0:00");
  const expression = toKeyValueText(scene.expression);
  const bodyLanguage = toKeyValueText(scene.bodyLanguage);
  const dialogue = toKeyValueText(scene.dialogue) || scene.voiceOver || scene.vo || scene.voiceover || "";
  const voiceOver = scene.voiceOver || scene.vo || scene.voiceover || "";

  return {
    number: scene.shotNumber || index + 1,
    startTime,
    endTime,
    timeRange,
    durationSeconds: scene.durationSeconds || inferDurationSeconds(startTime, endTime, timeRange) || 2,
    title: scene.title || scene.description || scene.visualDirection || `Shot ${index + 1}`,
    purpose: scene.purpose || scene.hookBeat || scene.scenePurpose || scene.description || "Storyboard beat",
    shotType: scene.shotType || "Shot",
    cameraAngle: scene.cameraAngle || scene.framing || "Camera angle",
    cameraMovement: scene.cameraMovement || scene.transition || "Static",
    lensSuggestion: scene.lensSuggestion || "",
    fps: scene.fps || cinematic.recommendedFPS || "",
    composition: scene.composition || scene.visualDirection || scene.description || "",
    expression,
    emotion: toText(scene.emotion),
    bodyLanguage,
    lighting: scene.lighting || "",
    environment: scene.environment || "",
    action: scene.action || scene.description || scene.visualDirection || "",
    dialogue: dialogue || "No dialogue",
    voiceOver: voiceOver || "None",
    textOverlay: scene.textOverlay || "",
    transition: scene.transition || cinematic.transitionStyle || "",
    soundDesign: toText(scene.soundDesign || scene.soundNote || scene.musicNote),
    editingNotes: toText(scene.editingNotes),
    retentionGoal: scene.retentionGoal || scene.intendedImpact || scene.emotionalImpact || "",
    creatorDirection: toKeyValueText(scene.creatorDirection),
    subtitlePosition: scene.subtitlePosition,
    mobileFocusArea: scene.mobileFocusArea || "",
    safeZoneNotes: scene.safeZoneNotes || "",
    difficulty: difficulty.level || difficulty.score || "Beginner",
    executionScore: difficulty.score,
    executionLevel: difficulty.level,
    requiresTripod: formatBoolean(difficulty.requiresTripod),
    requiresHelper: formatBoolean(difficulty.requiresHelper),
    phoneFriendly: formatBoolean(difficulty.phoneFriendly),
    recommendedFPS: cinematic.recommendedFPS,
    captureMode: cinematic.captureMode || "",
    playbackSpeed: cinematic.playbackSpeed || "",
    cameraStyle: cinematic.cameraStyle || "",
    stabilization: cinematic.stabilization || "",
    transitionStyle: cinematic.transitionStyle || "",
    zoomRecommendation: cinematic.zoomRecommendation || "",
    motionIntensity: cinematic.motionIntensity || "",
    editingComplexity: cinematic.editingComplexity || "",
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
    sketchPrompt: scene.sketchPrompt || "",
  };
}

function parseRange(timestamp) {
  const parts = String(timestamp || "").split("-");
  return {
    start: parts[0]?.trim() || "",
    end: parts[1]?.trim() || "",
  };
}

function formatBoolean(value) {
  if (typeof value !== "boolean") return "";
  return value ? "Yes" : "No";
}

function overlayPositionClass(position) {
  const map = {
    "lower-middle": "left-1/2 bottom-32 -translate-x-1/2",
    lower: "left-1/2 bottom-32 -translate-x-1/2",
    middle: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
    top: "left-1/2 top-20 -translate-x-1/2",
  };
  return map[position] || "left-1/2 bottom-32 -translate-x-1/2";
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
  if (!value) return "";
  if (Array.isArray(value)) return value.filter(Boolean).join("\n");
  if (typeof value === "object") return toKeyValueText(value);
  return String(value);
}

function humanize(value) {
  return String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
