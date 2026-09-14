// @ts-nocheck
import React from "react";
import { Clock } from "lucide-react";

/** Shows a panel that isn't wired up yet: the real controls stay visible so the editor reads as
 * complete and the creator can see what's coming, but nothing inside is reachable. Interaction is
 * killed at the wrapper (pointer-events plus inert) rather than by disabling each control inside,
 * so a panel gains no coming-soon branches of its own and loses none when it ships -- unwrap it
 * here and it is live again. */
export default function ComingSoon({ label = "Coming soon", children }) {
  return (
    <div className="relative">
      <span className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded border border-sky-300/25 bg-sky-400/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-normal text-sky-100">
        <Clock size={10} />
        {label}
      </span>
      {/* inert also takes it out of the tab order and the accessibility tree, so it isn't
          reachable by keyboard the way pointer-events-none alone would leave it. */}
      <div inert="" className="pointer-events-none select-none opacity-45 saturate-50">
        {children}
      </div>
    </div>
  );
}
