// @ts-nocheck
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Check, CheckCircle2, Copy, Loader2, Save, X } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useApplyChangeRequestMutation,
  useDismissChangeRequestMutation,
  useEnsureClientReviewLinkMutation,
  useGetPreProductionProjectQuery,
  useListChangeRequestsQuery,
  useListProjectReviewCommentsQuery,
  useResolveProjectReviewCommentMutation,
  useUpdateProjectReviewSettingsMutation,
} from "../../api/creatorEndpoints.js";

/** Share-link generator + the client's pending chat suggestions (see ClientReviewPage/
 * PublicProjectController) -- nothing here regenerates anything until the creator explicitly
 * applies a suggestion. */
export default function ClientReviewPanel({ projectId }) {
  const dispatch = useDispatch();
  const [link, setLink] = useState(null);
  const [ensureLink, { isLoading: creatingLink }] = useEnsureClientReviewLinkMutation();
  const { data: changeRequests = [] } = useListChangeRequestsQuery(projectId, { skip: !projectId });
  const [applyRequest, { isLoading: applying }] = useApplyChangeRequestMutation();
  const [dismissRequest] = useDismissChangeRequestMutation();
  const [pendingId, setPendingId] = useState(null);
  const { data: reviewComments = [] } = useListProjectReviewCommentsQuery(projectId, { skip: !projectId });
  const [resolveComment, { isLoading: resolving }] = useResolveProjectReviewCommentMutation();
  const [resolvingId, setResolvingId] = useState(null);

  // Creator review controls: included review count + an on/off switch for the whole project.
  const { data: project } = useGetPreProductionProjectQuery(projectId, { skip: !projectId });
  const [updateReviewSettings, { isLoading: savingSettings }] = useUpdateProjectReviewSettingsMutation();
  const [allowanceInput, setAllowanceInput] = useState("");
  React.useEffect(() => {
    if (project?.reviewAllowance != null) setAllowanceInput(String(project.reviewAllowance));
  }, [project?.reviewAllowance]);
  const reviewsEnabled = project?.reviewsEnabled !== false;

  const saveReviewSettings = async (patch) => {
    try {
      await updateReviewSettings({ projectId, ...patch }).unwrap();
      dispatch(showFlash({ message: "Review settings updated", type: "success" }));
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.error || error?.data?.message || "Could not update review settings", type: "error" }));
    }
  };

  const handleSaveAllowance = () => {
    const value = allowanceInput.trim() === "" ? 2 : Math.max(0, Number(allowanceInput));
    if (!Number.isFinite(value)) {
      dispatch(showFlash({ message: "Enter a valid number of reviews", type: "error" }));
      return;
    }
    saveReviewSettings({ reviewAllowance: value });
  };

  const pending = changeRequests.filter((c) => c.status === "PENDING");

  const handleGetLink = async () => {
    try {
      const result = await ensureLink(projectId).unwrap();
      setLink(`${window.location.origin}/review/${result.token}`);
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not create the review link", type: "error" }));
    }
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(link);
    dispatch(showFlash({ message: "Link copied", type: "success" }));
  };

  const handleApply = async (id) => {
    setPendingId(id);
    try {
      await applyRequest({ projectId, changeRequestId: id }).unwrap();
      dispatch(showFlash({ message: "Applied — regenerating", type: "success" }));
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not apply this change", type: "error" }));
    } finally {
      setPendingId(null);
    }
  };

  const handleDismiss = async (id) => {
    try {
      await dismissRequest({ projectId, changeRequestId: id }).unwrap();
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not dismiss this", type: "error" }));
    }
  };

  const handleResolveComment = async (id) => {
    setResolvingId(id);
    try {
      await resolveComment({ projectId, commentId: id }).unwrap();
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not mark this resolved", type: "error" }));
    } finally {
      setResolvingId(null);
    }
  };

  const openComments = reviewComments.filter((c) => !c.resolved);

  return (
    <div className="creator-panel mt-6 p-6">
      <p className="text-[11px] font-extrabold uppercase tracking-widest text-purple-300">Client review</p>
      <p className="mt-0.5 mb-4 text-xs font-medium text-slate-400">
        Share the package with your client — once they lock it, their chat suggestions land here for you to apply.
      </p>

      {!link ? (
        <button
          type="button"
          disabled={creatingLink}
          onClick={handleGetLink}
          className="creator-primary flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          {creatingLink && <Loader2 size={12} className="animate-spin" />}
          Get client review link
        </button>
      ) : (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2">
          <input readOnly value={link} className="flex-1 bg-transparent text-xs font-medium text-slate-300 outline-none" />
          <button type="button" onClick={handleCopy} className="flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-[10px] font-bold text-slate-300">
            <Copy size={11} />
            Copy
          </button>
        </div>
      )}

      {projectId && (
        <div className="mt-4 flex flex-wrap items-end gap-4 border-t border-white/10 pt-4">
          <div>
            <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Included reviews</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="1"
                value={allowanceInput}
                onChange={(event) => setAllowanceInput(event.target.value)}
                className="creator-input w-20 px-2.5 py-2 text-sm font-semibold"
                placeholder="2"
              />
              <button
                type="button"
                disabled={savingSettings}
                onClick={handleSaveAllowance}
                className="creator-control flex items-center gap-1 px-3 py-2 text-[11px] font-bold text-slate-200 disabled:opacity-60"
              >
                <Save size={12} /> Save
              </button>
            </div>
            <p className="mt-1 text-[10px] font-medium text-slate-500">Free reviews before the client pays for more.</p>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Reviews</label>
            <button
              type="button"
              disabled={savingSettings}
              onClick={() => saveReviewSettings({ reviewsEnabled: !reviewsEnabled })}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-bold disabled:opacity-60 ${
                reviewsEnabled
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                  : "border-rose-400/30 bg-rose-500/10 text-rose-200"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${reviewsEnabled ? "bg-emerald-400" : "bg-rose-400"}`} />
              {reviewsEnabled ? "Open — click to close" : "Closed — click to open"}
            </button>
            <p className="mt-1 text-[10px] font-medium text-slate-500">Shut client reviews off for this project anytime.</p>
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div className="mt-4 space-y-2.5 border-t border-white/10 pt-4">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
            {pending.length} pending suggestion{pending.length > 1 ? "s" : ""}
          </p>
          {pending.map((cr) => (
            <div key={cr.id} className="rounded-lg border border-amber-400/20 bg-amber-500/[0.04] p-3">
              <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-amber-300">
                {cr.targetType}
                {cr.targetRef ? ` · ${cr.targetRef}` : ""}
              </p>
              <p className="mb-2.5 text-xs font-medium text-slate-300">{cr.note}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleDismiss(cr.id)}
                  className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-bold text-slate-300"
                >
                  <X size={11} />
                  Dismiss
                </button>
                <button
                  type="button"
                  disabled={applying && pendingId === cr.id}
                  onClick={() => handleApply(cr.id)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-md border border-emerald-400/30 bg-emerald-500/10 py-1.5 text-[10px] font-bold text-emerald-200 disabled:opacity-60"
                >
                  <Check size={11} />
                  {applying && pendingId === cr.id ? "Applying…" : "Apply"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {openComments.length > 0 && (
        <div className="mt-4 space-y-2.5 border-t border-white/10 pt-4">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
            {openComments.length} client comment{openComments.length > 1 ? "s" : ""}
          </p>
          {openComments.map((comment) => (
            <div key={comment.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="mb-2 text-xs font-medium text-slate-300">{comment.content}</p>
              {comment.imageUrl && (
                <img src={comment.imageUrl} alt="" className="mb-2 max-h-40 rounded-md border border-white/10 object-cover" />
              )}
              <p className="mb-2 text-[10px] font-medium text-slate-500">
                Use the shot chat below to make the fix, then mark this resolved.
              </p>
              <button
                type="button"
                disabled={resolving && resolvingId === comment.id}
                onClick={() => handleResolveComment(comment.id)}
                className="flex items-center gap-1 rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-bold text-emerald-200 disabled:opacity-60"
              >
                <CheckCircle2 size={11} />
                {resolving && resolvingId === comment.id ? "Marking…" : "Mark resolved"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
