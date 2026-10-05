// @ts-nocheck
import React from "react";
import { useDispatch } from "react-redux";
import { AlertTriangle, CheckCircle2, ChevronDown, Loader2, RotateCcw } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useClearContinuityOverrideMutation,
  usePreviewStepContinuityMutation,
  useSetContinuityOverrideMutation,
} from "../../api/creatorEndpoints.js";

const FIELD_LABELS = {
  TIME_OF_DAY: "Time of day",
  LIGHTING: "Lighting",
  WEATHER: "Weather",
  SEASON: "Season",
  LOCATION: "Location",
  ARCHITECTURE: "Architecture",
  ENVIRONMENT: "Environment",
  COLOUR_GRADE: "Colour grade",
  EXPOSURE: "Exposure",
  ATMOSPHERE: "Atmosphere",
  WARDROBE: "Wardrobe",
  PROPS: "Props",
  VEHICLES: "Vehicles",
};

const SOURCE_LABELS = {
  USER_OVERRIDE: "Your choice",
  SCREENPLAY: "Screenplay",
  SHOT_DESCRIPTION: "Shot description",
  REFERENCE_IMAGE: "Previous shot",
  PROJECT_LOOK: "Project look",
  SHOT_METADATA: "Shot metadata",
  LIGHTING_PLAN: "Lighting plan",
  SYSTEM_INFERENCE: "System",
};

const SEVERITY_STYLE = {
  OVERRIDE: "border-amber-400/25 bg-amber-500/[0.06]",
  WARNING: "border-white/10 bg-white/[0.03]",
  EXPLICIT_TRANSITION: "border-sky-400/25 bg-sky-500/[0.06]",
  USER_OVERRIDE: "border-purple-400/30 bg-purple-500/[0.08]",
};

const SEVERITY_TAG = {
  OVERRIDE: "Kept from previous shot",
  WARNING: "Can coexist",
  EXPLICIT_TRANSITION: "Changed by the shot",
  USER_OVERRIDE: "Your choice",
};

const readable = (value) => (value ? String(value).replace(/_/g, " ").toLowerCase() : "—");

/** "Continuity changes" for a step shot: every automatic decision the backend's continuity resolver
 * made between the previous shot's image and this shot's metadata, with its reason and source, and a
 * way to overrule it. The backend recomputes the whole resolved state and prompt on every change;
 * nothing here edits the prompt text itself. */
export default function StepContinuityPanel({ shotId, kind, sourceShotId }) {
  const dispatch = useDispatch();
  const [preview, { data, isLoading, error }] = usePreviewStepContinuityMutation();
  const [setOverride, { isLoading: setting }] = useSetContinuityOverrideMutation();
  const [clearOverride, { isLoading: clearing }] = useClearContinuityOverrideMutation();
  const [showPrompt, setShowPrompt] = React.useState(false);

  const refresh = React.useCallback(() => {
    if (shotId && kind && sourceShotId) preview({ shotId, kind, sourceShotId });
  }, [preview, shotId, kind, sourceShotId]);

  React.useEffect(() => { refresh(); }, [refresh]);

  const choose = async (field, value) => {
    try {
      await setOverride({ shotId, field, value }).unwrap();
      refresh();
    } catch (err) {
      dispatch(showFlash({ message: err?.data?.message || "Could not save this choice", type: "error" }));
    }
  };

  const restore = async (field) => {
    try {
      await clearOverride({ shotId, field }).unwrap();
      refresh();
    } catch (err) {
      dispatch(showFlash({ message: err?.data?.message || "Could not restore continuity", type: "error" }));
    }
  };

  if (isLoading && !data) {
    return (
      <div className="mb-3 flex items-center gap-2 rounded-md border border-white/10 bg-white/5 p-2.5 text-[11px] font-semibold text-slate-400">
        <Loader2 size={12} className="animate-spin" /> Checking continuity with the previous shot…
      </div>
    );
  }
  if (error && !data) {
    return (
      <p className="mb-3 rounded-md border border-amber-400/25 bg-amber-500/10 p-2.5 text-[11px] font-semibold text-amber-200">
        Could not check continuity: {error?.data?.message || "request failed"}. The step still uses the previous shot as its anchor.
      </p>
    );
  }
  if (!data) return null;

  const rows = data.overrides || [];
  const busy = setting || clearing || isLoading;
  const preserved = (data.preserved || []).map((field) => FIELD_LABELS[field] || readable(field));
  const changes = data.changesForThisShot || [];

  return (
    <div className="mb-3 max-h-72 space-y-2 overflow-y-auto rounded-md border border-white/10 bg-white/[0.02] p-2.5">
      {rows.length === 0 ? (
        <p className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-200">
          <CheckCircle2 size={12} /> Visual continuity preserved
        </p>
      ) : (
        <p className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wide text-slate-300">
          Continuity changes
          <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-200">{rows.length}</span>
        </p>
      )}

      {rows.map((row) => (
        <div key={`${row.field}-${row.severity}`} className={`rounded-md border p-2 ${SEVERITY_STYLE[row.severity] || SEVERITY_STYLE.WARNING}`}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-300">{FIELD_LABELS[row.field] || readable(row.field)}</p>
            <span className="text-[9px] font-bold text-slate-400">{SEVERITY_TAG[row.severity]}</span>
          </div>
          <p className="mt-0.5 text-[11px] font-bold text-slate-100">
            <span className="text-slate-400 line-through decoration-slate-500/60">{readable(row.originalValue)}</span>
            {" → "}
            {readable(row.resolvedValue)}
          </p>
          <p className="mt-0.5 text-[10px] font-medium text-slate-400">{row.reason}</p>
          <p className="mt-0.5 text-[9px] font-semibold text-slate-500">
            Source: {SOURCE_LABELS[row.resolvedSource] || row.resolvedSource}
            {row.superseded?.length > 1 ? ` · replaces ${row.superseded.length} generated values` : ""}
          </p>
          {row.userOverridable && (
            <div className="mt-1.5">
              {row.severity === "USER_OVERRIDE" ? (
                <button type="button" disabled={busy} onClick={() => restore(row.field)}
                  className="flex items-center gap-1 rounded border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-200 hover:border-purple-300 disabled:opacity-50">
                  <RotateCcw size={10} /> Restore continuity
                </button>
              ) : row.originalValue ? (
                <button type="button" disabled={busy} onClick={() => choose(row.field, row.originalValue)}
                  className="rounded border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-200 hover:border-purple-300 disabled:opacity-50">
                  Use {readable(row.originalValue)} instead
                </button>
              ) : null}
            </div>
          )}
        </div>
      ))}

      {(data.warnings || []).map((warning) => (
        <p key={warning} className="flex items-start gap-1.5 text-[10px] font-semibold text-amber-200">
          <AlertTriangle size={11} className="mt-px shrink-0" /> {warning}
        </p>
      ))}

      {preserved.length > 0 && (
        <p className="text-[10px] text-slate-400"><span className="font-bold text-slate-300">Preserved from previous shot:</span> {preserved.join(" • ")}</p>
      )}
      {changes.length > 0 && (
        <p className="text-[10px] text-slate-400"><span className="font-bold text-slate-300">Changed for this shot:</span> {changes.join(" • ")}</p>
      )}

      {data.finalPrompt && (
        <div>
          <button type="button" onClick={() => setShowPrompt((open) => !open)} className="flex items-center gap-1 text-[10px] font-bold text-purple-300">
            <ChevronDown size={11} className={showPrompt ? "rotate-180" : ""} /> {showPrompt ? "Hide" : "View"} final prompt
          </button>
          {showPrompt && (
            <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-black/30 p-2 text-[10px] text-slate-300">{data.finalPrompt}</pre>
          )}
        </div>
      )}
    </div>
  );
}
