// @ts-nocheck
import React from "react";
import { Music } from "lucide-react";
import { useGetPublicMusicPlanQuery } from "../../api/creatorEndpoints.js";
import { formatTime } from "../../utils/voiceTimeline.js";

/** The film's score plan as the client reads it: what the music is, then how it moves through the
 * film section by section. Renders nothing until the creator has planned one. */
export default function ClientMusicPlan({ token }) {
  const { data: plan } = useGetPublicMusicPlanQuery(token, { skip: !token });
  if (!plan) return null;
  const identity = plan.identity || {};
  const headline = [identity.genre, identity.subGenre, identity.overallTone].filter(Boolean).join(" · ");
  const details = [
    identity.raga && `Raga ${identity.raga}`,
    identity.taal,
    identity.bpm && `${identity.bpm} BPM`,
    identity.keyOrScale,
    identity.culturalInfluence,
  ].filter(Boolean).join(" · ");

  return (
    <div className="creator-panel mb-4 p-6">
      <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-purple-300">
        <Music size={13} /> Music
      </p>
      {headline && <p className="text-[13px] font-bold text-slate-100">{headline}</p>}
      {details && <p className="mt-0.5 text-xs font-medium text-slate-400">{details}</p>}
      {identity.coreInstruments?.length > 0 && (
        <p className="mt-1.5 text-xs font-medium text-slate-400">
          Instruments: <span className="text-slate-200">{identity.coreInstruments.join(", ")}</span>
        </p>
      )}
      {identity.motif && (
        <p className="mt-1 text-xs font-medium text-slate-400">
          Theme: <span className="text-slate-200">{identity.motif}</span>
          {identity.motifDescription ? ` — ${identity.motifDescription}` : ""}
        </p>
      )}

      {plan.sections?.length > 0 && (
        <ol className="mt-3 space-y-2">
          {plan.sections.map((section, index) => (
            <li key={`${section.startTime}-${index}`} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="text-xs font-extrabold text-slate-200">
                <span className="mr-2 font-semibold text-slate-500">
                  {formatTime(section.startTime ?? 0)}–{formatTime(section.endTime ?? 0)}
                </span>
                {section.storyBeat || `Section ${index + 1}`}
              </p>
              {(section.mood || section.activeInstruments?.length > 0) && (
                <p className="mt-1 text-xs font-medium leading-relaxed text-slate-400">
                  {[section.mood, section.activeInstruments?.join(", ")].filter(Boolean).join(" — ")}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
      {plan.ending && <p className="mt-2 text-xs font-medium text-slate-400">Ending: <span className="text-slate-200">{plan.ending}</span></p>}
    </div>
  );
}
