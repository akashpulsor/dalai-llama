/**
 * The video prompt as one versioned thing, built from what the API already returns.
 *
 * Two sources describe the same prompt and the card shows them as one:
 * - the shot's prompt rows (`/scenes/shots/{id}/prompts`, newest first) are the versions -- each is
 *   immutable once written, and the server refuses to edit one that has shipped;
 * - the generation plan's draft (`plan.prompt`) is the text in the editor before it becomes a row.
 *   Generating it writes the next row, so an unsent draft is shown as the version it will become.
 *
 * Pure functions only, so the rules can be tested without rendering.
 */

/** @enum {string} */
export const PromptState = Object.freeze({ DRAFT: "DRAFT", SENT: "SENT", SUPERSEDED: "SUPERSEDED" });

/** @enum {string} */
export const PromptOrigin = Object.freeze({ AI_GENERATED: "AI_GENERATED", USER_EDITED: "USER_EDITED" });

/** @enum {string} */
export const PromptFreshness = Object.freeze({ CURRENT: "CURRENT", STALE: "STALE" });

/**
 * @typedef {Object} PromptImage
 * @property {string} assetId
 * @property {string} label
 * @property {boolean} sentToModel
 * @property {string} thumbnailUrl
 */

/**
 * @typedef {Object} PromptAudio
 * @property {string} assetId
 * @property {string} label
 * @property {"uploaded" | "generated" | null} source
 * @property {string | null} purpose  what the file is for, in one sentence
 * @property {string} url
 */

/**
 * @typedef {Object} VideoPromptVersion
 * @property {number} version
 * @property {string | null} promptId  null for a draft that has not been written as a row yet
 * @property {string} text
 * @property {string} negativePrompt
 * @property {PromptState} state
 * @property {PromptOrigin} origin
 * @property {string | null} sourceLabel  the server's variantLabel, in words
 * @property {string | null} approvalStatus
 * @property {number | null} generateSeconds
 * @property {number | null} fps
 * @property {string} inputsHash
 * @property {PromptImage[]} images
 * @property {PromptAudio[]} audio
 * @property {string | null} createdAt
 * @property {string | null} modelId
 * @property {number | null} estimatedCost  for its own generateSeconds, in costCurrency
 * @property {string | null} costCurrency
 */

/**
 * @typedef {Object} VideoPromptCardData
 * @property {VideoPromptVersion | null} current
 * @property {VideoPromptVersion[]} history  newest first
 * @property {PromptFreshness} freshness
 * @property {string | null} staleReason
 */

/**
 * @typedef {Object} PromptDraftInput  the studio editor, when there is one
 * @property {string} text
 * @property {string | null} aiText  the plan's latest AI recommendation
 * @property {number | null} generateSeconds
 * @property {number | null} fps
 * @property {string[]} staleReasons
 * @property {boolean} [editingSent]  the creator pressed Edit on the sent version
 */

export const REFERENCE_KIND_LABELS = Object.freeze({
  STORYBOARD: "Shot frame",
  CHARACTER_FACE: "Character",
  PRODUCT_HERO: "Product",
  DP_LIGHTING: "Lighting",
  CAMERA_PLAN_IMAGE: "Camera plan",
  SET: "Set",
  STYLE_ANCHOR: "Style",
  PRIOR_SHOT_LAST_FRAME: "Prev. frame",
  CHARACTER_VOICE: "Cast voice sample",
  BACKGROUND_MUSIC: "Music bed",
});

/** The voice sample is the actor's own recording; the music bed was generated for the shot. */
const AUDIO_SOURCE = Object.freeze({ CHARACTER_VOICE: "uploaded", BACKGROUND_MUSIC: "generated" });

/**
 * What each audio file is for. The voice sample is easy to mistake for the shot's line: it is the
 * cast member's reference recording, used to clone their voice, and says none of this shot's words.
 */
export const AUDIO_PURPOSE = Object.freeze({
  CHARACTER_VOICE: "The cast member's reference recording, used to clone their voice. It is not this shot's line — that is the Spoken take under Voice & music.",
  BACKGROUND_MUSIC: "Music made for this shot, mixed under the line.",
});

/** Where a row came from (the server's variantLabel). */
const SOURCE_LABELS = Object.freeze({
  planned: "From plan + timeline",
  "studio-reviewed": "Generated from studio",
  "user-edit": "Edited",
});

/** The text a row dispatches: the compressed one only when compression ran. */
export function rowText(row) {
  return (row?.compressionApplied
    ? row?.promptCompressed || row?.promptOriginal
    : row?.promptOriginal || row?.promptCompressed) || "";
}

/** A row the model has received (or is receiving). The server refuses to edit these. */
export function isSentRow(row) {
  return !!row?.shipped || row?.approvalStatus === "APPROVED";
}

function imagesOf(row, shotImages) {
  const references = row?.references ?? [];
  /** @type {PromptImage[]} */
  const sent = references.length
    ? references.filter((ref) => !ref.audio).map((ref) => ({
      assetId: `${ref.kind}-${ref.slotIndex}`,
      label: REFERENCE_KIND_LABELS[ref.kind] || ref.kind,
      sentToModel: true,
      thumbnailUrl: ref.url,
    }))
    : (row?.referenceImageUrls ?? []).map((url, i) => ({ assetId: `ref-${i}`, label: "Reference", sentToModel: true, thumbnailUrl: url }));
  const sentUrls = new Set(sent.map((img) => img.thumbnailUrl));
  const held = (shotImages ?? [])
    .filter((img) => img?.signedUrl && !sentUrls.has(img.signedUrl))
    .map((img) => ({ assetId: img.id, label: img.kind, sentToModel: false, thumbnailUrl: img.signedUrl }));
  return [...sent, ...held];
}

function audioOf(row) {
  return (row?.references ?? []).filter((ref) => ref.audio).map((ref) => ({
    assetId: `${ref.kind}-${ref.slotIndex}`,
    label: REFERENCE_KIND_LABELS[ref.kind] || ref.kind,
    source: AUDIO_SOURCE[ref.kind] ?? null,
    purpose: AUDIO_PURPOSE[ref.kind] ?? null,
    url: ref.url,
  }));
}

/**
 * The rows as numbered versions, newest first (v1 is the oldest).
 *
 * A studio generation is AI-written when its text is exactly an earlier AI version's, and the
 * creator's edit otherwise -- the row itself does not say.
 *
 * @returns {VideoPromptVersion[]}
 */
export function toVersions(rows, shotImages) {
  const oldestFirst = [...(rows ?? [])].reverse();
  const aiTexts = new Set();
  const versions = oldestFirst.map((row, i) => {
    const text = rowText(row);
    const label = row.variantLabel ?? null;
    const edited = label === "user-edit" || (label === "studio-reviewed" && !aiTexts.has(text));
    if (!edited) aiTexts.add(text);
    const latest = i === oldestFirst.length - 1;
    return {
      version: i + 1,
      promptId: row.promptId ?? null,
      text,
      negativePrompt: row.negativePrompt ?? "",
      state: isSentRow(row) ? PromptState.SENT : latest ? PromptState.DRAFT : PromptState.SUPERSEDED,
      origin: edited ? PromptOrigin.USER_EDITED : PromptOrigin.AI_GENERATED,
      sourceLabel: SOURCE_LABELS[label] ?? (row.parentPromptId ? "Edited" : "Prepared"),
      approvalStatus: row.approvalStatus ?? null,
      generateSeconds: row.durationSeconds ?? null,
      fps: row.fps ?? null,
      // TODO(backend): compare an inputs hash of the shot's prompt inputs once the API returns one;
      // freshness is derived from seconds, fps, the continuation frame and the analysis until then.
      inputsHash: "",
      images: imagesOf(row, shotImages),
      audio: audioOf(row),
      createdAt: row.createdAt ?? null,
      modelId: row.recommendedModelId ?? null,
      estimatedCost: row.estimatedCost == null ? null : Number(row.estimatedCost),
      costCurrency: row.costCurrency ?? null,
    };
  });
  return versions.reverse();
}

/**
 * Why the studio's prompt no longer matches the shot, in words. Empty when it is up to date.
 * `flags` is studioState.staleness(plan).
 */
export function draftStaleReasons(plan, flags) {
  const reasons = [];
  const prompt = plan?.prompt ?? {};
  const seconds = plan?.settings?.generationDurationSeconds;
  if (flags?.promptStale) {
    const written = prompt.promptDurationSeconds;
    reasons.push(written != null && written !== seconds
      ? `Written for ${written}s, shot now generates ${seconds}s`
      : `Written for ${prompt.promptFps ?? "another"} fps, shot now generates ${plan?.settings?.generationFps} fps`);
  }
  if (flags?.promptMissesContinuation) reasons.push("Written before the last-frame change");
  if (flags?.promptOlderThanAnalysis) reasons.push("Written before the latest analysis");
  if (flags?.promptOlderThanTimeline) reasons.push("Written before the timeline was changed");
  return reasons;
}

/**
 * The card's data. With a draft (the studio is open) the current version is the editor: the latest
 * row when the text is that row's, otherwise the next version number as a draft. Without one (the
 * shot has its clip) it is the version that was sent.
 *
 * @param {{ rows: Array<object>, shotImages?: Array<object>, draft?: PromptDraftInput | null }} input
 * @returns {VideoPromptCardData}
 */
export function buildCardData({ rows, shotImages = [], draft = null }) {
  const history = toVersions(rows, shotImages);
  const latest = history[0] ?? null;
  const reasons = draft?.staleReasons ?? [];
  const freshness = reasons.length ? PromptFreshness.STALE : PromptFreshness.CURRENT;
  const staleReason = reasons.length ? reasons.join(" · ") : null;

  if (!draft) {
    const sent = history.find((v) => v.state === PromptState.SENT) ?? latest;
    return { current: sent, history, freshness: PromptFreshness.CURRENT, staleReason: null };
  }
  if (latest && draft.text === latest.text) {
    const current = draft.editingSent && latest.state === PromptState.SENT ? draftFromSent({ current: latest, history }) : latest;
    return { current, history, freshness, staleReason };
  }
  if (!draft.text && !latest) return { current: null, history, freshness, staleReason };
  return {
    current: {
      ...(latest ?? emptyVersion()),
      version: (latest?.version ?? 0) + 1,
      promptId: null,
      text: draft.text,
      state: PromptState.DRAFT,
      origin: draft.aiText != null && draft.text === draft.aiText ? PromptOrigin.AI_GENERATED : PromptOrigin.USER_EDITED,
      sourceLabel: null,
      approvalStatus: null,
      generateSeconds: draft.generateSeconds,
      fps: draft.fps,
      createdAt: null,
    },
    history,
    freshness,
    staleReason,
  };
}

/**
 * Editing a sent version never touches it: the edit is a new draft numbered after the newest
 * version, starting from the sent text, and the sent one stays in the history as it was.
 *
 * @param {VideoPromptCardData} card
 * @returns {VideoPromptVersion}
 */
export function draftFromSent(card) {
  const next = Math.max(0, ...card.history.map((v) => v.version)) + 1;
  return { ...card.current, version: next, promptId: null, state: PromptState.DRAFT, approvalStatus: null, createdAt: null };
}

/** Generating a stale prompt is allowed, but asked about first. */
export function needsGenerateConfirm(freshness) {
  return freshness === PromptFreshness.STALE;
}

/**
 * What generating `seconds` should cost, from the newest version with a price. Clips are billed per
 * second, so a version priced for another length is scaled and marked approximate.
 *
 * @param {VideoPromptVersion[]} history newest first
 * @returns {{ amount: number, currency: string, exact: boolean } | null}
 */
export function estimateFor(history, seconds) {
  const priced = history.find((v) => v.estimatedCost != null && v.generateSeconds);
  if (!priced || !seconds) return null;
  const exact = priced.generateSeconds === seconds;
  return {
    amount: exact ? priced.estimatedCost : (priced.estimatedCost / priced.generateSeconds) * seconds,
    currency: priced.costCurrency || "INR",
    exact,
  };
}

const CURRENCY_SYMBOLS = Object.freeze({ INR: "₹", USD: "$", EUR: "€", GBP: "£" });

/** "₹12.40", or "≈ ₹12.40" when scaled from another length. */
export function formatEstimate(estimate) {
  if (!estimate) return null;
  const code = estimate.currency.toUpperCase();
  const amount = estimate.amount.toFixed(2);
  const money = CURRENCY_SYMBOLS[code] ? `${CURRENCY_SYMBOLS[code]}${amount}` : `${amount} ${code}`;
  return estimate.exact ? money : `≈ ${money}`;
}

function emptyVersion() {
  return {
    negativePrompt: "",
    sourceLabel: null,
    approvalStatus: null,
    generateSeconds: null,
    fps: null,
    inputsHash: "",
    images: [],
    audio: [],
    modelId: null,
    estimatedCost: null,
    costCurrency: null,
  };
}
