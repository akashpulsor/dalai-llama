// src/pages/admin/RecordingPolicies/RecordingPoliciesPage.jsx

/**
 * @file Recording Policies Management
 * 
 * Enterprise SaaS interface for managing call recording policies with global settings
 * and queue-specific overrides.
 */

import React, { useState } from "react";

import {
  useGetRecordingPoliciesQuery,
  useUpdateGlobalPoliciesMutation,
  useGetQueueOverridesQuery,
  useUpdateQueueOverrideMutation,
  useDeleteQueueOverrideMutation
} from "@dalaillama/shared-store";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Recording mode options
 * @typedef {"always" | "on_demand" | "never"} RecordingMode
 */

/**
 * Retention period options
 * @typedef {"7" | "30" | "60" | "90" | "180" | "365" | "forever"} RetentionPeriod
 */

/**
 * Global recording policy settings
 * @typedef {Object} GlobalRecordingPolicy
 * @property {boolean} recordInbound - Record inbound calls
 * @property {boolean} recordOutbound - Record outbound calls
 * @property {boolean} allowPauseResume - Allow agents to pause/resume recording
 * @property {boolean} redactSensitiveData - Redact PCI/sensitive data
 * @property {RetentionPeriod} retentionPeriod - How long to keep recordings
 */

/**
 * Queue-specific recording override
 * @typedef {Object} QueueRecordingOverride
 * @property {string} id - Override ID
 * @property {string} queueId - Queue ID
 * @property {string} queueName - Queue name
 * @property {RecordingMode} recordingMode - Recording mode for this queue
 * @property {RetentionPeriod} [retentionPeriod] - Optional custom retention
 * @property {boolean} [redactSensitiveData] - Optional override for redaction
 */

/**
 * Props for QueueOverrideForm modal
 * @typedef {Object} QueueOverrideFormProps
 * @property {"add" | "edit"} mode - Form mode
 * @property {QueueRecordingOverride | null} override - Override to edit
 * @property {() => void} onClose - Close callback
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** @type {readonly {value: RetentionPeriod, label: string}[]} */
const RETENTION_OPTIONS = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days" },
  { value: "180", label: "180 days (6 months)" },
  { value: "365", label: "365 days (1 year)" },
  { value: "forever", label: "Forever" }
];

/** @type {readonly {value: RecordingMode, label: string, description: string}[]} */
const RECORDING_MODES = [
  { 
    value: "always", 
    label: "Always", 
    description: "Record all calls automatically" 
  },
  { 
    value: "on_demand", 
    label: "On Demand", 
    description: "Agent manually starts recording" 
  },
  { 
    value: "never", 
    label: "Never", 
    description: "No recording for this queue" 
  }
];

// ============================================================================
// QUEUE OVERRIDE FORM MODAL
// ============================================================================

/**
 * Queue Override Form Component
 * 
 * @param {QueueOverrideFormProps} props
 * @returns {React.ReactElement}
 */
function QueueOverrideForm(props) {
  const { mode, override, onClose } = props;
  const isEdit = mode === "edit";

  const [updateOverride] = useUpdateQueueOverrideMutation();

  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [queueId, setQueueId] = useState(override?.queueId ?? "");

  /** @type {[RecordingMode, React.Dispatch<React.SetStateAction<RecordingMode>>]} */
  const [recordingMode, setRecordingMode] = useState(
    override?.recordingMode ?? /** @type {RecordingMode} */ ("always")
  );

  /** @type {[RetentionPeriod | "", React.Dispatch<React.SetStateAction<RetentionPeriod | "">>]} */
  const [retentionPeriod, setRetentionPeriod] = useState(
    override?.retentionPeriod ?? ""
  );

  /** @type {[boolean | null, React.Dispatch<React.SetStateAction<boolean | null>>]} */
  const [redactSensitiveData, setRedactSensitiveData] = useState(
    override?.redactSensitiveData ?? null
  );

  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Handles form submission
   * @returns {Promise<void>}
   */
  const handleSave = async () => {
    if (!queueId) {
      alert("Please select a queue");
      return;
    }

    setIsSaving(true);

    try {
      /** @type {Partial<QueueRecordingOverride>} */
      const payload = {
        queueId,
        recordingMode,
        retentionPeriod: retentionPeriod || undefined,
        redactSensitiveData: redactSensitiveData ?? undefined
      };

      if (isEdit && override) {
        await updateOverride({ id: override.id, ...payload }).unwrap();
      } else {
        await updateOverride(payload).unwrap();
      }

      onClose();
    } catch (error) {
      console.error("Failed to save override:", error);
      alert("Failed to save override. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? "Edit Queue Override" : "Add Queue Override"}
          </h2>
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

      {/* Form Content */}
      <div className="px-6 py-6 space-y-6">

        {/* Queue Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Queue
          </label>
          <select
            value={queueId}
            onChange={(e) => setQueueId(e.target.value)}
            disabled={isEdit}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900
                       focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100
                       disabled:cursor-not-allowed"
          >
            <option value="">Select Queue</option>
            <option value="sales">Sales Queue</option>
            <option value="support">Support Queue</option>
            <option value="billing">Billing Queue</option>
          </select>
        </div>

        {/* Recording Mode */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Recording Mode
          </label>
          <div className="space-y-2">
            {RECORDING_MODES.map(
              /**
               * @param {{value: RecordingMode, label: string, description: string}} mode
               */
              (mode) => (
              <label
                key={mode.value}
                className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  recordingMode === mode.value
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="recordingMode"
                  value={mode.value}
                  checked={recordingMode === mode.value}
                  onChange={(e) => setRecordingMode(/** @type {RecordingMode} */ (e.target.value))}
                  className="mt-1 w-4 h-4 text-slate-900 focus:ring-slate-900"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-slate-900">{mode.label}</div>
                  <div className="text-xs text-slate-500">{mode.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Custom Retention */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <input
              type="checkbox"
              checked={retentionPeriod !== ""}
              onChange={(e) => {
                if (e.target.checked) {
                  setRetentionPeriod("30");
                } else {
                  setRetentionPeriod("");
                }
              }}
              className="w-4 h-4 text-slate-900 focus:ring-slate-900 rounded"
            />
            Custom Retention Period
          </label>
          {retentionPeriod !== "" && (
            <select
              value={retentionPeriod}
              onChange={(e) => setRetentionPeriod(/** @type {RetentionPeriod} */ (e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900
                         focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              {RETENTION_OPTIONS.map(
                /**
                 * @param {{value: RetentionPeriod, label: string}} option
                 */
                (option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Custom Redaction */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={redactSensitiveData !== null}
              onChange={(e) => {
                if (e.target.checked) {
                  setRedactSensitiveData(true);
                } else {
                  setRedactSensitiveData(null);
                }
              }}
              className="w-4 h-4 text-slate-900 focus:ring-slate-900 rounded"
            />
            Override Sensitive Data Redaction
          </label>
          {redactSensitiveData !== null && (
            <div className="mt-2 ml-6">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={redactSensitiveData}
                  onChange={(e) => setRedactSensitiveData(e.target.checked)}
                  className="w-4 h-4 text-slate-900 focus:ring-slate-900 rounded"
                />
                Redact sensitive data for this queue
              </label>
            </div>
          )}
        </div>

      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 
                     rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md 
                     hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving..." : "Save Override"}
        </button>
      </div>

    </div>
  );
}

// ============================================================================
// MAIN RECORDING POLICIES PAGE
// ============================================================================

/**
 * Recording Policies Page Component
 * 
 * @returns {React.ReactElement}
 */
export default function RecordingPoliciesPage() {
  const { data: globalPolicies, isLoading: policiesLoading } = useGetRecordingPoliciesQuery();
  const { data: queueOverrides = [], isLoading: overridesLoading } = useGetQueueOverridesQuery();
  
  const [updateGlobalPolicies] = useUpdateGlobalPoliciesMutation();
  const [deleteOverride] = useDeleteQueueOverrideMutation();

  // Local state for global policies
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [recordInbound, setRecordInbound] = useState(globalPolicies?.recordInbound ?? true);

  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [recordOutbound, setRecordOutbound] = useState(globalPolicies?.recordOutbound ?? true);

  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [allowPauseResume, setAllowPauseResume] = useState(globalPolicies?.allowPauseResume ?? false);

  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [redactSensitiveData, setRedactSensitiveData] = useState(globalPolicies?.redactSensitiveData ?? true);

  /** @type {[RetentionPeriod, React.Dispatch<React.SetStateAction<RetentionPeriod>>]} */
  const [retentionPeriod, setRetentionPeriod] = useState(
    globalPolicies?.retentionPeriod ?? /** @type {RetentionPeriod} */ ("30")
  );

  // Modal state
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [showOverrideForm, setShowOverrideForm] = useState(false);

  /** @type {["add" | "edit", React.Dispatch<React.SetStateAction<"add" | "edit">>]} */
  const [formMode, setFormMode] = useState(/** @type {"add" | "edit"} */ ("add"));

  /** @type {[QueueRecordingOverride | null, React.Dispatch<React.SetStateAction<QueueRecordingOverride | null>>]} */
  const [selectedOverride, setSelectedOverride] = useState(/** @type {QueueRecordingOverride | null} */ (null));

  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Saves global policies
   * @returns {Promise<void>}
   */
  const handleSaveGlobalPolicies = async () => {
    setIsSaving(true);
    try {
      await updateGlobalPolicies({
        recordInbound,
        recordOutbound,
        allowPauseResume,
        redactSensitiveData,
        retentionPeriod
      }).unwrap();
      alert("Global policies saved successfully!");
    } catch (error) {
      console.error("Failed to save policies:", error);
      alert("Failed to save policies. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Opens override form in add mode
   * @returns {void}
   */
  const handleAddOverride = () => {
    setFormMode("add");
    setSelectedOverride(null);
    setShowOverrideForm(true);
  };

  /**
   * Opens override form in edit mode
   * @param {QueueRecordingOverride} override - Override to edit
   * @returns {void}
   */
  const handleEditOverride = 
    /**
     * @param {QueueRecordingOverride} override
     */
    (override) => {
      setFormMode("edit");
      setSelectedOverride(override);
      setShowOverrideForm(true);
    };

  /**
   * Deletes a queue override
   * @param {string} overrideId
   * @param {string} queueName
   * @returns {Promise<void>}
   */
  const handleDeleteOverride = async (overrideId, queueName) => {
    if (window.confirm(`Remove recording override for "${queueName}"?`)) {
      try {
        await deleteOverride(overrideId).unwrap();
      } catch (error) {
        console.error("Failed to delete override:", error);
        alert("Failed to delete override. Please try again.");
      }
    }
  };

  /**
   * Closes the override form
   * @returns {void}
   */
  const handleCloseForm = () => {
    setShowOverrideForm(false);
    setSelectedOverride(null);
  };

  if (policiesLoading || overridesLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-slate-600">Loading recording policies...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-semibold text-slate-900">
            Recording Policies
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Configure global recording settings and queue-specific overrides
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Global Recording Settings */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Global Recording</h2>
            <p className="text-sm text-slate-600 mt-1">Default settings applied to all queues</p>
          </div>
          
          <div className="px-6 py-6 space-y-4">
            
            {/* Checkboxes */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={recordInbound}
                onChange={(e) => setRecordInbound(e.target.checked)}
                className="w-5 h-5 text-slate-900 focus:ring-slate-900 rounded"
              />
              <div>
                <div className="text-sm font-medium text-slate-900 group-hover:text-slate-700">
                  Record inbound calls
                </div>
                <div className="text-xs text-slate-500">
                  Automatically record all incoming calls
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={recordOutbound}
                onChange={(e) => setRecordOutbound(e.target.checked)}
                className="w-5 h-5 text-slate-900 focus:ring-slate-900 rounded"
              />
              <div>
                <div className="text-sm font-medium text-slate-900 group-hover:text-slate-700">
                  Record outbound calls
                </div>
                <div className="text-xs text-slate-500">
                  Automatically record all outgoing calls
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={allowPauseResume}
                onChange={(e) => setAllowPauseResume(e.target.checked)}
                className="w-5 h-5 text-slate-900 focus:ring-slate-900 rounded"
              />
              <div>
                <div className="text-sm font-medium text-slate-900 group-hover:text-slate-700">
                  Allow pause/resume
                </div>
                <div className="text-xs text-slate-500">
                  Let agents pause and resume recording during calls
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={redactSensitiveData}
                onChange={(e) => setRedactSensitiveData(e.target.checked)}
                className="w-5 h-5 text-slate-900 focus:ring-slate-900 rounded"
              />
              <div>
                <div className="text-sm font-medium text-slate-900 group-hover:text-slate-700">
                  Redact sensitive digits (PCI)
                </div>
                <div className="text-xs text-slate-500">
                  Automatically redact credit card numbers and sensitive information
                </div>
              </div>
            </label>

          </div>
        </div>

        {/* Retention Settings */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Retention</h2>
          </div>
          
          <div className="px-6 py-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Keep recordings for
            </label>
            <select
              value={retentionPeriod}
              onChange={(e) => setRetentionPeriod(/** @type {RetentionPeriod} */ (e.target.value))}
              className="w-full max-w-xs px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900
                         focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              {RETENTION_OPTIONS.map(
                /**
                 * @param {{value: RetentionPeriod, label: string}} option
                 */
                (option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Save Button for Global Settings */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveGlobalPolicies}
            disabled={isSaving}
            className="px-6 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg 
                       hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save Global Settings"}
          </button>
        </div>

        {/* Queue Overrides */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Queue Overrides</h2>
              <p className="text-sm text-slate-600 mt-1">
                Override global settings for specific queues
              </p>
            </div>
            <button
              onClick={handleAddOverride}
              className="inline-flex items-center px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg
                         hover:bg-slate-800 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Override
            </button>
          </div>

          {queueOverrides.length === 0 ? (
            // Empty State
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <h3 className="mt-4 text-sm font-medium text-slate-900">No queue overrides</h3>
              <p className="mt-1 text-sm text-slate-500">
                Get started by adding a recording override for a specific queue.
              </p>
            </div>
          ) : (
            // Queue Overrides Table
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Queue
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Recording
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Retention
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {queueOverrides.map(
                    /**
                     * @param {QueueRecordingOverride} override
                     */
                    (override) => (
                    <tr key={override.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{override.queueName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          override.recordingMode === "always" 
                            ? "bg-green-100 text-green-800" 
                            : override.recordingMode === "on_demand"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-800"
                        }`}>
                          {override.recordingMode === "always" ? "Always" : 
                           override.recordingMode === "on_demand" ? "On Demand" : "Never"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {override.retentionPeriod 
                          ? RETENTION_OPTIONS.find(o => o.value === override.retentionPeriod)?.label || "Custom"
                          : "Default"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditOverride(override)}
                          className="text-slate-600 hover:text-slate-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteOverride(override.id, override.queueName)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Override Form Modal */}
      {showOverrideForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
              onClick={handleCloseForm}
            />

            {/* Modal */}
            <div className="relative">
              <QueueOverrideForm
                mode={formMode}
                override={selectedOverride}
                onClose={handleCloseForm}
              />
            </div>

          </div>
        </div>
      )}

    </div>
  );
}