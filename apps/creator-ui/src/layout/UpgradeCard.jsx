// @ts-nocheck
import React, { useState } from "react";
import { Check, Sparkles, X } from "lucide-react";

export default function UpgradeCard() {
  const [open, setOpen] = useState(false);
  const [upgraded, setUpgraded] = useState(false);

  return (
    <div className="rounded-lg border border-purple-400/25 bg-gradient-to-br from-purple-600/15 to-slate-900 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold">
        <Sparkles size={16} className="text-purple-300" />
        Upgrade to Pro
      </div>
      <div className="space-y-1.5 text-xs font-medium text-slate-300">
        <p>Unlimited generations</p>
        <p>Priority support</p>
        <p>Export in HD</p>
      </div>
      <button type="button" onClick={() => setOpen(true)} className="creator-primary mt-4 w-full px-3 py-2 text-xs font-bold text-white transition">
        {upgraded ? "Pro Active" : "Upgrade Now"}
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="creator-panel w-full max-w-sm p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold">Creator Pro</h3>
                <p className="mt-1 text-sm font-medium text-slate-400">Mock checkout for unlimited generations.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="creator-control flex h-8 w-8 items-center justify-center">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2 text-sm font-medium text-slate-200">
              {["Unlimited short planners", "HD storyboard export", "Priority image generation"].map((item) => (
                <p key={item} className="flex items-center gap-2"><Check size={15} className="text-emerald-300" /> {item}</p>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setUpgraded(true);
                setOpen(false);
              }}
              className="creator-primary mt-5 w-full px-4 py-3 text-sm font-bold text-white"
            >
              Activate Mock Pro
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
