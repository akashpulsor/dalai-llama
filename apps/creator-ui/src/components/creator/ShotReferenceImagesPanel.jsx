// @ts-nocheck
import React, { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Trash2, Upload } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useDeleteShotReferenceImageMutation,
  useListShotReferenceImagesQuery,
  useUploadShotReferenceImagesMutation,
} from "../../api/creatorEndpoints.js";

/**
 * Multi-image reference bundle uploader for a shot the creator flagged (see the screenplay
 * needs-multi-image checkbox). Rendered only when {@code shot.needsMultiImage} is true. Each row
 * carries an optional caption the video-generation prompt will use to reference the image; the
 * captions are creator-set at upload time. Delete-per-image supported.
 */
export default function ShotReferenceImagesPanel({ shot }) {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [captionDrafts, setCaptionDrafts] = useState({});

  const { data: images = [] } = useListShotReferenceImagesQuery(shot.id, { skip: !shot?.id });
  const [uploadImages, { isLoading: uploading }] = useUploadShotReferenceImagesMutation();
  const [deleteImage, { isLoading: deleting }] = useDeleteShotReferenceImageMutation();

  if (!shot?.needsMultiImage) return null;

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    // Captions are optional at upload time -- creator can leave the file input empty and add
    // captions later, but the current flow just uploads then edit-in-place captions live under
    // each thumbnail (out of scope for phase 2, tracked as a follow-up).
    try {
      await uploadImages({ shotId: shot.id, files, captions: [] }).unwrap();
      dispatch(showFlash({ message: `Uploaded ${files.length} reference image${files.length === 1 ? "" : "s"}`, type: "success" }));
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not upload reference images", type: "error" }));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (image) => {
    try {
      await deleteImage({ shotId: shot.id, imageId: image.id }).unwrap();
      dispatch(showFlash({ message: "Reference image removed", type: "success" }));
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not remove image", type: "error" }));
    }
  };

  const label = shot.multiImageLabel || "Reference images";

  return (
    <div className="mt-3 rounded-lg border border-purple-400/25 bg-purple-500/[0.04] p-3.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-purple-300">
          {label}
        </p>
        <label className="creator-control flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-200 hover:border-purple-400/40">
          <Upload size={12} />
          {uploading ? "Uploading…" : images.length ? "Add more" : "Upload images"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>
      {images.length === 0 && (
        <p className="text-[11px] font-medium text-slate-500">
          No reference images yet. Upload multiple images that show the flow / states / angles you want the video to reflect.
        </p>
      )}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((image) => (
            <div key={image.id} className="group relative overflow-hidden rounded-md border border-white/10 bg-black/40">
              {image.signedUrl ? (
                <img src={image.signedUrl} alt={image.caption || `Reference ${image.ordinal + 1}`} className="h-24 w-full object-cover" />
              ) : (
                <div className="flex h-24 w-full items-center justify-center text-[10px] text-slate-500">preview unavailable</div>
              )}
              {image.caption && (
                <p className="truncate bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-slate-200" title={image.caption}>
                  {image.caption}
                </p>
              )}
              <button
                type="button"
                onClick={() => handleDelete(image)}
                disabled={deleting}
                title="Remove"
                className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded border border-white/10 bg-black/70 text-slate-200 hover:border-red-400/40 hover:text-red-300 group-hover:flex disabled:opacity-40"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
