// src/pages/supervisor/LiveCalls.jsx

/**
 * @file Live Calls Monitor
 * 
 * Real-time call monitoring interface showing active calls with sentiment analysis,
 * AI-powered insights, and supervisor intervention capabilities.
 */

import React, { useEffect, useState } from "react";

import {
  useGetLiveCallsQuery,
  useMonitorCallMutation,
  useWhisperToAgentMutation,
  useBargeInCallMutation,
  useTakeoverCallMutation
} from "@dalaillama/shared-store";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Sentiment type
 * @typedef {"positive" | "neutral" | "negative" | "frustrated"} SentimentType
 */

/**
 * Live call data
 * @typedef {Object} LiveCall
 * @property {string} id - Call ID
 * @property {string} agentId - Agent ID
 * @property {string} agentName - Agent name
 * @property {string} customerId - Customer ID
 * @property {string} customerName - Customer name
 * @property {string} duration - Call duration (MM:SS)
 * @property {SentimentType} sentiment - Customer sentiment
 * @property {string} [queue] - Queue name
 * @property {string} [aiInsight] - AI-generated insight for this call
 * @property {string} [topic] - Call topic/issue
 */

/**
 * Action button props
 * @typedef {Object} ActionButtonProps
 * @property {() => void} onClick - Click handler
 * @property {string} label - Button label
 * @property {string} variant - Button variant (primary/warning/danger)
 * @property {boolean} [loading] - Loading state
 * @property {boolean} [disabled] - Disabled state
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Sentiment configuration
 * @type {Record<SentimentType, {emoji: string, label: string, color: string}>}
 */
const SENTIMENT_CONFIG = {
  positive: {
    emoji: "😊",
    label: "Positive",
    color: "text-green-600"
  },
  neutral: {
    emoji: "😐",
    label: "Neutral",
    color: "text-slate-600"
  },
  negative: {
    emoji: "😡",
    label: "Negative",
    color: "text-red-600"
  },
  frustrated: {
    emoji: "😤",
    label: "Frustrated",
    color: "text-orange-600"
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Gets sentiment emoji
 * @param {SentimentType} sentiment
 * @returns {string}
 */
const getSentimentEmoji = (sentiment) => {
  return SENTIMENT_CONFIG[sentiment]?.emoji || "😐";
};

/**
 * Gets sentiment label
 * @param {SentimentType} sentiment
 * @returns {string}
 */
const getSentimentLabel = (sentiment) => {
  return SENTIMENT_CONFIG[sentiment]?.label || "Unknown";
};

/**
 * Gets sentiment color
 * @param {SentimentType} sentiment
 * @returns {string}
 */
const getSentimentColor = (sentiment) => {
  return SENTIMENT_CONFIG[sentiment]?.color || "text-slate-600";
};

// ============================================================================
// ACTION BUTTON COMPONENT
// ============================================================================

/**
 * Action Button Component
 * 
 * @param {ActionButtonProps} props
 * @returns {React.ReactElement}
 */
function ActionButton(props) {
  const { onClick, label, variant, loading = false, disabled = false } = props;

  /** @type {Record<string, string>} */
  const variantStyles = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    warning: "bg-yellow-600 hover:bg-yellow-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors
        ${variantStyles[variant] || variantStyles.primary}
        ${disabled || loading ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      {loading ? "..." : label}
    </button>
  );
}

// ============================================================================
// MAIN LIVE CALLS PAGE
// ============================================================================

/**
 * Live Calls Page Component
 * 
 * @returns {React.ReactElement}
 */
export default function LiveCalls() {
  const { data: calls = [], isLoading, refetch } = useGetLiveCallsQuery(undefined, {
    pollingInterval: 2000 // Poll every 2 seconds for real-time updates
  });

  useEffect(() => {
    const handleLiveCallEvent = () => {
      refetch();
    };

    window.addEventListener("tenant-call-event", handleLiveCallEvent);
    return () => window.removeEventListener("tenant-call-event", handleLiveCallEvent);
  }, [refetch]);

  const [monitorCall] = useMonitorCallMutation();
  const [whisperToAgent] = useWhisperToAgentMutation();
  const [bargeInCall] = useBargeInCallMutation();
  const [takeoverCall] = useTakeoverCallMutation();

  /** @type {[string | null, React.Dispatch<React.SetStateAction<string | null>>]} */
  const [actionLoading, setActionLoading] = useState(/** @type {string | null} */(null));

  /**
   * Handles monitor action
   * @param {string} callId
   * @returns {Promise<void>}
   */
  const handleMonitor = async (callId) => {
    setActionLoading(callId);
    try {
      await monitorCall({ callId }).unwrap();
      // Success feedback could be added here
    } catch (error) {
      console.error("Failed to monitor call:", error);
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Handles whisper action
   * @param {string} callId
   * @returns {Promise<void>}
   */
  const handleWhisper = async (callId) => {
    setActionLoading(callId);
    try {
      await whisperToAgent({ callId }).unwrap();
      // Success feedback could be added here
    } catch (error) {
      console.error("Failed to whisper:", error);
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Handles barge in action
   * @param {string} callId
   * @returns {Promise<void>}
   */
  const handleBargeIn = async (callId) => {
    setActionLoading(callId);
    try {
      await bargeInCall({ callId }).unwrap();
      // Success feedback could be added here
    } catch (error) {
      console.error("Failed to barge in:", error);
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Handles takeover action
   * @param {string} callId
   * @returns {Promise<void>}
   */
  const handleTakeover = async (callId) => {
    const confirmed = window.confirm("Are you sure you want to take over this call?");
    if (!confirmed) return;

    setActionLoading(callId);
    try {
      await takeoverCall({ callId }).unwrap();
      // Success feedback could be added here
    } catch (error) {
      console.error("Failed to takeover call:", error);
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Gets calls with AI insights
   * @returns {LiveCall[]}
   */
  const getCallsWithInsights = () => {
    return calls.filter(
      /**
       * @param {LiveCall} call
       */
      (call) => call.aiInsight
    );
  };

  const callsWithInsights = getCallsWithInsights();

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Live Calls
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Real-time call monitoring with AI-powered insights
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center px-4 py-2 border border-slate-300 text-slate-700 
                         text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {/* Stats Bar */}
          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="text-xs font-medium text-slate-600 mb-1">Active Calls</div>
              <div className="text-2xl font-bold text-slate-900">{calls.length}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-xs font-medium text-green-700 mb-1">Positive</div>
              <div className="text-2xl font-bold text-green-900">
                {calls.filter(
                  /**
                   * @param {LiveCall} c
                   */
                  (c) => c.sentiment === "positive"
                ).length}
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="text-xs font-medium text-red-700 mb-1">Negative</div>
              <div className="text-2xl font-bold text-red-900">
                {calls.filter(
                  /**
                   * @param {LiveCall} c
                   */
                  (c) => c.sentiment === "negative" || c.sentiment === "frustrated"
                ).length}
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-xs font-medium text-blue-700 mb-1">AI Insights</div>
              <div className="text-2xl font-bold text-blue-900">{callsWithInsights.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Calls Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          {isLoading ? (
            <div className="px-6 py-12 text-center text-slate-500">
              Loading call data...
            </div>
          ) : calls.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <h3 className="text-lg font-medium text-slate-900 mb-1">No active calls</h3>
              <p className="text-sm text-slate-500">Active calls will appear here when agents are on calls.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Agent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Sentiment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {calls.map(
                    /**
                     * @param {LiveCall} call
                     */
                    (call) => (
                    <React.Fragment key={call.id}>
                      <tr className="hover:bg-slate-50 transition-colors">
                        {/* Agent */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700 mr-3">
                              {call.agentName.split(" ").map(
                                /**
                                 * @param {string} n
                                 */
                                (n) => n[0]
                              ).join("").toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-900">{call.agentName}</div>
                              {call.queue && (
                                <div className="text-xs text-slate-500">{call.queue}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">{call.customerName}</div>
                          {call.topic && (
                            <div className="text-xs text-slate-500">{call.topic}</div>
                          )}
                        </td>

                        {/* Duration */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono font-semibold text-slate-900">
                            {call.duration}
                          </span>
                        </td>

                        {/* Sentiment */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`text-2xl ${getSentimentColor(call.sentiment)}`}>
                              {getSentimentEmoji(call.sentiment)}
                            </span>
                            <span className={`text-sm font-medium ${getSentimentColor(call.sentiment)}`}>
                              {getSentimentLabel(call.sentiment)}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-2">
                            <ActionButton
                              onClick={() => handleMonitor(call.id)}
                              label="Monitor"
                              variant="primary"
                              loading={actionLoading === call.id}
                            />
                            <ActionButton
                              onClick={() => handleWhisper(call.id)}
                              label="Whisper"
                              variant="primary"
                              loading={actionLoading === call.id}
                            />
                            <ActionButton
                              onClick={() => handleBargeIn(call.id)}
                              label="Barge In"
                              variant="warning"
                              loading={actionLoading === call.id}
                            />
                            <ActionButton
                              onClick={() => handleTakeover(call.id)}
                              label="Takeover"
                              variant="danger"
                              loading={actionLoading === call.id}
                            />
                          </div>
                        </td>
                      </tr>

                      {/* AI Insight Row */}
                      {call.aiInsight && (
                        <tr className="bg-blue-50">
                          <td colSpan={5} className="px-6 py-3">
                            <div className="flex items-start gap-3">
                              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <div className="flex-1">
                                <div className="text-xs font-semibold text-blue-900 mb-1">AI Insight</div>
                                <p className="text-sm text-blue-800 leading-relaxed italic">
                                  {call.aiInsight}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
