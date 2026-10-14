// @ts-nocheck
import React from "react";
import { useDispatch } from "react-redux";
import { Check, Loader2, Pencil, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useEnhanceMotionGraphicPlanMutation,
  useGenerateMotionGraphicPlanMutation,
  useGetMotionGraphicPlanQuery,
  useUpdateMotionGraphicPlanMutation,
} from "../../api/creatorEndpoints.js";

/**
 * A MOTION_GRAPHIC shot's plan -- concept, on-screen text, style and animation steps -- which the
 * video studio builds the shot from: each animation step becomes a timed action and the on-screen
 * text an action that must appear. So the creator owns it: they can write it themselves, ask for it
 * to be enhanced (shown beside theirs, kept only on "Use this"), or plan it afresh.
 */

const FIELDS = [
  { key: "concept", label: "Concept", rows: 2 },
  { key: "onScreenText", label: "On-screen text", rows: 1, hint: "Appears exactly as written." },
  { key: "visualStyle", label: "Style", rows: 1 },
  { key: "animationNotes", label: "Animation steps", rows: 4, hint: "One step per sentence, in order — each becomes an action on the timeline." },
];

const button = "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[10px] font-bold disabled:opacity-50";
const quiet = `${button} border-white/10 bg-white/5 text-slate-200 hover:border-white/25`;
const strong = `${button} border-purple-400/30 bg-purple-500/15 text-purple-100 hover:bg-purple-500/25`;

/** The animation notes as the steps they become: one per sentence. */
function steps(notes) {
  return (notes ?? "").split(/(?<=[.!?])\s+(?=["'(\p{Lu}])/u).map((s) => s.trim()).filter(Boolean);
}

function PlanView({ plan }) {
  return (
    <div className="space-y-1.5 text-[11px] font-medium text-slate-300">
      {plan.concept && <p>{plan.concept}</p>}
      {plan.onScreenText && <p className="text-slate-400">Text: <span className="text-slate-200">"{plan.onScreenText}"</span></p>}
      {plan.visualStyle && <p className="text-slate-400">Style: {plan.visualStyle}</p>}
      {plan.animationNotes && (
        <ol className="list-decimal space-y-0.5 pl-4 text-slate-400">
          {steps(plan.animationNotes).map((step) => <li key={step}>{step}</li>)}
        </ol>
      )}
    </div>
  );
}

function PlanForm({ value, onChange }) {
  return (
    <div className="space-y-2">
      {FIELDS.map((field) => (
        <label key={field.key} className="block text-[10px] font-bold text-slate-400">
          {field.label}
          <textarea rows={field.rows} value={value[field.key] ?? ""}
            onChange={(e) => onChange({ ...value, [field.key]: e.target.value })}
            className="creator-input mt-0.5 w-full px-2 py-1 text-[11px] font-medium" />
          {field.hint && <span className="mt-0.5 block font-medium text-slate-500">{field.hint}</span>}
        </label>
      ))}
    </div>
  );
}

const editable = (plan) => Object.fromEntries(FIELDS.map((f) => [f.key, plan?.[f.key] ?? ""]));

export default function MotionGraphicPanel({ shotId }) {
  const dispatch = useDispatch();
  const { data: plan, error, refetch } = useGetMotionGraphicPlanQuery(shotId, { skip: !shotId });
  const [generatePlan, { isLoading: generating }] = useGenerateMotionGraphicPlanMutation();
  const [updatePlan, { isLoading: saving }] = useUpdateMotionGraphicPlanMutation();
  const [enhancePlan, { isLoading: enhancing }] = useEnhanceMotionGraphicPlanMutation();
  const hasPlan = Boolean(plan) && error?.status !== 404;
  // The form's values while editing; null when not editing.
  const [draft, setDraft] = React.useState(null);
  const [instruction, setInstruction] = React.useState("");
  const [suggestion, setSuggestion] = React.useState(null);
  const busy = generating || saving || enhancing;

  const fail = (err, fallback) => dispatch(showFlash({ message: err?.data?.message || fallback, type: "error" }));

  const handleGenerate = async () => {
    try {
      await generatePlan(shotId).unwrap();
      setSuggestion(null);
      refetch();
    } catch (err) {
      fail(err, "Could not plan this motion graphic");
    }
  };

  const save = async (values) => {
    try {
      await updatePlan({ shotId, ...values }).unwrap();
      setDraft(null);
      setSuggestion(null);
      dispatch(showFlash({ message: "Plan saved. Press Update in the video studio to rebuild the timeline from it.", type: "success" }));
    } catch (err) {
      fail(err, "Could not save the plan");
    }
  };

  const handleEnhance = async () => {
    try {
      setSuggestion(await enhancePlan({ shotId, instruction: instruction.trim() }).unwrap());
    } catch (err) {
      fail(err, "Could not enhance the plan");
    }
  };

  return (
    <div className="space-y-2.5 rounded-md border border-amber-400/20 bg-amber-500/[0.04] p-3.5">
      <div>
        <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-300">
          <Sparkles size={11} /> Motion graphic plan
        </p>
        <p className="text-[10px] text-slate-500">Its animation steps become the shot's timed actions, and its on-screen text must appear.</p>
      </div>

      {!hasPlan && !draft && (
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={handleGenerate} className={strong}>
            {generating ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
            {generating ? "Planning…" : "Plan this motion graphic"}
          </button>
          <button type="button" disabled={busy} onClick={() => setDraft(editable(null))} className={quiet}>
            <Pencil size={11} /> Write it myself
          </button>
        </div>
      )}

      {draft ? (
        <>
          <PlanForm value={draft} onChange={setDraft} />
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={() => save(draft)} className={strong}>
              {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Save plan
            </button>
            <button type="button" disabled={busy} onClick={() => setDraft(null)} className={quiet}>Cancel</button>
          </div>
        </>
      ) : hasPlan && (
        <>
          <PlanView plan={plan} />
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => setDraft(editable(plan))} className={quiet}>
              <Pencil size={11} /> Edit
            </button>
            <button type="button" disabled={busy} onClick={handleGenerate} className={quiet}
              title="Plans it again from the shot, replacing this plan.">
              {generating ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />} Replan
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input value={instruction} onChange={(e) => setInstruction(e.target.value)} disabled={busy}
              onKeyDown={(e) => { if (e.key === "Enter" && instruction.trim()) handleEnhance(); }}
              placeholder="What should change? e.g. make the tagline land last, bolder style"
              className="creator-input min-w-0 flex-1 px-2 py-1 text-[11px]" />
            <button type="button" disabled={busy || !instruction.trim()} onClick={handleEnhance} className={strong}>
              {enhancing ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />} Enhance
            </button>
          </div>
        </>
      )}

      {suggestion && !draft && (
        <div className="space-y-2 rounded-md border border-purple-400/25 bg-black/20 p-2.5">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-purple-200">Suggested plan</p>
          <PlanView plan={suggestion} />
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => save(editable(suggestion))} className={strong}>
              {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Use this
            </button>
            <button type="button" disabled={busy} onClick={() => { setDraft(editable(suggestion)); }} className={quiet}>
              <Pencil size={11} /> Edit it first
            </button>
            <button type="button" disabled={busy} onClick={() => setSuggestion(null)} className={quiet}>Keep mine</button>
          </div>
        </div>
      )}
    </div>
  );
}
