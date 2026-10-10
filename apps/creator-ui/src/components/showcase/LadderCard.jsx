// @ts-nocheck
import React from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useGetMyVisibilityQuery } from "../../api/showcaseEndpoints.js";
import { LEVEL_LABEL } from "./showcaseLabels.js";

const LEVELS = ["L1", "L2", "L3", "L4"];

/** Where the creator stands and the one thing that moves them up (rule 14: the next step is always
 * visible, and the rules are public). */
export default function LadderCard() {
  const { data: v, isLoading } = useGetMyVisibilityQuery();
  if (isLoading) return <Loader2 size={16} className="animate-spin text-slate-400" />;
  if (!v) return null;

  return (
    <section className="creator-panel p-5">
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Your visibility</p>
      <ol className="mt-3 grid grid-cols-4 gap-2" aria-label="Creator levels">
        {LEVELS.map((level) => {
          const reached = v.level !== "L0" && LEVELS.indexOf(v.level) >= LEVELS.indexOf(level);
          return (
            <li key={level} aria-current={v.level === level ? "step" : undefined}
                className={`rounded-lg border px-2 py-2 text-center text-xs font-bold ${
                  reached ? "border-purple-400/50 bg-purple-500/20 text-purple-100" : "border-white/10 text-slate-500"
                }`}>
              {LEVEL_LABEL[level]}
            </li>
          );
        })}
      </ol>

      <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3">
        <p className="text-[10px] font-bold uppercase tracking-normal text-slate-500">
          {v.level === "L4" ? "Keep it up" : `Next: ${LEVEL_LABEL[v.nextLevel]}`}
        </p>
        <p className="mt-1 text-sm font-semibold text-white">{v.nextStep}</p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-[10px] font-bold uppercase text-slate-500">On the landing page</dt>
          <dd className={v.eligibleForLanding ? "font-semibold text-emerald-300" : "text-slate-300"}>
            {v.eligibleForLanding ? "Yes" : `From ${LEVEL_LABEL[v.landingFloor]}`}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase text-slate-500">Spotlight</dt>
          <dd className="text-slate-300">
            {v.activeSpotlightUntil
              ? <span className="flex items-center gap-1 font-semibold text-amber-200"><Sparkles size={13} /> until {new Date(v.activeSpotlightUntil).toLocaleString()}</span>
              : "None right now"}
          </dd>
        </div>
      </dl>

      <details className="mt-4 text-xs text-slate-400">
        <summary className="cursor-pointer font-bold text-slate-300">How visibility works</summary>
        <ul className="mt-2 space-y-1.5">
          <li>• Starter: verified channel, 2 videos picked, headline, picture and industry.</li>
          <li>• Maker: you published a film made on Dalaillama.</li>
          <li>• Proven: a film your client paid for in full on Dalaillama, in the last 90 days.</li>
          <li>• Star: three such films in 90 days, or brand requests that became briefs.</li>
          <li>• A newly published client-funded film gets a 72-hour spotlight on the landing page.</li>
          <li>• As more client-funded films arrive, the landing page asks for a higher level. Your profile and links always keep working.</li>
        </ul>
      </details>
    </section>
  );
}
