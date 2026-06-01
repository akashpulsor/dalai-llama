// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Clapperboard,
  FileText,
  FolderOpen,
  ListChecks,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react";
import UpgradeCard from "./UpgradeCard.jsx";
import UserChip from "./UserChip.jsx";

const navItems = [
  { id: "ideas", label: "New Idea", icon: Wand2 },
  { id: "projects", label: "Projects", icon: FolderOpen },
  { id: "post-production", label: "Post Production", icon: Clapperboard },
  { id: "generated-ideas", label: "Generated Ideas", icon: ListChecks },
  { id: "past-storyline", label: "Past Storyline", icon: Sparkles },
  { id: "past-script", label: "Past Script", icon: FileText },
  { id: "cast", label: "Actor", icon: Users },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("ideas");
  const sectionIds = useMemo(() => navItems.map((item) => item.id), []);

  useEffect(() => {
    const hashId = location.hash?.replace("#", "");
    if (!hashId || location.pathname !== "/") return;
    if (hashId === "projects") {
      setActiveSection("projects");
      window.dispatchEvent(new CustomEvent("creator:open-projects"));
      return;
    }
    if (sectionIds.includes(hashId)) {
      setActiveSection(hashId);
    }
    window.requestAnimationFrame(() => scrollToSection(hashId, "auto"));
  }, [location.hash, location.pathname, sectionIds]);

  useEffect(() => {
    if (location.pathname !== "/") return undefined;

    const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
    if (!sections.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-24% 0px -62% 0px", threshold: [0.1, 0.25, 0.5, 0.75] }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [location.pathname, sectionIds]);

  const handleNavClick = (event, id) => {
    event.preventDefault();
    setActiveSection(id);

    if (id === "projects") {
      window.dispatchEvent(new CustomEvent("creator:open-projects"));
      window.history.replaceState(null, "", "/#projects");
      return;
    }
    if (id === "post-production") {
      window.dispatchEvent(new CustomEvent("creator:open-post-production"));
      window.history.replaceState(null, "", "/#post-production");
      return;
    }

    const dispatchWorkspaceNavigation = () => {
      window.dispatchEvent(new CustomEvent("creator:navigate-workspace", { detail: { id } }));
    };

    if (location.pathname !== "/") {
      navigate({ pathname: "/", hash: id });
      window.setTimeout(dispatchWorkspaceNavigation, 80);
      return;
    }

    dispatchWorkspaceNavigation();
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-[#05070d]/96 px-4 py-5 backdrop-blur lg:flex lg:flex-col">
        <a href="/#dashboard" onClick={(event) => handleNavClick(event, "dashboard")} className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 shadow-lg shadow-purple-900/30">
            <BarChart3 size={22} />
          </div>
          <div>
            <p className="text-lg font-bold">DalaiLlama</p>
            <p className="text-xs font-medium text-slate-400">AI Short Planner</p>
          </div>
        </a>

        <nav className="space-y-1">
          {navItems.map(({ id, label, icon: Icon, badge }) => {
            const isActive = activeSection === id;

            return (
              <a
                key={id}
                href={`/#${id}`}
                onClick={(event) => handleNavClick(event, id)}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition-all ${
                  isActive ? "bg-purple-600 text-white shadow-lg shadow-purple-950/30" : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span className="min-w-0 flex-1">{label}</span>
                {badge && <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold">{badge}</span>}
              </a>
            );
          })}
        </nav>

        <div className="mt-auto space-y-4">
          <UpgradeCard />
          <UserChip />
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-white/10 bg-[#05070d]/95 px-2 py-2 backdrop-blur lg:hidden">
        {navItems.slice(0, 5).map(({ id, label, icon: Icon }) => (
          <a
            key={id}
            href={`/#${id}`}
            onClick={(event) => handleNavClick(event, id)}
            className={`flex flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-semibold ${activeSection === id ? "text-purple-300" : "text-slate-500"}`}
          >
            <Icon size={18} />
            <span>{label.split(" ")[0]}</span>
          </a>
        ))}
      </nav>
    </>
  );
}

function scrollToSection(id, behavior = "smooth") {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior, block: "start" });
}
