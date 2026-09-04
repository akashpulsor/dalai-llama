// @ts-nocheck
import React, { useState } from "react";
import { Loader2, Upload, User, X } from "lucide-react";

export default function CastReferenceUploadModal({ character, isUploading = false, error = "", onUpload, onClose }) {
  const [localPreviewUrl, setLocalPreviewUrl] = useState("");
  const [localError, setLocalError] = useState("");

  if (!character) return null;

  const displayName = character.castDisplayName || character.characterName;
  const previewSrc = localPreviewUrl || character.referenceImageUrl || "";
  const errorMessage = localError || error;

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!String(file.type || "").startsWith("image/")) {
      setLocalError("Upload a JPG, PNG, WebP, AVIF, or GIF image.");
      return;
    }
    setLocalError("");
    setLocalPreviewUrl(URL.createObjectURL(file));
    await onUpload?.(file);
  };

  const handleClose = () => {
    if (isUploading) return;
    setLocalPreviewUrl("");
    setLocalError("");
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="creator-panel w-full max-w-md p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-200">Cast reference</p>
            <h3 className="mt-1 text-lg font-bold text-white">{displayName}</h3>
            <p className="mt-1 text-sm font-medium text-slate-400">
              Upload a clear face photo. This becomes the identity reference used for this character in video generation.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="creator-control flex h-9 w-9 shrink-0 items-center justify-center disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/30">
            {previewSrc ? (
              <img src={previewSrc} alt={`${displayName} reference`} className="h-full w-full object-cover" />
            ) : (
              <User size={32} className="text-slate-500" />
            )}
          </div>

          {errorMessage && (
            <p className="w-full rounded-md border border-rose-300/25 bg-rose-400/10 px-3 py-2 text-center text-xs font-semibold text-rose-100">
              {errorMessage}
            </p>
          )}

          <label
            className={`creator-primary flex w-full cursor-pointer items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white ${
              isUploading ? "pointer-events-none opacity-60" : ""
            }`}
          >
            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {isUploading ? "Uploading..." : previewSrc ? "Replace photo" : "Upload photo"}
            <input type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={handleFileChange} />
          </label>

          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="creator-control w-full px-4 py-2.5 text-sm font-bold text-slate-200 disabled:opacity-50"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
