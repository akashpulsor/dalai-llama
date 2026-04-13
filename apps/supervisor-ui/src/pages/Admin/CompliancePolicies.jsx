// src/pages/admin/Compliance/CompliancePoliciesPage.jsx

/**
 * @file Compliance Policies Management
 * 
 * Enterprise SaaS interface for managing compliance policies including regional rules,
 * DNC lists, and data handling configurations.
 */

import React, { useState } from "react";

import {
  useGetCompliancePoliciesQuery,
  useUpdateCompliancePoliciesMutation,
  useUploadDNCListMutation,
  useAddDNCNumberMutation,
  useGetDNCListQuery,
  useDeleteDNCNumberMutation
} from "@dalaillama/shared-store";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Storage region options
 * @typedef {"asia-south1" | "us-central1" | "europe-west1" | "australia-southeast1"} StorageRegion
 */

/**
 * Recording redaction status
 * @typedef {"enabled" | "disabled"} RedactionStatus
 */

/**
 * Compliance policy settings
 * @typedef {Object} CompliancePolicy
 * @property {boolean} gdprEnabled - GDPR compliance enabled
 * @property {boolean} traiAnnouncementEnabled - India TRAI mandatory announcement
 * @property {string} [traiAnnouncementAudioUrl] - URL of uploaded TRAI audio
 * @property {StorageRegion} storageRegion - Data storage region
 * @property {RedactionStatus} recordingRedaction - Recording redaction status
 */

/**
 * DNC (Do Not Call) number entry
 * @typedef {Object} DNCNumber
 * @property {string} id - Unique ID
 * @property {string} number - Phone number
 * @property {string} addedAt - Timestamp when added
 * @property {string} [notes] - Optional notes
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** @type {readonly {value: StorageRegion, label: string}[]} */
const STORAGE_REGIONS = [
  { value: "asia-south1", label: "Asia South (Mumbai)" },
  { value: "us-central1", label: "US Central (Iowa)" },
  { value: "europe-west1", label: "Europe West (Belgium)" },
  { value: "australia-southeast1", label: "Australia Southeast (Sydney)" }
];

// ============================================================================
// DNC NUMBER FORM MODAL
// ============================================================================

/**
 * @typedef {Object} DNCNumberFormProps
 * @property {() => void} onClose - Close callback
 * @property {() => void} onSuccess - Success callback
 */

/**
 * DNC Number Form Modal
 * 
 * @param {DNCNumberFormProps} props
 * @returns {React.ReactElement}
 */
function DNCNumberForm(props) {
  const { onClose, onSuccess } = props;
  const [addDNCNumber] = useAddDNCNumberMutation();

  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [phoneNumber, setPhoneNumber] = useState("");

  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [notes, setNotes] = useState("");

  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Handles form submission
   * @returns {Promise<void>}
   */
  const handleSubmit = async () => {
    if (!phoneNumber.trim()) {
      alert("Please enter a phone number");
      return;
    }

    setIsSaving(true);
    try {
      await addDNCNumber({
        number: phoneNumber.trim(),
        notes: notes.trim() || undefined
      }).unwrap();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to add DNC number:", error);
      alert("Failed to add number. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Add DNC Number
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
      <div className="px-6 py-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900
                       placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this number..."
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900
                       placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
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
          onClick={handleSubmit}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md 
                     hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Adding..." : "Add Number"}
        </button>
      </div>

    </div>
  );
}

// ============================================================================
// MAIN COMPLIANCE POLICIES PAGE
// ============================================================================

/**
 * Compliance Policies Page Component
 * 
 * @returns {React.ReactElement}
 */
export default function CompliancePoliciesPage() {
  const { data: policies, isLoading: policiesLoading } = useGetCompliancePoliciesQuery();
  const { data: dncList = [], isLoading: dncLoading } = useGetDNCListQuery();
  
  const [updatePolicies] = useUpdateCompliancePoliciesMutation();
  const [uploadDNCList] = useUploadDNCListMutation();
  const [deleteDNCNumber] = useDeleteDNCNumberMutation();

  // Local state for policies
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [gdprEnabled, setGdprEnabled] = useState(policies?.gdprEnabled ?? false);

  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [traiAnnouncementEnabled, setTraiAnnouncementEnabled] = useState(
    policies?.traiAnnouncementEnabled ?? false
  );

  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [traiAnnouncementAudioUrl, setTraiAnnouncementAudioUrl] = useState(
    policies?.traiAnnouncementAudioUrl ?? ""
  );

  /** @type {[StorageRegion, React.Dispatch<React.SetStateAction<StorageRegion>>]} */
  const [storageRegion, setStorageRegion] = useState(
    policies?.storageRegion ?? /** @type {StorageRegion} */ ("asia-south1")
  );

  /** @type {[RedactionStatus, React.Dispatch<React.SetStateAction<RedactionStatus>>]} */
  const [recordingRedaction, setRecordingRedaction] = useState(
    policies?.recordingRedaction ?? /** @type {RedactionStatus} */ ("enabled")
  );

  // Modal state
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [showAddNumberModal, setShowAddNumberModal] = useState(false);

  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [isSaving, setIsSaving] = useState(false);

  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Handles TRAI audio file upload
   * @param {React.ChangeEvent<HTMLInputElement>} e
   * @returns {Promise<void>}
   */
  const handleTraiAudioUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Upload file logic here
      const formData = new FormData();
      formData.append("audio", file);
      
      // Simulate upload - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setTraiAnnouncementAudioUrl(`/uploads/${file.name}`);
      alert("Audio file uploaded successfully!");
    } catch (error) {
      console.error("Failed to upload audio:", error);
      alert("Failed to upload audio. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Handles DNC CSV upload
   * @param {React.ChangeEvent<HTMLInputElement>} e
   * @returns {Promise<void>}
   */
  const handleDNCUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      alert("Please upload a CSV file");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("dnc_list", file);
      
      await uploadDNCList(formData).unwrap();
      alert("DNC list uploaded successfully!");
    } catch (error) {
      console.error("Failed to upload DNC list:", error);
      alert("Failed to upload DNC list. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Saves compliance policies
   * @returns {Promise<void>}
   */
  const handleSavePolicies = async () => {
    setIsSaving(true);
    try {
      await updatePolicies({
        gdprEnabled,
        traiAnnouncementEnabled,
        traiAnnouncementAudioUrl: traiAnnouncementAudioUrl || undefined,
        storageRegion,
        recordingRedaction
      }).unwrap();
      alert("Compliance policies saved successfully!");
    } catch (error) {
      console.error("Failed to save policies:", error);
      alert("Failed to save policies. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Deletes a DNC number
   * @param {string} numberId
   * @param {string} phoneNumber
   * @returns {Promise<void>}
   */
  const handleDeleteDNCNumber = async (numberId, phoneNumber) => {
    if (window.confirm(`Remove ${phoneNumber} from DNC list?`)) {
      try {
        await deleteDNCNumber(numberId).unwrap();
      } catch (error) {
        console.error("Failed to delete DNC number:", error);
        alert("Failed to delete number. Please try again.");
      }
    }
  };

  if (policiesLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-slate-600">Loading compliance policies...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-semibold text-slate-900">
            Compliance Policies
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Configure regional compliance rules and data handling policies
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Regional Rules */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Regional Rules</h2>
            <p className="text-sm text-slate-600 mt-1">
              Enable compliance features for specific regions
            </p>
          </div>
          
          <div className="px-6 py-6 space-y-6">
            
            {/* GDPR */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={gdprEnabled}
                  onChange={(e) => setGdprEnabled(e.target.checked)}
                  className="w-5 h-5 text-slate-900 focus:ring-slate-900 rounded"
                />
                <div>
                  <div className="text-sm font-medium text-slate-900 group-hover:text-slate-700">
                    GDPR Enabled
                  </div>
                  <div className="text-xs text-slate-500">
                    Enable General Data Protection Regulation compliance for EU customers
                  </div>
                </div>
              </label>
            </div>

            {/* TRAI Announcement */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={traiAnnouncementEnabled}
                  onChange={(e) => setTraiAnnouncementEnabled(e.target.checked)}
                  className="w-5 h-5 text-slate-900 focus:ring-slate-900 rounded"
                />
                <div>
                  <div className="text-sm font-medium text-slate-900 group-hover:text-slate-700">
                    India TRAI Mandatory Announcement
                  </div>
                  <div className="text-xs text-slate-500">
                    Play mandatory announcement before call recording (India TRAI requirement)
                  </div>
                </div>
              </label>

              {traiAnnouncementEnabled && (
                <div className="ml-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Announcement Audio
                  </label>
                  {traiAnnouncementAudioUrl ? (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 flex items-center gap-2 text-sm text-slate-700">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Audio file uploaded
                      </div>
                      <button
                        onClick={() => setTraiAnnouncementAudioUrl("")}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="block">
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleTraiAudioUpload}
                        disabled={isUploading}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4
                                   file:rounded-md file:border-0 file:text-sm file:font-medium
                                   file:bg-slate-900 file:text-white hover:file:bg-slate-800
                                   file:cursor-pointer disabled:opacity-50"
                      />
                    </label>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* DNC List */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">DNC List</h2>
            <p className="text-sm text-slate-600 mt-1">
              Manage Do Not Call registry to block outbound calls
            </p>
          </div>
          
          <div className="px-6 py-6 space-y-4">
            
            {/* Upload & Add Buttons */}
            <div className="flex gap-3">
              <label className="inline-flex items-center px-4 py-2 bg-slate-900 text-white text-sm font-medium 
                               rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleDNCUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => setShowAddNumberModal(true)}
                className="inline-flex items-center px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium 
                           rounded-lg hover:bg-slate-50 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Number
              </button>
            </div>

            {/* DNC List Table */}
            {dncLoading ? (
              <div className="text-center py-8 text-slate-500">Loading DNC list...</div>
            ) : dncList.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <p className="mt-4 text-sm text-slate-500">No numbers in DNC list</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                          Phone Number
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                          Added
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                          Notes
                        </th>
                        <th className="relative px-4 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {dncList.map(
                        /**
                         * @param {DNCNumber} entry
                         */
                        (entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">
                            {entry.number}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {new Date(entry.addedAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {entry.notes || "—"}
                          </td>
                          <td className="px-4 py-3 text-right text-sm">
                            <button
                              onClick={() => handleDeleteDNCNumber(entry.id, entry.number)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Data Handling */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Data Handling</h2>
            <p className="text-sm text-slate-600 mt-1">
              Configure data storage and processing policies
            </p>
          </div>
          
          <div className="px-6 py-6 space-y-6">
            
            {/* Storage Region */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Storage Region
              </label>
              <select
                value={storageRegion}
                onChange={(e) => setStorageRegion(/** @type {StorageRegion} */ (e.target.value))}
                className="w-full max-w-md px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900
                           focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {STORAGE_REGIONS.map(
                  /**
                   * @param {{value: StorageRegion, label: string}} region
                   */
                  (region) => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Select the geographic region where call data will be stored
              </p>
            </div>

            {/* Recording Redaction */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Recording Redaction
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setRecordingRedaction("enabled")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    recordingRedaction === "enabled"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Enabled
                </button>
                <button
                  onClick={() => setRecordingRedaction("disabled")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    recordingRedaction === "disabled"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Disabled
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Automatically redact sensitive information from call recordings
              </p>
            </div>

          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSavePolicies}
            disabled={isSaving}
            className="px-6 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg 
                       hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save Compliance Settings"}
          </button>
        </div>

      </div>

      {/* Add DNC Number Modal */}
      {showAddNumberModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
              onClick={() => setShowAddNumberModal(false)}
            />

            {/* Modal */}
            <div className="relative">
              <DNCNumberForm
                onClose={() => setShowAddNumberModal(false)}
                onSuccess={() => {/* Refresh DNC list */}}
              />
            </div>

          </div>
        </div>
      )}

    </div>
  );
}