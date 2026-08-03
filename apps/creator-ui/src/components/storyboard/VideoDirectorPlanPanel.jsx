// @ts-nocheck
import React, { useMemo, useState } from "react";
import {
  Camera,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  Film,
  Focus,
  Lightbulb,
  MessageSquareText,
  Sparkles,
  Volume2,
} from "lucide-react";

export default function VideoDirectorPlanPanel({
  plan = {},
  onChange,
  onAskChange,
  disabled = false,
  busy = false,
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const shots = Array.isArray(plan?.shots)
    ? plan.shots
    : Array.isArray(plan?.shotByShot)
      ? plan.shotByShot
      : [];
  const masterPrompt = String(plan?.masterVideoPrompt || "");
  const revealArc = Array.isArray(plan?.revealArc) ? plan.revealArc : [];
  const totalFrames = useMemo(
    () => shots.reduce((sum, shot) => sum + (Array.isArray(shot?.perSecondFrames) ? shot.perSecondFrames.length : 0), 0),
    [shots]
  );

  const updatePlan = (patch) => {
    onChange?.({
      ...plan,
      ...patch,
      draftOnly: true,
    });
  };

  const updateShot = (index, patch) => {
    updatePlan({
      shots: shots.map((shot, shotIndex) => (
        shotIndex === index ? { ...shot, ...patch, locked: true } : shot
      )),
    });
  };

  const copyPrompt = async () => {
    if (!masterPrompt || !navigator?.clipboard?.writeText) return;
    await navigator.clipboard.writeText(masterPrompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section className="mt-3 rounded-lg border border-cyan-300/20 bg-cyan-400/[0.035]">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3">
        <div className="min-w-0">
          <span className="flex items-center gap-2 text-xs font-black text-white">
            <Film size={15} className="text-cyan-200" />
            Director&apos;s video blueprint
          </span>
          <p className="mt-1 truncate text-[10px] font-semibold text-slate-500">
            {plan?.conceptTitle || "Mystery first. Craft second. Hero product last."}
            {shots.length ? ` · ${plan?.masteringResolution || "4K master"} · ${shots.length} shots · ${totalFrames} timed frames · ${plan?.totalDurationSeconds || 0}s` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAskChange}
            disabled={disabled || busy}
            className="creator-control flex min-h-9 items-center gap-2 px-3 text-[10px] font-black text-white disabled:opacity-50"
          >
            <MessageSquareText size={13} />
            Ask to change
          </button>
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="creator-control flex min-h-9 items-center gap-2 px-3 text-[10px] font-black text-white"
            aria-expanded={expanded}
          >
            {expanded ? "Hide plan" : "View full plan"}
            <ChevronDown size={13} className={`transition ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {expanded && (
      <div className="border-t border-cyan-300/10 p-3">
        <div className="mb-3 grid gap-2 rounded-lg border border-emerald-300/15 bg-emerald-300/[0.035] p-3 md:grid-cols-3">
          <DirectionCell icon={Film} label="Mastering" value={joinValues(plan?.masteringResolution, plan?.captureStandard)} />
          <DirectionCell icon={Camera} label="Camera department" value={plan?.cameraDepartmentStandard} />
          <DirectionCell icon={Sparkles} label="Lighting / direction" value={joinValues(plan?.lightingDepartmentStandard, plan?.directionStandard)} />
        </div>
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,.6fr)]">
          <div className="rounded-lg border border-cyan-300/15 bg-black/20 p-3">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                <Sparkles size={16} />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase text-cyan-200">
                  {plan?.modeLabel || "Luxury product showcase"}
                </p>
                <h3 className="mt-1 text-base font-black text-white">
                  {plan?.conceptTitle || "Mystery first. Craft second. Hero product last."}
                </h3>
                <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-400">
                  {plan?.directingPrinciple || "Establish desire and a premium brand world before explaining ingredients or revealing the complete pack."}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-amber-300/15 bg-amber-300/[0.035] p-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-amber-100">
              <Lightbulb size={14} />
              Non-negotiable opening rule
            </div>
            <p className="mt-2 text-[11px] font-semibold leading-5 text-amber-100/75">
              {plan?.openingRule || "The first 2–3 seconds sell desire, mystery, scale, and premium positioning. No ingredient explanation and no complete product reveal."}
            </p>
          </div>
        </div>

        {revealArc.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {revealArc.map((beat, index) => (
              <React.Fragment key={`${beat}-${index}`}>
                {index > 0 && <span className="text-[10px] font-black text-slate-600">→</span>}
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[9px] font-black uppercase text-slate-300">
                  {beat}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}

        {shots.length ? (
          <div className="mt-3 space-y-2">
            {shots.map((shot, index) => {
              const frames = Array.isArray(shot?.perSecondFrames) ? shot.perSecondFrames : [];
              return (
                <details
                  key={`${shot?.shotNumber || index}-${shot?.startTimeSeconds || 0}`}
                  open={index === 0}
                  className="overflow-hidden rounded-lg border border-white/10 bg-black/20"
                >
                  <summary className="grid cursor-pointer list-none gap-2 p-3 md:grid-cols-[5rem_minmax(0,1fr)_auto] md:items-center">
                    <div>
                      <p className="text-[9px] font-black uppercase text-cyan-200">Shot {shot?.shotNumber || index + 1}</p>
                      <p className="mt-1 flex items-center gap-1 text-[10px] font-black text-white">
                        <Clock3 size={11} />
                        {timeRange(shot)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">{shot?.role || shot?.title || "Director beat"}</p>
                      <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-500">{shot?.objective || shot?.visualAction}</p>
                    </div>
                    <span className="w-fit rounded-full border border-amber-300/20 bg-amber-300/[0.06] px-2 py-1 text-[9px] font-black text-amber-100">
                      Product {shot?.productVisibilityPercent ?? 0}%
                    </span>
                  </summary>

                  <div className="border-t border-white/10 p-3">
                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                      <DirectionCell icon={Camera} label="Camera" value={joinValues(shot?.captureResolution, shot?.cameraPackage, shot?.captureSettings, shot?.cameraMovement, shot?.cameraAngle)} />
                      <DirectionCell icon={Focus} label="Lens / focus" value={joinValues(shot?.lens, shot?.focusBehavior)} />
                      <DirectionCell icon={Sparkles} label="Lighting" value={shot?.lighting} />
                      <DirectionCell icon={Volume2} label="Sound / transition" value={joinValues(shot?.soundDesign, shot?.transitionOut)} />
                    </div>

                    <label className="mt-3 block">
                      <span className="text-[9px] font-black uppercase text-cyan-200">Complete generation prompt for this shot</span>
                      <textarea
                        value={shot?.generationPrompt || ""}
                        onChange={(event) => updateShot(index, { generationPrompt: event.target.value })}
                        disabled={disabled || busy}
                        rows={5}
                        className="mt-1 w-full resize-y rounded-lg border border-cyan-300/15 bg-slate-950/80 p-3 text-[10px] font-semibold leading-5 text-slate-300 outline-none transition focus:border-cyan-200/45 disabled:opacity-50"
                      />
                    </label>

                    {frames.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[9px] font-black uppercase text-white">Second-by-second frame direction</p>
                        <div className="custom-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
                          {frames.map((frame, frameIndex) => (
                            <article key={`${frame?.second || frameIndex}-${frameIndex}`} className="w-72 shrink-0 rounded-lg border border-white/10 bg-slate-950/65 p-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[9px] font-black uppercase text-cyan-200">
                                  {frameLabel(frame, frameIndex)}
                                </span>
                                <span className="text-[9px] font-black text-amber-100">
                                  Product {frame?.productVisibilityPercent ?? shot?.productVisibilityPercent ?? 0}%
                                </span>
                              </div>
                              <p className="mt-2 text-[10px] font-semibold leading-5 text-slate-300">
                                {frame?.frameDescription || frame?.visualAction || "Hold approved shot continuity."}
                              </p>
                              <dl className="mt-2 space-y-1 text-[9px] font-semibold leading-4 text-slate-500">
                                <FrameSpec label="Camera" value={frame?.cameraAction} />
                                <FrameSpec label="Light" value={frame?.lightingAction} />
                                <FrameSpec label="Focus" value={frame?.focusAction} />
                                <FrameSpec label="Continuity" value={frame?.continuityAnchor} />
                              </dl>
                            </article>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-dashed border-cyan-300/20 bg-black/15 p-5 text-center">
            <Film size={22} className="mx-auto text-slate-600" />
            <p className="mt-2 text-xs font-black text-slate-300">The director blueprint will appear after the current project is loaded.</p>
          </div>
        )}

        <div className="mt-3 rounded-lg border border-purple-300/15 bg-purple-300/[0.035] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-black uppercase text-purple-200">Complete video-generation master prompt</p>
              <p className="mt-1 text-[10px] font-semibold text-slate-500">This prompt travels with the approved planning document and video handoff.</p>
            </div>
            <button
              type="button"
              onClick={copyPrompt}
              disabled={!masterPrompt}
              className="creator-control flex min-h-9 items-center gap-2 px-3 text-[10px] font-black text-white disabled:opacity-45"
            >
              {copied ? <Check size={13} className="text-emerald-300" /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy prompt"}
            </button>
          </div>
          <textarea
            value={masterPrompt}
            onChange={(event) => updatePlan({ masterVideoPrompt: event.target.value })}
            disabled={disabled || busy}
            rows={12}
            placeholder="Complete video-generation prompt"
            className="mt-2 w-full resize-y rounded-lg border border-purple-300/15 bg-slate-950/80 p-3 text-[10px] font-semibold leading-5 text-slate-300 outline-none transition focus:border-purple-200/45 disabled:opacity-50"
          />
        </div>
      </div>
      )}
    </section>
  );
}

function DirectionCell({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/55 p-3">
      <p className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-500">
        <Icon size={11} />
        {label}
      </p>
      <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-300">{value || "Follow approved continuity."}</p>
    </div>
  );
}

function FrameSpec({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <dt className="inline font-black text-slate-400">{label}: </dt>
      <dd className="inline">{value}</dd>
    </div>
  );
}

function timeRange(shot = {}) {
  const start = numberValue(shot?.startTimeSeconds, shot?.startTime, 0);
  const end = numberValue(shot?.endTimeSeconds, shot?.endTime, start + numberValue(shot?.durationSeconds, 0));
  return `${formatTime(start)}–${formatTime(end)}`;
}

function frameLabel(frame = {}, index = 0) {
  const start = numberValue(frame?.startTimeSeconds, frame?.second, index);
  const end = numberValue(frame?.endTimeSeconds, start + 1);
  return `${formatTime(start)}–${formatTime(end)}`;
}

function formatTime(value) {
  const number = Number(value || 0);
  return `${Number.isInteger(number) ? number : number.toFixed(1)}s`;
}

function numberValue(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

function joinValues(...values) {
  return values.map((value) => String(value || "").trim()).filter(Boolean).join(" · ");
}
