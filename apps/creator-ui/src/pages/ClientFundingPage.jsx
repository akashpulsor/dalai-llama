// @ts-nocheck
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { CheckCircle2, CreditCard, ImageIcon, ImagePlus, Loader2, Package, Palette, Pencil, Save, Sparkles, X } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useGetPublicProjectRequirementQuery,
  useUpdateRequirementFromClientMutation,
  useStartRequirementPaymentMutation,
  useVerifyRequirementPaymentMutation,
} from "../api/creatorEndpoints.js";
import { runRazorpayCheckout } from "../utils/walletRecharge.js";

const rupee = (n, code = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: code || "INR", maximumFractionDigits: 0 }).format(Number(n) || 0);

/**
 * Public, unauthenticated page for whoever holds a project-requirement share link -- the
 * "AI_VIDEO_CREATOR path's funder, who has no account here" per
 * PublicProjectRequirementController's own javadoc. Backed by GET
 * /v1/public/project-requirements/{shareToken}, which returns the same full picture the creator
 * saw while building this brief (brand, product, every reference image) alongside the duration/
 * language/price fields, plus the real Razorpay pay-to-fund flow. While unfunded, the client can
 * also edit the brief text and add their own reference images (PATCH .../{shareToken}) -- the
 * creator may send a mostly-blank brief for the client to fill in themselves.
 */
export default function ClientFundingPage() {
  const { shareToken } = useParams();
  const dispatch = useDispatch();
  const { data, isLoading, isError, error, refetch } = useGetPublicProjectRequirementQuery(shareToken, { skip: !shareToken });
  const [startPayment] = useStartRequirementPaymentMutation();
  const [verifyPayment] = useVerifyRequirementPaymentMutation();
  const [updateFromClient, { isLoading: savingEdit }] = useUpdateRequirementFromClientMutation();
  const [paying, setPaying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [pendingImages, setPendingImages] = useState([]);
  const [pendingProductImages, setPendingProductImages] = useState([]);

  const handlePay = async () => {
    setPaying(true);
    try {
      const order = await startPayment(shareToken).unwrap();
      await runRazorpayCheckout(
        { ...order, name: "Dalai Llama Studio", description: "Fund this video brief" },
        (response) => verifyPayment({
          shareToken,
          paymentId: order.paymentId,
          gatewayOrderId: response.razorpay_order_id,
          gatewayPaymentId: response.razorpay_payment_id,
          gatewaySignature: response.razorpay_signature,
        }).unwrap()
      );
      dispatch(showFlash({ message: "Payment received — the creator has been notified", type: "success" }));
      refetch();
    } catch (err) {
      dispatch(showFlash({
        message: err?.message || err?.data?.message || "Payment did not complete",
        type: err?.paymentCancelled ? "warning" : "error",
      }));
    } finally {
      setPaying(false);
    }
  };

  const startEditing = () => {
    setDraft({
      briefText: data.briefText || "",
      targetAudience: data.targetAudience || "",
      campaignDirection: data.campaignDirection || "",
      brand: {
        brandName: data.brand?.brandName || "",
        industry: data.brand?.industry || "",
        brandVoice: data.brand?.brandVoice || "",
        targetAudience: data.brand?.targetAudience || "",
        brandValues: data.brand?.brandValues || "",
      },
      product: {
        name: data.product?.name || "",
        description: data.product?.description || "",
        category: data.product?.category || "",
      },
    });
    setPendingImages([]);
    setPendingProductImages([]);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setDraft(null);
    setPendingImages([]);
    setPendingProductImages([]);
  };

  const handleAddImages = (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length) setPendingImages((current) => [...current, ...files]);
  };

  const handleAddProductImages = (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length) setPendingProductImages((current) => [...current, ...files]);
  };

  const setBrandField = (field, value) => setDraft((current) => ({ ...current, brand: { ...current.brand, [field]: value } }));
  const setProductField = (field, value) => setDraft((current) => ({ ...current, product: { ...current.product, [field]: value } }));

  const handleSaveEdit = async () => {
    try {
      await updateFromClient({
        shareToken,
        briefText: draft.briefText,
        targetAudience: draft.targetAudience,
        campaignDirection: draft.campaignDirection,
        brand: draft.brand,
        product: draft.product,
        images: pendingImages,
        productImages: pendingProductImages,
      }).unwrap();
      dispatch(showFlash({ message: "Saved — the creator will see your updates", type: "success" }));
      setEditing(false);
      setDraft(null);
      setPendingImages([]);
      setPendingProductImages([]);
      refetch();
    } catch (err) {
      dispatch(showFlash({ message: err?.data?.message || "Could not save your changes", type: "error" }));
    }
  };

  const brand = data?.brand;
  const product = data?.product;
  const productImages = Array.isArray(data?.productReferenceImages) ? data.productReferenceImages : [];
  const projectImages = Array.isArray(data?.projectReferenceImages) ? data.projectReferenceImages : [];

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background:
          "radial-gradient(circle at 50% -10%, rgba(109,63,216,0.22), transparent 34rem), linear-gradient(180deg, #05070d 0%, #070b12 45%, #05070d 100%)",
      }}
    >
      <div className="flex items-center justify-center gap-2 pt-6">
        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-purple-500 text-xs font-extrabold">D</span>
        <span className="text-[13px] font-extrabold tracking-tight">Dalaillama Studio</span>
      </div>

      <div className="mx-auto max-w-3xl px-6 pb-16 pt-10">
        {isLoading && <p className="text-center text-sm font-semibold text-slate-400">Loading brief…</p>}

        {isError && (
          <p className="text-center text-sm font-semibold text-rose-300">
            {error?.status === 404 || error?.status === 410
              ? "This link has expired or doesn't exist. Ask the creator to resend it."
              : "Couldn't load this brief. Please try again."}
          </p>
        )}

        {data && (
          <>
            <p className="mb-6 text-center text-[13px] font-semibold text-slate-400">
              You&rsquo;ve been sent a video brief to review{data.funded ? "" : " and fund"}
            </p>

            <div className="creator-panel p-7">
              <div className="mb-2.5 flex items-center justify-between">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-purple-300">The brief</p>
                {!data.funded && !editing && (
                  <button
                    type="button"
                    onClick={startEditing}
                    className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-bold text-slate-300 hover:text-white"
                  >
                    <Pencil size={11} />
                    Edit brief
                  </button>
                )}
              </div>

              {editing ? (
                <div className="mb-6 space-y-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">The brief</label>
                    <textarea
                      value={draft.briefText}
                      onChange={(event) => setDraft((current) => ({ ...current, briefText: event.target.value }))}
                      rows={3}
                      className="creator-input w-full px-3 py-2.5 text-[13px]"
                      placeholder="Describe what you want this video to be about…"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Target audience</label>
                    <input
                      value={draft.targetAudience}
                      onChange={(event) => setDraft((current) => ({ ...current, targetAudience: event.target.value }))}
                      className="creator-input w-full px-3 py-2.5 text-[13px]"
                      placeholder="Who is this video for?"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Campaign direction</label>
                    <input
                      value={draft.campaignDirection}
                      onChange={(event) => setDraft((current) => ({ ...current, campaignDirection: event.target.value }))}
                      className="creator-input w-full px-3 py-2.5 text-[13px]"
                      placeholder="Any direction, tone, or style you have in mind"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <p className="mb-6 border-l-2 border-purple-500/40 pl-3.5 text-[17px] font-semibold leading-relaxed text-white">
                    &ldquo;{data.briefText}&rdquo;
                  </p>

                  <div className="mb-6 grid grid-cols-2 gap-3.5">
                    {data.targetAudience && (
                      <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-3">
                        <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Target audience</p>
                        <p className="text-[13px] font-bold text-slate-100">{data.targetAudience}</p>
                      </div>
                    )}
                    {data.durationSeconds != null && (
                      <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-3">
                        <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Duration</p>
                        <p className="text-[13px] font-bold text-slate-100">{data.durationSeconds} sec</p>
                      </div>
                    )}
                    {data.languages?.length > 0 && (
                      <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-3">
                        <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Language{data.languages.length > 1 ? "s" : ""}</p>
                        <p className="text-[13px] font-bold text-slate-100">{data.languages.join(", ")}</p>
                      </div>
                    )}
                    {data.quotedTotalPrice != null && (
                      <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-3">
                        <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Price</p>
                        <p className="text-[13px] font-bold text-slate-100">{rupee(data.quotedTotalPrice, data.quotedCurrency)}</p>
                        {data.requiredPaymentPercent < 100 && data.requiredAmount != null && (
                          <p className="mt-1 text-[11px] font-semibold text-purple-300">
                            {rupee(data.requiredAmount, data.quotedCurrency)} due now
                          </p>
                        )}
                      </div>
                    )}
                    {data.campaignDirection && (
                      <div className="col-span-2 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-3">
                        <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Campaign direction</p>
                        <p className="text-[13px] font-bold text-slate-100">{data.campaignDirection}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {(brand || editing) && (
                <div className="mb-6 rounded-lg border border-purple-400/20 bg-purple-500/[0.05] p-4">
                  <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-purple-300">
                    <Palette size={13} /> Brand
                  </div>
                  {editing ? (
                    <div className="space-y-2.5">
                      <input
                        value={draft.brand.brandName}
                        onChange={(event) => setBrandField("brandName", event.target.value)}
                        className="creator-input w-full px-3 py-2 text-[13px]"
                        placeholder="Brand name"
                      />
                      <div className="grid grid-cols-2 gap-2.5">
                        <input
                          value={draft.brand.industry}
                          onChange={(event) => setBrandField("industry", event.target.value)}
                          className="creator-input px-3 py-2 text-[12px]"
                          placeholder="Industry"
                        />
                        <input
                          value={draft.brand.brandVoice}
                          onChange={(event) => setBrandField("brandVoice", event.target.value)}
                          className="creator-input px-3 py-2 text-[12px]"
                          placeholder="Brand voice"
                        />
                      </div>
                      <input
                        value={draft.brand.targetAudience}
                        onChange={(event) => setBrandField("targetAudience", event.target.value)}
                        className="creator-input w-full px-3 py-2 text-[12px]"
                        placeholder="Brand audience"
                      />
                      <input
                        value={draft.brand.brandValues}
                        onChange={(event) => setBrandField("brandValues", event.target.value)}
                        className="creator-input w-full px-3 py-2 text-[12px]"
                        placeholder="Brand values"
                      />
                    </div>
                  ) : (
                    <>
                      <p className="text-[13px] font-bold text-white">{brand.brandName}</p>
                      <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-300">
                        {brand.industry && <p><span className="text-slate-500">Industry: </span>{brand.industry}</p>}
                        {brand.brandVoice && <p><span className="text-slate-500">Voice: </span>{brand.brandVoice}</p>}
                        {brand.targetAudience && <p className="col-span-2"><span className="text-slate-500">Audience: </span>{brand.targetAudience}</p>}
                        {brand.brandValues && <p className="col-span-2"><span className="text-slate-500">Values: </span>{brand.brandValues}</p>}
                      </div>
                    </>
                  )}
                </div>
              )}

              {(product || editing) && (
                <div className="mb-6 rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                    <Package size={13} /> Product
                  </div>
                  {editing ? (
                    <div className="space-y-2.5">
                      <input
                        value={draft.product.name}
                        onChange={(event) => setProductField("name", event.target.value)}
                        className="creator-input w-full px-3 py-2 text-[13px]"
                        placeholder="Product name"
                      />
                      <input
                        value={draft.product.category}
                        onChange={(event) => setProductField("category", event.target.value)}
                        className="creator-input w-full px-3 py-2 text-[12px]"
                        placeholder="Category"
                      />
                      <textarea
                        value={draft.product.description}
                        onChange={(event) => setProductField("description", event.target.value)}
                        rows={2}
                        className="creator-input w-full px-3 py-2 text-[12px]"
                        placeholder="Product description"
                      />
                      <ImageStrip
                        images={productImages}
                        pendingFiles={pendingProductImages}
                        onRemovePending={(index) => setPendingProductImages((current) => current.filter((_, i) => i !== index))}
                        onAdd={handleAddProductImages}
                      />
                    </div>
                  ) : (
                    <>
                      <p className="text-[13px] font-bold text-white">{product.name}</p>
                      {product.category && <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{product.category}</p>}
                      {product.description && <p className="mt-2 text-[12px] font-medium leading-relaxed text-slate-300">{product.description}</p>}
                      {productImages.length > 0 && (
                        <ImageStrip images={productImages} />
                      )}
                    </>
                  )}
                </div>
              )}

              {(projectImages.length > 0 || editing) && (
                <div className="mb-6 rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                    <Sparkles size={13} /> What the client has in mind
                  </div>
                  <ImageStrip
                    images={projectImages}
                    pendingFiles={editing ? pendingImages : []}
                    onRemovePending={editing ? (index) => setPendingImages((current) => current.filter((_, i) => i !== index)) : undefined}
                    onAdd={editing ? handleAddImages : undefined}
                  />
                </div>
              )}

              <div className="border-t border-white/10 pt-6">
                {editing ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={cancelEditing}
                      disabled={savingEdit}
                      className="creator-control flex-1 py-3 text-[13px] font-bold text-slate-200 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={savingEdit}
                      className="creator-primary flex flex-1 items-center justify-center gap-2 py-3 text-[13px] font-extrabold text-white disabled:opacity-60"
                    >
                      {savingEdit ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                      {savingEdit ? "Saving…" : "Save changes"}
                    </button>
                  </div>
                ) : data.funded ? (
                  <div className="flex items-center justify-center gap-2 rounded-lg border border-emerald-400/25 bg-emerald-500/10 py-3.5 text-[13px] font-bold text-emerald-300">
                    <CheckCircle2 size={16} />
                    Funded — the creator has been notified
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={paying || data.quotedTotalPrice == null}
                      onClick={handlePay}
                      className="creator-primary flex w-full items-center justify-center gap-2 py-3.5 text-[14px] font-extrabold text-white disabled:opacity-60"
                    >
                      {paying ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                      {paying ? "Processing…" : data.quotedTotalPrice != null
                        ? `Pay ${rupee(data.requiredAmount ?? data.quotedTotalPrice, data.quotedCurrency)} & fund this brief`
                        : "Fund this brief"}
                    </button>
                    <p className="mt-3.5 text-center text-[11px] font-medium leading-relaxed text-slate-500">
                      Secured by Razorpay. The creator starts work as soon as payment is confirmed.
                    </p>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ImageStrip({ images, pendingFiles = [], onRemovePending, onAdd }) {
  // flex-wrap, not a fixed-column grid -- a grid leaves a visibly blank trailing cell whenever
  // the image count isn't a multiple of the column count (e.g. 5 or 7 images in 3 columns),
  // which read as a layout bug on a page a client sees. Flex-wrap just stops after the last
  // image instead.
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {images.map((img) => (
        <div key={img.id} className="h-24 w-24 shrink-0 overflow-hidden rounded-md border border-white/10 bg-black/20">
          {img.signedUrl ? (
            <img src={img.signedUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-600">
              <ImageIcon size={16} />
            </div>
          )}
        </div>
      ))}
      {pendingFiles.map((file, index) => (
        <div key={`pending-${index}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border border-purple-400/40 bg-black/20">
          <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onRemovePending?.(index)}
            className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-white"
          >
            <X size={11} />
          </button>
        </div>
      ))}
      {onAdd && (
        <label className="flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-white/20 text-slate-500 hover:border-purple-400/50 hover:text-purple-300">
          <ImagePlus size={16} />
          <span className="text-[9px] font-bold uppercase tracking-wide">Add</span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => onAdd(event.target.files)} />
        </label>
      )}
    </div>
  );
}
