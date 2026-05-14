// @ts-check
import React from "react";
import {
  AlertTriangle,
  ExternalLink,
  Globe,
  KeyRound,
  Lock,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

/** @param {any} value */
const isPresent = (value) => value !== null && value !== undefined && String(value).trim() !== "";

/**
 * @param {any} source
 * @param {string[][]} paths
 * @returns {any}
 */
const pickValue = (source, paths) => {
  for (const path of paths) {
    let current = source;
    let missing = false;

    for (const key of path) {
      if (!current || typeof current !== "object" || !(key in current)) {
        missing = true;
        break;
      }
      current = current[key];
    }

    if (!missing && isPresent(current)) {
      return current;
    }
  }

  return null;
};

/** @param {string | null | undefined} value */
const toUrl = (value) => {
  if (!isPresent(value)) return null;
  const normalized = String(value).trim();
  if (/^https?:\/\//i.test(normalized)) return normalized;
  return `https://${normalized.replace(/^\/+/, "")}`;
};

/** @param {string | null | undefined} value */
const formatDate = (value) => {
  if (!isPresent(value)) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

/** @param {any} app */
const extractDetails = (app) => {
  const domain = pickValue(app, [
    ["domain"],
    ["config", "domain"],
    ["tenantConfig", "domain"],
  ]);
  const subdomain = pickValue(app, [
    ["subdomain"],
    ["appSubdomain"],
    ["config", "subdomain"],
  ]);
  const host = isPresent(subdomain)
    ? String(subdomain).includes(".")
      ? String(subdomain)
      : isPresent(domain)
        ? `${subdomain}.${domain}`
        : String(subdomain)
    : domain;

  return {
    name:
      pickValue(app, [["displayName"], ["name"], ["productName"], ["productCode"]]) ||
      "Subscription",
    status: String(pickValue(app, [["deploymentStatus"], ["status"]]) || "").toUpperCase(),
    plan: pickValue(app, [["planTier"], ["planName"], ["planCode"]]),
    subscriptionId: pickValue(app, [["subscriptionId"], ["subscription_id"]]),
    tenantAppId: pickValue(app, [["id"], ["tenantAppId"], ["tenant_app_id"]]),
    deployedAt: pickValue(app, [["deployedAt"], ["deployed_at"]]),
    createdAt: pickValue(app, [["createdAt"], ["created_at"]]),
    productCode: pickValue(app, [["productCode"], ["product_code"]]),
    portalUrl: toUrl(
      pickValue(app, [
        ["adminUrl"],
        ["admin_url"],
        ["appUrl"],
        ["app_url"],
        ["dashboardUrl"],
        ["dashboard_url"],
        ["workspaceUrl"],
        ["workspace_url"],
        ["loginUrl"],
        ["login_url"],
        ["url"],
        ["domain"],
      ]) || host
    ),
    adminUsername: pickValue(app, [
      ["adminUsername"],
      ["admin_username"],
      ["adminUser", "username"],
      ["admin_user", "username"],
      ["credentials", "username"],
      ["config", "admin_username"],
    ]),
    adminPassword: pickValue(app, [
      ["adminPassword"],
      ["admin_password"],
      ["adminUser", "password"],
      ["admin_user", "password"],
      ["credentials", "password"],
      ["config", "admin_password"],
    ]),
    keycloakUrl: toUrl(
      pickValue(app, [
        ["keycloakUrl"],
        ["keycloak_url"],
        ["config", "keycloak_url"],
      ])
    ),
    keycloakRealm: pickValue(app, [
      ["keycloakRealm"],
      ["keycloak_realm"],
      ["realm"],
      ["config", "keycloak_realm"],
    ]),
    keycloakIssuer: toUrl(
      pickValue(app, [
        ["keycloakIssuer"],
        ["keycloak_issuer"],
        ["config", "keycloak_issuer"],
      ])
    ),
    domain: host,
  };
};

/**
 * @param {{
 *   icon: import("lucide-react").LucideIcon;
 *   label: string;
 *   value: unknown;
 *   href?: string | null;
 * }} props
 * @returns {React.ReactElement | null}
 */
function DetailRow({ icon: Icon, label, value, href }) {
  if (!isPresent(value)) return null;

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
        <Icon size={13} />
        {label}
      </div>

      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 break-all text-sm font-semibold text-purple-700 hover:text-purple-800"
        >
          {String(value)}
          <ExternalLink size={14} />
        </a>
      ) : (
        <p className="break-all text-sm font-semibold text-slate-900">
          {String(value)}
        </p>
      )}
    </div>
  );
}

/**
 * @param {{ app: any }} props
 * @returns {React.ReactElement}
 */

function AwaitingSuccessCard({ app }) {
  const name = pickValue(app, [["displayName"], ["name"], ["productCode"]]) || "your workspace";
  const status = String(pickValue(app, [["deploymentStatus"], ["status"]]) || "PENDING").toUpperCase();
  const isFailed = status === "FAILED";

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white shadow-[0_28px_80px_rgba(15,23,42,0.28)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.45),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.22),transparent_36%)]" />
      <div className="relative">
        <div className={`mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
          isFailed ? "bg-rose-500/20 text-rose-200" : "bg-purple-500/20 text-purple-100"
        }`}>
          {isFailed ? <AlertTriangle size={12} /> : <Sparkles size={12} />}
          {isFailed ? "Action Required" : "Compliance Gate"}
        </div>
        <h3 className="max-w-sm text-2xl font-black leading-tight">
          {isFailed ? `${name} needs attention before access is ready.` : `We'll unlock ${name} details only after provisioning succeeds.`}
        </h3>
        <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
          {isFailed
            ? "This subscription did not finish provisioning successfully. Retry the failed deployment from the left to continue."
            : "Admin URL, credentials, and Keycloak access stay hidden until the tenant is fully provisioned and healthy."}
        </p>

        <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Release Status</p>
          <div className="mt-3 space-y-3">
            <div className="rounded-2xl bg-white/5 px-4 py-3">
              <p className="text-xs font-bold text-white">
                {isFailed ? "Provisioning must be retried" : "Credentials appear after successful activation"}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-300">
                {isFailed
                  ? "We block access details for partial or failed tenant setups."
                  : "This keeps incomplete tenant setups from exposing login details too early."}
              </p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className={`h-full rounded-full ${isFailed ? "w-1/3 bg-rose-400" : "w-2/3 bg-gradient-to-r from-purple-400 to-sky-400"}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** @param {{ app: any }} props */
export default function SubscriptionDetailsPanel({ app }) {
  if (!app) {
    return <AwaitingSuccessCard app={null} />;
  }

  const details = extractDetails(app);
  if (details.status !== "COMPLETED") {
    return <AwaitingSuccessCard app={app} />;
  }

  const hasAdminCredentials = isPresent(details.adminUsername) || isPresent(details.adminPassword);

  return (
    <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Subscription Details</p>
        <h3 className="mt-2 text-xl font-bold text-slate-900">{details.name}</h3>
        <p className="mt-1 text-sm text-slate-500">
          {details.status || "Unknown status"}
          {isPresent(details.plan) ? ` | ${details.plan}` : ""}
          {isPresent(details.productCode) ? ` | ${details.productCode}` : ""}
        </p>
      </div>

      <div className="space-y-3">
        <DetailRow icon={Globe} label="Workspace URL" value={details.portalUrl} href={details.portalUrl} />
        <DetailRow icon={User} label="Admin Username" value={details.adminUsername} />
        <DetailRow icon={Lock} label="Admin Password" value={details.adminPassword} />
        <DetailRow icon={ShieldCheck} label="Keycloak URL" value={details.keycloakUrl} href={details.keycloakUrl} />
        <DetailRow icon={KeyRound} label="Keycloak Realm" value={details.keycloakRealm} />
        <DetailRow icon={ShieldCheck} label="Keycloak Issuer" value={details.keycloakIssuer} href={details.keycloakIssuer} />
        <DetailRow icon={Globe} label="Domain" value={details.domain} />
        <DetailRow icon={ShieldCheck} label="Subscription ID" value={details.subscriptionId} />
        <DetailRow icon={ShieldCheck} label="Tenant App ID" value={details.tenantAppId} />
        <DetailRow icon={ShieldCheck} label="Provisioned At" value={formatDate(details.deployedAt)} />
        <DetailRow icon={ShieldCheck} label="Created At" value={formatDate(details.createdAt)} />
      </div>

      {!hasAdminCredentials && (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium leading-5 text-amber-800">
          Admin credentials are not present in the current app payload yet. This panel will show them when the backend returns fields like{" "}
          <code>adminUsername</code>, <code>adminPassword</code>, or the equivalent snake_case keys.
        </div>
      )}
    </div>
  );
}
