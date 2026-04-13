import { useState, useEffect, useRef } from 'react';
import {
  Phone, PhoneOff, Mic, MicOff, Pause, Play, ArrowRightLeft,
  Brain, TrendingUp, Zap, User, Bot, Headphones, Activity,
  Volume2, Clock,
} from 'lucide-react';

// ── Demo data ──
const DEMO_TRANSCRIPT = [
  { role: 'bot', text: 'Hello! Thank you for calling Acme Corp. How can I help you today?', ts: Date.now() - 32000 },
  { role: 'user', text: 'Hi, I want to know about your enterprise pricing plan.', ts: Date.now() - 26000 },
  { role: 'bot', text: 'Great question! Our Enterprise plan starts at ₹2,499/month per agent with unlimited AI minutes, 24/7 support, and advanced analytics. Would you like a detailed breakdown?', ts: Date.now() - 19000 },
  { role: 'user', text: "Yes please, and do you support Hindi language bots?", ts: Date.now() - 12000 },
  { role: 'bot', text: 'Absolutely! We support Hindi, English, Tamil, Telugu, Bengali, and mixed Hindi-English. Our STT accuracy is 95%+ for Indian languages. Let me connect you with our solutions team.', ts: Date.now() - 5000 },
];

const DEMO_INTENTS = [
  { intent: 'pricing_query', confidence: 0.93 },
  { intent: 'interested', confidence: 0.87 },
  { intent: 'language_support', confidence: 0.81 },
];

/** @param {{ auth: any }} props */
export default function Console({ auth }) {
  const [demoActive, setDemoActive] = useState(true);
  const [muted, setMuted] = useState(false);
  const [held, setHeld] = useState(false);
  const [elapsed, setElapsed] = useState(185);
  const bottomRef = /** @type {import('react').MutableRefObject<HTMLDivElement|null>} */ (useRef(null));

  useEffect(() => {
    if (!demoActive) return;
    const iv = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(iv);
  }, [demoActive]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, []);

  const fmt = (/** @type {number} */ s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="h-full flex gap-3 p-3 overflow-hidden">

      {/* ═══ LEFT COLUMN: Call + Transcript ═══ */}
      <div className="flex-[5] flex flex-col gap-3 min-w-0">

        {/* Call Card */}
        <div className="rounded-2xl p-5 shrink-0 animate-fadein" style={{
          background: demoActive ? 'linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)' : 'var(--surface)',
          border: demoActive ? '1px solid var(--border-active)' : '1px solid var(--border)',
          boxShadow: demoActive ? '0 0 30px var(--accent-soft)' : 'none',
        }}>
          {demoActive ? (
            <>
              {/* Caller row */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--green-soft)' }}>
                      <Phone className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 animate-pulse" style={{ borderColor: 'var(--surface)' }} />
                  </div>
                  <div>
                    <p className="text-lg font-bold">+91 98765 43210</p>
                    <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Inbound · Mumbai, MH</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-mono font-bold" style={{ color: 'var(--accent)' }}>{fmt(elapsed)}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400 mt-1">Connected</p>
                </div>
              </div>

              {/* Live waveform */}
              <div className="mb-5">
                <Waveform active={!muted && !held} color="var(--accent)" label="Agent Audio" />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <CallCtrl icon={muted ? MicOff : Mic} label={muted ? 'Unmute' : 'Mute'} active={muted}
                  onClick={() => setMuted(!muted)} activeColor="var(--red)" />
                <CallCtrl icon={held ? Play : Pause} label={held ? 'Resume' : 'Hold'} active={held}
                  onClick={() => setHeld(!held)} activeColor="var(--amber)" />
                <CallCtrl icon={ArrowRightLeft} label="Transfer" onClick={() => alert('Transfer dialog')} />
                <div className="flex-1" />
                <button onClick={() => setDemoActive(false)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02]"
                  style={{ background: 'var(--red)', boxShadow: '0 0 20px var(--red-soft)' }}>
                  <PhoneOff className="w-4 h-4" /> End Call
                </button>
              </div>
            </>
          ) : (
            /* Idle */
            <div className="py-10 text-center">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--surface-2)' }}>
                <Headphones className="w-10 h-10" style={{ color: 'var(--text-dim)' }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-dim)' }}>Ready for incoming calls</p>
              <p className="text-xs mt-1" style={{ color: 'var(--border)' }}>SIP registered · Ext. {auth.user?.extension}</p>
              <button onClick={() => { setDemoActive(true); setElapsed(0); setMuted(false); setHeld(false); }}
                className="mt-5 text-xs font-semibold px-4 py-2 rounded-lg transition-colors" style={{ color: 'var(--accent)', background: 'var(--accent-soft)' }}>
                Simulate Incoming Call
              </button>
            </div>
          )}
        </div>

        {/* Transcript */}
        <div className="flex-1 rounded-2xl flex flex-col min-h-0 overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="px-4 py-3 flex items-center justify-between shrink-0 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              <span className="text-xs font-bold uppercase tracking-wider">Live Transcript</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ color: 'var(--text-dim)', background: 'var(--surface-2)' }}>
              {demoActive ? DEMO_TRANSCRIPT.length : 0} messages
            </span>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {!demoActive ? (
              <p className="text-center text-sm py-12" style={{ color: 'var(--text-dim)' }}>Transcript appears during calls</p>
            ) : DEMO_TRANSCRIPT.map((msg, i) => (
              <TranscriptBubble key={i} msg={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>

      {/* ═══ RIGHT COLUMN: AI Panel ═══ */}
      <div className="w-[300px] flex flex-col gap-3 overflow-y-auto shrink-0">

        {/* Caller Info */}
        <Panel title="Caller" icon={User}>
          {demoActive ? (
            <div className="space-y-2.5">
              <InfoRow label="Number" value="+91 98765 43210" />
              <InfoRow label="Previous" value="3 calls" />
              <InfoRow label="Last Call" value="2 days ago" />
              <InfoRow label="Language" value="Hindi + English" />
              <InfoRow label="Avg Sentiment" value="+0.74" accent />
            </div>
          ) : <Empty text="No active call" />}
        </Panel>

        {/* Intents */}
        <Panel title="Detected Intents" icon={Brain}>
          {demoActive ? (
            <div className="space-y-2.5">
              {DEMO_INTENTS.map((d) => (
                <div key={d.intent}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold">{d.intent}</span>
                    <span className="text-[10px] font-mono" style={{ color: d.confidence > 0.85 ? 'var(--green)' : 'var(--amber)' }}>
                      {(d.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${d.confidence * 100}%`, background: d.confidence > 0.85 ? 'var(--green)' : d.confidence > 0.6 ? 'var(--amber)' : 'var(--border)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : <Empty text="Intents appear during calls" />}
        </Panel>

        {/* Sentiment */}
        <Panel title="Sentiment" icon={TrendingUp}>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2.5 rounded-full overflow-hidden relative" style={{ background: 'var(--surface-3)' }}>
              <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700" style={{ width: demoActive ? '78%' : '50%', background: demoActive ? 'var(--green)' : 'var(--border)' }} />
            </div>
            <span className="text-lg font-bold font-mono" style={{ color: demoActive ? 'var(--green)' : 'var(--text-dim)' }}>
              {demoActive ? '+0.78' : '—'}
            </span>
          </div>
          {demoActive && <p className="text-[10px] mt-2" style={{ color: 'var(--text-dim)' }}>Caller is engaged and positive</p>}
        </Panel>

        {/* AI Suggestions */}
        <Panel title="AI Suggestions" icon={Zap}>
          {demoActive ? (
            <div className="space-y-2">
              <Suggestion text="Caller interested in Enterprise — mention 30-day free trial" type="action" />
              <Suggestion text="Hindi language support confirmed — offer demo" type="info" />
              <Suggestion text="High interest detected — consider transferring to Sales" type="escalation" />
            </div>
          ) : <Empty text="Suggestions appear during calls" />}
        </Panel>

        {/* Today Stats */}
        <Panel title="My Stats Today" icon={Activity}>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Calls" value="12" />
            <Stat label="Avg Handle" value="4m 12s" />
            <Stat label="Sentiment" value="+0.68" />
            <Stat label="Transfers" value="2" />
          </div>
        </Panel>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════

/** @param {{ active: boolean, color: string, label: string }} props */
function Waveform({ active, color, label }) {
  const bars = 48;
  return (
    <div className="flex items-center gap-1">
      <span className="text-[9px] font-mono uppercase tracking-wider w-16 shrink-0" style={{ color: 'var(--text-dim)' }}>{label}</span>
      <div className="flex-1 flex items-center justify-center gap-[2px] h-8">
        {Array.from({ length: bars }, (_, i) => {
          const seed = Math.sin(i * 73.7 + 311.7) * 43758.5453;
          const baseH = Math.abs(seed - Math.floor(seed));
          const h = active ? baseH * 28 + 4 : 3;
          const delay = `${(i * 0.04).toFixed(2)}s`;
          return (
            <div key={i} className="rounded-full shrink-0" style={{
              width: 3, height: h, background: color, opacity: active ? 0.6 + baseH * 0.4 : 0.15,
              animation: active ? `wave ${0.6 + baseH * 0.8}s ease-in-out ${delay} infinite` : 'none',
            }} />
          );
        })}
      </div>
    </div>
  );
}

/** @param {{ msg: { role: string, text: string, ts: number } }} props */
function TranscriptBubble({ msg }) {
  const isUser = msg.role === 'user';
  const isBot = msg.role === 'bot';
  const color = isUser ? 'var(--accent)' : isBot ? 'var(--green)' : 'var(--amber)';
  const bg = isUser ? 'var(--accent-soft)' : isBot ? 'var(--green-soft)' : 'var(--amber-soft)';
  const label = isUser ? 'Caller' : isBot ? 'Bot' : 'System';
  const Icon = isUser ? User : Bot;
  const time = new Date(msg.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''} animate-fadein`}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'}`} style={{ background: bg }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color }}>{label}</span>
          <span className="text-[9px] font-mono" style={{ color: 'var(--text-dim)' }}>{time}</span>
        </div>
        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text)' }}>{msg.text}</p>
        {/* Mini waveform per bubble */}
        <div className="flex items-center gap-[1px] mt-2 h-2.5">
          {Array.from({ length: 18 }, (_, i) => {
            const s = Math.sin(i * 127 + 311) * 43758;
            const h = (Math.abs(s - Math.floor(s)) * 0.7 + 0.3) * 10;
            return <div key={i} className="rounded-full" style={{ width: 2, height: h, background: color, opacity: 0.3 }} />;
          })}
        </div>
      </div>
    </div>
  );
}

/** @param {{ icon: import('react').ElementType, label: string, onClick: () => void, active?: boolean, activeColor?: string }} props */
function CallCtrl({ icon: Icon, label, onClick, active = false, activeColor }) {
  return (
    <button onClick={() => onClick()}
      className="flex flex-col items-center gap-1 rounded-xl px-4 py-2.5 transition-all"
      style={{
        background: active && activeColor ? `${activeColor}20` : 'var(--surface-2)',
        color: active && activeColor ? activeColor : 'var(--text)',
        border: `1px solid ${active && activeColor ? `${activeColor}40` : 'var(--border)'}`,
      }}>
      <Icon className="w-4 h-4" />
      <span className="text-[9px] font-semibold uppercase tracking-wider">{label}</span>
    </button>
  );
}

/** @param {{ title: string, icon: import('react').ElementType, children: import('react').ReactNode }} props */
function Panel({ title, icon: Icon, children }) {
  return (
    <div className="rounded-2xl p-4 animate-fadein" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
        <span className="text-[11px] font-bold uppercase tracking-wider">{title}</span>
      </div>
      {children}
    </div>
  );
}

/** @param {{ label: string, value: string, accent?: boolean }} props */
function InfoRow({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>{label}</span>
      <span className="text-xs font-semibold" style={{ color: accent ? 'var(--green)' : 'var(--text)' }}>{value}</span>
    </div>
  );
}

/** @param {{ text: string, type: string }} props */
function Suggestion({ text, type }) {
  const colors = /** @type {Record<string,{bg:string,border:string,text:string}>} */ ({
    action: { bg: 'var(--accent-soft)', border: 'var(--accent)', text: 'var(--text)' },
    info: { bg: 'var(--blue-soft)', border: 'var(--blue)', text: 'var(--text)' },
    escalation: { bg: 'var(--amber-soft)', border: 'var(--amber)', text: 'var(--text)' },
  });
  const c = colors[type] || colors.info;
  return (
    <div className="rounded-xl px-3 py-2.5 text-[11px] leading-relaxed" style={{ background: c.bg, borderLeft: `3px solid ${c.border}`, color: c.text }}>
      {text}
    </div>
  );
}

/** @param {{ label: string, value: string }} props */
function Stat({ label, value }) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: 'var(--surface-2)' }}>
      <p className="text-base font-bold">{value}</p>
      <p className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-dim)' }}>{label}</p>
    </div>
  );
}

/** @param {{ text: string }} props */
function Empty({ text }) {
  return <p className="text-xs py-4 text-center" style={{ color: 'var(--text-dim)' }}>{text}</p>;
}