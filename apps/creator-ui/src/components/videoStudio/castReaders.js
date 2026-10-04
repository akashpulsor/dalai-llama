/**
 * The cast as people who can read a shot's line: each profile in the project, named after the
 * character it plays when it plays one, with what its voice is. Pure, so it can be tested alone.
 */

/** What a profile's voice is, as the dub will use it. */
export function voiceKind(profile) {
  if (profile.clonedVoiceId && profile.clonedVoiceProviderId) {
    return profile.voiceIdentityType === "AI" ? "built-in voice" : "cloned voice";
  }
  if (profile.voiceRefObjectKey) return "voice sample (cloned on first use)";
  if (profile.builtinVoiceId) return "built-in voice";
  return null;
}

/**
 * @param profiles      the project's cast profiles
 * @param assignments   {scriptCharacterId, castProfileId}
 * @param characters    the script's characters {id, characterName}
 */
export function castReaders(profiles = [], assignments = [], characters = []) {
  const nameById = new Map(characters.map((c) => [c.id, c.characterName]));
  const playing = new Map();
  for (const assignment of assignments) {
    const name = nameById.get(assignment.scriptCharacterId);
    if (name) playing.set(assignment.castProfileId, [...(playing.get(assignment.castProfileId) ?? []), name]);
  }
  return profiles
    .filter((profile) => profile.profileType !== "PRODUCT")
    .map((profile) => ({
      id: profile.id,
      name: profile.displayName,
      plays: playing.get(profile.id) ?? [],
      narrator: profile.profileType === "NARRATOR",
      voice: voiceKind(profile),
    }))
    // People with a voice first, then by name -- a reader with no voice cannot be chosen anyway.
    .sort((a, b) => Number(!a.voice) - Number(!b.voice) || a.name.localeCompare(b.name));
}
