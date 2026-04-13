// src/pages/supervisor/PerformanceOverview.jsx

/**
 * @file Performance Overview
 * 
 * Team performance dashboard showing key metrics, agent leaderboard,
 * and AI-powered performance insights.
 */

import React, { useState } from "react";

import {
  useGetTeamMetricsQuery,
  useGetAgentLeaderboardQuery
} from "@dalaillama/shared-store";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Team metrics data
 * @typedef {Object} TeamMetrics
 * @property {number} aht - Average Handle Time in minutes
 * @property {number} ahtChange - Percentage change in AHT
 * @property {number} csat - Customer Satisfaction Score (out of 5)
 * @property {number} csatChange - Percentage change in CSAT
 * @property {number} fcr - First Contact Resolution percentage
 * @property {number} fcrChange - Percentage change in FCR
 * @property {number} policyCompliance - Policy compliance percentage
 * @property {number} policyComplianceChange - Percentage change
 * @property {string} date - Metrics date
 */

/**
 * Agent performance data
 * @typedef {Object} AgentPerformance
 * @property {string} id - Agent ID
 * @property {string} name - Agent name
 * @property {number} aht - Average Handle Time in minutes
 * @property {number} csat - Customer Satisfaction Score (out of 5)
 * @property {string} aiNote - AI-generated performance note
 * @property {number} callsHandled - Number of calls handled
 * @property {number} rank - Performance rank
 * @property {string} [avatar] - Optional avatar URL
 */

/**
 * Time period filter
 * @typedef {"today" | "week" | "month"} TimePeriod
 */

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Formats AHT value
 * @param {number} minutes
 * @returns {string}
 */
const formatAHT = (minutes) => {
  return `${minutes.toFixed(1)} min`;
};

/**
 * Formats CSAT value
 * @param {number} score
 * @returns {string}
 */
const formatCSAT = (score) => {
  return score.toFixed(1);
};

/**
 * Formats percentage
 * @param {number} value
 * @returns {string}
 */
const formatPercentage = (value) => {
  return `${Math.round(value)}%`;
};

/**
 * Gets change indicator
 * @param {number} change
 * @returns {{icon: React.ReactElement, color: string, text: string}}
 */
const getChangeIndicator = (change) => {
  const isPositive = change > 0;
  const isNegative = change < 0;
  
  if (isNegative) {
    // For AHT, decrease is good
    return {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      ),
      color: "text-green-600",
      text: `${Math.abs(change)}%`
    };
  }
  
  if (isPositive) {
    return {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      ),
      color: "text-red-600",
      text: `${change}%`
    };
  }
  
  return {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
    ),
    color: "text-slate-600",
    text: "0%"
  };
};

/**
 * Gets positive change indicator (for CSAT, FCR, Compliance)
 * @param {number} change
 * @returns {{icon: React.ReactElement, color: string, text: string}}
 */
const getPositiveChangeIndicator = (change) => {
  const isPositive = change > 0;
  const isNegative = change < 0;
  
  if (isPositive) {
    return {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      ),
      color: "text-green-600",
      text: `${change}%`
    };
  }
  
  if (isNegative) {
    return {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      ),
      color: "text-red-600",
      text: `${Math.abs(change)}%`
    };
  }
  
  return {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
    ),
    color: "text-slate-600",
    text: "0%"
  };
};

/**
 * Gets AI note badge color
 * @param {string} note
 * @returns {string}
 */
const getAINoteBadgeColor = (note) => {
  const lowerNote = note.toLowerCase();
  
  if (lowerNote.includes("strong") || lowerNote.includes("excellent") || lowerNote.includes("outstanding")) {
    return "bg-green-50 text-green-700 border-green-200";
  }
  if (lowerNote.includes("needs") || lowerNote.includes("improve") || lowerNote.includes("support")) {
    return "bg-yellow-50 text-yellow-700 border-yellow-200";
  }
  if (lowerNote.includes("critical") || lowerNote.includes("urgent") || lowerNote.includes("poor")) {
    return "bg-red-50 text-red-700 border-red-200";
  }
  
  return "bg-blue-50 text-blue-700 border-blue-200";
};

/**
 * Gets rank badge
 * @param {number} rank
 * @returns {React.ReactElement}
 */
const getRankBadge = (rank) => {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold">
        🥇
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-800 text-xs font-bold">
        🥈
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">
        🥉
      </span>
    );
  }
  
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
      {rank}
    </span>
  );
};

// ============================================================================
// METRIC CARD COMPONENT
// ============================================================================

/**
 * @typedef {Object} MetricCardProps
 * @property {string} label - Metric label
 * @property {string} value - Metric value
 * @property {number} change - Percentage change
 * @property {boolean} [positiveIsGood] - Whether positive change is good (default: true)
 */

/**
 * Metric Card Component
 * 
 * @param {MetricCardProps} props
 * @returns {React.ReactElement}
 */
function MetricCard(props) {
  const { label, value, change, positiveIsGood = true } = props;
  const indicator = positiveIsGood ? getPositiveChangeIndicator(change) : getChangeIndicator(change);
  
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
      <div className="text-xs font-medium text-slate-600 mb-1">{label}</div>
      <div className="flex items-end justify-between">
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className={`flex items-center gap-1 text-xs font-semibold ${indicator.color}`}>
          {indicator.icon}
          <span>{indicator.text}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PERFORMANCE OVERVIEW PAGE
// ============================================================================

/**
 * Performance Overview Page Component
 * 
 * @returns {React.ReactElement}
 */
export default function PerformanceOverview() {
  /** @type {[TimePeriod, React.Dispatch<React.SetStateAction<TimePeriod>>]} */
  const [timePeriod, setTimePeriod] = useState(/** @type {TimePeriod} */("today"));

  const { data: teamMetrics, isLoading: metricsLoading } = useGetTeamMetricsQuery(
    { period: timePeriod },
    { pollingInterval: 60000 } // Poll every minute
  );

  const { data: leaderboard = [], isLoading: leaderboardLoading } = useGetAgentLeaderboardQuery(
    { period: timePeriod },
    { pollingInterval: 60000 } // Poll every minute
  );

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Performance Overview
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Team metrics and agent performance rankings
              </p>
            </div>

            {/* Time Period Selector */}
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setTimePeriod("today")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  timePeriod === "today"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setTimePeriod("week")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  timePeriod === "week"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setTimePeriod("month")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  timePeriod === "month"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                This Month
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Team Metrics */}
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Team Metrics ({timePeriod === "today" ? "Today" : timePeriod === "week" ? "This Week" : "This Month"})
            </h2>
            <p className="text-sm text-slate-600 mt-1">Key performance indicators for the team</p>
          </div>

          {metricsLoading ? (
            <div className="text-center py-8 text-slate-500">Loading metrics...</div>
          ) : teamMetrics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Average Handle Time"
                value={formatAHT(teamMetrics.aht)}
                change={teamMetrics.ahtChange}
                positiveIsGood={false}
              />
              <MetricCard
                label="Customer Satisfaction"
                value={`${formatCSAT(teamMetrics.csat)} / 5`}
                change={teamMetrics.csatChange}
                positiveIsGood={true}
              />
              <MetricCard
                label="First Contact Resolution"
                value={formatPercentage(teamMetrics.fcr)}
                change={teamMetrics.fcrChange}
                positiveIsGood={true}
              />
              <MetricCard
                label="Policy Compliance"
                value={formatPercentage(teamMetrics.policyCompliance)}
                change={teamMetrics.policyComplianceChange}
                positiveIsGood={true}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">No metrics available</div>
          )}
        </div>

        {/* Agent Leaderboard */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Agent Leaderboard</h2>
            <p className="text-sm text-slate-600 mt-1">Performance rankings and AI insights</p>
          </div>

          {leaderboardLoading ? (
            <div className="px-6 py-12 text-center text-slate-500">
              Loading leaderboard...
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-medium text-slate-900 mb-1">No performance data</h3>
              <p className="text-sm text-slate-500">Agent performance data will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Agent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      AHT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      CSAT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Calls
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      AI Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {leaderboard.map(
                    /**
                     * @param {AgentPerformance} agent
                     */
                    (agent) => (
                    <tr key={agent.id} className="hover:bg-slate-50 transition-colors">
                      {/* Rank */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRankBadge(agent.rank)}
                      </td>

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
                          <span className="text-sm font-medium text-slate-900">{agent.name}</span>
                        </div>
                      </td>

                      {/* AHT */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-slate-900">
                          {formatAHT(agent.aht)}
                        </span>
                      </td>

                      {/* CSAT */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-slate-900">
                            {formatCSAT(agent.csat)}
                          </span>
                          <span className="text-yellow-500">★</span>
                        </div>
                      </td>

                      {/* Calls */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-700">{agent.callsHandled}</span>
                      </td>

                      {/* AI Notes */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded border ${getAINoteBadgeColor(agent.aiNote)}`}>
                          {agent.aiNote}
                        </span>
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