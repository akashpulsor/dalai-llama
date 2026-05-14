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
  activeSceneIndex,
  onSelectScene,
  onExport,
  onSave,
  isSaved,
  onGenerateAgain,
  isGenerating,
}) {
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
          return (
            <SceneCard
              key={sceneId}
              scene={scene}
              index={index}
              active={activeSceneIndex === index}
              jsonReady={readySceneIds.includes(sceneId)}
              imageReady={imageReadySceneIds.includes(sceneId)}
              onClick={() => onSelectScene?.(index)}
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
