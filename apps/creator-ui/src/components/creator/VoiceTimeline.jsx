// @ts-nocheck
import React from "react";
import { AudioLines, ChevronDown, ChevronUp, MessageSquareQuote, Mic } from "lucide-react";
import { formatTime } from "../../utils/voiceTimeline.js";

const KIND_STYLE = {
  VOICE_OVER: { bar: "bg-purple-400/70", chip: "border-purple-400/30 bg-purple-500/10 text-purple-200", label: "Voice-over", Icon: Mic },
  DIALOGUE: { bar: "bg-sky-400/70", chip: "border-sky-400/30 bg-sky-500/10 text-sky-200", label: "Dialogue", Icon: MessageSquareQuote },
};

/** The film's spoken track at a glance, the way a script reads: a header with words and running
 * time, then each screenplay section numbered with its time range and what is said in it. A strip
 * above shows the whole film's length -- voice-over, dialogue and silent picture -- shot by shot. */
export default function VoiceTimeline({ timeline, onOpenShot }) {
  const [open, setOpen] = React.useState(true);
  const spoken = timeline.voiceOverLines + timeline.dialogueLines;
  if (!timeline.sections.length) return null;
  const title = timeline.dialogueLines && timeline.voiceOverLines ? "Voice-over & dialogue"
    : timeline.dialogueLines ? "Dialogue" : "Voice-over";
  const total = timeline.totalSeconds || 1;

  return (
    <div className="mb-4 rounded-lg border border-purple-400/20 bg-purple-500/[0.03]">
      <button type="button" onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <p className="flex items-center gap-2 text-xs font-extrabold text-white">
          <AudioLines size={14} className="text-purple-300" />
          {title}
          <span className="font-semibold text-slate-400">
            {spoken ? `(about ${timeline.totalWords} words, about ${formatTime(timeline.totalSeconds)})` : "(nothing spoken yet)"}
          </span>
        </p>
        {open ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
      </button>

      {open && (
        <div className="space-y-3 border-t border-white/10 px-4 pb-4 pt-3">
          <div>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/5">
              {timeline.sections.flatMap((section) => section.shots).map((shot) => (
                <button key={shot.shotId} type="button" onClick={() => onOpenShot?.(shot.shotId)}
                  title={`Shot ${shot.shotNumber} · ${formatTime(shot.start)}–${formatTime(shot.end)} · ${KIND_STYLE[shot.kind]?.label || "No speech"}`}
                  style={{ width: `${((shot.end - shot.start) / total) * 100}%` }}
                  className={`h-full border-r border-black/30 last:border-r-0 ${KIND_STYLE[shot.kind]?.bar || "bg-white/10"}`} />
              ))}
            </div>
            <div className="mt-1 flex items-center justify-between text-[9px] font-semibold text-slate-500">
              <span>0:00</span>
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-400/70" />Voice-over</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-400/70" />Dialogue</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-white/20" />Picture only</span>
              </span>
              <span>{formatTime(timeline.totalSeconds)}</span>
            </div>
            {timeline.untimedShots > 0 && (
              <p className="mt-1 text-[10px] font-semibold text-amber-300">
                {timeline.untimedShots} shot{timeline.untimedShots === 1 ? " has" : "s have"} no duration yet, so the times below are short.
              </p>
            )}
          </div>

          <ol className="space-y-2.5">
            {timeline.sections.map((section) => (
              <li key={`${section.number}-${section.sceneId}`}>
                <p className="text-[11px] font-extrabold text-slate-100">
                  {section.number}. {section.title}{" "}
                  <span className="font-semibold text-slate-500">({formatTime(section.start)}-{formatTime(section.end)})</span>
                </p>
                {section.lines.length === 0 ? (
                  <p className="ml-3 mt-0.5 text-[11px] italic text-slate-500">Picture only -- nothing spoken.</p>
                ) : (
                  <div className="ml-3 mt-0.5 space-y-1">
                    {section.lines.map((line) => {
                      const style = KIND_STYLE[line.kind];
                      return (
                        <button key={line.shotId} type="button" onClick={() => onOpenShot?.(line.shotId)}
                          className="block w-full rounded px-1 py-0.5 text-left hover:bg-white/5"
                          title={`Open shot ${line.shotNumber}`}>
                          <span className="mr-1.5 text-[9px] font-bold text-slate-500">{formatTime(line.start)}</span>
                          {line.kind === "DIALOGUE" && (
                            <span className={`mr-1.5 rounded-full border px-1.5 py-px text-[9px] font-bold ${style.chip}`}>
                              {line.speaker || "Dialogue"}
                            </span>
                          )}
                          <span className={`text-[11px] leading-relaxed ${line.kind === "DIALOGUE" ? "text-sky-100" : "text-slate-200"}`}>
                            {line.kind === "DIALOGUE" ? `“${line.text}”` : line.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

/** The small marker a shot row wears: what kind of speech it carries and who says it. */
export function SpeechChip({ line }) {
  if (!line) return null;
  const style = KIND_STYLE[line.kind];
  const { Icon } = style;
  return (
    <span className={`ml-1.5 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${style.chip}`}
      title={`${style.label}${line.speaker ? ` · ${line.speaker}` : ""} · ${formatTime(line.start)}–${formatTime(line.end)}`}>
      <Icon size={9} />
      {style.label}{line.speaker && line.kind === "DIALOGUE" ? ` · ${line.speaker}` : ""}
    </span>
  );
}
