// @ts-nocheck
// An edit decision list (EDL) entry describes an operation against the original source
// timeline. The preview player composes segments from the EDL instead of physically
// re-encoding the video, so undo/redo and re-preview are cheap.
//   REPLACE: { id, start, end, replacementUrl, replacementName, replacementDuration, createdAt }
//   DELETE : { id, start, end, kind: "delete", replacementName, createdAt } -- removes the
//            [start,end] range and closes the gap (no replacement segment is inserted).
function isDeleteEntry(entry) {
  return entry?.kind === "delete" || !entry?.replacementUrl;
}

export function addReplacement(edl, entry) {
  const withoutOverlaps = edl.filter((existing) => existing.end <= entry.start || existing.start >= entry.end);
  return [...withoutOverlaps, entry].sort((a, b) => a.start - b.start);
}

export function computeSegments(duration, edl = []) {
  const sorted = [...edl].sort((a, b) => a.start - b.start);
  const segments = [];
  let sourceCursor = 0;
  let timelineCursor = 0;

  for (const entry of sorted) {
    if (entry.start > sourceCursor) {
      const length = entry.start - sourceCursor;
      segments.push({
        key: `original-${sourceCursor}`,
        kind: "original",
        sourceStart: sourceCursor,
        sourceEnd: entry.start,
        timelineStart: timelineCursor,
        timelineEnd: timelineCursor + length,
      });
      timelineCursor += length;
    }

    // A delete entry inserts nothing -- the range is simply dropped and the rest closes up.
    if (!isDeleteEntry(entry)) {
      const replacementLength = Math.max(entry.replacementDuration ?? entry.end - entry.start, 0.05);
      segments.push({
        key: `replacement-${entry.id}`,
        kind: "replacement",
        edlId: entry.id,
        url: entry.replacementUrl,
        name: entry.replacementName,
        sourceStart: 0,
        sourceEnd: replacementLength,
        timelineStart: timelineCursor,
        timelineEnd: timelineCursor + replacementLength,
      });
      timelineCursor += replacementLength;
    }
    sourceCursor = Math.max(sourceCursor, entry.end);
  }

  if (sourceCursor < duration) {
    const length = duration - sourceCursor;
    segments.push({
      key: `original-${sourceCursor}`,
      kind: "original",
      sourceStart: sourceCursor,
      sourceEnd: duration,
      timelineStart: timelineCursor,
      timelineEnd: timelineCursor + length,
    });
    timelineCursor += length;
  }

  return { segments, totalDuration: timelineCursor };
}

export function segmentAtTime(segments, time) {
  return segments.find((segment) => time >= segment.timelineStart && time < segment.timelineEnd) || segments[segments.length - 1] || null;
}
