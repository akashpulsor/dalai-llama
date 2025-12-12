// src/pages/supervisor/WorkforceForecasting.jsx

/**
 * @file Workforce Forecasting
 * 
 * AI-powered workforce forecasting dashboard showing predicted call volumes,
 * staffing requirements, and intelligent recommendations for resource allocation.
 */

import React, { useState } from "react";

import {
  useGetForecastQuery,
  useApplyRecommendationMutation
} from "@dalaillama/shared-store";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Time period for forecast
 * @typedef {"today" | "tomorrow" | "week"} ForecastPeriod
 */

/**
 * Forecast data point
 * @typedef {Object} ForecastDataPoint
 * @property {string} time - Time label (e.g., "9:00 AM")
 * @property {number} predictedVolume - Predicted call volume
 * @property {number} [actualVolume] - Actual call volume (for historical data)
 * @property {number} requiredAgents - Required agents for this time
 */

/**
 * Peak information
 * @typedef {Object} PeakInfo
 * @property {string} time - Peak time (e.g., "2:30 PM")
 * @property {number} volume - Expected call volume
 * @property {number} requiredAgents - Required agents
 */

/**
 * Staffing gap
 * @typedef {Object} StaffingGap
 * @property {string} period - Time period (e.g., "2 PM - 3 PM")
 * @property {number} shortage - Number of agents short
 * @property {number} currentStaff - Current staff count
 * @property {number} requiredStaff - Required staff count
 */

/**
 * Recommendation type
 * @typedef {"reallocation" | "bot_activation" | "shift_change" | "overtime" | "break_adjustment"} RecommendationType
 */

/**
 * AI recommendation
 * @typedef {Object} AIRecommendation
 * @property {string} id - Recommendation ID
 * @property {RecommendationType} type - Type of recommendation
 * @property {string} text - Recommendation text
 * @property {string} [timeframe] - Suggested timeframe
 * @property {number} impact - Expected impact (agents saved or volume handled)
 * @property {boolean} applied - Whether recommendation has been applied
 */

/**
 * Workforce forecast
 * @typedef {Object} WorkforceForecast
 * @property {string} date - Forecast date
 * @property {PeakInfo} peak - Peak time information
 * @property {number} currentStaffing - Current number of agents
 * @property {number} requiredStaffing - Required number of agents
 * @property {number} staffingGap - Difference (negative = shortage)
 * @property {ForecastDataPoint[]} hourlyForecast - Hourly predictions
 * @property {AIRecommendation[]} recommendations - AI recommendations
 * @property {StaffingGap[]} gaps - Identified staffing gaps
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Recommendation type configuration
 * @type {Record<RecommendationType, {icon: string, color: string}>}
 */
const RECOMMENDATION_CONFIG = {
  reallocation: {
    icon: "👥",
    color: "bg-blue-50 text-blue-700 border-blue-200"
  },
  bot_activation: {
    icon: "🤖",
    color: "bg-purple-50 text-purple-700 border-purple-200"
  },
  shift_change: {
    icon: "🕐",
    color: "bg-orange-50 text-orange-700 border-orange-200"
  },
  overtime: {
    icon: "⏰",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200"
  },
  break_adjustment: {
    icon: "☕",
    color: "bg-green-50 text-green-700 border-green-200"
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Gets recommendation config
 * @param {RecommendationType} type
 * @returns {{icon: string, color: string}}
 */
const getRecommendationConfig = (type) => {
  return RECOMMENDATION_CONFIG[type] || {
    icon: "💡",
    color: "bg-slate-50 text-slate-700 border-slate-200"
  };
};

/**
 * Formats time
 * @param {string} time
 * @returns {string}
 */
const formatTime = (time) => {
  return time;
};

/**
 * Gets staffing status color
 * @param {number} gap
 * @returns {string}
 */
const getStaffingStatusColor = (gap) => {
  if (gap >= 0) return "text-green-600";
  if (gap >= -2) return "text-yellow-600";
  return "text-red-600";
};

/**
 * Gets staffing status icon
 * @param {number} gap
 * @returns {React.ReactElement}
 */
const getStaffingStatusIcon = (gap) => {
  if (gap >= 0) {
    return (
      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (gap >= -2) {
    return (
      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
};

// ============================================================================
// FORECAST GRAPH COMPONENT
// ============================================================================

/**
 * @typedef {Object} ForecastGraphProps
 * @property {ForecastDataPoint[]} data
 * @property {string} peakTime
 */

/**
 * Simple Forecast Graph Component
 * 
 * @param {ForecastGraphProps} props
 * @returns {React.ReactElement}
 */
function ForecastGraph(props) {
  const { data, peakTime } = props;

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        No forecast data available
      </div>
    );
  }

  const maxVolume = Math.max(...data.map(
    /**
     * @param {ForecastDataPoint} d
     */
    (d) => d.predictedVolume
  ));

  return (
    <div className="space-y-2">
      {data.map(
        /**
         * @param {ForecastDataPoint} point
         * @param {number} idx
         */
        (point, idx) => {
          const heightPercentage = (point.predictedVolume / maxVolume) * 100;
          const isPeak = point.time === peakTime;
          
          return (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-16 text-xs font-medium text-slate-600">
                {point.time}
              </div>
              <div className="flex-1 relative">
                <div className="h-8 bg-slate-100 rounded overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      isPeak ? "bg-red-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${heightPercentage}%` }}
                  />
                </div>
                {isPeak && (
                  <div className="absolute -top-1 -right-1">
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold text-red-700 bg-red-100 rounded-full border border-red-300">
                      PEAK
                    </span>
                  </div>
                )}
              </div>
              <div className="w-20 text-right">
                <div className="text-sm font-semibold text-slate-900">
                  {point.predictedVolume}
                </div>
                <div className="text-xs text-slate-500">
                  {point.requiredAgents} agents
                </div>
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}

// ============================================================================
// RECOMMENDATION CARD COMPONENT
// ============================================================================

/**
 * @typedef {Object} RecommendationCardProps
 * @property {AIRecommendation} recommendation
 * @property {(id: string) => void} onApply
 * @property {boolean} isApplying
 */

/**
 * Recommendation Card Component
 * 
 * @param {RecommendationCardProps} props
 * @returns {React.ReactElement}
 */
function RecommendationCard(props) {
  const { recommendation, onApply, isApplying } = props;
  const config = getRecommendationConfig(recommendation.type);

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${config.color}`}>
      <div className="flex-shrink-0 text-2xl">
        {config.icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium leading-relaxed">
          {recommendation.text}
        </p>
        {recommendation.timeframe && (
          <div className="mt-1 text-xs font-medium opacity-75">
            ⏱ {recommendation.timeframe}
          </div>
        )}
        <div className="mt-2 text-xs font-semibold">
          Impact: Handles ~{recommendation.impact} calls/agents
        </div>
      </div>
      {!recommendation.applied && (
        <button
          onClick={() => onApply(recommendation.id)}
          disabled={isApplying}
          className="flex-shrink-0 px-3 py-1.5 bg-white text-sm font-medium rounded-md 
                     border border-current hover:bg-opacity-10 transition-colors disabled:opacity-50"
        >
          {isApplying ? "Applying..." : "Apply"}
        </button>
      )}
      {recommendation.applied && (
        <div className="flex-shrink-0 px-3 py-1.5 bg-green-100 text-green-700 text-xs font-semibold rounded-md border border-green-300">
          ✓ Applied
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN WORKFORCE FORECASTING PAGE
// ============================================================================

/**
 * Workforce Forecasting Page Component
 * 
 * @returns {React.ReactElement}
 */
export default function WorkforceForecasting() {
  /** @type {[ForecastPeriod, React.Dispatch<React.SetStateAction<ForecastPeriod>>]} */
  const [period, setPeriod] = useState(/** @type {ForecastPeriod} */("today"));

  const { data: forecast, isLoading, refetch } = useGetForecastQuery(
    { period },
    { pollingInterval: 300000 } // Poll every 5 minutes
  );

  const [applyRecommendation, { isLoading: isApplying }] = useApplyRecommendationMutation();

  /**
   * Handles applying a recommendation
   * @param {string} recommendationId
   * @returns {Promise<void>}
   */
  const handleApplyRecommendation = async (recommendationId) => {
    try {
      await applyRecommendation({ recommendationId }).unwrap();
      // Success - will refetch automatically
    } catch (error) {
      console.error("Failed to apply recommendation:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Workforce Forecasting
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                AI-powered call volume predictions and staffing recommendations
              </p>
            </div>

            {/* Period Selector */}
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setPeriod("today")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  period === "today"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setPeriod("tomorrow")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  period === "tomorrow"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tomorrow
              </button>
              <button
                onClick={() => setPeriod("week")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  period === "week"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                This Week
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        
        {isLoading ? (
          <div className="text-center py-12 text-slate-500">Loading forecast...</div>
        ) : !forecast ? (
          <div className="text-center py-12 text-slate-500">No forecast data available</div>
        ) : (
          <>
            {/* AI Forecast Summary */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <svg className="w-8 h-8 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-purple-900 mb-3">
                    AI Forecast ({period === "today" ? "Today" : period === "tomorrow" ? "Tomorrow" : "This Week"})
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Expected Peak */}
                    <div className="bg-white bg-opacity-60 rounded-lg p-4 border border-purple-200">
                      <div className="text-xs font-medium text-purple-700 mb-1">Expected Peak</div>
                      <div className="text-2xl font-bold text-purple-900">{forecast.peak.time}</div>
                      <div className="text-xs text-purple-600 mt-1">{forecast.peak.volume} calls predicted</div>
                    </div>

                    {/* Required Staff */}
                    <div className="bg-white bg-opacity-60 rounded-lg p-4 border border-purple-200">
                      <div className="text-xs font-medium text-purple-700 mb-1">Required Staff</div>
                      <div className="text-2xl font-bold text-purple-900">{forecast.requiredStaffing} agents</div>
                      <div className="text-xs text-purple-600 mt-1">At peak time</div>
                    </div>

                    {/* Staffing Status */}
                    <div className="bg-white bg-opacity-60 rounded-lg p-4 border border-purple-200">
                      <div className="text-xs font-medium text-purple-700 mb-1">Current Staffing</div>
                      <div className={`flex items-center gap-2 ${getStaffingStatusColor(forecast.staffingGap)}`}>
                        {getStaffingStatusIcon(forecast.staffingGap)}
                        <div>
                          <div className="text-2xl font-bold">{forecast.currentStaffing} agents</div>
                          <div className="text-xs font-semibold mt-1">
                            {forecast.staffingGap < 0 
                              ? `${Math.abs(forecast.staffingGap)} agents short` 
                              : forecast.staffingGap === 0 
                              ? "Perfectly staffed" 
                              : `${forecast.staffingGap} agents surplus`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Call Volume Graph */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Call Volume Forecast</h2>
                    <p className="text-sm text-slate-600 mt-1">Predicted call volume throughout the day</p>
                  </div>
                  <button
                    onClick={() => refetch()}
                    className="text-sm text-slate-600 hover:text-slate-900 font-medium"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              <div className="p-6">
                <ForecastGraph data={forecast.hourlyForecast} peakTime={forecast.peak.time} />
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">AI Recommendations</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Intelligent suggestions to optimize workforce allocation
                </p>
              </div>

              <div className="p-6 space-y-3">
                {forecast.recommendations.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-slate-900 mb-1">No recommendations</h3>
                    <p className="text-sm text-slate-500">Current staffing is optimal for predicted volume.</p>
                  </div>
                ) : (
                  forecast.recommendations.map(
                    /**
                     * @param {AIRecommendation} rec
                     */
                    (rec) => (
                    <RecommendationCard
                      key={rec.id}
                      recommendation={rec}
                      onApply={handleApplyRecommendation}
                      isApplying={isApplying}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Staffing Gaps */}
            {forecast.gaps && forecast.gaps.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-slate-900">Identified Staffing Gaps</h2>
                  <p className="text-sm text-slate-600 mt-1">Time periods requiring attention</p>
                </div>

                <div className="p-6">
                  <div className="space-y-2">
                    {forecast.gaps.map(
                      /**
                       * @param {StaffingGap} gap
                       * @param {number} idx
                       */
                      (gap, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div>
                            <div className="text-sm font-semibold text-red-900">{gap.period}</div>
                            <div className="text-xs text-red-700">
                              {gap.currentStaff} current / {gap.requiredStaff} required
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-red-900">
                          {gap.shortage} short
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </div>

    </div>
  );
}