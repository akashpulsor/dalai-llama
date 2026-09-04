// @ts-nocheck
// Local, browser-only thumbnail generation via a hidden <video> + <canvas>.
// Swap this implementation for a `POST /generate-thumbnails` call later without
// touching any UI component — everything here talks to Timeline through this function.
export async function generateThumbnails({ file, duration, count = 24, onProgress, isCancelled } = {}) {
  if (!file || !duration) return [];

  const url = URL.createObjectURL(file);
  const videoEl = document.createElement("video");
  videoEl.preload = "auto";
  videoEl.muted = true;
  videoEl.playsInline = true;
  videoEl.src = url;

  try {
    await new Promise((resolve, reject) => {
      videoEl.onloadeddata = resolve;
      videoEl.onerror = () => reject(new Error("Could not decode video for thumbnails."));
    });

    const canvas = document.createElement("canvas");
    const aspect = (videoEl.videoWidth || 16) / (videoEl.videoHeight || 9);
    canvas.height = 90;
    canvas.width = Math.max(Math.round(canvas.height * aspect), 40);
    const ctx = canvas.getContext("2d");

    const items = [];
    const step = duration / count;

    for (let i = 0; i < count; i += 1) {
      if (isCancelled?.()) break;
      const time = Math.min(Math.max(i * step, 0), Math.max(duration - 0.05, 0));
      // eslint-disable-next-line no-await-in-loop
      await seekTo(videoEl, time);
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      items.push({ time, url: canvas.toDataURL("image/jpeg", 0.6) });
      onProgress?.((i + 1) / count);
    }

    return items;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function seekTo(videoEl, time) {
  return new Promise((resolve) => {
    const handleSeeked = () => {
      videoEl.removeEventListener("seeked", handleSeeked);
      resolve();
    };
    videoEl.addEventListener("seeked", handleSeeked);
    videoEl.currentTime = time;
  });
}
