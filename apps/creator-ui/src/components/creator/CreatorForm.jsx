// @ts-nocheck
import React, { useMemo, useState } from "react";
import { Plus, Sparkles } from "lucide-react";

const vibes = ["Relatable", "Soft Spoken", "Determined", "Funny", "Energetic", "Confident", "Shy", "Luxury Vibe", "Beginner Creator"];
const fitnessLevels = ["Beginner", "Intermediate", "Advanced"];
const styles = ["Casual Gym Wear", "Athleisure", "Home Workout", "Minimal Studio"];
const roles = ["Main Actor", "Narrator", "Coach", "Friend"];
const confidenceLevels = ["Shy", "Somewhat Comfortable", "Confident"];

const mockProfiles = [
  {
    id: "creator-priya",
    name: "Priya",
    age: 27,
    gender: "Female",
    vibe: ["Relatable", "Soft Spoken", "Determined"],
    fitnessLevel: "Beginner",
    style: "Casual Gym Wear",
    cameraConfidence: "Shy",
  },
  {
    id: "creator-ananya",
    name: "Ananya",
    age: 24,
    gender: "Female",
    vibe: ["Confident", "Luxury Vibe", "Energetic"],
    fitnessLevel: "Intermediate",
    style: "Athleisure",
    cameraConfidence: "Confident",
  },
  {
    id: "creator-meera",
    name: "Meera",
    age: 31,
    gender: "Female",
    vibe: ["Funny", "Relatable", "Beginner Creator"],
    fitnessLevel: "Beginner",
    style: "Home Workout",
    cameraConfidence: "Somewhat Comfortable",
  },
];

export default function CreatorForm({ creator, onConfirm }) {
  const initialProfile = mockProfiles.find((profile) => profile.id === creator?.id) || mockProfiles[0];
  const [profile, setProfile] = useState(initialProfile);
  const [selectedVibes, setSelectedVibes] = useState(initialProfile.vibe);
  const [fitnessLevel, setFitnessLevel] = useState(initialProfile.fitnessLevel);
  const [style, setStyle] = useState(initialProfile.style);
  const [role, setRole] = useState("Main Actor");
  const [cameraConfidence, setCameraConfidence] = useState(initialProfile.cameraConfidence);

  const avatarSrc = `/mocks/creator/${profile.id}.png`;
  const tailoredLine = useMemo(
    () => `AI will tailor the script, expressions, shots and dialogue style based on ${profile.name}'s profile.`,
    [profile.name]
  );

  const selectProfile = () => {
    const nextProfile = mockProfiles[(mockProfiles.findIndex((candidate) => candidate.id === profile.id) + 1) % mockProfiles.length];
    setProfile(nextProfile);
    setSelectedVibes(nextProfile.vibe);
    setFitnessLevel(nextProfile.fitnessLevel);
    setStyle(nextProfile.style);
    setCameraConfidence(nextProfile.cameraConfidence);
  };

  const toggleVibe = (vibe) => {
    setSelectedVibes((current) => {
      if (current.includes(vibe)) return current.filter((item) => item !== vibe);
      return [...current.slice(-2), vibe];
    });
  };

  const confirm = () => {
    onConfirm?.({
      ...profile,
      vibe: selectedVibes,
      fitnessLevel,
      style,
      role,
      cameraConfidence,
    });
  };

  return (
    <section className="creator-panel flex h-full w-full flex-col p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold">3. Cast / Creator Profile</h2>
          <p className="text-sm font-medium text-slate-400">Tell us who will be in the short.</p>
        </div>
        <button type="button" onClick={selectProfile} className="creator-control flex items-center gap-1 px-3 py-2 text-xs font-semibold text-purple-200">
          <Plus size={14} /> Add New
        </button>
      </div>

      <div className="mb-4 flex items-center gap-4 rounded-lg border border-white/10 bg-white/[0.035] p-3">
        <img className="creator-avatar-img h-20 w-20 shrink-0" src={avatarSrc} alt="" />
        <div>
          <p className="text-lg font-bold">{profile.name}</p>
          <p className="text-sm font-medium text-slate-400">Age {profile.age} - {profile.gender}</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-xs font-medium text-slate-400">Personality / Vibe</p>
        <div className="flex flex-wrap gap-2">
          {vibes.map((vibe) => (
            <button
              key={vibe}
              type="button"
              onClick={() => toggleVibe(vibe)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${selectedVibes.includes(vibe) ? "bg-purple-600 text-white" : "bg-white/5 text-slate-400"}`}
            >
              {vibe}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <SelectField label="Fitness Level" value={fitnessLevel} options={fitnessLevels} onChange={setFitnessLevel} />
        <SelectField label="Style" value={style} options={styles} onChange={setStyle} />
        <SelectField label="Role in Short" value={role} options={roles} onChange={setRole} />
        <SelectField label="Camera" value={cameraConfidence} options={confidenceLevels} onChange={setCameraConfidence} />
      </div>

      <div className="mt-4 rounded-lg border border-purple-400/20 bg-purple-500/10 p-3 text-sm font-medium leading-6 text-purple-100">
        <Sparkles size={15} className="mr-2 inline" />
        {tailoredLine}
      </div>
      <button type="button" onClick={confirm} className="creator-primary mt-auto w-full px-4 py-3 text-sm font-bold text-white transition">
        Confirm Cast
      </button>
    </section>
  );
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
