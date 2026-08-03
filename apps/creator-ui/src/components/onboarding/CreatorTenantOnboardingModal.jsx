// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AlertCircle, ArrowRight, CheckCircle2, ChevronDown, Clock, Globe2, Loader2, MapPin, Phone, ShieldCheck, Sparkles, User, WalletCards } from "lucide-react";
import {
  clearTenant,
  selectTenantId,
  setTenantIdentity,
  showFlash,
} from "@dalaillama/shared-store";
import {
  useGetOrganizationQuery,
  useSetupOrganizationMutation,
} from "../../api/creatorEndpoints.js";

const COUNTRIES = [
  { code: "IN", label: "India", dialCode: "+91", placeholder: "98765 43210", currency: "INR", timezone: "Asia/Kolkata" },
  { code: "US", label: "United States", dialCode: "+1", placeholder: "555 012 3456", currency: "USD", timezone: "America/New_York" },
  { code: "GB", label: "United Kingdom", dialCode: "+44", placeholder: "7400 123456", currency: "GBP", timezone: "Europe/London" },
  { code: "AE", label: "UAE", dialCode: "+971", placeholder: "50 123 4567", currency: "AED", timezone: "Asia/Dubai" },
  { code: "SG", label: "Singapore", dialCode: "+65", placeholder: "8123 4567", currency: "SGD", timezone: "Asia/Singapore" },
];

const TIMEZONES = [
  { value: "Asia/Kolkata", label: "IST (UTC+5:30)" },
  { value: "America/New_York", label: "EST (UTC-5)" },
  { value: "America/Los_Angeles", label: "PST (UTC-8)" },
  { value: "Europe/London", label: "GMT (UTC+0)" },
  { value: "Asia/Dubai", label: "GST (UTC+4)" },
  { value: "Asia/Singapore", label: "SGT (UTC+8)" },
];

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm font-semibold text-white outline-none transition focus:border-purple-400/60 focus:bg-white/[0.08]";

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "creator-workspace";

const sanitizeTenantId = (tenantId) => {
  if (!tenantId) return null;
  const normalized = String(tenantId).trim();
  if (!normalized || normalized === "undefined" || normalized === "null") return null;
  return normalized;
};

const normalizeDigits = (value) => String(value || "").replace(/[^\d]/g, "");

const getCountryMeta = (code) => COUNTRIES.find((country) => country.code === code) || COUNTRIES[0];

const persistTenant = (identity) => {
  try {
    if (typeof window === "undefined" || !identity?.tenantId) return;
    window.localStorage.setItem("tenantId", identity.tenantId);
    if (identity.slug) window.localStorage.setItem("tenant_slug", identity.slug);
    window.localStorage.setItem(
      "creator_tenant_context",
      JSON.stringify({ tenantId: identity.tenantId, slug: identity.slug || null })
    );
  } catch {
    // Redux carries the live state if storage is unavailable.
  }
};

const extractIdentity = (organization = {}, fallback = {}) => {
  const tenantId = sanitizeTenantId(organization?.tenantId || organization?.tenant_id || organization?.id);
  const name = organization?.name || organization?.companyName || organization?.company_name || fallback?.name || fallback?.companyName || "Creator Workspace";
  return {
    tenantId,
    slug: organization?.slug || fallback?.slug || slugify(name),
    name,
    companyName: organization?.companyName || organization?.company_name || fallback?.companyName || name,
  };
};

const validateForm = (form) => {
  const errors = {};
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const country = getCountryMeta(form.country);
  const dialDigits = normalizeDigits(country.dialCode);
  const phoneDigits = normalizeDigits(form.primaryContactPhone);
  const nationalDigits = phoneDigits.startsWith(dialDigits)
    ? phoneDigits.slice(dialDigits.length)
    : phoneDigits;

  if (!form.name || form.name.trim().length < 3) errors.name = "Min 3 chars required";
  if (!form.companyName || form.companyName.trim().length < 2) errors.companyName = "Entity name required";
  if (!form.primaryContactName || form.primaryContactName.trim().length < 2) errors.primaryContactName = "Full name required";
  if (!form.primaryContactEmail || !emailRegex.test(form.primaryContactEmail)) errors.primaryContactEmail = "Valid email required";
  if (!phoneDigits.startsWith(dialDigits) || nationalDigits.length < 6 || nationalDigits.length > 12) {
    errors.primaryContactPhone = `Use ${country.dialCode} and a valid mobile number`;
  }

  return errors;
};

const buildPayload = (form) => {
  const country = getCountryMeta(form.country);
  const slug = slugify(form.name || form.companyName);
  const currency = country.currency || "INR";
  return {
    name: form.name.trim(),
    companyName: form.companyName.trim(),
    organizationName: form.companyName.trim(),
    slug,
    primaryContactName: form.primaryContactName.trim(),
    primaryContactEmail: form.primaryContactEmail.trim(),
    primaryContactPhone: `+${normalizeDigits(form.primaryContactPhone)}`,
    adminEmail: form.primaryContactEmail.trim(),
    country: form.country,
    countryCode: form.country,
    timezone: form.timezone,
    productCode: "CREATOR",
    requestedApps: ["CREATOR"],
    planCode: "CREATOR_STARTER",
    currency,
    wallet: {
      currency,
      initialAmount: Number(form.initialWalletAmount) || 0,
    },
    metadata: {
      source: "creator-ui",
      onboardingSurface: "post-login-modal",
    },
  };
};

function FormField({ label, field, type = "text", placeholder, icon: Icon, form, errors, touched, onBlur, onChange }) {
  const hasError = touched[field] && errors[field];
  const isSuccess = touched[field] && !errors[field];

  return (
    <label className="block min-w-0">
      <span className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-normal text-slate-400">
        {label} <span className="text-rose-300">*</span>
      </span>
      <span className="relative block">
        {Icon && <Icon size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${hasError ? "text-rose-300" : "text-slate-500"}`} />}
        <input
          type={type}
          value={form[field]}
          placeholder={placeholder}
          onBlur={() => onBlur(field)}
          onChange={(event) => onChange(field, event.target.value)}
          className={`${inputClass} ${Icon ? "pl-9" : ""} ${hasError ? "border-rose-300/70" : ""}`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          {hasError ? <AlertCircle size={15} className="text-rose-300" /> : isSuccess ? <CheckCircle2 size={15} className="text-emerald-300" /> : null}
        </span>
      </span>
      {hasError && <span className="mt-1 block text-[11px] font-semibold text-rose-300">{errors[field]}</span>}
    </label>
  );
}

export default function CreatorTenantOnboardingModal() {
  const dispatch = useDispatch();
  const reduxTenantId = sanitizeTenantId(useSelector(selectTenantId));
  const authUser = useSelector((state) => state.auth?.user || null);
  const authTenantId = sanitizeTenantId(authUser?.tenantId);

  const {
    data: organization = {},
    isFetching,
    isLoading,
    isError,
    refetch,
  } = useGetOrganizationQuery(undefined, { refetchOnMountOrArgChange: true });
  const [setupOrganization, setupState] = useSetupOrganizationMutation();
  const [serverError, setServerError] = useState(null);
  const [completedTenantId, setCompletedTenantId] = useState(null);
  const [touched, setTouched] = useState({});

  const initialCountry = getCountryMeta("IN");
  const [form, setForm] = useState({
    name: "",
    companyName: "",
    primaryContactName: authUser?.name || "",
    primaryContactEmail: authUser?.email || "",
    primaryContactPhone: initialCountry.dialCode,
    country: initialCountry.code,
    timezone: initialCountry.timezone,
    initialWalletAmount: 1000,
  });

  useEffect(() => {
    setForm((current) => ({
      ...current,
      primaryContactName: current.primaryContactName || authUser?.name || "",
      primaryContactEmail: current.primaryContactEmail || authUser?.email || "",
    }));
  }, [authUser?.email, authUser?.name]);

  const organizationTenantId = sanitizeTenantId(organization?.tenantId || organization?.id);
  const backendSaysNoTenant = organization?.hasTenant === false;
  const activeTenantId = backendSaysNoTenant
    ? organizationTenantId || completedTenantId
    : reduxTenantId || organizationTenantId || completedTenantId || authTenantId;
  const shouldShow = !isLoading && !isFetching && !activeTenantId && organization?.needsOnboarding !== false;
  const country = getCountryMeta(form.country);
  const errors = useMemo(() => validateForm(form), [form]);
  const isValid = Object.keys(errors).length === 0;

  useEffect(() => {
    if (!organizationTenantId || reduxTenantId === organizationTenantId) return;
    const identity = extractIdentity(organization);
    dispatch(setTenantIdentity(identity));
    persistTenant(identity);
  }, [dispatch, organization, organizationTenantId, reduxTenantId]);

  useEffect(() => {
    if (organization?.hasTenant !== false) return;
    try {
      window.localStorage.removeItem("tenantId");
      window.localStorage.removeItem("tenant_slug");
      window.localStorage.removeItem("creator_tenant_context");
    } catch {
      // Storage cleanup is best-effort.
    }
    if (reduxTenantId) dispatch(clearTenant());
  }, [dispatch, organization?.hasTenant, reduxTenantId]);

  const flash = (message, type = "success") => {
    dispatch(showFlash({ message, type }));
  };

  const handleBlur = (field) => setTouched((current) => ({ ...current, [field]: true }));

  const handleChange = (field, value) => {
    setForm((current) => {
      if (field === "country") {
        const nextCountry = getCountryMeta(value);
        const previousCountry = getCountryMeta(current.country);
        const previousDialDigits = normalizeDigits(previousCountry.dialCode);
        const currentDigits = normalizeDigits(current.primaryContactPhone);
        const nationalDigits = currentDigits.startsWith(previousDialDigits)
          ? currentDigits.slice(previousDialDigits.length)
          : currentDigits;

        return {
          ...current,
          country: value,
          timezone: nextCountry.timezone,
          primaryContactPhone: `${nextCountry.dialCode}${nationalDigits}`,
        };
      }

      if (field === "primaryContactPhone") {
        const dialDigits = normalizeDigits(country.dialCode);
        const nextDigits = normalizeDigits(value);
        const nationalDigits = nextDigits.startsWith(dialDigits)
          ? nextDigits.slice(dialDigits.length)
          : nextDigits;
        return {
          ...current,
          primaryContactPhone: `${country.dialCode}${nationalDigits}`,
        };
      }

      return { ...current, [field]: value };
    });
  };

  const submit = async () => {
    const allTouched = Object.keys(form).reduce((next, key) => ({ ...next, [key]: true }), {});
    setTouched(allTouched);
    if (!isValid || setupState.isLoading) return;

    setServerError(null);
    const payload = buildPayload(form);
    let result;

    try {
      result = await setupOrganization(payload).unwrap();
    } catch (error) {
      const message = error?.data?.message || error?.message || "Organization setup failed. Please try again.";
      setServerError(message);
      flash(message, "error");
      return;
    }

    const identity = extractIdentity(result, {
      name: payload.name,
      companyName: payload.companyName,
      slug: payload.slug,
    });

    if (!identity.tenantId) {
      const message = "Organization created, but backend did not return a tenant id.";
      setServerError(message);
      flash(message, "warning");
      return;
    }

    dispatch(setTenantIdentity(identity));
    persistTenant(identity);
    setCompletedTenantId(identity.tenantId);

    void refetch?.();
    flash("Organization created and wallet service connected.");
  };

  if (!shouldShow) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-[#05070d]/82 px-4 py-6 backdrop-blur-md">
      <div className="creator-panel grid w-full max-w-5xl overflow-hidden lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="border-b border-white/10 bg-white/[0.035] p-5 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-purple-500/20 text-purple-100">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-normal text-purple-200">Creator onboarding</p>
              <h2 className="text-xl font-bold text-white">Setup Organization</h2>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {[
              ["Workspace identity", "Company name and creator tenant handle"],
              ["Authorized contact", "Admin contact for backend tenant ownership"],
              ["Wallet service", "Optional opening balance for paid generations"],
            ].map(([title, detail], index) => (
              <div key={title} className="flex gap-3">
                <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${index === 0 ? "bg-purple-600 text-white" : "bg-white/10 text-slate-300"}`}>
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{title}</p>
                  <p className="mt-0.5 text-xs font-medium leading-5 text-slate-400">{detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg border border-emerald-300/15 bg-emerald-300/10 p-3">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-200">
              <WalletCards size={16} />
              Wallet ready after setup
            </div>
            <p className="mt-2 text-xs font-medium leading-5 text-emerald-50/70">
              Creator generation checks will use this tenant wallet before paid AI actions.
            </p>
          </div>
        </aside>

        <section className="p-5 md:p-6">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Create your creator workspace</h3>
              <p className="mt-1 text-sm font-medium text-slate-400">
                This links creator-ui to tenant-service, billing, wallet, and creator-service calls.
              </p>
            </div>
            {isError && (
              <button type="button" onClick={() => refetch?.()} className="creator-control px-3 py-2 text-xs font-bold text-slate-200">
                Retry check
              </button>
            )}
          </div>

          {serverError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-100">
              <AlertCircle size={16} />
              {serverError}
            </div>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
            className="grid gap-4 md:grid-cols-2"
          >
            <FormField label="Tenant handle" field="name" placeholder="acme-creators" icon={ShieldCheck} form={form} errors={errors} touched={touched} onBlur={handleBlur} onChange={handleChange} />
            <FormField label="Legal entity" field="companyName" placeholder="Acme Creator Studio" icon={Globe2} form={form} errors={errors} touched={touched} onBlur={handleBlur} onChange={handleChange} />
            <FormField label="Authorized contact" field="primaryContactName" placeholder="Akash Sharma" icon={User} form={form} errors={errors} touched={touched} onBlur={handleBlur} onChange={handleChange} />
            <FormField label="Business email" field="primaryContactEmail" type="email" placeholder="admin@company.com" icon={Sparkles} form={form} errors={errors} touched={touched} onBlur={handleBlur} onChange={handleChange} />
            <FormField label="Phone number" field="primaryContactPhone" type="tel" placeholder={`${country.dialCode} ${country.placeholder}`} icon={Phone} form={form} errors={errors} touched={touched} onBlur={handleBlur} onChange={handleChange} />

            <label className="block">
              <span className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-normal text-slate-400">Region</span>
              <span className="relative block">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <select className={`${inputClass} appearance-none pl-9 pr-9`} value={form.country} onChange={(event) => handleChange("country", event.target.value)}>
                  {COUNTRIES.map((item) => (
                    <option key={item.code} value={item.code}>{item.label}</option>
                  ))}
                </select>
                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-normal text-slate-400">Timezone</span>
              <span className="relative block">
                <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <select className={`${inputClass} appearance-none pl-9 pr-9`} value={form.timezone} onChange={(event) => handleChange("timezone", event.target.value)}>
                  {TIMEZONES.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-normal text-slate-400">Initial wallet amount</span>
              <span className="relative block">
                <WalletCards size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="number"
                  min="0"
                  step="100"
                  className={`${inputClass} pl-9`}
                  value={form.initialWalletAmount}
                  onChange={(event) => handleChange("initialWalletAmount", event.target.value)}
                />
              </span>
            </label>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={setupState.isLoading || (Object.keys(touched).length > 0 && !isValid)}
                className="creator-primary flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {setupState.isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating workspace...
                  </>
                ) : (
                  <>
                    Initialize Workspace
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
