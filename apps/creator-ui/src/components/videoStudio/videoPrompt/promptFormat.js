/**
 * Reads a video prompt into blocks a person can scan: the timed beats with their time in a gutter,
 * the reference-image lines as a list, headings, and plain paragraphs with times highlighted.
 *
 * Display only -- the text sent to the model is the original string, never a re-joined one.
 */

/** "0.6s", "2 s", "0.6s (frame 18)", "0–0.6s (frames 0–18)", "the 3-second mark". */
const TIME = /(?:\d+(?:\.\d+)?\s?(?:[–-]\s?\d+(?:\.\d+)?\s?)?s\b(?:\s*\(frames?\s*\d+(?:\s*[–-]\s*\d+)?\))?|\b\d+(?:\.\d+)?-second (?:mark|point)\b)/gi;
const REFERENCE = /^reference (image|audio|video) (\d+)\s*=\s*/i;

/**
 * @typedef {{ text: string, time: boolean }} Segment
 * @typedef {{ kind: "heading", text: string }
 *   | { kind: "beats", beats: Array<{ time: string, segments: Segment[] }> }
 *   | { kind: "references", items: Array<{ label: string, text: string }> }
 *   | { kind: "paragraph", segments: Segment[] }} PromptBlock
 */

/** Splits text into plain and time segments. @returns {Segment[]} */
export function timeSegments(text) {
  const segments = [];
  let last = 0;
  for (const match of text.matchAll(TIME)) {
    if (match.index > last) segments.push({ text: text.slice(last, match.index), time: false });
    segments.push({ text: match[0], time: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last), time: false });
  return segments;
}

function sentences(paragraph) {
  return paragraph.split(/(?<=[.!?])\s+(?=["'(A-Z0-9])/).map((s) => s.trim()).filter(Boolean);
}

function isHeading(line) {
  return line.length <= 60 && /[A-Z]{3}/.test(line) && !/[a-z]/.test(line);
}

/** @returns {PromptBlock[]} */
export function promptBlocks(text) {
  const blocks = [];
  for (const chunk of (text ?? "").split(/\n\s*\n/)) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    let prose = [];
    const flush = () => {
      if (prose.length) blocks.push(...proseBlocks(prose.join(" ")));
      prose = [];
    };
    for (const line of lines) {
      const ref = line.match(REFERENCE);
      if (ref) {
        flush();
        const item = { label: `${ref[1][0].toUpperCase()}${ref[1].slice(1).toLowerCase()} ${ref[2]}`, text: line.slice(ref[0].length) };
        const previous = blocks[blocks.length - 1];
        if (previous?.kind === "references") previous.items.push(item);
        else blocks.push({ kind: "references", items: [item] });
      } else if (isHeading(line)) {
        flush();
        blocks.push({ kind: "heading", text: line });
      } else {
        prose.push(line);
      }
    }
    flush();
  }
  return blocks;
}

/**
 * A paragraph with two or more timed sentences reads as beats: each timed sentence starts a beat
 * and the untimed sentences after it belong to it. Otherwise it stays a paragraph.
 * @returns {PromptBlock[]}
 */
function proseBlocks(paragraph) {
  const parts = sentences(paragraph);
  const timed = parts.filter((s) => s.match(TIME));
  if (timed.length < 2) return [{ kind: "paragraph", segments: timeSegments(paragraph) }];
  const blocks = [];
  const beats = [];
  const lead = [];
  for (const sentence of parts) {
    const time = sentence.match(TIME)?.[0];
    if (time) beats.push({ time, segments: timeSegments(sentence) });
    else if (beats.length) beats[beats.length - 1].segments.push({ text: ` ${sentence}`, time: false });
    else lead.push(sentence);
  }
  if (lead.length) blocks.push({ kind: "paragraph", segments: timeSegments(lead.join(" ")) });
  blocks.push({ kind: "beats", beats });
  return blocks;
}
