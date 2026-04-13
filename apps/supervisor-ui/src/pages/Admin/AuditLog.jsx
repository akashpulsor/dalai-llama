// src/pages/admin/AuditLog/AuditLogPage.jsx

/**
 * @file Audit Log Management
 * 
 * Enterprise SaaS interface for viewing and filtering audit log events
 * across the system.
 */

import React, { useState } from "react";

import {
  useGetAuditLogsQuery
} from "@dalaillama/shared-store";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Action types
 * @typedef {"created" | "updated" | "deleted" | "accessed" | "login" | "logout" | "exported"} ActionType
 */

/**
 * Resource types
 * @typedef {"ivr" | "agent" | "queue" | "bot" | "recording" | "user" | "setting"} ResourceType
 */

/**
 * Audit log entry
 * @typedef {Object} AuditLogEntry
 * @property {string} id - Log entry ID
 * @property {string} timestamp - Timestamp in ISO format
 * @property {string} userId - User who performed the action
 * @property {string} userName - Display name of user
 * @property {ActionType} action - Action performed
 * @property {ResourceType} resourceType - Type of resource affected
 * @property {string} resourceName - Name/ID of the resource
 * @property {string} [ipAddress] - IP address of user
 * @property {Object} [metadata] - Additional metadata
 */

/**
 * Filter state
 * @typedef {Object} FilterState
 * @property {string} startDate - Start date for range
 * @property {string} endDate - End date for range
 * @property {string} actor - User filter
 * @property {ResourceType | ""} resourceType - Resource type filter
 * @property {ActionType | ""} actionType - Action type filter
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** @type {readonly {value: ActionType, label: string}[]} */
const ACTION_TYPES = [
  { value: "created", label: "Created" },
  { value: "updated", label: "Updated" },
  { value: "deleted", label: "Deleted" },
  { value: "accessed", label: "Accessed" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "exported", label: "Exported" }
];

/** @type {readonly {value: ResourceType, label: string}[]} */
const RESOURCE_TYPES = [
  { value: "ivr", label: "IVR" },
  { value: "agent", label: "Agent" },
  { value: "queue", label: "Queue" },
  { value: "bot", label: "Bot" },
  { value: "recording", label: "Recording" },
  { value: "user", label: "User" },
  { value: "setting", label: "Setting" }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Formats timestamp for display
 * @param {string} timestamp - ISO timestamp
 * @returns {string}
 */
const formatTimestamp = (timestamp) => {
  if (!timestamp) return "—";
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
};

/**
 * Formats action for display
 * @param {ActionType} action - Action type
 * @returns {string}
 */
const formatAction = (action) => {
  const actionConfig = ACTION_TYPES.find(
    /**
     * @param {{value: ActionType, label: string}} a
     */
    (a) => a.value === action
  );
  return actionConfig?.label || action;
};

// ============================================================================
// MAIN AUDIT LOG PAGE
// ============================================================================

/**
 * Audit Log Page Component
 * 
 * @returns {React.ReactElement}
 */
export default function AuditLogPage() {
  // Filter state
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [startDate, setStartDate] = useState("");

  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [endDate, setEndDate] = useState("");

  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [actor, setActor] = useState("");

  /** @type {[ResourceType | "", React.Dispatch<React.SetStateAction<ResourceType | "">>]} */
  const [resourceType, setResourceType] = useState(/** @type {ResourceType | ""} */ (""));

  /** @type {[ActionType | "", React.Dispatch<React.SetStateAction<ActionType | "">>]} */
  const [actionType, setActionType] = useState(/** @type {ActionType | ""} */ (""));

  // Query with filters
  const { data: logs = [], isLoading, refetch } = useGetAuditLogsQuery({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    actor: actor || undefined,
    resourceType: resourceType || undefined,
    actionType: actionType || undefined
  });

  /**
   * Handles filter reset
   * @returns {void}
   */
  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
    setActor("");
    setResourceType("");
    setActionType("");
  };

  /**
   * Handles export to CSV
   * @returns {void}
   */
  const handleExport = () => {
    // Export logic here
    alert("Export functionality - CSV download will be implemented");
  };

  /**
   * Checks if any filters are active
   * @returns {boolean}
   */
  const hasActiveFilters = () => {
    return !!(startDate || endDate || actor || resourceType || actionType);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Audit Log
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                View and filter system activity and security events
              </p>
            </div>
            <button
              onClick={handleExport}
              className="inline-flex items-center px-4 py-2 border border-slate-300 text-slate-700 
                         text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Filters */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Filters</h2>
              {hasActiveFilters() && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
          
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              
              {/* Date Range - Start */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm
                             focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Date Range - End */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm
                             focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Actor */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  User
                </label>
                <input
                  type="text"
                  value={actor}
                  onChange={(e) => setActor(e.target.value)}
                  placeholder="Search by user..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm
                             placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Resource Type */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Resource
                </label>
                <select
                  value={resourceType}
                  onChange={(e) => setResourceType(/** @type {ResourceType | ""} */ (e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm
                             focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="">All Resources</option>
                  {RESOURCE_TYPES.map(
                    /**
                     * @param {{value: ResourceType, label: string}} type
                     */
                    (type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Type */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Action
                </label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(/** @type {ActionType | ""} */ (e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm
                             focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="">All Actions</option>
                  {ACTION_TYPES.map(
                    /**
                     * @param {{value: ActionType, label: string}} type
                     */
                    (type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="px-6 py-12 text-center text-slate-500">
                Loading audit logs...
              </div>
            ) : logs.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-4 text-sm font-medium text-slate-900">No audit logs found</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {hasActiveFilters() 
                    ? "Try adjusting your filters to see more results." 
                    : "Audit logs will appear here as actions are performed."}
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Details</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {logs.map(
                    /**
                     * @param {AuditLogEntry} log
                     */
                    (log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600 mr-3">
                            {log.userName.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-slate-900">
                            {log.userName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {formatAction(log.action)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{log.resourceName}</div>
                        <div className="text-xs text-slate-500 capitalize">{log.resourceType}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-slate-600 hover:text-slate-900">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {logs.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Showing {logs.length} entries
                </div>
                <div className="flex gap-2">
                  <button
                    disabled
                    className="px-3 py-1 border border-slate-300 rounded text-sm text-slate-700
                               hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    disabled
                    className="px-3 py-1 border border-slate-300 rounded text-sm text-slate-700
                               hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}