// Run with: node --test apps/creator-ui/src/components/videoStudio/castReaders.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { castReaders, voiceKind } from "./castReaders.js";

const profiles = [
  { id: "p-ravi", displayName: "Arjun", profileType: "ACTOR", clonedVoiceId: "v1", clonedVoiceProviderId: "elevenlabs", voiceIdentityType: "HUMAN" },
  { id: "p-neha", displayName: "Meera", profileType: "ACTOR", voiceRefObjectKey: "samples/meera.mp3" },
  { id: "p-narr", displayName: "Studio narrator", profileType: "NARRATOR", builtinVoiceId: "b1" },
  { id: "p-none", displayName: "Extra", profileType: "ACTOR" },
  { id: "p-prod", displayName: "UrbanFix kit", profileType: "PRODUCT" },
];
const assignments = [
  { scriptCharacterId: "c-ravi", castProfileId: "p-ravi" },
  { scriptCharacterId: "c-neha", castProfileId: "p-neha" },
];
const characters = [{ id: "c-ravi", characterName: "Ravi" }, { id: "c-neha", characterName: "Neha" }];

test("every person in the cast is a possible reader, named after the character they play", () => {
  const readers = castReaders(profiles, assignments, characters);
  const ravi = readers.find((r) => r.id === "p-ravi");
  assert.deepEqual(ravi.plays, ["Ravi"]);
  assert.equal(ravi.voice, "cloned voice");
  assert.ok(readers.find((r) => r.id === "p-narr").narrator);
});

test("products are not readers, and anyone without a voice is listed last", () => {
  const readers = castReaders(profiles, assignments, characters);
  assert.equal(readers.some((r) => r.id === "p-prod"), false);
  assert.equal(readers.at(-1).id, "p-none");
  assert.equal(readers.at(-1).voice, null);
});

test("a voice sample is described as cloned when first used", () => {
  assert.equal(voiceKind({ voiceRefObjectKey: "x" }), "voice sample (cloned on first use)");
  assert.equal(voiceKind({ clonedVoiceId: "v", clonedVoiceProviderId: "p", voiceIdentityType: "AI" }), "built-in voice");
});
