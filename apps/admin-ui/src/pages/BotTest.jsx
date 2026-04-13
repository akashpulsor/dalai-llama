import { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectTenantId } from '@dalaillama/shared-store/slices/tenantSlice.js';
import { useListBotsQuery } from '@dalaillama/shared-store/slices/pbxCoreApi.js';
import useBotTest from '@dalaillama/shared-hooks/useBotTest.js';
import {
  FlaskConical, Phone, MessageSquare, Bot, Send, Mic, MicOff,
  Play, Square, RotateCcw, Zap, Brain, TrendingUp, Pause,
  Volume2,
} from 'lucide-react';

const MOCK_BOTS = [
  { id: 'bot-001', name: 'Sales Assistant', product_mode: 'CONV_IVR', is_active: true, language: 'en' },
  { id: 'bot-002', name: 'Support Bot', product_mode: 'AI_CC_ASSIST', is_active: true, language: 'hi-en' },
  { id: 'bot-003', name: 'Survey Bot', product_mode: 'OUTBOUND', is_active: false, language: 'en' },
];

export default function BotTest() {
  const tenantId = useSelector(selectTenantId);
  const { data: apiBots } = useListBotsQuery(/** @type {string} */ (tenantId), { skip: !tenantId });
  const allBots = /** @type {any[]} */ (apiBots) || MOCK_BOTS;
  const activeBots = allBots.filter((/** @type {any} */ b) => b.is_active);

  const [selectedBotId, setSelectedBotId] = useState(/** @type {string|null} */ (null));
  const [mode, setMode] = useState(/** @type {'text'|'call'} */ ('text'));

  const botTest = useBotTest(selectedBotId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bot Testing</h1>
          <p className="text-sm text-slate-500 mt-1">Test your AI bots in real-time</p>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-slate-400" />
          <select value={selectedBotId || ''}
            onChange={(e) => { setSelectedBotId(e.target.value || null); botTest.endTest(); }}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[200px]">
            <option value="">Select a bot...</option>
            {activeBots.map((/** @type {any} */ b) => (
              <option key={b.id} value={b.id}>{b.name} ({b.product_mode})</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          <TabBtn active={mode === 'text'} icon={MessageSquare} label="Text Test" onClick={() => setMode('text')} />
          <TabBtn active={mode === 'call'} icon={Phone} label="Call Test" onClick={() => setMode('call')} />
        </div>
      </div>

      {!selectedBotId ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-16 text-center">
          <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-sm font-medium">Select a bot above to start testing</p>
        </div>
      ) : mode === 'text' ? (
        <EnhancedBotChat botTest={botTest} />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-16 text-center">
          <Phone className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-sm font-medium mb-2">Real Call Test</p>
          <p className="text-slate-400 text-xs mb-6">Originates a real call through Kamailio → FreeSWITCH → voice-brain.</p>
          <div className="flex gap-3 justify-center">
            <button className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-6 py-2.5 font-semibold transition-colors flex items-center gap-2">
              <Phone className="w-4 h-4" /> Start Browser Call
            </button>
            <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl px-6 py-2.5 font-semibold transition-colors">Call My Phone</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ENHANCED BOT CHAT — with mic waveform + bot audio + colored bars
// ═══════════════════════════════════════════════════════════

/**
 * @param {{ botTest: ReturnType<typeof useBotTest> }} props
 */
function EnhancedBotChat({ botTest }) {
  const { transcript, intents, sentiment, escalationEvents, isActive } = botTest;
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const bottomRef = /** @type {import('react').MutableRefObject<HTMLDivElement|null>} */ (useRef(null));
  const analyserRef = /** @type {import('react').MutableRefObject<AnalyserNode|null>} */ (useRef(null));
  const animFrameRef = /** @type {import('react').MutableRefObject<number|null>} */ (useRef(null));
  const streamRef = /** @type {import('react').MutableRefObject<MediaStream|null>} */ (useRef(null));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript.length]);

  const handleSend = () => {
    if (!input.trim() || !isActive) return;
    botTest.sendMessage(input.trim());
    setInput('');
  };

  // ── Mic recording with live level ──
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((/** @type {number} */ a, /** @type {number} */ b) => a + b, 0) / dataArray.length;
        setMicLevel(avg / 255);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();

      setIsRecording(true);
      botTest.startVoice();
    } catch (/** @type {any} */ err) {
      console.error('Mic error:', err);
    }
  }, [botTest]);

  const stopRecording = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    analyserRef.current = null;
    setIsRecording(false);
    setMicLevel(0);
    botTest.stopVoice();
  }, [botTest]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="flex gap-6 h-[calc(100vh-240px)] min-h-[500px]">
      {/* ── LEFT: Conversation ── */}
      <div className="flex-[3] flex flex-col">
        {/* Session controls */}
        <div className="flex items-center gap-3 mb-4">
          {!isActive ? (
            <button onClick={() => botTest.startTest()}
              className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-5 py-2.5 font-semibold transition-colors flex items-center gap-2">
              <Play className="w-4 h-4" /> Start Test
            </button>
          ) : (
            <>
              <button onClick={() => botTest.endTest()}
                className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-5 py-2.5 font-semibold transition-colors flex items-center gap-2">
                <Square className="w-4 h-4" /> End Test
              </button>
              <button onClick={() => { botTest.endTest(); setTimeout(() => botTest.startTest(), 100); }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl px-4 py-2.5 font-semibold transition-colors flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            </>
          )}
          <span className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${
            isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}>{isActive ? 'Session Active' : 'Not Started'}</span>
        </div>

        {/* Chat messages */}
        <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary-600" />
            <span className="font-bold text-sm text-slate-900">Conversation</span>
            <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full font-semibold">{transcript.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {transcript.length === 0 && (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                {isActive ? 'Send a message or hold mic to speak...' : 'Start test to begin'}
              </div>
            )}

            {transcript.map((/** @type {any} */ msg, /** @type {number} */ i) => (
              <ChatBubble key={i} msg={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input bar */}
        <div className="mt-3 flex items-center gap-2">
          <input type="text" value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={!isActive}
            placeholder={isActive ? 'Type a message...' : 'Start test to begin'}
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-50 disabled:text-slate-400" />
          <button onClick={() => handleSend()} disabled={!isActive || !input.trim()}
            className="bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white rounded-xl p-3 transition-colors">
            <Send className="w-4 h-4" />
          </button>

          {/* Mic button with live level */}
          <div className="relative">
            <button
              onMouseDown={() => isActive && startRecording()}
              onMouseUp={() => stopRecording()}
              onMouseLeave={() => isRecording && stopRecording()}
              onTouchStart={() => isActive && startRecording()}
              onTouchEnd={() => stopRecording()}
              disabled={!isActive}
              className={`rounded-xl p-3 transition-colors relative overflow-hidden ${
                isRecording
                  ? 'bg-red-500 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:bg-slate-50 disabled:text-slate-400'
              }`}>
              {/* Level ring */}
              {isRecording && (
                <div className="absolute inset-0 rounded-xl border-2 border-red-300 animate-ping" style={{ opacity: micLevel }} />
              )}
              {isRecording ? <MicOff className="w-4 h-4 relative z-10" /> : <Mic className="w-4 h-4" />}
            </button>
            {isRecording && (
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="text-[10px] text-red-500 font-semibold animate-pulse">Hold to speak</span>
              </div>
            )}
          </div>
        </div>

        {/* Live mic waveform */}
        {isRecording && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-red-700 uppercase tracking-wider">Recording</span>
              <div className="flex-1">
                <MicWaveform level={micLevel} color="#ef4444" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT: AI Reasoning ── */}
      <div className="flex-[2] flex flex-col gap-4 overflow-y-auto">
        {/* Intent Panel */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-violet-600" />
            <h3 className="font-bold text-sm text-slate-900">Intents</h3>
          </div>
          {intents.length === 0 ? (
            <p className="text-sm text-slate-400">No intents detected yet</p>
          ) : (
            <div className="space-y-2">
              {getIntentDist(intents).map((/** @type {any} */ d) => (
                <div key={d.intent}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700">{d.intent}</span>
                    <span className="text-[10px] text-slate-400">{(d.confidence * 100).toFixed(0)}% ({d.count}x)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all duration-500 ${
                      d.confidence > 0.7 ? 'bg-emerald-500' : d.confidence > 0.4 ? 'bg-amber-500' : 'bg-slate-300'
                    }`} style={{ width: `${d.confidence * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sentiment Gauge */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary-600" />
            <h3 className="font-bold text-sm text-slate-900">Sentiment</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="w-full bg-slate-100 rounded-full h-4 relative overflow-hidden">
                <div className="absolute inset-y-0 left-1/2 transition-all duration-500 rounded-full"
                  style={{
                    width: `${Math.abs(sentiment) * 50}%`,
                    transform: sentiment >= 0 ? 'translateX(0)' : `translateX(-100%)`,
                    backgroundColor: sentiment > 0.3 ? '#10b981' : sentiment < -0.3 ? '#ef4444' : '#f59e0b',
                  }} />
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300" />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-red-400">Negative</span>
                <span className="text-[10px] text-slate-400">Neutral</span>
                <span className="text-[10px] text-emerald-400">Positive</span>
              </div>
            </div>
            <span className={`text-2xl font-bold ${
              sentiment > 0.3 ? 'text-emerald-600' : sentiment < -0.3 ? 'text-red-600' : 'text-amber-600'
            }`}>{sentiment >= 0 ? '+' : ''}{sentiment.toFixed(2)}</span>
          </div>
        </div>

        {/* Escalation */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-sm text-slate-900">Escalation Events</h3>
          </div>
          {escalationEvents.length === 0 ? (
            <p className="text-sm text-slate-400">No escalations triggered</p>
          ) : (
            <div className="space-y-2">
              {escalationEvents.map((/** @type {any} */ evt, /** @type {number} */ i) => (
                <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-xs font-bold text-amber-800 uppercase">{evt.type}</span>
                  </div>
                  {evt.target && <p className="text-xs text-amber-700 mt-1">Target: {evt.target}</p>}
                  {evt.reason && <p className="text-xs text-amber-600 mt-0.5">{evt.reason}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CHAT BUBBLE — colored waveform per speaker
// ═══════════════════════════════════════════════════════════

const SPEAKER_CONFIG = /** @type {const} */ ({
  user:   { label: 'You',    color: '#7C3AED', bg: 'bg-primary-50',  text: 'text-primary-700', waveColor: '#7C3AED', align: 'justify-end' },
  bot:    { label: 'Bot',    color: '#8b5cf6', bg: 'bg-violet-50',   text: 'text-violet-700',  waveColor: '#8b5cf6', align: 'justify-start' },
  system: { label: 'System', color: '#f59e0b', bg: 'bg-amber-50',    text: 'text-amber-700',   waveColor: '#f59e0b', align: 'justify-center' },
});

/** @param {{ msg: { role: string, text: string, audio_url?: string, timestamp?: number } }} props */
function ChatBubble({ msg }) {
  const config = SPEAKER_CONFIG[/** @type {keyof typeof SPEAKER_CONFIG} */ (msg.role)] || SPEAKER_CONFIG.system;

  if (msg.role === 'system') {
    return (
      <div className="flex justify-center">
        <span className="text-xs italic text-amber-600 bg-amber-50 px-3 py-1 rounded-full">{msg.text}</span>
      </div>
    );
  }

  const isUser = msg.role === 'user';

  return (
    <div className={`flex ${config.align} gap-2`}>
      {!isUser && (
        <div className={`w-7 h-7 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
          <Bot className={`w-3.5 h-3.5 ${config.text}`} />
        </div>
      )}
      <div className={`max-w-[75%] ${config.bg} rounded-2xl px-4 py-3`}>
        <p className={`text-[10px] font-semibold uppercase tracking-wider ${config.text} opacity-60 mb-1`}>{config.label}</p>
        <p className={`text-sm ${config.text}`}>{msg.text}</p>

        {/* Mini waveform for each message */}
        <div className="mt-2 flex items-center gap-2">
          <MiniWaveform color={config.waveColor} />
          {msg.audio_url ? (
            <AudioPlayBtn src={msg.audio_url} />
          ) : (
            <span className="text-[10px] text-slate-400">
              {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
            </span>
          )}
        </div>
      </div>
      {isUser && (
        <div className={`w-7 h-7 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
          <Mic className={`w-3.5 h-3.5 ${config.text}`} />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// WAVEFORM COMPONENTS
// ═══════════════════════════════════════════════════════════

/** @param {{ level: number, color: string }} props */
function MicWaveform({ level, color }) {
  const bars = 32;
  return (
    <div className="flex items-center gap-[2px] h-6">
      {Array.from({ length: bars }, (_, i) => {
        const seed = Math.sin(i * 127.1 + Date.now() * 0.001) * 0.5 + 0.5;
        const h = Math.max(4, seed * level * 24);
        return (
          <div key={i} className="rounded-full transition-all duration-75"
            style={{ width: 3, height: h, backgroundColor: color, opacity: 0.6 + level * 0.4 }} />
        );
      })}
    </div>
  );
}

/** @param {{ color: string }} props */
function MiniWaveform({ color }) {
  const bars = 20;
  return (
    <div className="flex items-center gap-[1px] h-3">
      {Array.from({ length: bars }, (_, i) => {
        const seed = Math.sin(i * 73.7 + 311.7) * 43758.5453;
        const h = (Math.abs(seed - Math.floor(seed)) * 0.7 + 0.3) * 12;
        return (
          <div key={i} className="rounded-full"
            style={{ width: 2, height: h, backgroundColor: color, opacity: 0.4 }} />
        );
      })}
    </div>
  );
}

/** @param {{ src: string }} props */
function AudioPlayBtn({ src }) {
  const audioRef = /** @type {import('react').MutableRefObject<HTMLAudioElement|null>} */ (useRef(null));
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); } else { audioRef.current.play(); }
    setPlaying(!playing);
  };

  return (
    <>
      <audio ref={audioRef} src={src} onEnded={() => setPlaying(false)} />
      <button onClick={() => toggle()} className="flex items-center gap-1 text-[10px] text-primary-600 hover:text-primary-700 font-semibold">
        {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        {playing ? 'Pause' : 'Play'}
      </button>
    </>
  );
}

/** @param {{ active: boolean, icon: import('react').ElementType, label: string, onClick: () => void }} props */
function TabBtn({ active, icon: Icon, label, onClick }) {
  return (
    <button onClick={() => onClick()}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
        active ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
      }`}>
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════

/**
 * @param {Array<{intent: string, confidence: number}>} intents
 */
function getIntentDist(intents) {
  /** @type {Map<string, {confidence: number, count: number}>} */
  const map = new Map();
  intents.forEach(({ intent, confidence }) => {
    const existing = map.get(intent);
    map.set(intent, {
      confidence: existing ? Math.max(existing.confidence, confidence) : confidence,
      count: (existing?.count || 0) + 1,
    });
  });
  return Array.from(map.entries())
    .map(([intent, { confidence, count }]) => ({ intent, confidence, count }))
    .sort((a, b) => b.confidence - a.confidence);
}