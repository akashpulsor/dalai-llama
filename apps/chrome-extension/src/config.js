// Dalai Llama Chrome extension settings. Change these together with manifest.json
// (host_permissions, externally_connectable) when pointing at another environment.

/** The only API the extension talks to (rule 39). */
export const API_BASE = "https://api.dalaillama.in/api/v1/extension";

/** The web app that pairs the extension. Pairing messages from any other origin are ignored. */
export const APP_URL = "https://creator.dalaillama.in";
export const ALLOWED_PAIRING_ORIGINS = ["https://creator.dalaillama.in", "http://localhost:5173"];

/** Paths the popup may ask the service worker to call; anything else is refused. */
export const ALLOWED_CALLS = [
  ["GET", "/me"],
  ["POST", "/portfolio/import"],
  ["GET", "/films"],
  ["POST", "/publish"],
  ["GET", "/publish-jobs"],
];
