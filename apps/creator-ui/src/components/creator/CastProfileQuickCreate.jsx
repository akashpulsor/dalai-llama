// @ts-nocheck
import React, { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { AlertTriangle, Loader2, Upload } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useCreateCastProfileMutation,
  useListGendersQuery,
  useUploadCastMediaMutation,
} from "../../api/creatorEndpoints.js";
import BuiltinVoicePicker from "./BuiltinVoicePicker.jsx";
import VoiceSampleField from "./VoiceSampleField.jsx";
import { normalizeGender } from "../../utils/gender.js";

const BLANK = { displayName: "", description: "", age: "", gender: "" };

/** Inline "create a cast profile" form shared by the pre-script product picker, the per-character
 * cast assignment panel, and the standalone Cast Library. Two identity flows for actors --
 * "Real person likeness" (face + voice both uploaded, for cloning an actual person) and
 * "AI-generated identity" (no face, a built-in ElevenLabs voice, no cloning -- the video model
 * generates the face fresh from the character's text description each dispatch, and the built-in
 * voice solves the pronunciation problems the model's native audio has). PRODUCT profiles are
 * unchanged -- they always need a product photo. */
export default function CastProfileQuickCreate({ profileType, projectId, characterGender, onCreated, onCancel }) {
  const dispatch = useDispatch();
  const [fields, setFields] = useState(BLANK);
  const [faceFile, setFaceFile] = useState(null);
  const [voiceFile, setVoiceFile] = useState(null);
  const [uploadMedia, { isLoading: uploading }] = useUploadCastMediaMutation();
  const [createProfile, { isLoading: creating }] = useCreateCastProfileMutation();
  const busy = uploading || creating;
  const isActor = profileType === "ACTOR";

  const { data: genderOptions = [] } = useListGendersQuery(undefined, { skip: !isActor });
  const [identityMode, setIdentityMode] = useState("real-person"); // "real-person" | "ai-generated"
  const [builtinVoice, setBuiltinVoice] = useState(null); // { providerVoiceId, gender, displayName }

  const suggestedGender = useMemo(() => normalizeGender(characterGender), [characterGender]);
  // Default the gender dropdown to the character's own gender (a warning, not a block, when the
  // user changes it) -- normalizeGender falls back to null on anything unrecognized, in which
  // case no default is set and the user picks freely.
  React.useEffect(() => {
    if (isActor && suggestedGender && !fields.gender) {
      setFields((current) => ({ ...current, gender: suggestedGender }));
    }
  }, [isActor, suggestedGender, fields.gender]);

  const genderMismatch = suggestedGender && fields.gender && fields.gender !== suggestedGender;

  const updateField = (key, value) => setFields((current) => ({ ...current, [key]: value }));

  const handleSubmit = async () => {
    if (!fields.displayName.trim()) {
      dispatch(showFlash({ message: isActor ? "The actor needs a name" : "The product needs a name", type: "error" }));
      return;
    }
    const needsFace = !isActor || identityMode === "real-person";
    if (needsFace && !faceFile) {
      dispatch(showFlash({ message: isActor ? "Upload a face reference photo" : "Upload a product photo", type: "error" }));
      return;
    }
    if (isActor && identityMode === "ai-generated" && !builtinVoice) {
      dispatch(showFlash({ message: "Pick a built-in voice -- it's what an AI-generated character speaks with", type: "error" }));
      return;
    }
    try {
      const face = needsFace ? await uploadMedia({ kind: "FACE", file: faceFile }).unwrap() : null;
      let voice = null;
      if (isActor && identityMode === "real-person" && voiceFile) {
        voice = await uploadMedia({ kind: "VOICE", file: voiceFile }).unwrap();
      }
      const profile = await createProfile({
        projectId,
        profileType,
        displayName: fields.displayName,
        description: fields.description || undefined,
        faceRefBucket: face?.bucket,
        faceRefObjectKey: face?.objectKey,
        age: isActor && fields.age ? Number(fields.age) : undefined,
        gender: isActor && fields.gender ? fields.gender : undefined,
        voiceRefBucket: voice?.bucket,
        voiceRefObjectKey: voice?.objectKey,
        clonedVoiceId: isActor && identityMode === "ai-generated" ? builtinVoice.providerVoiceId : undefined,
        clonedVoiceProviderId: isActor && identityMode === "ai-generated" ? builtinVoice.providerId : undefined,
      }).unwrap();
      dispatch(showFlash({ message: `${isActor ? "Actor" : "Product"} added`, type: "success" }));
      setFields(BLANK);
      setFaceFile(null);
      setVoiceFile(null);
      setBuiltinVoice(null);
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
          <div className="flex gap-1 rounded-md border border-white/10 bg-white/5 p-0.5">
            <button
              type="button"
              onClick={() => setIdentityMode("real-person")}
              className={`flex-1 rounded px-2 py-1.5 text-[10px] font-bold ${identityMode === "real-person" ? "bg-purple-500/20 text-purple-200" : "text-slate-400"}`}
              title="Upload a face photo and a voice sample to clone a real person's likeness"
            >
              Real person likeness
            </button>
            <button
              type="button"
              onClick={() => setIdentityMode("ai-generated")}
              className={`flex-1 rounded px-2 py-1.5 text-[10px] font-bold ${identityMode === "ai-generated" ? "bg-purple-500/20 text-purple-200" : "text-slate-400"}`}
              title="No uploads -- the video model generates a fresh face per shot from the character's description, paired with a built-in voice"
            >
              AI-generated identity
            </button>
          </div>
        )}

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
              {genderMismatch && (
                <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-amber-300">
                  <AlertTriangle size={10} />
                  Different from the character's own gender ({characterGender}).
                </p>
              )}
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

        {(!isActor || identityMode === "real-person") && (
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
        )}

        {isActor && identityMode === "real-person" && <VoiceSampleField file={voiceFile} onFileChange={setVoiceFile} />}

        {isActor && identityMode === "ai-generated" && (
          <BuiltinVoicePicker
            gender={fields.gender}
            selectedVoiceId={builtinVoice?.providerVoiceId}
            onSelect={setBuiltinVoice}
          />
        )}
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
