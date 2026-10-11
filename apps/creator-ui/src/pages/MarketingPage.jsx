// @ts-nocheck
import React, { useState } from "react";
import { Mail } from "lucide-react";
import TemplateOutreach from "../components/outreach/TemplateOutreach.jsx";
import AudiencesPanel from "../components/outreach/AudiencesPanel.jsx";
import AnalyticsPanel from "../components/outreach/AnalyticsPanel.jsx";
import YouTubePanel, { useYouTubeResultFlash } from "../components/outreach/YouTubePanel.jsx";

const TABS = [
  ["send", "Send"],
  ["audiences", "Audiences"],
  ["analytics", "Analytics"],
  ["youtube", "YouTube"],
];

/** Marketing (CREATOR_SHOWCASE.md rules 21-42): reach brands with templates only. Send (template +
 * film + audience), Audiences (CSV upload and brand search), Templates (Dalai Llama's and your
 * own), Analytics, and YouTube (publish your films, channel analytics). Your public profile,
 * channel connection and brand requests live on the Profile page. */
export default function MarketingPage() {
  useYouTubeResultFlash();
  const [tab, setTab] = useState(() => (new URLSearchParams(window.location.search).get("youtube") ? "youtube" : "send"));
  const [templateId, setTemplateId] = useState(null);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/20 text-purple-100">
          <Mail size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Marketing</h1>
          <p className="text-sm font-medium text-slate-400">Send your work to brands, manage who you reach, and see what works.</p>
        </div>
      </div>

      <div role="tablist" aria-label="Marketing sections" className="mb-5 flex flex-wrap gap-2">
        {TABS.map(([id, text]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                  className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === id ? "bg-purple-600 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
            {text}
          </button>
        ))}
      </div>

      {tab === "send" && <TemplateOutreach templateId={templateId} onTemplateChange={setTemplateId} />}
      {tab === "audiences" && <AudiencesPanel />}
      {tab === "analytics" && <AnalyticsPanel />}
      {tab === "youtube" && <YouTubePanel />}
    </div>
  );
}
