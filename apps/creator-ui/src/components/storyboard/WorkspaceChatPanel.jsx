// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import { Bot, Check, History, ImagePlus, Loader2, Save, Send, Sparkles, Undo2, UserRound } from "lucide-react";
import {
  useOpenStoryboardWorkspaceMutation,
  useChatStoryboardWorkspaceMutation,
  useUploadWorkspaceShotInspirationImageMutation,
  useCreateStoryboardWorkspaceCheckpointMutation,
  useGetStoryboardWorkspaceCheckpointsQuery,
  useRevertStoryboardWorkspaceMutation,
  useMergeStoryboardWorkspaceMutation,
  useGetJobQuery,
} from "../../api/creatorEndpoints.js";
import { isCompletedJobStatus, isFailedJobStatus } from "../../features/patchEditor/utils/jobStatus.js";

// Chats with the RAG-grounded storyboard "workspace" brain (CreatorStoryboardWorkspaceService):
// it knows this project's shots/images, can edit any shot directly from natural language, and
// is sandboxed (checkpoint/revert/merge) until explicitly merged back into the live screenplay.
// This is additive to the review-chat above it, which proposes diffs for manual apply/revert -
// this one edits directly and versions the result.
export default function WorkspaceChatPanel({ scriptId, onMerged }) {
  const [workspace, setWorkspace] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [shotNumberDraft, setShotNumberDraft] = useState("");
  const [inspirationJobId, setInspirationJobId] = useState(null);
  const [error, setError] = useState("");
  const listRef = useRef(null);
  const fileInputRef = useRef(null);

  const [openWorkspace, openWorkspaceState] = useOpenStoryboardWorkspaceMutation();
  const [chat, chatState] = useChatStoryboardWorkspaceMutation();
  const [uploadInspirationImage, uploadInspirationImageState] = useUploadWorkspaceShotInspirationImageMutation();
  const [createCheckpoint, createCheckpointState] = useCreateStoryboardWorkspaceCheckpointMutation();
  const [revertWorkspace, revertWorkspaceState] = useRevertStoryboardWorkspaceMutation();
  const [mergeWorkspace, mergeWorkspaceState] = useMergeStoryboardWorkspaceMutation();

  const { data: checkpoints = [] } = useGetStoryboardWorkspaceCheckpointsQuery(
    { scriptId, workspaceId: workspace?.workspaceId },
    { skip: !workspace?.workspaceId }
  );
  const { data: inspirationJob } = useGetJobQuery(inspirationJobId, {
    skip: !inspirationJobId,
    pollingInterval: inspirationJobId ? 2000 : 0,
  });

  const busy = openWorkspaceState.isLoading || chatState.isLoading || uploadInspirationImageState.isLoading
    || createCheckpointState.isLoading || revertWorkspaceState.isLoading || mergeWorkspaceState.isLoading;

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!inspirationJobId || !inspirationJob) return;
    if (isCompletedJobStatus(inspirationJob.status)) {
      setInspirationJobId(null);
      setMessages((current) => [
        ...current,
        { role: "assistant", text: "Regenerated the shot from your inspiration image.", createdAt: Date.now() },
      ]);
    } else if (isFailedJobStatus(inspirationJob.status)) {
      setInspirationJobId(null);
      setError(inspirationJob.errorMessage || "Could not regenerate this shot from the inspiration image.");
    }
  }, [inspirationJob, inspirationJobId]);

  const ensureWorkspace = async () => {
    if (workspace?.workspaceId) return workspace;
    const opened = await openWorkspace({ scriptId }).unwrap();
    setWorkspace(opened);
    return opened;
  };

  const handleSend = async () => {
    const message = draft.trim();
    if (!message || !scriptId || busy) return;
    setError("");
    setDraft("");
    setMessages((current) => [...current, { role: "user", text: message, createdAt: Date.now() }]);
    try {
      const ws = await ensureWorkspace();
      const shotNumber = shotNumberDraft ? Number(shotNumberDraft) : undefined;
      const turn = await chat({ scriptId, workspaceId: ws.workspaceId, message, shotNumber }).unwrap();
      setWorkspace((current) => (current ? { ...current, currentVersion: turn.currentVersion } : current));
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: turn.assistantResponse,
          affectedShots: turn.affectedShots,
          appliedVersion: turn.appliedVersion,
          createdAt: Date.now(),
        },
      ]);
    } catch (err) {
      setError(err?.data?.message || err?.error || "Could not reach the workspace chat.");
    }
  };

  const handleUploadInspiration = async (fileList) => {
    const file = fileList?.[0];
    if (!file || !scriptId || busy) return;
    const shotNumber = Number(shotNumberDraft);
    if (!shotNumber || shotNumber < 1) {
      setError("Enter a shot number above before attaching an inspiration image.");
      return;
    }
    setError("");
    try {
      const ws = await ensureWorkspace();
      const job = await uploadInspirationImage({ scriptId, workspaceId: ws.workspaceId, shotNumber, file }).unwrap();
      setInspirationJobId(job.jobId || job.id);
      setMessages((current) => [
        ...current,
        { role: "user", text: `Uploaded an inspiration image for shot ${shotNumber}.`, createdAt: Date.now() },
      ]);
    } catch (err) {
      setError(err?.data?.message || err?.error || "Could not upload the inspiration image.");
    }
  };

  const handleCheckpoint = async () => {
    if (!workspace?.workspaceId || busy) return;
    setError("");
    try {
      await createCheckpoint({
        scriptId,
        workspaceId: workspace.workspaceId,
        title: `Checkpoint v${workspace.currentVersion}`,
      }).unwrap();
    } catch (err) {
      setError(err?.data?.message || err?.error || "Could not save a checkpoint.");
    }
  };

  const handleRevert = async (toVersion) => {
    if (!workspace?.workspaceId || busy) return;
    setError("");
    try {
      const reverted = await revertWorkspace({ scriptId, workspaceId: workspace.workspaceId, toVersion }).unwrap();
      setWorkspace(reverted);
      setMessages((current) => [
        ...current,
        { role: "assistant", text: `Reverted to version ${toVersion}.`, createdAt: Date.now() },
      ]);
    } catch (err) {
      setError(err?.data?.message || err?.error || "Could not revert the workspace.");
    }
  };

  const handleMerge = async () => {
    if (!workspace?.workspaceId || busy) return;
    setError("");
    try {
      const result = await mergeWorkspace({ scriptId, workspaceId: workspace.workspaceId }).unwrap();
      setMessages((current) => [
        ...current,
        { role: "assistant", text: `Merged version ${result.mergedVersion} into the live project.`, createdAt: Date.now() },
      ]);
      onMerged?.(result);
    } catch (err) {
      setError(err?.data?.message || err?.error || "Could not merge the workspace into the project.");
    }
  };

  return (
    <div className="creator-panel space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-purple-500/15 text-purple-200">
            <Sparkles size={16} />
          </span>
          <div>
            <p className="text-sm font-black text-white">AI workspace chat</p>
            <p className="text-[11px] font-semibold text-slate-500">
              Grounded on this project&rsquo;s shots. Edits are sandboxed until you merge.
              {workspace?.currentVersion ? ` Version ${workspace.currentVersion}.` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCheckpoint}
            disabled={!workspace?.workspaceId || busy}
            className="creator-control flex h-8 items-center gap-1.5 px-3 text-[11px] font-bold text-slate-200 disabled:opacity-40"
            title="Save a checkpoint of the current version"
          >
            {createCheckpointState.isLoading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Checkpoint
          </button>
          <button
            type="button"
            onClick={handleMerge}
            disabled={!workspace?.workspaceId || busy}
            className="creator-primary flex h-8 items-center gap-1.5 px-3 text-[11px] font-black text-white disabled:opacity-40"
            title="Merge this workspace's shots into the live project"
          >
            {mergeWorkspaceState.isLoading ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            Merge into project
          </button>
        </div>
      </div>

      {checkpoints.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-white/10 bg-black/20 p-2">
          <History size={13} className="shrink-0 text-slate-500" />
          {checkpoints.map((cp) => (
            <button
              key={cp.checkpointId}
              type="button"
              onClick={() => handleRevert(cp.version)}
              disabled={busy}
              className="flex items-center gap-1 rounded border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-bold text-slate-300 hover:border-purple-300/40 hover:text-white disabled:opacity-40"
              title={`Revert to ${cp.title}`}
            >
              <Undo2 size={11} /> {cp.title}
            </button>
          ))}
        </div>
      )}

      <div ref={listRef} className="custom-scrollbar max-h-72 min-h-[6rem] space-y-2 overflow-y-auto rounded-lg border border-white/10 bg-black/20 p-3">
        {messages.length === 0 ? (
          <p className="text-xs font-semibold text-slate-500">
            Ask for a change to the story - e.g. &ldquo;shot 4 feels flat, make the hook punchier&rdquo; - or just ask a
            question about the project. Nothing changes in the live project until you hit Merge.
          </p>
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
                {entry.text}
                {Array.isArray(entry.affectedShots) && entry.affectedShots.length > 0 && (
                  <p className="mt-1 text-[10px] font-black uppercase tracking-normal text-purple-200">
                    Updated shot{entry.affectedShots.length > 1 ? "s" : ""}: {entry.affectedShots.join(", ")}
                  </p>
                )}
              </div>
              {entry.role === "user" && (
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-slate-300">
                  <UserRound size={12} />
                </span>
              )}
            </div>
          ))
        )}
        {(chatState.isLoading || inspirationJobId) && (
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
            <Loader2 size={12} className="animate-spin" /> {inspirationJobId ? "Regenerating shot from image…" : "Thinking…"}
          </div>
        )}
      </div>

      {error && <p className="text-[11px] font-bold text-rose-300">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={shotNumberDraft}
          onChange={(event) => setShotNumberDraft(event.target.value.replace(/[^0-9]/g, ""))}
          placeholder="Shot #"
          className="h-9 w-20 rounded-lg border border-white/10 bg-black/40 px-2 text-xs font-bold text-slate-100 focus:border-purple-400/60 focus:outline-none"
        />
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
          }}
          placeholder="Describe the change you want, or ask a question…"
          className="h-9 min-w-[12rem] flex-1 rounded-lg border border-white/10 bg-black/40 px-3 text-xs font-semibold text-slate-100 focus:border-purple-400/60 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="creator-control flex h-9 items-center gap-1.5 px-3 text-[11px] font-bold text-slate-200 disabled:opacity-40"
          title="Attach an inspiration image to the shot number above"
        >
          <ImagePlus size={13} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => handleUploadInspiration(event.target.files)}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!draft.trim() || busy}
          className="creator-primary flex h-9 items-center gap-1.5 px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-55"
        >
          {chatState.isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Send
        </button>
      </div>
    </div>
  );
}
