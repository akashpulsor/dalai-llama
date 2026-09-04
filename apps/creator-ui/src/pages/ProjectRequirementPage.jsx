// @ts-nocheck
import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowRight, CheckCircle2, Copy, CreditCard, MessageSquareText, Pencil, Save, Sparkles, X } from "lucide-react";
import {
  selectTenantId,
  showFlash,
  useCreateProjectRequirementPaymentMutation,
  useVerifyWalletPaymentMutation,
} from "@dalaillama/shared-store";
import {
  useGenerateProjectRequirementIdeasMutation,
  useGetOrganizationQuery,
  useGetProjectRequirementProductQuery,
  useGetProjectRequirementQuery,
  useListProjectRequirementIdeasQuery,
  useListProjectRequirementProductImagesQuery,
  useListProjectRequirementReferenceImagesQuery,
  useLockProjectRequirementIdeaMutation,
  useSaveEditedProjectRequirementIdeaMutation,
  useUpdateProjectRequirementQuoteMutation,
} from "../api/creatorEndpoints.js";
import { runRazorpayCheckout } from "../utils/walletRecharge.js";

const IDEA_EDIT_FIELDS = [
  { key: "title", label: "Title" },
  { key: "concept", label: "Concept" },
  { key: "campaignAngle", label: "Campaign angle" },
];

function ReferenceImageGrid({ images, emptyLabel }) {
  if (!images?.length) {
    return <p className="text-xs font-semibold text-slate-500">{emptyLabel}</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {images.map((image) => (
        <div key={image.id} className="overflow-hidden rounded-lg border border-white/10 bg-black/30">
          {image.signedUrl ? (
            <img src={image.signedUrl} alt="" className="h-28 w-full object-cover" />
          ) : (
            <div className="flex h-28 w-full items-center justify-center text-[10px] font-semibold text-slate-600">No preview</div>
          )}
          <div className="p-2.5">
            {image.analysis ? (
              <>
                <p className="mb-1 text-[11px] font-bold text-slate-200 line-clamp-2">{image.analysis.description}</p>
                {image.analysis.dominantColors && (
                  <p className="text-[10px] font-semibold text-purple-300">{image.analysis.dominantColors}</p>
                )}
              </>
            ) : (
              <p className="text-[10px] font-semibold text-slate-500">Analysis pending funding</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Creator-only -- see caller's `isCreator` gate. Lets a creator override the auto-computed quote
 * shown to the client and decide what percentage of it is required upfront (100 = full payment,
 * the default); the remainder, if any, is a business matter collected outside the app. Refused
 * server-side once funded, so this is only ever rendered pre-funding (see caller). */
function ProjectPricingPanel({ requirement, requirementId }) {
  const dispatch = useDispatch();
  const [updateQuote, { isLoading: saving }] = useUpdateProjectRequirementQuoteMutation();
  const [totalPrice, setTotalPrice] = useState(requirement.quotedTotalPrice ?? 0);
  const [requiredPercent, setRequiredPercent] = useState(requirement.requiredPaymentPercent ?? 100);

  const dueNow = useMemo(() => {
    const price = Number(totalPrice) || 0;
    const percent = Math.min(100, Math.max(0, Number(requiredPercent) || 0));
    return Math.ceil(((price * percent) / 100) * 100) / 100;
  }, [totalPrice, requiredPercent]);

  const belowCost = requirement.quotedPlatformCost != null && Number(totalPrice) < Number(requirement.quotedPlatformCost);

  const handleSave = async () => {
    try {
      await updateQuote({
        requirementId,
        totalPrice: Number(totalPrice),
        requiredPaymentPercent: Math.min(100, Math.max(1, Number(requiredPercent) || 100)),
      }).unwrap();
      dispatch(showFlash({ message: "Pricing updated", type: "success" }));
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not update pricing", type: "error" }));
    }
  };

  return (
    <div className="creator-panel mt-6 p-6">
      <p className="mb-1 text-[11px] font-extrabold uppercase tracking-widest text-purple-300">Project pricing</p>
      <p className="mb-5 text-xs font-medium text-slate-400">Visible to you only — the client only ever sees the total and what's due now.</p>

      {requirement.quotedPlatformCost != null && (
        <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-3">
          <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Your actual cost</p>
          <p className="text-[13px] font-bold text-slate-100">
            {requirement.quotedCurrency} {Number(requirement.quotedPlatformCost).toFixed(2)}
          </p>
        </div>
      )}

      <div className="mb-4">
        <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Quote shown to client</label>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">{requirement.quotedCurrency}</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={totalPrice}
            onChange={(event) => setTotalPrice(event.target.value)}
            className="creator-input w-full px-3 py-2.5 text-sm font-bold"
          />
        </div>
        {belowCost && (
          <p className="mt-1.5 text-[11px] font-bold text-orange-300">
            Below your cost of {requirement.quotedCurrency} {Number(requirement.quotedPlatformCost).toFixed(2)}
          </p>
        )}
      </div>

      <div className="mb-5">
        <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Required payment now (%)</label>
        <input
          type="number"
          min="1"
          max="100"
          value={requiredPercent}
          onChange={(event) => setRequiredPercent(event.target.value)}
          className="creator-input w-28 px-3 py-2.5 text-sm font-bold"
        />
        <p className="mt-1.5 text-[11px] font-semibold text-slate-400">
          Client pays {requirement.quotedCurrency} {dueNow.toFixed(2)} of {requirement.quotedCurrency} {(Number(totalPrice) || 0).toFixed(2)} now
        </p>
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={handleSave}
        className="creator-primary w-full py-3 text-[13px] font-bold text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save pricing"}
      </button>
    </div>
  );
}

export default function ProjectRequirementPage() {
  const { requirementId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const tenantId = useSelector(selectTenantId);
  const { data: organization } = useGetOrganizationQuery();
  const isCreator = organization?.accountType === "CREATOR";

  const [lockedResult, setLockedResult] = useState(null);
  const [paying, setPaying] = useState(false);
  // Flips the instant the checkout+verify round trip succeeds -- doesn't wait on the poll below,
  // which only reflects `funded` once billing-service's Kafka event has actually been consumed
  // (can lag a few seconds, longer under any consumer-group churn). The verify call itself already
  // credited the wallet and published that event by the time this resolves, so treating it as
  // "funded" immediately here is accurate, not merely optimistic.
  const [justFunded, setJustFunded] = useState(false);
  const [editingOptionId, setEditingOptionId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);

  const {
    data: requirement,
    isLoading,
    refetch: refetchRequirement,
  } = useGetProjectRequirementQuery(requirementId, {
    skip: !requirementId,
    pollingInterval: 5000,
  });
  const isFunded = Boolean(requirement?.funded) || justFunded;
  // Falls back to quotedTotalPrice for a requirement created before requiredAmount existed
  // (backend defaults requiredPaymentPercent to 100, so the two are equal in the common case).
  const fundDueAmount = requirement?.requiredAmount ?? requirement?.quotedTotalPrice ?? 0;

  // Persisted on the backend now (source=GENERATED / EDITED) -- this is what survives a page
  // refresh instead of the generate mutation's response living only in component state.
  const { data: ideaOptions } = useListProjectRequirementIdeasQuery(requirementId, {
    skip: !requirementId || !isFunded,
  });

  // Product + reference material, saved at creation time (see HomePage's "Add product &
  // reference material" section) -- `analysis` on each image is null until funded, so these poll
  // the same way the requirement itself does to pick up ReferenceMaterialAnalysisService's result
  // shortly after funding completes.
  const { data: product } = useGetProjectRequirementProductQuery(requirementId, {
    skip: !requirementId,
  });
  const { data: productImages } = useListProjectRequirementProductImagesQuery(requirementId, {
    skip: !requirementId || !product,
    pollingInterval: requirement?.funded ? 5000 : 0,
  });
  const { data: referenceImages } = useListProjectRequirementReferenceImagesQuery(requirementId, {
    skip: !requirementId,
    pollingInterval: requirement?.funded ? 5000 : 0,
  });

  const [createPayment] = useCreateProjectRequirementPaymentMutation();
  const [verifyPayment] = useVerifyWalletPaymentMutation();
  const [generateIdeas, { isLoading: generating }] = useGenerateProjectRequirementIdeasMutation();
  const [saveEditedIdea, { isLoading: savingEdit }] = useSaveEditedProjectRequirementIdeaMutation();
  const [lockIdea, { isLoading: locking }] = useLockProjectRequirementIdeaMutation();

  const shareUrl = useMemo(
    () => (requirement?.shareToken ? `${window.location.origin}/brief/${requirement.shareToken}` : ""),
    [requirement?.shareToken]
  );

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      dispatch(showFlash({ message: "Link copied", type: "success" }));
    } catch {
      dispatch(showFlash({ message: shareUrl, type: "info" }));
    }
  };

  const handleFund = async () => {
    if (!tenantId) {
      dispatch(showFlash({ message: "Tenant is required to fund this brief", type: "error" }));
      return;
    }
    setPaying(true);
    try {
      const order = await createPayment({
        tenantId,
        requirementId,
        amount: fundDueAmount,
        description: `Fund brief: ${requirement?.briefText?.slice(0, 60) || requirementId}`,
      }).unwrap();

      await runRazorpayCheckout(
        {
          ...order,
          amount: Number(order?.amount ?? fundDueAmount),
          currency: order?.currency || "INR",
          name: "Dalaillama Studio",
          description: "Project brief funding",
        },
        (response) => verifyPayment({
          tenantId,
          paymentId: order.paymentId,
          gatewayOrderId: response.razorpay_order_id,
          gatewayPaymentId: response.razorpay_payment_id,
          gatewaySignature: response.razorpay_signature,
        }).unwrap()
      );

      setJustFunded(true);
      dispatch(showFlash({ message: "Payment received!", type: "success" }));
      refetchRequirement();
    } catch (error) {
      dispatch(showFlash({ message: error?.message || "Could not complete payment", type: "error" }));
    } finally {
      setPaying(false);
    }
  };

  const handleGenerateIdeas = async () => {
    try {
      // Persisted server-side now — invalidatesTags on the mutation refetches the list query
      // above, so there's nothing to store locally here.
      await generateIdeas({ requirementId }).unwrap();
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not generate ideas", type: "error" }));
    }
  };

  const startEdit = (option) => {
    setEditingOptionId(option.id);
    setEditDraft({ title: option.title, concept: option.concept, targetAudience: option.targetAudience, campaignAngle: option.campaignAngle, keyMessage: option.keyMessage, tone: option.tone });
  };
  const cancelEdit = () => {
    setEditingOptionId(null);
    setEditDraft(null);
  };
  const handleSaveEdit = async (parentOptionId) => {
    try {
      await saveEditedIdea({ requirementId, optionId: parentOptionId, ...editDraft }).unwrap();
      dispatch(showFlash({ message: "Saved as a new option", type: "success" }));
      cancelEdit();
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not save this edit", type: "error" }));
    }
  };

  const handleLock = async (option) => {
    try {
      const { title, concept, targetAudience, campaignAngle, keyMessage, tone } = option;
      const result = await lockIdea({ requirementId, title, concept, targetAudience, campaignAngle, keyMessage, tone }).unwrap();
      setLockedResult(result);
      dispatch(showFlash({ message: "Idea locked — project created", type: "success" }));
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not lock this idea", type: "error" }));
    }
  };

  if (isLoading || !requirement) {
    return <div className="mx-auto max-w-3xl px-6 py-10 text-sm font-semibold text-slate-400">Loading brief…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-extrabold text-white">Project brief</h1>
      <p className="mt-1.5 text-sm font-medium text-slate-400">
        {isFunded ? "Funded — generate ideas below to move into pre-production." : "Waiting on funding before pre-production can start."}
      </p>

      {requirement.clientUpdatedAt && (
        <div className="mt-3.5 flex items-center gap-2 rounded-lg border border-purple-400/25 bg-purple-500/10 px-3.5 py-2.5 text-[12px] font-bold text-purple-200">
          <MessageSquareText size={14} />
          The client updated this brief — check the brief text and reference images below.
        </div>
      )}

      {justFunded && (
        <div className="mt-5 flex items-center gap-3 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3.5">
          <span className="flex h-10 w-10 flex-shrink-0 animate-bounce items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
            <Sparkles size={18} />
          </span>
          <div>
            <p className="text-sm font-extrabold text-emerald-200">Amazing — payment received!</p>
            <p className="text-xs font-medium text-emerald-300/80">Generate an idea below and get this project moving.</p>
          </div>
        </div>
      )}

      <div className="creator-panel mt-6 p-6">
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-purple-300">The brief</p>
        <p className="mb-5 border-l-2 border-purple-500/40 pl-3.5 text-[15px] font-semibold leading-relaxed text-white">
          &ldquo;{requirement.briefText}&rdquo;
        </p>
        <div className="mb-5 grid grid-cols-2 gap-3">
          {requirement.targetAudience && (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-3">
              <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Target audience</p>
              <p className="text-[13px] font-bold text-slate-100">{requirement.targetAudience}</p>
            </div>
          )}
          {requirement.durationSeconds != null && (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-3">
              <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Duration</p>
              <p className="text-[13px] font-bold text-slate-100">{requirement.durationSeconds}s</p>
            </div>
          )}
          {Boolean(requirement.languages?.length) && (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-3">
              <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Languages</p>
              <p className="text-[13px] font-bold text-slate-100">{requirement.languages.join(", ")}</p>
            </div>
          )}
          {requirement.quotedTotalPrice != null && (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-3">
              <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Quoted price</p>
              <p className="text-[13px] font-bold text-slate-100">
                {requirement.quotedCurrency} {Number(requirement.quotedTotalPrice).toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {shareUrl && (
          <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-white/10 bg-black/40 px-3 py-2.5">
            <span className="min-w-0 flex-1 truncate text-xs font-semibold text-purple-300">{shareUrl}</span>
            <button type="button" onClick={copyLink} className="flex flex-shrink-0 items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-slate-100 hover:border-purple-400/40">
              <Copy size={13} />
              Copy link
            </button>
          </div>
        )}

        {product && (
          <div className="mb-5 border-t border-white/10 pt-5">
            <p className="mb-2.5 text-[11px] font-extrabold uppercase tracking-widest text-purple-300">Product</p>
            <div className="mb-3 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-3">
              <p className="text-[13px] font-bold text-slate-100">{product.name}</p>
              {product.category && <p className="text-[11px] font-semibold text-slate-500">{product.category}</p>}
              {product.description && <p className="mt-1.5 text-xs font-medium text-slate-400">{product.description}</p>}
            </div>
            <p className="mb-2 text-[11px] font-bold text-slate-400">Product images</p>
            <ReferenceImageGrid images={productImages} emptyLabel="No product images uploaded." />
          </div>
        )}

        <div className="mb-5 border-t border-white/10 pt-5">
          <p className="mb-2.5 text-[11px] font-extrabold uppercase tracking-widest text-purple-300">
            What the client has in mind
          </p>
          <ReferenceImageGrid images={referenceImages} emptyLabel="No reference images uploaded." />
        </div>

        {!isFunded && (
          <div className="border-t border-white/10 pt-5">
            <div className="mb-3 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-3">
              <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Amount due now</p>
              <p className="text-[13px] font-bold text-slate-100">
                {requirement.quotedCurrency || "INR"} {Number(fundDueAmount).toFixed(2)}
                {requirement.requiredPaymentPercent < 100 && (
                  <span className="ml-1.5 text-[11px] font-semibold text-slate-500">
                    of {requirement.quotedCurrency || "INR"} {Number(requirement.quotedTotalPrice ?? 0).toFixed(2)} total
                  </span>
                )}
              </p>
            </div>
            <button
              type="button"
              disabled={paying || fundDueAmount < 1}
              onClick={handleFund}
              className="creator-primary flex w-full items-center justify-center gap-2 py-3 text-[13px] font-bold text-white disabled:opacity-60"
            >
              <CreditCard size={16} />
              {paying ? "Processing…" : `Fund ₹${Number(fundDueAmount).toFixed(2)}`}
            </button>
          </div>
        )}

        {/* Payment is confirmed instantly (justFunded), but the backend only flips `funded` for
            real once it's finished analyzing any reference images -- which can take a while with
            several images. Gating the actual "Generate ideas" action on the polled
            requirement.funded (not the optimistic isFunded) avoids a premature click 400ing with
            "not funded yet". */}
        {isFunded && !requirement.funded && !lockedResult && (
          <div className="border-t border-white/10 pt-5">
            <div className="flex items-center gap-3 rounded-lg border border-purple-400/20 bg-purple-500/5 px-4 py-3.5">
              <span className="h-8 w-8 flex-shrink-0 animate-spin rounded-full border-2 border-purple-400/30 border-t-purple-400" />
              <div>
                <p className="text-sm font-bold text-purple-200">Finishing setup…</p>
                <p className="text-xs font-medium text-slate-400">
                  Analyzing your reference material — this usually takes under a minute.
                </p>
              </div>
            </div>
          </div>
        )}

        {requirement.funded && !lockedResult && (
          <div className="border-t border-white/10 pt-5">
            {!ideaOptions?.length && (
              <button
                type="button"
                disabled={generating}
                onClick={handleGenerateIdeas}
                className="creator-primary flex w-full items-center justify-center gap-2 py-3 text-[13px] font-bold text-white disabled:opacity-60"
              >
                <Sparkles size={16} />
                {generating ? "Generating…" : "Generate ideas"}
              </button>
            )}

            {Boolean(ideaOptions?.length) && (
              <div className="space-y-3">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-purple-300">Pick one</p>
                {ideaOptions.map((option) => {
                  const isEditing = editingOptionId === option.id;
                  return (
                    <div key={option.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                      <div className="mb-1.5 flex items-center gap-2">
                        <p className="text-sm font-extrabold text-white">{option.title}</p>
                        {option.source === "EDITED" && (
                          <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-amber-300">Edited</span>
                        )}
                        {option.criticVerdict && (
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${
                              option.criticVerdict === "PASS"
                                ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                                : "border-orange-400/25 bg-orange-400/10 text-orange-300"
                            }`}
                          >
                            {option.criticVerdict === "PASS" ? "Strong idea" : "Needs work"}
                          </span>
                        )}
                      </div>

                      {!isEditing && (
                        <>
                          <p className="mb-2 text-xs font-medium leading-relaxed text-slate-400">{option.concept}</p>
                          <p className="mb-3 text-[11px] font-semibold text-purple-300">{option.campaignAngle}</p>

                          {option.criticVerdict && (
                            <div className="mb-3 rounded-lg border border-white/10 bg-black/20 p-3">
                              <div className="mb-2 flex gap-3 text-[10px] font-bold text-slate-400">
                                <span>Completeness {option.completenessScore}</span>
                                <span>Story {option.storyScore}</span>
                                <span>Distinctiveness {option.distinctivenessScore}</span>
                              </div>
                              {Boolean(option.criticStrengths?.length) && (
                                <ul className="mb-1.5 space-y-0.5">
                                  {option.criticStrengths.map((strength, index) => (
                                    <li key={index} className="text-[11px] font-medium text-emerald-300/90">+ {strength}</li>
                                  ))}
                                </ul>
                              )}
                              {Boolean(option.criticConcerns?.length) && (
                                <ul className="space-y-0.5">
                                  {option.criticConcerns.map((concern, index) => (
                                    <li key={index} className="text-[11px] font-medium text-orange-300/90">- {concern}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(option)}
                              className="flex items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-bold text-slate-200 hover:border-purple-400/30"
                            >
                              <Pencil size={12} />
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={locking}
                              onClick={() => handleLock(option)}
                              className="flex flex-1 items-center justify-center gap-2 rounded-md border border-purple-400/30 bg-purple-500/10 py-2.5 text-xs font-bold text-purple-200 hover:bg-purple-500/20 disabled:opacity-60"
                            >
                              Lock this idea
                              <ArrowRight size={13} />
                            </button>
                          </div>
                        </>
                      )}

                      {isEditing && (
                        <div className="space-y-2.5">
                          {IDEA_EDIT_FIELDS.map(({ key, label }) => (
                            <div key={key}>
                              <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">{label}</label>
                              <textarea
                                rows={key === "concept" ? 3 : 1}
                                value={editDraft?.[key] || ""}
                                onChange={(event) => setEditDraft((current) => ({ ...current, [key]: event.target.value }))}
                                className="creator-input w-full resize-y px-2.5 py-2 text-xs"
                              />
                            </div>
                          ))}
                          <div className="flex gap-2 pt-1">
                            <button type="button" onClick={cancelEdit} className="flex items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-bold text-slate-200">
                              <X size={12} />
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={savingEdit}
                              onClick={() => handleSaveEdit(option.id)}
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-emerald-400/30 bg-emerald-500/10 py-2.5 text-xs font-bold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60"
                            >
                              <Save size={12} />
                              {savingEdit ? "Saving…" : "Save as new option"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <button type="button" onClick={handleGenerateIdeas} disabled={generating} className="w-full py-2 text-center text-xs font-bold text-purple-300 hover:text-purple-200">
                  {generating ? "Generating…" : "Regenerate options"}
                </button>
              </div>
            )}
          </div>
        )}

        {lockedResult && (
          <div className="border-t border-white/10 pt-5">
            <div className="mb-4 flex items-center gap-2.5 text-emerald-300">
              <CheckCircle2 size={18} />
              <p className="text-sm font-extrabold">Project created</p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/projects/${lockedResult.projectId}`)}
              className="creator-primary flex w-full items-center justify-center gap-2 py-3 text-[13px] font-bold text-white"
            >
              Start the script
              <ArrowRight size={15} />
            </button>
          </div>
        )}
      </div>

      {isCreator && !isFunded && requirement.quotedTotalPrice != null && (
        <ProjectPricingPanel requirement={requirement} requirementId={requirementId} />
      )}
    </div>
  );
}
