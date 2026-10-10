// @ts-nocheck
// Public (no-login) Creator Showcase calls to tenant-service. Plain fetch: these pages have no
// session, and keeping them off the shared RTK store means a public visitor never loads it.
import { appConfig } from "@dalaillama/shared-config";

const base = () => `${appConfig.API_BASE_URL}/public`;

async function getJson(path) {
  const response = await fetch(`${base()}${path}`, { headers: { Accept: "application/json" } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}

async function post(path, body) {
  const response = await fetch(`${base()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Visitor-Id": visitorId() },
    body: JSON.stringify(body ?? {}),
  });
  if (!response.ok && response.status !== 204 && response.status !== 202) {
    throw new Error(`Request failed (${response.status})`);
  }
}

export const getLanding = () => getJson("/showcase/landing");

export const getFeed = ({ tab = "TOP", industry, format, page = 0 }) => {
  const params = new URLSearchParams({ tab, page: String(page) });
  if (industry) params.set("industry", industry);
  if (format) params.set("format", format);
  return getJson(`/showcase?${params}`);
};

/** Null for an unknown, suspended or hidden creator. A handle the creator changed comes back
 * (through the server's 301) as the profile under its new handle. */
export const getCreator = (handle) => getJson(`/creators/${encodeURIComponent(handle)}`);

export const getSelfSource = (publicId) => getJson(`/showcase/${encodeURIComponent(publicId)}/source`);

export const recordPlay = (publicId, completed) =>
  post(`/showcase/${encodeURIComponent(publicId)}/plays`, { completed }).catch(() => {});

export const reportVideo = (publicId, reason, note) =>
  post(`/showcase/${encodeURIComponent(publicId)}/reports`, { reason, note: note || null });

const VISITOR_KEY = "dl_visitor_id";

/** A random id kept in this browser so one visitor's reloads don't count twice. It identifies
 * nobody. If storage is blocked, a per-page id still works (counts may be a little high). */
export function visitorId() {
  try {
    let id = window.localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    if (!window.__dlVisitorId) window.__dlVisitorId = crypto.randomUUID();
    return window.__dlVisitorId;
  }
}
