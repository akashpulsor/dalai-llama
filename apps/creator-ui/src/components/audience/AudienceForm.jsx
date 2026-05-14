// @ts-nocheck
import React, { useMemo, useState } from "react";
import { Sparkles, Users, X } from "lucide-react";

const allTags = ["Fitness", "Health", "Self Improvement", "Confidence", "Beginner Gym", "Weight Loss"];
const ageGroups = ["18 - 24", "22 - 35", "30 - 45", "All Ages"];
const locations = ["India", "US", "UK", "UAE"];
const preferences = ["Motivational & Relatable", "Funny & Honest", "Educational", "Before / After"];

export default function AudienceForm({ audience, onConfirm }) {
  const [gender, setGender] = useState("Female");
  const [ageGroup, setAgeGroup] = useState("22 - 35");
  const [location, setLocation] = useState("India");
  const [contentPreference, setContentPreference] = useState("Motivational & Relatable");
  const [tags, setTags] = useState(["Fitness", "Health", "Self Improvement"]);

  const suggestedAudience = useMemo(() => {
    const title = `${gender === "All" ? "People" : gender === "Female" ? "Women" : "Men"} ${ageGroup} in ${location}`;
    const interestText = tags.length ? tags.map((tag) => tag.toLowerCase()).join(", ") : "creator-led lifestyle content";
    return {
      title,
      description: `Interested in ${interestText} with a ${contentPreference.toLowerCase()} tone.`,
    };
  }, [ageGroup, contentPreference, gender, location, tags]);

  const toggleTag = (tag) => {
    setTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));
  };

  const confirm = () => {
    onConfirm?.({
      id: "audience-women-22-35-in",
      title: suggestedAudience.title,
      description: suggestedAudience.description,
      gender,
      ageGroup,
      location,
      interests: tags,
      contentPreference,
    });
  };

  return (
    <section className="creator-panel flex h-full w-full flex-col p-4">
      <div className="mb-4">
        <h2 className="text-base font-bold">2. Target Audience</h2>
        <p className="text-sm font-medium text-slate-400">Define or let AI suggest the best audience.</p>
      </div>
      <div className="mb-4 rounded-lg border border-purple-400/25 bg-purple-500/10 p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-purple-200">
          <Sparkles size={14} />
          AI Suggested Audience
        </div>
        <div className="flex items-start gap-3">
          <Users size={22} className="mt-1 text-purple-200" />
          <div>
            <p className="font-bold">{suggestedAudience.title || audience?.title}</p>
            <p className="mt-1 text-sm font-medium leading-6 text-slate-300">
              {suggestedAudience.description || audience?.description}
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3">
        <p className="text-xs font-medium text-slate-400">Gender</p>
        <div className="grid grid-cols-3 gap-2">
          {["Female", "Male", "All"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setGender(item)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${item === gender ? "bg-purple-600 text-white" : "creator-control text-slate-300"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <SelectField label="Age Group" value={ageGroup} options={ageGroups} onChange={setAgeGroup} />
          <SelectField label="Location" value={location} options={locations} onChange={setLocation} />
        </div>
        <div className="creator-panel-muted p-3">
          <p className="mb-2 text-xs font-medium text-slate-400">Interests</p>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const selected = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                    selected ? "bg-purple-500/20 text-purple-100" : "bg-white/5 text-slate-400"
                  }`}
                >
                  {tag} {selected && <X size={11} />}
                </button>
              );
            })}
          </div>
        </div>
        <SelectField label="Content Preference" value={contentPreference} options={preferences} onChange={setContentPreference} />
        <button type="button" onClick={confirm} className="creator-primary mt-auto w-full px-4 py-3 text-sm font-bold text-white transition">
          Confirm Audience
        </button>
      </div>
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
