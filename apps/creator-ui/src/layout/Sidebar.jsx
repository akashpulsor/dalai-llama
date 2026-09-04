// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectTenantId, useGetWalletBalanceQuery } from "@dalaillama/shared-store";
import {
  BarChart3,
  CreditCard,
  FolderOpen,
  Home,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react";
import WalletBalanceButton from "../components/billing/WalletBalanceButton.jsx";
import UpgradeCard from "./UpgradeCard.jsx";
import UserChip from "./UserChip.jsx";

/** Matches the Figma nav spec: Home, Projects, Plans & Brand, Cast Library, AI Editor,
 * Wallet & Billing. "Plans & Brand" is BrandPage.jsx -- brand context version history plus the
 * product library for that brand. Wallet & Billing has its own page (WalletBillingPage.jsx). */
const navItems = [
  { id: "home", label: "Home", icon: Home, path: "/" },
  { id: "projects", label: "Projects", icon: FolderOpen, path: "/", modal: "projects" },
  { id: "plans-brand", label: "Plans & Brand", icon: Sparkles, path: "/brand" },
  { id: "cast", label: "Cast Library", icon: Users, path: "/cast-library" },
  { id: "ai-editor", label: "AI Editor", icon: Wand2, path: "/editor" },
  { id: "wallet-billing", label: "Wallet & Billing", icon: CreditCard, path: "/wallet-billing" },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeId = useMemo(() => activeIdFor(location.pathname, location.hash), [location.pathname, location.hash]);
  const tenantId = useSelector(selectTenantId);
  const { data: wallet, isFetching: walletLoading } = useGetWalletBalanceQuery(tenantId, { skip: !tenantId });

  useEffect(() => {
    const hashId = location.hash?.replace("#", "");
    if (!hashId || location.pathname !== "/planner") return;
    if (hashId === "projects") {
      window.dispatchEvent(new CustomEvent("creator:open-projects"));
    }
    window.requestAnimationFrame(() => scrollToSection(hashId, "auto"));
  }, [location.hash, location.pathname]);

  const handleNavClick = (event, item) => {
    event.preventDefault();
    if (item.modal) {
      if (location.pathname !== item.path) {
        navigate(item.path);
        window.setTimeout(() => window.dispatchEvent(new CustomEvent(`creator:open-${item.modal}`)), 80);
      } else {
        window.dispatchEvent(new CustomEvent(`creator:open-${item.modal}`));
      }
      return;
    }
    if (item.hash) {
      navigate({ pathname: item.path, hash: item.hash });
    } else {
      navigate(item.path);
    }
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-[#05070d]/96 px-4 py-5 backdrop-blur lg:flex lg:flex-col">
        <a href="/" onClick={(event) => handleNavClick(event, navItems[0])} className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 shadow-lg shadow-purple-900/30">
            <BarChart3 size={22} />
          </div>
          <div>
            <p className="text-lg font-bold">Dalaillama</p>
            <p className="text-xs font-medium text-slate-400">Creator Studio</p>
          </div>
        </a>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const { id, label, icon: Icon } = item;
            const isActive = activeId === id;

            return (
              <a
                key={id}
                href={item.hash ? `${item.path}#${item.hash}` : item.path}
                onClick={(event) => handleNavClick(event, item)}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition-all ${
                  isActive ? "bg-purple-600 text-white shadow-lg shadow-purple-950/30" : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span className="min-w-0 flex-1">{label}</span>
              </a>
            );
          })}
        </nav>

        <div className="mt-auto space-y-4">
          <WalletBalanceButton
            wallet={wallet}
            isLoading={walletLoading}
            onRecharge={() => window.dispatchEvent(new CustomEvent("creator:open-recharge"))}
          />
          <UpgradeCard />
          <UserChip />
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-6 border-t border-white/10 bg-[#05070d]/95 px-2 py-2 backdrop-blur lg:hidden">
        {navItems.map((item) => (
          <a
            key={item.id}
            href={item.hash ? `${item.path}#${item.hash}` : item.path}
            onClick={(event) => handleNavClick(event, item)}
            className={`flex flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-semibold ${activeId === item.id ? "text-purple-300" : "text-slate-500"}`}
          >
            <item.icon size={18} />
            <span>{item.label.split(" ")[0]}</span>
          </a>
        ))}
      </nav>
    </>
  );
}

function activeIdFor(pathname, hash) {
  const hashId = hash?.replace("#", "");
  if (pathname === "/planner" && hashId) {
    const match = navItems.find((item) => item.hash === hashId);
    if (match) return match.id;
  }
  const match = navItems.find((item) => item.path === pathname && !item.hash);
  if (match) return match.id;
  return "home";
}

function scrollToSection(id, behavior = "smooth") {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior, block: "start" });
}
