// Display labels for the codes the showcase API uses. The backend owns the codes
// (ShowcaseIndustry / ShowcaseFormat); the UI owns how they read.

export const INDUSTRIES = [
  ["FASHION", "Fashion"],
  ["BEAUTY", "Beauty"],
  ["FOOD_BEVERAGE", "Food & beverage"],
  ["TECH", "Tech"],
  ["FINANCE", "Finance"],
  ["REAL_ESTATE", "Real estate"],
  ["EDUCATION", "Education"],
  ["HEALTH", "Health"],
  ["TRAVEL", "Travel"],
  ["AUTOMOTIVE", "Automotive"],
  ["ECOMMERCE", "E-commerce"],
  ["ENTERTAINMENT", "Entertainment"],
  ["OTHER", "Other"],
];

export const FORMATS = [
  ["PRODUCT_AD", "Product ad"],
  ["UGC", "UGC"],
  ["EXPLAINER", "Explainer"],
  ["BRAND_FILM", "Brand film"],
  ["SOCIAL_SHORT", "Social short"],
];

const toMap = (pairs) => Object.fromEntries(pairs);
export const INDUSTRY_LABEL = toMap(INDUSTRIES);
export const FORMAT_LABEL = toMap(FORMATS);

export const INELIGIBLE_REASON = {
  UNAVAILABLE: "No longer on YouTube",
  NOT_PUBLIC: "Not public on YouTube",
  EMBEDDING_OFF: "Embedding is turned off",
  AGE_RESTRICTED: "Age-restricted",
  MADE_FOR_KIDS: "Made for kids",
  TOO_SHORT: "Too short",
  TOO_LONG: "Too long",
};

export const CHECKLIST_LABEL = {
  YOUTUBE_CHANNEL: "Link and verify your YouTube channel",
  SHOWCASE_PICKS: "Pick at least 2 videos for your profile",
  AVATAR: "Add a profile picture",
  HEADLINE: "Write a one-line headline",
  INDUSTRY: "Choose the industries you work in",
};

export const LEVEL_LABEL = {
  L0: "Not shown yet",
  L1: "Starter",
  L2: "Maker",
  L3: "Proven",
  L4: "Star",
};

/** Pulls a readable message out of an RTK Query error. */
export function errorMessage(error, fallback) {
  return error?.data?.message || error?.data?.error || fallback;
}
