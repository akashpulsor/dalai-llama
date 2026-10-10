// Display labels for the showcase codes (same codes as creator-ui's showcaseLabels.js; the
// backend owns the codes, each app owns how they read).

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

export const INDUSTRY_LABEL = Object.fromEntries(INDUSTRIES);
export const FORMAT_LABEL = Object.fromEntries(FORMATS);
