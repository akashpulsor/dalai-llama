// @ts-nocheck
export function clamp(value, min, max) {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

export function formatTimecode(seconds = 0, fps = 30) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(seconds, 0) : 0;
  const totalFrames = Math.round(safeSeconds * fps);
  const hh = Math.floor(totalFrames / (fps * 3600));
  const mm = Math.floor((totalFrames / (fps * 60)) % 60);
  const ss = Math.floor((totalFrames / fps) % 60);
  const ff = Math.floor(totalFrames % fps);
  const pad = (value) => String(value).padStart(2, "0");
  return hh > 0 ? `${pad(hh)}:${pad(mm)}:${pad(ss)}:${pad(ff)}` : `${pad(mm)}:${pad(ss)}:${pad(ff)}`;
}

export function formatDuration(seconds = 0) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(seconds, 0) : 0;
  const mm = Math.floor(safeSeconds / 60);
  const ss = (safeSeconds % 60).toFixed(2);
  return `${String(mm).padStart(2, "0")}:${ss.padStart(5, "0")}`;
}

export function formatBytes(bytes = 0) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}
