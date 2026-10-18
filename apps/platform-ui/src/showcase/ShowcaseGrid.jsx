// @ts-nocheck
import React, { useState } from "react";
import ShowcaseCard from "./ShowcaseCard.jsx";
import VideoPlayerModal from "./VideoPlayerModal.jsx";

/** A grid of showcase cards that opens the player; vertical and wide films mix in columns.
 * {@code extra}: more cards (inspiration) in the same masonry, after the films. */
export default function ShowcaseGrid({ cards, showCreator = true, playerActions, extra = null }) {
  const [open, setOpen] = useState(null);
  return (
    <>
      <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4 [&>*]:break-inside-avoid">
        {cards.map((card) => (
          <ShowcaseCard key={card.publicId} card={card} onOpen={setOpen} showCreator={showCreator} />
        ))}
        {extra}
      </div>
      {open && (
        <VideoPlayerModal card={open} onClose={() => setOpen(null)} actions={playerActions ? playerActions(open) : null} />
      )}
    </>
  );
}
