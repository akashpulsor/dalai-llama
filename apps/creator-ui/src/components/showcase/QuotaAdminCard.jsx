// @ts-nocheck
import React, { useState } from "react";
import { useAdminBrandCreditsQuery, useAdminSetYouTubeQuotaMutation, useAdminYouTubeQuotaQuery } from "../../api/showcaseEndpoints.js";

/** Rules 41-42 for ops: the YouTube quota is shared by every creator (it belongs to our Google
 * Cloud project), so uploads queue once today's budget is spent and continue after the reset.
 * Raise the budget here after Google grants more quota. Also shows brand-directory credits. */
export default function QuotaAdminCard() {
  const { data: quota } = useAdminYouTubeQuotaQuery(undefined, { pollingInterval: 60000 });
  const { data: credits } = useAdminBrandCreditsQuery();
  const [save, saveState] = useAdminSetYouTubeQuotaMutation();
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");

  if (!quota) return null;
  const edit = form || { dailyLimit: quota.dailyLimit, uploadUnits: quota.uploadUnits };
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await save({ dailyLimit: Number(edit.dailyLimit), uploadUnits: Number(edit.uploadUnits) }).unwrap();
      setForm(null);
    } catch (e) { setError(e?.data?.message || "Couldn't save"); }
  };
  const input = "w-28 rounded-md border border-white/10 bg-[#0b0f19] px-2 py-1 text-white";

  return (
    <div className="rounded-lg border border-white/10 p-4">
      <h3 className="font-bold text-slate-200">YouTube upload budget (shared by all creators)</h3>
      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div><dt className="text-slate-500">Used today</dt><dd className="font-bold text-slate-200">{quota.unitsUsed} / {quota.dailyLimit} units</dd></div>
        <div><dt className="text-slate-500">Uploads today</dt><dd className="font-bold text-slate-200">{quota.uploadsToday} done · {quota.uploadsLeftToday} left</dd></div>
        <div><dt className="text-slate-500">Queue</dt><dd className="font-bold text-slate-200">{quota.waitingJobs} waiting · {quota.uploadingJobs} uploading</dd></div>
        <div><dt className="text-slate-500">Resets</dt><dd className="font-bold text-slate-200">{new Date(quota.resetsAt).toLocaleString()}</dd></div>
      </dl>
      <form onSubmit={submit} className="mt-4 flex flex-wrap items-end gap-3 text-xs">
        <label className="text-slate-400">Daily units
          <input type="number" min={100} value={edit.dailyLimit} onChange={(e) => setForm({ ...edit, dailyLimit: e.target.value })} className={`${input} mt-1 block`} />
        </label>
        <label className="text-slate-400">Units per upload
          <input type="number" min={1} value={edit.uploadUnits} onChange={(e) => setForm({ ...edit, uploadUnits: e.target.value })} className={`${input} mt-1 block`} />
        </label>
        <button type="submit" disabled={!form || saveState.isLoading} className="rounded-md border border-white/15 px-3 py-1.5 font-bold text-slate-200 disabled:opacity-40">
          Save
        </button>
        <span className="text-slate-500">Raise this only after Google approves more quota.</span>
      </form>
      {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
      {credits && (
        <p className="mt-4 border-t border-white/10 pt-3 text-xs text-slate-400">
          Brand directory (Hunter.io): {credits.configured
            ? `${credits.usedThisMonth} of ${credits.monthlyCredits} email lookups used this month`
            : "no API key set, so searches only show brands already in the directory"}
        </p>
      )}
    </div>
  );
}
