// @ts-nocheck
import React, { useState } from "react";
import { LogOut, User } from "lucide-react";
import { useSelector } from "react-redux";
import { useKeycloakLogoutMutation } from "@dalaillama/shared-hooks/keycloakApi";
import useCreatorVideoEntitlements from "../hooks/useCreatorVideoEntitlements.js";

/** Mobile-only fixed top bar. Sidebar (with UserChip -- sign-out + plan pill) is hidden on
 * anything below lg, so mobile users previously had no way to see their plan status or sign out.
 * This is the minimal top-right chip that surfaces both without competing with the existing
 * bottom nav for room. Desktop uses `hidden lg:hidden` -> stays out of the way completely. */
export default function MobileTopBar() {
  const user = useSelector((state) => state.auth?.user);
  const name = user?.name || user?.email || "Creator";
  const [open, setOpen] = useState(false);
  const [keycloakLogout, logoutState] = useKeycloakLogoutMutation();
  const { planName, isSubscribed, isLoading } = useCreatorVideoEntitlements();
  const planLabel = isLoading ? "…" : (isSubscribed ? planName : "Free");

  const signOut = async () => {
    setOpen(false);
    try {
      await keycloakLogout().unwrap();
    } finally {
      window.location.assign("/");
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-2 border-b border-white/10 bg-[#05070d]/95 px-3 py-2 backdrop-blur lg:hidden">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-600 text-[10px] font-black">D</div>
        <span className="text-[12px] font-extrabold tracking-tight">Dalaillama</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${isSubscribed ? "border-purple-400/40 bg-purple-500/15 text-purple-200" : "border-white/15 bg-white/5 text-slate-300"}`}>
          {planLabel}
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Account menu"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-[11px] font-bold"
        >
          {name.slice(0, 1).toUpperCase()}
        </button>
        {open && (
          <>
            <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="fixed inset-0 z-30 cursor-default" />
            <div className="absolute right-2 top-[calc(100%+6px)] z-40 min-w-[180px] overflow-hidden rounded-lg border border-white/10 bg-[#0b1020] p-1 shadow-2xl">
              <div className="border-b border-white/5 px-3 py-2">
                <p className="truncate text-[11px] font-bold text-slate-100">{name}</p>
                <p className="mt-0.5 text-[10px] font-medium text-slate-500">{planLabel} plan</p>
              </div>
              <button type="button" onClick={signOut} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[11px] font-semibold text-rose-200 hover:bg-rose-500/10">
                <LogOut size={13} />
                {logoutState.isLoading ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
