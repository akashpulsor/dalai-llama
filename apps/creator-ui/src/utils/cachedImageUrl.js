import React from "react";

/** MinIO signed URLs carry a fresh signature/expiry query string every time the backend re-signs
 * them (e.g. RTK Query refetching the shot-images list after cache eviction) even when the
 * underlying object hasn't changed. That defeats the browser's HTTP cache -- a URL that only
 * differs by query string is a different cache key, so the same bytes get downloaded again on
 * every re-open. Stripping the query string gives a stable identity for "which object is this",
 * so repeat opens can be served from a local blob instead of re-fetching. */
function objectPath(url) {
  if (!url) return null;
  const queryIndex = url.indexOf("?");
  return queryIndex === -1 ? url : url.slice(0, queryIndex);
}

const blobEntries = new Map(); // objectPath -> { blobUrl, refCount }
const inFlight = new Map(); // objectPath -> Promise<string> (resolves to blobUrl)
const slotPath = new Map(); // slotKey -> objectPath currently held by that slot

function retain(path) {
  const entry = blobEntries.get(path);
  if (entry) entry.refCount += 1;
}

/** Drops one slot's hold on `path`; once nothing references it, revokes the blob so it doesn't
 * sit in the heap forever -- this is the "invalidate to prevent leakage" half of the cache. */
function release(path) {
  const entry = blobEntries.get(path);
  if (!entry) return;
  entry.refCount -= 1;
  if (entry.refCount <= 0) {
    URL.revokeObjectURL(entry.blobUrl);
    blobEntries.delete(path);
  }
}

/** Fetches `sourceUrl` at most once per `path`, even if several components ask for it while the
 * first fetch is still in flight. Caller already holds one ref via the pre-registered entry. */
function loadBlobUrl(path, sourceUrl) {
  const pending = inFlight.get(path);
  if (pending) return pending;

  const promise = fetch(sourceUrl)
    .then((response) => {
      if (!response.ok) throw new Error(`Image fetch failed: HTTP ${response.status}`);
      return response.blob();
    })
    .then((blob) => {
      const blobUrl = URL.createObjectURL(blob);
      // Preserve refs accumulated by every slot that called retain() while this fetch was
      // pending -- overwriting refCount here would let the next unmount revoke a blob that's
      // still displayed by another slot.
      const pendingRefCount = blobEntries.get(path)?.refCount ?? 0;
      blobEntries.set(path, { blobUrl, refCount: pendingRefCount });
      return blobUrl;
    })
    .finally(() => {
      inFlight.delete(path);
    });

  inFlight.set(path, promise);
  return promise;
}

/** Keyed by a stable "slot" (e.g. `${shotId}:${kind}`) rather than the signed URL itself, so
 * swapping in a genuinely new image (a new object path) releases the old blob instead of leaking
 * it, while re-signs of the same object path are served from cache with no network call. */
export function useCachedImageUrl(slotKey, signedUrl) {
  const path = objectPath(signedUrl);
  const [blobUrl, setBlobUrl] = React.useState(() => (path && blobEntries.get(path)?.blobUrl) || null);

  React.useEffect(() => {
    if (!slotKey || !path) {
      setBlobUrl(null);
      return undefined;
    }

    let cancelled = false;
    const previousPath = slotPath.get(slotKey);
    if (previousPath && previousPath !== path) release(previousPath);
    slotPath.set(slotKey, path);

    const cached = blobEntries.get(path);
    if (cached && cached.blobUrl) {
      retain(path);
      setBlobUrl(cached.blobUrl);
    } else {
      // Either nobody's fetching this path yet, or another slot's fetch is still in flight --
      // either way, reserve/share one ref and (re)use loadBlobUrl's own dedupe for the fetch.
      if (!cached) blobEntries.set(path, { blobUrl: null, refCount: 0 });
      retain(path);
      loadBlobUrl(path, signedUrl)
        .then((url) => {
          if (!cancelled) setBlobUrl(url);
        })
        .catch(() => {
          // Don't release here -- the effect cleanup below always releases exactly once for
          // this mount's retain(); releasing again here would double-count it and could revoke
          // a blob a still-mounted consumer of the same path is displaying. The entry just stays
          // un-cached (blobUrl: null) until every retaining slot unmounts and it's cleared.
          if (!cancelled) setBlobUrl(signedUrl); // fall back to the signed URL directly
        });
    }

    return () => {
      cancelled = true;
      release(path);
      if (slotPath.get(slotKey) === path) slotPath.delete(slotKey);
    };
  }, [slotKey, path, signedUrl]);

  return blobUrl || signedUrl || null;
}
