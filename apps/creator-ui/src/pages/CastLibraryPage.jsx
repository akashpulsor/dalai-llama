// @ts-nocheck
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Mic, Plus, Save, User2, Users } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useListCastProfilesQuery,
  useSelectCastProfileBuiltinVoiceMutation,
  useUpdateCastProfileVoiceMutation,
  useUploadCastMediaMutation,
} from "../api/creatorEndpoints.js";
import BuiltinVoicePicker from "../components/creator/BuiltinVoicePicker.jsx";
import CastProfileQuickCreate from "../components/creator/CastProfileQuickCreate.jsx";
import VoiceSampleField from "../components/creator/VoiceSampleField.jsx";

/** Cast Library, sidebar-level: the tenant's reusable actors (project_id IS NULL), independent of
 * any one project. "Product" cast profiles (a product cast as an on-screen character) live here
 * on the backend too, but aren't a creator-facing concept on this page -- the brand's actual
 * product catalog is Plans & Brand's Products section instead; showing a second, differently-
 * scoped "product" list here just duplicated and confused that. Each actor shows how many
 * projects they've actually been cast into. */
export default function CastLibraryPage() {
  const dispatch = useDispatch();
  const { data: profiles = [], isLoading } = useListCastProfilesQuery({});
  const [uploadMedia, { isLoading: uploadingVoice }] = useUploadCastMediaMutation();
  const [updateVoice, { isLoading: savingVoice }] = useUpdateCastProfileVoiceMutation();
  const [selectBuiltinVoice, { isLoading: savingBuiltinVoice }] = useSelectCastProfileBuiltinVoiceMutation();
  const [creating, setCreating] = useState(false);
  const [voiceEditId, setVoiceEditId] = useState(null);
  const [voiceEditMode, setVoiceEditMode] = useState("upload"); // "upload" | "builtin"
  const [voiceFile, setVoiceFile] = useState(null);
  const [pendingBuiltinVoice, setPendingBuiltinVoice] = useState(null);
  const savingVoiceFile = uploadingVoice || savingVoice;

  const actors = profiles.filter((p) => p.profileType === "ACTOR");

  const handleSaveVoice = async (profile) => {
    if (!voiceFile) {
      dispatch(showFlash({ message: "Choose or record a voice sample first", type: "error" }));
      return;
    }
    try {
      const media = await uploadMedia({ kind: "VOICE", file: voiceFile }).unwrap();
      await updateVoice({ castProfileId: profile.id, voiceRefBucket: media.bucket, voiceRefObjectKey: media.objectKey }).unwrap();
      dispatch(showFlash({ message: `Voice saved for ${profile.displayName}`, type: "success" }));
      setVoiceEditId(null);
      setVoiceFile(null);
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not save this voice sample", type: "error" }));
    }
  };

  const handleSelectBuiltinVoice = async (profile, voice) => {
    try {
      await selectBuiltinVoice({
        castProfileId: profile.id,
        clonedVoiceId: voice.providerVoiceId,
        providerId: voice.providerId,
      }).unwrap();
      dispatch(showFlash({ message: `${voice.displayName} set for ${profile.displayName}`, type: "success" }));
      setVoiceEditId(null);
      setPendingBuiltinVoice(null);
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not set this voice", type: "error" }));
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center gap-2.5">
        <Users size={22} className="text-purple-300" />
        <h1 className="text-2xl font-bold text-white">Cast Library</h1>
      </div>
      <p className="mt-1 text-sm font-medium text-slate-400">
        Your reusable actors. Each one carries a face reference and a cloned voice, used across every project.
      </p>

      <div className="creator-panel mt-6 p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-purple-300">Actors</p>
          {!creating && (
            <button
              type="button"
              onClick={() => { setCreating(true); setVoiceEditId(null); }}
              className="creator-primary flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white"
            >
              <Plus size={13} />
              New actor
            </button>
          )}
        </div>

        {creating && (
          <div className="mb-4">
            <CastProfileQuickCreate
              profileType="ACTOR"
              onCreated={() => { setCreating(false); dispatch(showFlash({ message: "Actor added to your library", type: "success" })); }}
              onCancel={() => setCreating(false)}
            />
          </div>
        )}

        {isLoading ? (
          <p className="py-6 text-center text-xs font-medium text-slate-500">Loading…</p>
        ) : actors.length === 0 ? (
          <p className="rounded-lg border border-dashed border-white/10 py-8 text-center text-xs font-medium text-slate-500">
            No actors yet — add one to reuse across your projects.
          </p>
        ) : (
          <div className="space-y-2.5">
            {actors.map((actor) => {
              // voiceRefBucket only means a sample was uploaded -- the actual ElevenLabs clone
              // (clonedVoiceId) is created lazily, on first real use in a project (CloneVoiceService),
              // and cleared back to null the moment a new sample is saved. voiceIdentityType
              // distinguishes that real human clone from a builtin/AI voice pick, which also
              // persists through clonedVoiceId.
              const isActuallyCloned = Boolean(actor.clonedVoiceId) && actor.voiceIdentityType === "HUMAN";
              return (
              <div key={actor.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
                    {actor.faceRefUrl ? (
                      <img src={actor.faceRefUrl} alt={actor.displayName} className="h-full w-full object-cover" />
                    ) : (
                      <User2 size={16} className="text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white">{actor.displayName}</p>
                    <p className="text-[11px] font-medium text-slate-400">
                      {[actor.gender, actor.age ? `${actor.age}` : null].filter(Boolean).join(" · ") || "Actor"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-slate-400">
                    {actor.projectCount || 0} project{actor.projectCount === 1 ? "" : "s"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceEditId(voiceEditId === actor.id ? null : actor.id);
                      setVoiceEditMode(actor.builtinVoiceId ? "builtin" : "upload");
                      setVoiceFile(null);
                      setPendingBuiltinVoice(null);
                    }}
                    title={
                      isActuallyCloned ? "Replace voice sample"
                        : actor.voiceRefBucket ? "Sample uploaded — clones on first use in a project"
                        : actor.builtinVoiceId ? "Change voice"
                        : "No voice yet — add one"
                    }
                    className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                      isActuallyCloned || actor.builtinVoiceId
                        ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                        : "border-amber-400/25 bg-amber-500/10 text-amber-200"
                    }`}
                  >
                    <Mic size={11} />
                    {isActuallyCloned ? "Voice cloned"
                      : actor.voiceRefBucket ? "Sample uploaded"
                      : actor.builtinVoiceId ? "Built-in voice"
                      : "Add voice"}
                  </button>
                </div>

                {voiceEditId === actor.id && (
                  <div className="mt-3 space-y-2.5 border-t border-white/10 pt-3">
                    <div className="flex gap-1 rounded-md border border-white/10 bg-white/5 p-0.5">
                      <button
                        type="button"
                        onClick={() => { setVoiceEditMode("upload"); setPendingBuiltinVoice(null); }}
                        className={`flex-1 rounded px-2 py-1 text-[10px] font-bold ${voiceEditMode === "upload" ? "bg-purple-500/20 text-purple-200" : "text-slate-400"}`}
                      >
                        Record/upload a sample
                      </button>
                      <button
                        type="button"
                        onClick={() => { setVoiceEditMode("builtin"); setPendingBuiltinVoice(null); }}
                        className={`flex-1 rounded px-2 py-1 text-[10px] font-bold ${voiceEditMode === "builtin" ? "bg-purple-500/20 text-purple-200" : "text-slate-400"}`}
                      >
                        Use a built-in voice
                      </button>
                    </div>

                    {voiceEditMode === "upload" ? (
                      <>
                        <VoiceSampleField file={voiceFile} onFileChange={setVoiceFile} />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => { setVoiceEditId(null); setVoiceFile(null); }}
                            className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={savingVoiceFile}
                            onClick={() => handleSaveVoice(actor)}
                            className="creator-primary flex flex-1 items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold text-white disabled:opacity-60"
                          >
                            {savingVoiceFile ? "Saving…" : "Save voice"}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <BuiltinVoicePicker
                          gender={actor.gender}
                          selectedVoiceId={pendingBuiltinVoice?.providerVoiceId || actor.clonedVoiceId || actor.builtinVoiceId}
                          onSelect={setPendingBuiltinVoice}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => { setVoiceEditId(null); setPendingBuiltinVoice(null); }}
                            disabled={savingBuiltinVoice}
                            className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 disabled:opacity-60"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={!pendingBuiltinVoice || savingBuiltinVoice}
                            onClick={() => handleSelectBuiltinVoice(actor, pendingBuiltinVoice)}
                            className="creator-primary flex flex-1 items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold text-white disabled:opacity-60"
                          >
                            <Save size={11} />
                            {savingBuiltinVoice ? "Saving…" : "Save voice"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
