// @ts-nocheck
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Loader2, Upload } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import { useCreateCastProfileMutation, useUploadCastMediaMutation } from "../../api/creatorEndpoints.js";
import VoiceSampleField from "./VoiceSampleField.jsx";

const BLANK = { displayName: "", description: "", age: "", gender: "" };

/** Inline "create a cast profile" form shared by the pre-script product picker and the per-
 * character cast assignment panel -- same two-step flow either way: upload the media file(s) to
 * MinIO (getting back a bucket/objectKey), then create the CastProfile row with those refs. */
export default function CastProfileQuickCreate({ profileType, projectId, onCreated, onCancel }) {
  const dispatch = useDispatch();
  const [fields, setFields] = useState(BLANK);
  const [faceFile, setFaceFile] = useState(null);
  const [voiceFile, setVoiceFile] = useState(null);
  const [uploadMedia, { isLoading: uploading }] = useUploadCastMediaMutation();
  const [createProfile, { isLoading: creating }] = useCreateCastProfileMutation();
  const busy = uploading || creating;
  const isActor = profileType === "ACTOR";

  const updateField = (key, value) => setFields((current) => ({ ...current, [key]: value }));

  const handleSubmit = async () => {
    if (!fields.displayName.trim()) {
      dispatch(showFlash({ message: isActor ? "The actor needs a name" : "The product needs a name", type: "error" }));
      return;
    }
    if (!faceFile) {
      dispatch(showFlash({ message: isActor ? "Upload a face reference photo" : "Upload a product photo", type: "error" }));
      return;
    }
    try {
      const face = await uploadMedia({ kind: "FACE", file: faceFile }).unwrap();
      let voice = null;
      if (isActor && voiceFile) {
        voice = await uploadMedia({ kind: "VOICE", file: voiceFile }).unwrap();
      }
      const profile = await createProfile({
        projectId,
        profileType,
        displayName: fields.displayName,
        description: fields.description || undefined,
        faceRefBucket: face.bucket,
        faceRefObjectKey: face.objectKey,
        age: isActor && fields.age ? Number(fields.age) : undefined,
        gender: isActor && fields.gender ? fields.gender : undefined,
        voiceRefBucket: voice?.bucket,
        voiceRefObjectKey: voice?.objectKey,
      }).unwrap();
      dispatch(showFlash({ message: `${isActor ? "Actor" : "Product"} added`, type: "success" }));
      setFields(BLANK);
      setFaceFile(null);
      setVoiceFile(null);
      onCreated?.(profile);
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not save this cast profile", type: "error" }));
    }
  };

  return (
    <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.02] p-3.5">
      <div className="space-y-2.5">
        <div>
          <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
            {isActor ? "Actor name" : "Product name"}
          </label>
          <input
            type="text"
            value={fields.displayName}
            onChange={(event) => updateField("displayName", event.target.value)}
            className="creator-input w-full px-2.5 py-2 text-xs font-semibold"
            placeholder={isActor ? "e.g. Priya Sharma" : "e.g. Wireless Earbuds Pro"}
          />
        </div>

        {isActor && (
          <div className="flex gap-2.5">
            <div className="flex-1">
              <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Age</label>
              <input
                type="number"
                min="0"
                value={fields.age}
                onChange={(event) => updateField("age", event.target.value)}
                className="creator-input w-full px-2.5 py-2 text-xs font-semibold"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Gender</label>
              <input
                type="text"
                value={fields.gender}
                onChange={(event) => updateField("gender", event.target.value)}
                className="creator-input w-full px-2.5 py-2 text-xs font-semibold"
              />
            </div>
          </div>
        )}

        <div>
          <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Description</label>
          <textarea
            rows={2}
            value={fields.description}
            onChange={(event) => updateField("description", event.target.value)}
            className="creator-input w-full resize-y px-2.5 py-2 text-xs"
          />
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
            {isActor ? "Face reference photo" : "Product photo"}
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2.5 py-2 text-xs font-semibold text-slate-300 hover:border-purple-400/30">
            <Upload size={12} />
            {faceFile ? faceFile.name : "Choose a file"}
            <input type="file" accept="image/*" className="hidden" onChange={(event) => setFaceFile(event.target.files?.[0] || null)} />
          </label>
        </div>

        {isActor && <VoiceSampleField file={voiceFile} onFileChange={setVoiceFile} />}
      </div>

      <div className="mt-3 flex gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300">
            Cancel
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={handleSubmit}
          className="creator-primary flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          {busy && <Loader2 size={12} className="animate-spin" />}
          {busy ? "Saving…" : isActor ? "Add actor" : "Add product"}
        </button>
      </div>
    </div>
  );
}
