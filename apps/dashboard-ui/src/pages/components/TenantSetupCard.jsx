// @ts-check
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ArrowLeft, Phone, PhoneOutgoing, UserCircle, ArrowRight, PhoneCall,
  Headphones, MessageSquare, X, Search, ShoppingBag, LogOut,
  CheckCircle2, ChevronRight, ChevronLeft, LayoutDashboard, Settings,
  ShieldCheck, HelpCircle, Menu, CreditCard, UserCheck, BarChart3,
  MapPin, Clock, Loader2, AlertCircle, Cpu, Sparkles, Wallet,
  ChevronDown, User, Plus, History, AlertTriangle, Globe, Beaker, Zap
} from "lucide-react";

import { useTenantRegisterMutation } from "@dalaillama/shared-store";
/* ============================================================================
 * TYPE DEFINITIONS (JSDoc)
 * ========================================================================== */
/** @typedef {'AI_CONTACT_CENTER'|'CONVERSATIONAL_IVR'|'BASIC_PBX'|'OUTBOUND_DIALER'|'VIRTUAL_RECEPTIONIST'} ProductType */
/**
 * @typedef {Object} TenantForm
 * @property {string} name
 * @property {string} companyName
 * @property {string} primaryContactName
 * @property {string} primaryContactEmail
 * @property {string} primaryContactPhone
 * @property {string} country
 * @property {string} timezone
 */

/**
 * Updated to allow indexing by any key present in TenantForm
 * @typedef {Object} ValidationErrors
 * @property {string} [name]
 * @property {string} [companyName]
 * @property {string} [primaryContactName]
 * @property {string} [primaryContactEmail]
 * @property {string} [primaryContactPhone]
 * @property {string} [country]
 * @property {string} [timezone]
 */

/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} code
 * @property {string} name
 * @property {string} description
 * @property {ProductType} type
  * @property {boolean} active@property {Object.<string, boolean>} [features] - Key-value map of feature flags.
 */

/* ============================================================================
 * CONFIG & CONSTANTS
 * ========================================================================== */

/** @type {{ code: string; label: string; dialCode: string; placeholder: string }[]} */
const COUNTRIES = [
  { code: "IN", label: "India", dialCode: "+91", placeholder: "98765 43210" },
  { code: "US", label: "United States", dialCode: "+1", placeholder: "555 012 3456" },
  { code: "GB", label: "United Kingdom", dialCode: "+44", placeholder: "7400 123456" },
  { code: "DE", label: "Germany", dialCode: "+49", placeholder: "1512 3456789" },
  { code: "SG", label: "Singapore", dialCode: "+65", placeholder: "8123 4567" },
];

/** @type {{ value: string; label: string }[]} */
const TIMEZONES = [
  { value: "Asia/Kolkata", label: "IST (UTC+5:30)" },
  { value: "America/New_York", label: "EST (UTC-5)" },
  { value: "America/Los_Angeles", label: "PST (UTC-8)" },
  { value: "Europe/London", label: "GMT (UTC+0)" },
  { value: "Europe/Berlin", label: "CET (UTC+1)" },
  { value: "Asia/Singapore", label: "SGT (UTC+8)" },
];

/* ============================================================================
 * UTILS
 * ========================================================================== */

/**
 * @param {string} countryCode
 * @returns {{ code: string; label: string; dialCode: string; placeholder: string }}
 */
const getCountryMeta = (countryCode) =>
  COUNTRIES.find((country) => country.code === countryCode) || COUNTRIES[0];

/**
 * @param {string} value
 * @returns {string}
 */
const normalizePhoneDigits = (value) => value.replace(/[^\d]/g, "");

/**
 * Centralized Validation Logic
 * @param {TenantForm} values
 * @returns {ValidationErrors}
 */
const validateForm = (values) => {
  const errors = {};
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const selectedCountry = getCountryMeta(values.country);
  const dialDigits = normalizePhoneDigits(selectedCountry.dialCode);
  const cleanPhone = normalizePhoneDigits(values.primaryContactPhone);

  if (!values.name || values.name.trim().length < 3) {
    errors.name = "Min 3 chars required";
  }
  if (!values.companyName || values.companyName.trim().length < 2) {
    errors.companyName = "Entity name required";
  }
  if (!values.primaryContactName || values.primaryContactName.trim().length < 2) {
    errors.primaryContactName = "Full name required";
  }
  if (!values.primaryContactEmail || !emailRegex.test(values.primaryContactEmail)) {
    errors.primaryContactEmail = "Valid email required";
  }
  if (!cleanPhone.startsWith(dialDigits)) {
    errors.primaryContactPhone = `Must start with ${selectedCountry.dialCode}`;
  } else {
    const nationalNumber = cleanPhone.slice(dialDigits.length);
    if (nationalNumber.length < 6 || nationalNumber.length > 12) {
      errors.primaryContactPhone = "Enter a valid mobile number";
    }
  }

  return errors;
};

/* ============================================================================
 * SUB-COMPONENTS
 * ========================================================================== */

/**
 * Moved outside to prevent re-declaration (and cursor jumping) on every render
 * @param {Object} props
 * @param {string} props.label
 * @param {keyof TenantForm} props.field
 * @param {string} [props.type]
 * @param {string} props.placeholder
 * @param {React.ElementType} [props.icon]
 * @param {TenantForm} props.form
 * @param {ValidationErrors} props.fieldErrors
 * @param {Object<string, boolean>} props.touched
 * @param {(field: string) => void} props.onBlur
 * @param {(field: keyof TenantForm, value: string) => void} props.onChange
 */
const FormField = ({ label, field, type = "text", placeholder, icon: Icon, form, fieldErrors, touched, onBlur, onChange }) => {
  const hasError = touched[field] && fieldErrors[field];
  const isSuccess = touched[field] && !fieldErrors[field];

  return (
    //<div className="flex flex-col gap-1.5 relative pb-5">
    <div className="flex flex-col gap-1 relative pb-4">
      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-tight flex items-center gap-1">
        {label} <span className="text-rose-500">*</span>
      </label>
      
      <div className="relative">
        {Icon && (
          <Icon size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${hasError ? 'text-rose-400' : 'text-slate-400'}`} />
        )}
        <input 
          type={type}
          className={`w-full border rounded-xl ${Icon ? 'pl-9' : 'px-3'} pr-9 py-2 text-sm outline-none transition-all duration-200 ${
            hasError 
              ? 'border-rose-300 bg-rose-50/20 focus:border-rose-500' 
              : isSuccess 
                ? 'border-emerald-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10'
                : 'border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10'
          }`}
          placeholder={placeholder}
          value={form[field]}
          onBlur={() => onBlur(field)}
          onChange={(e) => onChange(field, e.target.value)}
        />
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
          {hasError ? (
            <AlertCircle size={14} className="text-rose-500 animate-in zoom-in duration-200" />
          ) : isSuccess ? (
            <CheckCircle2 size={14} className="text-emerald-500 animate-in zoom-in duration-200" />
          ) : null}
        </div>
      </div>

      {hasError && (
        <p className="absolute bottom-0 left-1 text-[9px] font-bold text-rose-500 uppercase tracking-tighter animate-in fade-in slide-in-from-top-1">
          {fieldErrors[field]}
        </p>
      )}
    </div>
  );
};

/**
 * @param {Object} props
 * @param {(tenant: any) => void} props.onCreated
 * @param {{ email?: string; username?: string }} [props.authProfile]
 */
const TenantSetupCard = ({ onCreated, authProfile }) => {

  const [serverError, setServerError] = useState(/** @type {string|null} */ (null));
  const [touched, setTouched] = useState(/** @type {Object<string, boolean>} */ ({}));
  
  const [registerTenant, { data: registrationResponse,isLoading: isRegistering, isError: hasRegistrationError, error: registrationError,isSuccess: isRegistrationSuccess }] = useTenantRegisterMutation();

  /** @type {[TenantForm, React.Dispatch<React.SetStateAction<TenantForm>>]} */
  const [form, setForm] = useState({
    name: authProfile?.username ?? "",
    companyName: "",
    primaryContactName: "",
    primaryContactEmail: authProfile?.email ?? "",
    primaryContactPhone: getCountryMeta("US").dialCode,
    country: "US",
    timezone: "America/New_York",
  });

  const selectedCountry = useMemo(() => getCountryMeta(form.country), [form.country]);

  /** @type {ValidationErrors} */
  const fieldErrors = useMemo(() => validateForm(form), [form]);
  const isValid = Object.keys(fieldErrors).length === 0;

  /** @param {string} field */
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  /** * @param {keyof TenantForm} field 
   * @param {string} value 
   */
  const handleChange = (field, value) => {
    setForm((p) => {
      if (field === "country") {
        const nextCountry = getCountryMeta(value);
        const previousCountry = getCountryMeta(p.country);
        const previousDialDigits = normalizePhoneDigits(previousCountry.dialCode);
        const currentDigits = normalizePhoneDigits(p.primaryContactPhone);
        const nationalDigits = currentDigits.startsWith(previousDialDigits)
          ? currentDigits.slice(previousDialDigits.length)
          : currentDigits;

        return {
          ...p,
          country: value,
          primaryContactPhone: `${nextCountry.dialCode}${nationalDigits}`,
        };
      }

      if (field === "primaryContactPhone") {
        const dialDigits = normalizePhoneDigits(selectedCountry.dialCode);
        const nextDigits = normalizePhoneDigits(value);
        const nationalDigits = nextDigits.startsWith(dialDigits)
          ? nextDigits.slice(dialDigits.length)
          : nextDigits.replace(new RegExp(`^${dialDigits}`), "");

        return {
          ...p,
          primaryContactPhone: `${selectedCountry.dialCode}${nationalDigits}`,
        };
      }

      return { ...p, [field]: value };
    });
  };

useEffect(() => {
  if (isRegistrationSuccess && registrationResponse) {
    onCreated(registrationResponse);
  }
}, [isRegistrationSuccess, registrationResponse, onCreated]);

useEffect(() => {
  if (hasRegistrationError) {
    setServerError(registrationError?.data?.message ?? registrationError?.message ?? "Registration failed. Please try again.");
  }
}, [hasRegistrationError, registrationError]);

  /** @returns {Promise<void>} */
const submit = async () => {
  const allTouched = Object.keys(form).reduce((acc, key) => ({ ...acc, [key]: true }), {});
  setTouched(allTouched);

  if (!isValid) return;

  setServerError(null);
  registerTenant({
    name: form.name.trim(),
    companyName: form.companyName.trim(),
    primaryContactName: form.primaryContactName.trim(),
    primaryContactEmail: form.primaryContactEmail.trim(),
    primaryContactPhone: `+${normalizePhoneDigits(form.primaryContactPhone)}`,
    country: form.country,
    timezone: form.timezone,
  });
};
  return (
    //<div className="w-full max-w-xl mx-auto flex flex-col h-full overflow-hidden">
    <div className="w-full flex flex-col">
      <div className="flex items-center justify-between mb-4 px-1 shrink-0">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Workspace Identity</h2>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
            Mandatory Registration
          </p>
        </div>
      </div>
      
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex-grow mb-4">
        <div className="max-h-[58vh] overflow-y-auto p-5 md:p-6 custom-scrollbar">
        {serverError && (
          <div className="mb-6 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-medium">
            <AlertCircle size={14} /> {serverError}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <FormField label="Tenant Handle" field="name" placeholder="acme-hq" icon={ShieldCheck} form={form} fieldErrors={fieldErrors} touched={touched} onBlur={handleBlur} onChange={handleChange} />
            <FormField label="Legal Entity" field="companyName" placeholder="Acme Corp LLC" icon={Globe} form={form} fieldErrors={fieldErrors} touched={touched} onBlur={handleBlur} onChange={handleChange} />
          </div>

          <FormField label="Authorized Contact Name" field="primaryContactName" placeholder="Johnathan Doe" icon={User} form={form} fieldErrors={fieldErrors} touched={touched} onBlur={handleBlur} onChange={handleChange} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <FormField label="Business Email" field="primaryContactEmail" type="email" placeholder="admin@acme.com" icon={Zap} form={form} fieldErrors={fieldErrors} touched={touched} onBlur={handleBlur} onChange={handleChange} />
            <FormField label="Phone Number" field="primaryContactPhone" type="tel" placeholder={`${selectedCountry.dialCode} ${selectedCountry.placeholder}`} icon={Phone} form={form} fieldErrors={fieldErrors} touched={touched} onBlur={handleBlur} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">Region</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select 
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl bg-white appearance-none text-sm focus:ring-2 focus:ring-purple-500/20 outline-none cursor-pointer transition-all"
                  value={form.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                >
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">Timezone</label>
              <div className="relative">
                <Clock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select 
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl bg-white appearance-none text-sm focus:ring-2 focus:ring-purple-500/20 outline-none cursor-pointer transition-all"
                  value={form.timezone}
                  onChange={(e) => handleChange('timezone', e.target.value)}
                >
                  {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>
        </form>
      </div>
      <div className="sticky bottom-0 border-t border-slate-100 bg-white px-5 py-4 md:px-6">
        <button 
          onClick={submit}
          disabled={isRegistering || (Object.keys(touched).length > 0 && !isValid)}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
        >
          {isRegistering ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Registering...</span>
            </>
          ) : (
            <>
              <span>Initialize Workspace</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
      </div>
    </div>
  );
};

export default TenantSetupCard;
