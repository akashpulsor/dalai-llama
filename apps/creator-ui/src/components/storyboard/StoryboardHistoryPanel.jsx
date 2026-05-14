// @ts-nocheck
import React from "react";
import { Bookmark, History } from "lucide-react";

export default function StoryboardHistoryPanel({ history = [], saved = [], onOpen, savedId = "saved", historyId = "history" }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel id={savedId} icon={Bookmark} title="Saved Storyboards" empty="Saved storyboards will appear here.">
        {(saved || []).map((item) => (
          <StoryboardRow key={item.id || item.storyboardId} item={item} onOpen={onOpen} />
        ))}
      </Panel>
      <Panel id={historyId} icon={History} title="Storyboard History" empty="Generated storyboards and paid actions will appear here.">
        {(history || []).map((item) => (
          <StoryboardRow key={item.id || item.storyboardId} item={item} onOpen={onOpen} />
        ))}
      </Panel>
    </div>
  );
}

function Panel({ id, icon: Icon, title, empty, children }) {
  const list = React.Children.toArray(children).filter(Boolean);
  return (
    <section id={id} className="creator-panel creator-section p-4">
      <div className="mb-4 flex items-center gap-2">
        <Icon size={18} className="text-purple-300" />
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      {list.length ? <div className="divide-y divide-white/10">{list}</div> : <p className="text-sm font-medium text-slate-400">{empty}</p>}
    </section>
  );
}

function StoryboardRow({ item, onOpen }) {
  const title = item.title || item.userTitle || "Untitled storyboard";
  const detail = item.lockedIdeaTitle || item.ideaTitle || item.categoryLabel || item.status || "Creator storyboard";
  return (
    <button type="button" onClick={() => onOpen?.(item)} className="block w-full py-3 text-left first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">{title}</p>
          <p className="mt-1 line-clamp-1 text-sm font-medium text-slate-400">{detail}</p>
        </div>
        <span className="shrink-0 text-xs font-semibold text-slate-500">{item.durationSeconds ? `${item.durationSeconds}s` : item.time || "Now"}</span>
      </div>
    </button>
  );
}
