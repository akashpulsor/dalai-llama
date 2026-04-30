import { useEffect, useRef } from 'react';
import { MessageSquare, User, Bot, AlertTriangle } from 'lucide-react';
import SentimentBadge from './SentimentBadge.jsx';

/**
 * Live transcript panel — streaming transcript with speaker labels + sentiment.
 * Used during active calls (agent-ui) and in bot testing (admin-ui).
 *
 * @param {{ transcript: Array<{role: string, text: string, timestamp?: number}>,
 *           sentiment?: number, intents?: Array<{intent: string, confidence: number}>,
 *           title?: string, className?: string }} props
 */
export default function LiveTranscriptPanel({ transcript = [], sentiment, intents = [], title = 'Live Transcript', className = '' }) {
const bottomRef = /** @type {import('react').MutableRefObject<HTMLDivElement|null>} */ (useRef(null));
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript.length]);

  const speakerConfig = {
    user: { label: 'Caller', icon: User, bg: 'bg-slate-100', text: 'text-slate-700', align: 'justify-end' },
    agent: { label: 'Agent', icon: User, bg: 'bg-blue-50', text: 'text-blue-700', align: 'justify-start' },
    bot: { label: 'Bot', icon: Bot, bg: 'bg-violet-50', text: 'text-violet-700', align: 'justify-start' },
    system: { label: 'System', icon: AlertTriangle, bg: 'bg-amber-50', text: 'text-amber-700', align: 'justify-center' },
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-100 shadow-lg flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-purple-600" />
          <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
          <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-semibold">
            {transcript.length}
          </span>
        </div>
        {sentiment !== undefined && <SentimentBadge sentiment={sentiment > 0.3 ? 'positive' : sentiment < -0.3 ? 'negative' : 'neutral'} />}
      </div>

      {/* Intent tags */}
      {intents.length > 0 && (
        <div className="px-5 py-2 border-b border-slate-50 flex flex-wrap gap-1.5">
          {intents.slice(-5).map((item, i) => (
            <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              item.confidence > 0.7 ? 'bg-emerald-100 text-emerald-700' :
              item.confidence > 0.4 ? 'bg-amber-100 text-amber-700' :
              'bg-slate-100 text-slate-500'
            }`}>
              {item.intent} ({(item.confidence * 100).toFixed(0)}%)
            </span>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 max-h-[500px] min-h-[200px]">
        {transcript.length === 0 && (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            Waiting for conversation...
          </div>
        )}

        {transcript.map((msg, i) => {
          const config = speakerConfig[/** @type {keyof typeof speakerConfig} */ (msg.role)] || speakerConfig.system;
          const Icon = config.icon;
          const isSystem = msg.role === 'system';

          if (isSystem) {
            return (
              <div key={i} className="flex justify-center">
                <span className="text-xs italic text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                  {msg.text}
                </span>
              </div>
            );
          }

          return (
            <div key={i} className={`flex ${config.align} gap-2`}>
              {msg.role !== 'user' && (
                <div className={`w-7 h-7 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-3.5 h-3.5 ${config.text}`} />
                </div>
              )}
              <div className={`max-w-[75%] ${config.bg} rounded-2xl px-4 py-2.5`}>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                  {config.label}
                </p>
                <p className={`text-sm ${config.text}`}>{msg.text}</p>
                {msg.timestamp && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                )}
              </div>
              {msg.role === 'user' && (
                <div className={`w-7 h-7 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-3.5 h-3.5 ${config.text}`} />
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
