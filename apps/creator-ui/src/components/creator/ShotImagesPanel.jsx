// @ts-nocheck
import React from "react";
import { useDispatch } from "react-redux";
import { ImageIcon, Loader2, RefreshCw, X } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useGeneratePreProductionShotImageMutation,
  useListPreProductionShotImagesQuery,
} from "../../api/creatorEndpoints.js";

const KINDS = [
  { kind: "STORYBOARD", label: "Storyboard" },
  { kind: "PRODUCTION", label: "Production" },
  { kind: "LIGHTING", label: "Lighting sheet" },
  { kind: "CAMERA_PLAN", label: "Camera plan" },
];

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
export default function ShotImagesPanel({ shotId, aspectRatio }) {
  const dispatch = useDispatch();
  const { data: images = [] } = useListPreProductionShotImagesQuery(shotId, { skip: !shotId });
  const [generate, { isLoading: generating }] = useGeneratePreProductionShotImageMutation();
  const [pendingKind, setPendingKind] = React.useState(null);
  const [zoomedKind, setZoomedKind] = React.useState(null);

  const imageByKind = React.useMemo(() => {
    const map = new Map();
    images.forEach((img) => map.set(img.kind, img));
    return map;
  }, [images]);

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

  const zoomedImage = zoomedKind ? imageByKind.get(zoomedKind) : null;

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {KINDS.map(({ kind, label }) => {
          const image = imageByKind.get(kind);
          const busy = generating && pendingKind === kind;
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
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleGenerate(kind)}
                  className={`flex w-full items-center justify-center gap-1 rounded-md border py-1.5 text-[10px] font-bold disabled:opacity-60 ${
                    image
                      ? "border-white/10 bg-white/5 text-slate-200 hover:border-purple-400/30"
                      : "animate-pulse border-purple-400/40 bg-purple-500/10 text-purple-200 hover:border-purple-400/60"
                  }`}
                >
                  {busy ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                  {busy ? "Generating…" : image ? "Regenerate" : "Generate"}
                </button>
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
          <button
            type="button"
            onClick={() => setZoomedKind(null)}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-md border border-white/15 bg-white/5 text-slate-200 hover:border-purple-300"
          >
            <X size={16} />
          </button>
          <img
            src={zoomedImage.signedUrl}
            alt={KINDS.find((k) => k.kind === zoomedKind)?.label}
            className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
            style={{ aspectRatio: ASPECT_RATIO_CSS[aspectRatio] || "1 / 1" }}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
