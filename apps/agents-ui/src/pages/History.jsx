import { useState } from 'react';
import {
  PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock, Search,
  Play, Pause,
} from 'lucide-react';

const CALLS = [
  { id: '1', dir: 'in', status: 'completed', time: '2026-03-25T10:15:00Z', number: '+91 98765 43210', name: 'Rajesh Kumar', dur: 245, sentiment: 0.82, has_rec: true },
  { id: '2', dir: 'out', status: 'completed', time: '2026-03-25T09:45:00Z', number: '+91 91234 56789', name: 'Sita Patel', dur: 180, sentiment: 0.45, has_rec: true },
  { id: '3', dir: 'in', status: 'missed', time: '2026-03-25T09:30:00Z', number: '+91 76543 21098', name: 'Unknown', dur: 0, sentiment: 0, has_rec: false },
  { id: '4', dir: 'in', status: 'completed', time: '2026-03-25T08:20:00Z', number: '+91 99887 76655', name: 'Amit Verma', dur: 312, sentiment: 0.91, has_rec: true },
  { id: '5', dir: 'out', status: 'completed', time: '2026-03-24T17:10:00Z', number: '+91 88776 65544', name: 'Priya Nair', dur: 156, sentiment: 0.65, has_rec: false },
  { id: '6', dir: 'in', status: 'completed', time: '2026-03-24T16:00:00Z', number: '+91 77665 54433', name: 'Deepak Joshi', dur: 420, sentiment: -0.15, has_rec: true },
  { id: '7', dir: 'out', status: 'completed', time: '2026-03-24T14:30:00Z', number: '+91 66554 43322', name: 'Meena Iyer', dur: 98, sentiment: 0.55, has_rec: false },
  { id: '8', dir: 'in', status: 'missed', time: '2026-03-24T13:15:00Z', number: '+91 55443 32211', name: 'Unknown', dur: 0, sentiment: 0, has_rec: false },
];

export default function History() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [playingId, setPlayingId] = useState(/** @type {string|null} */ (null));

  const filtered = CALLS.filter((c) => {
    if (search && !c.number.includes(search) && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'in') return c.dir === 'in';
    if (filter === 'out') return c.dir === 'out';
    if (filter === 'missed') return c.status === 'missed';
    return true;
  });

  const fmt = (/** @type {number} */ s) => s ? `${Math.floor(s / 60)}m ${(s % 60).toString().padStart(2, '0')}s` : '—';
  const fmtDate = (/** @type {string} */ iso) => {
    const d = new Date(iso);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    return (isToday ? 'Today' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })) +
      ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-lg font-bold">Call History</h1>
        <div className="flex items-center gap-2">
          {/* Filter tabs */}
          <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ background: 'var(--surface-2)' }}>
            {[{ v: 'all', l: 'All' }, { v: 'in', l: 'Inbound' }, { v: 'out', l: 'Outbound' }, { v: 'missed', l: 'Missed' }].map((f) => (
              <button key={f.v} onClick={() => setFilter(f.v)}
                className="px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-colors"
                style={{
                  background: filter === f.v ? 'var(--surface-3)' : 'transparent',
                  color: filter === f.v ? 'var(--text)' : 'var(--text-dim)',
                }}>{f.l}</button>
            ))}
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-dim)' }} />
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-lg text-xs w-48 outline-none transition-colors focus:ring-1"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </div>
        </div>
      </div>

      {/* Call list */}
      <div className="flex-1 overflow-y-auto rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>No calls found</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {filtered.map((c) => {
              const DirIcon = c.dir === 'in' ? (c.status === 'missed' ? PhoneMissed : PhoneIncoming) : PhoneOutgoing;
              const dirColor = c.status === 'missed' ? 'var(--red)' : c.dir === 'in' ? 'var(--blue)' : 'var(--green)';
              const dirBg = c.status === 'missed' ? 'var(--red-soft)' : c.dir === 'in' ? 'var(--blue-soft)' : 'var(--green-soft)';
              const isPlaying = playingId === c.id;

              return (
                <div key={c.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:brightness-110">
                  {/* Direction icon */}
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: dirBg }}>
                    <DirIcon className="w-4 h-4" style={{ color: dirColor }} />
                  </div>

                  {/* Caller info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{c.name !== 'Unknown' ? c.name : c.number}</p>
                    <p className="text-[10px] font-mono" style={{ color: 'var(--text-dim)' }}>
                      {c.name !== 'Unknown' ? c.number : ''} · {fmtDate(c.time)}
                    </p>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Clock className="w-3 h-3" style={{ color: 'var(--text-dim)' }} />
                    <span className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>{fmt(c.dur)}</span>
                  </div>

                  {/* Sentiment */}
                  {c.sentiment !== 0 && (
                    <span className="text-xs font-bold font-mono shrink-0" style={{
                      color: c.sentiment > 0.6 ? 'var(--green)' : c.sentiment > 0.2 ? 'var(--amber)' : 'var(--red)',
                    }}>
                      {c.sentiment > 0 ? '+' : ''}{c.sentiment.toFixed(2)}
                    </span>
                  )}

                  {/* Mini waveform */}
                  <div className="flex items-center gap-[1px] h-4 shrink-0">
                    {Array.from({ length: 12 }, (_, i) => {
                      const s = Math.sin(i * 73.7 + parseInt(c.id) * 311.7) * 43758.5453;
                      const h = c.dur > 0 ? (Math.abs(s - Math.floor(s)) * 0.7 + 0.3) * 14 : 2;
                      return <div key={i} className="rounded-full" style={{ width: 2, height: h, background: dirColor, opacity: 0.35 }} />;
                    })}
                  </div>

                  {/* Play recording */}
                  {c.has_rec && (
                    <button onClick={() => setPlayingId(isPlaying ? null : c.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                      style={{ background: isPlaying ? 'var(--accent-soft)' : 'var(--surface-2)', border: `1px solid ${isPlaying ? 'var(--accent)' : 'var(--border)'}` }}>
                      {isPlaying ? <Pause className="w-3 h-3" style={{ color: 'var(--accent)' }} /> : <Play className="w-3 h-3" style={{ color: 'var(--text-dim)' }} />}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats footer */}
      <div className="flex items-center gap-6 shrink-0 px-2">
        <FootStat label="Total" value={String(CALLS.length)} />
        <FootStat label="Inbound" value={String(CALLS.filter((c) => c.dir === 'in').length)} />
        <FootStat label="Outbound" value={String(CALLS.filter((c) => c.dir === 'out').length)} />
        <FootStat label="Missed" value={String(CALLS.filter((c) => c.status === 'missed').length)} />
        <FootStat label="Avg Duration" value={fmt(Math.floor(CALLS.filter((c) => c.dur > 0).reduce((a, c) => a + c.dur, 0) / CALLS.filter((c) => c.dur > 0).length))} />
        <FootStat label="Avg Sentiment" value={`+${(CALLS.filter((c) => c.sentiment > 0).reduce((a, c) => a + c.sentiment, 0) / CALLS.filter((c) => c.sentiment > 0).length).toFixed(2)}`} />
      </div>
    </div>
  );
}

/** @param {{ label: string, value: string }} props */
function FootStat({ label, value }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>{label}</p>
      <p className="text-xs font-bold">{value}</p>
    </div>
  );
}