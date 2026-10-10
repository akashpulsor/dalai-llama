// @ts-nocheck
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Copy, Download, Loader2, X } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useGetOfficialUploadQuery,
  useGetYouTubeKitQuery,
  useLinkPlatformFilmMutation,
  useRequestOfficialUploadMutation,
} from "../../api/showcaseEndpoints.js";
import ShowcaseFields from "./ShowcaseFields.jsx";
import { errorMessage } from "./showcaseLabels.js";

const UPLOAD_STATUS = {
  QUEUED: "Queued for upload to Dalaillama's channel",
  UPLOADING: "Uploading to Dalaillama's channel…",
  DONE: "On Dalaillama's channel and your profile",
  FAILED: "The upload failed",
  NEEDS_MANUAL: "YouTube needs a person to publish this; our team will finish it",
};

/** Puts a finished film made on Dalaillama on the creator's profile, by either path: we upload it to
 * Dalaillama's own channel, or the creator uploads it to theirs with this kit and pastes the link. */
export default function PublishToShowcaseDialog({ projectId, onClose }) {
  const dispatch = useDispatch();
  const { data: kit, isLoading, error } = useGetYouTubeKitQuery(projectId);
  const { data: upload } = useGetOfficialUploadQuery(projectId, {
    pollingInterval: 10000,
  });
  const [requestUpload, uploadState] = useRequestOfficialUploadMutation();
  const [linkFilm, linkState] = useLinkPlatformFilmMutation();
  const [fields, setFields] = useState({ industry: "FOOD_BEVERAGE", format: "PRODUCT_AD", clientLabel: "", rightsConfirmed: false });
  const [url, setUrl] = useState("");
  const [path, setPath] = useState("official");

  const flash = (message, type = "success") => dispatch(showFlash({ message, type }));

  const onOfficial = async () => {
    try {
      await requestUpload({ projectId, ...fields }).unwrap();
      flash("Queued. We'll upload it to Dalaillama's channel shortly.");
    } catch (e) {
      flash(errorMessage(e, "Could not queue the upload"), "error");
    }
  };

  const onLink = async () => {
    try {
      await linkFilm({ projectId, url: url.trim(), ...fields }).unwrap();
      flash("Your film is on your profile");
      onClose();
    } catch (e) {
      flash(errorMessage(e, "That link didn't match this film"), "error");
    }
  };

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      flash("Copied");
    } catch {
      // Clipboard blocked: the text is selectable on screen.
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="publish-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="creator-panel max-h-[90vh] w-full max-w-lg overflow-y-auto p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 id="publish-title" className="text-base font-bold text-white">Publish to your profile</h3>
          <button type="button" aria-label="Close" onClick={onClose} className="creator-control flex h-8 w-8 items-center justify-center text-slate-300">
            <X size={14} />
          </button>
        </div>

        {isLoading && <p className="mt-3 flex items-center gap-2 text-sm text-slate-400"><Loader2 size={14} className="animate-spin" /> Loading…</p>}
        {error && <p className="mt-3 text-sm text-rose-200">{errorMessage(error, "Could not load this film")}</p>}

        {kit && !kit.filmReady && (
          <p className="mt-3 text-sm text-amber-200">Publish the finished film to the review page first.</p>
        )}

        {kit && kit.filmReady && (
          <>
            <ShowcaseFields value={fields} onChange={setFields} />

            <div role="tablist" className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" role="tab" aria-selected={path === "official"} onClick={() => setPath("official")}
                      className={`rounded-lg px-3 py-2 text-xs font-bold ${path === "official" ? "bg-purple-600 text-white" : "border border-white/10 text-slate-300"}`}>
                Dalaillama's channel
              </button>
              <button type="button" role="tab" aria-selected={path === "kit"} onClick={() => setPath("kit")}
                      className={`rounded-lg px-3 py-2 text-xs font-bold ${path === "kit" ? "bg-purple-600 text-white" : "border border-white/10 text-slate-300"}`}>
                My own channel
              </button>
            </div>

            {path === "official" && (
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <p>We upload it to Dalaillama's YouTube channel with you credited and a link to your profile.</p>
                {upload && (
                  <p className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-slate-200">
                    {UPLOAD_STATUS[upload.status]}{upload.error ? `: ${upload.error}` : ""}
                  </p>
                )}
                {!kit.officialUploadAvailable && (
                  <p className="text-xs font-semibold text-amber-200">{kit.officialUploadBlockedReason}</p>
                )}
                <button type="button" onClick={onOfficial}
                        disabled={!kit.officialUploadAvailable || !fields.rightsConfirmed || uploadState.isLoading
                          || upload?.status === "QUEUED" || upload?.status === "UPLOADING" || upload?.status === "DONE"}
                        className="creator-primary flex min-h-9 items-center gap-2 px-4 text-xs font-black text-white disabled:opacity-50">
                  {uploadState.isLoading && <Loader2 size={13} className="animate-spin" />} Publish on Dalaillama's channel
                </button>
              </div>
            )}

            {path === "kit" && (
              <ol className="mt-4 space-y-3 text-sm text-slate-300">
                <li>
                  <p className="font-semibold text-white">1. Download the film</p>
                  <a href={kit.downloadUrl} className="creator-control mt-1.5 inline-flex h-9 items-center gap-2 px-3 text-xs font-bold text-slate-200">
                    <Download size={13} /> Download
                  </a>
                </li>
                <li>
                  <p className="font-semibold text-white">2. Upload it in YouTube Studio with this title and description</p>
                  <KitLine label="Title" text={kit.title} onCopy={copy} />
                  <KitLine label="Description (keep the first line)" text={kit.description} onCopy={copy} />
                  <p className="mt-1 text-xs text-amber-100">{kit.disclosureStep}</p>
                </li>
                <li>
                  <p className="font-semibold text-white">3. Paste the video's link</p>
                  <label htmlFor="filmUrl" className="sr-only">YouTube link</label>
                  <input id="filmUrl" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtu.be/…"
                         className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400/60" />
                  <button type="button" onClick={onLink} disabled={!url.trim() || !fields.rightsConfirmed || linkState.isLoading}
                          className="creator-primary mt-2 flex min-h-9 items-center gap-2 px-4 text-xs font-black text-white disabled:opacity-50">
                    {linkState.isLoading && <Loader2 size={13} className="animate-spin" />} Add to my profile
                  </button>
                </li>
              </ol>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function KitLine({ label, text, onCopy }) {
  return (
    <div className="mt-1.5">
      <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
      <div className="flex items-start gap-2">
        <pre className="min-w-0 flex-1 whitespace-pre-wrap break-words rounded border border-white/10 bg-black/30 px-2 py-1.5 font-sans text-xs text-slate-200">{text}</pre>
        <button type="button" aria-label={`Copy ${label}`} onClick={() => onCopy(text)}
                className="creator-control flex h-8 w-8 shrink-0 items-center justify-center text-slate-300">
          <Copy size={12} />
        </button>
      </div>
    </div>
  );
}
