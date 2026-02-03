import React from "react";
import { ShieldCheck, Clock, AlertTriangle } from "lucide-react";

/**
 * @typedef {"verified" | "pending" | "action_required"} KYCStatus
 */

/**
 * @typedef {Object} KYCBadgeProps
 * @property {KYCStatus} status
 */

/**
 * Small status badge for KYC state
 *
 * @param {KYCBadgeProps} props
 * @returns {React.ReactElement}
 */
const KYCBadge = ({ status }) => {
  /** @type {Record<KYCStatus, { icon: React.ComponentType<any>, color: string, bg: string, label: string }>} */
  const config = {
    verified: {
      icon: ShieldCheck,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
      label: "KYC Verified",
    },
    pending: {
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-50",
      label: "KYC Pending",
    },
    action_required: {
      icon: AlertTriangle,
      color: "text-rose-500",
      bg: "bg-rose-50",
      label: "KYC Action Required",
    },
  };

  const safeStatus = status in config ? status : "pending";
  const { icon: Icon, color, bg, label } = config[safeStatus];

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-xl ${bg} ${color} transition-all cursor-pointer hover:opacity-80`}
      role="status"
      aria-label={label}
    >
      <Icon size={14} />
      <span className="text-[10px] font-bold uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
};

export default KYCBadge;
