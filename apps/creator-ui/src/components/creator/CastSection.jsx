// @ts-nocheck
import React, { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { Check, ChevronDown, Info, Loader2, Mic, Pencil, Plus, Save, User2, X } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useCreateCastAssignmentMutation,
  useListCastAssignmentsQuery,
  useListCastProfilesQuery,
  useUpdateCastProfileVoiceMutation,
  useUpdateScriptCharacterMutation,
  useUploadCastMediaMutation,
} from "../../api/creatorEndpoints.js";
import CastProfileQuickCreate from "./CastProfileQuickCreate.jsx";
import VoiceSampleField from "./VoiceSampleField.jsx";

const CHARACTER_DETAIL_FIELDS = [
  { key: "gender", label: "Gender" },
  { key: "ageRange", label: "Age" },
  { key: "look", label: "Look" },
  { key: "complexion", label: "Complexion" },
  { key: "profile", label: "Profile" },
  { key: "persona", label: "Persona" },
  { key: "backstory", label: "Backstory" },
  { key: "motivation", label: "Motivation" },
  { key: "fearOrBlock", label: "Fear / block" },
  { key: "relationshipToStory", label: "Relationship to story" },
  { key: "speakingStyle", label: "Speaking style" },
  { key: "visualIdentity", label: "Visual identity" },
];

const CHARACTER_TYPE_LABEL = { HUMAN: "Character", PRODUCT: "Product", NARRATOR: "Narrator" };

// ScriptCharacter.characterType (HUMAN/PRODUCT/NARRATOR) and CastProfile.profileType
// (ACTOR/PRODUCT/NARRATOR) are different enums that only disagree on the "a person" case --
// without this mapping, every HUMAN character silently got the PRODUCT creation form (no
// age/gender/voice fields) and never matched an existing actor profile to quick-pick.
// NARRATOR maps to ACTOR too, not to CastProfileType.NARRATOR: a narrator is just a voice-over
// role, nothing in shot generation resolves it through a NARRATOR-typed profile (narratorCast on
// the backend matches by the script character's own type, not the assigned profile's), so any
// existing actor's cloned voice can lend itself to the narration -- no reason to force creating a
// separate, single-use "narrator" profile when one doesn't already exist.
const toProfileType = (characterType) => (characterType === "PRODUCT" ? "PRODUCT" : "ACTOR");

/** Cast tab, as a section on the project page: one row per narrative character (human or
 * product) from the script, each either already assigned to a real CastProfile or offering a
 * pick-existing / create-new flow to assign one. This is what CastAssignment ultimately feeds --
 * a shot with this character as its primaryCharacterKey resolves the assigned CastProfile's face
 * (and, for a human, voice) reference when it's dispatched for video generation. */
export default function CastSection({ projectId, characters }) {
  const dispatch = useDispatch();
  const [openCharacterId, setOpenCharacterId] = useState(null);
  const [creatingCharacterId, setCreatingCharacterId] = useState(null);
  const [detailCharacterId, setDetailCharacterId] = useState(null);
  const [editCharacterId, setEditCharacterId] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [voiceEditCharacterId, setVoiceEditCharacterId] = useState(null);
  const [voiceFile, setVoiceFile] = useState(null);

  const { data: assignments = [] } = useListCastAssignmentsQuery(projectId, { skip: !projectId });
  const { data: profiles = [] } = useListCastProfilesQuery({ projectId }, { skip: !projectId });
  const [createAssignment, { isLoading: assigning }] = useCreateCastAssignmentMutation();
  const [updateCharacter, { isLoading: savingEdit }] = useUpdateScriptCharacterMutation();
  const [uploadMedia, { isLoading: uploadingVoice }] = useUploadCastMediaMutation();
  const [updateVoice, { isLoading: savingVoice }] = useUpdateCastProfileVoiceMutation();
  const savingVoiceFile = uploadingVoice || savingVoice;

  const assignmentByCharacter = useMemo(() => {
    const map = new Map();
    assignments.forEach((a) => map.set(a.scriptCharacterId, a));
    return map;
  }, [assignments]);
  const profileById = useMemo(() => {
    const map = new Map();
    profiles.forEach((p) => map.set(p.id, p));
    return map;
  }, [profiles]);

  if (!characters?.length) return null;

  const handlePickExisting = async (character, profileId) => {
    try {
      await createAssignment({ projectId, scriptCharacterId: character.id, castProfileId: profileId }).unwrap();
      dispatch(showFlash({ message: `${character.characterName} cast`, type: "success" }));
      setOpenCharacterId(null);
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not assign this cast profile", type: "error" }));
    }
  };

  const handleCreated = async (character, profile) => {
    await handlePickExisting(character, profile.id);
    setCreatingCharacterId(null);
  };

  const startEdit = (character) => {
    const seed = {};
    CHARACTER_DETAIL_FIELDS.forEach(({ key }) => { seed[key] = character[key] || ""; });
    seed.characterName = character.characterName || "";
    setEditFields(seed);
    setEditCharacterId(character.id);
    setDetailCharacterId(character.id);
  };

  const handleSaveEdit = async (character) => {
    try {
      await updateCharacter({ projectId, characterId: character.id, ...editFields }).unwrap();
      dispatch(showFlash({ message: "Character updated", type: "success" }));
      setEditCharacterId(null);
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not save these changes", type: "error" }));
    }
  };

  const handleSaveVoice = async (character, profile) => {
    if (!voiceFile) {
      dispatch(showFlash({ message: "Choose or record a voice sample first", type: "error" }));
      return;
    }
    try {
      const media = await uploadMedia({ kind: "VOICE", file: voiceFile }).unwrap();
      await updateVoice({
        castProfileId: profile.id,
        voiceRefBucket: media.bucket,
        voiceRefObjectKey: media.objectKey,
        projectId,
        profileType: character.characterType,
      }).unwrap();
      dispatch(showFlash({ message: `Voice sample saved for ${profile.displayName}`, type: "success" }));
      setVoiceEditCharacterId(null);
      setVoiceFile(null);
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not save this voice sample", type: "error" }));
    }
  };

  return (
    <div className="creator-panel mt-6 p-6">
      <p className="text-[11px] font-extrabold uppercase tracking-widest text-purple-300">Characterization</p>
      <p className="mt-0.5 text-xs font-medium text-slate-400">
        Every character, product, and narrator the screenplay actually uses — assign a real actor to each one, that's the identity video generation uses.
      </p>

      <div className="mt-4 space-y-2.5">
        {characters.map((character) => {
          const assignment = assignmentByCharacter.get(character.id);
          const profile = assignment ? profileById.get(assignment.castProfileId) : null;
          const isOpen = openCharacterId === character.id;
          const isCreating = creatingCharacterId === character.id;
          const matchingProfiles = profiles.filter((p) => p.profileType === toProfileType(character.characterType));
          const hasDetail = character.characterType !== "PRODUCT"
            && CHARACTER_DETAIL_FIELDS.some(({ key }) => character[key]);
          const detailOpen = detailCharacterId === character.id;

          return (
            <div key={character.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
                    {profile?.faceRefUrl ? (
                      <img src={profile.faceRefUrl} alt={profile.displayName} className="h-full w-full object-cover" />
                    ) : (
                      <User2 size={14} className="text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-bold text-white">
                      {character.characterName}
                      {character.characterType !== "PRODUCT" && (
                        <button
                          type="button"
                          onClick={() => {
                            if (detailOpen) {
                              setDetailCharacterId(null);
                              setEditCharacterId(null);
                            } else if (hasDetail) {
                              setDetailCharacterId(character.id);
                            } else {
                              startEdit(character);
                            }
                          }}
                          className="text-slate-500 hover:text-purple-300"
                          title={hasDetail ? "Character detail" : "Add character detail"}
                        >
                          <Info size={12} />
                        </button>
                      )}
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      {character.characterType === "NARRATOR"
                        ? "Narrator"
                        : character.characterType === "PRODUCT" ? "Product" : character.characterRole || "Character"}
                      {character.age ? ` · ${character.age}` : character.ageRange ? ` · ${character.ageRange}` : ""}
                    </p>
                  </div>
                </div>

                {profile ? (
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-200">
                      <Check size={12} />
                      {profile.displayName}
                    </span>
                    {character.characterType !== "PRODUCT" && (
                      <button
                        type="button"
                        onClick={() => {
                          const opening = voiceEditCharacterId !== character.id;
                          setVoiceEditCharacterId(opening ? character.id : null);
                          setVoiceFile(null);
                        }}
                        title={profile.voiceRefBucket ? "Replace voice sample" : "No voice sample yet — add one"}
                        className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold ${
                          profile.voiceRefBucket
                            ? "border-white/10 bg-white/5 text-slate-300 hover:border-purple-400/30"
                            : "border-amber-400/25 bg-amber-500/10 text-amber-200"
                        }`}
                      >
                        <Mic size={10} />
                        {profile.voiceRefBucket ? "Voice" : "No voice"}
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenCharacterId(isOpen ? null : character.id);
                      setCreatingCharacterId(null);
                    }}
                    className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-200 hover:border-purple-400/30"
                  >
                    Assign
                    <ChevronDown size={12} className={isOpen ? "rotate-180 transition-transform" : "transition-transform"} />
                  </button>
                )}
              </div>

              {voiceEditCharacterId === character.id && profile && (
                <div className="mt-3 space-y-2.5 border-t border-white/10 pt-3">
                  <VoiceSampleField file={voiceFile} onFileChange={setVoiceFile} />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setVoiceEditCharacterId(null); setVoiceFile(null); }}
                      className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300"
                    >
                      <X size={11} />
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={savingVoiceFile}
                      onClick={() => handleSaveVoice(character, profile)}
                      className="creator-primary flex flex-1 items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold text-white disabled:opacity-60"
                    >
                      {savingVoiceFile ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                      {savingVoiceFile ? "Saving…" : "Save voice"}
                    </button>
                  </div>
                </div>
              )}

              {detailOpen && hasDetail && editCharacterId !== character.id && (
                <div className="mt-3 border-t border-white/10 pt-3">
                  <div className="mb-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => startEdit(character)}
                      className="flex items-center gap-1 text-[10px] font-bold text-purple-300 hover:text-purple-200"
                    >
                      <Pencil size={10} />
                      Edit
                    </button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {CHARACTER_DETAIL_FIELDS.filter(({ key }) => character[key]).map(({ key, label }) => (
                      <div key={key}>
                        <p className="text-[9px] font-extrabold uppercase tracking-wide text-slate-500">{label}</p>
                        <p className="text-[11px] font-medium text-slate-300">{character[key]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailOpen && editCharacterId === character.id && (
                <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                  <div>
                    <label className="mb-1 block text-[9px] font-extrabold uppercase tracking-wide text-slate-500">Name</label>
                    <input
                      type="text"
                      value={editFields.characterName || ""}
                      onChange={(event) => setEditFields((current) => ({ ...current, characterName: event.target.value }))}
                      className="creator-input w-full px-2.5 py-1.5 text-xs font-semibold"
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {CHARACTER_DETAIL_FIELDS.map(({ key, label }) => (
                      <div key={key}>
                        <label className="mb-1 block text-[9px] font-extrabold uppercase tracking-wide text-slate-500">{label}</label>
                        <textarea
                          rows={1}
                          value={editFields[key] || ""}
                          onChange={(event) => setEditFields((current) => ({ ...current, [key]: event.target.value }))}
                          className="creator-input w-full resize-y px-2.5 py-1.5 text-[11px]"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditCharacterId(null)}
                      className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300"
                    >
                      <X size={11} />
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={savingEdit}
                      onClick={() => handleSaveEdit(character)}
                      className="creator-primary flex flex-1 items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold text-white disabled:opacity-60"
                    >
                      <Save size={11} />
                      {savingEdit ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              )}

              {isOpen && !profile && (
                <div className="mt-3 border-t border-white/10 pt-3">
                  {!isCreating && (
                    <>
                      {matchingProfiles.length > 0 && (
                        <div className="mb-2.5 space-y-1.5">
                          {matchingProfiles.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              disabled={assigning}
                              onClick={() => handlePickExisting(character, p.id)}
                              className="flex w-full items-center justify-between rounded-md border border-white/10 bg-white/5 px-2.5 py-2 text-left text-xs font-semibold text-slate-200 hover:border-purple-400/30 disabled:opacity-60"
                            >
                              {p.displayName}
                              <span className="text-[10px] font-medium text-slate-500">Use</span>
                            </button>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setCreatingCharacterId(character.id)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-white/15 py-2 text-xs font-bold text-slate-300 hover:border-purple-400/40 hover:text-purple-200"
                      >
                        <Plus size={12} />
                        {character.characterType === "PRODUCT" ? "New product" : "New actor"}
                      </button>
                    </>
                  )}

                  {isCreating && (
                    <CastProfileQuickCreate
                      profileType={toProfileType(character.characterType)}
                      projectId={projectId}
                      onCreated={(profile) => handleCreated(character, profile)}
                      onCancel={() => setCreatingCharacterId(null)}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
