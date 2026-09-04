// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Bot, Check, ImagePlus, Loader2, Send, Sparkles, UserRound, X } from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useListChatSessionsQuery,
  useCreateChatSessionMutation,
  useSendChatMessageMutation,
  useGetChatMessagesQuery,
  useListChangeRequestsQuery,
  useApplyChangeRequestMutation,
  useDismissChangeRequestMutation,
  useSyncProjectChatContextMutation,
} from "../../api/creatorEndpoints.js";

const SESSION_TITLE = "Creator studio chat";

/** Lets the creator chat directly about this project's shots and ask for image changes, right from
 * the Shots tab -- same chat-service session model + SUGGEST_PRE_PRODUCTION_CHANGE action the
 * client's public review chat already uses, just opened with the creator's own JWT instead of a
 * public review token, and kept in its own session (SESSION_TITLE) so it never mixes with the
 * client's "Client review chat" conversation. No manual shot-picker here on purpose -- every shot
 * and its images are already embedded for this chat (see ProjectLockService.ingestShots), so just
 * naming the shot in plain words ("shot 1 production frame, make her jacket red") is enough for
 * the model to resolve it. */
export default function ShotChatPanel({ projectId }) {
  const dispatch = useDispatch();
  const [draft, setDraft] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [attachedFiles, setAttachedFiles] = useState({});
  const listRef = useRef(null);
  const fileInputRefs = useRef({});

  const { data: sessions = [] } = useListChatSessionsQuery();
  const [createSession, createSessionState] = useCreateChatSessionMutation();
  const [sendMessage, sendMessageState] = useSendChatMessageMutation();
  const { data: messages = [] } = useGetChatMessagesQuery(sessionId, {
    skip: !sessionId,
    pollingInterval: sessionId ? 4000 : 0,
  });
  const { data: changeRequests = [] } = useListChangeRequestsQuery(projectId, { skip: !projectId });
  const [applyRequest, applyState] = useApplyChangeRequestMutation();
  const [dismissRequest] = useDismissChangeRequestMutation();
  const [syncChatContext] = useSyncProjectChatContextMutation();

  const pendingImageRequests = changeRequests.filter((c) => c.status === "PENDING" && c.targetType === "SHOT_IMAGE");

  useEffect(() => {
    if (sessionId || !sessions.length) return;
    const existing = sessions.find((s) => s.scopeType === "PRE_PRODUCTION_PROJECT" && s.scopeId === projectId && s.title === SESSION_TITLE);
    if (existing) setSessionId(existing.id);
  }, [sessions, sessionId, projectId]);

  // This panel used to go silent on anything project-specific ("I don't have any details about
  // shot 3") until a client had paid to lock the package -- ingestion into chat-service only ran
  // at that point. Refresh it here too so the creator's own chat has real context immediately,
  // without waiting on the client. Idempotent server-side, so once per project mount is enough.
  useEffect(() => {
    if (!projectId) return;
    syncChatContext(projectId);
  }, [projectId, syncChatContext]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const busy = createSessionState.isLoading || sendMessageState.isLoading;

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || !projectId || busy) return;
    setDraft("");
    try {
      let sid = sessionId;
      if (!sid) {
        const created = await createSession({ scopeType: "PRE_PRODUCTION_PROJECT", scopeId: projectId, title: SESSION_TITLE }).unwrap();
        sid = created.id;
        setSessionId(sid);
      }
      await sendMessage({ sessionId: sid, content }).unwrap();
    } catch (err) {
      dispatch(showFlash({ message: err?.data?.message || err?.error || "Could not send that message", type: "error" }));
    }
  };

  const handleApply = async (id) => {
    const files = attachedFiles[id];
    try {
      await applyRequest({ projectId, changeRequestId: id, files }).unwrap();
      dispatch(showFlash({
        message: files?.length ? "Applied — matching your reference photo" : "Applied — regenerating that image",
        type: "success",
      }));
      setAttachedFiles((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    } catch (err) {
      dispatch(showFlash({ message: err?.data?.message || "Could not apply this change", type: "error" }));
    }
  };

  const handleAttach = (id, fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setAttachedFiles((current) => ({ ...current, [id]: files }));
  };

  const handleDismiss = async (id) => {
    try {
      await dismissRequest({ projectId, changeRequestId: id }).unwrap();
    } catch (err) {
      dispatch(showFlash({ message: err?.data?.message || "Could not dismiss this", type: "error" }));
    }
  };

  return (
    <div className="creator-panel mt-6 space-y-3 p-4">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-purple-500/15 text-purple-200">
          <Sparkles size={16} />
        </span>
        <div>
          <p className="text-sm font-black text-white">Chat about a shot</p>
          <p className="text-[11px] font-semibold text-slate-500">
            Just say which shot you mean — e.g. &ldquo;shot 1 production frame, make her jacket red&rdquo;. Nothing regenerates until you hit Apply.
          </p>
        </div>
      </div>

      {pendingImageRequests.length > 0 && (
        <div className="space-y-2 rounded-lg border border-amber-400/20 bg-amber-500/[0.04] p-3">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-amber-300">
            {pendingImageRequests.length} pending image change{pendingImageRequests.length > 1 ? "s" : ""}
          </p>
          {pendingImageRequests.map((cr) => (
            <div key={cr.id} className="rounded-md border border-white/10 bg-black/20 px-2.5 py-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-extrabold uppercase tracking-wide text-slate-400">{cr.targetRef}</p>
                  <p className="truncate text-xs font-medium text-slate-300">{cr.note}</p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[cr.id]?.click()}
                    className={`rounded-md border p-1.5 ${
                      attachedFiles[cr.id]?.length
                        ? "border-purple-400/40 bg-purple-500/15 text-purple-200"
                        : "border-white/10 bg-white/5 text-slate-300 hover:text-white"
                    }`}
                    title="Attach a reference photo (e.g. from Pinterest) to match its style"
                  >
                    <ImagePlus size={12} />
                  </button>
                  <input
                    ref={(el) => { fileInputRefs.current[cr.id] = el; }}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(event) => handleAttach(cr.id, event.target.files)}
                  />
                  <button
                    type="button"
                    onClick={() => handleDismiss(cr.id)}
                    className="rounded-md border border-white/10 bg-white/5 p-1.5 text-slate-300 hover:text-white"
                    title="Dismiss"
                  >
                    <X size={12} />
                  </button>
                  <button
                    type="button"
                    disabled={applyState.isLoading}
                    onClick={() => handleApply(cr.id)}
                    className="flex items-center gap-1 rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2 py-1.5 text-[10px] font-bold text-emerald-200 disabled:opacity-60"
                  >
                    <Check size={11} />
                    Apply
                  </button>
                </div>
              </div>
              {attachedFiles[cr.id]?.length > 0 && (
                <p className="mt-1.5 text-[10px] font-semibold text-purple-300">
                  {attachedFiles[cr.id].length} reference photo{attachedFiles[cr.id].length > 1 ? "s" : ""} attached — Apply will match its cinematic style.
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div ref={listRef} className="custom-scrollbar max-h-64 min-h-[5rem] space-y-2 overflow-y-auto rounded-lg border border-white/10 bg-black/20 p-3">
        {messages.length === 0 ? (
          <p className="text-xs font-semibold text-slate-500">No messages yet — name a shot and ask for a change.</p>
        ) : (
          messages.map((entry, index) => (
            <div key={index} className={`flex gap-2 ${entry.role === "user" ? "justify-end" : "justify-start"}`}>
              {entry.role === "assistant" && (
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-purple-500/15 text-purple-200">
                  <Bot size={12} />
                </span>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-xs font-semibold leading-5 ${
                  entry.role === "user" ? "bg-purple-600 text-white" : "bg-white/[0.06] text-slate-200"
                }`}
              >
                {entry.content}
              </div>
              {entry.role === "user" && (
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-slate-300">
                  <UserRound size={12} />
                </span>
              )}
            </div>
          ))
        )}
        {busy && (
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
            <Loader2 size={12} className="animate-spin" /> Thinking…
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
          }}
          placeholder="e.g. shot 1 production frame, make her jacket red…"
          className="h-9 min-w-[12rem] flex-1 rounded-lg border border-white/10 bg-black/40 px-3 text-xs font-semibold text-slate-100 focus:border-purple-400/60 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!draft.trim() || busy}
          className="creator-primary flex h-9 items-center gap-1.5 px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-55"
        >
          {sendMessageState.isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Send
        </button>
      </div>
    </div>
  );
}
