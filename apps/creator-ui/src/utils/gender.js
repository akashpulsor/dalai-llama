/** Loose match against a free-text gender field (see CastProfile.gender / ScriptCharacter.gender's
 * own javadocs on why those columns are deliberately not enums) into the MALE/FEMALE codes the
 * gender master table (V55) and llm-gateway's builtin_voice.gender both use. Never hides or
 * blocks anything -- callers use this only as a UI default/suggestion. */
export function normalizeGender(freeText) {
  const value = (freeText || "").trim().toLowerCase();
  if (["male", "m", "man", "boy"].includes(value)) return "MALE";
  if (["female", "f", "woman", "girl"].includes(value)) return "FEMALE";
  return null;
}
