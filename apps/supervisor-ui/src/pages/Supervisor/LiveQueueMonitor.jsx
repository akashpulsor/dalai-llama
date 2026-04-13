// src/pages/supervisor/LiveQueueMonitor.jsx

/**
 * @file Live Queue Monitor
 * 
 * Real-time queue monitoring interface with AI-powered insights and
 * detailed metrics for each queue.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  useGetQueueMonitorQuery
} from "@dalaillama/shared-store";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Queue status type
 * @typedef {"normal" | "busy" | "critical"} QueueStatus
 */

/**
 * Queue monitor data
 * @typedef {Object} QueueMonitor
 * @property {string} id - Queue ID
 * @property {string} name - Queue name
 * @property {string} currentWait - Current wait time (MM:SS)
 * @property {number} agentsActive - Number of active agents
 * @property {number} callsWaiting - Number of calls in queue
 * @property {string} [aiNote] - AI-generated insight
 * @property {QueueStatus} status - Queue health status
 * @property {number} [totalAgents] - Total agents assigned
 * @property {number} [callsAnswered] - Calls answered today
 * @property {string} [avgHandleTime] - Average handle time
 */

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Gets status color classes
 * @param {QueueStatus} status
 * @returns {string}
 */
const getStatusColor = (status) => {
  switch (status) {
    case "critical":
      return "border-red-300 bg-red-50";
    case "busy":
      return "border-yellow-300 bg-yellow-50";
    default:
      return "border-green-300 bg-green-50";
  }
};

/**
 * Gets status badge color
 * @param {QueueStatus} status
 * @returns {string}
 */
const getStatusBadgeColor = (status) => {
  switch (status) {
    case "critical":
      return "bg-red-100 text-red-800 border-red-200";
    case "busy":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    default:
      return "bg-green-100 text-green-800 border-green-200";
  }
};

/**
 * Gets status icon
 * @param {QueueStatus} status
 * @returns {React.ReactElement}
 */
const getStatusIcon = (status) => {
  switch (status) {
    case "critical":
      return (
        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case "busy":
      return (
        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

// ============================================================================
// QUEUE CARD COMPONENT
// ============================================================================

/**
 * @typedef {Object} QueueCardProps
 * @property {QueueMonitor} queue - Queue data
 * @property {() => void} onViewDetails - View details callback
 */

/**
 * Queue Card Component
 * 
 * @param {QueueCardProps} props
 * @returns {React.ReactElement}
 */
function QueueCard(props) {
  const { queue, onViewDetails } = props;

  return (
    <div className={`bg-white rounded-lg border-2 shadow-sm transition-all hover:shadow-md ${getStatusColor(queue.status)}`}>
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(queue.status)}
            <h3 className="text-lg font-semibold text-slate-900">{queue.name}</h3>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeColor(queue.status)}`}>
            {queue.status}
          </span>
        </div>
      </div>

      {/* Metrics */}
      <div className="px-6 py-4 space-y-3">
        
        {/* Current Wait */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-700">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Current Wait:</span>
          </div>
          <span className={`text-base font-mono font-bold ${
            queue.status === "critical" ? "text-red-600" :
            queue.status === "busy" ? "text-yellow-600" :
            "text-green-600"
          }`}>
            {queue.currentWait}
          </span>
        </div>

        {/* Agents Active */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-700">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-sm font-medium">Agents Active:</span>
          </div>
          <span className="text-base font-bold text-slate-900">
            {queue.agentsActive}
            {queue.totalAgents && (
              <span className="text-sm font-normal text-slate-500"> / {queue.totalAgents}</span>
            )}
          </span>
        </div>

        {/* Calls Waiting */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-700">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="text-sm font-medium">Calls Waiting:</span>
          </div>
          <span className="text-base font-bold text-slate-900">{queue.callsWaiting}</span>
        </div>

      </div>

      {/* AI Note */}
      {queue.aiNote && (
        <div className="px-6 py-3 bg-blue-50 border-t border-blue-100">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div>
              <div className="text-xs font-semibold text-blue-900 mb-0.5">AI Note</div>
              <p className="text-xs text-blue-800 leading-relaxed italic">
                {queue.aiNote}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-3 border-t border-slate-200 bg-slate-50">
        <button
          onClick={onViewDetails}
          className="w-full px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md
                     hover:bg-slate-800 transition-colors"
        >
          View Details
        </button>
      </div>

    </div>
  );
}

// ============================================================================
// MAIN LIVE QUEUE MONITOR PAGE
// ============================================================================

/**
 * Live Queue Monitor Page Component
 * 
 * @returns {React.ReactElement}
 */
export default function LiveQueueMonitor() {
  const navigate = useNavigate();

  const { data: queues = [], isLoading, refetch } = useGetQueueMonitorQuery(undefined, {
    pollingInterval: 3000 // Poll every 3 seconds for real-time updates
  });

  /**
   * Handles view details click
   * @param {string} queueId
   * @returns {void}
   */
  const handleViewDetails = 
    /**
     * @param {string} queueId
     */
    (queueId) => {
      navigate(`/supervisor/queue/${queueId}`);
    };

  /**
   * Gets queue statistics
   * @returns {{total: number, critical: number, busy: number, normal: number}}
   */
  const getQueueStats = () => {
    return {
      total: queues.length,
      critical: queues.filter(
        /**
         * @param {QueueMonitor} q
         */
        (q) => q.status === "critical"
      ).length,
      busy: queues.filter(
        /**
         * @param {QueueMonitor} q
         */
        (q) => q.status === "busy"
      ).length,
      normal: queues.filter(
        /**
         * @param {QueueMonitor} q
         */
        (q) => q.status === "normal"
      ).length
    };
  };

  const stats = getQueueStats();

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Live Queue Monitor
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Real-time queue status and AI-powered insights
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
              <div className="text-xs font-medium text-slate-600 mb-1">Total Queues</div>
              <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-xs font-medium text-green-700 mb-1">Normal</div>
              <div className="text-2xl font-bold text-green-900">{stats.normal}</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="text-xs font-medium text-yellow-700 mb-1">Busy</div>
              <div className="text-2xl font-bold text-yellow-900">{stats.busy}</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="text-xs font-medium text-red-700 mb-1">Critical</div>
              <div className="text-2xl font-bold text-red-900">{stats.critical}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-600">Loading queue data...</div>
          </div>
        ) : queues.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <h3 className="text-lg font-medium text-slate-900 mb-1">No active queues</h3>
            <p className="text-sm text-slate-500">Queue information will appear here when queues are active.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {queues.map(
              /**
               * @param {QueueMonitor} queue
               */
              (queue) => (
              <QueueCard
                key={queue.id}
                queue={queue}
                onViewDetails={() => handleViewDetails(queue.id)}
              />
            ))}
          </div>
        )}

      </div>

    </div>
  );
}