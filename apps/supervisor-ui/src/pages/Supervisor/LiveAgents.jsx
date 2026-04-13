// src/pages/supervisor/LiveAgents.jsx

/**
 * @file Live Agents Monitor
 * 
 * Real-time agent monitoring interface showing status, active calls,
 * issue types, and sentiment analysis.
 */

import React, { useState } from "react";

import {
  useGetLiveAgentsQuery
} from "@dalaillama/shared-store";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Agent status type
 * @typedef {"idle" | "in_call" | "wrap_up" | "break" | "offline" | "unavailable"} AgentStatusType
 */

/**
 * Sentiment type
 * @typedef {"happy" | "neutral" | "frustrated" | "angry"} SentimentType
 */

/**
 * Live agent data
 * @typedef {Object} LiveAgent
 * @property {string} id - Agent ID
 * @property {string} name - Agent name
 * @property {AgentStatusType} status - Current status
 * @property {string} [callDuration] - Current call duration (MM:SS)
 * @property {string} [issue] - Current issue/topic
 * @property {SentimentType} [sentiment] - Customer sentiment
 * @property {string} [queue] - Assigned queue
 * @property {number} [callsHandled] - Calls handled today
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Status configuration
 * @type {Record<AgentStatusType, {label: string, color: string}>}
 */
const STATUS_CONFIG = {
  in_call: {
    label: "In Call",
    color: "bg-blue-100 text-blue-800 border-blue-200"
  },
  wrap_up: {
    label: "Wrap-up",
    color: "bg-purple-100 text-purple-800 border-purple-200"
  },
  idle: {
    label: "Idle",
    color: "bg-green-100 text-green-800 border-green-200"
  },
  break: {
    label: "Break",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200"
  },
  offline: {
    label: "Offline",
    color: "bg-slate-100 text-slate-800 border-slate-200"
  },
  unavailable: {
    label: "Unavailable",
    color: "bg-red-100 text-red-800 border-red-200"
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Gets sentiment emoji
 * @param {SentimentType | undefined | ""} sentiment
 * @returns {string}
 */
const getSentimentEmoji = (sentiment) => {
  if (!sentiment) return "—";
  
  switch (sentiment) {
    case "happy":
      return "😀";
    case "neutral":
      return "😐";
    case "frustrated":
      return "😟";
    case "angry":
      return "😠";
    default:
      return "—";
  }
};

/**
 * Gets sentiment color
 * @param {SentimentType | undefined | ""} sentiment
 * @returns {string}
 */
const getSentimentColor = (sentiment) => {
  if (!sentiment) return "text-slate-400";
  
  switch (sentiment) {
    case "happy":
      return "text-green-600";
    case "neutral":
      return "text-slate-600";
    case "frustrated":
      return "text-orange-600";
    case "angry":
      return "text-red-600";
    default:
      return "text-slate-400";
  }
};

/**
 * Formats call duration for display
 * @param {string | undefined} duration
 * @returns {string}
 */
const formatDuration = (duration) => {
  if (!duration) return "—";
  return duration;
};

/**
 * Gets issue badge color
 * @param {string | undefined} issue
 * @returns {string}
 */
const getIssueBadgeColor = (issue) => {
  if (!issue) return "";
  
  const lowerIssue = issue.toLowerCase();
  
  if (lowerIssue.includes("angry") || lowerIssue.includes("escalation")) {
    return "bg-red-50 text-red-700 border-red-200";
  }
  if (lowerIssue.includes("refund") || lowerIssue.includes("billing")) {
    return "bg-yellow-50 text-yellow-700 border-yellow-200";
  }
  if (lowerIssue.includes("technical") || lowerIssue.includes("support")) {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }
  
  return "bg-slate-50 text-slate-700 border-slate-200";
};

// ============================================================================
// MAIN LIVE AGENTS PAGE
// ============================================================================

/**
 * Live Agents Page Component
 * 
 * @returns {React.ReactElement}
 */
export default function LiveAgents() {
  const { data: agents = [], isLoading, refetch } = useGetLiveAgentsQuery(undefined, {
    pollingInterval: 2000 // Poll every 2 seconds for real-time updates
  });

  /** @type {[AgentStatusType | "all", React.Dispatch<React.SetStateAction<AgentStatusType | "all">>]} */
  const [filterStatus, setFilterStatus] = useState(/** @type {AgentStatusType | "all"} */ ("all"));

  /**
   * Gets filtered agents based on status filter
   * @returns {LiveAgent[]}
   */
  const getFilteredAgents = () => {
    if (filterStatus === "all") return agents;
    return agents.filter(
      /**
       * @param {LiveAgent} agent
       */
      (agent) => agent.status === filterStatus
    );
  };

  /**
   * Gets agent statistics
   * @returns {Record<AgentStatusType, number> & {total: number}}
   */
  const getAgentStats = () => {
    return {
      total: agents.length,
      in_call: agents.filter(
        /**
         * @param {LiveAgent} a
         */
        (a) => a.status === "in_call"
      ).length,
      wrap_up: agents.filter(
        /**
         * @param {LiveAgent} a
         */
        (a) => a.status === "wrap_up"
      ).length,
      idle: agents.filter(
        /**
         * @param {LiveAgent} a
         */
        (a) => a.status === "idle"
      ).length,
      break: agents.filter(
        /**
         * @param {LiveAgent} a
         */
        (a) => a.status === "break"
      ).length,
      offline: agents.filter(
        /**
         * @param {LiveAgent} a
         */
        (a) => a.status === "offline"
      ).length,
      unavailable: agents.filter(
        /**
         * @param {LiveAgent} a
         */
        (a) => a.status === "unavailable"
      ).length
    };
  };

  const stats = getAgentStats();
  const filteredAgents = getFilteredAgents();

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Live Agents
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Real-time agent status and performance monitoring
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
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="bg-slate-50 rounded-lg px-4 py-2 border border-slate-200">
              <div className="text-xs font-medium text-slate-600">Total Agents</div>
              <div className="text-xl font-bold text-slate-900">{stats.total}</div>
            </div>
            <div className="bg-blue-50 rounded-lg px-4 py-2 border border-blue-200">
              <div className="text-xs font-medium text-blue-700">In Call</div>
              <div className="text-xl font-bold text-blue-900">{stats.in_call}</div>
            </div>
            <div className="bg-purple-50 rounded-lg px-4 py-2 border border-purple-200">
              <div className="text-xs font-medium text-purple-700">Wrap-up</div>
              <div className="text-xl font-bold text-purple-900">{stats.wrap_up}</div>
            </div>
            <div className="bg-green-50 rounded-lg px-4 py-2 border border-green-200">
              <div className="text-xs font-medium text-green-700">Idle</div>
              <div className="text-xl font-bold text-green-900">{stats.idle}</div>
            </div>
            <div className="bg-yellow-50 rounded-lg px-4 py-2 border border-yellow-200">
              <div className="text-xs font-medium text-yellow-700">Break</div>
              <div className="text-xl font-bold text-yellow-900">{stats.break}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Filters */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm mb-6 p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-slate-700 mr-2">Filter by Status:</span>
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filterStatus === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilterStatus("in_call")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filterStatus === "in_call"
                  ? "bg-blue-600 text-white"
                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"
              }`}
            >
              In Call ({stats.in_call})
            </button>
            <button
              onClick={() => setFilterStatus("idle")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filterStatus === "idle"
                  ? "bg-green-600 text-white"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}
            >
              Idle ({stats.idle})
            </button>
            <button
              onClick={() => setFilterStatus("wrap_up")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filterStatus === "wrap_up"
                  ? "bg-purple-600 text-white"
                  : "bg-purple-100 text-purple-700 hover:bg-purple-200"
              }`}
            >
              Wrap-up ({stats.wrap_up})
            </button>
          </div>
        </div>

        {/* Agents Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          {isLoading ? (
            <div className="px-6 py-12 text-center text-slate-500">
              Loading agent data...
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-medium text-slate-900 mb-1">No agents found</h3>
              <p className="text-sm text-slate-500">
                {filterStatus === "all" 
                  ? "No agents are currently online." 
                  : `No agents with "${STATUS_CONFIG[filterStatus]?.label}" status.`}
              </p>
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
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Current Call
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Issue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Mood
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredAgents.map(
                    /**
                     * @param {LiveAgent} agent
                     */
                    (agent) => (
                    <tr key={agent.id} className="hover:bg-slate-50 transition-colors">
                      {/* Agent */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700 mr-3">
                            {agent.name.split(" ").map(
                              /**
                               * @param {string} n
                               */
                              (n) => n[0]
                            ).join("").toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">{agent.name}</div>
                            {agent.queue && (
                              <div className="text-xs text-slate-500">{agent.queue}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${
                          STATUS_CONFIG[agent.status]?.color || STATUS_CONFIG.offline.color
                        }`}>
                          {STATUS_CONFIG[agent.status]?.label || agent.status}
                        </span>
                      </td>

                      {/* Current Call */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono font-semibold text-slate-900">
                          {formatDuration(agent.callDuration)}
                        </span>
                      </td>

                      {/* Issue */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {agent.issue ? (
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded border ${getIssueBadgeColor(agent.issue)}`}>
                            {agent.issue}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>

                      {/* Mood */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`text-2xl ${getSentimentColor(agent.sentiment)}`}>
                            {getSentimentEmoji(agent.sentiment)}
                          </span>
                        </div>
                      </td>
                    </tr>
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