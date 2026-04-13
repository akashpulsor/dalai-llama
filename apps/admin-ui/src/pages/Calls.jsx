import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectTenantId } from '@dalaillama/shared-store/slices/tenantSlice.js';
import {
  Phone, Search, Download, PhoneIncoming, PhoneOutgoing,
  Play, FileText, Clock, User, X,
} from 'lucide-react';
import AudioPlayer from '@dalaillama/shared-ui/components/AudioPlayer.jsx';

// Mock CDR data — replace with RTK Query when CDR list endpoint is added
const MOCK_CDRS = [
  { id: '1', direction: 'INBOUND', status: 'COMPLETED', start_time: '2026-03-23T10:15:00Z', caller_number: '+919876543210', callee_number: '+918888888888', agent_name: 'Priya Sharma', duration_seconds: 245, recording_url: null, transcript_url: null, product_code: 'AI_CC', cost: 2.45 },
  { id: '2', direction: 'OUTBOUND', status: 'COMPLETED', start_time: '2026-03-23T09:45:00Z', caller_number: '1001', callee_number: '+919123456789', agent_name: 'Rahul Dev', duration_seconds: 180, recording_url: '/mock-recording.wav', transcript_url: null, product_code: 'AI_CC', cost: 1.80 },
  { id: '3', direction: 'INBOUND', status: 'MISSED', start_time: '2026-03-23T09:30:00Z', caller_number: '+917654321098', callee_number: '+918888888888', agent_name: null, duration_seconds: 0, recording_url: null, transcript_url: null, product_code: 'CONV_IVR', cost: 0 },
  { id: '4', direction: 'INBOUND', status: 'COMPLETED', start_time: '2026-03-23T08:20:00Z', caller_number: '+919988776655', callee_number: '+918888888888', agent_name: 'Anita Roy', duration_seconds: 312, recording_url: '/mock-recording.wav', transcript_url: '/mock-transcript.json', product_code: 'AI_CC', cost: 3.12 },
];

const STATUS_STYLE = /** @type {const} */ ({
  COMPLETED: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  MISSED:    { label: 'Missed',    bg: 'bg-red-50',     text: 'text-red-700' },
  FAILED:    { label: 'Failed',    bg: 'bg-red-50',     text: 'text-red-700' },
  BUSY:      { label: 'Busy',      bg: 'bg-amber-50',   text: 'text-amber-700' },
  NO_ANSWER: { label: 'No Answer', bg: 'bg-slate-100',  text: 'text-slate-600' },
});

export default function Calls() {
  const [search, setSearch] = useState('');
  const [dirFilter, setDirFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedCall, setSelectedCall] = useState(/** @type {any} */ (null));
  const [playingUrl, setPlayingUrl] = useState(/** @type {string|null} */ (null));

  const cdrs = MOCK_CDRS;

  const filtered = cdrs.filter((c) => {
    const matchSearch = !search ||
      c.caller_number.includes(search) ||
      c.callee_number.includes(search) ||
      c.agent_name?.toLowerCase().includes(search.toLowerCase());
    const matchDir = dirFilter === 'ALL' || c.direction === dirFilter;
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchSearch && matchDir && matchStatus;
  });

  const fmt = (/** @type {number} */ s) => s ? `${Math.floor(s / 60)}m ${s % 60}s` : '—';
  const fmtDate = (/** @type {string} */ iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' ' +
      d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Call Records</h1>
          <p className="text-sm text-slate-500 mt-1">{cdrs.length} records</p>
        </div>
        <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl px-4 py-2.5 font-semibold transition-colors flex items-center gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search number, agent..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <select value={dirFilter} onChange={(e) => setDirFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="ALL">All Directions</option>
          <option value="INBOUND">Inbound</option>
          <option value="OUTBOUND">Outbound</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="ALL">All Status</option>
          <option value="COMPLETED">Completed</option>
          <option value="MISSED">Missed</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* Recording player */}
      {playingUrl && (
        <div className="relative">
          <button onClick={() => setPlayingUrl(null)} className="absolute right-2 top-2 z-10 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
          <AudioPlayer src={playingUrl} title="Call Recording" />
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              {['', 'Date', 'From', 'To', 'Agent', 'Duration', 'Status', 'Cost', ''].map((/** @type {string} */ h, /** @type {number} */ i) => (
                <th key={i} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const st = STATUS_STYLE[/** @type {keyof typeof STATUS_STYLE} */ (c.status)] || STATUS_STYLE.COMPLETED;
              return (
                <tr key={c.id} onClick={() => setSelectedCall(c)}
                  className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${c.direction === 'INBOUND' ? 'bg-blue-50' : 'bg-emerald-50'}`}>
                      {c.direction === 'INBOUND' ? <PhoneIncoming className="w-4 h-4 text-blue-600" /> : <PhoneOutgoing className="w-4 h-4 text-emerald-600" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{fmtDate(c.start_time)}</td>
                  <td className="px-4 py-3 text-sm text-slate-700 font-mono">{c.caller_number}</td>
                  <td className="px-4 py-3 text-sm text-slate-700 font-mono">{c.callee_number}</td>
                  <td className="px-4 py-3">
                    {c.agent_name ? (
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="text-sm text-slate-600">{c.agent_name}</span>
                      </div>
                    ) : <span className="text-sm text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className="text-sm font-mono text-slate-700">{fmt(c.duration_seconds)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>{st.label}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-600">{c.cost ? `₹${c.cost.toFixed(2)}` : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {c.recording_url && (
                        <button onClick={() => setPlayingUrl(c.recording_url)}
                          className="w-7 h-7 rounded-lg bg-primary-50 hover:bg-primary-100 flex items-center justify-center transition-colors">
                          <Play className="w-3.5 h-3.5 text-primary-600" />
                        </button>
                      )}
                      {c.transcript_url && (
                        <button className="w-7 h-7 rounded-lg bg-violet-50 hover:bg-violet-100 flex items-center justify-center transition-colors">
                          <FileText className="w-3.5 h-3.5 text-violet-600" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
