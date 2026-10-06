// Where each sound layer plays in the film -- the browser twin of post-production's FilmSoundtrack,
// so the timeline draws a layer exactly where the render will mix it.

/** Still being made or checked on the server's worker queue. */
export const isSoundLayerPending = (layer) => layer?.status === "QUEUED" || layer?.status === "PROCESSING";

/** Each layer's start and end in film seconds: its shot's start on the timeline plus its own
 * offset. Only ready layers are placed (the render mixes nothing else), and layers of shots not on
 * the timeline are dropped; switched-off layers are kept (and flagged) so the lane can show them
 * dimmed. */
export function placeSoundLayers(timeline, layers = []) {
  const shotStart = new Map();
  (timeline?.sections || []).forEach((section) => section.shots.forEach((shot) => shotStart.set(shot.shotId, shot.start)));
  return layers
    .filter((layer) => shotStart.has(layer.shotId) && (layer.status ?? "COMPLETED") === "COMPLETED")
    .map((layer) => {
      const start = shotStart.get(layer.shotId) + (layer.offsetMs || 0) / 1000;
      const length = Number(layer.durationSeconds) || 0;
      return { layer, start, end: start + length, included: layer.included !== false };
    })
    .sort((a, b) => a.start - b.start);
}

/** "1.5" for 1500 ms -- what the start-time box shows. */
export const msToSeconds = (ms) => String(Math.round((ms || 0) / 100) / 10);

/** 1500 for "1.5"; null when the text is not a usable time. */
export function secondsToMs(text) {
  const value = Number(String(text).trim());
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 1000) : null;
}
