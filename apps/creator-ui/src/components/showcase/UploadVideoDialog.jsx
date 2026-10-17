// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Camera, ImageUp, Loader2, Upload, X } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import { useUploadShowcaseVideoMutation } from "../../api/showcaseEndpoints.js";
import ShowcaseFields from "./ShowcaseFields.jsx";
import { errorMessage } from "./showcaseLabels.js";

const MAX_VIDEO_BYTES = 1024 * 1024 * 1024;
const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400/60";
const labelClass = "mb-1.5 block text-[10px] font-bold uppercase tracking-normal text-slate-500";

/**
 * Put a video file on the profile -- typically one that is private on YouTube, downloaded from
 * YouTube Studio (YouTube offers no way for us to fetch it). It plays from our copy in our own
 * player and shows as External. Its thumbnail is a frame picked here (captured in the browser), or
 * an image the creator uploads.
 */
export default function UploadVideoDialog({ onClose }) {
  const dispatch = useDispatch();
  const [upload, uploadState] = useUploadShowcaseVideoMutation();
  const videoRef = useRef(null);
  const [file, setFile] = useState(null);
  const [src, setSrc] = useState(null);
  const [meta, setMeta] = useState(null);
  const [at, setAt] = useState(0);
  const [poster, setPoster] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  const [title, setTitle] = useState("");
  const [fields, setFields] = useState({ industry: "FOOD_BEVERAGE", format: "PRODUCT_AD", clientLabel: "", rightsConfirmed: false });

  useEffect(() => () => src && URL.revokeObjectURL(src), [src]);
  useEffect(() => () => posterPreview && URL.revokeObjectURL(posterPreview), [posterPreview]);

  const choosePoster = (blob) => {
    setPoster(blob);
    setPosterPreview(URL.createObjectURL(blob));
  };

  const onFile = (picked) => {
    if (!picked) return;
    if (picked.size > MAX_VIDEO_BYTES) {
      dispatch(showFlash({ message: "A video can be at most 1 GB", type: "error" }));
      return;
    }
    setFile(picked);
    setSrc(URL.createObjectURL(picked));
    setMeta(null);
    setPoster(null);
    setPosterPreview(null);
    if (!title) setTitle(picked.name.replace(/\.[^.]+$/, "").slice(0, 100));
  };

  // The video is local, so its frames can be drawn and saved as the thumbnail.
  const captureFrame = () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => blob && choosePoster(blob), "image/jpeg", 0.88);
  };

  const onLoaded = () => {
    const video = videoRef.current;
    setMeta({ duration: video.duration, width: video.videoWidth, height: video.videoHeight });
    // A first guess at the thumbnail: a frame a second in, not the usual black first frame.
    const start = Math.min(1, video.duration / 2);
    video.currentTime = start;
    setAt(start);
  };

  const scrub = (seconds) => {
    setAt(seconds);
    if (videoRef.current) videoRef.current.currentTime = seconds;
  };

  const ready = file && meta && poster && title.trim() && fields.rightsConfirmed;

  const onUpload = async () => {
    const body = new FormData();
    body.append("video", file);
    body.append("poster", poster, "thumbnail.jpg");
    body.append("title", title.trim());
    body.append("durationSeconds", meta.duration.toFixed(2));
    body.append("width", String(meta.width));
    body.append("height", String(meta.height));
    body.append("industry", fields.industry);
    body.append("format", fields.format);
    body.append("clientLabel", fields.clientLabel || "");
    body.append("rightsConfirmed", "true");
    try {
      await upload(body).unwrap();
      dispatch(showFlash({ message: "On your profile — it plays in our own player", type: "success" }));
      onClose();
    } catch (e) {
      dispatch(showFlash({ message: errorMessage(e, "Could not upload this video"), type: "error" }));
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="upload-title" className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4">
      <div className="creator-panel my-8 w-full max-w-lg p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id="upload-title" className="text-base font-bold text-white">Upload a video to your profile</h3>
            <p className="mt-1 text-xs text-slate-400">
              For a video that is private on YouTube: open it in YouTube Studio, choose ⋮ → Download, and upload
              the file here. It plays in our own player and shows as External.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-white"><X size={16} /></button>
        </div>

        {!file ? (
          <label className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-white/20 px-4 py-8 text-center hover:border-purple-400/50">
            <Upload size={20} className="text-purple-300" />
            <span className="text-sm font-semibold text-white">Choose a video</span>
            <span className="text-xs text-slate-500">MP4, MOV or WebM, up to 1 GB</span>
            <input type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
        ) : (
          <div className="mt-4 space-y-3">
            <video ref={videoRef} src={src} onLoadedMetadata={onLoaded} muted playsInline preload="auto"
                   className="max-h-72 w-full rounded-lg bg-black object-contain" />
            {meta && (
              <div className="space-y-2">
                <span className={labelClass}>Thumbnail</span>
                <input type="range" min={0} max={meta.duration} step={0.04} value={at}
                       onChange={(e) => scrub(Number(e.target.value))} className="w-full accent-purple-500" aria-label="Pick a frame" />
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={captureFrame}
                          className="creator-control flex h-8 items-center gap-1.5 px-3 text-xs font-bold text-slate-100">
                    <Camera size={13} /> Use this frame ({at.toFixed(1)}s)
                  </button>
                  <label className="creator-control flex h-8 cursor-pointer items-center gap-1.5 px-3 text-xs font-bold text-slate-100">
                    <ImageUp size={13} /> Upload an image
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                           onChange={(e) => {
                             const image = e.target.files?.[0];
                             if (!image) return;
                             if (image.size > 3 * 1024 * 1024) {
                               dispatch(showFlash({ message: "A thumbnail can be at most 3 MB", type: "error" }));
                               return;
                             }
                             choosePoster(image);
                           }} />
                  </label>
                  {posterPreview
                    ? <img src={posterPreview} alt="Chosen thumbnail" className="h-12 rounded border border-emerald-400/40 object-cover" />
                    : <span className="text-[11px] text-amber-200/90">Pick a thumbnail to continue.</span>}
                </div>
              </div>
            )}
            <button type="button" onClick={() => { setFile(null); setSrc(null); setMeta(null); setPoster(null); setPosterPreview(null); }}
                    className="text-[11px] font-semibold text-slate-400 underline hover:text-slate-200">Choose another video</button>
          </div>
        )}

        <label className="mt-4 block">
          <span className={labelClass}>Title</span>
          <input value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} placeholder="Diwali campaign film" className={inputClass} />
        </label>
        <ShowcaseFields value={fields} onChange={setFields} />

        <div className="mt-5 flex items-center justify-end gap-2">
          {uploadState.isLoading && <span className="mr-auto text-[11px] text-slate-400">Uploading — keep this tab open.</span>}
          <button type="button" onClick={onClose} className="creator-control h-9 px-4 text-xs font-bold text-slate-200">Cancel</button>
          <button type="button" onClick={onUpload} disabled={!ready || uploadState.isLoading}
                  className="creator-primary flex h-9 items-center gap-2 px-4 text-xs font-black text-white disabled:opacity-50">
            {uploadState.isLoading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} Put on my profile
          </button>
        </div>
      </div>
    </div>
  );
}
