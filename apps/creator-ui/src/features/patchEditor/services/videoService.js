// @ts-nocheck
// All real media work for the patch editor is funneled through this module.
// Today it runs entirely in the browser via ffmpeg.wasm. Later, a backend can
// expose POST /extract, /replace, /render, /export and this file is the only
// place that needs to change — UI components never call ffmpeg directly.
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const FFMPEG_CORE_VERSION = "0.12.10";
const FFMPEG_CORE_BASE_URL = `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm`;

let ffmpegInstance = null;
let loadPromise = null;
let opCounter = 0;

async function getFFmpeg() {
  if (!ffmpegInstance) ffmpegInstance = new FFmpeg();
  if (!loadPromise) {
    loadPromise = (async () => {
      const coreURL = await toBlobURL(`${FFMPEG_CORE_BASE_URL}/ffmpeg-core.js`, "text/javascript");
      const wasmURL = await toBlobURL(`${FFMPEG_CORE_BASE_URL}/ffmpeg-core.wasm`, "application/wasm");
      await ffmpegInstance.load({ coreURL, wasmURL });
      return ffmpegInstance;
    })().catch((error) => {
      loadPromise = null;
      throw error;
    });
  }
  return loadPromise;
}

// `source` is either a local File/Blob or a remote URL string (e.g. a backend
// AI-edit result) — remote URLs are used as-is instead of wrapped in an object URL.
export function probeMetadata(source) {
  return new Promise((resolve, reject) => {
    const isRemote = typeof source === "string";
    const url = isRemote ? source : URL.createObjectURL(source);
    const videoEl = document.createElement("video");
    videoEl.preload = "metadata";
    videoEl.crossOrigin = "anonymous";
    videoEl.onloadedmetadata = () => {
      const metadata = { duration: videoEl.duration, width: videoEl.videoWidth, height: videoEl.videoHeight };
      if (!isRemote) URL.revokeObjectURL(url);
      resolve(metadata);
    };
    videoEl.onerror = () => {
      if (!isRemote) URL.revokeObjectURL(url);
      reject(new Error("Could not read this video. Try a different file or format (MP4/WebM recommended)."));
    };
    videoEl.src = url;
  });
}

export async function extractClip({ file, start, end, onProgress } = {}) {
  const ffmpeg = await getFFmpeg();
  const opId = `extract${opCounter++}`;
  const inputName = `${opId}-in.${extensionOf(file.name)}`;
  const outputName = `${opId}-out.mp4`;
  const handleProgress = ({ progress }) => onProgress?.(clampProgress(progress));

  ffmpeg.on("progress", handleProgress);
  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    const duration = Math.max(end - start, 0.05);
    await ffmpeg.exec([
      "-ss", String(start),
      "-i", inputName,
      "-t", String(duration),
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "16",
      "-c:a", "aac",
      "-b:a", "192k",
      "-movflags", "+faststart",
      outputName,
    ]);
    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data.buffer], { type: "video/mp4" });
    return {
      blob,
      url: URL.createObjectURL(blob),
      filename: `${baseNameOf(file.name)}-clip-${forFilename(start)}-${forFilename(end)}.mp4`,
    };
  } finally {
    ffmpeg.off("progress", handleProgress);
    await safeDelete(ffmpeg, inputName);
    await safeDelete(ffmpeg, outputName);
  }
}

export async function exportVideo({ file, duration, segments, onProgress } = {}) {
  if (!segments?.length) throw new Error("Nothing to export.");
  const ffmpeg = await getFFmpeg();
  const opId = `export${opCounter++}`;
  const inputName = `${opId}-source.${extensionOf(file.name)}`;
  const partNames = [];
  let completedParts = 0;
  const handleProgress = ({ progress }) => {
    onProgress?.(clampProgress((completedParts + clampProgress(progress)) / segments.length));
  };

  ffmpeg.on("progress", handleProgress);
  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index];
      const partName = `${opId}-part${index}.mp4`;

      if (segment.kind === "original") {
        const segmentDuration = Math.max(segment.sourceEnd - segment.sourceStart, 0.05);
        // eslint-disable-next-line no-await-in-loop
        await ffmpeg.exec([
          "-ss", String(segment.sourceStart),
          "-i", inputName,
          "-t", String(segmentDuration),
          "-c:v", "libx264", "-preset", "fast", "-crf", "18",
          "-c:a", "aac", "-b:a", "192k", "-r", "30",
          partName,
        ]);
      } else {
        const replacementName = `${opId}-part${index}-src.${extensionOf(segment.name || "clip.mp4")}`;
        // eslint-disable-next-line no-await-in-loop
        await ffmpeg.writeFile(replacementName, await fetchFile(segment.url));
        // eslint-disable-next-line no-await-in-loop
        await ffmpeg.exec([
          "-i", replacementName,
          "-c:v", "libx264", "-preset", "fast", "-crf", "18",
          "-c:a", "aac", "-b:a", "192k", "-r", "30",
          partName,
        ]);
        // eslint-disable-next-line no-await-in-loop
        await safeDelete(ffmpeg, replacementName);
      }

      partNames.push(partName);
      completedParts = index + 1;
    }

    const listName = `${opId}-list.txt`;
    const listContent = partNames.map((name) => `file '${name}'`).join("\n");
    await ffmpeg.writeFile(listName, new TextEncoder().encode(listContent));

    const outputName = `${opId}-final.mp4`;
    await ffmpeg.exec(["-f", "concat", "-safe", "0", "-i", listName, "-c", "copy", outputName]);

    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data.buffer], { type: "video/mp4" });
    return { blob, url: URL.createObjectURL(blob), filename: `${baseNameOf(file.name)}-patched.mp4` };
  } finally {
    ffmpeg.off("progress", handleProgress);
    await safeDelete(ffmpeg, inputName);
    await safeDelete(ffmpeg, `${opId}-list.txt`);
    for (const name of partNames) {
      // eslint-disable-next-line no-await-in-loop
      await safeDelete(ffmpeg, name);
    }
  }
}

async function safeDelete(ffmpeg, name) {
  try {
    await ffmpeg.deleteFile(name);
  } catch {
    // best effort cleanup of the in-memory virtual FS
  }
}

function clampProgress(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, 0), 1);
}

function extensionOf(filename = "") {
  const match = /\.([a-zA-Z0-9]+)$/.exec(filename);
  return match ? match[1] : "mp4";
}

function baseNameOf(filename = "clip") {
  return filename.replace(/\.[a-zA-Z0-9]+$/, "").replace(/[^a-zA-Z0-9-_]+/g, "-") || "clip";
}

function forFilename(seconds = 0) {
  return seconds.toFixed(2).replace(".", "-");
}
