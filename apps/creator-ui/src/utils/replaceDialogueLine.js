// @ts-nocheck
/**
 * Swaps one spoken line for another inside a prompt that was written around it.
 *
 * <p>Accepting a rephrase changes the shot's dialogue, but the prompt already built from it still
 * carries the old words -- and the prompt is what gets sent. Rebuilding the whole prompt to change
 * a sentence throws away the model choice, the cost estimate and the compression along with it, so
 * the line is swapped in place instead.
 *
 * <p>A plain `includes` was not enough, which is why this worked sometimes and not others. The text
 * a shot is dispatched with has usually been through the compression model, and compression is free
 * to re-punctuate: straight quotes become curly, a double space becomes single, a hyphen becomes an
 * en dash. None of that changes the line as spoken, and all of it defeats an exact match -- so the
 * search is done on a normalised copy that maps back to real offsets in the original, and the
 * replacement is made on the untouched text.
 *
 * <p>What it deliberately does NOT do is guess. When compression has genuinely reworded the line
 * rather than re-punctuated it, there is no span to replace and this says so, because silently
 * leaving the old words in a prompt that is about to be paid for is the worse outcome.
 */

/** Characters compression swaps freely and a speaker cannot hear the difference between. */
const EQUIVALENT = {
  "‘": "'", "’": "'", "‛": "'", "´": "'", "`": "'",
  "“": '"', "”": '"', "„": '"',
  "–": "-", "—": "-", "−": "-",
  " ": " ", "…": "...",
};

const unify = (character) => EQUIVALENT[character] ?? character;

/**
 * A normalised copy of `text` plus, for each character in it, the offset it came from. Whitespace
 * runs collapse to one space; the map lets a hit in the normalised copy be cut out of the original
 * exactly, punctuation and spacing intact.
 */
function normalise(text) {
  let normalised = "";
  const offsets = [];
  let previousWasSpace = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (/\s/.test(character)) {
      if (previousWasSpace) continue;
      previousWasSpace = true;
      normalised += " ";
      offsets.push(index);
      continue;
    }
    previousWasSpace = false;
    const mapped = unify(character);
    // An ellipsis maps to three characters; every one of them points at the character it came from
    // so the offsets stay aligned.
    for (const piece of mapped) {
      normalised += piece;
      offsets.push(index);
    }
  }
  return { normalised, offsets };
}

/**
 * @returns {{text: string, matched: "exact"|"normalised"}|null} the prompt with the line replaced,
 *   or null when the old line is not in it at all.
 */
export function replaceDialogueLine(prompt, oldLine, newLine) {
  if (!prompt || !oldLine || !newLine) return null;
  const trimmedOld = oldLine.trim();
  const trimmedNew = newLine.trim();
  if (!trimmedOld) return null;

  // The common case, and the one that keeps the prompt byte-for-byte as it was everywhere else.
  if (prompt.includes(trimmedOld)) {
    return { text: prompt.split(trimmedOld).join(trimmedNew), matched: "exact" };
  }

  const haystack = normalise(prompt);
  const needle = normalise(trimmedOld).normalised.trim();
  if (!needle) return null;

  // Case folded only to FIND the line. The replacement is still cut from the real text, so nothing
  // else in the prompt is re-cased by the swap.
  const at = haystack.normalised.toLowerCase().indexOf(needle.toLowerCase());
  if (at < 0) return null;

  const start = haystack.offsets[at];
  const end = haystack.offsets[at + needle.length - 1] + 1;
  if (start == null || end == null || end <= start) return null;
  return { text: prompt.slice(0, start) + trimmedNew + prompt.slice(end), matched: "normalised" };
}

export default replaceDialogueLine;
