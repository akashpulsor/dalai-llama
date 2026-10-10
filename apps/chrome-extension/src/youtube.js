// Pure helpers, shared by the popup and its tests.

/** The YouTube video id in a watch, shorts or youtu.be URL; null for anything else. */
export function videoIdFrom(url) {
  try {
    const u = new URL(url);
    let id = null;
    if (u.hostname === "youtu.be") id = u.pathname.slice(1, 12);
    else if (/(^|\.)youtube\.com$/.test(u.hostname)) {
      if (u.pathname === "/watch") id = u.searchParams.get("v");
      else id = (u.pathname.match(/^\/shorts\/([A-Za-z0-9_-]{11})/) || [])[1] || null;
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** Only our web app may pair, and only with a token of the shape the backend mints. */
export function isValidPairing(origin, message, allowedOrigins) {
  return allowedOrigins.includes(origin)
    && message?.type === "DALAI_PAIR"
    && typeof message.token === "string"
    && /^dlx_[A-Za-z0-9_-]{40,80}$/.test(message.token);
}
