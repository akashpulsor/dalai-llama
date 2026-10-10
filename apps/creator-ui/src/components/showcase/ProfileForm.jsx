// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { CheckCircle2, ExternalLink, Loader2, Save } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useGetMyPublicProfileQuery,
  useLazyCheckHandleQuery,
  useUpdateMyPublicProfileMutation,
} from "../../api/showcaseEndpoints.js";
import { CHECKLIST_LABEL, INDUSTRIES, errorMessage } from "./showcaseLabels.js";

const MAX_INDUSTRIES = 3;

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400/60";
const labelClass = "mb-1.5 block text-[10px] font-bold uppercase tracking-normal text-slate-500";

/** The creator's public profile: what brands see at dalaillama.in/c/<handle>, plus the checklist of
 * what's still missing before it shows. */
export default function ProfileForm() {
  const dispatch = useDispatch();
  const { data: profile, isLoading, error } = useGetMyPublicProfileQuery();
  const [save, saveState] = useUpdateMyPublicProfileMutation();
  const [checkHandle, handleCheck] = useLazyCheckHandleQuery();
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!profile) return;
    setForm({
      handle: profile.handle,
      displayName: profile.displayName || "",
      headline: profile.headline || "",
      bio: profile.bio || "",
      countryCode: profile.countryCode || "",
      websiteUrl: profile.websiteUrl || "",
      industries: [...(profile.industries || [])],
      autoPicksEnabled: profile.autoPicksEnabled,
    });
  }, [profile]);

  if (isLoading) {
    return <p className="flex items-center gap-2 text-sm text-slate-400"><Loader2 size={14} className="animate-spin" /> Loading your profile…</p>;
  }
  if (error?.status === 404) {
    return (
      <p className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
        Your public profile is created when you subscribe. Once your plan is active it will appear here.
      </p>
    );
  }
  if (error || !form) {
    return <p className="text-sm text-rose-200">{errorMessage(error, "Could not load your profile.")}</p>;
  }

  const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));
  const toggleIndustry = (code) => setForm((f) => {
    const has = f.industries.includes(code);
    if (!has && f.industries.length >= MAX_INDUSTRIES) return f;
    return { ...f, industries: has ? f.industries.filter((c) => c !== code) : [...f.industries, code] };
  });

  const handleChanged = form.handle !== profile.handle;
  const handleResult = handleChanged ? handleCheck.data : null;

  const onSave = async () => {
    try {
      await save({
        ...form,
        headline: form.headline || null,
        bio: form.bio || null,
        countryCode: form.countryCode || null,
        websiteUrl: form.websiteUrl || null,
      }).unwrap();
      dispatch(showFlash({ message: "Profile saved", type: "success" }));
    } catch (e) {
      dispatch(showFlash({ message: errorMessage(e, "Could not save your profile"), type: "error" }));
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <section className="creator-panel p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={labelClass}>Profile link</span>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-sm text-slate-400">dalaillama.in/c/</span>
              <input
                id="handle"
                value={form.handle}
                onChange={set("handle")}
                onBlur={() => handleChanged && checkHandle(form.handle)}
                className={inputClass}
                disabled={Boolean(profile.handleChangeAllowedFrom)}
              />
            </div>
            {profile.handleChangeAllowedFrom && (
              <span className="mt-1 block text-xs text-slate-400">
                You can change your link again from {new Date(profile.handleChangeAllowedFrom).toLocaleDateString()}.
              </span>
            )}
            {handleResult && (
              <span className={`mt-1 block text-xs ${handleResult.available ? "text-emerald-300" : "text-rose-300"}`}>
                {handleResult.available
                  ? `dalaillama.in/c/${handleResult.handle} is free`
                  : `dalaillama.in/c/${handleResult.handle} can't be used (${handleResult.reason.toLowerCase().replace("_", " ")})`}
              </span>
            )}
          </label>
          <label className="block">
            <span className={labelClass}>Name brands see</span>
            <input id="displayName" value={form.displayName} onChange={set("displayName")} maxLength={80} className={inputClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Country (2 letters)</span>
            <input id="countryCode" value={form.countryCode} onChange={set("countryCode")} maxLength={2} placeholder="IN" className={inputClass} />
          </label>
          <label className="block sm:col-span-2">
            <span className={labelClass}>Headline</span>
            <input id="headline" value={form.headline} onChange={set("headline")} maxLength={120}
                   placeholder="Short, punchy food and drink ads" className={inputClass} />
          </label>
          <label className="block sm:col-span-2">
            <span className={labelClass}>About</span>
            <textarea id="bio" value={form.bio} onChange={set("bio")} maxLength={1000} rows={4} className={inputClass} />
          </label>
          <label className="block sm:col-span-2">
            <span className={labelClass}>Website</span>
            <input id="websiteUrl" value={form.websiteUrl} onChange={set("websiteUrl")} placeholder="https://" className={inputClass} />
          </label>
          <fieldset className="sm:col-span-2">
            <legend className={labelClass}>Industries you work in (up to {MAX_INDUSTRIES})</legend>
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map(([code, label]) => {
                const on = form.industries.includes(code);
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => toggleIndustry(code)}
                    aria-pressed={on}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                      on ? "border-purple-400/60 bg-purple-500/20 text-purple-100" : "border-white/10 text-slate-300 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <label className="flex items-start gap-3 sm:col-span-2">
            <input
              id="autoPicksEnabled"
              type="checkbox"
              checked={form.autoPicksEnabled}
              onChange={(e) => setForm((f) => ({ ...f, autoPicksEnabled: e.target.checked }))}
              className="mt-1 h-4 w-4 accent-purple-500"
            />
            <span className="text-sm text-slate-300">
              Include my work in automatic picks we email to brands in my industries
            </span>
          </label>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onSave}
            disabled={saveState.isLoading || (handleChanged && handleResult && !handleResult.available)}
            className="creator-primary flex min-h-9 items-center gap-2 px-4 text-xs font-black text-white disabled:opacity-50"
          >
            {saveState.isLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save profile
          </button>
        </div>
      </section>

      <aside className="space-y-4">
        <section className="creator-panel p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Your public page</p>
          <a href={profile.publicUrl} target="_blank" rel="noreferrer"
             className="mt-1 flex items-center gap-1.5 break-all text-sm font-bold text-purple-200 hover:text-purple-100">
            {profile.publicUrl.replace("https://", "")} <ExternalLink size={13} />
          </a>
          {profile.avatarUrl && (
            <img src={profile.avatarUrl} alt="" className="mt-3 h-16 w-16 rounded-full border border-white/10 object-cover" />
          )}
        </section>
        <section className="creator-panel p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Before brands can see you</p>
          {profile.missing.length === 0 ? (
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-emerald-300">
              <CheckCircle2 size={15} /> Your profile is complete
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {profile.missing.map((m) => (
                <li key={m} className="text-sm text-slate-300">• {CHECKLIST_LABEL[m] || m}</li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </div>
  );
}
