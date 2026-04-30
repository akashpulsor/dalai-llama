import { PhoneIncoming, PhoneOutgoing, Play, FileText, Clock, User } from 'lucide-react';

/**
 * @typedef {Object} CallRecord
 * @property {string} direction
 * @property {string} status
 * @property {string} start_time
 * @property {string} caller_number
 * @property {string} callee_number
 * @property {string} [agent_name]
 * @property {number} [duration_seconds]
 * @property {string} [recording_url]
 * @property {string} [transcript_url]
 */

/**
 * CDR table row — single call record with inline recording + transcript actions.
 *
 * @param {{ record: CallRecord, onPlayRecording?: (url: string) => void,
 *           onViewTranscript?: (url: string) => void, onClick?: () => void }} props
 */
export default function CallRecordRow({ record, onPlayRecording, onViewTranscript, onClick }) {
  const isInbound = record.direction === 'INBOUND';

  const statusConfig = {
    COMPLETED: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    MISSED: { label: 'Missed', bg: 'bg-red-50', text: 'text-red-700' },
    FAILED: { label: 'Failed', bg: 'bg-red-50', text: 'text-red-700' },
    BUSY: { label: 'Busy', bg: 'bg-amber-50', text: 'text-amber-700' },
    NO_ANSWER: { label: 'No Answer', bg: 'bg-slate-50', text: 'text-slate-600' },
  };
const status = statusConfig[/** @type {keyof typeof statusConfig} */ (record.status)] || statusConfig.COMPLETED;
  const formatDuration = (/** @type {number} */ seconds) => {
    if (!seconds) return '-';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const formatDate = (/** @type {string} */ iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' ' +
      d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <tr
      onClick={onClick}
      className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Direction */}
      <td className="px-4 py-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isInbound ? 'bg-blue-50' : 'bg-emerald-50'}`}>
          {isInbound
            ? <PhoneIncoming className="w-4 h-4 text-blue-600" />
            : <PhoneOutgoing className="w-4 h-4 text-emerald-600" />}
        </div>
      </td>

      {/* Date */}
      <td className="px-4 py-3">
        <span className="text-sm text-slate-700">{formatDate(record.start_time)}</span>
      </td>

      {/* Caller / Callee */}
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-medium text-slate-900">{record.caller_number || '-'}</p>
          <p className="text-xs text-slate-400">{isInbound ? 'Caller' : 'From'}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-medium text-slate-900">{record.callee_number || '-'}</p>
          <p className="text-xs text-slate-400">{isInbound ? 'DID' : 'To'}</p>
        </div>
      </td>

      {/* Agent */}
      <td className="px-4 py-3">
        {record.agent_name ? (
          <div className="flex items-center gap-1.5">
            <User className="w-3 h-3 text-slate-400" />
            <span className="text-sm text-slate-600">{record.agent_name}</span>
          </div>
        ) : (
          <span className="text-sm text-slate-400">-</span>
        )}
      </td>

      {/* Duration */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-slate-400" />
          <span className="text-sm font-mono text-slate-700">{formatDuration(record.duration_seconds ?? 0)}</span>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
          {status.label}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          {record.recording_url && (
            <button
              onClick={(e) => { e.stopPropagation(); onPlayRecording?.(/** @type {string} */ (record.recording_url)); }}
              className="w-7 h-7 rounded-lg bg-purple-50 hover:bg-purple-100 flex items-center justify-center transition-colors"
              title="Play recording"
            >
              <Play className="w-3.5 h-3.5 text-purple-600" />
            </button>
          )}
          {record.transcript_url && (
            <button
              onClick={(e) => { e.stopPropagation(); onViewTranscript?.(/** @type {string} */ (record.transcript_url)); }}
              className="w-7 h-7 rounded-lg bg-violet-50 hover:bg-violet-100 flex items-center justify-center transition-colors"
              title="View transcript"
            >
              <FileText className="w-3.5 h-3.5 text-violet-600" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
