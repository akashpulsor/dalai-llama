// src/pages/admin/RoutingRules/RoutingRulesPage.jsx

/**
 * @file Complete Routing Rules Management System
 * 
 * Enterprise SaaS interface for managing call routing rules with full type safety.
 * Includes type definitions, main page component, and form modal component.
 */

import React, { useState } from "react";

import {
  useGetRoutingRulesQuery,
  useDeleteRoutingRuleMutation,
  useAddRoutingRuleMutation,
  useUpdateRoutingRuleMutation,
  useGetQueuesQuery,
  useGetBotsQuery,
  useGetIvrsQuery
} from "@dalaillama/shared-store";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Field options available for routing conditions
 * @typedef {"Caller ID" | "Time"} FieldOption
 */

/**
 * Comparison operators for routing conditions
 * @typedef {"equals" | "contains" | "between"} OperatorType
 */

/**
 * Types of destinations a call can be routed to
 * @typedef {"Queue" | "IVR" | "Bot"} DestinationType
 */

/**
 * Logical operators to combine multiple conditions
 * @typedef {"AND" | "OR"} CombineType
 */

/**
 * Fallback actions when primary routing fails
 * @typedef {"Queue" | "IVR" | "End Call"} FallbackType
 */

/**
 * Form mode for the routing rule form
 * @typedef {"add" | "edit"} FormMode
 */

/**
 * A single condition in a routing rule
 * @typedef {Object} RoutingRuleCondition
 * @property {FieldOption} field - The field to evaluate
 * @property {OperatorType} operator - The comparison operator
 * @property {string} value - The value to compare against
 */

/**
 * Reference to an entity (Queue, IVR, or Bot)
 * @typedef {Object} EntityReference
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 */

/**
 * Complete routing rule definition
 * @typedef {Object} RoutingRule
 * @property {string} id - Unique identifier
 * @property {string} name - Human-readable name
 * @property {RoutingRuleCondition[]} conditions - Array of conditions
 * @property {CombineType} combine - How to combine conditions
 * @property {DestinationType} destinationType - Type of destination
 * @property {string} destination - Name/ID of destination
 * @property {FallbackType} [fallback] - Optional fallback action
 */

/**
 * Props for the RoutingRuleForm component
 * @typedef {Object} RoutingRuleFormProps
 * @property {FormMode} mode - Add or edit mode
 * @property {RoutingRule | null} rule - Rule to edit (null when adding)
 * @property {() => void} onClose - Close callback
 */

// ============================================================================
// ROUTING RULE FORM COMPONENT
// ============================================================================

const FIELD_OPTIONS = /** @type {readonly FieldOption[]} */ (["Caller ID", "Time"]);
const OPERATORS = /** @type {readonly OperatorType[]} */ (["equals", "contains", "between"]);
const DEST_TYPES = /** @type {readonly DestinationType[]} */ (["Queue", "IVR", "Bot"]);
const COMBINE = /** @type {readonly CombineType[]} */ (["AND", "OR"]);
const FALLBACKS = /** @type {readonly FallbackType[]} */ (["Queue", "IVR", "End Call"]);

/**
 * Routing Rule Form Component
 * 
 * Enterprise SaaS form for creating and editing routing rules
 * 
 * @param {RoutingRuleFormProps} props
 * @returns {React.ReactElement}
 */
function RoutingRuleForm({ mode, rule, onClose }) {
  const isEdit = mode === "edit";

  // Mutations
  const [addRule] = useAddRoutingRuleMutation();
  const [updateRule] = useUpdateRoutingRuleMutation();

  // Data queries
  /** @type {{data: EntityReference[], isLoading: boolean}} */
  const { data: queues = [], isLoading: queuesLoading } = useGetQueuesQuery(undefined);
  
  /** @type {{data: EntityReference[], isLoading: boolean}} */
  const { data: bots = [], isLoading: botsLoading } = useGetBotsQuery(undefined);
  
  /** @type {{data: EntityReference[], isLoading: boolean}} */
  const { data: ivrs = [], isLoading: ivrsLoading } = useGetIvrsQuery(undefined);

  // Form state
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [name, setName] = useState(rule?.name ?? "");

  /** @type {[RoutingRuleCondition[], React.Dispatch<React.SetStateAction<RoutingRuleCondition[]>>]} */
  const [conditions, setConditions] = useState(
    rule?.conditions ?? /** @type {RoutingRuleCondition[]} */ ([{ field: "Caller ID", operator: "equals", value: "" }])
  );

  /** @type {[CombineType, React.Dispatch<React.SetStateAction<CombineType>>]} */
  const [combine, setCombine] = useState(rule?.combine ?? /** @type {CombineType} */ ("AND"));

  /** @type {[DestinationType, React.Dispatch<React.SetStateAction<DestinationType>>]} */
  const [destinationType, setDestinationType] = useState(
    rule?.destinationType ?? /** @type {DestinationType} */ ("Queue")
  );

  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
  const [destination, setDestination] = useState(rule?.destination ?? "");

  /** @type {[FallbackType, React.Dispatch<React.SetStateAction<FallbackType>>]} */
  const [fallback, setFallback] = useState(rule?.fallback ?? /** @type {FallbackType} */ ("End Call"));

  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Adds a new condition
   * @returns {void}
   */
  const addCondition = () => {
    setConditions(
      /**
       * @param {RoutingRuleCondition[]} prev
       * @returns {RoutingRuleCondition[]}
       */
      (prev) => [
        ...prev,
        /** @type {RoutingRuleCondition} */ ({ field: "Caller ID", operator: "equals", value: "" })
      ]
    );
  };

  /**
   * Removes a condition at index
   * @param {number} index - Index of condition to remove
   * @returns {void}
   */
  const removeCondition = (index) => {
    setConditions(
      /**
       * @param {RoutingRuleCondition[]} prev
       * @returns {RoutingRuleCondition[]}
       */
      (prev) => prev.filter((_, i) => i !== index)
    );
  };

  /**
   * Updates a condition field
   * @param {number} index - Index of condition to update
   * @param {"field" | "operator" | "value"} key - Field name to update
   * @param {string} value - New value for the field
   * @returns {void}
   */
  const updateCondition = (index, key, value) => {
    setConditions(
      /**
       * @param {RoutingRuleCondition[]} prev
       * @returns {RoutingRuleCondition[]}
       */
      (prev) =>
        prev.map((condition, idx) => {
          if (idx !== index) return condition;
          
          // Type-safe field updates
          if (key === "field") {
            return { ...condition, field: /** @type {FieldOption} */ (value) };
          } else if (key === "operator") {
            return { ...condition, operator: /** @type {OperatorType} */ (value) };
          } else {
            return { ...condition, value };
          }
        })
    );
  };

  /**
   * Validates form data
   * @returns {boolean} True if validation passes
   */
  const validateForm = () => {
    if (!name.trim()) {
      alert("Rule name is required");
      return false;
    }

    if (conditions.length === 0) {
      alert("At least one condition is required");
      return false;
    }

    /** @type {RoutingRuleCondition} */
    let condition;
    for (condition of conditions) {
      if (!condition.value.trim()) {
        alert("All condition values must be filled");
        return false;
      }
    }

    if (!destination) {
      alert("Please select a destination");
      return false;
    }

    return true;
  };

  /**
   * Handles form submission
   * @returns {Promise<void>}
   */
  const handleSave = async () => {
    if (!validateForm()) return;
    if (isEdit && rule === null) return;

    setIsSaving(true);

    try {
      /** @type {Omit<RoutingRule, 'id'>} */
      const payload = {
        name: name.trim(),
        conditions: conditions,
        combine: combine,
        destinationType: destinationType,
        destination: destination,
        fallback: fallback
      };

      if (isEdit && rule !== null) {
        await updateRule({ id: rule.id, ...payload }).unwrap();
      } else {
        await addRule(payload).unwrap();
      }

      onClose();
    } catch (error) {
      console.error("Failed to save routing rule:", error);
      alert("Failed to save routing rule. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Gets destination options based on type
   * @returns {EntityReference[]}
   */
  const getDestinationOptions = () => {
    switch (destinationType) {
      case "Queue":
        return queues;
      case "IVR":
        return ivrs;
      case "Bot":
        return bots;
      default:
        return [];
    }
  };

  /**
   * Checks if destination is loading
   * @returns {boolean}
   */
  const isDestinationLoading = () => {
    switch (destinationType) {
      case "Queue":
        return queuesLoading;
      case "IVR":
        return ivrsLoading;
      case "Bot":
        return botsLoading;
      default:
        return false;
    }
  };

  return (
    <div className="bg-white">
      
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? "Edit Routing Rule" : "Add Routing Rule"}
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

        {/* Rule Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Rule Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., VIP Caller Rule"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900
                       placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 
                       focus:border-transparent transition-shadow"
          />
        </div>

        {/* IF Conditions */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            IF Conditions
          </label>
          
          <div className="space-y-3">
            {conditions.map((condition, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 bg-slate-50 rounded-md border border-slate-200"
              >
                {/* Field */}
                <select
                  value={condition.field}
                  onChange={(e) => updateCondition(index, "field", /** @type {FieldOption} */ (e.target.value))}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900
                             focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent
                             bg-white transition-shadow"
                >
                  {FIELD_OPTIONS.map((field) => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>

                {/* Operator */}
                <select
                  value={condition.operator}
                  onChange={(e) => updateCondition(index, "operator", /** @type {OperatorType} */ (e.target.value))}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900
                             focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent
                             bg-white capitalize transition-shadow"
                >
                  {OPERATORS.map((operator) => (
                    <option key={operator} value={operator}>{operator}</option>
                  ))}
                </select>

                {/* Value */}
                <input
                  type="text"
                  value={condition.value}
                  onChange={(e) => updateCondition(index, "value", e.target.value)}
                  placeholder="e.g., +1 202..."
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900
                             placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 
                             focus:border-transparent transition-shadow"
                />

                {/* Remove button */}
                {conditions.length > 1 && (
                  <button
                    onClick={() => removeCondition(index)}
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                    title="Remove condition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}

            {/* Add Condition Button */}
            <button
              onClick={addCondition}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 
                         hover:text-slate-900 transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Condition
            </button>

            {/* Combine Logic */}
            {conditions.length > 1 && (
              <div className="flex items-center gap-3 pt-2">
                <span className="text-sm text-slate-600">Combine With:</span>
                <select
                  value={combine}
                  onChange={(e) => setCombine(/** @type {CombineType} */ (e.target.value))}
                  className="px-3 py-1.5 border border-slate-300 rounded-md text-sm text-slate-900
                             focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent
                             bg-white transition-shadow"
                >
                  {COMBINE.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Action - Route To */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Action
          </label>
          
          <div className="space-y-3">
            {/* Destination Type - Radio style */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 mr-2">Route To:</span>
              {DEST_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setDestinationType(type);
                    setDestination("");
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    destinationType === type
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Destination Selector */}
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              disabled={isDestinationLoading()}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900
                         focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent
                         bg-white disabled:bg-slate-100 disabled:cursor-not-allowed transition-shadow"
            >
              <option value="">
                {isDestinationLoading() 
                  ? `Loading ${destinationType}s...` 
                  : `Select ${destinationType}`}
              </option>
              {getDestinationOptions().map((entity) => (
                <option key={entity.id} value={entity.name}>
                  {entity.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Fallback */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Fallback
          </label>
          <select
            value={fallback}
            onChange={(e) => setFallback(/** @type {FallbackType} */ (e.target.value))}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900
                       focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent
                       bg-white transition-shadow"
          >
            {FALLBACKS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Action to take if the primary destination is unavailable
          </p>
        </div>

      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 
                     rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 
                     focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md 
                     hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 
                     focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors inline-flex items-center"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </>
          ) : (
            "Save"
          )}
        </button>
      </div>

    </div>
  );
}

// ============================================================================
// ROUTING RULES PAGE COMPONENT
// ============================================================================

/**
 * Routing Rules Management Page
 * 
 * Enterprise SaaS interface for managing call routing rules with table view
 * 
 * @returns {React.ReactElement}
 */
export default function RoutingRulesPage() {
  /** @type {{data: RoutingRule[], isLoading: boolean}} */
  const { data: rules = [], isLoading } = useGetRoutingRulesQuery(undefined);
  
  const [deleteRule] = useDeleteRoutingRuleMutation();

  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [showForm, setShowForm] = useState(false);

  /** @type {[FormMode, React.Dispatch<React.SetStateAction<FormMode>>]} */
  const [formMode, setFormMode] = useState(/** @type {FormMode} */ ("add"));

  /** @type {[RoutingRule | null, React.Dispatch<React.SetStateAction<RoutingRule | null>>]} */
  const [selectedRule, setSelectedRule] = useState(/** @type {RoutingRule | null} */ (null));

  /**
   * Opens the form in add mode
   * @returns {void}
   */
  const handleAddRule = () => {
    setFormMode("add");
    setSelectedRule(null);
    setShowForm(true);
  };

  /**
   * Opens the form in edit mode with selected rule
   * @param {RoutingRule} rule - Rule to edit
   * @returns {void}
   */
  const handleEditRule = (rule) => {
    setFormMode("edit");
    setSelectedRule(rule);
    setShowForm(true);
  };

  /**
   * Handles rule deletion with confirmation
   * @param {string} ruleId - ID of rule to delete
   * @param {string} ruleName - Name of rule for confirmation
   * @returns {Promise<void>}
   */
  const handleDeleteRule = async (ruleId, ruleName) => {
    if (window.confirm(`Are you sure you want to delete "${ruleName}"?`)) {
      try {
        await deleteRule(ruleId).unwrap();
      } catch (error) {
        console.error("Failed to delete rule:", error);
        alert("Failed to delete rule. Please try again.");
      }
    }
  };

  /**
   * Closes the form
   * @returns {void}
   */
  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedRule(null);
  };

  /**
   * Formats conditions for display in table
   * @param {RoutingRuleCondition[]} conditions - Array of conditions
   * @param {CombineType} combine - Logical operator to combine conditions
   * @returns {string} Formatted condition string
   */
  const formatConditions = (conditions, combine) => {
    if (conditions.length === 0) return "—";
    if (conditions.length === 1) {
      const c = conditions[0];
      return `${c.field} ${c.operator} ${c.value}`;
    }
    return `${conditions.length} conditions (${combine})`;
  };

  /**
   * Formats destination for display
   * @param {DestinationType} type - Destination type
   * @param {string} destination - Destination name
   * @returns {string} Formatted destination string
   */
  const formatDestination = (type, destination) => {
    return `${type}: ${destination}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-slate-600">Loading routing rules...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Routing Rules
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Manage call routing conditions and destinations
              </p>
            </div>
            <button
              onClick={handleAddRule}
              className="inline-flex items-center px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg
                         hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2
                         transition-colors duration-150"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Rule
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Table Card */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          
          {rules.length === 0 ? (
            // Empty State
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-4 text-sm font-medium text-slate-900">No routing rules</h3>
              <p className="mt-1 text-sm text-slate-500">Get started by creating a new routing rule.</p>
              <button
                onClick={handleAddRule}
                className="mt-6 inline-flex items-center px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg
                           hover:bg-slate-800 transition-colors duration-150"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create First Rule
              </button>
            </div>
          ) : (
            // Rules Table
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Rule Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Condition
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Destination
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Fallback
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{rule.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-700">
                          {formatConditions(rule.conditions, rule.combine)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-700">
                          {formatDestination(rule.destinationType, rule.destination)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600">
                          {rule.fallback || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditRule(rule)}
                          className="text-slate-600 hover:text-slate-900 mr-4 transition-colors duration-150"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id, rule.name)}
                          className="text-red-600 hover:text-red-900 transition-colors duration-150"
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

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
              onClick={handleCloseForm}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <RoutingRuleForm
                mode={formMode}
                rule={selectedRule}
                onClose={handleCloseForm}
              />
            </div>

          </div>
        </div>
      )}

    </div>
  );
}