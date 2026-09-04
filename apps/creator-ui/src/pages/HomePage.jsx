// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Copy,
  Film,
  ImagePlus,
  Scissors,
  Search,
  TrendingUp,
  Users,
  Wallet,
  Wand2,
  X,
} from "lucide-react";
import { selectTenantId, showFlash } from "@dalaillama/shared-store";
import {
  useCreateProjectRequirementMutation,
  useGenerateTrendReportMutation,
  useGetVideoPricingQuoteQuery,
  useListBrandsQuery,
  useListPreProductionProjectsQuery,
  useListProjectRequirementsQuery,
  useListTrendReportsQuery,
} from "../api/creatorEndpoints.js";

// Auto-generated once per tenant (only when they have zero trend reports yet) so the home page
// cloud has real content without asking the creator to pick a topic first -- trend-intelligence-
// service's /v1/trend-reports is topic-scoped generation, not a generic "what's trending" feed
// the way creator-service's (currently un-deployed) /creator/trends was meant to be.
const DEFAULT_TREND_TOPIC = "Trending short-form video ad ideas in India right now";

// The 6 real values of pre-production-service's ProjectStatus enum -- no "needs review" or
// "failed" project-level status exists; that lives one level down on ShotStatus. CLIENT_LOCKED
// was missing here (a real gap, not a deliberate omission) -- any locked project silently fell
// back to the DRAFT style below and displayed as "Draft" regardless of its real status.
const STATUS_STYLES = {
  DRAFT: { label: "Draft", dot: "#94a3b8", bg: "rgba(148,163,184,0.16)", text: "#e2e8f0" },
  SCRIPT_READY: { label: "Script ready", dot: "#f5f3ff", bg: "rgba(124,77,255,0.85)", text: "#f5f3ff" },
  SCREENPLAY_READY: { label: "Screenplay ready", dot: "#f5f3ff", bg: "rgba(124,77,255,0.85)", text: "#f5f3ff" },
  SHOT_LIST_READY: { label: "Shot list ready", dot: "#f5f3ff", bg: "rgba(124,77,255,0.85)", text: "#f5f3ff" },
  IN_PRODUCTION: { label: "In production", dot: "#ecfdf5", bg: "rgba(16,185,129,0.85)", text: "#ecfdf5" },
  // CLIENT_LOCKED means the client has paid and locked in the project -- shown as "Funded" to
  // match the same label a project-requirement gets once its own funded flag flips, since both
  // represent the same "client has paid" milestone to a creator, just at different pipeline
  // stages (brief vs. real pre-production Project).
  CLIENT_LOCKED: { label: "Funded", dot: "#ecfdf5", bg: "rgba(16,185,129,0.85)", text: "#ecfdf5" },
  // Not real ProjectStatus values -- these describe a ProjectRequirement (a brief that hasn't
  // become a pre-production Project yet, see createProjectRequirement's own note on that gap).
  AWAITING_FUNDING: { label: "Awaiting funding", dot: "#94a3b8", bg: "rgba(148,163,184,0.16)", text: "#e2e8f0" },
  FUNDED: { label: "Funded", dot: "#ecfdf5", bg: "rgba(16,185,129,0.85)", text: "#ecfdf5" },
  IDEA_LOCKED: { label: "Idea locked", dot: "#f5f3ff", bg: "rgba(124,77,255,0.85)", text: "#f5f3ff" },
};

// Common creator-ui languages for the Start New Idea modal's multi-language picker -- a custom
// language can still be typed into "Other" since this list is a shortcut, not a hard enum.
const COMMON_LANGUAGES = ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam", "Bengali", "Marathi"];

function relativeTime(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffSec = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (diffSec < 45) return "just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay === 1) return "yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;
  return new Date(iso).toLocaleDateString();
}

export default function HomePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth?.user);
  const firstName = (user?.name || user?.email || "there").split(" ")[0].split("@")[0];

  // "Recent projects" is real pre-production Projects only -- briefs that haven't become one yet
  // (funded or not) live in their own separate list below (see briefsModalOpen) rather than
  // cluttering the main projects view with things that aren't in production yet.
  const { data: projects = [], isFetching: projectsLoading } = useListPreProductionProjectsQuery();
  // Polled -- a client funds a brief from a separate device via the public share link, so this
  // tab has no other signal that `funded` flipped besides re-fetching (same interval
  // ProjectRequirementPage already polls a single requirement at).
  const { data: allRequirements = [], isFetching: requirementsLoading } = useListProjectRequirementsQuery(undefined, {
    pollingInterval: 5000,
  });
  // Once a requirement's idea is locked it's a real pre-production Project (shown in "Recent
  // projects" above, via `projects`) -- keep it out of the Briefs list too, otherwise the same
  // underlying work shows up twice with two different statuses instead of once with its latest one.
  const requirements = useMemo(
    () => allRequirements.filter((requirement) => !requirement.lockedProjectId),
    [allRequirements],
  );
  const [briefsModalOpen, setBriefsModalOpen] = useState(false);
  const awaitingFundingCount = useMemo(
    () => requirements.filter((requirement) => !requirement.funded).length,
    [requirements],
  );
  const { data: trendReports = [], isFetching: trendReportsLoading } = useListTrendReportsQuery();
  const [generateTrendReport, { isLoading: generatingTrendReport }] = useGenerateTrendReportMutation();
  const trendsLoading = trendReportsLoading || generatingTrendReport;
  // A ref, not mutation/query loading state, gates this -- generateTrendReport's own invalidatesTags
  // refetches the list on every attempt (success OR failure), which flips trendReportsLoading and
  // re-runs an effect keyed on it. Gating on that loading state alone caused a runaway retry loop
  // (a real LLM call fired on every refetch cycle, dozens of times a minute) the first time this
  // shipped. A ref set synchronously before the call, checked before anything else, guarantees at
  // most one generation attempt per mount no matter how the query/mutation state churns afterward.
  const attemptedTrendGeneration = useRef(false);

  useEffect(() => {
    if (attemptedTrendGeneration.current) return;
    if (trendReportsLoading || trendReports.length > 0) return;
    attemptedTrendGeneration.current = true;
    generateTrendReport({ topic: DEFAULT_TREND_TOPIC }).catch(() => {
      // Silent -- the "Trending now" section just stays hidden if generation fails, same as any
      // other optional home-page widget with no data yet.
    });
  }, [trendReportsLoading, trendReports.length, generateTrendReport]);

  const [brief, setBrief] = useState("");
  const [projectsModalOpen, setProjectsModalOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const openProjects = () => setProjectsModalOpen(true);
    window.addEventListener("creator:open-projects", openProjects);
    return () => window.removeEventListener("creator:open-projects", openProjects);
  }, []);
  const tenantId = useSelector(selectTenantId);
  const [modalStep, setModalStep] = useState("form"); // "form" | "success"
  const [targetAudience, setTargetAudience] = useState("");
  const [campaignDirection, setCampaignDirection] = useState("");
  const [durationSeconds, setDurationSeconds] = useState("30");
  const [languages, setLanguages] = useState(["English"]);
  const durationSecondsNumber = Number(durationSeconds);
  const validDuration = Number.isFinite(durationSecondsNumber) && durationSecondsNumber > 0;
  // Live estimate (platform per-second rate x seconds, plus the creator's own marginPercent from
  // Wallet & Billing) shown while typing -- the real, authoritative price is snapshotted server-
  // side when the requirement is actually created.
  const { data: priceQuote } = useGetVideoPricingQuoteQuery(
    { tenantId, durationSeconds: durationSecondsNumber },
    { skip: !tenantId || !validDuration },
  );
  const toggleLanguage = (language) => {
    setLanguages((current) =>
      current.includes(language) ? current.filter((entry) => entry !== language) : [...current, language],
    );
  };
  // Optional: included client review rounds for this project before the paywall (default 2).
  const [reviewAllowance, setReviewAllowance] = useState("");
  const [referenceFile, setReferenceFile] = useState(null);
  const [shareUrl, setShareUrl] = useState("");
  const [createdRequirementId, setCreatedRequirementId] = useState("");
  const [createdPrice, setCreatedPrice] = useState(null);
  const fileInputRef = useRef(null);

  // Brand picker: a tenant can manage several brands now (see BrandContextService), so this is an
  // explicit choice, not a blind inline upsert onto "the" brand. `selectedBrandId` is one of:
  // "" (no brand), an existing brand's id, or the literal "new" sentinel (reveals the inline
  // create-a-brand fields below, same collapsed-by-default UX the reference image already has).
  const { data: brands = [] } = useListBrandsQuery();
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandIndustry, setBrandIndustry] = useState("");
  const [brandVoice, setBrandVoice] = useState("");
  const [brandAudience, setBrandAudience] = useState("");
  const [brandValues, setBrandValues] = useState("");

  // Optional product + reference material, stored at creation time and analyzed once the
  // requirement is funded (see ReferenceMaterialAnalysisService on the backend). productImages
  // are images of the actual product (requires productName); projectReferenceImages are "what
  // the client has in mind" -- unrelated to any product.
  const [showProductFields, setShowProductFields] = useState(false);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productImageFiles, setProductImageFiles] = useState([]);
  const [projectReferenceFiles, setProjectReferenceFiles] = useState([]);

  const [createProjectRequirement, { isLoading: creating }] = useCreateProjectRequirementMutation();

  const trendCloud = useMemo(() => {
    const predictions = trendReports[0]?.predictions || [];
    return predictions.map((prediction, index) => ({
      id: `trend-${index}`,
      title: prediction?.title || "Trend",
      score: Math.round(Number(prediction?.confidenceScore || 0) * 100),
    }));
  }, [trendReports]);

  const pickTrend = (trend) => {
    setBrief(trend.title);
    openModal();
  };

  const openModal = () => {
    setModalStep("form");
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setModalStep("form");
  };

  const handleCreate = async () => {
    if (!brief.trim()) {
      dispatch(showFlash({ message: "Add a brief before creating the link", type: "error" }));
      return;
    }
    if (!validDuration) {
      dispatch(showFlash({ message: "Enter how many seconds the video should be", type: "error" }));
      return;
    }
    if (languages.length === 0) {
      dispatch(showFlash({ message: "Pick at least one language", type: "error" }));
      return;
    }
    try {
      // Exactly one of brandId (an existing brand) or brandContext (create a brand-new brand) is
      // sent -- see CreateStandaloneRequirementRequest's javadoc. Picking "no brand" sends neither.
      const brandId = selectedBrandId && selectedBrandId !== "new" ? selectedBrandId : undefined;
      const brandContext = selectedBrandId === "new" && brandName.trim()
        ? {
            brandName: brandName.trim(),
            industry: brandIndustry.trim() || undefined,
            brandVoice: brandVoice.trim() || undefined,
            targetAudience: brandAudience.trim() || undefined,
            brandValues: brandValues.trim() || undefined,
          }
        : undefined;

      const productDetails = productName.trim()
        ? {
            name: productName.trim(),
            description: productDescription.trim() || undefined,
            category: productCategory.trim() || undefined,
          }
        : undefined;

      const requirement = await createProjectRequirement({
        briefText: brief.trim(),
        targetAudience: targetAudience.trim(),
        campaignDirection: campaignDirection.trim(),
        durationSeconds: durationSecondsNumber,
        languages,
        // Optional; blank -> backend default of 2 included reviews for the project.
        reviewAllowance: reviewAllowance.trim() === "" ? undefined : Math.max(0, Number(reviewAllowance)),
        brandId,
        brandContext,
        image: referenceFile || undefined,
        productDetails,
        productImages: productDetails ? productImageFiles : undefined,
        projectReferenceImages: projectReferenceFiles,
      }).unwrap();

      const shareToken = requirement?.shareToken;
      setShareUrl(shareToken ? `${window.location.origin}/brief/${shareToken}` : "");
      setCreatedRequirementId(requirement?.id || "");
      setCreatedPrice(
        requirement?.quotedTotalPrice != null
          ? { amount: requirement.quotedTotalPrice, currency: requirement.quotedCurrency }
          : null,
      );
      setModalStep("success");
    } catch (err) {
      dispatch(showFlash({ message: err?.data?.message || err?.message || "Could not create the brief", type: "error" }));
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      dispatch(showFlash({ message: "Link copied", type: "success" }));
    } catch {
      dispatch(showFlash({ message: shareUrl, type: "info" }));
    }
  };

  const comingSoon = (label) => dispatch(showFlash({ message: `${label} is coming soon`, type: "info" }));

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Good to see you, {firstName}</h1>
          <p className="mt-1.5 text-sm font-medium text-slate-400">Start something new below, or pick up where you left off</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button type="button" aria-label="Search" className="creator-control flex h-10 w-10 items-center justify-center text-slate-300">
            <Search size={18} />
          </button>
          <button type="button" aria-label="Notifications" className="creator-control relative flex h-10 w-10 items-center justify-center text-slate-300">
            <Bell size={18} />
          </button>
        </div>
      </div>

      {/* Quick idea capture */}
      <div className="creator-panel mb-7 p-5">
        <div className="mb-3.5 flex items-start gap-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-purple-600/20 text-purple-300">
            <Wand2 size={16} />
          </span>
          <div>
            <p className="text-[15px] font-extrabold text-white">Start a new idea</p>
            <p className="mt-0.5 text-xs font-medium text-slate-400">Jot it down, or pick a trend below — add the rest when you hit New</p>
          </div>
        </div>

        <textarea
          rows={2}
          value={brief}
          onChange={(event) => setBrief(event.target.value)}
          placeholder={'What’s this video about? e.g. “A 30-second launch film for our new vitamin-C serum, aimed at 25-35 year old urban women…”'}
          className="creator-input mb-3.5 w-full resize-y px-3 py-3 text-[13px]"
        />

        {(trendsLoading || trendCloud.length > 0) && (
          <div className="mb-3.5 border-t border-white/10 pt-3.5">
            <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
              <TrendingUp size={13} />
              Trending now — tap one to start a video
            </p>
            {trendsLoading && trendCloud.length === 0 ? (
              <p className="text-xs font-semibold text-slate-500">Loading trends…</p>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {trendCloud.map((trend, index) => {
                  const sizeClass = index % 5 === 0 ? "text-sm px-4 py-2.5" : index % 3 === 0 ? "text-xs px-3.5 py-2" : "text-[11px] px-3 py-1.5";
                  return (
                    <button
                      key={trend.id}
                      type="button"
                      onClick={() => pickTrend(trend)}
                      className={`inline-flex max-w-full items-center gap-2 rounded-full border font-extrabold transition ${sizeClass} border-amber-400/20 bg-amber-400/10 text-amber-200 hover:border-amber-400/40 hover:bg-amber-400/15`}
                    >
                      <span className="truncate">{trend.title}</span>
                      {trend.score > 0 && (
                        <span className="shrink-0 rounded-full bg-black/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300/80">
                          {trend.score.toFixed(0)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <button type="button" onClick={openModal} className="creator-primary flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold text-white">
            New
            <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* Recent projects */}
      <div className="mb-3.5 flex items-center justify-between">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-purple-300">Recent projects</p>
        {requirements.length > 0 && (
          <button type="button" onClick={() => setBriefsModalOpen(true)} className="text-[11px] font-bold text-slate-400 hover:text-purple-300">
            Briefs{awaitingFundingCount > 0 ? ` — ${awaitingFundingCount} awaiting payment` : ""}
          </button>
        )}
      </div>
      <div className="creator-panel mb-7 p-1.5">
        {projectsLoading && projects.length === 0 && <p className="px-3 py-4 text-xs font-semibold text-slate-500">Loading projects…</p>}
        {!projectsLoading && projects.length === 0 && (
          <p className="px-3 py-4 text-xs font-semibold text-slate-500">No projects yet — start one above.</p>
        )}
        {projects.slice(0, 6).map((project) => {
          const style = STATUS_STYLES[project.status] || STATUS_STYLES.DRAFT;
          return (
            <div key={project.id} className="flex items-center gap-3 rounded-md px-3 py-2.5 transition hover:bg-white/[0.03]">
              <span
                className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide"
                style={{ background: style.bg, color: style.text }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: style.dot }} />
                {style.label}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-slate-100">{project.name}</span>
              <span className="flex-shrink-0 text-[11px] font-semibold text-slate-500">{relativeTime(project.createdAt)}</span>
              <button
                type="button"
                onClick={() => navigate(`/projects/${project.id}`)}
                className="flex flex-shrink-0 items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-slate-100 hover:border-purple-400/40 hover:bg-purple-500/10"
              >
                Open
                <ArrowRight size={13} />
              </button>
            </div>
          );
        })}
        {projects.length > 0 && (
          <button
            type="button"
            onClick={() => setProjectsModalOpen(true)}
            className="w-full rounded-md py-2.5 text-center text-xs font-bold text-purple-300 hover:text-purple-200"
          >
            View all projects
          </button>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        <QuickAction icon={TrendingUp} label="Trend report" color="amber" onClick={() => comingSoon("Trend report")} />
        <QuickAction icon={Users} label="Cast library" color="purple" onClick={() => navigate({ pathname: "/planner", hash: "cast" })} />
        <QuickAction icon={Scissors} label="AI editor" color="sky" onClick={() => navigate("/editor")} />
        <QuickAction icon={Film} label="Dub a video" color="rose" onClick={() => comingSoon("Standalone dubbing")} />
        <QuickAction icon={Wallet} label="Wallet & billing" color="emerald" onClick={() => window.dispatchEvent(new CustomEvent("creator:open-recharge"))} />
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={closeModal}>
          <div className="creator-panel max-h-full w-full max-w-lg overflow-y-auto p-6" onClick={(event) => event.stopPropagation()}>
            {modalStep === "form" && (
              <>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-purple-600/20 text-purple-300">
                      <Wand2 size={16} />
                    </span>
                    <div>
                      <p className="text-[15px] font-extrabold text-white">Start a new idea</p>
                      <p className="mt-0.5 text-xs font-medium text-slate-400">
                        Creates a project brief straight away — no branding chat required.
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={closeModal} aria-label="Close" className="creator-control flex h-8 w-8 flex-shrink-0 items-center justify-center text-slate-400">
                    <X size={15} />
                  </button>
                </div>

                <textarea
                  rows={3}
                  value={brief}
                  onChange={(event) => setBrief(event.target.value)}
                  placeholder="What's this video about?"
                  className="creator-input mb-3 w-full resize-y px-3 py-3 text-[13px]"
                />

                <div className="mb-3 flex items-center gap-2.5">
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(event) => setTargetAudience(event.target.value)}
                    placeholder="Target audience (optional)"
                    className="creator-input flex-1 px-3 py-2.5 text-xs font-semibold"
                  />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={durationSeconds}
                    onChange={(event) => setDurationSeconds(event.target.value)}
                    placeholder="Seconds"
                    title="How many seconds long the finished video should be -- priced per second"
                    className="creator-input w-24 px-3 py-2.5 text-xs font-semibold"
                  />
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={reviewAllowance}
                    onChange={(event) => setReviewAllowance(event.target.value)}
                    placeholder="Reviews (2)"
                    title="How many client review rounds are included before the paywall (optional, default 2)"
                    className="creator-input w-24 px-3 py-2.5 text-xs font-semibold"
                  />
                </div>

                {validDuration && priceQuote?.totalPrice != null && (
                  <p className="mb-3 text-xs font-semibold text-emerald-300">
                    Estimated price: {priceQuote.currency} {Number(priceQuote.totalPrice).toFixed(2)}
                    <span className="ml-1 font-medium text-slate-500">
                      ({priceQuote.currency} {Number(priceQuote.platformCost).toFixed(2)} platform + your{" "}
                      {Number(priceQuote.creatorMarginPercent).toFixed(0)}% margin)
                    </span>
                  </p>
                )}

                <p className="mb-2 text-xs font-bold text-slate-300">Languages</p>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {COMMON_LANGUAGES.map((language) => {
                    const selected = languages.includes(language);
                    return (
                      <button
                        key={language}
                        type="button"
                        onClick={() => toggleLanguage(language)}
                        className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                          selected
                            ? "border-purple-400/50 bg-purple-500/20 text-purple-200"
                            : "border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20"
                        }`}
                      >
                        {language}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  rows={2}
                  value={campaignDirection}
                  onChange={(event) => setCampaignDirection(event.target.value)}
                  placeholder="Campaign direction (optional) — tone, references, must-haves…"
                  className="creator-input mb-3 w-full resize-y px-3 py-3 text-[13px]"
                />

                <div className="mb-3.5">
                  <label className="mb-1.5 block text-[11px] font-bold text-slate-400">Brand (optional)</label>
                  <select
                    value={selectedBrandId}
                    onChange={(event) => setSelectedBrandId(event.target.value)}
                    className="creator-input w-full px-3 py-2.5 text-xs font-semibold"
                  >
                    <option value="">No brand</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>{brand.brandName}</option>
                    ))}
                    <option value="new">+ New brand…</option>
                  </select>
                </div>

                {selectedBrandId === "new" && (
                  <div className="mb-3.5 space-y-2.5 rounded-lg border border-white/10 bg-white/[0.02] p-3">
                    <input
                      type="text"
                      value={brandName}
                      onChange={(event) => setBrandName(event.target.value)}
                      placeholder="Brand name"
                      className="creator-input w-full px-3 py-2.5 text-xs font-semibold"
                    />
                    <div className="flex items-center gap-2.5">
                      <input
                        type="text"
                        value={brandIndustry}
                        onChange={(event) => setBrandIndustry(event.target.value)}
                        placeholder="Industry (optional)"
                        className="creator-input flex-1 px-3 py-2.5 text-xs font-semibold"
                      />
                      <input
                        type="text"
                        value={brandVoice}
                        onChange={(event) => setBrandVoice(event.target.value)}
                        placeholder="Brand voice (optional)"
                        className="creator-input flex-1 px-3 py-2.5 text-xs font-semibold"
                      />
                    </div>
                    <input
                      type="text"
                      value={brandAudience}
                      onChange={(event) => setBrandAudience(event.target.value)}
                      placeholder="Brand's target audience (optional)"
                      className="creator-input w-full px-3 py-2.5 text-xs font-semibold"
                    />
                    <textarea
                      rows={2}
                      value={brandValues}
                      onChange={(event) => setBrandValues(event.target.value)}
                      placeholder="Brand values (optional)"
                      className="creator-input w-full resize-y px-3 py-2.5 text-xs font-semibold"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowProductFields((value) => !value)}
                  className="mb-1.5 text-xs font-bold text-purple-300 hover:text-purple-200"
                >
                  {showProductFields ? "Hide product & reference material" : "+ Add product & reference material (optional)"}
                </button>
                {showProductFields && !selectedBrandId && (
                  <p className="mb-3 text-[11px] font-semibold text-amber-300">Pick or create a brand above first — a product needs one.</p>
                )}

                {showProductFields && (
                  <div className="mb-3.5 space-y-2.5 rounded-lg border border-white/10 bg-white/[0.02] p-3">
                    <input
                      type="text"
                      value={productName}
                      onChange={(event) => setProductName(event.target.value)}
                      placeholder="Product name"
                      className="creator-input w-full px-3 py-2.5 text-xs font-semibold"
                    />
                    <div className="flex items-center gap-2.5">
                      <input
                        type="text"
                        value={productCategory}
                        onChange={(event) => setProductCategory(event.target.value)}
                        placeholder="Category (optional)"
                        className="creator-input flex-1 px-3 py-2.5 text-xs font-semibold"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={productDescription}
                      onChange={(event) => setProductDescription(event.target.value)}
                      placeholder="Product description (optional)"
                      className="creator-input w-full resize-y px-3 py-2.5 text-xs font-semibold"
                    />

                    <div>
                      <p className="mb-1.5 text-[11px] font-bold text-slate-400">
                        Product images {!productName.trim() && "(add a product name above first)"}
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={!productName.trim()}
                        onChange={(event) => setProductImageFiles(Array.from(event.target.files || []))}
                        className="block w-full text-[11px] text-slate-400 file:mr-2 file:rounded-md file:border-0 file:bg-purple-500/20 file:px-2.5 file:py-1.5 file:text-[11px] file:font-bold file:text-purple-200 disabled:opacity-40"
                      />
                      {productImageFiles.length > 0 && (
                        <p className="mt-1 text-[11px] font-semibold text-slate-500">{productImageFiles.length} file(s) selected</p>
                      )}
                    </div>

                    <div>
                      <p className="mb-1.5 text-[11px] font-bold text-slate-400">
                        What the client has in mind (mood/style reference images, not the product itself)
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(event) => setProjectReferenceFiles(Array.from(event.target.files || []))}
                        className="block w-full text-[11px] text-slate-400 file:mr-2 file:rounded-md file:border-0 file:bg-purple-500/20 file:px-2.5 file:py-1.5 file:text-[11px] file:font-bold file:text-purple-200"
                      />
                      {projectReferenceFiles.length > 0 && (
                        <p className="mt-1 text-[11px] font-semibold text-slate-500">{projectReferenceFiles.length} file(s) selected</p>
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-slate-500">
                      Images are analyzed once the brief is funded, not right away.
                    </p>
                  </div>
                )}

                <p className="mb-2 text-xs font-bold text-slate-300">Reference image (optional)</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mb-4 flex w-full flex-col items-center gap-1.5 rounded-lg border border-dashed border-white/15 bg-white/[0.02] py-4 text-slate-400 transition hover:border-purple-400/40 hover:text-purple-200"
                >
                  <ImagePlus size={20} />
                  <span className="text-xs font-semibold">
                    {referenceFile ? referenceFile.name : "Click to upload — shown to the client on the brief page"}
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => setReferenceFile(event.target.files?.[0] || null)}
                />

                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="creator-primary flex w-full items-center justify-center gap-2 py-3 text-[13px] font-bold text-white disabled:opacity-60"
                >
                  {creating ? "Creating…" : "Create brief & get client link"}
                  {!creating && <ArrowRight size={15} />}
                </button>
              </>
            )}

            {modalStep === "success" && (
              <>
                <div className="mb-4 flex items-start gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300">
                    <CheckCircle2 size={17} />
                  </span>
                  <div>
                    <p className="text-[15px] font-extrabold text-white">Brief created</p>
                    <p className="mt-0.5 text-xs font-medium text-slate-400">Share this link — the client reviews the brief and pays from there</p>
                  </div>
                </div>

                <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-white/10 bg-black/40 px-3 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold text-purple-300">{shareUrl || "Link unavailable"}</span>
                  {shareUrl && (
                    <button type="button" onClick={copyLink} className="flex flex-shrink-0 items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-slate-100 hover:border-purple-400/40">
                      <Copy size={13} />
                      Copy link
                    </button>
                  )}
                </div>

                {createdPrice && (
                  <p className="mb-4 text-xs font-semibold text-slate-300">
                    Price quoted to the client: {createdPrice.currency} {Number(createdPrice.amount).toFixed(2)}
                  </p>
                )}

                {createdRequirementId && (
                  <button
                    type="button"
                    onClick={() => navigate(`/requirements/${createdRequirementId}`)}
                    className="creator-primary mb-2.5 flex w-full items-center justify-center gap-2 py-3 text-[13px] font-bold text-white"
                  >
                    Manage this brief
                    <ArrowRight size={15} />
                  </button>
                )}
                <button type="button" onClick={closeModal} className="creator-control w-full py-3 text-[13px] font-bold text-slate-100">
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {projectsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={() => setProjectsModalOpen(false)}>
          <div className="creator-panel max-h-[80vh] w-full max-w-lg overflow-y-auto p-6" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <p className="text-[15px] font-extrabold text-white">All projects</p>
              <button type="button" onClick={() => setProjectsModalOpen(false)} aria-label="Close" className="creator-control flex h-8 w-8 flex-shrink-0 items-center justify-center text-slate-400">
                <X size={15} />
              </button>
            </div>

            {projectsLoading && projects.length === 0 && <p className="px-1 py-4 text-xs font-semibold text-slate-500">Loading projects…</p>}
            {!projectsLoading && projects.length === 0 && (
              <p className="px-1 py-4 text-xs font-semibold text-slate-500">No projects yet — start one from Home.</p>
            )}
            <div className="space-y-1">
              {projects.map((project) => {
                const style = STATUS_STYLES[project.status] || STATUS_STYLES.DRAFT;
                return (
                  <div key={project.id} className="flex items-center gap-3 rounded-md px-2 py-2.5 transition hover:bg-white/[0.03]">
                    <span
                      className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide"
                      style={{ background: style.bg, color: style.text }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: style.dot }} />
                      {style.label}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-slate-100">{project.name}</span>
                    <span className="flex-shrink-0 text-[11px] font-semibold text-slate-500">{relativeTime(project.createdAt)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setProjectsModalOpen(false);
                        navigate(`/projects/${project.id}`);
                      }}
                      className="flex flex-shrink-0 items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-slate-100 hover:border-purple-400/40 hover:bg-purple-500/10"
                    >
                      Open
                      <ArrowRight size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {briefsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={() => setBriefsModalOpen(false)}>
          <div className="creator-panel max-h-[80vh] w-full max-w-lg overflow-y-auto p-6" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[15px] font-extrabold text-white">Briefs</p>
                <p className="mt-0.5 text-xs font-medium text-slate-400">
                  Not yet in production -- awaiting client payment or an idea pick.
                </p>
              </div>
              <button type="button" onClick={() => setBriefsModalOpen(false)} aria-label="Close" className="creator-control flex h-8 w-8 flex-shrink-0 items-center justify-center text-slate-400">
                <X size={15} />
              </button>
            </div>

            {requirements.length === 0 && (
              <p className="px-1 py-4 text-xs font-semibold text-slate-500">No briefs yet — start one from Home.</p>
            )}
            <div className="space-y-1">
              {requirements.map((requirement) => {
                const style = requirement.lockedProjectId
                  ? STATUS_STYLES.IDEA_LOCKED
                  : requirement.funded
                    ? STATUS_STYLES.FUNDED
                    : STATUS_STYLES.AWAITING_FUNDING;
                const name = requirement.briefText?.split("\n")[0]?.slice(0, 60) || "Untitled brief";
                // Once an idea's locked this brief became a real pre-production Project -- open
                // that instead of the brief workspace, same as "Recent projects" would.
                const destination = requirement.lockedProjectId
                  ? `/projects/${requirement.lockedProjectId}`
                  : `/requirements/${requirement.id}`;
                return (
                  <div key={requirement.id} className="flex items-center gap-3 rounded-md px-2 py-2.5 transition hover:bg-white/[0.03]">
                    <span
                      className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide"
                      style={{ background: style.bg, color: style.text }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: style.dot }} />
                      {style.label}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-slate-100">{name}</span>
                    <span className="flex-shrink-0 text-[11px] font-semibold text-slate-500">{relativeTime(requirement.createdAt)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setBriefsModalOpen(false);
                        navigate(destination);
                      }}
                      className="flex flex-shrink-0 items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-slate-100 hover:border-purple-400/40 hover:bg-purple-500/10"
                    >
                      Open
                      <ArrowRight size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const QUICK_COLORS = {
  amber: "text-amber-300 bg-amber-400/10",
  purple: "text-purple-300 bg-purple-500/15",
  sky: "text-sky-300 bg-sky-400/10",
  rose: "text-rose-300 bg-rose-400/10",
  emerald: "text-emerald-300 bg-emerald-400/10",
};

function QuickAction({ icon: Icon, label, color, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="creator-control flex items-center gap-2.5 px-3.5 py-3 text-left"
    >
      <span className={`flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg ${QUICK_COLORS[color]}`}>
        <Icon size={15} />
      </span>
      <span className="text-[13px] font-bold text-white">{label}</span>
    </button>
  );
}
