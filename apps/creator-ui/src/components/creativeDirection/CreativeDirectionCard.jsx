import React, { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Film, ImageOff, MessageSquare, Sparkles } from "lucide-react";

/**
 * One director's treatment, shared by the creator's Creative Direction tab and the client's review
 * page so both read the same treatment the same way. Every field comes from the server as stored;
 * reference media renders only from a real signed URL -- a reference whose media can't be reached
 * says so instead of showing anything in its place. Actions are passed in as `children`.
 */

const STATUS = {
  PROPOSED: { label: "Proposed", tone: "border-white/15 bg-white/5 text-slate-300" },
  SELECTED: { label: "Selected for review", tone: "border-sky-400/30 bg-sky-500/10 text-sky-200" },
  REVISION_REQUESTED: { label: "Revision requested", tone: "border-amber-400/30 bg-amber-500/10 text-amber-200" },
  APPROVED: { label: "Approved", tone: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200" },
  SUPERSEDED: { label: "Superseded", tone: "border-white/10 bg-white/[0.03] text-slate-500" },
};

export function StatusChip({ status }) {
  const meta = STATUS[status] || STATUS.PROPOSED;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.tone}`}>
      {status === "APPROVED" && <CheckCircle2 size={10} />}
      {meta.label}
    </span>
  );
}

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-0.5 whitespace-pre-line text-[12.5px] font-medium leading-relaxed text-slate-200">{value}</p>
    </div>
  );
}

function ReferenceMedia({ reference }) {
  const isVideo = reference.mediaType === "VIDEO";
  return (
    <figure className="overflow-hidden rounded-lg border border-white/10 bg-black/30">
      {!reference.url ? (
        <div className="flex h-28 flex-col items-center justify-center gap-1 text-[10.5px] font-semibold text-slate-500">
          <ImageOff size={16} />
          Reference media unavailable right now
        </div>
      ) : isVideo ? (
        <video src={reference.url} controls preload="metadata" className="h-40 w-full bg-black object-contain" />
      ) : (
        <img src={reference.url} alt={reference.clientInstruction || "Client reference"} className="h-40 w-full object-cover" loading="lazy" />
      )}
      <figcaption className="space-y-1 p-2 text-[10.5px] font-medium text-slate-400">
        <span className="inline-flex items-center gap-1 font-bold text-slate-300">
          {isVideo ? <Film size={11} /> : null}
          {isVideo ? (reference.originalFilename || "Reference video") : "Reference image"}
        </span>
        {reference.clientInstruction && <p>Client: {reference.clientInstruction}</p>}
        {reference.referenceAnalysis && <p className="text-slate-500">{reference.referenceAnalysis}</p>}
      </figcaption>
    </figure>
  );
}

export default function CreativeDirectionCard({ direction, highlighted = false, children }) {
  const [open, setOpen] = useState(highlighted);
  const visual = direction.visualLanguage || {};
  const visualLines = [
    ["Story period", visual.storyPeriod],
    ["Colour", visual.colorTreatment],
    ["Contrast", visual.contrast],
    ["Texture", visual.texture],
    ["Aesthetic", visual.overallAesthetic],
  ].filter(([, value]) => value);

  return (
    <article className={`creator-panel p-5 ${highlighted ? "ring-1 ring-purple-400/40" : ""}`}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {direction.recommended && (
              <span className="inline-flex items-center gap-1 rounded-full border border-purple-400/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-200">
                <Sparkles size={10} /> AI recommendation
              </span>
            )}
            <StatusChip status={direction.reviewStatus} />
            {direction.version > 1 && <span className="text-[10px] font-semibold text-slate-500">Version {direction.version}</span>}
          </div>
          <h3 className="mt-2 text-[16px] font-extrabold text-white">{direction.title}</h3>
          <p className="mt-1 text-[12.5px] font-medium leading-relaxed text-slate-300">{direction.creativeConcept}</p>
        </div>
      </header>

      {direction.recommended && direction.recommendationReason && (
        <p className="mt-3 rounded-lg border border-purple-400/20 bg-purple-500/[0.06] p-3 text-[12px] font-medium leading-relaxed text-purple-100">
          <span className="font-bold">Why it's recommended: </span>
          {direction.recommendationReason}
          <span className="mt-1 block text-[10.5px] text-purple-200/70">Advisory only -- any direction can be approved.</span>
        </p>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mt-3 flex items-center gap-1 text-[11.5px] font-bold text-purple-200 hover:text-purple-100"
      >
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {open ? "Hide the full treatment" : "Read the full treatment"}
      </button>

      {open && (
        <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
          <Field label="Director's treatment" value={direction.directorsTreatment} />
          <Field label="Storytelling style" value={direction.storytellingStyle} />
          {visualLines.length > 0 && (
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Visual language</p>
              <dl className="mt-1 grid gap-x-4 gap-y-1 text-[12px] sm:grid-cols-2">
                {visualLines.map(([label, value]) => (
                  <div key={label}>
                    <dt className="inline font-bold text-slate-400">{label}: </dt>
                    <dd className="inline font-medium text-slate-200">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          <Field label="Cinematography philosophy" value={direction.cinematographyPhilosophy} />
          <Field label="Emotional journey" value={direction.emotionalJourney} />
          <Field label="Sound direction" value={direction.soundDirection} />
          <Field label="Signature creative device" value={direction.signatureCreativeDevice} />
          <Field label="Creative rationale" value={direction.creativeRationale} />

          {direction.references?.length > 0 && (
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Client references it draws on</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {direction.references.map((reference) => (
                  <ReferenceMedia key={reference.assetId} reference={reference} />
                ))}
              </div>
            </div>
          )}

          {direction.feedback?.length > 0 && (
            <div>
              <p className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                <MessageSquare size={11} /> Review notes
              </p>
              <ul className="mt-1 space-y-1">
                {direction.feedback.map((note) => (
                  <li key={note.id} className="rounded-md bg-white/[0.03] px-2.5 py-1.5 text-[11.5px] text-slate-300">
                    <span className="font-bold text-slate-400">{note.source === "CLIENT" ? "Client" : "Creator"}: </span>
                    {note.feedback}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {children && <footer className="mt-4 border-t border-white/10 pt-3">{children}</footer>}
    </article>
  );
}

/** Feedback box shared by creator and client: a note, optionally flagged as a revision request. */
export function DirectionFeedbackForm({ busy, onSubmit }) {
  const [text, setText] = useState("");
  const [requestRevision, setRequestRevision] = useState(true);
  return (
    <form
      className="space-y-2"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!text.trim()) return;
        const ok = await onSubmit({ feedback: text.trim(), requestRevision });
        if (ok) setText("");
      }}
    >
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={2}
        maxLength={4000}
        placeholder="What should change in this treatment?"
        className="creator-input w-full px-3 py-2 text-[12px]"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
          <input type="checkbox" checked={requestRevision} onChange={(event) => setRequestRevision(event.target.checked)} />
          Request a revision
        </label>
        <button type="submit" disabled={busy || !text.trim()} className="creator-control px-3 py-1.5 text-[11px] font-bold text-slate-200 disabled:opacity-60">
          {busy ? "Sending…" : "Send feedback"}
        </button>
      </div>
    </form>
  );
}
