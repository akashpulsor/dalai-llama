// Display labels for outreach codes (the backend owns the codes; CREATOR_SHOWCASE.md rules 23-27).

export const LAYOUTS = [
  ["SHOWCASE_WORK", "One film"],
  ["SIMILAR_BRAND_WORK", "One film, for the brand's industry"],
  ["CREATOR_PORTFOLIO", "Up to three films + profile"],
];

export const LAYOUT_LABEL = Object.fromEntries(LAYOUTS);

export const CONTACT_STATUS = {
  VERIFIED: ["Verified", "bg-emerald-500/15 text-emerald-300"],
  LIKELY_VALID: ["Valid", "bg-sky-500/15 text-sky-300"],
  UNVERIFIED: ["Not checked yet", "bg-white/10 text-slate-300"],
};

export const PLACEHOLDERS = "{film} first film's title · {creator} your name · {industry} the film's industry · {name} the brand contact's name";
