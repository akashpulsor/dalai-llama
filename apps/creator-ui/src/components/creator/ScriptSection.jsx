// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Pencil, Save, Sparkles, X } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useGetScriptQuery,
  useGetScriptVersionQuery,
  useListScriptVersionsQuery,
  useSaveScriptEditMutation,
} from "../../api/creatorEndpoints.js";

const EDIT_FIELDS = [
  { key: "logline", label: "Logline" },
  { key: "centralConflict", label: "Central conflict" },
  { key: "endingPayoff", label: "Ending payoff" },
  { key: "setting", label: "Setting" },
  { key: "hook", label: "Hook" },
  { key: "pacingStyle", label: "Pacing style" },
  { key: "hookStrategy", label: "Hook strategy" },
  { key: "emotionalArc", label: "Emotional arc" },
  { key: "storytellingType", label: "Storytelling type" },
];

const SOURCE_BADGE = {
  EDITED: { label: "Edited", className: "border-amber-400/25 bg-amber-400/10 text-amber-300" },
  CRITIC: { label: "Critic-revised", className: "border-rose-400/25 bg-rose-400/10 text-rose-300" },
};

/** Script is versioned the same way Screenplay is (see that component's own javadoc): every
 * generate() call inserts a new script_version row, tagged GENERATED, EDITED (a creator's manual
 * save), or CRITIC (the accepted draft only exists because an internal critic pass rejected an
 * earlier attempt and forced a rewrite -- see ScriptGenerationService#generate's retry loop).
 * Unlike Screenplay, the live `script` row (what every other stage reads) is a separate,
 * unversioned table this always keeps in sync -- see V41__script_version.sql for why. */
export default function ScriptSection({ projectId }) {
  const dispatch = useDispatch();
  const [viewedVersion, setViewedVersion] = useState(null); // null = latest
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [showCritiqueNotes, setShowCritiqueNotes] = useState(false);
  const [showBeatPlan, setShowBeatPlan] = useState(false);

  const { data: latest, isLoading: latestLoading, error: latestError } = useGetScriptQuery(projectId, { skip: !projectId });
  const { data: versions = [] } = useListScriptVersionsQuery(projectId, { skip: !projectId });
  const { data: specificVersion } = useGetScriptVersionQuery(
    { projectId, version: viewedVersion },
    { skip: !projectId || viewedVersion == null }
  );
  const [saveEdit, { isLoading: savingEdit }] = useSaveScriptEditMutation();

  // Latest carries `characters` (versions don't -- characters aren't versioned, see
  // ScriptVersion's javadoc); merge that in whenever viewing a specific older version so the cast
  // pills still show without a second, version-scoped character concept.
  const script = viewedVersion == null
    ? latest
    : specificVersion && { ...specificVersion, characters: latest?.characters || [] };
  const hasScript = Boolean(script?.scriptText);
  const noScriptYet = latestError?.status === 404;

  const currentVersion = viewedVersion == null ? latest?.currentVersion : specificVersion?.version;
  const currentSource = viewedVersion == null ? latest?.currentSource : specificVersion?.source;
  const versionIndex = useMemo(() => versions.findIndex((v) => v.version === currentVersion), [versions, currentVersion]);
  const canGoPrev = versionIndex > 0;
  const canGoNext = versionIndex >= 0 && versionIndex < versions.length - 1;
  const viewedVersionRow = versions.find((v) => v.version === currentVersion);

  useEffect(() => {
    // Jumping to latest whenever a fresh version lands (generate/save-edit both invalidate
    // `latest`) keeps the view from silently pointing at a now-stale version number.
    setViewedVersion(null);
    setEditing(false);
  }, [latest?.id]);

  const goPrev = () => canGoPrev && setViewedVersion(versions[versionIndex - 1].version);
  const goNext = () => {
    if (!canGoNext) return;
    const target = versions[versionIndex + 1];
    setViewedVersion(target.version === latest?.currentVersion ? null : target.version);
  };

  const startEdit = () => {
    setDraft({
      scriptText: script.scriptText || "",
      logline: script.logline || "",
      centralConflict: script.centralConflict || "",
      endingPayoff: script.endingPayoff || "",
      setting: script.setting || "",
      hook: script.hook || "",
      pacingStyle: script.pacingStyle || "",
      hookStrategy: script.hookStrategy || "",
      emotionalArc: script.emotionalArc || "",
      storytellingType: script.storytellingType || "",
    });
    setEditing(true);
  };
  const cancelEdit = () => {
    setEditing(false);
    setDraft(null);
  };
  const setField = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  const handleSaveEdit = async () => {
    try {
      await saveEdit({ projectId, fromVersion: currentVersion, ...draft }).unwrap();
      dispatch(showFlash({ message: "Saved as a new script version", type: "success" }));
      setEditing(false);
      setDraft(null);
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not save these edits", type: "error" }));
    }
  };

  if (latestLoading) return null;
  if (!hasScript && !editing) {
    return (
      <p className="creator-panel mt-6 p-6 text-center text-xs font-semibold text-slate-500">
        {noScriptYet ? "No script yet — generate one from the Idea tab first." : "No script yet."}
      </p>
    );
  }

  const badge = SOURCE_BADGE[currentSource];

  return (
    <div className="creator-panel mt-6 p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-purple-300">Script</p>
          <p className="mt-0.5 text-xs font-medium text-slate-400">Every generate or saved edit is a new version — nothing is overwritten</p>
        </div>

        {versions.length > 0 && (
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={goPrev} disabled={!canGoPrev} className="creator-control flex h-7 w-7 items-center justify-center disabled:opacity-30">
              <ChevronLeft size={14} />
            </button>
            <span className="px-1 text-xs font-bold text-slate-300">
              v{currentVersion} of {versions.length}
              {badge && (
                <span className={`ml-1.5 rounded-full border px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${badge.className}`}>
                  {badge.label}
                </span>
              )}
            </span>
            <button type="button" onClick={goNext} disabled={!canGoNext} className="creator-control flex h-7 w-7 items-center justify-center disabled:opacity-30">
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {currentSource === "CRITIC" && viewedVersionRow?.critiqueNotes && (
        <div className="mb-4 rounded-lg border border-rose-400/20 bg-rose-500/[0.04] p-3.5">
          <button
            type="button"
            onClick={() => setShowCritiqueNotes((v) => !v)}
            className="flex w-full items-center justify-between text-left text-[11px] font-extrabold uppercase tracking-wide text-rose-300"
          >
            Why the critic revised this
            {showCritiqueNotes ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {showCritiqueNotes && (
            <p className="mt-2 text-[12px] font-medium leading-relaxed text-rose-200/90">{viewedVersionRow.critiqueNotes}</p>
          )}
        </div>
      )}

      {!editing && (
        <>
          {(script.logline || script.centralConflict || script.endingPayoff || script.setting || script.storytellingType) && (
            <div className="mb-5 grid gap-2.5 sm:grid-cols-2">
              {script.logline && (
                <div className="col-span-2 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-3">
                  <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Logline</p>
                  <p className="text-[13px] font-semibold text-white">{script.logline}</p>
                </div>
              )}
              {script.centralConflict && (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-3">
                  <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Central conflict</p>
                  <p className="text-[12px] font-medium text-slate-300">{script.centralConflict}</p>
                </div>
              )}
              {script.endingPayoff && (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-3">
                  <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Ending payoff</p>
                  <p className="text-[12px] font-medium text-slate-300">{script.endingPayoff}</p>
                </div>
              )}
              {script.setting && (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-3">
                  <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Setting</p>
                  <p className="text-[12px] font-medium text-slate-300">{script.setting}</p>
                </div>
              )}
              {script.storytellingType && (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-3">
                  <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Storytelling type</p>
                  <p className="text-[12px] font-medium text-slate-300">{script.storytellingType}</p>
                </div>
              )}
            </div>
          )}

          {script.beatPlan && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowBeatPlan((v) => !v)}
                className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-200"
              >
                {showBeatPlan ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                Beat plan this script was written from
              </button>
              {showBeatPlan && (
                <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-3 text-[12px] font-medium leading-relaxed text-slate-300">
                  {script.beatPlan}
                </pre>
              )}
            </div>
          )}

          <div className="mb-4 flex flex-wrap gap-2">
            {script.hook && <span className="rounded-full border border-purple-400/20 bg-purple-500/10 px-3 py-1 text-[11px] font-bold text-purple-200">Hook: "{script.hook}"</span>}
            {script.pacingStyle && <span className="rounded-full border border-purple-400/20 bg-purple-500/10 px-3 py-1 text-[11px] font-bold text-purple-200">Pacing: {script.pacingStyle}</span>}
            {script.hookStrategy && <span className="rounded-full border border-purple-400/20 bg-purple-500/10 px-3 py-1 text-[11px] font-bold text-purple-200">Hook strategy: {script.hookStrategy}</span>}
            {script.emotionalArc && <span className="rounded-full border border-purple-400/20 bg-purple-500/10 px-3 py-1 text-[11px] font-bold text-purple-200">Arc: {script.emotionalArc}</span>}
            {script.noHumans && <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-200">Product-only, no humans</span>}
          </div>
          <p className="whitespace-pre-wrap text-[13px] font-medium leading-relaxed text-slate-200">{script.scriptText}</p>

          {script.characters?.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {script.characters.map((character) => (
                <span key={character.id} className="rounded-full border border-teal-400/20 bg-teal-500/10 px-3 py-1 text-[11px] font-bold text-teal-200">
                  {character.characterName} &middot; {character.characterRole}
                </span>
              ))}
            </div>
          )}

          <div className="mt-5">
            <button
              type="button"
              onClick={startEdit}
              className="flex items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:border-purple-400/30"
            >
              <Pencil size={12} />
              Edit script
            </button>
          </div>
        </>
      )}

      {editing && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Script text</label>
            <textarea
              rows={10}
              value={draft.scriptText}
              onChange={(event) => setField("scriptText", event.target.value)}
              className="creator-input w-full resize-y px-3 py-2.5 text-[13px] leading-relaxed"
            />
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {EDIT_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">{label}</label>
                <textarea
                  rows={key === "centralConflict" || key === "endingPayoff" ? 2 : 1}
                  value={draft[key] || ""}
                  onChange={(event) => setField(key, event.target.value)}
                  className="creator-input w-full resize-y px-2.5 py-2 text-xs"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2.5">
            <button type="button" onClick={cancelEdit} className="flex items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-slate-200">
              <X size={12} />
              Cancel
            </button>
            <button
              type="button"
              disabled={savingEdit || !draft.scriptText.trim()}
              onClick={handleSaveEdit}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-emerald-400/30 bg-emerald-500/10 py-2.5 text-xs font-bold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60"
            >
              <Save size={12} />
              {savingEdit ? "Saving…" : "Save as new version"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
