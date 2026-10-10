// @ts-nocheck
import React, { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { Eye, Loader2, Send, ShoppingCart } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useBuyMailPackMutation,
  useGetOutreachHistoryQuery,
  useGetOutreachOverviewQuery,
  useGetOutreachReachQuery,
  usePreviewOutreachMutation,
  useSendOutreachMutation,
} from "../../api/showcaseEndpoints.js";
import { errorMessage } from "../showcase/showcaseLabels.js";

const TEMPLATES = [
  ["SHOWCASE_WORK", "Share a film", "One film, with a short note from you."],
  ["SIMILAR_BRAND_WORK", "Made for a brand like yours", "One film from the brand's industry."],
  ["CREATOR_PORTFOLIO", "My recent work", "Up to three of your films and your profile."],
];
const OUTCOME = {
  SENT: ["Sent", "text-emerald-300"],
  QUEUED: ["In tomorrow's digest", "text-sky-300"],
  COOLDOWN: ["Emailed recently", "text-amber-300"],
  SUPPRESSED: ["Unsubscribed", "text-slate-400"],
  OVER_ALLOWANCE: ["No mails left", "text-rose-300"],
  DUPLICATE: ["Listed twice", "text-slate-400"],
};
const STATUS = { PENDING: "Waiting for digest", SENT: "Sent", DIGESTED: "In a digest", EXPIRED: "Dropped", FAILED: "Failed" };

/** One line per recipient: "email, name, company" (name and company optional). */
function parseRecipients(text) {
  return text.split(/\n+/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const [email, name, company] = line.split(",").map((p) => p.trim());
    return { email, name: name || null, company: company || null };
  });
}

/** Template mail to brands. Only films made on Dalai Llama that the client fully paid for and
 * agreed to marketing use of can be sent; each brand gets at most one email a day. */
export default function TemplateOutreach() {
  const dispatch = useDispatch();
  const { data: overview, isLoading } = useGetOutreachOverviewQuery();
  const { data: history = [] } = useGetOutreachHistoryQuery();
  const { data: reach } = useGetOutreachReachQuery();
  const [preview, previewState] = usePreviewOutreachMutation();
  const [send, sendState] = useSendOutreachMutation();
  const [buyPack, buyState] = useBuyMailPackMutation();

  const [template, setTemplate] = useState("SHOWCASE_WORK");
  const [publicId, setPublicId] = useState("");
  const [note, setNote] = useState("");
  const [recipientsText, setRecipientsText] = useState("");
  const [previewMail, setPreviewMail] = useState(null);
  const [results, setResults] = useState(null);

  const recipients = useMemo(() => parseRecipients(recipientsText), [recipientsText]);
  const films = overview?.mailableFilms || [];
  const film = publicId || films[0]?.publicId || "";
  const needsFilm = template !== "CREATOR_PORTFOLIO";
  const allowance = overview?.allowance;
  const left = allowance ? Math.max(0, allowance.freePerWeek - allowance.freeUsedThisWeek) + allowance.packMailsLeft : 0;
  const pack = overview?.packs?.[0];
  const body = { template, publicId: needsFilm ? film : null, note: note || null };
  const fail = (e, fallback) => dispatch(showFlash({ message: errorMessage(e, fallback), type: "error" }));

  const showPreview = async () => {
    try { setPreviewMail(await preview({ ...body, recipientName: recipients[0]?.name || null }).unwrap()); } catch (e) { fail(e, "Couldn't build the preview"); }
  };
  const doSend = async () => {
    try {
      const result = await send({ ...body, recipients }).unwrap();
      setResults(result.results);
      setRecipientsText("");
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

  return (
    <section className="creator-panel mb-6 p-5">
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

      {reach && (
        <dl className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Your reach, last 30 days">
          {[["Emails delivered", reach.mailsDelivered30d], ["Film clicks", reach.clicks30d],
            ["Requests from email", reach.requestsFromMail30d], ["Brands following you", reach.followers]].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
              <dt className="text-[10px] font-bold uppercase tracking-normal text-slate-500">{label}</dt>
              <dd className="text-lg font-bold text-white">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {films.length === 0 ? (
        <p className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
          Nothing to send yet. Only films made on Dalai Llama that your client fully paid for, and agreed to marketing use of, can be
          emailed. Publish one from the film bar ("Publish to my profile") once it's paid.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Template">
            {TEMPLATES.map(([code, label, hint]) => (
              <button key={code} type="button" role="radio" aria-checked={template === code} onClick={() => setTemplate(code)}
                      className={`rounded-xl border p-3 text-left ${template === code ? "border-purple-400/70 bg-purple-500/15" : "border-white/10 hover:bg-white/5"}`}>
                <span className="block text-sm font-bold text-white">{label}</span>
                <span className="block text-xs text-slate-400">{hint}</span>
              </button>
            ))}
          </div>
          {needsFilm && (
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-normal text-slate-500">Film</span>
              <select value={film} onChange={(e) => setPublicId(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-[#0b0f19] px-3 py-2.5 text-sm text-white">
                {films.map((f) => <option key={f.publicId} value={f.publicId}>{f.title}{f.clientLabel ? ` · ${f.clientLabel}` : ""}</option>)}
              </select>
            </label>
          )}
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-normal text-slate-500">Your note (optional)</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={3}
                      className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400/60" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-normal text-slate-500">
              Brands, one per line: email, name, company (up to {overview.maxRecipientsPerSend})
            </span>
            <textarea value={recipientsText} onChange={(e) => setRecipientsText(e.target.value)} rows={4}
                      placeholder={"asha@hearthfoods.in, Asha, Hearth Foods\nmarketing@brand.com"}
                      className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-purple-400/60" />
            {recipients.length > 0 && <span className="mt-1 block text-[11px] text-slate-500">{recipients.length} brand(s)</span>}
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={showPreview} disabled={previewState.isLoading}
                    className="creator-control flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-slate-200 disabled:opacity-50">
              <Eye size={15} /> Preview
            </button>
            <button type="button" onClick={doSend}
                    disabled={sendState.isLoading || recipients.length === 0 || recipients.length > overview.maxRecipientsPerSend}
                    className="creator-primary flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
              {sendState.isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send
            </button>
          </div>
          {previewMail && (
            <div className="rounded-xl border border-white/10 bg-white p-0">
              <p className="border-b border-slate-200 px-4 py-2 text-sm font-bold text-slate-900">{previewMail.subject}</p>
              <iframe title="Email preview" srcDoc={previewMail.html} sandbox="" className="h-[480px] w-full rounded-b-xl" />
            </div>
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
