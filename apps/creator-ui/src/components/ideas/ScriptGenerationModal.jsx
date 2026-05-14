// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { FileText, PencilLine, Sparkles, TrendingUp, X } from "lucide-react";

export default function ScriptGenerationModal({ open, onClose, onApply, brief, trend, duration = 30, initialMode = "brief", scriptDetail }) {
  const [mode, setMode] = useState(initialMode);
  const isDetailView = Boolean(scriptDetail);

  useEffect(() => {
    if (open) setMode(initialMode || "brief");
  }, [initialMode, open]);

  const script = useMemo(
    () => (scriptDetail ? normalizeScriptDetail(scriptDetail, duration) : buildScript({ mode, brief, trend, duration })),
    [brief, duration, mode, scriptDetail, trend]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="creator-panel flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden p-0">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
          <div>
            <h3 className="text-xl font-bold text-white">{isDetailView ? "Complete Script Detail" : "Generate Short Script"}</h3>
            <p className="mt-1 text-sm font-medium text-slate-400">
              {isDetailView ? "Review the full scene-by-scene script attached to this idea." : "Preview the complete scene-by-scene script before applying it to the brief."}
            </p>
          </div>
          <button type="button" onClick={onClose} className="creator-control flex h-9 w-9 items-center justify-center">
            <X size={16} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="border-b border-white/10 p-4 lg:border-b-0 lg:border-r lg:border-white/10">
            {!isDetailView && (
              <div className="grid gap-2">
                <ModeButton
                  icon={PencilLine}
                  label="From My Idea"
                  description="Turn the typed idea or selected brief into a scene script."
                  active={mode === "brief"}
                  onClick={() => setMode("brief")}
                />
                <ModeButton
                  icon={FileText}
                  label="From Full Script"
                  description="Extract a usable short idea from the pasted script."
                  active={mode === "script"}
                  onClick={() => setMode("script")}
                />
                <ModeButton
                  icon={TrendingUp}
                  label="From Trend"
                  description="Use the selected predicted trend as the creative source."
                  active={mode === "trend"}
                  onClick={() => setMode("trend")}
                />
              </div>
            )}

            <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.035] p-3">
              <p className="text-[11px] font-bold uppercase text-slate-500">Source</p>
              <p className="mt-1 text-sm font-bold leading-6 text-white">
                {scriptDetail?.title || (mode === "trend" ? trend?.title || "Selected trend" : brief || "Typed story idea")}
              </p>
              <p className="mt-2 text-xs font-semibold text-purple-200">{duration}s short</p>
            </div>

            {script.ideaTitle && (
              <div className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3">
                <p className="text-[11px] font-bold uppercase text-emerald-200">Generated Idea</p>
                <p className="mt-1 text-sm font-bold leading-6 text-white">{script.ideaTitle}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-emerald-100">{script.ideaSummary}</p>
              </div>
            )}
          </aside>

          <main className="custom-scrollbar min-h-0 overflow-y-auto p-5">
            <div className="mb-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-purple-200">
                {mode === "script" && !isDetailView ? "Idea Extracted From Script" : "Scene-By-Scene Script"}
              </p>
              <h4 className="mt-1 text-2xl font-black text-white">{script.title}</h4>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-300">{script.summary}</p>
            </div>

            <div className="space-y-3">
              {script.scenes.map((scene, index) => (
                <article key={scene.time} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-600 text-xs font-black text-white">{index + 1}</span>
                      <span className="text-xs font-black uppercase text-slate-400">{scene.time}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wide text-purple-200">{scene.camera}</span>
                  </div>
                  <p className="text-sm font-bold leading-6 text-white">{scene.visual}</p>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <ScriptBlock label="VO / Dialog" value={scene.dialogue} />
                    <ScriptBlock label="Screen Text" value={scene.screenText} />
                    <ScriptBlock label="Direction" value={scene.directorNote} />
                    <ScriptBlock label="Intent" value={scene.intent} />
                  </div>
                </article>
              ))}
            </div>
          </main>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 p-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="creator-control px-4 py-3 text-sm font-bold text-slate-300">
            Close
          </button>
          {!isDetailView && (
            <button
              type="button"
              onClick={() => onApply?.(script)}
              className="creator-primary flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white"
            >
              <Sparkles size={16} />
              {mode === "script" ? "Use Idea From Script" : "Apply Script To Brief"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ModeButton({ icon: Icon, label, description, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-3 text-left transition ${
        active ? "border-purple-400 bg-purple-500/15 text-white" : "border-white/10 bg-white/[0.035] text-slate-300 hover:border-purple-300/40"
      }`}
    >
      <span className="flex items-center gap-2 text-sm font-bold">
        <Icon size={16} className="text-purple-300" />
        {label}
      </span>
      <span className="mt-1 block text-xs font-medium leading-5 text-slate-400">{description}</span>
    </button>
  );
}

function ScriptBlock({ label, value }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 p-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-200">{value}</p>
    </div>
  );
}

function buildScript({ mode, brief, trend, duration }) {
  const sourceTitle = mode === "trend" ? trend?.title || "Selected Trend" : brief || "Original Creator Idea";
  const cleanTitle = String(sourceTitle).trim();
  const sourceSummary = mode === "trend"
    ? `Built from the predicted trend "${cleanTitle}" and shaped into a creator-ready short.`
    : mode === "script"
      ? `Extracted from the creator's pasted script and converted into a lockable short idea.`
      : `Built from the creator's own idea: "${cleanTitle}".`;
  const sceneCount = Number(duration) >= 60 ? 10 : Number(duration) >= 45 ? 8 : 6;
  const segment = Number(duration) / sceneCount;
  const phrase = trimText(cleanTitle, 44);
  const scriptLines = splitScriptLines(cleanTitle);
  const templates = [
    {
      camera: "Cold open close-up",
      visual: "Creator freezes before the first action, caught between avoidance and commitment.",
      dialogue: "I almost talked myself out of this.",
      screenText: "I almost skipped it.",
      directorNote: "Hold the face for half a beat longer than comfortable. Let the hesitation breathe.",
      intent: "Hook with an emotionally familiar hesitation.",
    },
    {
      camera: "Insert detail",
      visual: "A concrete object shows the decision point: shoes, phone, door handle, packed bag, or mirror.",
      dialogue: "The excuse was ready. I was not.",
      screenText: "Excuse vs action",
      directorNote: "Use shallow focus. Keep hands slightly tense so the viewer feels the conflict.",
      intent: "Make the resistance visible instead of explaining it.",
    },
    {
      camera: "Medium follow",
      visual: `Creator chooses the smallest possible step toward "${phrase}".`,
      dialogue: "So I made the promise smaller.",
      screenText: "Just start smaller.",
      directorNote: "Move with the creator from behind or side profile. Keep it imperfect and real.",
      intent: "Turn pressure into a doable first move.",
    },
    {
      camera: "Handheld medium",
      visual: "The first attempt looks awkward; the creator adjusts, breathes, and keeps going.",
      dialogue: "It was not pretty, but it counted.",
      screenText: "Awkward counts.",
      directorNote: "Do not over-polish this shot. The small struggle is the point.",
      intent: "Give the audience permission to start badly.",
    },
    {
      camera: "Reaction close-up",
      visual: "A tiny win lands on the creator's face before they try to hide the smile.",
      dialogue: "One small win changed the whole mood.",
      screenText: "One small win.",
      directorNote: "Catch the reaction before the creator poses. It should feel private.",
      intent: "Deliver the emotional turn.",
    },
    {
      camera: "Wide reset",
      visual: "Creator repeats the action with slightly more confidence and cleaner rhythm.",
      dialogue: "I did not need a perfect day. I needed proof.",
      screenText: "Proof, not perfection.",
      directorNote: "Let the movement become steadier. This is the confidence shift.",
      intent: "Show progress without turning it into a fake transformation.",
    },
    {
      camera: "Mirror or front angle",
      visual: "Creator looks at themself, not fully changed, but visibly more present.",
      dialogue: "The version of me I wanted was already watching.",
      screenText: "She showed up.",
      directorNote: "Keep eye contact soft. Avoid a triumphant pose; make it grounded.",
      intent: "Make the payoff feel internal and relatable.",
    },
    {
      camera: "Detail montage",
      visual: "Three quick proof shots: breath, grip, step, note, timer, or completed rep.",
      dialogue: "Then I stacked one more tiny promise.",
      screenText: "Stack the proof.",
      directorNote: "Cut on movement. Each insert should feel useful, not decorative.",
      intent: "Give the edit pace without losing the emotional line.",
    },
    {
      camera: "Hero close-up",
      visual: "Creator faces the lens with calm confidence and one honest closing thought.",
      dialogue: "You do not need to feel ready to begin.",
      screenText: "Ready is optional.",
      directorNote: "Use steady framing. Let the silence after the line do some work.",
      intent: "Turn the story into a shareable lesson.",
    },
    {
      camera: "End frame",
      visual: "Creator exits frame or returns to the action while the final line stays on screen.",
      dialogue: "Just one decision... to show up.",
      screenText: "Just show up.",
      directorNote: "End on motion, not a static poster. Leave room for caption and CTA.",
      intent: "Close with a memorable line and replayable takeaway.",
    },
  ];

  const selectedTemplates = sceneCount >= templates.length
    ? templates
    : [...templates.slice(0, sceneCount - 1), templates[templates.length - 1]];
  const scenes = selectedTemplates.map((scene, index) => {
    const scriptLine = scriptLines[index] || scriptLines[scriptLines.length - 1];
    const scriptBeat = scriptLine ? trimText(scriptLine, 140) : "";
    return {
      ...scene,
      ...(mode === "script" && scriptBeat
        ? {
            visual: `Script beat: ${scriptBeat}`,
            dialogue: inferDialogue(scriptBeat) || scene.dialogue,
            screenText: index === 0 ? "Script hook" : scene.screenText,
            directorNote: `Preserve the intent of this script beat, then stage it visually for a ${duration}s short.`,
          }
        : {}),
      time: `${Math.round(index * segment)}-${Math.round((index + 1) * segment)} sec`,
    };
  });

  return {
    source: mode === "trend" ? "trend" : mode === "script" ? "script" : "brief",
    title: mode === "trend"
      ? `${trimText(cleanTitle, 46)} - Trend Script`
      : mode === "script"
        ? `${deriveIdeaTitle(cleanTitle)} - Script Idea`
        : `${trimText(cleanTitle, 46)} - Creator Script`,
    ideaTitle: mode === "script" ? deriveIdeaTitle(cleanTitle) : undefined,
    ideaSummary: mode === "script" ? deriveIdeaSummary(cleanTitle) : undefined,
    summary: sourceSummary,
    scenes,
  };
}

function normalizeScriptDetail(idea, duration) {
  const scenes = (idea?.scriptScenes || []).map((scene, index) => ({
    time: scene.time || scene.timestamp || `${index * 5}-${(index + 1) * 5} sec`,
    camera: scene.camera || scene.cameraAngle || scene.shotType || "Director shot",
    visual: scene.visual || scene.description || scene.visualDirection || "Scene visual detail",
    dialogue: scene.dialogue || scene.vo || scene.voiceover || "No dialogue",
    screenText: scene.screenText || scene.text || "No screen text",
    directorNote: scene.directorNote || scene.direction || "Use the generated storyboard direction for this beat.",
    intent: scene.intent || scene.intendedImpact || scene.emotionalImpact || "Move the story forward.",
  }));

  return {
    source: idea?.source || "brief",
    title: idea?.title || "Script Detail",
    summary: idea?.description || "Complete script detail for this generated idea.",
    ideaTitle: idea?.title,
    ideaSummary: idea?.description,
    scenes,
  };
}

function splitScriptLines(value) {
  return String(value || "")
    .split(/\n|(?<=\.)\s+|(?<=\?)\s+|(?<=!)\s+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function inferDialogue(line) {
  const colonIndex = line.indexOf(":");
  if (colonIndex > -1 && colonIndex < 28) return trimText(line.slice(colonIndex + 1).trim(), 120);
  const quoteMatch = line.match(/["']([^"']+)["']/);
  if (quoteMatch?.[1]) return trimText(quoteMatch[1], 120);
  return "";
}

function deriveIdeaTitle(value) {
  const firstLine = splitScriptLines(value)[0] || "Script-Based Short";
  return trimText(firstLine.replace(/^scene\s*\d+\s*[:.-]\s*/i, ""), 42);
}

function deriveIdeaSummary(value) {
  const lines = splitScriptLines(value);
  const joined = lines.slice(0, 3).join(" ");
  return joined ? `A short built from the pasted script: ${trimText(joined, 150)}` : "A short idea extracted from the pasted script.";
}

function trimText(value, maxLength) {
  const text = String(value || "").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}
