// @ts-check
import React, { useState } from "react";
import {
  CheckCircle2,
  ShieldAlert,
  Terminal,
  ArrowRight,
  Copy,
  ExternalLink,
  Clock,
  MapPin
} from "lucide-react";

/**
 * @typedef {Object} TenantSetupPayload
 * @property {string} name
 * @property {string} companyName
 * @property {string} primaryContactName
 * @property {string} primaryContactEmail
 * @property {string} primaryContactPhone
 * @property {string} country
 * @property {string} timezone
 */

/**
 * @typedef {Object} TenantSetupCardProps
 * @property {(tenantId: string) => void} onCreated
 * @property {{ email?: string; username?: string }} authProfile
 */

/** @type {{ code: string; label: string }[]} */
const COUNTRIES = [
  { code: "IN", label: "India" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "DE", label: "Germany" },
  { code: "SG", label: "Singapore" },
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

/**
 * @param {TenantSetupCardProps} props
 */
const TenantSetupCard = (props) => {
  const { onCreated, authProfile } = props;

  /** @type {[TenantSetupPayload, React.Dispatch<React.SetStateAction<TenantSetupPayload>>]} */
  const [form, setForm] = useState({
    name: authProfile?.username ?? "",
    companyName: "",
    primaryContactName: "",
    primaryContactEmail: authProfile?.email ?? "",
    primaryContactPhone: "",
    country: "IN",
    timezone: "Asia/Kolkata",
  });

  /** @returns {Promise<void>} */
  const submit = async () => {
    // mock success (replace with useTenantRegisterMutation)
    const tenantId = `tenant_${Date.now()}`;
    onCreated(tenantId);
  };

  return (
    <div className="max-w-xl bg-white border border-slate-200 rounded-2xl p-6">
      <h2 className="text-lg font-bold text-slate-900 mb-1">
        Set up your organization
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        This information is used for billing, compliance, and provisioning.
      </p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <input
          className="border rounded-xl px-3 py-2"
          placeholder="Tenant name (internal)"
          value={form.name}
          onChange={(e) =>
            setForm((p) => ({ ...p, name: e.target.value }))
          }
        />

        <input
          className="border rounded-xl px-3 py-2"
          placeholder="Company name"
          value={form.companyName}
          onChange={(e) =>
            setForm((p) => ({ ...p, companyName: e.target.value }))
          }
        />
      </div>

      <input
        className="border rounded-xl px-3 py-2 w-full mb-4"
        placeholder="Primary contact name"
        value={form.primaryContactName}
        onChange={(e) =>
          setForm((p) => ({ ...p, primaryContactName: e.target.value }))
        }
      />

      <input
        className="border rounded-xl px-3 py-2 w-full mb-4"
        placeholder="Contact email"
        value={form.primaryContactEmail}
        onChange={(e) =>
          setForm((p) => ({ ...p, primaryContactEmail: e.target.value }))
        }
      />

      <input
        className="border rounded-xl px-3 py-2 w-full mb-6"
        placeholder="Contact phone"
        value={form.primaryContactPhone}
        onChange={(e) =>
          setForm((p) => ({ ...p, primaryContactPhone: e.target.value }))
        }
      />

      {/* Country + Timezone */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <MapPin
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <select
            value={form.country}
            onChange={(e) =>
              setForm((p) => ({ ...p, country: e.target.value }))
            }
            className="w-full pl-10 pr-3 py-2 border rounded-xl bg-white appearance-none"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Clock
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <select
            value={form.timezone}
            onChange={(e) =>
              setForm((p) => ({ ...p, timezone: e.target.value }))
            }
            className="w-full pl-10 pr-3 py-2 border rounded-xl bg-white appearance-none"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={submit}
        className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
      >
        Create organization
        <ArrowRight size={16} />
      </button>
    </div>
  );
};

export default TenantSetupCard;
