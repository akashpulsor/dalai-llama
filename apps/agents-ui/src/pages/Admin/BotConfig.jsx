// src/pages/Admin/BotConfig.jsx
/**
 * @fileoverview Voice Bot Configuration - AI-powered voice bot campaign management
 * Configure OpenAI and ElevenLabs voice bots with DID assignment and campaign setup
 * @module BotConfig
 */

import React, { useState, useMemo } from "react";
import {
  Bot,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Play,
  Pause,
  Phone,
  MessageSquare,
  Activity,
  TrendingUp,
  Clock,
  AlertCircle,
  X,
  Save,
  Volume2,
  RefreshCw,
} from "lucide-react";

/**
 * @typedef {'openai' | 'elevenlabs'} VoiceProvider
 */

/**
 * @typedef {'active' | 'paused' | 'draft' | 'archived'} CampaignStatus
 */

/**
 * @typedef {'inbound' | 'outbound' | 'both'} CallDirection
 */

/**
 * @typedef {Object} DIDAssignment
 * @property {string} did - Phone number (DID)
 * @property {string} campaignId - Associated campaign ID
 * @property {string} campaignName - Campaign name
 * @property {boolean} isActive - Whether DID is active
 */

/**
 * @typedef {Object} VoiceBot
 * @property {string} id - Unique bot identifier
 * @property {string} name - Bot name
 * @property {string} campaign - Campaign name
 * @property {VoiceProvider} provider - Voice provider (OpenAI/ElevenLabs)
 * @property {string} voiceId - Voice model ID
 * @property {string} voiceName - Human-readable voice name
 * @property {CampaignStatus} status - Campaign status
 * @property {CallDirection} direction - Call direction
 * @property {string} systemPrompt - Bot system instructions
 * @property {string} welcomeMessage - Initial greeting
 * @property {number} maxDuration - Max call duration in seconds
 * @property {boolean} recordCalls - Enable call recording
 * @property {string} language - Language code
 * @property {number} callsHandled - Total calls handled
 * @property {number} avgDuration - Average call duration
 * @property {number} successRate - Success rate percentage
 * @property {string} createdAt - Creation date
 * @property {string} lastModified - Last modification date
 */

/**
 * @typedef {Object} VoiceOption
 * @property {string} id - Voice ID
 * @property {string} name - Voice name
 * @property {string} accent - Voice accent
 * @property {string} gender - Voice gender
 * @property {VoiceProvider} provider - Voice provider
 */

/**
 * @typedef {Object} LanguageOption
 * @property {string} code - Language code
 * @property {string} name - Language name
 */

/**
 * @typedef {Object} FilterState
 * @property {string} status
 * @property {string} provider
 * @property {string} direction
 */

/**
 * @typedef {Object} StatusConfig
 * @property {string} bg
 * @property {string} text
 * @property {string} border
 * @property {string} dot
 * @property {string} label
 */

/**
 * @typedef {Object} ProviderConfig
 * @property {string} name
 * @property {string} color
 * @property {string} bg
 */

/**
 * @typedef {Object} Statistics
 * @property {number} total
 * @property {number} active
 * @property {number} totalCalls
 * @property {string} avgSuccess
 * @property {number} totalDIDs
 * @property {number} activeDIDs
 */

/**
 * Mock voice bot data
 * @type {VoiceBot[]}
 */
const INITIAL_BOTS = [
  {
    id: "BOT-001",
    name: "Sales Assistant",
    campaign: "Outbound Sales Campaign Q4",
    provider: "openai",
    voiceId: "alloy",
    voiceName: "Alloy (Professional Male)",
    status: "active",
    direction: "outbound",
    systemPrompt: "You are a professional sales assistant helping customers understand our product offerings.",
    welcomeMessage: "Hello! Thank you for your interest in our services. How can I assist you today?",
    maxDuration: 600,
    recordCalls: true,
    language: "en-US",
    callsHandled: 1247,
    avgDuration: 342,
    successRate: 87,
    createdAt: "2024-11-15",
    lastModified: "2024-12-10",
  },
  {
    id: "BOT-002",
    name: "Customer Support",
    campaign: "24/7 Support Hotline",
    provider: "elevenlabs",
    voiceId: "rachel",
    voiceName: "Rachel (Friendly Female)",
    status: "active",
    direction: "inbound",
    systemPrompt: "You are a helpful customer support agent. Answer questions about account issues and billing.",
    welcomeMessage: "Welcome to customer support! I can help with account questions and technical issues.",
    maxDuration: 900,
    recordCalls: true,
    language: "en-US",
    callsHandled: 3421,
    avgDuration: 285,
    successRate: 92,
    createdAt: "2024-10-20",
    lastModified: "2024-12-09",
  },
  {
    id: "BOT-003",
    name: "Appointment Scheduler",
    campaign: "Medical Appointments",
    provider: "openai",
    voiceId: "nova",
    voiceName: "Nova (Warm Female)",
    status: "paused",
    direction: "both",
    systemPrompt: "You help patients schedule, reschedule, or cancel medical appointments.",
    welcomeMessage: "Hi! I can help you schedule or manage your medical appointments.",
    maxDuration: 480,
    recordCalls: true,
    language: "en-US",
    callsHandled: 892,
    avgDuration: 198,
    successRate: 95,
    createdAt: "2024-09-10",
    lastModified: "2024-11-28",
  },
];

/**
 * Mock DID assignments - Each DID is assigned to ONE campaign
 * @type {DIDAssignment[]}
 */
const INITIAL_DID_ASSIGNMENTS = [
  { did: "+1-800-SALES-01", campaignId: "BOT-001", campaignName: "Outbound Sales Campaign Q4", isActive: true },
  { did: "+1-800-SALES-02", campaignId: "BOT-001", campaignName: "Outbound Sales Campaign Q4", isActive: true },
  { did: "+1-800-SUPPORT", campaignId: "BOT-002", campaignName: "24/7 Support Hotline", isActive: true },
  { did: "+1-800-APPOINT", campaignId: "BOT-003", campaignName: "Medical Appointments", isActive: false },
];

/**
 * Available voice options
 * @type {VoiceOption[]}
 */
const VOICE_OPTIONS = [
  { id: "alloy", name: "Alloy", accent: "Neutral", gender: "Male", provider: "openai" },
  { id: "echo", name: "Echo", accent: "Neutral", gender: "Male", provider: "openai" },
  { id: "fable", name: "Fable", accent: "British", gender: "Male", provider: "openai" },
  { id: "onyx", name: "Onyx", accent: "Deep", gender: "Male", provider: "openai" },
  { id: "nova", name: "Nova", accent: "Warm", gender: "Female", provider: "openai" },
  { id: "shimmer", name: "Shimmer", accent: "Soft", gender: "Female", provider: "openai" },
  { id: "rachel", name: "Rachel", accent: "American", gender: "Female", provider: "elevenlabs" },
  { id: "domi", name: "Domi", accent: "American", gender: "Female", provider: "elevenlabs" },
  { id: "bella", name: "Bella", accent: "American", gender: "Female", provider: "elevenlabs" },
  { id: "antoni", name: "Antoni", accent: "American", gender: "Male", provider: "elevenlabs" },
  { id: "josh", name: "Josh", accent: "American", gender: "Male", provider: "elevenlabs" },
];

/**
 * Available languages
 * @type {LanguageOption[]}
 */
const AVAILABLE_LANGUAGES = [
  { code: "en-US", name: "English (US)" },
  { code: "en-GB", name: "English (UK)" },
  { code: "es-ES", name: "Spanish" },
  { code: "fr-FR", name: "French" },
  { code: "de-DE", name: "German" },
  { code: "it-IT", name: "Italian" },
  { code: "pt-BR", name: "Portuguese" },
  { code: "hi-IN", name: "Hindi" },
];

/**
 * Form Input Component
 * @param {Object} props
 * @param {string} props.label
 * @param {string} props.value
 * @param {(value: string) => void} props.onChange
 * @param {string} [props.placeholder]
 * @param {string} [props.type]
 * @param {boolean} [props.required]
 * @returns {React.ReactElement}
 */
const FormInput = ({ label, value, onChange, placeholder = "", type = "text", required = false }) => (
  <div>
    <label className="block text-sm font-bold text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none font-medium"
    />
  </div>
);

/**
 * Form Select Component
 * @param {Object} props
 * @param {string} props.label
 * @param {string} props.value
 * @param {(value: string) => void} props.onChange
 * @param {Array<{value: string, label: string}>} props.options
 * @returns {React.ReactElement}
 */
const FormSelect = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none font-medium"
    >
      <option value="">Select {label}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

/**
 * Stat Card Component
 * @param {Object} props
 * @param {React.ReactNode} props.icon
 * @param {string} props.label
 * @param {string} props.value
 * @param {string} props.color
 * @returns {React.ReactElement}
 */
const StatCard = ({ icon, label, value, color }) => {
  /** @type {Record<string, string>} */
  const colorConfig = {
    purple: "from-purple-500 to-purple-600",
    green: "from-green-500 to-green-600",
    blue: "from-blue-500 to-blue-600",
    amber: "from-amber-400 to-amber-500",
  };

  return (
    <div className="bg-white rounded-xl border-2 border-purple-200 p-5 shadow-sm hover:shadow-md transition-all">
      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorConfig[color]} flex items-center justify-center text-white mb-3 shadow-md`}>
        {icon}
      </div>
      <p className="text-3xl font-extrabold text-gray-800 mb-1">{value}</p>
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</p>
    </div>
  );
};

/**
 * Filter Select Component
 * @param {Object} props
 * @param {string} props.label
 * @param {string} props.value
 * @param {(value: string) => void} props.onChange
 * @param {Array<{value: string, label: string}>} props.options
 * @returns {React.ReactElement}
 */
const FilterSelect = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-400 focus:outline-none bg-white font-medium"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

/**
 * Bot Card Component
 * @param {Object} props
 * @param {VoiceBot} props.bot
 * @param {DIDAssignment[]} props.assignedDIDs
 * @param {() => void} props.onEdit
 * @param {() => void} props.onDelete
 * @param {() => void} props.onToggleStatus
 * @param {() => void} props.onManageDIDs
 * @param {() => void} props.onTest
 * @param {(status: CampaignStatus) => StatusConfig} props.getStatusConfig
 * @param {(provider: VoiceProvider) => ProviderConfig} props.getProviderConfig
 * @returns {React.ReactElement}
 */
const BotCard = ({ bot, assignedDIDs, onEdit, onDelete, onToggleStatus, onManageDIDs, onTest, getStatusConfig, getProviderConfig }) => {
  const statusConfig = getStatusConfig(bot.status);
  const providerConfig = getProviderConfig(bot.provider);

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-purple-200/50 p-6 hover:shadow-2xl transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${providerConfig.bg} flex items-center justify-center shadow-md`}>
            <Bot size={24} className={providerConfig.color} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">{bot.name}</h3>
            <p className="text-sm text-gray-600">{bot.campaign}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleStatus}
            className={`p-2 rounded-lg transition-all ${
              bot.status === "active" ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}
            title={bot.status === "active" ? "Pause" : "Activate"}
          >
            {bot.status === "active" ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button onClick={onEdit} className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all" title="Edit">
            <Edit size={18} />
          </button>
          <button onClick={onDelete} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all" title="Delete">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Status & Provider */}
      <div className="flex items-center gap-3 mb-4">
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
          <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
          {statusConfig.label}
        </span>
        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${providerConfig.bg} ${providerConfig.color}`}>
          {providerConfig.name}
        </span>
        <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">
          {bot.direction.toUpperCase()}
        </span>
      </div>

      {/* DIDs */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Assigned DIDs ({assignedDIDs.length})</p>
          <button
            onClick={onManageDIDs}
            className="text-xs font-bold text-purple-600 hover:text-purple-700 transition-all"
          >
            Manage DIDs
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {assignedDIDs.slice(0, 3).map((assignment) => (
            <span key={assignment.did} className={`px-3 py-1 rounded-lg text-sm font-semibold flex items-center gap-2 ${
              assignment.isActive ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
            }`}>
              <Phone size={12} />
              {assignment.did}
            </span>
          ))}
          {assignedDIDs.length > 3 && (
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold">
              +{assignedDIDs.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Voice Info */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm">
          <Volume2 size={16} className="text-purple-500" />
          <span className="font-semibold text-gray-700">{bot.voiceName}</span>
        </div>
        <div className="flex items-center gap-2 text-sm mt-1">
          <MessageSquare size={16} className="text-purple-500" />
          <span className="text-gray-600">{bot.language}</span>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 text-center">
          <Phone size={16} className="text-blue-600 mx-auto mb-1" />
          <p className="text-xl font-extrabold text-gray-800">{bot.callsHandled}</p>
          <p className="text-xs font-semibold text-gray-600">Calls</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 text-center">
          <Clock size={16} className="text-purple-600 mx-auto mb-1" />
          <p className="text-xl font-extrabold text-gray-800">{Math.floor(bot.avgDuration / 60)}m</p>
          <p className="text-xs font-semibold text-gray-600">Avg Duration</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 text-center">
          <TrendingUp size={16} className="text-green-600 mx-auto mb-1" />
          <p className="text-xl font-extrabold text-gray-800">{bot.successRate}%</p>
          <p className="text-xs font-semibold text-gray-600">Success</p>
        </div>
      </div>

      {/* Actions */}
      <button
        onClick={onTest}
        className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white 
                 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all 
                 font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
      >
        <Play size={18} />
        Test Bot
      </button>
    </div>
  );
};

/**
 * Bot Form Modal Component
 * @param {Object} props
 * @param {string} props.title
 * @param {VoiceBot} props.bot
 * @param {React.Dispatch<React.SetStateAction<VoiceBot>>} props.setBot
 * @param {() => void} props.onSave
 * @param {() => void} props.onClose
 * @param {VoiceOption[]} props.voiceOptions
 * @param {LanguageOption[]} props.languages
 * @param {boolean} props.isEdit
 * @returns {React.ReactElement}
 */
const BotFormModal = ({ title, bot, setBot, onSave, onClose, voiceOptions, languages, isEdit }) => {
  const filteredVoices = voiceOptions.filter((v) => v.provider === bot.provider);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xl flex items-center justify-center">
                <Bot size={24} />
              </div>
              <h2 className="text-2xl font-extrabold">{title}</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-all">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <FormInput 
              label="Bot Name" 
              value={bot.name} 
              onChange={(value) => setBot({ ...bot, name: value })} 
              placeholder="Sales Assistant" 
              required 
            />
            <FormInput 
              label="Campaign Name" 
              value={bot.campaign} 
              onChange={(value) => setBot({ ...bot, campaign: value })} 
              placeholder="Q4 Sales Campaign" 
              required 
            />
          </div>

          {/* Provider & Voice */}
          <div className="grid grid-cols-3 gap-4">
            <FormSelect
              label="Voice Provider"
              value={bot.provider}
              onChange={(value) => {
                setBot({ ...bot, provider: /** @type {VoiceProvider} */ (value), voiceId: "", voiceName: "" });
              }}
              options={[
                { value: "openai", label: "OpenAI" },
                { value: "elevenlabs", label: "ElevenLabs" },
              ]}
            />
            <FormSelect
              label="Voice"
              value={bot.voiceId}
              onChange={(value) => {
                const voice = filteredVoices.find((v) => v.id === value);
                setBot({
                  ...bot,
                  voiceId: value,
                  voiceName: voice ? `${voice.name} (${voice.accent} ${voice.gender})` : "",
                });
              }}
              options={filteredVoices.map((v) => ({
                value: v.id,
                label: `${v.name} (${v.accent} ${v.gender})`,
              }))}
            />
            <FormSelect
              label="Language"
              value={bot.language}
              onChange={(value) => setBot({ ...bot, language: value })}
              options={languages.map((l) => ({ value: l.code, label: l.name }))}
            />
          </div>

          {/* Call Configuration */}
          <div className="grid grid-cols-3 gap-4">
            <FormSelect
              label="Call Direction"
              value={bot.direction}
              onChange={(value) => setBot({ ...bot, direction: /** @type {CallDirection} */ (value) })}
              options={[
                { value: "inbound", label: "Inbound Only" },
                { value: "outbound", label: "Outbound Only" },
                { value: "both", label: "Both Directions" },
              ]}
            />
            <FormInput
              label="Max Duration (seconds)"
              type="number"
              value={bot.maxDuration.toString()}
              onChange={(value) => setBot({ ...bot, maxDuration: parseInt(value) || 600 })}
            />
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bot.recordCalls}
                  onChange={(e) => setBot({ ...bot, recordCalls: e.target.checked })}
                  className="w-5 h-5 text-purple-600 rounded"
                />
                <span className="text-sm font-bold text-gray-700">Record Calls</span>
              </label>
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">System Prompt (Bot Instructions)</label>
            <textarea
              value={bot.systemPrompt}
              onChange={(e) => setBot({ ...bot, systemPrompt: e.target.value })}
              rows={4}
              placeholder="Define the bot's role, personality, and behavior..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none font-medium resize-none"
            />
          </div>

          {/* Welcome Message */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Welcome Message (First Response)</label>
            <textarea
              value={bot.welcomeMessage}
              onChange={(e) => setBot({ ...bot, welcomeMessage: e.target.value })}
              rows={3}
              placeholder="Hello! How can I help you today?"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none font-medium resize-none"
            />
          </div>

          {!isEdit && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800 font-semibold">
                <AlertCircle size={16} className="inline mr-2" />
                After creating the campaign, use the "Manage DIDs" button to assign phone numbers.
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!bot.name || !bot.campaign || !bot.voiceId}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save size={20} />
            {isEdit ? "Save Changes" : "Create Campaign"}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Delete Confirmation Modal
 * @param {Object} props
 * @param {VoiceBot} props.bot
 * @param {() => void} props.onConfirm
 * @param {() => void} props.onClose
 * @returns {React.ReactElement}
 */
const DeleteConfirmModal = ({ bot, onConfirm, onClose }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <AlertCircle size={32} className="text-red-600" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Delete Voice Bot?</h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <span className="font-bold">{bot.name}</span>? All associated DIDs will be unassigned.
        </p>
        <div className="flex items-center gap-3 w-full">
          <button 
            onClick={onClose} 
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-lg"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Test Bot Modal
 * @param {Object} props
 * @param {VoiceBot} props.bot
 * @param {() => void} props.onClose
 * @returns {React.ReactElement}
 */
const TestBotModal = ({ bot, onClose }) => {
  const [testPhone, setTestPhone] = useState("");

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white">
              <Play size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-gray-800">Test Voice Bot</h2>
              <p className="text-gray-600 text-sm">{bot.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200">
            <h3 className="font-bold text-purple-800 mb-3">Bot Configuration</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">Voice:</span> {bot.voiceName}</p>
              <p><span className="font-semibold">Language:</span> {bot.language}</p>
              <p><span className="font-semibold">Max Duration:</span> {Math.floor(bot.maxDuration / 60)} minutes</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Test Phone Number</label>
            <input
              type="tel"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="+1-555-123-4567"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none font-medium"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold"
            >
              Cancel
            </button>
            <button
              disabled={!testPhone}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Phone size={20} />
              Initiate Test Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * DID Management Modal
 * @param {Object} props
 * @param {VoiceBot} props.bot
 * @param {DIDAssignment[]} props.allDIDs
 * @param {DIDAssignment[]} props.assignedDIDs
 * @param {(did: string) => void} props.onAssignDID
 * @param {(did: string) => void} props.onUnassignDID
 * @param {(did: string) => void} props.onAddNewDID
 * @param {() => void} props.onClose
 * @returns {React.ReactElement}
 */
const DIDManagementModal = ({ bot, allDIDs, assignedDIDs, onAssignDID, onUnassignDID, onAddNewDID, onClose }) => {
  const [newDID, setNewDID] = useState("");
  
  // Get unassigned DIDs
  const unassignedDIDs = allDIDs.filter((did) => !did.campaignId || did.campaignId === "");

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xl flex items-center justify-center">
                <Phone size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold">Manage DIDs</h2>
                <p className="text-purple-100 text-sm">{bot.name} - {bot.campaign}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-all">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Add New DID */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200">
            <h3 className="font-bold text-purple-800 mb-3">Add New Phone Number</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newDID}
                onChange={(e) => setNewDID(e.target.value)}
                placeholder="+1-800-XXX-XXXX"
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none font-medium"
              />
              <button
                onClick={() => {
                  if (newDID.trim()) {
                    onAddNewDID(newDID);
                    setNewDID("");
                  }
                }}
                disabled={!newDID.trim()}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Plus size={20} />
                Add & Assign
              </button>
            </div>
          </div>

          {/* Currently Assigned DIDs */}
          <div>
            <h3 className="font-bold text-gray-800 mb-3">Currently Assigned to This Campaign ({assignedDIDs.length})</h3>
            {assignedDIDs.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-8 text-center">
                <Phone size={48} className="text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No DIDs assigned yet</p>
                <p className="text-sm text-gray-500 mt-1">Assign existing DIDs or add new ones below</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {assignedDIDs.map((assignment) => (
                  <div
                    key={assignment.did}
                    className="flex items-center justify-between p-4 bg-purple-50 border-2 border-purple-200 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <Phone size={20} className="text-purple-600" />
                      <div>
                        <p className="font-bold text-gray-800">{assignment.did}</p>
                        <p className="text-xs text-gray-600">
                          {assignment.isActive ? "✓ Active" : "○ Inactive"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onUnassignDID(assignment.did)}
                      className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all"
                      title="Unassign DID"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available DIDs to Assign */}
          <div>
            <h3 className="font-bold text-gray-800 mb-3">Available DIDs ({unassignedDIDs.length})</h3>
            {unassignedDIDs.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <p className="text-gray-600 font-medium">No unassigned DIDs available</p>
                <p className="text-sm text-gray-500 mt-1">Add a new DID above to assign it to this campaign</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {unassignedDIDs.map((didObj) => (
                  <div
                    key={didObj.did}
                    className="flex items-center justify-between p-4 bg-gray-50 border-2 border-gray-200 rounded-xl hover:border-purple-300 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Phone size={20} className="text-gray-600" />
                      <p className="font-bold text-gray-800">{didObj.did}</p>
                    </div>
                    <button
                      onClick={() => onAssignDID(didObj.did)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-semibold text-sm"
                    >
                      Assign
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Bot Configuration Component
 * @component
 * @returns {React.ReactElement}
 */
export default function BotConfig() {
  const [bots, setBots] = useState(/** @type {VoiceBot[]} */ (INITIAL_BOTS));
  const [didAssignments, setDidAssignments] = useState(/** @type {DIDAssignment[]} */ (INITIAL_DID_ASSIGNMENTS));
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showDIDModal, setShowDIDModal] = useState(false);
  const [selectedBot, setSelectedBot] = useState(/** @type {VoiceBot | null} */ (null));
  const [botToDelete, setBotToDelete] = useState(/** @type {VoiceBot | null} */ (null));
  const [botToTest, setBotToTest] = useState(/** @type {VoiceBot | null} */ (null));
  const [botForDIDManagement, setBotForDIDManagement] = useState(/** @type {VoiceBot | null} */ (null));

  const [filters, setFilters] = useState(/** @type {FilterState} */ ({
    status: "all",
    provider: "all",
    direction: "all",
  }));

  const [newBotForm, setNewBotForm] = useState(/** @type {VoiceBot} */ ({
    id: "",
    name: "",
    campaign: "",
    provider: "openai",
    voiceId: "",
    voiceName: "",
    status: "draft",
    direction: "inbound",
    systemPrompt: "",
    welcomeMessage: "",
    maxDuration: 600,
    recordCalls: true,
    language: "en-US",
    callsHandled: 0,
    avgDuration: 0,
    successRate: 0,
    createdAt: "",
    lastModified: "",
  }));

  /**
   * Filter bots based on search and filters
   * @returns {VoiceBot[]}
   */
  const filteredBots = useMemo(() => {
    return bots.filter((bot) => {
      const matchesSearch =
        searchTerm === "" ||
        bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bot.campaign.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bot.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filters.status === "all" || bot.status === filters.status;
      const matchesProvider = filters.provider === "all" || bot.provider === filters.provider;
      const matchesDirection = filters.direction === "all" || bot.direction === filters.direction;

      return matchesSearch && matchesStatus && matchesProvider && matchesDirection;
    });
  }, [bots, searchTerm, filters]);

  /**
   * Calculate statistics
   * @returns {Statistics}
   */
  const stats = useMemo(() => {
    const total = bots.length;
    const active = bots.filter((b) => b.status === "active").length;
    const totalCalls = bots.reduce((sum, b) => sum + b.callsHandled, 0);
    const avgSuccess = bots.reduce((sum, b) => sum + b.successRate, 0) / total || 0;
    const totalDIDs = didAssignments.length;
    const activeDIDs = didAssignments.filter((d) => d.isActive).length;

    return { total, active, totalCalls, avgSuccess: avgSuccess.toFixed(0), totalDIDs, activeDIDs };
  }, [bots, didAssignments]);

  /**
   * Get DIDs assigned to a specific bot
   * @param {string} botId
   * @returns {DIDAssignment[]}
   */
  const getDIDsForBot = (botId) => {
    return didAssignments.filter((assignment) => assignment.campaignId === botId);
  };

  /**
   * Handle add new bot
   * @returns {void}
   */
  const handleAddBot = () => {
    /** @type {VoiceBot} */
    const newBot = {
      id: `BOT-${String(bots.length + 1).padStart(3, "0")}`,
      name: newBotForm.name,
      campaign: newBotForm.campaign,
      provider: newBotForm.provider,
      voiceId: newBotForm.voiceId,
      voiceName: newBotForm.voiceName,
      status: newBotForm.status,
      direction: newBotForm.direction,
      systemPrompt: newBotForm.systemPrompt,
      welcomeMessage: newBotForm.welcomeMessage,
      maxDuration: newBotForm.maxDuration,
      recordCalls: newBotForm.recordCalls,
      language: newBotForm.language,
      callsHandled: 0,
      avgDuration: 0,
      successRate: 0,
      createdAt: new Date().toISOString().split("T")[0],
      lastModified: new Date().toISOString().split("T")[0],
    };

    setBots([...bots, newBot]);
    setShowAddModal(false);
    resetForm();
  };

  /**
   * Handle edit bot
   * @returns {void}
   */
  const handleEditBot = () => {
    if (!selectedBot) return;

    setBots(bots.map((bot) => (bot.id === selectedBot.id ? selectedBot : bot)));
    setShowEditModal(false);
    setSelectedBot(null);
  };

  /**
   * Handle delete bot
   * @returns {void}
   */
  const handleDeleteBot = () => {
    if (!botToDelete) return;

    // Remove bot
    setBots(bots.filter((bot) => bot.id !== botToDelete.id));
    
    // Unassign all DIDs
    setDidAssignments(didAssignments.map((assignment) => 
      assignment.campaignId === botToDelete.id 
        ? { ...assignment, campaignId: "", campaignName: "", isActive: false }
        : assignment
    ));

    setShowDeleteConfirm(false);
    setBotToDelete(null);
  };

  /**
   * Handle status toggle
   * @param {VoiceBot} bot
   * @returns {void}
   */
  const handleToggleStatus = (bot) => {
    const newStatus = bot.status === "active" ? "paused" : "active";
    setBots(bots.map((b) => (b.id === bot.id ? { ...b, status: /** @type {CampaignStatus} */ (newStatus) } : b)));
  };

  /**
   * Reset form to initial state
   * @returns {void}
   */
  const resetForm = () => {
    setNewBotForm({
      id: "",
      name: "",
      campaign: "",
      provider: "openai",
      voiceId: "",
      voiceName: "",
      status: "draft",
      direction: "inbound",
      systemPrompt: "",
      welcomeMessage: "",
      maxDuration: 600,
      recordCalls: true,
      language: "en-US",
      callsHandled: 0,
      avgDuration: 0,
      successRate: 0,
      createdAt: "",
      lastModified: "",
    });
  };

  /**
   * Get status configuration
   * @param {CampaignStatus} status
   * @returns {StatusConfig}
   */
  const getStatusConfig = (status) => {
    /** @type {Record<CampaignStatus, StatusConfig>} */
    const configs = {
      active: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500", label: "Active" },
      paused: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500", label: "Paused" },
      draft: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", dot: "bg-gray-400", label: "Draft" },
      archived: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500", label: "Archived" },
    };
    return configs[status];
  };

  /**
   * Get provider configuration
   * @param {VoiceProvider} provider
   * @returns {ProviderConfig}
   */
  const getProviderConfig = (provider) => {
    /** @type {Record<VoiceProvider, ProviderConfig>} */
    const configs = {
      openai: { name: "OpenAI", color: "text-green-600", bg: "bg-green-100" },
      elevenlabs: { name: "ElevenLabs", color: "text-purple-600", bg: "bg-purple-100" },
    };
    return configs[provider];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-purple-200/50 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 flex items-center gap-3 mb-2">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <Bot className="text-white" size={28} />
                </div>
                Voice Bot Configuration
              </h1>
              <p className="text-gray-600 font-medium">
                Configure AI-powered voice bots with DID assignment - Each DID maps to one campaign
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white 
                       rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all 
                       duration-200 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <Plus size={20} />
              Create New Bot
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-5 gap-4 mb-8">
            <StatCard icon={<Bot size={24} />} label="Total Campaigns" value={stats.total.toString()} color="purple" />
            <StatCard icon={<Activity size={24} />} label="Active Campaigns" value={stats.active.toString()} color="green" />
            <StatCard icon={<Phone size={24} />} label="Total DIDs" value={stats.totalDIDs.toString()} color="blue" />
            <StatCard icon={<Phone size={24} />} label="Active DIDs" value={stats.activeDIDs.toString()} color="amber" />
            <StatCard icon={<TrendingUp size={24} />} label="Avg Success" value={`${stats.avgSuccess}%`} color="green" />
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search campaigns by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-purple-200 rounded-xl 
                         focus:border-purple-400 focus:outline-none bg-white shadow-sm
                         transition-all duration-200 font-medium"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-4 rounded-xl font-semibold flex items-center gap-2 
                       transition-all duration-200 shadow-sm hover:shadow-md
                       ${showFilters ? "bg-purple-600 text-white" : "bg-white text-purple-700 border-2 border-purple-200"}`}
            >
              <Filter size={20} />
              Filters
            </button>

            <button className="p-4 bg-white border-2 border-purple-200 text-purple-700 rounded-xl hover:bg-purple-50 transition-all">
              <RefreshCw size={20} />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200">
              <div className="grid grid-cols-3 gap-4">
                <FilterSelect
                  label="Status"
                  value={filters.status}
                  onChange={(val) => setFilters({ ...filters, status: val })}
                  options={[
                    { value: "all", label: "All Statuses" },
                    { value: "active", label: "Active" },
                    { value: "paused", label: "Paused" },
                    { value: "draft", label: "Draft" },
                    { value: "archived", label: "Archived" },
                  ]}
                />
                <FilterSelect
                  label="Provider"
                  value={filters.provider}
                  onChange={(val) => setFilters({ ...filters, provider: val })}
                  options={[
                    { value: "all", label: "All Providers" },
                    { value: "openai", label: "OpenAI" },
                    { value: "elevenlabs", label: "ElevenLabs" },
                  ]}
                />
                <FilterSelect
                  label="Direction"
                  value={filters.direction}
                  onChange={(val) => setFilters({ ...filters, direction: val })}
                  options={[
                    { value: "all", label: "All Directions" },
                    { value: "inbound", label: "Inbound" },
                    { value: "outbound", label: "Outbound" },
                    { value: "both", label: "Both" },
                  ]}
                />
              </div>
            </div>
          )}
        </div>

        {/* Bot Cards */}
        <div className="grid grid-cols-2 gap-6">
          {filteredBots.map((bot) => (
            <BotCard
              key={bot.id}
              bot={bot}
              assignedDIDs={getDIDsForBot(bot.id)}
              onEdit={() => {
                setSelectedBot(bot);
                setShowEditModal(true);
              }}
              onDelete={() => {
                setBotToDelete(bot);
                setShowDeleteConfirm(true);
              }}
              onToggleStatus={() => handleToggleStatus(bot)}
              onManageDIDs={() => {
                setBotForDIDManagement(bot);
                setShowDIDModal(true);
              }}
              onTest={() => {
                setBotToTest(bot);
                setShowTestModal(true);
              }}
              getStatusConfig={getStatusConfig}
              getProviderConfig={getProviderConfig}
            />
          ))}
        </div>

        {/* Results Summary */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-purple-200/50 p-4">
          <p className="text-sm text-gray-600 font-medium text-center">
            Showing <span className="font-bold text-purple-700">{filteredBots.length}</span> of{" "}
            <span className="font-bold text-purple-700">{bots.length}</span> campaigns
          </p>
        </div>
      </div>

      {/* Add Bot Modal */}
      {showAddModal && (
        <BotFormModal
          title="Create New Voice Bot Campaign"
          bot={newBotForm}
          setBot={setNewBotForm}
          onSave={handleAddBot}
          onClose={() => {
            setShowAddModal(false);
            resetForm();
          }}
          voiceOptions={VOICE_OPTIONS}
          languages={AVAILABLE_LANGUAGES}
          isEdit={false}
        />
      )}

{/* Edit Bot Modal */}
      {showEditModal && selectedBot && (
        <BotFormModal
          title="Edit Voice Bot Campaign"
          bot={selectedBot}
          setBot={(bot) => {
            // Type guard: only update if bot is not a function
            if (typeof bot === 'function') {
              setSelectedBot((prev) => prev ? bot(prev) : null);
            } else {
              setSelectedBot(bot);
            }
          }}
          onSave={handleEditBot}
          onClose={() => {
            setShowEditModal(false);
            setSelectedBot(null);
          }}
          voiceOptions={VOICE_OPTIONS}
          languages={AVAILABLE_LANGUAGES}
          isEdit={true}
        />
      )}
      {/* Delete Confirmation */}
      {showDeleteConfirm && botToDelete && (
        <DeleteConfirmModal
          bot={botToDelete}
          onConfirm={handleDeleteBot}
          onClose={() => {
            setShowDeleteConfirm(false);
            setBotToDelete(null);
          }}
        />
      )}

      {/* Test Bot Modal */}
      {showTestModal && botToTest && (
        <TestBotModal
          bot={botToTest}
          onClose={() => {
            setShowTestModal(false);
            setBotToTest(null);
          }}
        />
      )}

      {/* DID Management Modal */}
      {showDIDModal && botForDIDManagement && (
        <DIDManagementModal
          bot={botForDIDManagement}
          allDIDs={didAssignments}
          assignedDIDs={getDIDsForBot(botForDIDManagement.id)}
          onAssignDID={(did) => {
            setDidAssignments(
              didAssignments.map((assignment) =>
                assignment.did === did
                  ? {
                      ...assignment,
                      campaignId: botForDIDManagement.id,
                      campaignName: botForDIDManagement.campaign,
                      isActive: true,
                    }
                  : assignment
              )
            );
          }}
          onUnassignDID={(did) => {
            setDidAssignments(
              didAssignments.map((assignment) =>
                assignment.did === did
                  ? { ...assignment, campaignId: "", campaignName: "", isActive: false }
                  : assignment
              )
            );
          }}
          onAddNewDID={(did) => {
            // Add new DID and assign to current campaign
            const newAssignment = /** @type {DIDAssignment} */ ({
              did: did,
              campaignId: botForDIDManagement.id,
              campaignName: botForDIDManagement.campaign,
              isActive: true,
            });
            setDidAssignments([...didAssignments, newAssignment]);
          }}
          onClose={() => {
            setShowDIDModal(false);
            setBotForDIDManagement(null);
          }}
        />
      )}
    </div>
  );
}