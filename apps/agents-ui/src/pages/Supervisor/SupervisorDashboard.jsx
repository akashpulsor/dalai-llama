// src/pages/supervisor/SupervisorDashboard.jsx

/**
 * @file Supervisor Dashboard
 * 
 * Real-time dashboard for supervisors to monitor queue health, agent status,
 * and AI-powered insights and alerts.
 */

import React from "react";

import {
  useGetQueueHealthQuery,
  useGetAgentStatusQuery,
  useGetAIInsightsQuery,
  useGetAlertsQuery
} from "@dalaillama/shared-store";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Queue health status
 * @typedef {Object} QueueHealth
 * @property {string} id - Queue ID
 * @property {string} name - Queue name
 * @property {string} waitTime - Average wait time (MM:SS)
 * @property {number} activeCalls - Number of active calls
 * @property {string} aiObservation - AI-generated observation
 * @property {"normal" | "warning" | "critical"} status - Health status
 */

/**
 * Agent status
 * @typedef {"idle" | "in_call" | "wrap_up" | "break" | "offline"} AgentStatusType
 */

/**
 * Sentiment type
 * @typedef {"positive" | "neutral" | "negative"} SentimentType
 */

/**
 * Agent snapshot
 * @typedef {Object} AgentSnapshot
 * @property {string} id - Agent ID
 * @property {string} name - Agent name
 * @property {AgentStatusType} status - Current status
 * @property {string} [callDuration] - Current call duration (MM:SS)
 * @property {SentimentType} [sentiment] - Current call sentiment
 */

/**
 * AI Alert
 * @typedef {Object} AIAlert
 * @property {string} id - Alert ID
 * @property {string} message - Alert message
 * @property {"info" | "warning" | "critical"} severity - Alert severity
 * @property {string} timestamp - Alert timestamp
 */

/**
 * AI Insight
 * @typedef {Object} AIInsight
 * @property {string} message - Insight message
 * @property {string} timestamp - Insight timestamp
 */

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Gets status badge color
 * @param {"normal" | "warning" | "critical"} status
 * @returns {string}
 */
const getStatusColor = (status) => {
  switch (status) {
    case "critical":
      return "bg-red-100 text-red-800 border-red-200";
    case "warning":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    default:
      return "bg-green-100 text-green-800 border-green-200";
  }
};

/**
 * Gets agent status badge color
 * @param {AgentStatusType} status
 * @returns {string}
 */
const getAgentStatusColor = (status) => {
  switch (status) {
    case "in_call":
      return "bg-blue-100 text-blue-800";
    case "wrap_up":
      return "bg-purple-100 text-purple-800";
    case "idle":
      return "bg-green-100 text-green-800";
    case "break":
      return "bg-yellow-100 text-yellow-800";
    case "offline":
      return "bg-slate-100 text-slate-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
};

/**
 * Formats agent status for display
 * @param {AgentStatusType} status
 * @returns {string}
 */
const formatAgentStatus = (status) => {
  const statusMap = {
    in_call: "In Call",
    wrap_up: "Wrap-up",
    idle: "Idle",
    break: "Break",
    offline: "Offline"
  };
  return statusMap[status] || status;
};

/**
 * Gets sentiment emoji
 * @param {SentimentType} sentiment
 * @returns {string}
 */
const getSentimentEmoji = (sentiment) => {
  switch (sentiment) {
    case "positive":
      return "😊";
    case "negative":
      return "😟";
    case "neutral":
      return "😐";
    default:
      return "—";
  }
};

/**
 * Gets alert severity icon
 * @param {"info" | "warning" | "critical"} severity
 * @returns {React.ReactElement}
 */
const getAlertIcon = (severity) => {
  switch (severity) {
    case "critical":
      return (
        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case "warning":
      return (
        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

// ============================================================================
// MAIN SUPERVISOR DASHBOARD
// ============================================================================

/**
 * Supervisor Dashboard Component
 * 
 * @returns {React.ReactElement}
 */
export default function SupervisorDashboard() {
  const { data: queueHealth = [], isLoading: queuesLoading } = useGetQueueHealthQuery(undefined, {
    pollingInterval: 5000 // Poll every 5 seconds
  });

  const { data: agents = [], isLoading: agentsLoading } = useGetAgentStatusQuery(undefined, {
    pollingInterval: 3000 // Poll every 3 seconds
  });

  const { data: aiInsight } = useGetAIInsightsQuery(undefined, {
    pollingInterval: 10000 // Poll every 10 seconds
  });

  const { data: alerts = [] } = useGetAlertsQuery(undefined, {
    pollingInterval: 5000 // Poll every 5 seconds
  });

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-semibold text-slate-900">
            Supervisor Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Real-time monitoring and AI-powered insights
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        
        {/* AI Pulse */}
        {aiInsight && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-blue-900 mb-1">AI Pulse</div>
                <div className="text-sm text-blue-800 leading-relaxed">
                  {aiInsight.message}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Queue Health */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Queue Health</h2>
            <p className="text-sm text-slate-600 mt-1">Real-time queue metrics and AI observations</p>
          </div>

          {queuesLoading ? (
            <div className="px-6 py-12 text-center text-slate-500">Loading queue data...</div>
          ) : queueHealth.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500">No active queues</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Queue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Wait Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Active Calls
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      AI Observations
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {queueHealth.map(
                    /**
                     * @param {QueueHealth} queue
                     */
                    (queue) => (
                    <tr key={queue.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-slate-900">{queue.name}</span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(queue.status)}`}>
                            {queue.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-mono font-semibold ${
                          queue.status === "critical" ? "text-red-600" :
                          queue.status === "warning" ? "text-yellow-600" :
                          "text-slate-900"
                        }`}>
                          {queue.waitTime}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-slate-900">{queue.activeCalls}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-700 italic">{queue.aiObservation}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Agent Status Snapshot */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Agent Status Snapshot</h2>
            <p className="text-sm text-slate-600 mt-1">Live agent activity and sentiment analysis</p>
          </div>

          {agentsLoading ? (
            <div className="px-6 py-12 text-center text-slate-500">Loading agent data...</div>
          ) : agents.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500">No agents online</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Agent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Current Call
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Sentiment
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {agents.map(
                    /**
                     * @param {AgentSnapshot} agent
                     */
                    (agent) => (
                    <tr key={agent.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600 mr-3">
                            {agent.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-slate-900">{agent.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getAgentStatusColor(agent.status)}`}>
                          {formatAgentStatus(agent.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-slate-900">
                          {agent.callDuration || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {agent.sentiment ? (
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getSentimentEmoji(agent.sentiment)}</span>
                            <span className="text-sm text-slate-700 capitalize">{agent.sentiment}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* AI-Detected Alerts */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Alerts (AI-detected)</h2>
            <p className="text-sm text-slate-600 mt-1">Real-time alerts and actionable insights</p>
          </div>

          {alerts.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <svg className="mx-auto h-10 w-10 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-slate-600">No alerts at this time. Everything is running smoothly!</p>
            </div>
          ) : (
            <div className="px-6 py-4 space-y-3">
              {alerts.map(
                /**
                 * @param {AIAlert} alert
                 */
                (alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getAlertIcon(alert.severity)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-800 leading-relaxed">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}