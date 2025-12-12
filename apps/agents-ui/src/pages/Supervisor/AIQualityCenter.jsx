// src/pages/supervisor/AIQualityCenter.jsx

/**
 * @file AI Quality Center
 * 
 * AI-powered quality monitoring interface showing flagged calls with
 * compliance issues, sentiment problems, policy violations, and escalations.
 * Includes auto-generated feedback capability.
 */

import React, { useState } from "react";

import {
  useGetFlaggedCallsQuery,
  useGenerateFeedbackMutation
} from "@dalaillama/shared-store";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Issue type for flagged calls
 * @typedef {"policy_miss" | "high_anger" | "compliance" | "escalation" | "sentiment" | "procedure"} IssueType
 */

/**
 * Filter category
 * @typedef {"all" | "compliance" | "sentiment" | "policy" | "escalations"} FilterCategory
 */

/**
 * Flagged call data
 * @typedef {Object} FlaggedCall
 * @property {string} id - Call ID
 * @property {string} timestamp - Call timestamp (ISO format)
 * @property {string} agentId - Agent ID
 * @property {string} agentName - Agent name
 * @property {IssueType} issueType - Type of issue
 * @property {string} issueLabel - Display label for issue
 * @property {string} aiSummary - AI-generated summary
 * @property {string} [callRecordingUrl] - Optional recording URL
 * @property {number} severity - Severity score (1-10)
 * @property {boolean} [feedbackGenerated] - Whether feedback was generated
 */

/**
 * Generated feedback
 * @typedef {Object} GeneratedFeedback
 * @property {string} callId - Call ID
 * @property {string} feedback - Generated feedback text
 * @property {string[]} recommendations - List of recommendations
 * @property {string} timestamp - Generation timestamp
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Issue type configuration
 * @type {Record<IssueType, {label: string, color: string, icon: string}>}
 */
const ISSUE_CONFIG = {
  policy_miss: {
    label: "Policy Miss",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: "⚠️"
  },
  high_anger: {
    label: "High Anger",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: "😡"
  },
  compliance: {
    label: "Compliance",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: "📋"
  },
  escalation: {
    label: "Escalation",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: "🚨"
  },
  sentiment: {
    label: "Sentiment",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: "😟"
  },
  procedure: {
    label: "Procedure",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: "📝"
  }
};

/**
 * Filter configuration
 * @type {Array<{value: FilterCategory, label: string}>}
 */
const FILTERS = [
  { value: "all", label: "All Issues" },
  { value: "compliance", label: "Compliance" },
  { value: "sentiment", label: "Sentiment" },
  { value: "policy", label: "Policy" },
  { value: "escalations", label: "Escalations" }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Formats timestamp to time string
 * @param {string} timestamp - ISO timestamp
 * @returns {string}
 */
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", { 
    hour: "numeric", 
    minute: "2-digit",
    hour12: true 
  });
};

/**
 * Gets issue badge color and icon
 * @param {IssueType} issueType
 * @returns {{color: string, icon: string, label: string}}
 */
const getIssueConfig = (issueType) => {
  return ISSUE_CONFIG[issueType] || {
    label: "Unknown",
    color: "bg-slate-100 text-slate-800 border-slate-200",
    icon: "❓"
  };
};

/**
 * Filters calls based on selected category
 * @param {FlaggedCall[]} calls
 * @param {FilterCategory} filter
 * @returns {FlaggedCall[]}
 */
const filterCalls = (calls, filter) => {
  if (filter === "all") return calls;
  
  return calls.filter(
    /**
     * @param {FlaggedCall} call
     */
    (call) => {
      switch (filter) {
        case "compliance":
          return call.issueType === "compliance" || call.issueType === "policy_miss";
        case "sentiment":
          return call.issueType === "sentiment" || call.issueType === "high_anger";
        case "policy":
          return call.issueType === "policy_miss" || call.issueType === "procedure";
        case "escalations":
          return call.issueType === "escalation" || call.issueType === "high_anger";
        default:
          return true;
      }
    }
  );
};

// ============================================================================
// FEEDBACK MODAL COMPONENT
// ============================================================================

/**
 * @typedef {Object} FeedbackModalProps
 * @property {GeneratedFeedback | null} feedback
 * @property {() => void} onClose
 */

/**
 * Feedback Modal Component
 * 
 * @param {FeedbackModalProps} props
 * @returns {React.ReactElement | null}
 */
function FeedbackModal(props) {
  const { feedback, onClose } = props;

  if (!feedback) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Generated Feedback</h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          
          {/* Feedback Text */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Feedback</h4>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-sm text-slate-800 leading-relaxed">{feedback.feedback}</p>
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Recommendations</h4>
            <ul className="space-y-2">
              {feedback.recommendations.map(
                /**
                 * @param {string} rec
                 * @param {number} idx
                 */
                (rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span className="text-sm text-slate-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium 
                         rounded-lg hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium 
                         rounded-lg hover:bg-blue-700 transition-colors"
            >
              Send to Agent
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ============================================================================
// MAIN AI QUALITY CENTER PAGE
// ============================================================================

/**
 * AI Quality Center Page Component
 * 
 * @returns {React.ReactElement}
 */
export default function AIQualityCenter() {
  /** @type {[FilterCategory, React.Dispatch<React.SetStateAction<FilterCategory>>]} */
  const [activeFilter, setActiveFilter] = useState(/** @type {FilterCategory} */("all"));
  
  /** @type {[string | null, React.Dispatch<React.SetStateAction<string | null>>]} */
  const [selectedCallForFeedback, setSelectedCallForFeedback] = useState(
    /** @type {string | null} */(null)
  );
  
  /** @type {[GeneratedFeedback | null, React.Dispatch<React.SetStateAction<GeneratedFeedback | null>>]} */
  const [generatedFeedback, setGeneratedFeedback] = useState(
    /** @type {GeneratedFeedback | null} */(null)
  );

  const { data: calls = [], isLoading, refetch } = useGetFlaggedCallsQuery(undefined, {
    pollingInterval: 30000 // Poll every 30 seconds
  });

  const [generateFeedback, { isLoading: isGenerating }] = useGenerateFeedbackMutation();

  const filteredCalls = filterCalls(calls, activeFilter);

  /**
   * Handles feedback generation
   * @param {string} callId
   * @param {string} agentName
   * @returns {Promise<void>}
   */
  const handleGenerateFeedback = async (callId, agentName) => {
    try {
      const result = await generateFeedback({ callId }).unwrap();
      setGeneratedFeedback(result);
      setSelectedCallForFeedback(null);
    } catch (error) {
      console.error("Failed to generate feedback:", error);
    }
  };

  /**
   * Gets severity badge color
   * @param {number} severity
   * @returns {string}
   */
  const getSeverityColor = (severity) => {
    if (severity >= 8) return "bg-red-100 text-red-800";
    if (severity >= 5) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                AI Quality Center
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                AI-powered quality monitoring and automated feedback generation
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
              <div className="text-xs font-medium text-slate-600 mb-1">Total Flagged</div>
              <div className="text-2xl font-bold text-slate-900">{calls.length}</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="text-xs font-medium text-red-700 mb-1">High Priority</div>
              <div className="text-2xl font-bold text-red-900">
                {calls.filter(
                  /**
                   * @param {FlaggedCall} c
                   */
                  (c) => c.severity >= 8
                ).length}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="text-xs font-medium text-purple-700 mb-1">Compliance</div>
              <div className="text-2xl font-bold text-purple-900">
                {calls.filter(
                  /**
                   * @param {FlaggedCall} c
                   */
                  (c) => c.issueType === "compliance" || c.issueType === "policy_miss"
                ).length}
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-xs font-medium text-blue-700 mb-1">Feedback Generated</div>
              <div className="text-2xl font-bold text-blue-900">
                {calls.filter(
                  /**
                   * @param {FlaggedCall} c
                   */
                  (c) => c.feedbackGenerated
                ).length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Filters */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm mb-6 p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-slate-700 mr-2">Filters:</span>
            {FILTERS.map(
              /**
               * @param {{value: FilterCategory, label: string}} filter
               */
              (filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeFilter === filter.value
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Flagged Calls Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Flagged Calls</h2>
            <p className="text-sm text-slate-600 mt-1">
              {filteredCalls.length} call{filteredCalls.length !== 1 ? "s" : ""} requiring attention
            </p>
          </div>

          {isLoading ? (
            <div className="px-6 py-12 text-center text-slate-500">
              Loading flagged calls...
            </div>
          ) : filteredCalls.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-slate-900 mb-1">No flagged calls</h3>
              <p className="text-sm text-slate-500">All calls are meeting quality standards!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Agent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Issue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      AI Summary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredCalls.map(
                    /**
                     * @param {FlaggedCall} call
                     */
                    (call) => {
                      const config = getIssueConfig(call.issueType);
                      return (
                        <tr key={call.id} className="hover:bg-slate-50 transition-colors">
                          {/* Time */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-slate-900">
                              {formatTime(call.timestamp)}
                            </span>
                          </td>

                          {/* Agent */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700 mr-3">
                                {call.agentName.split(" ").map(
                                  /**
                                   * @param {string} n
                                   */
                                  (n) => n[0]
                                ).join("").toUpperCase()}
                              </div>
                              <span className="text-sm font-medium text-slate-900">{call.agentName}</span>
                            </div>
                          </td>

                          {/* Issue */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded border ${config.color}`}>
                                <span className="mr-1">{config.icon}</span>
                                {config.label}
                              </span>
                              <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getSeverityColor(call.severity)}`}>
                                {call.severity}/10
                              </span>
                            </div>
                          </td>

                          {/* AI Summary */}
                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-700 italic line-clamp-2">
                              "{call.aiSummary}"
                            </p>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {call.feedbackGenerated ? (
                              <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-full border border-green-200">
                                ✓ Feedback Sent
                              </span>
                            ) : (
                              <button
                                onClick={() => setSelectedCallForFeedback(call.id)}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Generate Feedback →
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* AI Feedback Generator Banner */}
        {selectedCallForFeedback && (
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-blue-900">AI Feedback Generator</h3>
                  <p className="text-sm text-blue-800 mt-1">
                    Would you like to auto-generate feedback for {
                      filteredCalls.find(
                        /**
                         * @param {FlaggedCall} c
                         */
                        (c) => c.id === selectedCallForFeedback
                      )?.agentName
                    }?
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedCallForFeedback(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const call = filteredCalls.find(
                      /**
                       * @param {FlaggedCall} c
                       */
                      (c) => c.id === selectedCallForFeedback
                    );
                    if (call) {
                      handleGenerateFeedback(call.id, call.agentName);
                    }
                  }}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg 
                             hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? "Generating..." : "Generate Feedback"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        feedback={generatedFeedback}
        onClose={() => setGeneratedFeedback(null)}
      />

    </div>
  );
}