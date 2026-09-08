// @ts-nocheck
import React from "react";
import { useDispatch } from "react-redux";
import { Download, ImageIcon, Loader2, RefreshCw, Sparkles, Upload, X } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useApplyChangeRequestMutation,
  useGeneratePreProductionShotImageMutation,
  useGeneratePreProductionShotImageWithInspirationMutation,
  useListChangeRequestsQuery,
  useListPreProductionShotImagesQuery,
  useReanalyzePreProductionShotImageMutation,
  useReplacePreProductionShotImageMutation,
} from "../../api/creatorEndpoints.js";

const LIVE_ACTION_KINDS = [
  { kind: "STORYBOARD", label: "Storyboard" },
  { kind: "PRODUCTION", label: "Production" },
  { kind: "LIGHTING", label: "Lighting sheet" },
  { kind: "CAMERA_PLAN", label: "Camera plan" },
];

// A MOTION_GRAPHIC shot has no cinematography by design (see ShotType.MOTION_GRAPHIC's javadoc):
// no storyboard, no production frame, no lighting/camera plan. Its equivalent visual is a preview
// of the finished on-screen graphic itself, driven by the shot's motion_graphic_plan (concept +
// on_screen_text + visual_style). Only THIS kind applies to a motion-graphic shot; showing the
// other four would offer buttons that either error (no plan to drive them) or produce garbage.
const MOTION_GRAPHIC_KINDS = [
  { kind: "MOTION_GRAPHIC", label: "Motion graphic" },
];

const kindsForShotType = (shotType) =>
  shotType === "MOTION_GRAPHIC" ? MOTION_GRAPHIC_KINDS : LIVE_ACTION_KINDS;

const ALL_KIND_LABELS = new Map(
  [...LIVE_ACTION_KINDS, ...MOTION_GRAPHIC_KINDS].map((k) => [k.kind, k.label])
);

/** "Does this specific image contain rendered text worth downloading/editing" is now driven per-
 * image by `image.onScreenText` (set from the vision analysis in ShotImageDescriptionService --
 * populated on generate/replace, not just at lock-time). A shot-type allowlist used to stand in
 * for this and got both cases wrong: PRODUCTION frames with real signage/packaging didn't get the
 * affordance, and MOTION_GRAPHIC frames where the text failed to render offered it falsely. */
const hasRenderedText = (image) => Boolean(image?.onScreenText && image.onScreenText.trim().length > 0);

/** Signed URLs point at MinIO's own origin, so the plain <a download> attribute is ignored by
 * browsers cross-origin -- the browser navigates instead of saving. Fetch the bytes and hand
 * back a same-origin blob URL, which honors download. Kind name becomes the filename so
 * exports don't all collide. */
async function downloadImage(url, kind) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: HTTP ${response.status}`);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `${kind.toLowerCase()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

const ASPECT_RATIO_CSS = {
  RATIO_16_9: "16 / 9",
  RATIO_9_16: "9 / 16",
  RATIO_1_1: "1 / 1",
  RATIO_4_5: "4 / 5",
  RATIO_21_9: "21 / 9",
};

/** The 4 image kinds for one shot (see ShotImageKind on the backend) -- each generates/regenerates
 * independently. PRODUCTION is identity-conditioned automatically once the shot's character has a
 * cast assignment or a confirmed product reference; nothing here has to know that. Tiles render in
 * the shot's own aspect ratio (the same one the video model actually generates at) instead of a
 * fixed square, so what's shown matches what the project is set up to produce. */
export default function ShotImagesPanel({ shotId, shotRef, projectId, aspectRatio, shotType }) {
  const kinds = kindsForShotType(shotType);
  const dispatch = useDispatch();
  const { data: images = [] } = useListPreProductionShotImagesQuery(shotId, { skip: !shotId });
  const [generate, { isLoading: generating }] = useGeneratePreProductionShotImageMutation();
  const [generateWithInspiration, { isLoading: uploadingInspiration }] = useGeneratePreProductionShotImageWithInspirationMutation();
  const [replaceImage, { isLoading: replacingImage }] = useReplacePreProductionShotImageMutation();
  // Pending SHOT_IMAGE change requests targeting this shot, indexed by kind -- same data source
  // the project-level ShotChatPanel polls, so the two surfaces stay in sync automatically.
  const { data: changeRequests = [] } = useListChangeRequestsQuery(projectId, { skip: !projectId || !shotRef });
  const [applyChangeRequest, { isLoading: applyingChange }] = useApplyChangeRequestMutation();
  const [reanalyzeImage] = useReanalyzePreProductionShotImageMutation();
  // Once we've fired reanalyze for an image in this session, don't fire again -- whether the vision
  // pass found text or not, the answer is now cached on the row and RTK-Query will refetch it. This
  // keeps a genuinely text-free image from getting re-analyzed on every tile mount.
  const reanalyzeFiredRef = React.useRef(new Set());
  const [pendingKind, setPendingKind] = React.useState(null);
  const [zoomedKind, setZoomedKind] = React.useState(null);
  const [uploadKind, setUploadKind] = React.useState(null); // {kind, label} when upload dialog is open
  const [uploadMode, setUploadMode] = React.useState("same"); // "same" | "inspired"
  const [uploadFile, setUploadFile] = React.useState(null);
  const [uploadNote, setUploadNote] = React.useState("");

  const imageByKind = React.useMemo(() => {
    const map = new Map();
    images.forEach((img) => map.set(img.kind, img));
    return map;
  }, [images]);

  // Backfill for images generated before vision-analysis-on-generate shipped -- fire the reanalyze
  // call once per image id per session for any row whose onScreenText is still null. New rows
  // (generated/replaced after this deployment) already carry the field, so this only ever hits
  // legacy images. Failures are silent -- the panel keeps working, the Download button just stays
  // hidden if analysis genuinely returns nothing.
  React.useEffect(() => {
    images.forEach((img) => {
      if (!img || !img.id) return;
      if (img.onScreenText !== null && img.onScreenText !== undefined) return;
      if (reanalyzeFiredRef.current.has(img.id)) return;
      reanalyzeFiredRef.current.add(img.id);
      reanalyzeImage({ shotId, kind: img.kind }).unwrap().catch(() => {});
    });
  }, [images, reanalyzeImage, shotId]);

  // Pending SHOT_IMAGE change requests targeting THIS shot, keyed by imageKind so each tile can
  // render its own Apply pill for the request the chat suggested against it -- most-recent first
  // in case the creator suggested multiple in a row, so Apply hits the freshest.
  const pendingChangeRequestByKind = React.useMemo(() => {
    if (!shotRef) return new Map();
    const map = new Map();
    changeRequests
      .filter((cr) => cr.status === "PENDING" && cr.targetType === "SHOT_IMAGE" && cr.targetRef)
      .filter((cr) => cr.targetRef.split(":", 2)[0] === shotRef)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .forEach((cr) => {
        const kind = cr.targetRef.split(":", 2)[1];
        if (kind && !map.has(kind)) map.set(kind, cr);
      });
    return map;
  }, [changeRequests, shotRef]);

  const handleApplyChangeRequest = async (changeRequest) => {
    try {
      await applyChangeRequest({ projectId, changeRequestId: changeRequest.id }).unwrap();
      dispatch(showFlash({ message: "Applied the suggested change.", type: "success" }));
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not apply this change", type: "error" }));
    }
  };

  const handleGenerate = async (kind) => {
    setPendingKind(kind);
    try {
      await generate({ shotId, kind }).unwrap();
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || `Could not generate the ${kind.toLowerCase()} image`, type: "error" }));
    } finally {
      setPendingKind(null);
    }
  };

  const handleDownload = async (image, kind) => {
    try {
      await downloadImage(image.signedUrl, kind);
    } catch (error) {
      dispatch(showFlash({ message: error?.message || "Could not download the image", type: "error" }));
    }
  };

  const openUploadDialog = (kind) => {
    setUploadKind(kind);
    setUploadMode("same");
    setUploadFile(null);
    setUploadNote("");
  };

  const closeUploadDialog = () => {
    setUploadKind(null);
    setUploadMode("same");
    setUploadFile(null);
    setUploadNote("");
  };

  const handleUpload = async () => {
    if (!uploadKind || !uploadFile) return;
    const kind = uploadKind;
    try {
      if (uploadMode === "same") {
        await replaceImage({ shotId, kind, file: uploadFile }).unwrap();
        dispatch(showFlash({ message: "Image replaced.", type: "success" }));
      } else {
        await generateWithInspiration({ shotId, kind, note: uploadNote || undefined, files: [uploadFile] }).unwrap();
        dispatch(showFlash({ message: "Regenerating from inspiration…", type: "success" }));
      }
      closeUploadDialog();
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Upload failed", type: "error" }));
    }
  };

  const zoomedImage = zoomedKind ? imageByKind.get(zoomedKind) : null;

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {kinds.map(({ kind, label }) => {
          const image = imageByKind.get(kind);
          const busy = generating && pendingKind === kind;
          const pendingChange = pendingChangeRequestByKind.get(kind);
          return (
            <div key={kind} className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
              <div
                className="mx-auto flex w-full max-w-sm items-center justify-center bg-black/20"
                style={{ aspectRatio: ASPECT_RATIO_CSS[aspectRatio] || "1 / 1" }}
              >
                {image ? (
                  <button
                    type="button"
                    onClick={() => setZoomedKind(kind)}
                    className="h-full w-full cursor-zoom-in"
                    title="View full size"
                  >
                    <img src={image.signedUrl} alt={label} className="h-full w-full object-cover" />
                  </button>
                ) : (
                  <ImageIcon size={28} className="animate-pulse text-purple-400/50" />
                )}
              </div>
              <div className="p-2.5">
                <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-400">{label}</p>
                {pendingChange && (
                  <button
                    type="button"
                    disabled={applyingChange}
                    onClick={() => handleApplyChangeRequest(pendingChange)}
                    title={pendingChange.note}
                    className="mb-1.5 flex w-full items-center justify-center gap-1 rounded-md border border-purple-400/40 bg-purple-500/10 px-2 py-1 text-[10px] font-bold text-purple-200 hover:border-purple-400/60 disabled:opacity-60"
                  >
                    {applyingChange ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                    {applyingChange ? "Applying…" : "Apply text change from chat"}
                  </button>
                )}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleGenerate(kind)}
                    className={`flex flex-1 items-center justify-center gap-1 rounded-md border py-1.5 text-[10px] font-bold disabled:opacity-60 ${
                      image
                        ? "border-white/10 bg-white/5 text-slate-200 hover:border-purple-400/30"
                        : "animate-pulse border-purple-400/40 bg-purple-500/10 text-purple-200 hover:border-purple-400/60"
                    }`}
                  >
                    {busy ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                    {busy ? "Generating…" : image ? "Regenerate" : "Generate"}
                  </button>
                  {image && hasRenderedText(image) && (
                    <button
                      type="button"
                      onClick={() => handleDownload(image, kind)}
                      title="Download image"
                      className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-200 hover:border-purple-400/30"
                    >
                      <Download size={11} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openUploadDialog(kind)}
                    title="Upload a replacement or reference image"
                    className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-200 hover:border-purple-400/30"
                  >
                    <Upload size={11} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {zoomedImage && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-6"
          onClick={() => setZoomedKind(null)}
        >
          <div className="absolute right-4 top-4 flex items-center gap-2">
            {hasRenderedText(zoomedImage) && (
              <button
                type="button"
                onClick={(event) => { event.stopPropagation(); handleDownload(zoomedImage, zoomedKind); }}
                title="Download image"
                className="flex h-9 items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-3 text-xs font-bold text-slate-200 hover:border-purple-300"
              >
                <Download size={14} /> Download
              </button>
            )}
            <button
              type="button"
              onClick={() => setZoomedKind(null)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 bg-white/5 text-slate-200 hover:border-purple-300"
            >
              <X size={16} />
            </button>
          </div>
          <img
            src={zoomedImage.signedUrl}
            alt={ALL_KIND_LABELS.get(zoomedKind)}
            className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
            style={{ aspectRatio: ASPECT_RATIO_CSS[aspectRatio] || "1 / 1" }}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}

      {uploadKind && (() => {
        const uploading = replacingImage || uploadingInspiration;
        const label = ALL_KIND_LABELS.get(uploadKind) || uploadKind;
        return (
          <div
            className="fixed inset-0 z-[210] flex items-center justify-center bg-black/80 p-6"
            onClick={closeUploadDialog}
          >
            <div
              className="w-full max-w-md rounded-xl border border-white/10 bg-slate-950 p-5 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wide text-purple-300">Upload image</p>
                  <p className="mt-0.5 text-sm font-bold text-slate-100">{label}</p>
                </div>
                <button
                  type="button"
                  onClick={closeUploadDialog}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-300 hover:border-purple-300"
                >
                  <X size={14} />
                </button>
              </div>

              <fieldset className="mb-3 space-y-2">
                <label className="flex cursor-pointer items-start gap-2 rounded-md border border-white/10 bg-white/5 p-2.5 hover:border-purple-400/30">
                  <input type="radio" name="upload-mode" value="same" checked={uploadMode === "same"} onChange={() => setUploadMode("same")} className="mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-slate-100">Same — use this exact image</p>
                    <p className="mt-0.5 text-[10px] font-medium text-slate-500">No AI regeneration. Your uploaded file becomes the shot image as-is. Best for fixing wrong on-image text.</p>
                  </div>
                </label>
                <label className="flex cursor-pointer items-start gap-2 rounded-md border border-white/10 bg-white/5 p-2.5 hover:border-purple-400/30">
                  <input type="radio" name="upload-mode" value="inspired" checked={uploadMode === "inspired"} onChange={() => setUploadMode("inspired")} className="mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-slate-100">Inspired — regenerate with this as reference</p>
                    <p className="mt-0.5 text-[10px] font-medium text-slate-500">AI analyses the upload and regenerates keeping the shot plan intact. Best for style/lighting/composition inspiration.</p>
                  </div>
                </label>
              </fieldset>

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
                className="mb-3 w-full rounded-md border border-white/10 bg-white/5 p-2 text-[11px] text-slate-200 file:mr-2 file:rounded file:border-0 file:bg-purple-500/20 file:px-2 file:py-1 file:text-[10px] file:font-bold file:text-purple-200"
              />

              {uploadMode === "inspired" && (
                <textarea
                  value={uploadNote}
                  onChange={(event) => setUploadNote(event.target.value)}
                  placeholder="Optional note: e.g. 'match this lighting mood' or 'keep the pose but change the setting to a kitchen'"
                  rows={2}
                  className="mb-3 w-full resize-y rounded-md border border-white/10 bg-white/5 p-2 text-[11px] text-slate-200 placeholder:text-slate-500"
                />
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeUploadDialog}
                  disabled={uploading}
                  className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 hover:border-purple-300 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!uploadFile || uploading}
                  className="flex items-center gap-1.5 rounded-md border border-purple-400/40 bg-purple-500/20 px-3 py-1.5 text-[11px] font-black text-purple-100 hover:border-purple-400/60 disabled:opacity-55"
                >
                  {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                  {uploadMode === "same" ? "Replace image" : "Regenerate"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
