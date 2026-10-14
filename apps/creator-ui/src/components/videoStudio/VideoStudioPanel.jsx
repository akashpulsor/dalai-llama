import React from "react";
import { useDispatch } from "react-redux";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Circle, Clapperboard, Link2, Loader2, RefreshCw, Sparkles, X } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useAnalyzeShotGenerationPlanMutation,
  useAttachShotContinuationFrameMutation,
  useBuildShotGenerationTimelineMutation,
  useComposeShotGenerationPromptMutation,
  useEditShotGenerationTimelineMutation,
  useDetachShotContinuationFrameMutation,
  useGenerateShotFromPlanMutation,
  useGetShotGenerationPlanQuery,
  useListShotPromptVersionsQuery,
  useResetShotGenerationDraftMutation,
  useSaveShotGenerationDraftMutation,
  useSelectShotGenerationSettingsMutation,
  useValidateShotGenerationPromptMutation,
  creatorApi,
} from "../../api/creatorEndpoints.js";
import {
  closeTimelineGaps,
  differsFromRecommendation,
  formatSeconds,
  generateBlockers,
  hasUnsavedEdits,
  lengthChanged,
  planStatus,
  savedPromptText,
  shotLengthClip,
  staleness,
} from "./studioState.js";
import VideoPromptCard from "./videoPrompt/VideoPromptCard.jsx";
import ConfirmDialog from "./videoPrompt/ConfirmDialog.jsx";
import { ActionTimeline, RequiredActions, TimelineEditor, TimelineProblems } from "./ActionViews.jsx";
import { PromptFreshness, buildCardData, draftStaleReasons, estimateFor, formatEstimate, needsGenerateConfirm } from "./videoPrompt/promptModel.js";

/**
 * The video studio for one shot: choose how long to generate it for, let the plan (analysis,
 * second-by-second timeline, prompt) be built for that length with one button, read and correct the
 * prompt, and only then approve and generate.
 *
 * Every button here stands alone. Analysis, the timeline and the AI prompt are advice: if one fails
 * or the creator disagrees with it, they can still choose settings, write their own prompt and
 * generate. Nothing renders a video except "Generate video", and it sends the editor's text exactly.
 */
/**
 * @param {{ lengthRow?: React.ReactNode }} props  lengthRow: the shot's own length (in the film) and
 *   its voice fit, shown here so the studio has the shot's one length control, not a second one.
 */
export default function VideoStudioPanel({ shot, projectId, previousShot, generating, onGenerated, onRegeneratePrompt, onReject, seedDraft, lengthRow = null }) {
  const [regenerating, setRegenerating] = React.useState(false);
  // Approve & generate asks first: what will be sent, for how long, and what it costs.
  const [confirmApprove, setConfirmApprove] = React.useState(false);
  // A new object opens the prompt's text box: Edit on a sent version, or Reject & rewrite.
  const [editRequest, setEditRequest] = React.useState(seedDraft ?? null);
  const [rejecting, setRejecting] = React.useState(false);
  const { data: promptRows = [] } = useListShotPromptVersionsQuery(shot.id);
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
  const [editTimeline, editTimelineState] = useEditShotGenerationTimelineMutation();
  const [editingTimeline, setEditingTimeline] = React.useState(false);
  const [composePrompt, composeState] = useComposeShotGenerationPromptMutation();
  const [saveDraft, saveState] = useSaveShotGenerationDraftMutation();
  const [resetDraft, resetState] = useResetShotGenerationDraftMutation();
  const [validatePrompt, validateState] = useValidateShotGenerationPromptMutation();
  const [attachFrame, attachState] = useAttachShotContinuationFrameMutation();
  const [detachFrame, detachState] = useDetachShotContinuationFrameMutation();
  const [generate, generateState] = useGenerateShotFromPlanMutation();

  // The editor's text is local until "Save draft". It follows the server only while the creator has
  // not touched it, so a new recommendation never overwrites an edit in progress.
  const [editorText, setEditorText] = React.useState("");
  const [editorTouched, setEditorTouched] = React.useState(false);
  const [validation, setValidation] = React.useState(null);
  const [stepError, setStepError] = React.useState({});

  React.useEffect(() => {
    if (!editorTouched) setEditorText(savedPromptText(plan));
  }, [plan, editorTouched]);

  // Edit on a sent version (or Reject & rewrite) opens the studio with that text as a new draft.
  React.useEffect(() => {
    if (seedDraft?.text == null) return;
    setEditorText(seedDraft.text);
    setEditorTouched(true);
    setValidation(null);
    setEditRequest(seedDraft);
  }, [seedDraft]);

  const run = async (step, action, success) => {
    setStepError((e) => ({ ...e, [step]: null }));
    try {
      const result = await action().unwrap();
      if (success) dispatch(showFlash({ message: success, type: "success" }));
      // Every step can change what the prompt is built from: the checklist (its own query) refreshes.
      dispatch(creatorApi.util.invalidateTags([{ type: "CreatorHomeProjects", id: `prompt-inputs-${args.shotId}` }]));
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
  // The shot's own length, as saved: when it moved after the plan was built, everything is behind.
  const shotSeconds = shot.durationSeconds ?? null;
  const staleReasons = [
    ...(lengthChanged(plan, shotSeconds) ? [`Written for a ${formatSeconds(plan.plannedDurationSeconds)}s shot, the shot is now ${shotSeconds}s`] : []),
    ...draftStaleReasons(plan, flags),
  ];
  const freshness = staleReasons.length ? PromptFreshness.STALE : PromptFreshness.CURRENT;
  const settings = plan.settings ?? {};
  const duration = settings.generationDurationSeconds;
  const fps = settings.generationFps;
  // A model with one frame rate takes no fps setting; frames are still counted at that rate.
  const frameRate = fps || (plan.capabilities?.supportedFps?.length === 1 ? plan.capabilities.supportedFps[0] : null);
  const caps = plan.capabilities ?? { supportedDurationsSeconds: [], supportedFps: [] };
  const assessment = plan.assessment;
  const unsaved = hasUnsavedEdits(editorText, plan);
  const blockers = generateBlockers(plan, editorText);
  const maxChars = plan.prompt?.maxChars;
  const inFlight = generating || generateState.isLoading;
  const promptCard = buildCardData({
    rows: promptRows,
    draft: { text: editorText, aiText: plan.prompt?.aiRecommendedPrompt ?? null, generateSeconds: duration ?? null, fps: frameRate, staleReasons },
  });
  const cost = formatEstimate(estimateFor(promptCard.history, duration));
  const status = planStatus(plan, flags, draftStaleReasons(plan, flags), shotSeconds);
  const planned = plan.plannedDurationSeconds == null ? null : Number(plan.plannedDurationSeconds);
  const fitSeconds = shotLengthClip(caps.supportedDurationsSeconds, planned);
  // A spoken line is laid on at normal speed, so a slowed clip puts the lips out of sync.
  const spoken = !!(shot.voiceOver || (shot.shotType === "DIALOGUE" && shot.scriptLine));
  const planBusy = regenerating || analyzeState.isLoading || timelineState.isLoading || composeState.isLoading;

  const chooseSettings = async (nextDuration, nextFps) => {
    // No dialog afterwards: the plan bar turns amber and says what was built for the old length,
    // and Update is one click away -- the creator decides when, not a pop-up.
    await run("settings",
      () => selectSettings({ ...args, generationDurationSeconds: Number(nextDuration), generationFps: nextFps === "" || nextFps == null ? null : Number(nextFps) }));
  };

  /** The new AI version replaces the editor's text. A saved draft of the creator's stays saved (and
   * Save draft would replace it) -- only the editor moves. */
  const showNewVersion = (prompt) => {
    setEditorText(prompt?.aiRecommendedPrompt ?? "");
    setEditorTouched(prompt?.userEditedPrompt != null);
    setValidation(null);
  };

  const handleCompose = async () => {
    if (unsaved && !window.confirm("Regenerating replaces your unsaved edits with a new AI version. Continue?")) return;
    if (onRegeneratePrompt) {
      // The shot's Prepare: redoes the analysis if the shot changed and the timeline if the seconds
      // changed (or it fails its checks), writes the prompt and saves it as a new version.
      setRegenerating(true);
      try {
        await onRegeneratePrompt();
        const fresh = await refetch();
        if (fresh.data) showNewVersion(fresh.data.prompt);
        dispatch(creatorApi.util.invalidateTags([{ type: "CreatorHomeProjects", id: `prompt-inputs-${args.shotId}` }]));
      } finally {
        setRegenerating(false);
      }
      return;
    }
    // Without the shot's Prepare: the same steps one by one, skipping what is already current.
    if (status.steps[0].state !== "done" && !(await run("plan", () => analyze(args)))) return;
    if ((status.steps[0].state !== "done" || status.steps[1].state !== "done") && !(await run("plan", () => buildTimeline(args)))) return;
    const result = await run("plan", () => composePrompt(args), "Plan updated");
    if (result) showNewVersion(result.prompt);
  };

  /** The creator's corrected timeline. Nothing else is rewritten until they press Update. */
  const saveTimeline = async (intervals) => {
    const result = await run("timeline", () => editTimeline({ ...args, intervals }),
      "Timeline saved — press Update to rewrite the prompt from it");
    if (result) setEditingTimeline(false);
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

  /** Rejects the prepared render waiting for approval, if there is one, and opens the text to rewrite. */
  const handleReject = async () => {
    setRejecting(true);
    try {
      if (onReject) await onReject();
    } finally {
      setRejecting(false);
    }
    setEditRequest({});
  };

  return (
    <StudioShell>
      {/* A. Shot context */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-purple-200"><Clapperboard size={12} /> Video studio</span>
        <Chip tone="purple">Shot {formatSeconds(plan.plannedDurationSeconds)}s{frameRate ? ` · ${frameRate} fps` : ""}</Chip>
        <Chip>{plan.modelId}{caps.declared === false ? " (limits not declared)" : ""}</Chip>
        {cost && <Chip tone="green" title="Estimated provider cost for the generation length">Est. cost {cost}{duration ? ` · ${duration}s` : ""}</Chip>}
      </div>

      {/* B. Length -- the shot's length in the film, and the clip the model renders for it. These were
          two controls in two places; they are one decision. */}
      <Section title="Length">
        {lengthRow}
        <ClipLine
          planned={planned}
          duration={duration}
          fitSeconds={fitSeconds}
          saver={assessment?.shorterGenerationSuitable && assessment.recommendedDurationSeconds < (planned ?? 0)
            ? assessment.recommendedDurationSeconds : null}
          spoken={spoken}
          busy={settingsState.isLoading || planBusy}
          onChoose={(seconds) => chooseSettings(seconds, fps ?? caps.supportedFps?.[0] ?? "")}
        />
        {caps.supportedFps.length > 1 && (
          <label className="text-[10px] font-bold text-slate-400">Frame rate
            <select value={fps ?? ""} onChange={(e) => chooseSettings(duration, e.target.value)}
              disabled={settingsState.isLoading || planBusy || duration == null} className="creator-input ml-1.5 px-2 py-1 text-[11px]">
              {caps.supportedFps.map((f) => <option key={f} value={f}>{f} fps</option>)}
            </select>
          </label>
        )}
        <IssueList tone="amber" issues={settings.warnings} />
        <ErrorLine message={stepError.settings} />

        {previousShot && !plan.continuationFrame && (
          <StepButton subtle onClick={() => run("continuation", () => attachFrame(args))} busy={attachState.isLoading} icon={Link2}>
            Continue from shot {previousShot.shotNumber}'s last frame
          </StepButton>
        )}
        <ErrorLine message={stepError.continuation} />
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

      {/* C. The plan -- analysis, timeline and prompt as one status line with one button. Each used to
          be a numbered step with its own rebuild, and changing the length opened a dialog on top. */}
      <PlanBar
        status={status}
        duration={duration}
        busy={planBusy}
        disabled={duration == null}
        onUpdate={handleCompose}
      />
      <ErrorLine message={stepError.plan} onRetry={handleCompose} retrying={planBusy} />

      {(assessment || plan.timeline?.length > 0) && (
        <div className="divide-y divide-white/5 rounded-md border border-white/10">
          {assessment && (
            <Fold title="What the shot needs" summary={status.steps[0].detail} problems={plan.assessmentIssues?.length ?? 0}>
              <div className="flex flex-wrap gap-2">
                <Chip tone={assessment.shorterGenerationSuitable ? "green" : "slate"}>
                  {assessment.shorterGenerationSuitable ? "Can be generated shorter" : "Needs its full length"}
                </Chip>
                <Chip>Shortest that works {formatSeconds(assessment.minimumViableDurationSeconds)}s</Chip>
              </div>
              {assessment.reasoning && <p className="text-[11px] leading-relaxed text-slate-300">{assessment.reasoning}</p>}
              {assessment.risks?.length > 0 && (
                <ul className="list-disc space-y-0.5 pl-4 text-[10px] text-amber-200/90">{assessment.risks.map((r) => <li key={r}>{r}</li>)}</ul>
              )}
              <IssueList title="The analysis failed these checks — Update rebuilds it" issues={plan.assessmentIssues} />
              <RequiredActions plan={plan} />
            </Fold>
          )}
          {plan.timeline?.length > 0 && (
            <Fold title="Timeline" summary={`${plan.timeline.length} moments · ${status.steps[1].detail}`} problems={plan.timelineIssues?.length ?? 0}
              stale={flags.timelineStale}>
              {editingTimeline ? (
                <TimelineEditor intervals={plan.timeline} seconds={plan.timelineDurationSeconds ?? duration}
                  saving={editTimelineState.isLoading} onSave={saveTimeline} onCancel={() => setEditingTimeline(false)} />
              ) : (
                <>
                  <ActionTimeline intervals={plan.timeline} frameRate={frameRate} stale={flags.timelineStale} />
                  <button type="button" onClick={() => setEditingTimeline(true)} disabled={planBusy}
                    className="text-[10px] font-bold text-purple-300 hover:text-purple-200 disabled:opacity-50">Edit the timeline</button>
                </>
              )}
              <ErrorLine message={stepError.timeline} />
              <TimelineProblems issues={plan.timelineIssues} fixing={editTimelineState.isLoading}
                onFixTimes={() => saveTimeline(closeTimelineGaps(plan.timeline, plan.timelineDurationSeconds ?? duration))} />
            </Fold>
          )}
        </div>
      )}

      {/* D. The prompt -- one card, the only place its text is shown */}
      <VideoPromptCard
        shotId={shot.id}
        editRequest={editRequest}
        onUseVersion={(text) => {
          if (unsaved && !window.confirm("Replace your unsaved edits with that version?")) return;
          setEditorText(text); setEditorTouched(true); setValidation(null);
        }}
        draft={{
          text: editorText,
          onChange: (text) => { setEditorText(text); setEditorTouched(true); setValidation(null); },
          aiText: plan.prompt?.aiRecommendedPrompt ?? null,
          generateSeconds: duration ?? null,
          fps: frameRate,
          staleReasons,
          maxChars: maxChars ?? null,
          unsaved,
          writing: composeState.isLoading || regenerating,
          save: { onClick: handleSave, busy: saveState.isLoading, disabled: !unsaved || !editorText.trim() },
          reset: { onClick: handleReset, busy: resetState.isLoading, disabled: !differsFromRecommendation(editorText, plan) },
          validate: { onClick: handleValidate, busy: validateState.isLoading, disabled: !editorText.trim() },
          footer: (
            <>
              {flags.newerRecommendationThanDraft && (
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-sky-200">
                  A newer AI version exists than your saved draft.
                  <button type="button" className="font-bold underline" onClick={() => {
                    if (unsaved && !window.confirm("Replace your unsaved edits with the new AI version?")) return;
                    setEditorText(plan.prompt.aiRecommendedPrompt ?? ""); setEditorTouched(true);
                  }}>Load it into the editor</button>
                </div>
              )}
              <ErrorLine message={stepError.prompt} />
              <ErrorLine message={stepError.validate} onRetry={handleValidate} retrying={validateState.isLoading} />
              {validation && <ValidationResult result={validation} />}
            </>
          ),
        }}
      />

      {/* E. Approve & generate -- nothing renders until the creator approves this version */}
      <div className="flex flex-col gap-1.5 border-t border-white/10 pt-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleReject}
            disabled={inFlight || rejecting}
            className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-300 hover:border-white/25 disabled:opacity-50"
          >
            {rejecting ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
            Reject & rewrite
          </button>
          <button
            type="button"
            disabled={blockers.length > 0 || inFlight}
            title={blockers.join("\n") || undefined}
            onClick={() => setConfirmApprove(true)}
            className="creator-primary flex flex-1 items-center justify-center gap-2 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            {inFlight ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
            {inFlight ? "Generating… (can take a few minutes)" : `Approve & generate${duration ? ` · ${duration}s` : ""}${cost ? ` · ${cost}` : ""}`}
          </button>
        </div>
        {blockers.length > 0 && !inFlight && <p className="text-[10px] text-slate-500">{blockers[0]}</p>}
        {unsaved && blockers.length === 0 && <p className="text-[10px] text-slate-500">Approving sends exactly what is in the prompt, including your unsaved edits.</p>}
        <ErrorLine message={stepError.generate} onRetry={handleGenerate} retrying={generateState.isLoading} />
      </div>
      <ConfirmDialog
        open={confirmApprove}
        title={needsGenerateConfirm(freshness)
          ? "This prompt is out of date. Generate anyway?"
          : `Approve v${promptCard.current?.version ?? 1} and generate?`}
        body={(
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            <dt className="text-slate-500">Prompt</dt><dd>v{promptCard.current?.version ?? 1}{unsaved ? " (with unsaved edits)" : ""}</dd>
            <dt className="text-slate-500">Length</dt><dd>{duration}s{frameRate ? ` · ${frameRate} fps` : ""}</dd>
            <dt className="text-slate-500">Model</dt><dd>{plan.modelId}</dd>
            {cost && <><dt className="text-slate-500">Est. cost</dt><dd>{cost}</dd></>}
            {needsGenerateConfirm(freshness) && <><dt className="text-amber-300">Out of date</dt><dd className="text-amber-200">{staleReasons.join(" · ")}</dd></>}
          </dl>
        )}
        onCancel={() => setConfirmApprove(false)}
        primary={needsGenerateConfirm(freshness)
          ? { label: "Update first", icon: Sparkles, onClick: () => { setConfirmApprove(false); handleCompose(); } }
          : { label: "Approve & generate", icon: CheckCircle2, onClick: () => { setConfirmApprove(false); handleGenerate(); } }}
        secondary={needsGenerateConfirm(freshness)
          ? { label: "Generate anyway", icon: Clapperboard, onClick: () => { setConfirmApprove(false); handleGenerate(); } }
          : { label: "Cancel", onClick: () => setConfirmApprove(false) }}
      />
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

function Chip({ children, tone = "slate", title }) {
  const tones = {
    slate: "border-white/10 bg-white/5 text-slate-300",
    purple: "border-purple-400/25 bg-purple-500/10 text-purple-200",
    green: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
  };
  return <span title={title} className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${tones[tone]}`}>{children}</span>;
}

/**
 * What the model renders for the shot, in one sentence. The shot's own length is the plan; a
 * shorter, slowed clip is a cost saving the creator opts into, never the default.
 */
function ClipLine({ planned, duration, fitSeconds, saver, spoken, busy, onChoose }) {
  if (planned == null || duration == null) return null;
  const link = "font-bold text-purple-300 underline-offset-2 hover:underline disabled:opacity-50";
  if (duration < planned) {
    const slower = planned / duration;
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-amber-400/25 bg-amber-500/[0.06] px-2.5 py-1.5 text-[10px] text-amber-100">
        <span className="flex-1">
          Cost saver: a {duration}s clip, slowed {slower.toFixed(1)}× to fill the {formatSeconds(planned)}s shot.
          {spoken && " The line is spoken at normal speed over slowed picture, so lips will not match."}
          {!spoken && slower > 2 && " More than 2× slower can look unnatural."}
        </span>
        {fitSeconds != null && (
          <button type="button" className={link} disabled={busy} onClick={() => onChoose(fitSeconds)}>Generate the full {fitSeconds}s instead</button>
        )}
      </div>
    );
  }
  return (
    <p className="flex flex-wrap items-center gap-x-2 text-[10px] text-slate-500">
      <span>
        {duration === planned
          ? `The model renders exactly ${duration}s.`
          : `The model renders ${duration}s, trimmed to ${formatSeconds(planned)}s — it has no ${formatSeconds(planned)}s length.`}
      </span>
      {fitSeconds != null && duration !== fitSeconds && (
        <button type="button" className={link} disabled={busy} onClick={() => onChoose(fitSeconds)}>Use {fitSeconds}s</button>
      )}
      {saver != null && (
        <button type="button" className="font-semibold text-slate-400 hover:text-slate-200 disabled:opacity-50" disabled={busy}
          title={spoken ? "The line stays at normal speed over slowed picture, so lips will not match." : undefined}
          onClick={() => onChoose(saver)}>
          Save cost: generate {saver}s and slow it{spoken ? " (lips will not match)" : ""}
        </button>
      )}
    </p>
  );
}

const STEP_LOOK = {
  done: { Icon: CheckCircle2, className: "text-emerald-300" },
  stale: { Icon: RefreshCw, className: "text-amber-300" },
  missing: { Icon: Circle, className: "text-slate-500" },
};

/** Analysis → timeline → prompt as one line, and the one button that brings them up to date. */
function PlanBar({ status, duration, busy, disabled, onUpdate }) {
  const behind = !status.upToDate;
  const label = status.untouched ? "Plan this shot" : behind ? `Update for ${duration}s` : "Rebuild";
  return (
    <div className={`space-y-1.5 rounded-md border px-3 py-2 ${behind ? "border-amber-400/30 bg-amber-500/[0.06]" : "border-white/10 bg-white/[0.02]"}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <ol className="flex flex-1 flex-wrap items-center gap-x-1.5 gap-y-1 text-[10px]">
          {status.steps.map((step, i) => {
            const { Icon, className } = STEP_LOOK[step.state];
            return (
              <li key={step.key} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight size={11} className="text-slate-600" />}
                <Icon size={11} className={className} />
                <span className={`font-bold ${step.state === "missing" ? "text-slate-500" : "text-slate-200"}`}>{step.label}</span>
                {step.detail && <span className={step.state === "stale" ? "text-amber-200/90" : "text-slate-500"}>{step.detail}</span>}
              </li>
            );
          })}
        </ol>
        <button type="button" onClick={onUpdate} disabled={busy || disabled}
          className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-50 ${behind
            ? "border-amber-400/50 bg-amber-500/20 text-amber-50 hover:bg-amber-500/30"
            : "border-white/15 bg-white/5 text-slate-300 hover:border-purple-400/40 hover:text-purple-200"}`}>
          {busy ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          {busy ? "Working…" : label}
        </button>
      </div>
      {!busy && behind && status.problems.length > 0 && (
        <ul className="space-y-0.5 text-[10px] text-amber-100">
          {status.problems.map((problem) => <li key={problem} className="flex gap-1.5"><AlertTriangle size={10} className="mt-0.5 shrink-0 text-amber-300" />{problem}</li>)}
        </ul>
      )}
      <p className="text-[10px] text-slate-500">
        {busy ? "Finding the actions, timing them and writing the prompt — usually under a minute."
          : status.untouched ? `Finds every action in the shot, times them across the ${duration ?? "chosen"}s clip and writes the prompt.`
            : behind ? `To fix: press Update. It redoes only what is out of date for the ${duration}s clip and saves the prompt as a new version — the old one stays in History.`
              : `Everything is built for the ${duration}s clip.`}
      </p>
    </div>
  );
}

/** A closed-by-default section of plan detail; opens on its own when it has problems. */
function Fold({ title, summary, problems = 0, stale = false, children }) {
  return (
    <details open={problems > 0} className="group/fold">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-2.5 py-2 text-[10px]">
        <span className="font-extrabold uppercase tracking-wide text-slate-400">{title}</span>
        {summary && <span className={stale ? "text-amber-200/90" : "text-slate-500"}>{summary}</span>}
        {problems > 0 && <span className="flex items-center gap-1 font-bold text-rose-300"><AlertTriangle size={10} /> {problems} problem{problems === 1 ? "" : "s"}</span>}
        <ChevronDown size={12} className="ml-auto text-slate-500 transition-transform group-open/fold:rotate-180" />
      </summary>
      <div className="space-y-2 px-2.5 pb-2.5">{children}</div>
    </details>
  );
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
