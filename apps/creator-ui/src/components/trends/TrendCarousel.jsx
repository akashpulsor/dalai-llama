// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Clapperboard, Flame, ImagePlus, Lightbulb, Link2, Loader2, PencilLine, Plus, RefreshCw, Sparkles, X } from "lucide-react";
import AiProviderSelect from "../ai/AiProviderSelect.jsx";

export default function TrendCarousel({
  trends,
  selectedTrendId,
  onSelectTrend,
  onViewAll,
  pageInfo,
  onPageChange,
  mode = "trend",
  onModeChange,
  creativeFlow = "guided",
  onCreativeFlowChange,
  originalIdea = "",
  onOriginalIdeaChange,
  productAdBrief,
  onProductAdBriefChange,
  onUploadProductReferenceImages,
  isUploadingProductReferenceImages = false,
  productAdFormatOptions = [],
  productAdFormatPlaybooks = {},
  productAdShotTypeOptions = [],
  onGenerateProductAdPipeline,
  isGeneratingProductAdPipeline = false,
  productAdPipelineJob = null,
  canGenerateProductAdPipeline = false,
  onSaveOriginalIdea,
  onSaveTrend,
  onGenerateStoryIdeas,
  topicType = "lifestyle",
  onTopicTypeChange,
  topicTypeOptions = [],
  topicIdeaSuggestions = [],
  selectedCampaignAngle = null,
  onSelectCampaignAngle,
  onGenerateCampaignAngles,
  isGeneratingCampaignAngles = false,
  canGenerateCampaignAngles = false,
  productionStyle = "hybrid",
  onProductionStyleChange,
  productionStyleOptions = [],
  hybridSceneMode = "ask_speaking_scenes",
  onHybridSceneModeChange,
  hybridSceneModeOptions = [],
  brollStyle = "cinematic_social",
  onBrollStyleChange,
  brollStyleOptions = [],
  captionStyle = "bold_keyword",
  onCaptionStyleChange,
  captionStyleOptions = [],
  isFetching,
  isLockingSelection,
  isGeneratingIdeas,
  canGenerateStoryIdeas,
  savedBriefTitle,
  aiProviders = [],
  selectedProviderCode,
  selectedProvider,
  onProviderChange,
  providersLoading,
  providersError,
  trendsDisabled = false,
  autoFocusOriginalIdea = false,
  onRefreshTrendMoments,
  isRefreshingTrendMoments = false,
}) {
  const originalIdeaRef = useRef(null);
  const productImageInputRef = useRef(null);
  const [productImageLinkDraft, setProductImageLinkDraft] = useState("");
  const [productImageLinkError, setProductImageLinkError] = useState("");
  const page = pageInfo?.number || 0;
  const totalPages = Math.max(1, pageInfo?.totalPages || 1);
  const totalElements = pageInfo?.totalElements || trends.length;
  const originalWords = countWords(originalIdea);
  const productAdPipelineStatus = String(productAdPipelineJob?.status || "").toUpperCase();
  const productAdPipelineProgress = Number(productAdPipelineJob?.progress || 0);
  const isAutonomousProductFlow = creativeFlow === "autonomous_product_ad";
  const hasProductAdInput = Boolean(
    String(productAdBrief?.productInput || "").trim()
    || String(productAdBrief?.productUrl || "").trim()
    || String(productAdBrief?.productName || "").trim()
    || String(productAdBrief?.imageUrlsText || "").trim()
    || (Array.isArray(productAdBrief?.imageUrls) && productAdBrief.imageUrls.length > 0)
    || (Array.isArray(productAdBrief?.imageAssets) && productAdBrief.imageAssets.length > 0)
  );
  const originalIdeaValid = originalWords <= 50 && (originalWords > 0 || hasProductAdInput);
  const updateProductAdBrief = (key, value) => {
    onProductAdBriefChange?.({
      ...(productAdBrief || {}),
      [key]: value,
    });
  };
  const productImageAssets = useMemo(
    () => (Array.isArray(productAdBrief?.imageAssets) ? productAdBrief.imageAssets : []),
    [productAdBrief?.imageAssets]
  );
  const productImageLinks = useMemo(
    () => splitProductImageLinks(productAdBrief?.imageUrlsText).slice(0, 8),
    [productAdBrief?.imageUrlsText]
  );
  const productReferenceCount = new Set([
    ...(Array.isArray(productAdBrief?.sourceProductImageUrls) ? productAdBrief.sourceProductImageUrls : []),
    ...(Array.isArray(productAdBrief?.imageUrls) ? productAdBrief.imageUrls : []),
    ...String(productAdBrief?.imageUrlsText || "").split(/[\n,]+/),
    ...productImageAssets.map(productAssetUrl),
  ].map((value) => String(value || "").trim()).filter(Boolean)).size;
  const removeProductImageAsset = (asset) => {
    const removedUrl = productAssetUrl(asset);
    const removedKey = productAssetKey(asset);
    const imageAssets = productImageAssets.filter((candidate) => productAssetKey(candidate) !== removedKey);
    const withoutRemovedUrl = (values) => (Array.isArray(values) ? values : [])
      .filter((value) => String(value || "").trim() && String(value).trim() !== removedUrl);
    onProductAdBriefChange?.({
      ...(productAdBrief || {}),
      imageAssets,
      uploadedImageUrls: withoutRemovedUrl(productAdBrief?.uploadedImageUrls),
      sourceProductImageUrls: withoutRemovedUrl(productAdBrief?.sourceProductImageUrls),
      imageUrls: withoutRemovedUrl(productAdBrief?.imageUrls),
    });
  };
  const removeProductImageLink = (removedUrl) => {
    const withoutRemovedUrl = (values) => (Array.isArray(values) ? values : [])
      .filter((value) => String(value || "").trim() && String(value).trim() !== removedUrl);
    onProductAdBriefChange?.({
      ...(productAdBrief || {}),
      imageUrlsText: productImageLinks.filter((url) => url !== removedUrl).join("\n"),
      uploadedImageUrls: withoutRemovedUrl(productAdBrief?.uploadedImageUrls),
      sourceProductImageUrls: withoutRemovedUrl(productAdBrief?.sourceProductImageUrls),
      imageUrls: withoutRemovedUrl(productAdBrief?.imageUrls),
      productImageUrls: withoutRemovedUrl(productAdBrief?.productImageUrls),
      referenceImageUrls: withoutRemovedUrl(productAdBrief?.referenceImageUrls),
    });
    setProductImageLinkError("");
  };
  const addProductImageLink = () => {
    const imageUrl = productImageLinkDraft.trim();
    if (!imageUrl) {
      setProductImageLinkError("Paste a direct image URL first.");
      return;
    }
    try {
      const parsed = new URL(imageUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("Unsupported URL protocol");
      }
    } catch {
      setProductImageLinkError("Enter a valid public HTTP or HTTPS image URL.");
      return;
    }
    if (productImageLinks.includes(imageUrl)) {
      setProductImageLinkError("This image link is already added.");
      return;
    }
    if (productReferenceCount >= 8) {
      setProductImageLinkError("Remove a reference before adding another. The limit is 8.");
      return;
    }
    onProductAdBriefChange?.({
      ...(productAdBrief || {}),
      imageUrlsText: [...productImageLinks, imageUrl].join("\n"),
    });
    setProductImageLinkDraft("");
    setProductImageLinkError("");
  };
  const selectedProductAdFormat = useMemo(
    () => productAdFormatOptions.find((option) => option.value === productAdBrief?.adFormat) || productAdFormatOptions[0],
    [productAdBrief?.adFormat, productAdFormatOptions]
  );
  const selectedProductShotTypes = useMemo(
    () => (Array.isArray(productAdBrief?.selectedShotTypes) ? productAdBrief.selectedShotTypes : [])
      .map((value) => productAdShotTypeOptions.find((option) => option.value === value))
      .filter(Boolean),
    [productAdBrief?.selectedShotTypes, productAdShotTypeOptions]
  );
  const isAutoProductShotRecipe = productAdBrief?.shotRecipeSource !== "custom";
  const selectedProductAdPlaybook = useMemo(
    () => productAdFormatPlaybooks[selectedProductAdFormat?.value] || null,
    [productAdFormatPlaybooks, selectedProductAdFormat?.value]
  );
  const selectProductAdFormat = (value) => {
    onProductAdBriefChange?.({
      ...(productAdBrief || {}),
      adFormat: value,
    });
  };
  const addProductShotType = (value) => {
    if (!value) return;
    if (value === "__auto__") {
      onProductAdBriefChange?.({
        ...(productAdBrief || {}),
        selectedShotTypes: [],
        shotRecipeSource: "auto_product",
      });
      return;
    }
    const current = selectedProductShotTypes.map((option) => option.value);
    if (current.includes(value)) return;
    onProductAdBriefChange?.({
      ...(productAdBrief || {}),
      selectedShotTypes: [...current, value].slice(0, 5),
      shotRecipeSource: "custom",
    });
  };
  const removeProductShotType = (value) => {
    const selectedShotTypes = selectedProductShotTypes.map((option) => option.value).filter((item) => item !== value);
    onProductAdBriefChange?.({
      ...(productAdBrief || {}),
      selectedShotTypes,
      shotRecipeSource: selectedShotTypes.length ? "custom" : "auto_product",
    });
  };
  const setNoHumans = (checked) => {
    const selectedShotTypes = checked
      ? selectedProductShotTypes.map((option) => option.value).filter((value) => !["action_shot", "lifestyle_shot"].includes(value))
      : selectedProductShotTypes.map((option) => option.value);
    onProductAdBriefChange?.({
      ...(productAdBrief || {}),
      noHumans: checked,
      selectedShotTypes,
      shotRecipeSource: selectedShotTypes.length ? productAdBrief?.shotRecipeSource : "auto_product",
    });
  };
  const selectedTopicType = useMemo(
    () => topicTypeOptions.find((option) => option.value === topicType) || topicTypeOptions[0],
    [topicType, topicTypeOptions]
  );
  const selectedProductionStyle = useMemo(
    () => productionStyleOptions.find((option) => option.value === productionStyle) || productionStyleOptions[0],
    [productionStyle, productionStyleOptions]
  );
  const selectedHybridSceneMode = useMemo(
    () => hybridSceneModeOptions.find((option) => option.value === hybridSceneMode) || hybridSceneModeOptions[0],
    [hybridSceneMode, hybridSceneModeOptions]
  );

  useEffect(() => {
    if (!autoFocusOriginalIdea || mode !== "original") return undefined;
    const focusTimer = window.setTimeout(() => {
      originalIdeaRef.current?.focus({ preventScroll: true });
    }, 80);
    return () => window.clearTimeout(focusTimer);
  }, [autoFocusOriginalIdea, mode]);

  return (
    <section className="creator-panel p-4">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-2">
          {trendsDisabled ? <Lightbulb size={18} className="text-emerald-200" /> : <Flame size={18} className="text-orange-300" />}
          <div>
            <h2 className="text-base font-bold">Creative Brief</h2>
            <p className="mt-1 text-xs font-semibold text-slate-400">
              {trendsDisabled
                ? "Write the topic you want to generate content about."
                : isFetching ? "Loading fresh trend rows..." : "Show trends or go with your own idea."}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <AiProviderSelect
            providers={aiProviders}
            value={selectedProviderCode}
            selectedProvider={selectedProvider}
            onChange={onProviderChange}
            isLoading={providersLoading}
            isError={providersError}
            compact
          />
          <button
            type="button"
            onClick={onRefreshTrendMoments}
            disabled={isRefreshingTrendMoments}
            className="creator-control inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-emerald-100 disabled:opacity-50"
            title="Refresh trend moments"
          >
            <RefreshCw size={14} className={isRefreshingTrendMoments ? "animate-spin" : ""} />
            Refresh Trend Moments
          </button>
          {trendsDisabled ? (
            <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-300/20 bg-emerald-400/[0.08] px-3 py-2 text-xs font-bold text-emerald-100">
              <PencilLine size={14} /> Own Topic
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-black/20 p-1">
              <button
                type="button"
                onClick={() => onModeChange?.("trend")}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-bold transition ${
                  mode === "trend" ? "bg-purple-600 text-white" : "text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Flame size={14} /> Show Trends
              </button>
              <button
                type="button"
                onClick={() => onModeChange?.("original")}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-bold transition ${
                  mode === "original" ? "bg-purple-600 text-white" : "text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <PencilLine size={14} /> Go With Own Idea
              </button>
            </div>
          )}
        </div>
      </div>

      {mode === "trend" && !trendsDisabled ? (
        <>
          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <div className="flex flex-wrap items-center gap-2.5">
              {trends.map((trend, index) => {
                const selected = selectedTrendId === trend.id;
                const score = Number(trend.score ?? trend.confidenceScore ?? 0);
                const sizeClass = index % 5 === 0 ? "text-base px-4 py-3" : index % 3 === 0 ? "text-sm px-3.5 py-2.5" : "text-xs px-3 py-2";
                return (
                  <button
                    key={trend.id}
                    type="button"
                    onClick={() => onSelectTrend?.(trend.id)}
                    className={`group inline-flex max-w-full items-center gap-2 rounded-full border font-extrabold transition ${sizeClass} ${
                      selected
                        ? "border-purple-300 bg-purple-500/25 text-white shadow-[0_0_0_1px_rgba(168,85,247,0.22)]"
                        : "border-white/10 bg-white/[0.045] text-slate-300 hover:border-purple-300/40 hover:bg-white/[0.075] hover:text-white"
                    }`}
                  >
                    {selected && <Check size={14} className="shrink-0 text-emerald-200" />}
                    <span className="truncate">{trend.title}</span>
                    <span className="shrink-0 rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                      {score ? score.toFixed(0) : trend.status || "Trend"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Page {page + 1} of {totalPages} - {totalElements} trends</p>
              <p className="mt-1 text-[11px] font-medium text-slate-500">
                Select a trend, save it, then generate 20 story ideas in the workflow.
              </p>
              {savedBriefTitle && <p className="mt-1 truncate text-[11px] font-bold text-emerald-200">Saved: {savedBriefTitle}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={onViewAll} className="creator-control flex items-center gap-1 px-3 py-2 text-xs font-semibold text-purple-200">
                View All <ChevronRight size={14} />
              </button>
              <button
                type="button"
                onClick={() => onPageChange?.(Math.max(0, page - 1))}
                disabled={page <= 0}
                className="creator-control flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-200 disabled:opacity-40"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button
                type="button"
                onClick={() => onPageChange?.(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="creator-control flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-200 disabled:opacity-40"
              >
                Next <ChevronRight size={14} />
              </button>
              <button
                type="button"
                onClick={onSaveTrend}
                disabled={!selectedTrendId || isLockingSelection || isGeneratingIdeas || canGenerateStoryIdeas}
                className="creator-control flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-100 disabled:opacity-50"
              >
                {isLockingSelection ? "Saving..." : canGenerateStoryIdeas ? "Trend Saved" : "Save Trend"}
              </button>
              <button
                type="button"
                onClick={onGenerateStoryIdeas}
                disabled={!canGenerateStoryIdeas || isGeneratingIdeas}
                className="creator-primary flex items-center gap-2 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                {isGeneratingIdeas ? "Generating Ideas..." : "Generate Story Ideas"} <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-white/10 bg-black/20 p-4">
          <div className="mb-4 flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black text-white">Choose a workflow</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-400">
                {isAutonomousProductFlow
                  ? "The product-ad agent prepares the campaign and its production assets for you."
                  : "Move from a saved brief and campaign angle to story, screenplay, storyboard, and video."}
              </p>
            </div>
            <div className="grid grid-cols-2 rounded-lg border border-white/10 bg-black/25 p-1 sm:min-w-[23rem]">
              <button
                type="button"
                onClick={() => onCreativeFlowChange?.("guided")}
                className={`rounded-md px-3 py-2 text-xs font-bold transition ${!isAutonomousProductFlow ? "bg-emerald-500/85 text-white" : "text-slate-400 hover:bg-white/10 hover:text-white"}`}
              >
                Guided angle to video
              </button>
              <button
                type="button"
                onClick={() => onCreativeFlowChange?.("autonomous_product_ad")}
                className={`rounded-md px-3 py-2 text-xs font-bold transition ${isAutonomousProductFlow ? "bg-purple-600 text-white" : "text-slate-400 hover:bg-white/10 hover:text-white"}`}
              >
                Autonomous product ad
              </button>
            </div>
          </div>
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb size={17} className="text-emerald-200" />
            <div>
              <p className="text-sm font-extrabold text-white">
                {isAutonomousProductFlow ? "Autonomous product ad" : hasProductAdInput ? "Guided product or reference brief" : trendsDisabled ? "Write the topic you want to generate content about" : "Write your original idea"}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-400">
                {isAutonomousProductFlow
                  ? "The agent uses the product details below to prepare strategy, concepts, image anchors, audio direction, and a video plan."
                  : hasProductAdInput
                    ? "Use product or reference image links to ground the storyboard and shot generation, then continue through the guided workflow."
                  : trendsDisabled ? "What topic do you want to generate content about? Maximum 50 words." : "Keep it short. Maximum 50 words."}
              </p>
            </div>
          </div>
          <div className="mb-4 rounded-lg border border-emerald-300/15 bg-emerald-400/[0.055] p-3">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-normal text-emerald-200">{isAutonomousProductFlow ? "Product ad agent" : "Product and reference assets"}</p>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  {isAutonomousProductFlow
                    ? "URL, images, or product name are enough. The system returns three campaign concepts before video."
                    : "Optional product and reference images guide the angle and storyboard sketch. They remain separate product anchors for image-led video, never storyboard panels."}
                </p>
              </div>
              <span className="rounded-md border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-black uppercase tracking-normal text-slate-300">
                {isAutonomousProductFlow ? "Agent route" : "Guided route"}
              </span>
            </div>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <label className="block">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Product URL or name</span>
                <input
                  type="text"
                  value={productAdBrief?.productInput || ""}
                  onChange={(event) => updateProductAdBrief("productInput", event.target.value)}
                  placeholder="Example: Nescafe Gold or https://brand.com/products/premium-coffee"
                  className="w-full rounded-lg border border-white/10 bg-[#070b12] px-3 py-2.5 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300/60"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">
                  {isAutonomousProductFlow ? "Product image link" : "Reference product / brand image link"}
                </span>
                <div className="flex min-w-0 gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Link2 size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="url"
                      value={productImageLinkDraft}
                      onChange={(event) => {
                        setProductImageLinkDraft(event.target.value);
                        setProductImageLinkError("");
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter") return;
                        event.preventDefault();
                        addProductImageLink();
                      }}
                      placeholder="https://brand.com/product-front.webp"
                      aria-invalid={Boolean(productImageLinkError)}
                      className="w-full rounded-lg border border-white/10 bg-[#070b12] py-2.5 pl-9 pr-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300/60"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addProductImageLink}
                    disabled={!productImageLinkDraft.trim() || productReferenceCount >= 8}
                    className="creator-control inline-flex shrink-0 items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-emerald-100 disabled:opacity-50"
                  >
                    <Plus size={14} />
                    Add image link
                  </button>
                </div>
                <span className={`mt-1.5 block text-[11px] font-semibold ${productImageLinkError ? "text-red-200" : "text-slate-400"}`}>
                  {productImageLinkError || "Add one public JPG, PNG, or WebP link at a time. Press Enter or use the button."}
                </span>
              </label>
            </div>
            <div className="mt-3">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={productImageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    onUploadProductReferenceImages?.(Array.from(event.target.files || []));
                    event.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => productImageInputRef.current?.click()}
                  disabled={isUploadingProductReferenceImages || productReferenceCount >= 8}
                  className="creator-control inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-emerald-100 disabled:opacity-50"
                  title="Upload product reference images"
                >
                  {isUploadingProductReferenceImages
                    ? <Loader2 size={14} className="animate-spin" />
                    : <ImagePlus size={14} />}
                  {isUploadingProductReferenceImages ? "Uploading..." : "Upload product images"}
                </button>
                <span className="text-[11px] font-semibold text-slate-400">
                  {Math.min(productReferenceCount, 8)}/8 references
                </span>
              </div>
              {(productImageLinks.length > 0 || productImageAssets.length > 0) && (
                <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                  {productImageLinks.map((imageUrl, index) => (
                    <ProductReferencePreview
                      key={`linked-${imageUrl}`}
                      imageUrl={imageUrl}
                      label={`Linked image ${index + 1}`}
                      kind="linked"
                      onRemove={() => removeProductImageLink(imageUrl)}
                    />
                  ))}
                  {productImageAssets.map((asset, index) => {
                    const imageUrl = productAssetUrl(asset);
                    if (!imageUrl || productImageLinks.includes(imageUrl)) return null;
                    return (
                      <ProductReferencePreview
                        key={productAssetKey(asset) || index}
                        imageUrl={imageUrl}
                        label={`Uploaded image ${index + 1}`}
                        kind="uploaded"
                        onRemove={() => removeProductImageAsset(asset)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              <label className="block">
                <span className="mb-1 flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-normal text-slate-500">
                  <span>Ingredients / product details</span>
                  <span>{String(productAdBrief?.ingredientDetails || "").length}/150</span>
                </span>
                <textarea
                  value={productAdBrief?.ingredientDetails || ""}
                  onChange={(event) => updateProductAdBrief("ingredientDetails", event.target.value.slice(0, 150))}
                  rows={3}
                  maxLength={150}
                  placeholder="Example: Double chocolate, roasted peanuts, peanut butter, no artificial colours"
                  className="w-full resize-none rounded-lg border border-white/10 bg-[#070b12] px-3 py-2.5 text-sm font-semibold leading-5 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300/60"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Audience</span>
                <textarea
                  value={productAdBrief?.targetAudience || ""}
                  onChange={(event) => updateProductAdBrief("targetAudience", event.target.value)}
                  rows={3}
                  placeholder="Example: Health-conscious urban professionals, 22-38"
                  className="w-full resize-none rounded-lg border border-white/10 bg-[#070b12] px-3 py-2.5 text-sm font-semibold leading-5 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300/60"
                />
              </label>
              <label className="block">
                <span className="mb-1 flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-normal text-slate-500">
                  <span>Campaign objective</span>
                  <span>{String(productAdBrief?.campaignObjective || "").length}/240</span>
                </span>
                <textarea
                  value={productAdBrief?.campaignObjective || ""}
                  onChange={(event) => updateProductAdBrief("campaignObjective", event.target.value.slice(0, 240))}
                  rows={3}
                  maxLength={240}
                  placeholder="Example: Convince first-time buyers that this is a satisfying everyday snack without compromising their health goals."
                  className="w-full resize-none rounded-lg border border-white/10 bg-[#070b12] px-3 py-2.5 text-sm font-semibold leading-5 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300/60"
                />
                <span className="mt-1.5 block text-[11px] font-semibold text-slate-400">
                  Write a complete sentence. It guides the hook, narrative, proof, CTA, and production prompts.
                </span>
              </label>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 border-l-2 border-cyan-300/45 bg-cyan-400/[0.055] px-3 py-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-normal text-cyan-100">Ad tone</p>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                  AI selects the tone from the product images, ingredients, audience, and objective.
                </p>
              </div>
              {productAdBrief?.adTone && (
                <span className="text-right text-xs font-bold text-cyan-100">{productAdBrief.adTone}</span>
              )}
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <label className="block">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-slate-500">Ad format</span>
                <select
                  value={selectedProductAdFormat?.value || ""}
                  onChange={(event) => selectProductAdFormat(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#070b12] px-3 py-2.5 text-sm font-semibold text-white outline-none transition focus:border-emerald-300/60"
                >
                  {productAdFormatOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {selectedProductAdFormat?.description && (
                  <span className="mt-1.5 block text-[11px] font-medium leading-4 text-slate-400">{selectedProductAdFormat.description}</span>
                )}
                {selectedProductAdPlaybook?.structure && (
                  <span className="mt-1.5 block text-[11px] font-semibold leading-4 text-emerald-200">{selectedProductAdPlaybook.structure}</span>
                )}
              </label>
              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-normal text-slate-500">Visual shot recipe</span>
                  <span className="text-[10px] font-bold text-slate-500">{isAutoProductShotRecipe ? "AI planned" : "Custom"}</span>
                </div>
                <select
                  value=""
                  onChange={(event) => addProductShotType(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#070b12] px-3 py-2.5 text-sm font-semibold text-white outline-none transition disabled:opacity-50 focus:border-emerald-300/60"
                >
                  <option value="">Choose shot planning</option>
                  <option value="__auto__">Plan automatically from the product</option>
                  {productAdShotTypeOptions
                    .filter((option) => !productAdBrief?.noHumans || !["action_shot", "lifestyle_shot"].includes(option.value))
                    .filter((option) => !selectedProductShotTypes.some((selected) => selected.value === option.value))
                    .map((option) => (
                      <option key={option.value} value={option.value}>{option.label} - {option.description}</option>
                    ))}
                </select>
                <div className="mt-2 flex min-h-8 flex-wrap gap-1.5">
                  {isAutoProductShotRecipe && (
                    <span className="inline-flex items-center rounded-md border border-cyan-300/20 bg-cyan-400/[0.08] px-2 py-1 text-[10px] font-bold text-cyan-100">
                      AI will choose shots from product type, materials, packaging, and ad format
                    </span>
                  )}
                  {selectedProductShotTypes.map((option) => (
                    <span key={option.value} className="inline-flex items-center gap-1 rounded-md border border-emerald-300/20 bg-emerald-400/[0.08] px-2 py-1 text-[10px] font-bold text-emerald-100">
                      {option.label}
                      <button
                        type="button"
                        onClick={() => removeProductShotType(option.value)}
                        className="inline-flex h-4 w-4 items-center justify-center rounded text-emerald-100 hover:bg-emerald-300/15"
                        title={`Remove ${option.label}`}
                        aria-label={`Remove ${option.label}`}
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
              <input
                type="checkbox"
                checked={Boolean(productAdBrief?.noHumans)}
                onChange={(event) => setNoHumans(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-emerald-400"
              />
              <span>
                <span className="block text-xs font-bold text-white">No humans in any shot</span>
                <span className="mt-1 block text-[11px] font-semibold leading-5 text-slate-400">Use product-only CGI, ingredients, environments, motion, and off-screen voiceover. Faces, hands, bodies, silhouettes, and human reflections are excluded.</span>
              </span>
            </label>
            <div className="mt-3 flex flex-col gap-2 rounded-lg border border-white/10 bg-black/20 p-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold text-white">{isAutonomousProductFlow ? "Autonomous product ad pipeline" : "Reference images in the guided workflow"}</p>
                <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-400">
                  {isAutonomousProductFlow
                    ? "Prepare the product brief, campaign concepts, image anchors, dialogue, SRT, and music guidance in one job."
                    : "Save your brief, select an AI campaign angle, then generate ideas. The storyboard images become reference anchors for per-shot video generation."}
                </p>
                {isAutonomousProductFlow && productAdPipelineStatus && (
                  <p className="mt-1 text-[11px] font-bold text-emerald-200">
                    {productAdPipelineStatus} {productAdPipelineProgress ? `- ${productAdPipelineProgress}%` : ""} {productAdPipelineJob?.message ? `- ${productAdPipelineJob.message}` : ""}
                  </p>
                )}
              </div>
              {isAutonomousProductFlow && (
                <button
                  type="button"
                  onClick={onGenerateProductAdPipeline}
                  disabled={!canGenerateProductAdPipeline || isGeneratingProductAdPipeline}
                  className="creator-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  <Sparkles size={14} />
                  {isGeneratingProductAdPipeline ? "Running agent..." : "Run Product Ad Agent"}
                </button>
              )}
            </div>
          </div>
          {hasProductAdInput && (
            <p className="mb-1 text-[10px] font-black uppercase tracking-normal text-slate-500">Campaign direction</p>
          )}
          <textarea
            ref={originalIdeaRef}
            value={originalIdea}
            onChange={(event) => {
              const next = limitWords(event.target.value, 50);
              onOriginalIdeaChange?.(next);
            }}
            rows={4}
            placeholder={hasProductAdInput
              ? "Optional: Mention offer, audience, launch goal, claims to avoid, dialogue or voiceover direction, and desired tone."
              : trendsDisabled
                ? "Example: A short-form video about a beginner learning AI tools to save time in daily work."
                : "Example: A shy beginner enters the gym for the first time and turns one nervous moment into a funny confidence win."}
            className="w-full resize-none rounded-lg border border-white/10 bg-[#070b12] px-3 py-3 text-sm font-semibold leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-purple-400/60"
          />
          <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
            {topicTypeOptions.length > 0 && (
              <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-black uppercase tracking-normal text-slate-500">Topic type</p>
                  {selectedTopicType?.hint && (
                    <span className="truncate text-[11px] font-bold text-emerald-200">{selectedTopicType.hint}</span>
                  )}
                </div>
                <div className="custom-scrollbar grid max-h-[15.5rem] gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
                  {topicTypeOptions.map((option) => {
                    const selected = option.value === topicType;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => onTopicTypeChange?.(option.value)}
                        className={`min-h-[2.65rem] rounded-md border px-2.5 py-2 text-left transition ${
                          selected
                            ? "border-emerald-300/45 bg-emerald-400/[0.12] text-white"
                            : "border-white/10 bg-black/20 text-slate-300 hover:border-emerald-300/30 hover:bg-white/[0.06]"
                        }`}
                      >
                        <span className="flex items-center gap-1.5 text-xs font-black">
                          {selected ? <Check size={13} className="text-emerald-200" /> : <Lightbulb size={13} className="text-slate-500" />}
                          <span className="truncate">{option.label}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {productionStyleOptions.length > 0 && (
              <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-black uppercase tracking-normal text-slate-500">Production style</p>
                  {selectedProductionStyle?.hint && (
                    <span className="truncate text-[11px] font-bold text-purple-200">{selectedProductionStyle.hint}</span>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  {productionStyleOptions.map((option) => {
                    const selected = option.value === productionStyle;
                    const Icon = option.value === "full_ai" ? Sparkles : Clapperboard;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => onProductionStyleChange?.(option.value)}
                        className={`flex min-h-[4rem] items-center gap-3 rounded-md border px-3 py-2 text-left transition ${
                          selected
                            ? "border-purple-300/45 bg-purple-500/[0.16] text-white"
                            : "border-white/10 bg-black/20 text-slate-300 hover:border-purple-300/35 hover:bg-white/[0.06]"
                        }`}
                      >
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${selected ? "bg-purple-500 text-white" : "bg-white/[0.06] text-slate-400"}`}>
                          <Icon size={16} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-black">{option.label}</span>
                          <span className="mt-0.5 block text-xs font-semibold leading-5 text-slate-400">{option.hint}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                {productionStyle === "hybrid" && hybridSceneModeOptions.length > 0 && (
                  <div className="mt-3 rounded-md border border-white/10 bg-black/20 p-2">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-[10px] font-black uppercase tracking-normal text-slate-500">Hybrid scenes</p>
                      {selectedHybridSceneMode?.hint && (
                        <span className="truncate text-[11px] font-bold text-cyan-200">{selectedHybridSceneMode.hint}</span>
                      )}
                    </div>
                    <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-1">
                      {hybridSceneModeOptions.map((option) => {
                        const selected = option.value === hybridSceneMode;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => onHybridSceneModeChange?.(option.value)}
                            className={`rounded-md border px-2.5 py-2 text-left transition ${
                              selected
                                ? "border-cyan-300/45 bg-cyan-400/[0.12] text-white"
                                : "border-white/10 bg-white/[0.035] text-slate-300 hover:border-cyan-300/35 hover:bg-white/[0.06]"
                            }`}
                          >
                            <span className="block text-xs font-black">{option.label}</span>
                            <span className="mt-0.5 line-clamp-1 block text-[11px] font-semibold text-slate-400">{option.hint}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {(brollStyleOptions.length > 0 || captionStyleOptions.length > 0) && (
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {brollStyleOptions.length > 0 && (
                <StyleChoiceGroup
                  label="Stylized B-roll"
                  value={brollStyle}
                  options={brollStyleOptions}
                  onChange={onBrollStyleChange}
                />
              )}
              {captionStyleOptions.length > 0 && (
                <StyleChoiceGroup
                  label="Caption style"
                  value={captionStyle}
                  options={captionStyleOptions}
                  onChange={onCaptionStyleChange}
                />
              )}
            </div>
          )}

          {!isAutonomousProductFlow && (
          <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.035] p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-emerald-200" />
                <p className="text-[10px] font-black uppercase tracking-normal text-slate-500">AI campaign angles</p>
              </div>
              <button
                type="button"
                onClick={onGenerateCampaignAngles}
                disabled={!canGenerateCampaignAngles || isGeneratingCampaignAngles}
                className="creator-control inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-emerald-100 disabled:opacity-50"
              >
                <Sparkles size={13} /> {isGeneratingCampaignAngles ? "Generating..." : topicIdeaSuggestions.length ? "Refresh angles" : "Generate angles"}
              </button>
            </div>
            {topicIdeaSuggestions.length > 0 ? (
              <div className="grid gap-2 md:grid-cols-3">
                {topicIdeaSuggestions.slice(0, 3).map((suggestion) => {
                  const selected = selectedCampaignAngle?.id === suggestion.id
                    || (selectedCampaignAngle?.title && selectedCampaignAngle.title === suggestion.title);
                  return (
                  <button
                    key={suggestion.id || `${suggestion.title}-${suggestion.description}`}
                    type="button"
                    onClick={() => onSelectCampaignAngle?.(suggestion)}
                    aria-pressed={selected}
                    className={`min-h-[5.5rem] rounded-md border px-3 py-2 text-left transition ${
                      selected
                        ? "border-emerald-300/55 bg-emerald-400/[0.12]"
                        : "border-white/10 bg-black/20 hover:border-emerald-300/35 hover:bg-white/[0.06]"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-sm font-black text-white">
                      {selected && <Check size={13} className="text-emerald-200" />}
                      {suggestion.title}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-xs font-semibold leading-5 text-slate-400">{suggestion.description}</span>
                  </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs font-semibold text-slate-500">Save this brief to unlock AI campaign angles.</p>
            )}
          </div>
          )}
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className={`text-xs font-bold ${originalWords > 50 ? "text-red-200" : "text-slate-500"}`}>
                {originalWords}/50 words
              </p>
              {savedBriefTitle && <p className="mt-1 truncate text-[11px] font-bold text-emerald-200">Saved: {savedBriefTitle}</p>}
            </div>
            {!isAutonomousProductFlow && <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onSaveOriginalIdea?.(originalIdea.trim())}
                disabled={!originalIdeaValid || isLockingSelection || isGeneratingIdeas || canGenerateStoryIdeas}
                className="creator-control flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-100 disabled:opacity-50"
              >
                {isLockingSelection ? "Saving..." : canGenerateStoryIdeas ? (hasProductAdInput ? "Product Brief Saved" : trendsDisabled ? "Topic Saved" : "Idea Saved") : hasProductAdInput ? "Save Product Brief" : trendsDisabled ? "Save Topic" : "Save Idea"}
              </button>
              <button
                type="button"
                onClick={onGenerateStoryIdeas}
                disabled={!canGenerateStoryIdeas || isGeneratingIdeas}
                className="creator-primary flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              >
                {isGeneratingIdeas ? "Generating Ideas..." : "Generate Story Ideas"} <ChevronRight size={14} />
              </button>
            </div>
            }
          </div>
        </div>
      )}
    </section>
  );
}

function countWords(value) {
  return String(value || "").trim().split(/\s+/).filter(Boolean).length;
}

function limitWords(value, maxWords) {
  const words = String(value || "").split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return value;
  return words.slice(0, maxWords).join(" ");
}

function buildSuggestedIdeaText(originalIdea, suggestion = {}) {
  const base = String(originalIdea || "").trim();
  const angle = String(suggestion.title || "").trim();
  const description = String(suggestion.description || "").trim();
  if (base) return `${base}. Angle: ${angle}. ${description}`;
  return `${angle}: ${description}`;
}

function productAssetUrl(asset = {}) {
  return String(
    asset?.assetUrl
    || asset?.signedUrl
    || asset?.publicUrl
    || asset?.imageUrl
    || asset?.url
    || ""
  ).trim();
}

function productAssetKey(asset = {}) {
  const bucket = String(asset?.bucket || "").trim();
  const objectKey = String(asset?.objectKey || asset?.object_key || "").trim();
  return bucket && objectKey ? `${bucket}/${objectKey}` : productAssetUrl(asset);
}

function splitProductImageLinks(value) {
  return String(value || "")
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, all) => all.indexOf(item) === index);
}

function ProductReferencePreview({ imageUrl, label, kind, onRemove }) {
  const [status, setStatus] = useState(kind === "uploaded" ? "ready" : "checking");

  useEffect(() => {
    setStatus(kind === "uploaded" ? "ready" : "checking");
  }, [imageUrl, kind]);

  const statusLabel = status === "error"
    ? "Check URL"
    : kind === "uploaded"
      ? "Uploaded"
      : status === "ready"
      ? "Ready"
      : "Checking";

  return (
    <div className="overflow-hidden rounded-md border border-white/10 bg-[#070b12]">
      <div className="relative aspect-square bg-black/25">
        <img
          src={imageUrl}
          alt={label}
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setStatus("ready")}
          onError={() => setStatus("error")}
          className={`h-full w-full object-contain ${status === "error" ? "invisible" : ""}`}
        />
        {status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center px-2 text-center text-[10px] font-bold text-red-200">
            Preview unavailable
          </div>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-md border border-white/15 bg-black/75 text-white hover:bg-black"
          title={`Remove ${label.toLowerCase()}`}
          aria-label={`Remove ${label.toLowerCase()}`}
        >
          <X size={13} />
        </button>
      </div>
      <div className="flex h-7 items-center gap-1.5 border-t border-white/10 px-2">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${
          status === "error" ? "bg-red-400" : status === "checking" ? "bg-amber-300" : "bg-emerald-400"
        }`} />
        <span className={`truncate text-[10px] font-bold ${
          status === "error" ? "text-red-200" : status === "checking" ? "text-amber-100" : "text-emerald-100"
        }`}>
          {statusLabel}
        </span>
      </div>
    </div>
  );
}

function StyleChoiceGroup({ label, value, options = [], onChange }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
      <p className="mb-2 text-[10px] font-black uppercase tracking-normal text-slate-500">{label}</p>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange?.(option.value)}
              className={`min-h-[3.75rem] rounded-md border px-2.5 py-2 text-left transition ${
                selected
                  ? "border-emerald-300/45 bg-emerald-400/[0.12] text-white"
                  : "border-white/10 bg-black/20 text-slate-300 hover:border-emerald-300/30 hover:bg-white/[0.06]"
              }`}
            >
              <span className="block text-xs font-black">{option.label}</span>
              <span className="mt-0.5 line-clamp-2 block text-[11px] font-semibold leading-4 text-slate-400">{option.hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
