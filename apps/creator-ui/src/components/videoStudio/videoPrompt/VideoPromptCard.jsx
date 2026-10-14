import React from "react";
import { Loader2, Pencil, Send, Sparkles } from "lucide-react";
import { useListPreProductionShotImagesQuery, useListShotPromptVersionsQuery } from "../../../api/creatorEndpoints.js";
import ProCta from "../../common/ProCta.jsx";
import { Chip, PromptFreshnessBadge, PromptVersionChip } from "./PromptChips.jsx";
import PromptTextEditor from "./PromptTextEditor.jsx";
import PromptCollapsibles from "./PromptCollapsibles.jsx";
import { PromptFreshness, PromptState, buildCardData } from "./promptModel.js";

/**
 * The shot's video prompt, shown once: the words, where they came from, whether they still match
 * the shot, and every earlier version.
 *
 * With `draft` (the video studio is open) the text is editable and Regenerate / Save / Reset /
 * Validate act on it. Without one (the shot has its clip) it shows the version that was sent,
 * read-only; Edit starts a new draft from it and the sent version stays in History unchanged.
 *
 * @param {{
 *   shotId: string,
 *   draft?: {
 *     text: string, onChange: (text: string) => void, aiText: string | null,
 *     generateSeconds: number | null, fps: number | null, staleReasons: string[], maxChars: number | null,
 *     unsaved: boolean, writing: boolean, onRegenerate: () => void, regenerateDisabled: boolean,
 *     save: object, reset: object, validate: object, footer?: React.ReactNode,
 *   } | null,
 *   onUseVersion?: (text: string) => void,
 *   onEditSent?: (text: string) => void,
 *   editsUnlocked?: boolean,
 *   editRequest?: object | null,  a new object opens the sent version for editing (Edit pressed outside the studio)
 * }} props
 */
export default function VideoPromptCard({ shotId, draft = null, onUseVersion, onEditSent, editsUnlocked = true, editRequest = null }) {
  const { data: rows = [], isLoading } = useListShotPromptVersionsQuery(shotId, { skip: !shotId });
  const { data: shotImages = [] } = useListPreProductionShotImagesQuery(shotId, { skip: !shotId });
  // A sent version in the studio is read-only until Edit, which makes it the next version's draft.
  const [unlocked, setUnlocked] = React.useState(editRequest != null);
  React.useEffect(() => { if (editRequest) setUnlocked(true); }, [editRequest]);

  const card = buildCardData({
    rows,
    shotImages,
    draft: draft && { text: draft.text, aiText: draft.aiText, generateSeconds: draft.generateSeconds, fps: draft.fps, staleReasons: draft.staleReasons, editingSent: unlocked },
  });
  const current = card.current;
  const sent = current?.state === PromptState.SENT;
  const stale = card.freshness === PromptFreshness.STALE;
  const readOnly = !draft || sent;
  // Generating writes a new newest version; editing the old sent one is over.
  const newest = card.history[0]?.version;
  const seenNewest = React.useRef(newest);
  React.useEffect(() => {
    if (seenNewest.current != null && newest !== seenNewest.current) setUnlocked(false);
    seenNewest.current = newest;
  }, [newest]);

  if (!draft && !current) {
    return isLoading ? (
      <CardShell><p className="flex items-center gap-2 text-[11px] text-slate-400"><Loader2 size={12} className="animate-spin" /> Loading the prompt…</p></CardShell>
    ) : null;
  }

  const startEdit = () => (draft ? setUnlocked(true) : onEditSent?.(current.text));

  return (
    <CardShell>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-300">Video prompt</span>
        {current && <PromptVersionChip version={current} />}
        {draft && <PromptFreshnessBadge freshness={card.freshness} staleReason={card.staleReason} />}
        {sent && <Chip tone="green"><Send size={10} /> Sent with v{current.version}</Chip>}
        <div className="ml-auto flex items-center gap-2">
          {sent && (onEditSent || draft) && (
            <ProCta unlocked={editsUnlocked} feature="Editing the prompt" onClick={startEdit}
              className="flex items-center gap-1 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 hover:border-purple-400/40">
              <Pencil size={11} /> Edit
            </ProCta>
          )}
          {draft?.onRegenerate && (
            <button type="button" onClick={draft.onRegenerate} disabled={draft.writing || draft.regenerateDisabled}
              className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-50 ${stale
                ? "border-amber-400/50 bg-amber-500/20 text-amber-50 ring-2 ring-amber-400/30 hover:bg-amber-500/30"
                : "border-purple-400/30 bg-purple-500/15 text-purple-100 hover:bg-purple-500/25"}`}>
              {draft.writing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              {current ? "Regenerate" : "Write prompt"}
            </button>
          )}
        </div>
      </div>

      <PromptTextEditor
        text={draft ? draft.text : current.text}
        onChange={draft?.onChange}
        readOnly={readOnly}
        writing={!!draft?.writing}
        maxChars={draft?.maxChars ?? null}
        generateSeconds={draft ? draft.generateSeconds : current.generateSeconds}
        unsaved={!!draft?.unsaved}
        save={draft?.save}
        reset={draft?.reset}
        validate={draft?.validate}
        editSignal={editRequest}
      />
      {draft?.footer}

      <PromptCollapsibles idPrefix={`prompt-${shotId}`} version={current} history={card.history}
        onUseVersion={draft ? onUseVersion : editsUnlocked ? onEditSent : undefined} />
    </CardShell>
  );
}

function CardShell({ children }) {
  return <div className="space-y-2.5 rounded-lg border border-white/10 bg-white/[0.03] p-3">{children}</div>;
}
