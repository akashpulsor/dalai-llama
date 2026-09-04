// @ts-nocheck
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { CheckCircle2, Circle, CreditCard, Download, ImageIcon, ImagePlus, Loader2, Lock, PlayCircle, Send, Sparkles, User2, X } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useAddPublicReviewCommentMutation,
  useEndReviewMutation,
  useGetLockQuoteMutation,
  useGetPublicFinalVideoQuery,
  useGetPublicProjectQuery,
  useGetPublicReviewCommentsQuery,
  useGetReviewStatusQuery,
  useStartLockPaymentMutation,
  useStartReviewMutation,
  useStartReviewPaymentMutation,
  useVerifyLockPaymentMutation,
  useVerifyReviewPaymentMutation,
} from "../api/creatorEndpoints.js";
import { runRazorpayCheckout } from "../utils/walletRecharge.js";

const rupee = (n, code = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: code || "INR", maximumFractionDigits: 0 }).format(Number(n) || 0);

const IMAGE_KIND_LABEL = { STORYBOARD: "Storyboard", PRODUCTION: "Production", LIGHTING: "Lighting", CAMERA_PLAN: "Camera plan" };

/**
 * Public, unauthenticated page for whoever holds a project's client-review link -- the tenant's
 * end client, who has no account here. Backed by pre-production-service's PublicProjectController
 * (GET/POST /v1/public/projects/{token}/...), same "possession of the token is the authorization"
 * convention as ClientFundingPage. Shows the full locked (or about-to-be-locked) creative package
 * -- script, screenplay, cast, every shot's images -- and, once locked, a chat box below the shot
 * images for the client to suggest changes.
 */
export default function ClientReviewPage() {
  const { token } = useParams();
  const dispatch = useDispatch();
  const { data, isLoading, isError, error, refetch } = useGetPublicProjectQuery(token, { skip: !token });
  const { data: finalVideo } = useGetPublicFinalVideoQuery(token, { skip: !token });
  const [getQuote] = useGetLockQuoteMutation();
  const [startPayment] = useStartLockPaymentMutation();
  const [verifyPayment] = useVerifyLockPaymentMutation();
  const [quote, setQuote] = useState(null);
  const [paying, setPaying] = useState(false);

  const isLocked = data?.status === "CLIENT_LOCKED";

  // Step 1: show the price before the client commits.
  const handleShowQuote = async () => {
    try {
      const q = await getQuote(token).unwrap();
      setQuote(q);
    } catch (err) {
      dispatch(showFlash({ message: err?.data?.message || "Could not fetch the price", type: "error" }));
    }
  };

  // Step 2: create the order, run Razorpay, verify -> the package locks only on a verified payment.
  const handlePayAndLock = async () => {
    setPaying(true);
    try {
      const order = await startPayment(token).unwrap();
      await runRazorpayCheckout(
        { ...order, name: "Dalai Llama Studio", description: `Lock: ${data?.name || "creative package"}` },
        (response) => verifyPayment({
          token,
          gatewayOrderId: response.razorpay_order_id,
          gatewayPaymentId: response.razorpay_payment_id,
          gatewaySignature: response.razorpay_signature,
        }).unwrap()
      );
      dispatch(showFlash({ message: "Paid and locked — this is now the final creative package", type: "success" }));
      setQuote(null);
      refetch();
    } catch (err) {
      dispatch(showFlash({
        message: err?.message || err?.data?.message || "Payment did not complete — the package was not locked",
        type: err?.paymentCancelled ? "warning" : "error",
      }));
    } finally {
      setPaying(false);
    }
  };

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
        {isLoading && <p className="text-center text-sm font-semibold text-slate-400">Loading the creative package…</p>}
        {isError && (
          <p className="text-center text-sm font-semibold text-rose-300">
            {error?.status === 404 ? "This link doesn't exist. Ask the creator to resend it." : "Couldn't load this project. Please try again."}
          </p>
        )}

        {data && (
          <>
            <div className="mb-1">
              <p className="text-[11px] font-semibold text-slate-400">Review the creative package for</p>
              <h1 className="text-xl font-extrabold text-white">{data.name}</h1>
              <div className="mt-2.5">
                {isLocked ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-[10.5px] font-bold text-emerald-300">
                    <CheckCircle2 size={11} />
                    Approved & locked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-400/25 bg-orange-500/10 px-2.5 py-1 text-[10.5px] font-bold text-orange-300">
                    <Circle size={9} className="fill-current" />
                    Draft — awaiting your approval
                  </span>
                )}
              </div>
            </div>

            {/* Progress rail -- Review (content above) / Feedback (always available now, not
                gated behind locking) / Approved (the final, separate lock step below). */}
            <div className="my-5 flex items-center gap-2">
              <RailStep done label="Review" />
              <RailLine done />
              <RailStep active={!isLocked} done={isLocked} label="Feedback" />
              <RailLine done={isLocked} />
              <RailStep active={isLocked} label="Approved" />
            </div>

            {finalVideo?.available && finalVideo?.videoUrl && (
              <div className="creator-panel mb-4 p-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-purple-300">Final video</p>
                  {finalVideo.downloadUnlocked ? (
                    <a
                      href={finalVideo.videoUrl}
                      download
                      className="inline-flex items-center gap-1.5 rounded-lg bg-purple-500 px-3 py-1.5 text-[11px] font-black text-white hover:bg-purple-400"
                    >
                      <Download size={13} /> Download
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-400/25 bg-slate-500/10 px-2.5 py-1 text-[10.5px] font-bold text-slate-300">
                      <Lock size={11} /> Contact your creator to unlock download
                    </span>
                  )}
                </div>
                <video
                  key={finalVideo.videoUrl}
                  src={finalVideo.videoUrl}
                  controls
                  className="w-full rounded-lg border border-white/10 bg-black"
                />
              </div>
            )}
            {finalVideo?.available && !finalVideo?.videoUrl && (
              <div className="creator-panel mb-4 p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-purple-300">Final video</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">Your creator will unlock preview and download shortly.</p>
                  </div>
                  <Lock size={16} className="text-slate-500" />
                </div>
              </div>
            )}

            {data.script && (
              <div className="creator-panel mb-4 p-6">
                <p className="mb-2.5 text-[11px] font-extrabold uppercase tracking-widest text-purple-300">Script</p>
                <p className="whitespace-pre-wrap text-[13px] font-medium leading-relaxed text-slate-200">{data.script.scriptText}</p>
              </div>
            )}

            {data.screenplay?.scenes?.length > 0 && (
              <div className="creator-panel mb-4 p-6">
                <p className="mb-2.5 text-[11px] font-extrabold uppercase tracking-widest text-purple-300">Screenplay</p>
                <div className="space-y-2.5">
                  {data.screenplay.scenes.map((scene) => (
                    <div key={scene.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-xs font-extrabold uppercase tracking-wide text-slate-200">{scene.slug}</p>
                      <p className="mt-1 text-xs font-medium leading-relaxed text-slate-400">{scene.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.cast?.length > 0 && (
              <div className="creator-panel mb-4 p-6">
                <p className="mb-2.5 text-[11px] font-extrabold uppercase tracking-widest text-purple-300">Cast</p>
                <div className="flex flex-wrap gap-2.5">
                  {data.cast.map((member, index) => (
                    <div key={index} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                      {member.profileImageUrl ? (
                        <img src={member.profileImageUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <User2 size={14} className="text-slate-500" />
                      )}
                      <div>
                        <p className="text-xs font-bold text-white">{member.characterName}</p>
                        <p className="text-[10px] font-medium text-slate-500">{member.profileDisplayName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.shots?.length > 0 && (
              <div className="creator-panel mb-4 p-6">
                <p className="mb-4 text-[11px] font-extrabold uppercase tracking-widest text-purple-300">Shots</p>
                <div className="space-y-4">
                  {data.shots.map((shot) => (
                    <div key={shot.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3.5">
                      <p className="mb-2 text-xs font-bold text-white">
                        Shot {shot.shotNumber} <span className="ml-1.5 font-medium text-slate-500">{shot.shotType}</span>
                      </p>
                      {shot.action && <p className="mb-3 text-[11px] font-medium text-slate-400">{shot.action}</p>}
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {shot.images.map((image) => (
                          <div key={image.id} className="overflow-hidden rounded-md border border-white/10 bg-black/20">
                            <img src={image.signedUrl} alt={image.kind} className="aspect-square w-full object-cover" />
                            <p className="px-2 py-1 text-center text-[9px] font-bold uppercase tracking-wide text-slate-400">
                              {IMAGE_KIND_LABEL[image.kind] || image.kind}
                            </p>
                          </div>
                        ))}
                        {shot.images.length === 0 && (
                          <div className="col-span-4 flex items-center justify-center gap-1.5 rounded-md border border-dashed border-white/10 py-4 text-[11px] font-medium text-slate-600">
                            <ImageIcon size={13} />
                            No images yet
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* Its own panel, not nested inside the shots block above and no longer gated behind
                isLocked -- ClientReviewChat only ever depends on `token`, never on shots or lock
                status existing. It used to require both (only visible after paying, only if
                shots existed), which meant a client reviewing an early-stage draft had no way to
                say anything at all before being asked to pay. Feedback is relevant at any stage;
                "Approve & lock" below is now a distinct, later, final-approval step instead of
                the gate on giving feedback in the first place. */}
            <div className="creator-panel mb-4 p-6">
              <ClientReviewChat token={token} />
            </div>

            {isLocked ? (
              <div className="mt-2 flex items-center gap-3 rounded-lg border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.08] to-transparent p-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-300">
                  <CheckCircle2 size={17} />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-white">Approved & locked</p>
                  <p className="text-[11.5px] font-medium text-slate-400">This package is final and moving into production.</p>
                </div>
              </div>
            ) : (
              <div className="relative mt-2 overflow-hidden rounded-lg border border-purple-400/30 bg-gradient-to-br from-purple-500/[0.09] to-transparent p-6">
                <div className="mb-2 flex items-center gap-1.5 text-purple-300">
                  <Lock size={13} />
                  <span className="text-[10.5px] font-extrabold uppercase tracking-[0.1em]">Final approval</span>
                </div>
                <h3 className="text-[15px] font-extrabold text-white">Happy with the direction? Lock it in.</h3>
                <p className="mt-1.5 max-w-[46ch] text-[12px] font-medium leading-relaxed text-slate-400">
                  Locking approves this package as final and moves it into production. You can keep leaving feedback
                  above at any time before or after — this just marks it done.
                </p>
                <button
                  type="button"
                  onClick={handleShowQuote}
                  className="creator-primary mt-4 flex items-center gap-1.5 px-4 py-2.5 text-[12.5px] font-bold text-white"
                >
                  <Lock size={13} />
                  Approve & lock this package
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {quote && !isLocked && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="creator-panel w-full max-w-md p-6">
            <div className="mb-1.5 flex items-center gap-2 text-purple-200">
              <Lock size={16} />
              <span className="text-[11px] font-bold uppercase tracking-[0.16em]">Approve & lock</span>
            </div>
            <h3 className="text-lg font-bold text-white">Pay to finalize this package</h3>
            <p className="mt-1 text-sm font-medium text-slate-400">
              Locking approves this creative package as final and unlocks the change-request chat. One-time payment, secured by Razorpay.
            </p>

            <div className="mt-5 flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <span className="text-sm font-semibold text-slate-300">Total</span>
              <span className="text-2xl font-extrabold text-white">{rupee(quote.totalAmount, quote.currency)}</span>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                disabled={paying}
                onClick={() => setQuote(null)}
                className="rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-300 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={paying}
                onClick={handlePayAndLock}
                className="creator-primary flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {paying ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                {paying ? "Processing…" : `Pay ${rupee(quote.totalAmount, quote.currency)} & lock`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** One dot + label in the Review / Feedback / Approved progress rail. `done` = already passed
 * (filled, checkmark-style); `active` = the current stage; neither = not reached yet. */
function RailStep({ label, done, active }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <div
        className={
          "flex h-[22px] w-[22px] items-center justify-center rounded-full border text-[10px] font-extrabold " +
          (done
            ? "border-purple-400 bg-purple-500 text-white"
            : active
              ? "border-purple-400 text-purple-300"
              : "border-white/15 text-slate-600")
        }
      >
        {done ? "✓" : active ? "•" : ""}
      </div>
      <span className={"text-[11px] font-bold " + (done || active ? "text-slate-200" : "text-slate-600")}>{label}</span>
    </div>
  );
}

function RailLine({ done }) {
  return <div className={"h-px flex-1 " + (done ? "bg-purple-400/50" : "bg-white/10")} />;
}

function ClientReviewChat({ token }) {
  const dispatch = useDispatch();
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null);
  const { data: comments = [], refetch } = useGetPublicReviewCommentsQuery(token, { skip: !token });
  const [addComment, { isLoading: sending }] = useAddPublicReviewCommentMutation();

  // Transactional review: the client opens a review, batches changes via chat, then ends it (the
  // batched changes apply to the storyboard together). One open review at a time; reviews beyond
  // the project's allowance are paywalled at the point of STARTING one.
  const { data: reviewStatus, refetch: refetchStatus } = useGetReviewStatusQuery(token, { skip: !token });
  const [startReview, { isLoading: starting }] = useStartReviewMutation();
  const [endReview, { isLoading: ending }] = useEndReviewMutation();
  const [startReviewPayment] = useStartReviewPaymentMutation();
  const [verifyReviewPayment] = useVerifyReviewPaymentMutation();
  const [paying, setPaying] = useState(false);

  const open = !!reviewStatus?.openReviewId;
  const used = reviewStatus?.used ?? 0;
  const allowance = reviewStatus?.allowance ?? 2;
  const paymentRequired = !!reviewStatus?.paymentRequiredToStart;
  const reviewsClosed = reviewStatus && reviewStatus.reviewsEnabled === false;

  const handleStartFree = async () => {
    try {
      await startReview(token).unwrap();
      refetchStatus();
    } catch (err) {
      dispatch(showFlash({ message: err?.data?.error || "Could not start a review", type: "error" }));
    }
  };

  const handleStartPaid = async () => {
    setPaying(true);
    try {
      const order = await startReviewPayment(token).unwrap();
      await runRazorpayCheckout(
        { gatewayOrderId: order.gatewayOrderId, amount: Number(order.amount), currency: order.currency, keyId: order.keyId, name: "Extra review", description: "Start another review round" },
        (response) => verifyReviewPayment({
          token,
          gatewayOrderId: response.razorpay_order_id,
          gatewayPaymentId: response.razorpay_payment_id,
          gatewaySignature: response.razorpay_signature,
        }).unwrap()
      );
      refetchStatus();
      dispatch(showFlash({ message: "Payment received — your new review is open", type: "success" }));
    } catch (err) {
      if (!err?.paymentCancelled) {
        dispatch(showFlash({ message: err?.data?.error || err?.message || "Could not start a paid review", type: "error" }));
      }
    } finally {
      setPaying(false);
    }
  };

  const handleEnd = async (satisfied) => {
    try {
      await endReview({ token, satisfied }).unwrap();
      refetchStatus();
      dispatch(showFlash({
        message: satisfied ? "Review closed — your changes will be applied to the project" : "Review closed",
        type: "success",
      }));
    } catch (err) {
      dispatch(showFlash({ message: err?.data?.error || "Could not end the review", type: "error" }));
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    const content = message;
    const attachedImage = image;
    setMessage("");
    setImage(null);
    try {
      await addComment({ token, content, image: attachedImage }).unwrap();
      refetch();
    } catch (err) {
      dispatch(showFlash({ message: err?.data?.error || err?.data?.message || "Could not send this comment", type: "error" }));
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-purple-300">Reviews</p>
        <span className="text-[10px] font-bold text-slate-500">{used} of {allowance} included used</span>
      </div>

      {reviewsClosed && !open ? (
        <div className="rounded-lg border border-white/10 bg-black/25 p-4">
          <p className="text-[13px] font-bold text-white">Reviews are closed</p>
          <p className="mt-1 text-[11px] font-medium text-slate-400">
            The creator has closed client reviews for this project. Reach out to them directly if you need a change.
          </p>
        </div>
      ) : !open ? (
        <div className="rounded-lg border border-white/10 bg-black/25 p-4">
          <p className="text-[13px] font-bold text-white">Start a review</p>
          <p className="mt-1 text-[11px] font-medium text-slate-400">
            Batch all your changes into one review — they're applied to the project together when you finish.
            {paymentRequired && ` You've used your ${allowance} included review${allowance === 1 ? "" : "s"}; another one requires a payment.`}
          </p>
          {paymentRequired ? (
            <button
              type="button"
              disabled={paying}
              onClick={handleStartPaid}
              className="creator-primary mt-3 flex min-h-9 items-center gap-2 px-4 text-xs font-black text-white disabled:opacity-60"
            >
              {paying ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
              {paying ? "Processing…" : "Pay & start another review"}
            </button>
          ) : (
            <button
              type="button"
              disabled={starting}
              onClick={handleStartFree}
              className="creator-primary mt-3 flex min-h-9 items-center gap-2 px-4 text-xs font-black text-white disabled:opacity-60"
            >
              {starting ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={14} />}
              {starting ? "Starting…" : "Start a review"}
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="mb-3 text-[11px] font-medium text-slate-500">
            Review open — leave a comment (with a photo if it helps) for every change you'd like. The creator sees
            these and applies fixes; when you're done, finish the review.
          </p>

          <div className="mb-3 max-h-72 space-y-2 overflow-y-auto">
            {comments.length === 0 && (
              <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-[11px] font-medium text-slate-500">
                No comments yet — say what you'd like changed below.
              </p>
            )}
            {comments.map((comment) => (
              <div key={comment.id} className="rounded-lg bg-white/5 px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12px] font-medium leading-relaxed text-slate-200">{comment.content}</p>
                  {comment.resolved && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                      <CheckCircle2 size={10} /> Fixed
                    </span>
                  )}
                </div>
                {comment.imageUrl && (
                  <img src={comment.imageUrl} alt="" className="mt-2 max-h-40 rounded-md border border-white/10 object-cover" />
                )}
              </div>
            ))}
          </div>

          {image && (
            <div className="mb-2 flex items-center gap-2 rounded-lg border border-purple-400/30 bg-purple-500/10 px-2.5 py-1.5">
              <ImageIcon size={12} className="text-purple-300" />
              <span className="flex-1 truncate text-[11px] font-semibold text-purple-200">{image.name}</span>
              <button type="button" onClick={() => setImage(null)} className="text-purple-300 hover:text-white">
                <X size={12} />
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleSend()}
              placeholder="e.g. Can shot 4's lighting be warmer?"
              className="creator-input flex-1 px-3 py-2.5 text-[13px]"
            />
            <label className="creator-control flex cursor-pointer items-center justify-center px-3">
              <ImagePlus size={14} />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => setImage(event.target.files?.[0] || null)}
              />
            </label>
            <button
              type="button"
              disabled={sending || !message.trim()}
              onClick={handleSend}
              className="creator-primary flex items-center justify-center px-3.5 disabled:opacity-60"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={ending}
              onClick={() => handleEnd(true)}
              className="creator-primary flex min-h-9 items-center gap-2 px-4 text-xs font-black text-white disabled:opacity-60"
            >
              {ending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Finish & apply changes
            </button>
            <button
              type="button"
              disabled={ending}
              onClick={() => handleEnd(false)}
              className="creator-control flex min-h-9 items-center gap-2 px-4 text-xs font-bold text-slate-200 disabled:opacity-60"
            >
              Close without applying
            </button>
          </div>
        </>
      )}
    </div>
  );
}
