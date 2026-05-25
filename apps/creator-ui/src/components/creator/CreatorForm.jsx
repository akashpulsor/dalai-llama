// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Plus, Sparkles, Trash2, Users, X } from "lucide-react";

const vibes = ["Relatable", "Soft Spoken", "Determined", "Funny", "Energetic", "Confident", "Shy", "Luxury Vibe", "Beginner Creator"];
const styles = ["Casual Gym Wear", "Athleisure", "Home Setup", "Minimal Studio", "Indian Home Wear", "Office Casual"];
const roles = ["Main Actor", "Supporting Actor", "Friend", "Coach", "Parent", "Partner", "Narrator", "Background"];
const scenePresenceOptions = ["All scenes", "Hook only", "Reaction shots", "Punchline", "Voiceover only", "Final payoff"];
const confidenceLevels = ["Shy", "Somewhat Comfortable", "Confident"];

const mockActors = [
  {
    id: "creator-priya",
    name: "Priya",
    age: 27,
    gender: "Female",
    vibe: ["Relatable", "Soft Spoken", "Determined"],
    style: "Casual Gym Wear",
    cameraConfidence: "Shy",
  },
  {
    id: "creator-ananya",
    name: "Ananya",
    age: 24,
    gender: "Female",
    vibe: ["Confident", "Luxury Vibe", "Energetic"],
    style: "Athleisure",
    cameraConfidence: "Confident",
  },
  {
    id: "creator-meera",
    name: "Meera",
    age: 31,
    gender: "Female",
    vibe: ["Funny", "Relatable", "Beginner Creator"],
    style: "Home Setup",
    cameraConfidence: "Somewhat Comfortable",
  },
  {
    id: "creator-aman",
    name: "Aman",
    age: 29,
    gender: "Male",
    vibe: ["Funny", "Relatable", "Energetic"],
    style: "Office Casual",
    cameraConfidence: "Confident",
  },
];

export default function CreatorForm({
  creator,
  availableActors,
  storyCharacters = [],
  initialCharacterMappings = [],
  idea,
  audience,
  onConfirm,
  onCreateActor,
  onEnhanceIdeaWithCast,
  openActorModalSignal = 0,
  isCreatingActor = false,
  isSaving = false,
}) {
  const actors = useMemo(() => normalizeActors(availableActors), [availableActors]);
  const characters = useMemo(() => normalizeStoryCharacters(storyCharacters), [storyCharacters]);
  const firstActor = actors.find((actor) => actor.id === creator?.id) || actors[0];
  const [castMembers, setCastMembers] = useState(() => [toCastMember(firstActor, firstActor?.roleInShort || "Main Actor", "All scenes")]);
  const [activeCastId, setActiveCastId] = useState(() => `${firstActor.id}-main`);
  const [characterAssignments, setCharacterAssignments] = useState(() => buildInitialAssignments(storyCharacters, initialCharacterMappings, firstActor?.id));
  const [actorModalOpen, setActorModalOpen] = useState(false);
  const [actorDraft, setActorDraft] = useState(() => buildActorDraft(aiRoleDefaults()));
  const [createdActors, setCreatedActors] = useState([]);

  const activeMember = castMembers.find((member) => member.castId === activeCastId) || castMembers[0];
  const aiRoles = useMemo(() => suggestRolesForIdea(idea, castMembers), [castMembers, idea]);
  const mappingActors = useMemo(
    () => mergeCastMembers([
      ...castMembers,
      ...createdActors.map((actor) => toCastMember(actor, actor.roleInShort || actor.role || "Supporting Actor", actor.scenePresence || "Reaction shots")),
      ...actors.map((actor) => toCastMember(actor, actor.roleInShort || actor.role || "Supporting Actor", actor.scenePresence || "Reaction shots")),
    ]),
    [actors, castMembers, createdActors]
  );
  const castName = castMembers.length === 1 ? castMembers[0].name : `${castMembers.length} actor cast`;

  useEffect(() => {
    if (!firstActor) return;
    setCastMembers((current) => {
      if (current.length && actors.some((actor) => actor.id === current[0]?.actorId)) {
        return current;
      }
      const nextMember = toCastMember(firstActor, firstActor.roleInShort || "Main Actor", "All scenes");
      setActiveCastId(nextMember.castId);
      return [nextMember];
    });
  }, [actors, firstActor]);

  useEffect(() => {
    setCharacterAssignments((current) => ({
      ...buildInitialAssignments(characters, initialCharacterMappings, firstActor?.id),
      ...current,
    }));
  }, [characters, firstActor, initialCharacterMappings]);

  const openActorModal = () => {
    const suggestedRole = aiRoles.find((role) => !castMembers.some((member) => member.role === role.role)) || aiRoles[0];
    setActorDraft(buildActorDraft(suggestedRole));
    setActorModalOpen(true);
  };

  useEffect(() => {
    if (!openActorModalSignal) return;
    openActorModal();
  }, [openActorModalSignal]);

  const handleActorDraftChange = (patch) => {
    setActorDraft((current) => ({ ...current, ...patch }));
  };

  const toggleDraftVibe = (vibe) => {
    setActorDraft((current) => {
      const selected = current.vibe || [];
      return {
        ...current,
        vibe: selected.includes(vibe)
          ? selected.filter((item) => item !== vibe)
          : [...selected.slice(-2), vibe],
      };
    });
  };

  const handleActorModalSubmit = async (event) => {
    event.preventDefault();
    if (!actorDraft.name?.trim() || isCreatingActor) return;
    let savedActor = null;
    try {
      savedActor = onCreateActor ? await onCreateActor(actorDraft) : { ...actorDraft, id: `actor-local-${Date.now()}` };
    } catch {
      return;
    }
    if (!savedActor) return;
    const actor = normalizeActor(savedActor, actors.length + castMembers.length);
    const nextMember = toCastMember(
      actor,
      actorDraft.roleInShort || actor.roleInShort || "Supporting Actor",
      actorDraft.scenePresence || "Reaction shots"
    );
    setCreatedActors((current) => mergeActors([actor, ...current]));
    setCastMembers((current) => mergeCastMembers([...current, nextMember]));
    setActiveCastId(nextMember.castId);
    setActorModalOpen(false);
  };

  const removeActor = (castId) => {
    setCastMembers((current) => {
      const next = current.filter((member) => member.castId !== castId);
      if (!next.length) return current;
      if (activeCastId === castId) setActiveCastId(next[0].castId);
      return next;
    });
  };

  const updateActive = (patch) => {
    setCastMembers((current) => current.map((member) => (member.castId === activeMember.castId ? { ...member, ...patch } : member)));
  };

  const toggleVibe = (vibe) => {
    const selectedVibes = activeMember.vibe || [];
    updateActive({
      vibe: selectedVibes.includes(vibe)
        ? selectedVibes.filter((item) => item !== vibe)
        : [...selectedVibes.slice(-2), vibe],
    });
  };

  const confirm = () => {
    const actorsForSave = buildActorsForSave(castMembers, mappingActors, characterAssignments);
    const characterMappings = buildCharacterMappings(characters, mappingActors, characterAssignments);
    if (!characterMappings.length) {
      return;
    }
    onConfirm?.({
      id: `cast-${actorsForSave.map((member) => member.actorId).join("-")}`,
      name: actorsForSave.length === 1 ? actorsForSave[0].name : `${actorsForSave.length} actor cast`,
      actors: actorsForSave,
      characterMappings,
      ideaId: idea?.id,
      audienceId: audience?.id,
    });
  };

  const actorModal = actorModalOpen ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <form onSubmit={handleActorModalSubmit} className="creator-panel custom-scrollbar max-h-[90vh] w-full max-w-2xl overflow-y-auto p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white">Add Actor</h3>
            <p className="mt-1 text-sm font-medium text-slate-400">Save this actor to Creator profiles and add them to the cast.</p>
          </div>
          <button type="button" onClick={() => setActorModalOpen(false)} className="creator-control flex h-8 w-8 items-center justify-center">
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <TextField label="Name" value={actorDraft.name} onChange={(name) => handleActorDraftChange({ name })} />
          <TextField label="Age" value={actorDraft.age} onChange={(age) => handleActorDraftChange({ age })} />
          <TextField label="Gender" value={actorDraft.gender} onChange={(gender) => handleActorDraftChange({ gender })} />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <SelectField label="Default Role" value={actorDraft.roleInShort} options={roles} onChange={(roleInShort) => handleActorDraftChange({ roleInShort })} />
          <SelectField label="Scene Presence" value={actorDraft.scenePresence} options={scenePresenceOptions} onChange={(scenePresence) => handleActorDraftChange({ scenePresence })} />
          <SelectField label="Style" value={actorDraft.style} options={styles} onChange={(style) => handleActorDraftChange({ style })} />
          <SelectField label="Camera" value={actorDraft.cameraConfidence} options={confidenceLevels} onChange={(cameraConfidence) => handleActorDraftChange({ cameraConfidence })} />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <TextAreaField label="Look" value={actorDraft.look} onChange={(look) => handleActorDraftChange({ look })} />
          <TextAreaField label="Profile" value={actorDraft.profile} onChange={(profile) => handleActorDraftChange({ profile })} />
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-slate-400">Personality / Vibe</p>
          <div className="flex flex-wrap gap-2">
            {vibes.map((vibe) => (
              <button
                key={vibe}
                type="button"
                onClick={() => toggleDraftVibe(vibe)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${(actorDraft.vibe || []).includes(vibe) ? "bg-purple-600 text-white" : "bg-white/5 text-slate-400"}`}
              >
                {vibe}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => setActorModalOpen(false)} className="creator-control px-4 py-3 text-sm font-bold text-slate-200">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!actorDraft.name?.trim() || isCreatingActor}
            className="creator-primary flex items-center gap-2 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {isCreatingActor && <Loader2 size={16} className="animate-spin" />}
            Save Actor
          </button>
        </div>
      </form>
    </div>
  ) : null;

  return (
    <section className="creator-panel flex h-full w-full flex-col p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold">Actor</h2>
          <p className="text-sm font-medium text-slate-400">Add actors and map them to characters when the storyline is ready.</p>
        </div>
        <button type="button" onClick={openActorModal} className="creator-control flex items-center gap-1 px-3 py-2 text-xs font-semibold text-purple-200">
          <Plus size={14} /> Add Actor
        </button>
      </div>

      <div className="mb-4 rounded-lg border border-purple-400/20 bg-purple-500/10 p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-purple-200">
          <Sparkles size={14} />
          AI Cast Fit
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {aiRoles.slice(0, 4).map((role) => (
            <div key={`${role.role}-${role.scenePresence}`} className="rounded-md bg-black/20 px-3 py-2">
              <p className="text-xs font-bold text-white">{role.role}</p>
              <p className="mt-1 text-[11px] font-medium leading-4 text-slate-400">{role.scenePresence}</p>
            </div>
          ))}
        </div>
      </div>

      {characters.length > 0 && (
        <div className="mb-4 rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-100">
              <Users size={14} />
              Character To Cast Mapping
            </div>
            <div className="flex max-w-full flex-wrap gap-1.5">
              {mappingActors.slice(0, 6).map((member) => (
                <span key={`saved-${member.actorId}`} className="rounded-full bg-black/20 px-2 py-1 text-[11px] font-semibold text-emerald-100">
                  {member.name}
                </span>
              ))}
              {mappingActors.length > 6 && (
                <span className="rounded-full bg-black/20 px-2 py-1 text-[11px] font-semibold text-emerald-100">
                  +{mappingActors.length - 6}
                </span>
              )}
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {characters.map((character, index) => {
              const key = character.characterKey;
              const selectedActorId = characterAssignments[key] || mappingActors[index % Math.max(1, mappingActors.length)]?.actorId || "";
              return (
                <label key={key} className="creator-panel-muted block p-3">
                  <span className="block text-xs font-bold text-white">{character.name}</span>
                  <span className="mt-1 block text-[11px] font-medium leading-4 text-slate-400">
                    {character.role || "Story character"} / {character.gender || "Any"} / Age {character.age || character.ageRange || "flexible"}
                  </span>
                  <select
                    value={selectedActorId}
                    onChange={(event) => setCharacterAssignments((current) => ({ ...current, [key]: event.target.value }))}
                    className="mt-3 block w-full rounded-md border border-white/10 bg-[#0b1020] px-3 py-2 text-sm font-semibold text-white outline-none"
                  >
                    {mappingActors.map((member) => (
                      <option key={`${key}-${member.castId}`} value={member.actorId} className="bg-[#0b1020] text-white">
                        {member.name} - {member.role}
                      </option>
                    ))}
                  </select>
                  <span className="mt-2 line-clamp-2 block text-[11px] font-medium leading-4 text-slate-500">{character.profile || character.persona || character.look}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(13rem,0.8fr)_minmax(0,1fr)]">
        <div className="custom-scrollbar min-h-0 space-y-2 overflow-y-auto pr-1">
          {castMembers.map((member) => {
            const active = member.castId === activeMember.castId;
            return (
              <button
                key={member.castId}
                type="button"
                onClick={() => setActiveCastId(member.castId)}
                className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left transition ${
                  active ? "border-purple-400 bg-purple-500/15" : "border-white/10 bg-white/[0.035] hover:border-purple-300/40"
                }`}
              >
                <ActorAvatar member={member} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-white">{member.name}</span>
                  <span className="block truncate text-xs font-medium text-slate-400">{member.role}</span>
                </span>
                {castMembers.length > 1 && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      removeActor(member.castId);
                    }}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-red-500/10 hover:text-red-200"
                  >
                    <Trash2 size={14} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="min-h-0 rounded-lg border border-white/10 bg-white/[0.025] p-3">
          <div className="mb-3 flex items-center gap-3">
            <ActorAvatar member={activeMember} />
            <div>
              <p className="text-lg font-bold text-white">{activeMember.name}</p>
              <p className="text-sm font-medium text-slate-400">Age {activeMember.age} - {activeMember.gender}</p>
            </div>
          </div>

          <div className="mb-3 grid gap-2 sm:grid-cols-3">
            <TextField label="Name" value={activeMember.name} onChange={(name) => updateActive({ name })} />
            <TextField label="Age" value={activeMember.age} onChange={(age) => updateActive({ age })} />
            <TextField label="Gender" value={activeMember.gender} onChange={(gender) => updateActive({ gender })} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <SelectField label="Role" value={activeMember.role} options={roles} onChange={(role) => updateActive({ role })} />
            <SelectField label="Scene Presence" value={activeMember.scenePresence} options={scenePresenceOptions} onChange={(scenePresence) => updateActive({ scenePresence })} />
            <SelectField label="Style" value={activeMember.style} options={styles} onChange={(style) => updateActive({ style })} />
            <SelectField label="Camera" value={activeMember.cameraConfidence} options={confidenceLevels} onChange={(cameraConfidence) => updateActive({ cameraConfidence })} />
          </div>

          <div className="mt-3 grid gap-2 lg:grid-cols-2">
            <TextAreaField label="Look" value={activeMember.look} onChange={(look) => updateActive({ look })} />
            <TextAreaField label="Profile" value={activeMember.profile} onChange={(profile) => updateActive({ profile })} />
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-slate-400">Personality / Vibe</p>
            <div className="flex flex-wrap gap-2">
              {vibes.map((vibe) => (
                <button
                  key={vibe}
                  type="button"
                  onClick={() => toggleVibe(vibe)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${(activeMember.vibe || []).includes(vibe) ? "bg-purple-600 text-white" : "bg-white/5 text-slate-400"}`}
                >
                  {vibe}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onEnhanceIdeaWithCast?.({
            id: `cast-${buildActorsForSave(castMembers, mappingActors, characterAssignments).map((member) => member.actorId).join("-")}`,
            name: castName,
            actors: buildActorsForSave(castMembers, mappingActors, characterAssignments),
            characterMappings: buildCharacterMappings(characters, mappingActors, characterAssignments),
          })}
          className="creator-control flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-emerald-100"
        >
          <Sparkles size={16} />
          Enhance Idea Based On My Cast
        </button>
        <button type="button" onClick={confirm} disabled={isSaving || !characters.length} className="creator-primary flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white transition disabled:opacity-50">
          <Users size={16} />
          {isSaving ? "Saving Actors..." : characters.length ? "Confirm Actor Mapping" : "Generate Storyline First"}
        </button>
      </div>

      {actorModal && typeof document !== "undefined" ? createPortal(actorModal, document.body) : actorModal}
    </section>
  );
}

function normalizeActors(availableActors) {
  const source = [
    ...(Array.isArray(availableActors) ? availableActors : []),
    ...mockActors,
  ].filter((actor, index, list) => list.findIndex((candidate) => sameActor(candidate, actor)) === index);
  return source.map(normalizeActor);
}

function mergeActors(actors = []) {
  return actors
    .filter(Boolean)
    .map(normalizeActor)
    .filter((actor, index, list) => list.findIndex((candidate) => sameActor(candidate, actor)) === index);
}

function normalizeActor(actor = {}, index = 0) {
  const attributes = actor.attributes || {};
  const id = actor.id || actor.actorId || `actor-${index}`;
  const roleInShort = actor.roleInShort || actor.role || attributes.roleInShort || "Main Actor";
  return {
    id,
    actorId: id,
    name: actor.name || actor.displayName || attributes.displayName || `Actor ${index + 1}`,
    age: actor.age || attributes.age || 26,
    gender: actor.gender || attributes.gender || "All",
    vibe: actor.vibe || actor.vibes || attributes.vibe || attributes.vibes || ["Relatable"],
    style: actor.style || attributes.style || "Casual Gym Wear",
    cameraConfidence: actor.cameraConfidence || attributes.cameraConfidence || "Somewhat Comfortable",
    roleInShort,
    role: roleInShort,
    scenePresence: actor.scenePresence || attributes.scenePresence || "Reaction shots",
    look: actor.look || attributes.look || "",
    profile: actor.profile || attributes.profile || "",
  };
}

function aiRoleDefaults() {
  return { role: "Supporting Actor", scenePresence: "Reaction shots" };
}

function buildActorDraft(suggestedRole = aiRoleDefaults()) {
  return {
    name: "",
    age: 26,
    gender: "All",
    roleInShort: suggestedRole?.role || "Supporting Actor",
    scenePresence: suggestedRole?.scenePresence || "Reaction shots",
    style: "Casual Gym Wear",
    cameraConfidence: "Somewhat Comfortable",
    vibe: ["Relatable"],
    look: "",
    profile: "",
  };
}

function sameActor(left = {}, right = {}) {
  const leftId = String(left.id || "").trim();
  const rightId = String(right.id || "").trim();
  const leftName = String(left.name || left.displayName || "").trim().toLowerCase();
  const rightName = String(right.name || right.displayName || "").trim().toLowerCase();
  return (leftId && rightId && leftId === rightId) || (leftName && rightName && leftName === rightName);
}

function normalizeStoryCharacters(storyCharacters = []) {
  return (Array.isArray(storyCharacters) ? storyCharacters : []).map((character, index) => ({
    ...character,
    characterKey: character.characterKey || character.key || `${slugify(character.name || "character")}-${index + 1}`,
    name: character.name || `Character ${index + 1}`,
    role: character.role || "Story character",
    age: character.age || character.ageRange || "",
    gender: character.gender || "",
    look: character.look || character.visualIdentity || "",
    profile: character.profile || character.persona || "",
  }));
}

function buildInitialAssignments(storyCharacters = [], initialMappings = [], fallbackActorId) {
  const characters = normalizeStoryCharacters(storyCharacters);
  const savedMappings = Array.isArray(initialMappings) ? initialMappings : [];
  const result = {};
  characters.forEach((character) => {
    const saved = savedMappings.find((mapping) => mapping.characterKey === character.characterKey || mapping.characterName === character.name);
    result[character.characterKey] = String(saved?.castProfileId || fallbackActorId || "");
  });
  return result;
}

function buildCharacterMappings(characters = [], castMembers = [], assignments = {}) {
  return normalizeStoryCharacters(characters).map((character, index) => {
    const selectedActorId = assignments[character.characterKey] || castMembers[index % Math.max(1, castMembers.length)]?.actorId;
    const selected = castMembers.find((member) => member.actorId === selectedActorId) || castMembers[index % Math.max(1, castMembers.length)] || {};
    return {
      characterKey: character.characterKey,
      characterName: character.name,
      characterRole: character.role,
      castProfileId: selected.actorId,
      castDisplayName: selected.name,
      characterPayload: character,
      castPayload: selected,
    };
  });
}

function buildActorsForSave(castMembers = [], mappingActors = [], assignments = {}) {
  const assignedIds = new Set(Object.values(assignments || {}).filter(Boolean).map(String));
  return mergeCastMembers([
    ...castMembers,
    ...mappingActors.filter((member) => assignedIds.has(String(member.actorId))),
  ]);
}

function mergeCastMembers(members = []) {
  return members
    .filter(Boolean)
    .filter((member, index, list) => list.findIndex((candidate) => sameCastMember(candidate, member)) === index);
}

function sameCastMember(left = {}, right = {}) {
  const leftId = String(left.actorId || left.id || "").trim();
  const rightId = String(right.actorId || right.id || "").trim();
  const leftName = String(left.name || "").trim().toLowerCase();
  const rightName = String(right.name || "").trim().toLowerCase();
  return (leftId && rightId && leftId === rightId) || (leftName && rightName && leftName === rightName);
}

function slugify(value) {
  return String(value || "character").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "character";
}

function ActorAvatar({ member, size = "lg" }) {
  const [failed, setFailed] = useState(false);
  const dimension = size === "sm" ? "h-11 w-11" : "h-16 w-16";
  if (failed) {
    return (
      <span className={`${dimension} flex shrink-0 items-center justify-center rounded-full border border-white/10 bg-purple-500/15 text-sm font-extrabold text-purple-100`}>
        {String(member?.name || "?").slice(0, 1)}
      </span>
    );
  }
  return (
    <img
      className={`creator-avatar-img ${dimension} shrink-0`}
      src={`/mocks/creator/${member.actorId}.png`}
      alt=""
      onError={() => setFailed(true)}
    />
  );
}

function toCastMember(actor, role, scenePresence) {
  const roleKey = role === "Main Actor" ? "main" : role.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return {
    castId: `${actor.id}-${roleKey}`,
    actorId: actor.id,
    name: actor.name,
    age: actor.age,
    gender: actor.gender,
    vibe: actor.vibe,
    style: actor.style,
    cameraConfidence: actor.cameraConfidence,
    look: actor.look,
    profile: actor.profile,
    role,
    scenePresence,
  };
}

function suggestRolesForIdea(idea, castMembers) {
  const text = `${idea?.title || ""} ${idea?.description || ""}`.toLowerCase();
  if (/saas|bahu|wife|family|couple|neighbor/.test(text)) {
    return [
      { role: "Main Actor", scenePresence: "All scenes" },
      { role: "Supporting Actor", scenePresence: "Reaction shots" },
      { role: "Friend", scenePresence: "Punchline" },
    ];
  }
  if (/coach|gym|fitness|workout/.test(text)) {
    return [
      { role: "Main Actor", scenePresence: "All scenes" },
      { role: "Coach", scenePresence: "Hook only" },
      { role: "Friend", scenePresence: "Final payoff" },
    ];
  }
  if (/study|exam|student/.test(text)) {
    return [
      { role: "Main Actor", scenePresence: "All scenes" },
      { role: "Narrator", scenePresence: "Voiceover only" },
      { role: "Friend", scenePresence: "Reaction shots" },
    ];
  }
  return [
    { role: castMembers[0]?.role || "Main Actor", scenePresence: "All scenes" },
    { role: "Supporting Actor", scenePresence: "Reaction shots" },
  ];
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="creator-panel-muted block p-3">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 block w-full bg-transparent text-sm font-semibold text-white outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-[#0b1020] text-white">
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextField({ label, value, onChange }) {
  return (
    <label className="creator-panel-muted block p-3">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <input
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 block w-full bg-transparent text-sm font-semibold text-white outline-none"
      />
    </label>
  );
}

function TextAreaField({ label, value, onChange }) {
  return (
    <label className="creator-panel-muted block p-3">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <textarea
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="custom-scrollbar mt-1 block max-h-28 w-full resize-y bg-transparent text-sm font-semibold leading-5 text-white outline-none"
      />
    </label>
  );
}
