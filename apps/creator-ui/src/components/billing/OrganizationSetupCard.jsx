// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, AlertTriangle, Building2, CheckCircle2, Loader2, WalletCards } from "lucide-react";

const currency = (amount, code = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: code || "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const inputClass = "w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-purple-400/60";

export default function OrganizationSetupCard({
  organization,
  tenantId,
  wallet,
  isLoading,
  walletLoading,
  minimumBalance = 300,
  minimumLabel = "paid generation",
  isSaving,
  onSubmit,
  onRecharge,
}) {
  const [draft, setDraft] = useState({
    name: "",
    slug: "",
    adminEmail: "",
    countryCode: "IN",
    currency: "INR",
    initialWalletAmount: 1000,
  });

  const isConfigured = Boolean(tenantId || organization?.tenantId || organization?.hasTenant);
  const displayName = organization?.companyName || organization?.name || draft.name || "Creator organization";
  const displayTenantId = tenantId || organization?.tenantId || organization?.id;
  const walletAmount = Number(wallet?.balance ?? wallet?.totalBalance ?? 0);
  const walletCurrency = wallet?.currency || draft.currency || "INR";
  const requiredWalletBalance = Number(minimumBalance) > 0 ? Number(minimumBalance) : 300;
  const showWalletStatus = isConfigured && !walletLoading;
  const walletStatus = showWalletStatus && walletAmount <= 0
    ? {
        tone: "error",
        icon: AlertCircle,
        message: `Wallet balance is zero. Recharge at least ${currency(requiredWalletBalance, walletCurrency)} before starting the ${minimumLabel}.`,
      }
    : showWalletStatus && walletAmount < requiredWalletBalance
      ? {
          tone: "warning",
          icon: AlertTriangle,
          message: `Low balance. Keep at least ${currency(requiredWalletBalance, walletCurrency)} for the ${minimumLabel}.`,
        }
      : null;

  useEffect(() => {
    if (!organization?.name && !organization?.companyName) return;
    setDraft((current) => ({
      ...current,
      name: organization.companyName || organization.name || current.name,
      slug: organization.slug || current.slug,
      countryCode: organization.countryCode || organization.country_code || current.countryCode,
      currency: organization.currency || current.currency,
    }));
  }, [organization]);

  const canSubmit = useMemo(
    () => draft.name.trim().length > 1 && slugify(draft.slug || draft.name).length > 1 && !isSaving,
    [draft.name, draft.slug, isSaving]
  );

  const updateDraft = (key, value) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
      ...(key === "name" && !current.slug ? { slug: slugify(value) } : {}),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit?.({
      ...draft,
      name: draft.name.trim(),
      slug: slugify(draft.slug || draft.name),
      initialWalletAmount: Number(draft.initialWalletAmount) || 0,
    });
  };

  return (
    <section className="creator-panel grid gap-4 p-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)] xl:items-center">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 text-purple-100">
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Building2 size={18} />}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-normal text-purple-200">Organization</p>
            <h2 className="truncate text-lg font-bold text-white">{isConfigured ? displayName : "Set Up Organization"}</h2>
          </div>
        </div>

        {isConfigured ? (
          <div className="mt-4 grid gap-3 border-t border-white/10 pt-3 sm:grid-cols-3">
            <div>
              <p className="text-[11px] font-semibold text-slate-500">Tenant ID</p>
              <p className="mt-1 truncate text-sm font-bold text-white">{displayTenantId || "Connected"}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500">Status</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-emerald-200">
                <CheckCircle2 size={14} /> {organization?.status || "ACTIVE"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500">Wallet Service</p>
              <p className="mt-1 text-sm font-bold text-white">{walletLoading ? "Syncing" : "Connected"}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 grid gap-3 lg:grid-cols-6">
            <label className="lg:col-span-2">
              <span className="text-xs font-semibold text-slate-400">Organization name</span>
              <input className={`${inputClass} mt-1.5`} value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} placeholder="Acme Creator Studio" />
            </label>
            <label className="lg:col-span-2">
              <span className="text-xs font-semibold text-slate-400">Workspace slug</span>
              <input className={`${inputClass} mt-1.5`} value={draft.slug} onChange={(event) => updateDraft("slug", event.target.value)} placeholder="acme-creator" />
            </label>
            <label className="lg:col-span-2">
              <span className="text-xs font-semibold text-slate-400">Admin email</span>
              <input type="email" className={`${inputClass} mt-1.5`} value={draft.adminEmail} onChange={(event) => updateDraft("adminEmail", event.target.value)} placeholder="admin@company.com" />
            </label>
            <label className="lg:col-span-2">
              <span className="text-xs font-semibold text-slate-400">Country</span>
              <select className={`${inputClass} mt-1.5`} value={draft.countryCode} onChange={(event) => updateDraft("countryCode", event.target.value)}>
                <option value="IN">India</option>
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="AE">UAE</option>
              </select>
            </label>
            <label className="lg:col-span-2">
              <span className="text-xs font-semibold text-slate-400">Wallet currency</span>
              <select className={`${inputClass} mt-1.5`} value={draft.currency} onChange={(event) => updateDraft("currency", event.target.value)}>
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="AED">AED</option>
              </select>
            </label>
            <label className="lg:col-span-2">
              <span className="text-xs font-semibold text-slate-400">Initial wallet amount</span>
              <input type="number" min="0" step="100" className={`${inputClass} mt-1.5`} value={draft.initialWalletAmount} onChange={(event) => updateDraft("initialWalletAmount", event.target.value)} />
            </label>
            <div className="lg:col-span-6">
              <button type="submit" disabled={!canSubmit} className="creator-primary flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
                {isSaving && <Loader2 size={16} className="animate-spin" />}
                Set Up Organization
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="border-t border-white/10 pt-4 xl:border-l xl:border-t-0 xl:pl-4 xl:pt-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-200">
              {walletLoading ? <Loader2 size={18} className="animate-spin" /> : <WalletCards size={18} />}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Wallet Balance</p>
              <p className="text-xl font-bold text-white">{currency(walletAmount, walletCurrency)}</p>
            </div>
          </div>
          <button type="button" onClick={onRecharge} disabled={!isConfigured} className="creator-control px-3 py-2 text-xs font-bold text-emerald-100 disabled:opacity-40">
            Recharge
          </button>
        </div>
        <p className="mt-3 text-xs font-medium leading-5 text-slate-500">
          Keep at least {currency(requiredWalletBalance, walletCurrency)} in this wallet before starting the {minimumLabel}. Paid actions use the tenant wallet balance returned by billing service.
        </p>
        {walletStatus && (
          <WalletStatusMessage status={walletStatus} />
        )}
      </div>
    </section>
  );
}

function WalletStatusMessage({ status }) {
  const Icon = status.icon;
  const isError = status.tone === "error";
  return (
    <div className={`mt-3 flex items-start gap-2 rounded-lg border p-3 text-xs font-bold leading-5 ${
      isError
        ? "border-rose-300/25 bg-rose-400/10 text-rose-100"
        : "border-amber-300/25 bg-amber-300/10 text-amber-100"
    }`}>
      <Icon size={15} className="mt-0.5 shrink-0" />
      <span>{status.message}</span>
    </div>
  );
}
