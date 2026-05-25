// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles, Users, X } from "lucide-react";

const allTags = ["Fitness", "Health", "Self Improvement", "Confidence", "Beginner Gym", "Weight Loss", "Lifestyle", "Family", "Comedy"];
const ageGroups = ["18 - 24", "22 - 35", "30 - 45", "All Ages"];
const locations = ["India", "US", "UK", "UAE"];
const preferences = ["Motivational & Relatable", "Funny & Honest", "Educational", "Before / After", "Insightful & Practical"];

export default function AudienceForm({
  audience,
  idea,
  trend,
  storyScript,
  screenplay,
  castPlan,
  onAskAi,
  onConfirm,
  isSuggesting = false,
  isSaving = false,
}) {
  const aiAudience = useMemo(() => buildAiAudience({ audience, idea, trend }), [audience, idea, trend]);
  const normalizedAudience = useMemo(() => normalizeAudienceInput({
    ...aiAudience,
    ...(audience || {}),
    demographics: { ...(aiAudience.demographics || {}), ...(audience?.demographics || {}) },
    psychographics: { ...(aiAudience.psychographics || {}), ...(audience?.psychographics || {}) },
  }), [audience, aiAudience]);
  const [audienceId, setAudienceId] = useState(normalizedAudience.id);
  const [audienceTitle, setAudienceTitle] = useState(normalizedAudience.title);
  const [gender, setGender] = useState("Female");
  const [ageGroup, setAgeGroup] = useState("22 - 35");
  const [location, setLocation] = useState("India");
  const [contentPreference, setContentPreference] = useState("Motivational & Relatable");
  const [tags, setTags] = useState(["Fitness", "Health", "Self Improvement"]);
  const [description, setDescription] = useState(normalizedAudience.description);
  const [brandTone, setBrandTone] = useState(normalizedAudience.brandContext?.brandTone || "");
  const [brandRestrictions, setBrandRestrictions] = useState(textList(normalizedAudience.brandContext?.restrictions).join(", "));

  useEffect(() => {
    setAudienceId(normalizedAudience.id);
    setAudienceTitle(normalizedAudience.title);
    setGender(normalizedAudience.gender);
    setAgeGroup(normalizedAudience.ageGroup);
    setLocation(normalizedAudience.location);
    setContentPreference(normalizedAudience.contentPreference);
    setTags(normalizedAudience.interests);
    setDescription(normalizedAudience.description);
    setBrandTone(normalizedAudience.brandContext?.brandTone || "");
    setBrandRestrictions(textList(normalizedAudience.brandContext?.restrictions).join(", "));
  }, [normalizedAudience.id]);

  const suggestedAudience = useMemo(() => {
    const generatedTitle = `${gender === "All" ? "People" : gender === "Female" ? "Women" : "Men"} ${ageGroup} in ${location}`;
    const interestText = tags.length ? tags.map((tag) => tag.toLowerCase()).join(", ") : "creator-led lifestyle content";
    return {
      title: audienceTitle || generatedTitle,
      description: description || `Interested in ${interestText} with a ${contentPreference.toLowerCase()} tone.`,
    };
  }, [ageGroup, audienceTitle, contentPreference, description, gender, location, tags]);

  const toggleTag = (tag) => {
    setTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));
  };

  const askAiToDecide = async () => {
    const result = await onAskAi?.({
      id: audienceId,
      title: suggestedAudience.title,
      description: suggestedAudience.description,
      gender,
      ageGroup,
      location,
      interests: tags,
      contentPreference,
      storyScript,
      screenplay,
      castPlan,
      brandContext: {
        brandTone,
        restrictions: textList(brandRestrictions),
      },
    });
    if (!result) return;
    const nextAudience = normalizeAudienceInput(result);
    setAudienceId(nextAudience.id);
    setAudienceTitle(nextAudience.title);
    setGender(nextAudience.gender);
    setAgeGroup(nextAudience.ageGroup);
    setLocation(nextAudience.location);
    setContentPreference(nextAudience.contentPreference);
    setTags(nextAudience.interests);
    setDescription(nextAudience.description);
  };

  const confirm = () => {
    onConfirm?.({
      id: audienceId,
      title: suggestedAudience.title,
      description: suggestedAudience.description,
      gender,
      ageGroup,
      location,
      interests: tags,
      contentPreference,
      brandContext: {
        brandTone,
        restrictions: textList(brandRestrictions),
      },
    });
  };

  return (
    <section className="creator-panel flex h-full w-full flex-col p-4">
      <div className="mb-4">
        <h2 className="text-base font-bold">5. Target Audience</h2>
        <p className="text-sm font-medium text-slate-400">Decide manually, or ask AI to choose from the script, screenplay, cast, and future brand context.</p>
      </div>
      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-lg border border-purple-400/25 bg-purple-500/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-purple-200">
            {idea?.id ? <Sparkles size={14} /> : <Loader2 size={14} className="animate-spin" />}
            {audience?.aiSuggested ? "AI Decided Audience" : idea?.id ? "Editable Audience Decision" : "Waiting for Creative Brief"}
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
          <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3">
            <p className="text-xs font-bold uppercase text-slate-500">Based on brief</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-white">{idea?.title || "Select or write an idea first"}</p>
            <p className="mt-1 line-clamp-4 text-sm font-medium leading-6 text-slate-400">{storyScript?.projectTitle || screenplay?.projectTitle || idea?.description || trend?.summary || "AI audience suggestions appear here once the creative brief is selected."}</p>
          </div>
          <button
            type="button"
            onClick={askAiToDecide}
            disabled={!onAskAi || isSuggesting}
            className="creator-primary mt-4 inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {isSuggesting ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            Ask AI To Decide Audience
          </button>
        </div>

        <div className="flex min-h-0 flex-col gap-3">
          <label className="creator-panel-muted block p-3">
            <span className="text-xs font-medium text-slate-400">Audience Segment</span>
            <input
              value={audienceTitle}
              onChange={(event) => setAudienceTitle(event.target.value)}
              className="mt-1 block w-full bg-transparent text-sm font-semibold text-white outline-none"
            />
          </label>
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
          <label className="creator-panel-muted block p-3">
            <span className="text-xs font-medium text-slate-400">Audience Reasoning</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="mt-2 block w-full resize-none bg-transparent text-sm font-semibold leading-6 text-white outline-none"
            />
          </label>
          <SelectField label="Content Preference" value={contentPreference} options={preferences} onChange={setContentPreference} />
          <div className="grid gap-2 md:grid-cols-2">
            <label className="creator-panel-muted block p-3">
              <span className="text-xs font-medium text-slate-400">Brand Tone</span>
              <input
                value={brandTone}
                onChange={(event) => setBrandTone(event.target.value)}
                placeholder="Optional, e.g. witty, premium, family-safe"
                className="mt-1 block w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-600"
              />
            </label>
            <label className="creator-panel-muted block p-3">
              <span className="text-xs font-medium text-slate-400">Brand Restrictions</span>
              <input
                value={brandRestrictions}
                onChange={(event) => setBrandRestrictions(event.target.value)}
                placeholder="Optional comma-separated guardrails"
                className="mt-1 block w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-600"
              />
            </label>
          </div>
          <button type="button" onClick={confirm} disabled={isSaving} className="creator-primary mt-auto w-full px-4 py-3 text-sm font-bold text-white transition disabled:opacity-50">
            {isSaving ? "Saving Audience..." : "Lock Audience and Brand"}
          </button>
        </div>
      </div>
    </section>
  );
}

function normalizeAudienceInput(audience = {}) {
  const demographics = audience.demographics || {};
  return {
    id: audience.id || `audience-ai-${Date.now()}`,
    gender: audience.gender || demographics.gender || "Female",
    ageGroup: audience.ageGroup || demographics.ageGroup || "22 - 35",
    location: audience.location || demographics.location || "India",
    interests: audience.interests?.length ? audience.interests : ["Fitness", "Health", "Self Improvement"],
    contentPreference: audience.contentPreference || "Motivational & Relatable",
    title: audience.title || "Women 22 - 35 in India",
    description: audience.description || audience.psychographics?.description || "Interested in fitness, confidence, habit change, and relatable creator-led stories.",
    aiSuggested: audience.aiSuggested,
    brandContext: audience.brandContext || audience.psychographics?.brandContext || {},
  };
}

function textList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
}

function buildAiAudience({ audience, idea, trend }) {
  const ideaText = `${idea?.title || ""} ${idea?.description || ""} ${trend?.title || ""}`.toLowerCase();
  const isFamilyComedy = /wife|saas|bahu|family|couple|married|neighbor/.test(ideaText);
  const isStudy = /study|exam|student|late night|focus/.test(ideaText);
  const isFood = /food|meal|protein|recipe|kitchen|lunch|dinner/.test(ideaText);
  const isBeauty = /skin|beauty|glow|routine|makeup/.test(ideaText);

  if (isFamilyComedy) {
    return {
      id: `audience-ai-${idea?.id || "pending"}`,
      gender: "All",
      ageGroup: "22 - 35",
      location: "India",
      interests: ["Lifestyle", "Family", "Comedy"].filter((tag) => allTags.includes(tag)).length ? ["Lifestyle", "Family", "Comedy"] : ["Self Improvement", "Confidence"],
      contentPreference: "Funny & Honest",
      title: "Young Indian couples and family-content viewers",
      description: "Interested in relatable household moments, reaction humor, and simple character-driven short scenes.",
    };
  }

  if (isStudy) {
    return {
      id: `audience-ai-${idea?.id || "pending"}`,
      gender: "All",
      ageGroup: "18 - 24",
      location: "India",
      interests: ["Self Improvement", "Confidence"],
      contentPreference: "Educational",
      title: "Students 18 - 24 in India",
      description: "Interested in focus, routines, study motivation, and realistic productivity content.",
    };
  }

  if (isFood) {
    return {
      id: `audience-ai-${idea?.id || "pending"}`,
      gender: "All",
      ageGroup: "22 - 35",
      location: "India",
      interests: ["Health", "Fitness"],
      contentPreference: "Educational",
      title: "Health-aware food viewers in India",
      description: "Interested in practical meals, protein, kitchen shortcuts, and saveable recipe formats.",
    };
  }

  if (isBeauty) {
    return {
      id: `audience-ai-${idea?.id || "pending"}`,
      gender: "Female",
      ageGroup: "18 - 24",
      location: "India",
      interests: ["Health", "Confidence"],
      contentPreference: "Before / After",
      title: "Beauty routine viewers 18 - 24 in India",
      description: "Interested in real routines, visible results, and low-effort creator-led glow-up stories.",
    };
  }

  return {
    id: `audience-ai-${idea?.id || audience?.id || "pending"}`,
    gender: "Female",
    ageGroup: "22 - 35",
    location: "India",
    interests: ["Fitness", "Health", "Self Improvement"],
    contentPreference: "Motivational & Relatable",
    title: audience?.title || "Women 22 - 35 in India",
    description: audience?.description || "Interested in fitness, weight loss, confidence building and self improvement.",
  };
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
