# Dalai Llama Chrome extension (Manifest V3)

Contract: `dallai-llama-backend/docs/lead-management/CREATOR_SHOWCASE.md`, rules 38–40.

What it does, from the toolbar:
- **This YouTube video → my profile.** On one of your own videos on youtube.com, add it to your
  Dalai Llama portfolio (it must be on your verified/connected channel).
- **Publish a film.** Pick one of your finished Dalai Llama films and publish it to your connected
  YouTube channel. Public needs an explicit "I understand this will be public" tick, and only films
  whose client agreed to marketing use can be unlisted or public (same rules as the web app).
- **Status.** The latest publishing jobs with upload progress.

## Install (development)

1. `chrome://extensions` → Developer mode → **Load unpacked** → this folder (`apps/chrome-extension`).
2. The manifest `key` pins the ID to `boldkceiciomdbmfffhjdgeloepjgeom`, which creator-ui needs
   (`DALAI_EXTENSION_ID`) to talk to it.
3. In Dalai Llama: Marketing → YouTube → **Connect the extension in this browser**.

## Security model

- **No content scripts.** The popup reads only the active tab's URL, and only when you click the
  toolbar button (`activeTab`).
- **Pairing** comes only from the web app: `externally_connectable` limits who can message the
  extension, and the service worker re-checks the sender's origin and the token's shape.
- The pairing token is a scoped, revocable Dalai Llama token (30 days; only `/api/v1/extension/**`),
  kept in `chrome.storage.session` and used only by the service worker. The popup asks the worker
  for a fixed list of calls; it never sees the token.
- **Google/YouTube tokens never reach the extension.** The backend keeps them encrypted.
- No automation of YouTube or Google pages, no CAPTCHA handling.

## Tests

`node --test test/youtube.test.mjs` (pure helpers: URL parsing, pairing checks).

## Chrome Web Store

Before uploading, remove `key` and `http://localhost:5173/*` from `manifest.json`; the store
assigns the ID, which then goes into creator-ui's `DALAI_EXTENSION_ID`. Publishing to the store
needs a developer account and review (yours to do).
