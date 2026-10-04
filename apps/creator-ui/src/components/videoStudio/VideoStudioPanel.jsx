import React from "react";
import { useDispatch } from "react-redux";
import { AlertTriangle, CheckCircle2, Clapperboard, Film, Link2, Loader2, RefreshCw, RotateCcw, Save, ScanSearch, ShieldCheck, Sparkles, Wand2, X } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useAnalyzeShotGenerationPlanMutation,
  useAttachShotContinuationFrameMutation,
  useBuildShotGenerationTimelineMutation,
  useComposeShotGenerationPromptMutation,
  useDetachShotContinuationFrameMutation,
  useGenerateShotFromPlanMutation,
  useGetShotGenerationPlanQuery,
  useResetShotGenerationDraftMutation,
  useRetimeShotDialogueMutation,
  useSaveShotGenerationDraftMutation,
  useSelectShotGenerationSettingsMutation,
  useUpdatePreProductionShotMutation,
  useValidateShotGenerationPromptMutation,
} from "../../api/creatorEndpoints.js";
import {
  coverageRows,
  differsFromRecommendation,
  formatSeconds,
  generateBlockers,
  hasUnsavedEdits,
  issuesFor,
  savedPromptText,
  staleness,
} from "./studioState.js";

/**
 * The video studio for one shot: analyse it, choose how long to generate it for, lay its action out
 * second by second, read and correct the prompt, and only then generate.
 *
 * Every button here stands alone. Analysis, the timeline and the AI prompt are advice: if one fails
 * or the creator disagrees with it, they can still choose settings, write their own prompt and
 * generate. Nothing renders a video except "Generate video", and it sends the editor's text exactly.
 */
export default function VideoStudioPanel({ shot, projectId, previousShot, generating, onGenerated }) {
  const dispatch = useDispatch();
  const args = { projectId, shotId: shot.id };
  // Polled only while post-production is taking the previous shot's last frame; reading the plan is
  // what picks the finished frame up.
  const [extracting, setExtracting] = React.useState(false);
  const { data: plan, isLoading, isFetching, error: loadError, refetch } = useGetShotGenerationPlanQuery(args, {
    pollingInterval: extracting ? 3000 : 0,
  });
  React.useEffect(() => {
    setExtracting(plan?.continuationFrame?.status === "EXTRACTING");
  }, [plan?.continuationFrame?.status]);

  const [analyze, analyzeState] = useAnalyzeShotGenerationPlanMutation();
  const [selectSettings, settingsState] = useSelectShotGenerationSettingsMutation();
  const [buildTimeline, timelineState] = useBuildShotGenerationTimelineMutation();
  const [composePrompt, composeState] = useComposeShotGenerationPromptMutation();
  const [saveDraft, saveState] = useSaveShotGenerationDraftMutation();
  const [resetDraft, resetState] = useResetShotGenerationDraftMutation();
  const [validatePrompt, validateState] = useValidateShotGenerationPromptMutation();
  const [attachFrame, attachState] = useAttachShotContinuationFrameMutation();
  const [detachFrame, detachState] = useDetachShotContinuationFrameMutation();
  const [generate, generateState] = useGenerateShotFromPlanMutation();
  const [retimeLine, retimeState] = useRetimeShotDialogueMutation();
  const [saveShot, saveLineState] = useUpdatePreProductionShotMutation();

  // The editor's text is local until "Save draft". It follows the server only while the creator has
  // not touched it, so a new recommendation never overwrites an edit in progress.
  const [editorText, setEditorText] = React.useState("");
  const [editorTouched, setEditorTouched] = React.useState(false);
  const [validation, setValidation] = React.useState(null);
  const [rephrase, setRephrase] = React.useState(null);
  const [stepError, setStepError] = React.useState({});

  React.useEffect(() => {
    if (!editorTouched) setEditorText(savedPromptText(plan));
  }, [plan, editorTouched]);

  const run = async (step, action, success) => {
    setStepError((e) => ({ ...e, [step]: null }));
    try {
      const result = await action().unwrap();
      if (success) dispatch(showFlash({ message: success, type: "success" }));
      // Every step can change what the prompt is built from.
      refetchInputs();
      return result;
    } catch (error) {
      const message = error?.data?.message || error?.data?.error || "That did not work -- try again.";
      setStepError((e) => ({ ...e, [step]: message }));
      return null;
    }
  };

  if (isLoading) {
    return <StudioShell><p className="flex items-center gap-2 text-[11px] font-semibold text-slate-400"><Loader2 size={12} className="animate-spin" /> Reading this shot's plan…</p></StudioShell>;
  }
  if (loadError || !plan) {
    return (
      <StudioShell>
        <ErrorLine message={loadError?.data?.message || "Could not load this shot's plan."} onRetry={refetch} retrying={isFetching} />
      </StudioShell>
    );
  }

  const flags = staleness(plan);
  const settings = plan.settings ?? {};
  const duration = settings.generationDurationSeconds;
  const fps = settings.generationFps;
  const caps = plan.capabilities ?? { supportedDurationsSeconds: [], supportedFps: [] };
  const assessment = plan.assessment;
  const unsaved = hasUnsavedEdits(editorText, plan);
  const blockers = generateBlockers(plan, editorText);
  const maxChars = plan.prompt?.maxChars;
  const line = (shot.voiceOver || (shot.shotType === "DIALOGUE" ? shot.scriptLine : "") || "").trim();
  const lineField = shot.voiceOver ? "voiceOver" : "scriptLine";
  const inFlight = generating || generateState.isLoading;

  const chooseSettings = (nextDuration, nextFps) => run("settings",
    () => selectSettings({ ...args, generationDurationSeconds: Number(nextDuration), generationFps: nextFps === "" || nextFps == null ? null : Number(nextFps) }));

  const handleCompose = async () => {
    const result = await run("prompt", () => composePrompt(args), "New AI recommendation ready");
    // The editor follows the recommendation only if the creator has no edit of their own in it.
    if (result && !editorTouched && result.prompt?.userEditedPrompt == null) setEditorText(result.prompt.aiRecommendedPrompt ?? "");
  };

  const handleSave = async () => {
    const result = await run("prompt", () => saveDraft({ ...args, prompt: editorText, expectedRevision: plan.prompt.draftRevision }), "Draft saved");
    if (result) setEditorTouched(false);
  };

  const handleReset = async () => {
    if (unsaved && !window.confirm("Discard your unsaved edits and go back to the AI recommendation?")) return;
    const result = await run("prompt", () => resetDraft(args), "Back to the AI recommendation");
    if (result) {
      setEditorText(result.prompt?.aiRecommendedPrompt ?? "");
      setEditorTouched(false);
    }
  };

  const handleValidate = async () => {
    setValidation(null);
    const result = await run("validate", () => validatePrompt({ ...args, prompt: editorText }));
    if (result) setValidation(result);
  };

  const handleGenerate = async () => {
    const result = await run("generate", () => generate({ ...args, prompt: editorText }));
    if (result) {
      dispatch(showFlash({ message: "Queued — generating this shot from your prompt.", type: "info" }));
      onGenerated?.(result.job);
    }
  };

  const handleRephrase = async () => {
    setRephrase(null);
    const target = Math.max(1, Number(duration) - 0.4);
    const result = await run("rephrase", () => retimeLine({ projectId, dialogue: line, targetSeconds: target, shotId: shot.id }));
    if (result) setRephrase(result);
  };

  const acceptRephrased = async () => {
    const saved = await run("rephrase", () => saveShot({ projectId, shotId: shot.id, [lineField]: rephrase.rewritten }),
      "Line updated — re-analyse so the plan uses it");
    if (saved !== null) setRephrase(null);
  };

  return (
    <StudioShell>
      {/* A. Shot context */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-purple-200"><Clapperboard size={12} /> Video studio</span>
        <Chip>Planned {formatSeconds(plan.plannedDurationSeconds)}s</Chip>
        {duration != null && <Chip tone="purple">Generating {duration}s{fps ? ` · ${fps} fps` : ""}</Chip>}
        <Chip>{plan.modelId}{caps.declared === false ? " (limits not declared)" : ""}</Chip>
      </div>

      {/* B. AI recommendation */}
      <Section title="1 · Analyse the shot" hint="Finds every planned action and how short the clip can be without losing any.">
        <div className="flex flex-wrap items-center gap-2">
          <StepButton onClick={() => run("analyze", () => analyze(args), "Analysis ready")} busy={analyzeState.isLoading} icon={ScanSearch}>
            {assessment ? "Re-analyse" : "Analyse shot"}
          </StepButton>
          {assessment && <span className="text-[10px] text-slate-500">Analysed {new Date(assessment.assessedAt).toLocaleString()}</span>}
        </div>
        <ErrorLine message={stepError.analyze} onRetry={() => run("analyze", () => analyze(args))} retrying={analyzeState.isLoading} />
        {assessment && (
          <div className="space-y-2 rounded-md border border-white/10 bg-white/[0.02] p-2.5">
            <div className="flex flex-wrap gap-2">
              <Chip tone={assessment.shorterGenerationSuitable ? "green" : "slate"}>
                {assessment.shorterGenerationSuitable ? "Can be generated shorter" : "Needs its full length"}
              </Chip>
              <Chip tone="purple">Recommended {assessment.recommendedDurationSeconds ?? "–"}s{assessment.recommendedGenerationFps ? ` · ${assessment.recommendedGenerationFps} fps` : ""}</Chip>
              <Chip>Minimum viable {formatSeconds(assessment.minimumViableDurationSeconds)}s</Chip>
            </div>
            {assessment.reasoning && <p className="text-[11px] leading-relaxed text-slate-300">{assessment.reasoning}</p>}
            {assessment.risks?.length > 0 && (
              <ul className="list-disc space-y-0.5 pl-4 text-[10px] text-amber-200/90">{assessment.risks.map((r) => <li key={r}>{r}</li>)}</ul>
            )}
            <IssueList title="The assessment failed these checks — re-analyse or choose settings yourself" issues={plan.assessmentIssues} />
          </div>
        )}
        <ActionTable plan={plan} />
      </Section>

      {/* C. Generation controls */}
      <Section title="2 · Generation settings" hint="Only durations and frame rates this model can render are offered.">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-[10px] font-bold text-slate-400">Duration
            <select value={duration ?? ""} onChange={(e) => chooseSettings(e.target.value, fps ?? caps.supportedFps?.[0] ?? "")}
              disabled={settingsState.isLoading} className="creator-input ml-1.5 px-2 py-1 text-[11px]">
              <option value="" disabled>choose</option>
              {caps.supportedDurationsSeconds.map((d) => <option key={d} value={d}>{d}s{d === assessment?.recommendedDurationSeconds ? " (recommended)" : ""}</option>)}
            </select>
          </label>
          <label className="text-[10px] font-bold text-slate-400">Frame rate
            <select value={fps ?? ""} onChange={(e) => chooseSettings(duration, e.target.value)}
              disabled={settingsState.isLoading || duration == null || caps.supportedFps.length === 0} className="creator-input ml-1.5 px-2 py-1 text-[11px]">
              {caps.supportedFps.length === 0 && <option value="">model default</option>}
              {caps.supportedFps.map((f) => <option key={f} value={f}>{f} fps</option>)}
            </select>
          </label>
          {settingsState.isLoading && <Loader2 size={12} className="animate-spin text-slate-400" />}
          {assessment?.recommendedDurationSeconds && assessment.recommendedDurationSeconds !== duration && (
            <button type="button" className="text-[10px] font-bold text-purple-300 hover:text-purple-200"
              onClick={() => chooseSettings(assessment.recommendedDurationSeconds, assessment.recommendedGenerationFps ?? fps ?? "")}>
              Use recommended {assessment.recommendedDurationSeconds}s
            </button>
          )}
        </div>
        {caps.supportedFps.length === 1 && <p className="text-[10px] text-slate-500">{plan.modelId} renders at {caps.supportedFps[0]} fps only; it takes no frame rate as input.</p>}
        {duration != null && plan.plannedDurationSeconds != null && duration < Number(plan.plannedDurationSeconds) && (
          <p className="text-[10px] text-slate-400">
            Generated at {duration}s, then slowed to the planned {formatSeconds(plan.plannedDurationSeconds)}s in post-production
            ({(Number(plan.plannedDurationSeconds) / duration).toFixed(1)}× slower, frames interpolated) with the line and music laid on at normal speed.
            {Number(plan.plannedDurationSeconds) / duration > 2 && " More than 2× slower can look unnatural even with interpolation."}
          </p>
        )}
        <IssueList tone="amber" issues={settings.warnings} />
        <ErrorLine message={stepError.settings} />

        {/* Smart actions that change the shot itself */}
        <div className="flex flex-wrap gap-2 pt-1">
          {line && duration != null && (
            <StepButton subtle onClick={handleRephrase} busy={retimeState.isLoading} icon={Wand2}>Rephrase line to fit {duration}s</StepButton>
          )}
          {previousShot && !plan.continuationFrame && (
            <StepButton subtle onClick={() => run("continuation", () => attachFrame(args))} busy={attachState.isLoading} icon={Link2}>
              Continue from shot {previousShot.shotNumber}'s last frame
            </StepButton>
          )}
        </div>
        <ErrorLine message={stepError.rephrase} />
        <ErrorLine message={stepError.continuation} />
        {rephrase && (
          <div className="rounded-md border border-purple-400/20 bg-purple-500/[0.06] p-2.5 text-[11px]">
            <p className="text-slate-400 line-through">{rephrase.original}</p>
            <p className="mt-1 font-semibold text-slate-100">{rephrase.rewritten}</p>
            <p className="mt-1 text-[10px] text-slate-400">About {formatSeconds(rephrase.predictedSeconds)}s to say. {rephrase.whatChanged}</p>
            <div className="mt-2 flex gap-2">
              <StepButton onClick={acceptRephrased} busy={saveLineState.isLoading} icon={CheckCircle2}>Use this line</StepButton>
              <button type="button" onClick={() => setRephrase(null)} className="text-[10px] font-bold text-slate-400">Keep mine</button>
            </div>
          </div>
        )}
        {plan.continuationFrame?.status === "EXTRACTING" && (
          <p className="flex items-center gap-2 text-[10px] font-semibold text-slate-300">
            <Loader2 size={12} className="animate-spin" /> Taking the previous shot's last frame… this usually takes a few seconds.
          </p>
        )}
        {plan.continuationFrame?.status === "FAILED" && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-amber-400/25 bg-amber-500/[0.06] p-2 text-[10px] text-amber-100">
            <span className="flex-1">Could not take the last frame: {plan.continuationFrame.error}</span>
            <button type="button" className="font-bold underline" disabled={attachState.isLoading}
              onClick={() => run("continuation", () => attachFrame({ ...args, sourceShotId: plan.continuationFrame.sourceShotId }))}>Try again</button>
            <button type="button" className="font-bold underline" disabled={detachState.isLoading}
              onClick={() => run("continuation", () => detachFrame(args))}>Dismiss</button>
          </div>
        )}
        {plan.continuationFrame?.status === "READY" && (
          <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.02] p-2">
            {plan.continuationFrame.imageUrl && <img src={plan.continuationFrame.imageUrl} alt="Previous shot's last frame" className="h-14 w-auto rounded" />}
            <p className="flex-1 text-[10px] text-slate-300">Opens on the previous shot's last frame ({formatSeconds((plan.continuationFrame.timestampMs ?? 0) / 1000)}s) and finishes that movement first.</p>
            <button type="button" onClick={() => run("continuation", () => detachFrame(args))} disabled={detachState.isLoading}
              className="text-slate-400 hover:text-rose-300" title="Remove"><X size={13} /></button>
          </div>
        )}
      </Section>

      {/* D. Action timeline */}
      <Section title="3 · Second-by-second timeline" hint="Every planned action, timed across the clip you are generating.">
        <div className="flex flex-wrap items-center gap-2">
          <StepButton onClick={() => run("timeline", () => buildTimeline(args), "Timeline ready")} busy={timelineState.isLoading} icon={Film} disabled={duration == null}>
            {plan.timeline?.length ? `Rebuild for ${duration}s` : "Build timeline"}
          </StepButton>
          {flags.timelineStale && <StaleNote>Built for {plan.timelineDurationSeconds}s{plan.timelineFps ? ` · ${plan.timelineFps} fps` : ""} — rebuild for the current settings.</StaleNote>}
        </div>
        <ErrorLine message={stepError.timeline} onRetry={() => run("timeline", () => buildTimeline(args))} retrying={timelineState.isLoading} />
        {plan.timeline?.length > 0 && (
          <ol className={`space-y-1 ${flags.timelineStale ? "opacity-60" : ""}`}>
            {plan.timeline.map((interval, i) => (
              <li key={i} className="flex gap-2 text-[11px]">
                <span className="w-16 shrink-0 font-mono text-slate-400">{formatSeconds(interval.startSeconds)}–{formatSeconds(interval.endSeconds)}s</span>
                <span className="w-10 shrink-0 font-mono text-purple-300">{interval.actionId}</span>
                <span className="text-slate-200">{interval.action}
                  {interval.subjectState && <span className="text-slate-400"> · {interval.subjectState}</span>}
                  {interval.cameraBehavior && <span className="text-slate-500"> · camera: {interval.cameraBehavior}</span>}
                  {interval.holdRequired && <span className="text-amber-300/80"> · hold</span>}
                </span>
              </li>
            ))}
          </ol>
        )}
        <IssueList title="The timeline failed these checks" issues={plan.timelineIssues} />
      </Section>

      {/* E. Editable prompt */}
      <Section title="4 · Video prompt" hint="The AI writes a recommendation; you have the final word on every line of it.">
        <div className="flex flex-wrap items-center gap-2">
          <StepButton onClick={handleCompose} busy={composeState.isLoading} icon={Sparkles} disabled={duration == null}>
            {plan.prompt?.aiRecommendedPrompt ? "Regenerate recommendation" : "Write prompt"}
          </StepButton>
          {flags.promptStale && <StaleNote>Recommendation was written for {plan.prompt.promptDurationSeconds}s{plan.prompt.promptFps ? ` · ${plan.prompt.promptFps} fps` : ""}.</StaleNote>}
          {flags.promptMissesContinuation && <StaleNote>Written before the last-frame change.</StaleNote>}
          {flags.promptOlderThanAnalysis && <StaleNote>Written before the latest analysis.</StaleNote>}
        </div>
        {flags.newerRecommendationThanDraft && (
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-sky-200">
            A newer AI recommendation exists than your saved draft.
            <button type="button" className="font-bold underline" onClick={() => {
              if (unsaved && !window.confirm("Replace your unsaved edits with the new recommendation?")) return;
              setEditorText(plan.prompt.aiRecommendedPrompt ?? ""); setEditorTouched(true);
            }}>Load it into the editor</button>
          </div>
        )}
        <ErrorLine message={stepError.prompt} />
        <textarea
          value={editorText}
          onChange={(e) => { setEditorText(e.target.value); setEditorTouched(true); setValidation(null); }}
          rows={9}
          placeholder="Write the prompt yourself, or let the AI write a recommendation first."
          className="creator-input w-full text-[11px] font-medium leading-relaxed"
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-[10px] font-bold ${maxChars && editorText.length > maxChars ? "text-rose-300" : "text-slate-500"}`}>
            {editorText.length}{maxChars ? ` / ${maxChars}` : ""} characters
          </span>
          {unsaved && <span className="text-[10px] font-bold text-amber-300">Unsaved edits</span>}
          <div className="ml-auto flex flex-wrap gap-2">
            <StepButton subtle onClick={handleSave} busy={saveState.isLoading} icon={Save} disabled={!unsaved || !editorText.trim()}>Save draft</StepButton>
            <StepButton subtle onClick={handleReset} busy={resetState.isLoading} icon={RotateCcw} disabled={!differsFromRecommendation(editorText, plan)}>Reset to AI recommendation</StepButton>
            <StepButton subtle onClick={handleValidate} busy={validateState.isLoading} icon={ShieldCheck} disabled={!editorText.trim()}>Validate prompt</StepButton>
          </div>
        </div>
        <ErrorLine message={stepError.validate} onRetry={handleValidate} retrying={validateState.isLoading} />
        {validation && <ValidationResult result={validation} />}
      </Section>

      {/* F. Generate */}
      <div className="flex flex-col gap-1.5 border-t border-white/10 pt-3">
        <button
          type="button"
          disabled={blockers.length > 0 || inFlight}
          title={blockers.join("\n") || undefined}
          onClick={handleGenerate}
          className="creator-primary flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-white disabled:opacity-50"
        >
          {inFlight ? <Loader2 size={13} className="animate-spin" /> : <Clapperboard size={13} />}
          {inFlight ? "Generating… (can take a few minutes)" : `Generate video${duration ? ` · ${duration}s` : ""}`}
        </button>
        {blockers.length > 0 && !inFlight && <p className="text-[10px] text-slate-500">{blockers[0]}</p>}
        {unsaved && blockers.length === 0 && <p className="text-[10px] text-slate-500">Generates exactly what is in the editor, including your unsaved edits.</p>}
        <ErrorLine message={stepError.generate} onRetry={handleGenerate} retrying={generateState.isLoading} />
      </div>
    </StudioShell>
  );
}

function StudioShell({ children }) {
  return <div className="space-y-3 rounded-lg border border-purple-400/20 bg-purple-500/[0.03] p-3">{children}</div>;
}

function Section({ title, hint, children }) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">{title}</p>
        {hint && <p className="text-[10px] text-slate-500">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function StepButton({ onClick, busy, icon: Icon, children, disabled, subtle }) {
  const base = subtle
    ? "border-white/15 bg-white/5 text-slate-200 hover:border-purple-400/40 hover:text-purple-200"
    : "border-purple-400/30 bg-purple-500/15 text-purple-100 hover:bg-purple-500/25";
  return (
    <button type="button" onClick={onClick} disabled={busy || disabled}
      className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-50 ${base}`}>
      {busy ? <Loader2 size={12} className="animate-spin" /> : Icon ? <Icon size={12} /> : null}
      {children}
    </button>
  );
}

function Chip({ children, tone = "slate" }) {
  const tones = {
    slate: "border-white/10 bg-white/5 text-slate-300",
    purple: "border-purple-400/25 bg-purple-500/10 text-purple-200",
    green: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
  };
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${tones[tone]}`}>{children}</span>;
}

function StaleNote({ children }) {
  return <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-300"><RefreshCw size={10} /> {children}</span>;
}

function ErrorLine({ message, onRetry, retrying }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-2 rounded-md border border-rose-400/25 bg-rose-500/[0.07] px-2.5 py-1.5 text-[10px] font-semibold text-rose-100">
      <AlertTriangle size={12} className="shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && <button type="button" disabled={retrying} onClick={onRetry} className="font-bold underline disabled:opacity-50">Retry</button>}
    </div>
  );
}

function IssueList({ title, issues, tone = "rose" }) {
  if (!issues?.length) return null;
  const color = tone === "amber" ? "text-amber-200" : "text-rose-200";
  return (
    <div className={`text-[10px] ${color}`}>
      {title && <p className="font-bold">{title}</p>}
      <ul className="list-disc pl-4">
        {issues.map((issue, i) => <li key={i}>{issue.actionId ? <b>{issue.actionId}: </b> : null}{issue.message}</li>)}
      </ul>
    </div>
  );
}

function ActionTable({ plan }) {
  const rows = coverageRows(plan);
  if (!rows.length) return null;
  return (
    <div className="rounded-md border border-white/10">
      <p className="border-b border-white/10 px-2.5 py-1.5 text-[10px] font-bold text-slate-400">
        Required actions ({rows.length}) — every one must appear in the clip
      </p>
      <ul className="divide-y divide-white/5">
        {rows.map((row) => {
          const problems = issuesFor(plan.assessmentIssues, row.actionId);
          return (
            <li key={row.actionId} className="flex gap-2 px-2.5 py-1.5 text-[11px]">
              <span className="w-10 shrink-0 font-mono text-purple-300">{row.actionId}</span>
              <span className="flex-1 text-slate-200">
                {row.description}
                {row.fixedSeconds != null && <span className="text-slate-500"> · needs {formatSeconds(row.fixedSeconds)}s</span>}
                {problems.map((p) => <span key={p.code} className="block text-[10px] text-rose-300">{p.message}</span>)}
              </span>
              <span className="w-20 shrink-0 text-right font-mono text-[10px] text-slate-400">
                {row.coverage ? `${formatSeconds(row.coverage.startSeconds)}–${formatSeconds(row.coverage.endSeconds)}s` : "–"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ValidationResult({ result }) {
  const clean = !result.errors.length && !result.warnings.length && !result.aiFindings.length && !result.aiReviewError;
  return (
    <div className="space-y-2 rounded-md border border-white/10 bg-white/[0.02] p-2.5">
      {clean && <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-200"><CheckCircle2 size={12} /> No problems found. This is a check against the plan, not a promise about the video.</p>}
      <IssueList title="Must fix before generating" issues={result.errors} />
      <IssueList title="Worth a look" tone="amber" issues={result.warnings} />
      {result.aiFindings.length > 0 && (
        <div className="text-[10px] text-sky-200">
          <p className="font-bold">The AI review thinks these may not match the plan — your call:</p>
          <ul className="list-disc pl-4">
            {result.aiFindings.map((f, i) => (
              <li key={i}>{f.actionId ? <b>{f.actionId}: </b> : null}{f.message} <span className="text-sky-300/60">({f.category?.toLowerCase().replaceAll("_", " ")}, {f.severity?.toLowerCase()})</span></li>
            ))}
          </ul>
        </div>
      )}
      {result.aiReviewError && <p className="text-[10px] text-slate-400">AI review unavailable: {result.aiReviewError}. The checks above still ran.</p>}
    </div>
  );
}
