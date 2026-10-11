// @ts-nocheck
import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAddCompaniesToAudienceMutation, useCreateAudienceMutation, useLazySearchBrandsQuery } from "../../api/showcaseEndpoints.js";
import { errorMessage, INDUSTRIES } from "../showcase/showcaseLabels.js";

const COUNTRIES = [["IN", "India"], ["", "Any country"], ["US", "United States"], ["GB", "United Kingdom"], ["AE", "United Arab Emirates"],
  ["SG", "Singapore"], ["AU", "Australia"], ["CA", "Canada"]];
const control = "rounded-lg border border-white/10 bg-[#0b0f19] px-3 py-2 text-sm text-white";

/** Send step: make an audience in one go from brands (the shared directory first, then the outside
 * search), so a creator never has to leave the page to have someone to send to. */
export default function QuickAudience({ onCreated }) {
  const [industry, setIndustry] = useState("FASHION");
  const [country, setCountry] = useState("IN");
  const [search] = useLazySearchBrandsQuery();
  const [createAudience] = useCreateAudienceMutation();
  const [addCompanies] = useAddCompaniesToAudienceMutation();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const build = async () => {
    setBusy(true);
    setMessage("");
    try {
      const found = await search({ industry, country }).unwrap();
      const ids = (found.companies || []).slice(0, 25).map((c) => c.id);
      if (ids.length === 0) {
        setMessage(found.notice || "No brands found for that yet. Try another industry or country, or upload a CSV below.");
        return;
      }
      const label = INDUSTRIES.find(([code]) => code === industry)?.[1] || "Brands";
      const name = `${label}${country ? ` · ${COUNTRIES.find(([c]) => c === country)?.[1]}` : ""} · ${new Date().toLocaleDateString()}`;
      const audience = await createAudience(name.slice(0, 80)).unwrap();
      const added = await addCompanies({ audienceId: audience.id, companyIds: ids }).unwrap();
      onCreated(audience.id);
      setMessage(`Made "${audience.name}": ${added.companiesAdded} brands${added.companiesWithoutContacts ? `, ${added.companiesWithoutContacts} still need a contact email (add them under Your audiences below)` : ""}.`
        + (found.notice ? ` ${found.notice}` : ""));
    } catch (e) {
      setMessage(errorMessage(e, "Couldn't build the audience"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs font-bold text-slate-200">Build an audience from brands</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <select value={industry} onChange={(e) => setIndustry(e.target.value)} className={control} aria-label="Industry">
          {INDUSTRIES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
        </select>
        <select value={country} onChange={(e) => setCountry(e.target.value)} className={control} aria-label="Country">
          {COUNTRIES.map(([code, label]) => <option key={code || "any"} value={code}>{label}</option>)}
        </select>
        <button type="button" onClick={build} disabled={busy} className="creator-primary flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
          {busy && <Loader2 size={13} className="animate-spin" />} Build audience
        </button>
      </div>
      {message && <p className="mt-2 text-xs text-slate-300">{message}</p>}
    </div>
  );
}
