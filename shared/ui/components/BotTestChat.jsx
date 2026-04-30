import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Play, Square, RotateCcw, Zap, Brain, TrendingUp } from 'lucide-react';
import LiveTranscriptPanel from './LiveTranscriptPanel.jsx';

/**
 * @typedef {Object} BotTestState
 * @property {Array<{role: string, text: string, timestamp?: number}>} transcript
 * @property {Array<{intent: string, confidence: number, timestamp?: number}>} intents
 * @property {number} sentiment
 * @property {Array<{type: string, target?: string, reason?: string, timestamp?: number}>} escalationEvents
 * @property {boolean} isActive
 */

/**
 * Bot test chat — two-panel layout for admin bot testing.
 *
 * @param {{ botTest: BotTestState, onSendMessage: (text: string) => void,
 *           onStartVoice: () => void, onStopVoice: () => void,
 *           onStartTest: () => void, onEndTest: () => void,
 *           isRecording?: boolean }} props
 */

export default function BotTestChat({
  botTest, onSendMessage, onStartVoice, onStopVoice,
  onStartTest, onEndTest, isRecording = false,
}) {
  const [input, setInput] = useState('');
  const { transcript, intents, sentiment, escalationEvents, isActive } = botTest;

  const handleSend = () => {
    if (!input.trim() || !isActive) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-200px)] min-h-[500px]">

      {/* ── LEFT: Conversation ── */}
      <div className="flex-[3] flex flex-col">
        {/* Session controls */}
        <div className="flex items-center gap-3 mb-4">
          {!isActive ? (
            <button onClick={onStartTest}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-5 py-2.5 font-semibold transition-colors flex items-center gap-2">
              <Play className="w-4 h-4" /> Start Test
            </button>
          ) : (
            <>
              <button onClick={onEndTest}
                className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-5 py-2.5 font-semibold transition-colors flex items-center gap-2">
                <Square className="w-4 h-4" /> End Test
              </button>
              <button onClick={() => { onEndTest(); setTimeout(onStartTest, 100); }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl px-4 py-2.5 font-semibold transition-colors flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            </>
          )}
          <span className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${
            isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {isActive ? 'Session Active' : 'Not Started'}
          </span>
        </div>

        {/* Transcript */}
        <LiveTranscriptPanel
          transcript={transcript}
          sentiment={sentiment}
          intents={intents}
          title="Conversation"
          className="flex-1"
        />

        {/* Input bar */}
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={!isActive}
            placeholder={isActive ? 'Type a message...' : 'Start test to begin'}
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-50 disabled:text-slate-400"
          />
          <button onClick={handleSend} disabled={!isActive || !input.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white rounded-xl p-3 transition-colors">
            <Send className="w-4 h-4" />
          </button>
          <button
            onClick={isRecording ? onStopVoice : onStartVoice}
            disabled={!isActive}
            className={`rounded-xl p-3 transition-colors ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:bg-slate-50 disabled:text-slate-400'
            }`}>
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>
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
              {getIntentDistribution(intents).map(({ intent, confidence, count }) => (
                <div key={intent}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700">{intent}</span>
                    <span className="text-[10px] text-slate-400">{(confidence * 100).toFixed(0)}% ({count}x)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        confidence > 0.7 ? 'bg-emerald-500' : confidence > 0.4 ? 'bg-amber-500' : 'bg-slate-300'
                      }`}
                      style={{ width: `${confidence * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sentiment Gauge */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-sm text-slate-900">Sentiment</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="w-full bg-slate-100 rounded-full h-4 relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-1/2 transition-all duration-500 rounded-full"
                  style={{
                    width: `${Math.abs(sentiment) * 50}%`,
                    transform: sentiment >= 0 ? 'translateX(0)' : `translateX(-100%)`,
                    backgroundColor: sentiment > 0.3 ? '#10b981' : sentiment < -0.3 ? '#ef4444' : '#f59e0b',
                  }}
                />
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
            }`}>
              {sentiment >= 0 ? '+' : ''}{sentiment.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Escalation Monitor */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-sm text-slate-900">Escalation Events</h3>
          </div>
          {escalationEvents.length === 0 ? (
            <p className="text-sm text-slate-400">No escalations triggered</p>
          ) : (
            <div className="space-y-2">
              {escalationEvents.map((evt, i) => (
                <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-xs font-bold text-amber-800 uppercase">{evt.type}</span>
                  </div>
                  {evt.target && <p className="text-xs text-amber-700 mt-1">Target: {evt.target}</p>}
                  {evt.reason && <p className="text-xs text-amber-600 mt-0.5">{evt.reason}</p>}
                  {evt.timestamp && (
                    <p className="text-[10px] text-amber-400 mt-1">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent intent history */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-5">
          <h3 className="font-bold text-sm text-slate-900 mb-3">Intent History</h3>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {intents.slice(-10).reverse().map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-slate-600">{item.intent}</span>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${
                    item.confidence > 0.7 ? 'text-emerald-600' : item.confidence > 0.4 ? 'text-amber-600' : 'text-slate-400'
                  }`}>
                    {(item.confidence * 100).toFixed(0)}%
                  </span>
                  {item.timestamp && (
                    <span className="text-slate-400">{new Date(item.timestamp).toLocaleTimeString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Aggregate intents into distribution with latest confidence.
 * @param {Array<{intent: string, confidence: number}>} intents
 */
function getIntentDistribution(intents) {
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
