// @ts-nocheck
import React, { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { Eye, Loader2, Send, ShoppingCart } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useBuyMailPackMutation,
  useGetAudiencesQuery,
  useGetEmailTemplatesQuery,
  useGetOutreachHistoryQuery,
  useGetOutreachOverviewQuery,
  usePreviewOutreachMutation,
  useSendOutreachMutation,
  useSendToAudienceMutation,
} from "../../api/showcaseEndpoints.js";
import { errorMessage } from "../showcase/showcaseLabels.js";
import { LAYOUT_LABEL } from "./outreachLabels.js";

const OUTCOME = {
  SENT: ["Sent", "text-emerald-300"],
  QUEUED: ["In their next digest", "text-sky-300"],
  COOLDOWN: ["Emailed recently", "text-amber-300"],
  SUPPRESSED: ["Unsubscribed", "text-slate-400"],
  OVER_ALLOWANCE: ["No mails left", "text-rose-300"],
  UNDELIVERABLE: ["Address can't receive mail", "text-rose-300"],
  DUPLICATE: ["Listed twice", "text-slate-400"],
};
const STATUS = {
  QUEUED: "Sending", PENDING: "Waiting for digest", SENT: "Sent", DIGESTED: "In a digest", EXPIRED: "Dropped", FAILED: "Not sent",
};
const control = "w-full rounded-lg border border-white/10 bg-[#0b0f19] px-3 py-2.5 text-sm text-white";
const label = "mb-1.5 block text-[10px] font-bold uppercase tracking-normal text-slate-500";

/** One line per recipient: "email, name, company" (name and company optional). */
function parseRecipients(text) {
  return text.split(/\n+/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const [email, name, company] = line.split(",").map((p) => p.trim());
    return { email, name: name || null, company: company || null };
  });
}

/** Send tab: pick a template (Dalai Llama's or your own), a film, and who gets it (an audience or
 * typed addresses). Only films made on Dalai Llama that the client fully paid for and agreed to
 * marketing use of can be sent; each brand gets at most one email a day. */
export default function TemplateOutreach({ templateId, onTemplateChange }) {
  const dispatch = useDispatch();
  const { data: overview, isLoading } = useGetOutreachOverviewQuery();
  const { data: templates = [] } = useGetEmailTemplatesQuery();
  const { data: audiences = [] } = useGetAudiencesQuery();
  const { data: history = [] } = useGetOutreachHistoryQuery();
  const [preview, previewState] = usePreviewOutreachMutation();
  const [send, sendState] = useSendOutreachMutation();
  const [sendToAudience, audienceState] = useSendToAudienceMutation();
  const [buyPack, buyState] = useBuyMailPackMutation();

  const [publicId, setPublicId] = useState("");
  const [note, setNote] = useState("");
  const [mode, setMode] = useState("audience");
  const [audienceId, setAudienceId] = useState("");
  const [recipientsText, setRecipientsText] = useState("");
  const [previewMail, setPreviewMail] = useState(null);
  const [results, setResults] = useState(null);
  const [audienceResult, setAudienceResult] = useState(null);

  const template = templates.find((t) => t.id === templateId) || templates[0];
  const audience = audiences.find((a) => a.id === audienceId) || audiences[0];
  const recipients = useMemo(() => parseRecipients(recipientsText), [recipientsText]);
  const films = overview?.mailableFilms || [];
  const film = publicId || films[0]?.publicId || "";
  const needsFilm = template?.layout !== "CREATOR_PORTFOLIO";
  const allowance = overview?.allowance;
  const left = allowance ? Math.max(0, allowance.freePerWeek - allowance.freeUsedThisWeek) + allowance.packMailsLeft : 0;
  const pack = overview?.packs?.[0];
  const body = { templateId: template?.id, publicId: needsFilm ? film : null, note: note || null };
  const fail = (e, fallback) => dispatch(showFlash({ message: errorMessage(e, fallback), type: "error" }));

  const showPreview = async () => {
    try { setPreviewMail(await preview({ ...body, recipientName: recipients[0]?.name || null }).unwrap()); } catch (e) { fail(e, "Couldn't build the preview"); }
  };
  const doSend = async () => {
    setResults(null);
    setAudienceResult(null);
    try {
      if (mode === "audience") {
        if (!window.confirm(`Email up to ${audience.reachable} brands in "${audience.name}"?`)) return;
        setAudienceResult(await sendToAudience({ ...body, audienceId: audience.id }).unwrap());
      } else {
        setResults((await send({ ...body, recipients }).unwrap()).results);
        setRecipientsText("");
      }
    } catch (e) { fail(e, "Couldn't send"); }
  };
  const doBuy = async () => {
    if (!window.confirm(`Buy ${pack.quantity} more mails for ${pack.currency} ${pack.price} from your wallet?`)) return;
    try {
      await buyPack(crypto.randomUUID()).unwrap();
      dispatch(showFlash({ message: `${pack.quantity} mails added`, type: "success" }));
    } catch (e) { fail(e, "Couldn't buy the pack"); }
  };

  if (isLoading) return <p className="flex items-center gap-2 text-sm text-slate-400"><Loader2 size={14} className="animate-spin" /> Loading…</p>;

  const canSend = template && (mode === "audience" ? audience && audience.reachable > 0
    : recipients.length > 0 && recipients.length <= overview.maxRecipientsPerSend);
  const sending = sendState.isLoading || audienceState.isLoading;

  return (
    <section className="creator-panel p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-normal text-slate-300">Send your work to brands</h2>
          <p className="mt-1 text-xs text-slate-400">
            Each brand gets at most one email a day; extra mail joins their next daily digest. You can't email the same brand
            again for {overview?.cooldownDays} days.
          </p>
        </div>
        {allowance && (
          <div className="text-right text-xs text-slate-400">
            <p><span className="text-lg font-bold text-white">{left}</span> mails left</p>
            <p>{allowance.freeUsedThisWeek}/{allowance.freePerWeek} free this week{allowance.packMailsLeft > 0 ? ` · ${allowance.packMailsLeft} from packs` : ""}</p>
            {pack && (
              <button type="button" onClick={doBuy} disabled={buyState.isLoading}
                      className="creator-control mt-1 inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-slate-200 disabled:opacity-50">
                <ShoppingCart size={12} /> {pack.quantity} more · {pack.currency} {pack.price}
              </button>
            )}
          </div>
        )}
      </div>

      {films.length === 0 ? (
        <p className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
          Nothing to send yet. Only films made on Dalai Llama that your client fully paid for, and agreed to marketing use of, can be
          emailed. Publish one from the film bar ("Publish to my profile") once it's paid.
        </p>
      ) : (
        <div className="space-y-4">
          <label className="block">
            <span className={label}>Template</span>
            <select value={template?.id || ""} onChange={(e) => onTemplateChange(e.target.value)} className={control}>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.global ? "Dalai Llama · " : "Mine · "}{t.name} ({LAYOUT_LABEL[t.layout]})</option>
              ))}
            </select>
            {template && <span className="mt-1 block text-[11px] text-slate-500">Subject: {template.subject}</span>}
          </label>
          {needsFilm && (
            <label className="block">
              <span className={label}>Film</span>
              <select value={film} onChange={(e) => setPublicId(e.target.value)} className={control}>
                {films.map((f) => <option key={f.publicId} value={f.publicId}>{f.title}{f.clientLabel ? ` · ${f.clientLabel}` : ""}</option>)}
              </select>
            </label>
          )}
          <label className="block">
            <span className={label}>Your note (optional)</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={3}
                      className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400/60" />
          </label>

          <div>
            <span className={label}>Send to</span>
            <div className="mb-2 flex gap-2" role="radiogroup" aria-label="Recipients">
              {[["audience", "An audience"], ["typed", "Type addresses"]].map(([id, text]) => (
                <button key={id} type="button" role="radio" aria-checked={mode === id} onClick={() => setMode(id)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold ${mode === id ? "bg-purple-600 text-white" : "text-slate-400 hover:bg-white/5"}`}>
                  {text}
                </button>
              ))}
            </div>
            {mode === "audience" ? (
              audiences.length === 0 ? (
                <p className="text-xs text-slate-400">No audiences yet. Upload one on the Audiences tab.</p>
              ) : (
                <>
                  <select value={audience?.id || ""} onChange={(e) => setAudienceId(e.target.value)} className={control}>
                    {audiences.map((a) => <option key={a.id} value={a.id}>{a.name} · {a.reachable} reachable of {a.leads}</option>)}
                  </select>
                  <span className="mt-1 block text-[11px] text-slate-500">
                    One email per lead, to their best address. Queued mail goes out within a couple of minutes.
                  </span>
                </>
              )
            ) : (
              <>
                <textarea value={recipientsText} onChange={(e) => setRecipientsText(e.target.value)} rows={4}
                          placeholder={"asha@hearthfoods.in, Asha, Hearth Foods\nmarketing@brand.com"}
                          className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-purple-400/60" />
                <span className="mt-1 block text-[11px] text-slate-500">
                  One per line: email, name, company · up to {overview.maxRecipientsPerSend}{recipients.length > 0 ? ` · ${recipients.length} listed` : ""}
                </span>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={showPreview} disabled={previewState.isLoading || !template}
                    className="creator-control flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-slate-200 disabled:opacity-50">
              <Eye size={15} /> Preview
            </button>
            <button type="button" onClick={doSend} disabled={sending || !canSend}
                    className="creator-primary flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send
            </button>
          </div>
          {previewMail && (
            <div className="rounded-xl border border-white/10 bg-white p-0">
              <p className="border-b border-slate-200 px-4 py-2 text-sm font-bold text-slate-900">{previewMail.subject}</p>
              <iframe title="Email preview" srcDoc={previewMail.html} sandbox="" className="h-[480px] w-full rounded-b-xl" />
            </div>
          )}
          {audienceResult && (
            <dl className="grid grid-cols-2 gap-2 rounded-lg border border-white/10 p-3 text-xs sm:grid-cols-3">
              {[["Queued", audienceResult.queued], ["Emailed recently", audienceResult.cooldown],
                ["Unsubscribed", audienceResult.suppressed], ["No mails left", audienceResult.overAllowance],
                ["No usable address", audienceResult.noReachableContact], ["Same address twice", audienceResult.duplicates]]
                .map(([k, v]) => <div key={k}><dt className="text-slate-500">{k}</dt><dd className="text-base font-bold text-white">{v}</dd></div>)}
            </dl>
          )}
          {results && (
            <ul className="divide-y divide-white/10 rounded-lg border border-white/10 text-sm">
              {results.map((r) => (
                <li key={r.email} className="flex justify-between px-3 py-2">
                  <span className="text-slate-200">{r.email}</span>
                  <span className={OUTCOME[r.outcome][1]}>{OUTCOME[r.outcome][0]}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {history.length > 0 && (
        <details className="mt-5">
          <summary className="cursor-pointer text-xs font-bold uppercase tracking-normal text-slate-400">Last 30 days ({history.length})</summary>
          <ul className="mt-2 divide-y divide-white/5 text-xs">
            {history.map((h) => (
              <li key={h.id} className="flex flex-wrap justify-between gap-2 py-1.5 text-slate-300">
                <span>{h.email || "(removed after 30 days)"}{h.company ? ` · ${h.company}` : ""}</span>
                <span className="text-slate-500">{STATUS[h.status]} · {new Date(h.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
