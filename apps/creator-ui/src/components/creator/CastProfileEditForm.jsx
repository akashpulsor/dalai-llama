// @ts-nocheck
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Loader2, Save, Sparkles, Upload, X } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useGenerateCastFaceMutation,
  useListGendersQuery,
  useUpdateCastProfileMutation,
  useUploadCastMediaMutation,
} from "../../api/creatorEndpoints.js";
import FeatureLock from "../billing/FeatureLock.jsx";
import useCreatorVideoEntitlements from "../../hooks/useCreatorVideoEntitlements.js";

/** Cast Library "Edit": an actor's name, age, gender, description and face. Voice stays on its own
 * control. The actor is library-wide, so a save shows up in every project it's cast in. */
export default function CastProfileEditForm({ profile, onDone }) {
  const dispatch = useDispatch();
  const { entitlements } = useCreatorVideoEntitlements();
  const { data: genderOptions = [] } = useListGendersQuery();
  const [uploadMedia, { isLoading: uploading }] = useUploadCastMediaMutation();
  const [updateProfile, { isLoading: saving }] = useUpdateCastProfileMutation();
  const [generateFace, { isLoading: generatingFace }] = useGenerateCastFaceMutation();
  const [fields, setFields] = useState({
    displayName: profile.displayName || "",
    age: profile.age ?? "",
    gender: profile.gender || "",
    description: profile.description || "",
  });
  const [faceFile, setFaceFile] = useState(null);
  const busy = uploading || saving;

  const updateField = (key, value) => setFields((current) => ({ ...current, [key]: value }));

  const handleSave = async () => {
    if (!fields.displayName.trim()) {
      dispatch(showFlash({ message: "The actor needs a name", type: "error" }));
      return;
    }
    try {
      const face = faceFile ? await uploadMedia({ kind: "FACE", file: faceFile }).unwrap() : null;
      await updateProfile({
        castProfileId: profile.id,
        displayName: fields.displayName,
        description: fields.description || null,
        age: fields.age === "" ? null : Number(fields.age),
        gender: fields.gender || null,
        faceRefBucket: face?.bucket,
        faceRefObjectKey: face?.objectKey,
      }).unwrap();
      dispatch(showFlash({ message: `${fields.displayName.trim()} updated`, type: "success" }));
      onDone();
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not save this actor", type: "error" }));
    }
  };

  const handleGenerateFace = async () => {
    try {
      await generateFace({ castProfileId: profile.id }).unwrap();
      dispatch(showFlash({ message: `Generated a face for ${profile.displayName}`, type: "success" }));
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not generate a face", type: "error" }));
    }
  };

  return (
    <div className="mt-3 space-y-2.5 border-t border-white/10 pt-3">
      <div>
        <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Actor name</label>
        <input
          type="text"
          value={fields.displayName}
          onChange={(event) => updateField("displayName", event.target.value)}
          className="creator-input w-full px-2.5 py-2 text-xs font-semibold"
        />
      </div>

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
          <select
            value={fields.gender}
            onChange={(event) => updateField("gender", event.target.value)}
            className="creator-input w-full px-2.5 py-2 text-xs font-semibold"
          >
            <option value="">Unspecified</option>
            {genderOptions.map((g) => (
              <option key={g.code} value={g.code}>{g.label}</option>
            ))}
          </select>
        </div>
      </div>

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
        <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Face reference</label>
        <div className="flex gap-2">
          <div className="flex-1">
            <FeatureLock unlocked={entitlements.imageUploadEnabled} feature="Character reference image upload" compact>
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2.5 py-2 text-xs font-semibold text-slate-300 hover:border-purple-400/30">
                <Upload size={12} />
                {faceFile ? faceFile.name : profile.faceRefUrl ? "Replace photo" : "Upload a photo"}
                <input type="file" accept="image/*" className="hidden" onChange={(event) => setFaceFile(event.target.files?.[0] || null)} />
              </label>
            </FeatureLock>
          </div>
          <button
            type="button"
            onClick={handleGenerateFace}
            disabled={generatingFace || busy}
            title="AI-generate a portrait from this actor's gender, age and description (replaces the current face)"
            className="flex items-center gap-1 rounded-md border border-purple-400/30 bg-purple-500/10 px-2.5 py-2 text-[11px] font-bold text-purple-200 hover:border-purple-400/60 disabled:opacity-60"
          >
            {generatingFace ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
            AI face
          </button>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onDone}
          className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300"
        >
          <X size={11} />
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={handleSave}
          className="creator-primary flex flex-1 items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold text-white disabled:opacity-60"
        >
          {busy ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
          {busy ? "Saving…" : "Save actor"}
        </button>
      </div>
    </div>
  );
}
