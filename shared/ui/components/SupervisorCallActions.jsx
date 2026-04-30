import { Headphones, MessageSquare, Megaphone } from 'lucide-react';
import { useListenCallMutation, useWhisperCallMutation, useBargeCallMutation } from '../../store/slices/pbxCoreApi.js';

/**
 * Listen/Whisper/Barge buttons for supervisor call monitoring.
 *
 * @param {{ callId: string, disabled?: boolean }} props
 */
export default function SupervisorCallActions({ callId, disabled = false }) {
  const [doListen, { isLoading: listenLoading }] = useListenCallMutation();
  const [doWhisper, { isLoading: whisperLoading }] = useWhisperCallMutation();
  const [doBarge, { isLoading: bargeLoading }] = useBargeCallMutation();

  const isAnyLoading = listenLoading || whisperLoading || bargeLoading;

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => doListen({ callId })}
        disabled={disabled || isAnyLoading}
        title="Silent Listen — hear both sides, agent doesn't know"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 disabled:bg-slate-50 text-blue-700 disabled:text-slate-400 rounded-lg text-xs font-semibold transition-colors"
      >
        <Headphones className="w-3.5 h-3.5" />
        {listenLoading ? '...' : 'Listen'}
      </button>

      <button
        onClick={() => doWhisper({ callId })}
        disabled={disabled || isAnyLoading}
        title="Whisper — talk to agent only, caller can't hear"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 disabled:bg-slate-50 text-amber-700 disabled:text-slate-400 rounded-lg text-xs font-semibold transition-colors"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        {whisperLoading ? '...' : 'Whisper'}
      </button>

      <button
        onClick={() => doBarge({ callId })}
        disabled={disabled || isAnyLoading}
        title="Barge — join call, both sides hear you"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 disabled:bg-slate-50 text-red-700 disabled:text-slate-400 rounded-lg text-xs font-semibold transition-colors"
      >
        <Megaphone className="w-3.5 h-3.5" />
        {bargeLoading ? '...' : 'Barge'}
      </button>
    </div>
  );
}
