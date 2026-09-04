// @ts-nocheck
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Check, Loader2, Upload } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useAnalyzePreProductionShotProductReferenceMutation,
  useConfirmPreProductionShotProductReferenceMutation,
  useGetPreProductionShotProductReferenceQuery,
} from "../../api/creatorEndpoints.js";

/** Two-step per-shot flow: analyze (vision call, nothing saved) then confirm (attach to the
 * shot). CAST means "this photo IS the subject, preserve its identity exactly" (feeds the same
 * identity-conditioned PRODUCTION image path a cast assignment would); INSPIRATION means "borrow
 * only mood/composition/lighting, never the subject itself". */
export default function ShotProductReferencePanel({ shotId }) {
  const dispatch = useDispatch();
  const [file, setFile] = useState(null);
  const [classification, setClassification] = useState("CAST");
  const [analysis, setAnalysis] = useState(null);
  const [ignoreSubject, setIgnoreSubject] = useState(false);

  const { data: confirmed, error: confirmedError } = useGetPreProductionShotProductReferenceQuery(shotId, { skip: !shotId });
  const [analyze, { isLoading: analyzing }] = useAnalyzePreProductionShotProductReferenceMutation();
  const [confirm, { isLoading: confirming }] = useConfirmPreProductionShotProductReferenceMutation();
  const hasConfirmed = Boolean(confirmed) && confirmedError?.status !== 404;

  const handleAnalyze = async () => {
    if (!file) {
      dispatch(showFlash({ message: "Choose a photo first", type: "error" }));
      return;
    }
    try {
      const result = await analyze({ shotId, classification, file }).unwrap();
      setAnalysis(result);
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not analyze this photo", type: "error" }));
    }
  };

  const handleConfirm = async () => {
    try {
      await confirm({ shotId, ...analysis, ignoreSubject }).unwrap();
      dispatch(showFlash({ message: "Reference attached to this shot", type: "success" }));
      setAnalysis(null);
      setFile(null);
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not attach this reference", type: "error" }));
    }
  };

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3.5">
      <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Product / subject reference</p>

      {hasConfirmed && (
        <div className="mb-2.5 flex items-center gap-2.5 rounded-md border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-2">
          <img src={confirmed.signedUrl} alt="" className="h-9 w-9 rounded object-cover" />
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[11px] font-bold text-emerald-200">
              <Check size={11} />
              {confirmed.classification === "CAST" ? "Identity reference attached" : "Style reference attached"}
            </p>
            <p className="truncate text-[10px] font-medium text-emerald-300/70">
              {confirmed.classification === "CAST" ? confirmed.personDescription : confirmed.detectedSubject}
            </p>
          </div>
        </div>
      )}

      {!analysis ? (
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-white/10 p-0.5">
            {["CAST", "INSPIRATION"].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setClassification(c)}
                className={`rounded px-2 py-1 text-[10px] font-bold ${classification === c ? "bg-purple-500/20 text-purple-200" : "text-slate-400"}`}
              >
                {c === "CAST" ? "Exact subject" : "Inspiration only"}
              </button>
            ))}
          </div>
          <label className="flex flex-1 cursor-pointer items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-semibold text-slate-300 hover:border-purple-400/30">
            <Upload size={11} />
            {file ? file.name : "Choose photo"}
            <input type="file" accept="image/*" className="hidden" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </label>
          <button
            type="button"
            disabled={analyzing || !file}
            onClick={handleAnalyze}
            className="creator-primary flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold text-white disabled:opacity-60"
          >
            {analyzing && <Loader2 size={11} className="animate-spin" />}
            Analyze
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] font-medium leading-relaxed text-slate-300">
            {analysis.classification === "CAST" ? analysis.personDescription : analysis.detectedSubject}
          </p>
          {analysis.classification === "INSPIRATION" && (
            <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
              <input type="checkbox" checked={ignoreSubject} onChange={(event) => setIgnoreSubject(event.target.checked)} />
              Ignore the photographed subject, borrow only color/lighting/composition
            </label>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAnalysis(null)}
              className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-slate-300"
            >
              Discard
            </button>
            <button
              type="button"
              disabled={confirming}
              onClick={handleConfirm}
              className="flex flex-1 items-center justify-center gap-1 rounded-md border border-emerald-400/30 bg-emerald-500/10 py-1.5 text-[10px] font-bold text-emerald-200 disabled:opacity-60"
            >
              {confirming ? "Attaching…" : "Attach to this shot"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
