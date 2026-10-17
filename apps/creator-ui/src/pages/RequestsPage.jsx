// @ts-nocheck
import React from "react";
import { useDispatch } from "react-redux";
import { Navigate } from "react-router-dom";
import { ExternalLink, Loader2, Mail } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import { useAcceptInquiryMutation, useConvertInquiryMutation, useGetInquiryImageQuery, useGetMyInquiriesQuery, useSetInquiryStatusMutation } from "../api/showcaseEndpoints.js";
import { INDUSTRY_LABEL, errorMessage } from "../components/showcase/showcaseLabels.js";

const BUDGET = { UNDER_50K: "Under ₹50k", FROM_50K_TO_2L: "₹50k – 2L", FROM_2L_TO_8L: "₹2L – 8L", OVER_8L: "Over ₹8L", NOT_SURE: "Budget not sure" };
const TIMELINE = { ASAP: "ASAP", THIS_MONTH: "This month", THIS_QUARTER: "This quarter", EXPLORING: "Exploring" };
const STATUS = {
  NEW: ["New", "bg-purple-500/20 text-purple-200"],
  VIEWED: ["Seen", "bg-white/10 text-slate-300"],
  CONVERTED: ["Brief sent", "bg-emerald-500/15 text-emerald-300"],
  DECLINED: ["Declined", "bg-rose-500/15 text-rose-300"],
};

/** Brands who asked for a video from the public profile. "Make a brief" creates the brief and
 * emails the brand its link; from there it is the normal brief, payment and review flow. */
/** Requests now live on the Profile page; old links land there. */
export default function RequestsPage() {
  return <Navigate to="/profile#requests" replace />;
}

export function RequestsList() {
  const { data: requests = [], isLoading, isError } = useGetMyInquiriesQuery();
  return (
    <div>
      {isLoading && <p className="flex items-center gap-2 text-slate-400"><Loader2 size={16} className="animate-spin" /> Loading…</p>}
      {isError && <p className="text-rose-300">Requests couldn't load. Try again in a moment.</p>}
      {!isLoading && !isError && requests.length === 0 && (
        <div className="creator-panel rounded-2xl p-6 text-sm text-slate-400">
          No requests yet. Brands can ask you for a video from your public profile once it shows your work.
        </div>
      )}
      <ul className="space-y-3">
        {requests.map((r) => <RequestCard key={r.id} r={r} />)}
      </ul>
    </div>
  );
}

function RequestCard({ r }) {
  const dispatch = useDispatch();
  const [setStatus, { isLoading: updating }] = useSetInquiryStatusMutation();
  const [convert, { isLoading: converting }] = useConvertInquiryMutation();
  const [accept, { isLoading: accepting }] = useAcceptInquiryMutation();
  // Offered to a few creators: shown as an offer until someone accepts it.
  const [label, tone] = r.offered ? ["Offered to you", "bg-amber-500/15 text-amber-200"] : STATUS[r.status];
  const open = !r.offered && (r.status === "NEW" || r.status === "VIEWED");

  const act = async (fn, success, fallback) => {
    try {
      await fn().unwrap();
      dispatch(showFlash({ message: success, type: "success" }));
    } catch (e) {
      dispatch(showFlash({ message: errorMessage(e, fallback), type: "error" }));
    }
  };

  return (
    <li className="creator-panel rounded-2xl p-5" onMouseEnter={() => !r.offered && r.status === "NEW" && !updating && setStatus({ id: r.id, status: "VIEWED" })}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-white">
            {r.brand.companyName || r.brand.contactName || r.brand.email}
            {r.brand.industry && <span className="font-normal text-slate-400"> · {INDUSTRY_LABEL[r.brand.industry]}</span>}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-slate-400">
            {r.brand.contactName && <span>{r.brand.contactName}</span>}
            <a href={`mailto:${r.brand.email}`} className="flex items-center gap-1 hover:text-white"><Mail size={12} /> {r.brand.email}</a>
            {r.brand.websiteUrl && <a href={r.brand.websiteUrl} target="_blank" rel="noreferrer" className="hover:text-white">{r.brand.websiteUrl}</a>}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${tone}`}>{label}</span>
      </div>
      <p className="mt-3 whitespace-pre-line text-sm text-slate-200">{r.message}</p>
      {r.brief && (r.brief.productName || r.brief.targetAudience || r.brief.campaignDirection || r.brief.durationSeconds) && (
        <dl className="mt-3 grid gap-x-4 gap-y-1 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs sm:grid-cols-2">
          {[["Product", [r.brief.productName, r.brief.productDescription].filter(Boolean).join(" · ")],
            ["Who it's for", r.brief.targetAudience], ["Look and feel", r.brief.campaignDirection],
            ["Length", r.brief.durationSeconds ? `${r.brief.durationSeconds}s` : null],
            ["Languages", (r.brief.languages || []).join(", ")]]
            .filter(([, v]) => v)
            .map(([k, v]) => <div key={k}><dt className="text-slate-500">{k}</dt><dd className="text-slate-200">{v}</dd></div>)}
        </dl>
      )}
      {r.brief?.images?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {r.brief.images.map((img) => <InquiryImage key={img.id} inquiryId={r.id} image={img} />)}
        </div>
      )}
      <p className="mt-2 text-xs text-slate-500">
        {[BUDGET[r.budgetBand], TIMELINE[r.timeline], r.filmTitle && `about “${r.filmTitle}”`, r.cameFromMail && "came from your email",
          new Date(r.createdAt).toLocaleDateString()].filter(Boolean).join(" · ")}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {r.offered && (
          <>
            <button type="button" disabled={accepting} className="creator-primary rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50"
                    onClick={() => act(() => accept(r.id), "It's yours. Make a brief when you're ready", "Couldn't take this request")}>
              {accepting ? "Taking…" : "Accept"}
            </button>
            <button type="button" disabled={updating} className="rounded-lg px-4 py-2 text-sm font-bold text-slate-400 hover:bg-white/5 hover:text-white"
                    onClick={() => act(() => setStatus({ id: r.id, status: "DECLINED" }), "Passed", "Couldn't update")}>
              Pass
            </button>
            <span className="self-center text-xs text-slate-500">Offered to a few creators; the first to accept takes it.</span>
          </>
        )}
        {open && (
          <>
            <button type="button" disabled={converting} className="creator-primary rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50"
                    onClick={() => act(() => convert(r.id), "Brief created and sent to the brand", "Couldn't create the brief")}>
              {converting ? "Creating…" : "Make a brief"}
            </button>
            <button type="button" disabled={updating} className="rounded-lg px-4 py-2 text-sm font-bold text-slate-400 hover:bg-white/5 hover:text-white"
                    onClick={() => act(() => setStatus({ id: r.id, status: "DECLINED" }), "Declined", "Couldn't update")}>
              Decline
            </button>
          </>
        )}
        {r.briefUrl && (
          <a href={r.briefUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm font-bold text-emerald-300 hover:underline">
            Brief link <ExternalLink size={13} />
          </a>
        )}
      </div>
    </li>
  );
}

/** A product or reference image the brand attached; opens full size in a new tab. */
function InquiryImage({ inquiryId, image }) {
  const { data: url } = useGetInquiryImageQuery({ inquiryId, imageId: image.id });
  return (
    <a href={url || undefined} target="_blank" rel="noreferrer" title={image.fileName || ""}
       className="relative block h-20 w-20 overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10">
      {url && <img src={url} alt={image.fileName || ""} className="h-full w-full object-cover" />}
      <span className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 text-[9px] font-bold text-white">
        {image.kind === "PRODUCT" ? "Product" : "Reference"}
      </span>
    </a>
  );
}
