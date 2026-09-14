// @ts-nocheck
import React from "react";
import { useNavigate } from "react-router-dom";
import { Crown } from "lucide-react";

/**
 * A call-to-action that stays visible when the creator cannot use it yet.
 *
 * <p>{@link FeatureLock} replaces its children with an upgrade prompt, which is right for a whole
 * panel but wrong for a single button: hiding the button hides the feature, and a creator cannot
 * want something they have never seen. This keeps the CTA exactly where it is, marks it with a
 * crown, and sends a click to the plans page instead of the action.
 *
 * <p>Same element and classes either way, so a locked CTA sits in the layout identically to an
 * unlocked one -- no shifting when a subscription activates.
 */
export default function ProCta({
  unlocked,
  feature,
  onClick,
  disabled = false,
  className = "",
  title,
  children,
}) {
  const navigate = useNavigate();

  if (unlocked) {
    return (
      <button type="button" onClick={onClick} disabled={disabled} className={className} title={title}>
        {children}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => navigate("/subscription")}
      // Never `disabled`: a disabled button swallows the click, and the click is the whole point
      // -- it is what takes someone who wants the feature to the page that sells it.
      className={`${className} relative`}
      title={`${feature} is a Pro feature — upgrade to unlock`}
    >
      <Crown size={11} className="text-amber-300" />
      {children}
    </button>
  );
}
