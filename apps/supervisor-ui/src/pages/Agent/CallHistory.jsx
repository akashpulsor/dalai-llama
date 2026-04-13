// src/pages/Agent/CallHistory.jsx
/**
 * @fileoverview Call History Component - Comprehensive call record management
 * Displays agent call history with search, filter, export, and detailed view capabilities
 * @module CallHistory
 */

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Download,
  Phone,
  Clock,
  Calendar,
  User,
  MessageSquare,
  X,
  Play,
  FileText,
  ChevronLeft,
  ChevronRight,
  Star,
  PhoneIncoming,
  PhoneOutgoing,
  AlertCircle,
  CheckCircle,
  ArrowUpDown,
} from "lucide-react";

/**
 * @typedef {'inbound' | 'outbound'} CallType
 */

/**
 * @typedef {'Resolved' | 'Escalated' | 'Callback Scheduled' | 'No Answer' | 'Voicemail'} CallOutcome
 */

/**
 * @typedef {Object} CallRecord
 * @property {string} id - Unique call identifier
 * @property {string} customerName - Customer full name
 * @property {string} phone - Customer phone number
 * @property {CallType} type - Call direction type
 * @property {string} duration - Call duration in human-readable format
 * @property {string} date - Call date (YYYY-MM-DD)
 * @property {string} time - Call time (12-hour format)
 * @property {CallOutcome} outcome - Call resolution outcome
 * @property {number} satisfaction - Customer satisfaction rating (1-5)
 * @property {string} queue - Queue/department name
 * @property {string} recording - Recording file URL
 * @property {string} notes - Agent notes and call summary
 */

/**
 * @typedef {'all' | 'inbound' | 'outbound'} FilterType
 */

/**
 * @typedef {Object} FilterState
 * @property {FilterType} type - Call type filter
 * @property {string} outcome - Call outcome filter
 */

/**
 * @typedef {Object} CallStatistics
 * @property {number} total - Total number of calls
 * @property {number} resolved - Number of resolved calls
 * @property {string} avgSatisfaction - Average satisfaction rating
 */

/**
 * Call History Component
 * Main component for displaying and managing call records
 * 
 * @component
 * @returns {React.ReactElement} Call history page with search, filter, and detail view
 */
export default function CallHistory() {
  const [calls] = useState(/** @type {CallRecord[]} */ ([
    {
      id: "CALL-2024-001",
      customerName: "Priya Sharma",
      phone: "+91 98765 43210",
      type: "inbound",
      duration: "5m 23s",
      date: "2024-12-10",
      time: "10:23 AM",
      outcome: "Resolved",
      satisfaction: 5,
      queue: "Sales Support",
      recording: "/recordings/001.mp3",
      notes: "Customer inquired about business loan products. Provided detailed information about interest rates and eligibility criteria. Sent application form via email. Customer expressed high satisfaction with service.",
    },
    {
      id: "CALL-2024-002",
      customerName: "Rahul Verma",
      phone: "+91 98765 12345",
      type: "inbound",
      duration: "8m 45s",
      date: "2024-12-10",
      time: "10:15 AM",
      outcome: "Escalated",
      satisfaction: 3,
      queue: "Technical Support",
      recording: "/recordings/002.mp3",
      notes: "Technical issue with payment gateway integration. Customer unable to complete transaction. Issue appears to be related to API timeout. Escalated to Level 2 support team for immediate resolution.",
    },
    {
      id: "CALL-2024-003",
      customerName: "Anjali Desai",
      phone: "+91 98765 67890",
      type: "outbound",
      duration: "3m 12s",
      date: "2024-12-10",
      time: "09:45 AM",
      outcome: "Callback Scheduled",
      satisfaction: 4,
      queue: "Follow-up",
      recording: "/recordings/003.mp3",
      notes: "Follow-up call regarding product demo scheduled last week. Customer requested additional time to review proposal. Scheduled callback for 2 PM tomorrow.",
    },
    {
      id: "CALL-2024-004",
      customerName: "Vikram Singh",
      phone: "+91 98765 11111",
      type: "inbound",
      duration: "12m 18s",
      date: "2024-12-09",
      time: "04:30 PM",
      outcome: "Resolved",
      satisfaction: 5,
      queue: "Customer Service",
      recording: "/recordings/004.mp3",
      notes: "Account balance inquiry and transaction history review. Resolved billing discrepancy from previous month. Customer satisfied with resolution.",
    },
    {
      id: "CALL-2024-005",
      customerName: "Meera Patel",
      phone: "+91 98765 22222",
      type: "outbound",
      duration: "2m 05s",
      date: "2024-12-09",
      time: "02:15 PM",
      outcome: "No Answer",
      satisfaction: 0,
      queue: "Collections",
      recording: "/recordings/005.mp3",
      notes: "Attempted to reach customer regarding overdue payment. No answer. Left voicemail with callback number.",
    },
  ]));

  const [searchTerm, setSearchTerm] = useState("");
  
  const [selectedCall, setSelectedCall] = useState(/** @type {CallRecord | null} */ (null));
  
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState(/** @type {FilterState} */ ({
    type: "all",
    outcome: "all",
  }));

  /**
   * Filter and search calls based on current criteria
   * @returns {CallRecord[]} Filtered call records
   */
  const filteredCalls = useMemo(() => {
    return calls.filter((call) => {
      const matchesSearch =
        searchTerm === "" ||
        call.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.phone.includes(searchTerm) ||
        call.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filters.type === "all" || call.type === filters.type;
      const matchesOutcome = filters.outcome === "all" || call.outcome === filters.outcome;

      return matchesSearch && matchesType && matchesOutcome;
    });
  }, [calls, searchTerm, filters]);

  /**
   * Calculate call statistics
   * @returns {CallStatistics} Statistics object with call metrics
   */
  const stats = useMemo(() => {
    const total = filteredCalls.length;
    const resolved = filteredCalls.filter((c) => c.outcome === "Resolved").length;
    const avgSatisfaction =
      filteredCalls.reduce((sum, c) => sum + c.satisfaction, 0) / total || 0;

    return {
      total,
      resolved,
      avgSatisfaction: avgSatisfaction.toFixed(1),
    };
  }, [filteredCalls]);

  /**
   * Gets call type badge style
   * @param {CallType} type - Call type
   * @returns {string} CSS classes for badge styling
   */
  const getTypeBadge = (type) => {
    return type === "inbound"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-green-50 text-green-700 border-green-200";
  };

  /**
   * Gets outcome badge style
   * @param {CallOutcome} outcome - Call outcome
   * @returns {string} CSS classes for badge styling
   */
  const getOutcomeBadge = (outcome) => {
    switch (outcome) {
      case "Resolved":
        return "bg-green-50 text-green-700 border-green-200";
      case "Escalated":
        return "bg-red-50 text-red-700 border-red-200";
      case "Callback Scheduled":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "No Answer":
        return "bg-gray-50 text-gray-700 border-gray-200";
      case "Voicemail":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  /**
   * Get outcome icon component
   * @param {CallOutcome} outcome - Call outcome
   * @returns {React.ReactElement} Icon component
   */
  const getOutcomeIcon = (outcome) => {
    switch (outcome) {
      case "Resolved":
        return <CheckCircle size={14} />;
      case "Escalated":
        return <AlertCircle size={14} />;
      case "Callback Scheduled":
        return <Clock size={14} />;
      case "No Answer":
        return <Phone size={14} />;
      case "Voicemail":
        return <MessageSquare size={14} />;
      default:
        return <Phone size={14} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-purple-200/50 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <MessageSquare className="text-white" size={24} />
                </div>
                Call History
              </h1>
              <p className="text-gray-600 font-medium">
                View and manage your complete call records
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-4">
              <StatCard
                icon={<Phone size={20} />}
                label="Total Calls"
                value={stats.total.toString()}
                color="purple"
              />
              <StatCard
                icon={<CheckCircle size={20} />}
                label="Resolved"
                value={stats.resolved.toString()}
                color="green"
              />
              <StatCard
                icon={<Star size={20} />}
                label="Avg Rating"
                value={stats.avgSatisfaction}
                color="amber"
              />
            </div>
          </div>

          {/* Search and Actions */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by customer name, phone number, or call ID..."
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
                       ${
                         showFilters
                           ? "bg-purple-600 text-white"
                           : "bg-white text-purple-700 border-2 border-purple-200 hover:bg-purple-50"
                       }`}
            >
              <Filter size={20} />
              Filters
            </button>

            <button
              className="px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white 
                       rounded-xl hover:from-green-600 hover:to-green-700 transition-all 
                       duration-200 font-semibold flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              <Download size={20} />
              Export
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Call Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) =>
                      setFilters({ ...filters, type: /** @type {FilterType} */ (e.target.value) })
                    }
                    className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl 
                             focus:border-purple-400 focus:outline-none bg-white font-medium"
                  >
                    <option value="all">All Types</option>
                    <option value="inbound">Inbound Only</option>
                    <option value="outbound">Outbound Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Outcome
                  </label>
                  <select
                    value={filters.outcome}
                    onChange={(e) => setFilters({ ...filters, outcome: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl 
                             focus:border-purple-400 focus:outline-none bg-white font-medium"
                  >
                    <option value="all">All Outcomes</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Escalated">Escalated</option>
                    <option value="Callback Scheduled">Callback Scheduled</option>
                    <option value="No Answer">No Answer</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Call List Table */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-purple-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-50 to-blue-50 border-b-2 border-purple-200">
                  <th className="px-6 py-5 text-left">
                    <div className="flex items-center gap-2 text-sm font-bold text-purple-800">
                      <ArrowUpDown size={16} />
                      Call ID
                    </div>
                  </th>
                  <th className="px-6 py-5 text-left text-sm font-bold text-purple-800">
                    Customer Details
                  </th>
                  <th className="px-6 py-5 text-left text-sm font-bold text-purple-800">
                    Type
                  </th>
                  <th className="px-6 py-5 text-left text-sm font-bold text-purple-800">
                    Date & Time
                  </th>
                  <th className="px-6 py-5 text-left text-sm font-bold text-purple-800">
                    Duration
                  </th>
                  <th className="px-6 py-5 text-left text-sm font-bold text-purple-800">
                    Outcome
                  </th>
                  <th className="px-6 py-5 text-left text-sm font-bold text-purple-800">
                    Rating
                  </th>
                  <th className="px-6 py-5 text-left text-sm font-bold text-purple-800">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCalls.map((call, index) => (
                  <tr
                    key={call.id}
                    className={`border-b border-purple-100 hover:bg-purple-50/50 transition-all duration-200
                      ${index % 2 === 0 ? "bg-white/50" : "bg-purple-50/20"}`}
                  >
                    <td className="px-6 py-5">
                      <span className="font-mono text-sm font-semibold text-gray-700">
                        {call.id}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <div>
                        <p className="font-bold text-gray-800 mb-1">{call.customerName}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Phone size={12} className="text-purple-500" />
                          {call.phone}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border-2
                        ${getTypeBadge(call.type)}`}
                      >
                        {call.type === "inbound" ? (
                          <>
                            <PhoneIncoming size={14} />
                            Inbound
                          </>
                        ) : (
                          <>
                            <PhoneOutgoing size={14} />
                            Outbound
                          </>
                        )}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <div className="text-sm space-y-1">
                        <p className="text-gray-800 font-semibold flex items-center gap-2">
                          <Calendar size={14} className="text-purple-500" />
                          {call.date}
                        </p>
                        <p className="text-gray-600 flex items-center gap-2">
                          <Clock size={14} className="text-purple-500" />
                          {call.time}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <span className="font-mono text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">
                        {call.duration}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border-2
                        ${getOutcomeBadge(call.outcome)}`}
                      >
                        {getOutcomeIcon(call.outcome)}
                        {call.outcome}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={
                              i < call.satisfaction
                                ? "text-amber-400 fill-amber-400"
                                : "text-gray-300"
                            }
                          />
                        ))}
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <button
                        onClick={() => setSelectedCall(call)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 
                                 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 
                                 transition-all duration-200 font-semibold text-sm flex items-center gap-2
                                 shadow-md hover:shadow-lg hover:scale-105"
                      >
                        <FileText size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-t-2 border-purple-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 font-medium">
                Showing <span className="font-bold text-purple-700">{filteredCalls.length}</span> of{" "}
                <span className="font-bold text-purple-700">{calls.length}</span> calls
              </p>
              <div className="flex items-center gap-2">
                <button
                  className="p-2 bg-white border-2 border-purple-200 rounded-lg 
                           hover:bg-purple-50 transition-all duration-200 disabled:opacity-50"
                  disabled
                  aria-label="Previous page"
                >
                  <ChevronLeft size={20} className="text-purple-700" />
                </button>
                <span className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold">1</span>
                <button
                  className="p-2 bg-white border-2 border-purple-200 rounded-lg 
                           hover:bg-purple-50 transition-all duration-200"
                  aria-label="Next page"
                >
                  <ChevronRight size={20} className="text-purple-700" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call Detail Modal */}
      {selectedCall && (
        <CallDetailModal call={selectedCall} onClose={() => setSelectedCall(null)} />
      )}
    </div>
  );
}

/**
 * @typedef {'purple' | 'green' | 'amber'} StatCardColor
 */

/**
 * Stat Card Component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.icon - Icon component
 * @param {string} props.label - Label text
 * @param {string} props.value - Value to display
 * @param {StatCardColor} props.color - Color theme
 * @returns {React.ReactElement} Stat card component
 */
const StatCard = ({ icon, label, value, color }) => {
  /** @type {Record<StatCardColor, string>} */
  const colorConfig = {
    purple: "from-purple-500 to-purple-600",
    green: "from-green-500 to-green-600",
    amber: "from-amber-400 to-amber-500",
  };

  return (
    <div className="bg-white rounded-xl border-2 border-purple-200 p-4 min-w-[120px] shadow-sm">
      <div
        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorConfig[color]} 
                   flex items-center justify-center text-white mb-2 shadow-md`}
      >
        {icon}
      </div>
      <p className="text-2xl font-extrabold text-gray-800 mb-1">{value}</p>
      <p className="text-xs font-semibold text-gray-600">{label}</p>
    </div>
  );
};

/**
 * Call Detail Modal Component
 * @param {Object} props - Component props
 * @param {CallRecord} props.call - Call record to display
 * @param {() => void} props.onClose - Close callback
 * @returns {React.ReactElement} Modal component
 */
const CallDetailModal = ({ call, onClose }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-fadeIn">
    <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
      {/* Modal Header */}
      <div className="sticky top-0 bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 text-white p-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-xl">
              <User size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold mb-1">{call.customerName}</h2>
              <p className="text-purple-100 font-mono text-sm">{call.id}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/20 backdrop-blur-xl text-white text-xs font-bold">
                  {call.type === "inbound" ? (
                    <>
                      <PhoneIncoming size={16} />
                      Inbound Call
                    </>
                  ) : (
                    <>
                      <PhoneOutgoing size={16} />
                      Outbound Call
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Modal Content */}
      <div className="p-8 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
        {/* Call Info Grid */}
        <div className="grid grid-cols-3 gap-4">
          <InfoCard
            icon={<Phone className="text-purple-600" />}
            label="Phone Number"
            value={call.phone}
          />
          <InfoCard
            icon={<Calendar className="text-purple-600" />}
            label="Date"
            value={call.date}
          />
          <InfoCard icon={<Clock className="text-purple-600" />} label="Time" value={call.time} />
          <InfoCard
            icon={<Clock className="text-purple-600" />}
            label="Duration"
            value={call.duration}
          />
          <InfoCard
            icon={<MessageSquare className="text-purple-600" />}
            label="Queue"
            value={call.queue}
          />
          <InfoCard
            icon={<User className="text-purple-600" />}
            label="Call Type"
            value={call.type === "inbound" ? "Inbound" : "Outbound"}
          />
        </div>

        {/* Outcome and Rating */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-600 mb-2 uppercase tracking-wide">
                Call Outcome
              </p>
              <div className="flex items-center gap-2">
                <CheckCircle size={24} className="text-green-600" />
                <p className="text-2xl font-extrabold text-green-800">{call.outcome}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-600 mb-2 uppercase tracking-wide">
                Customer Satisfaction
              </p>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    size={24}
                    className={
                      i < call.satisfaction ? "text-amber-400 fill-amber-400" : "text-gray-300"
                    }
                  />
                ))}
                <span className="ml-2 text-2xl font-extrabold text-gray-800">
                  {call.satisfaction}/5
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Call Recording */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border-2 border-purple-200 p-6">
          <h3 className="font-extrabold text-purple-800 mb-4 flex items-center gap-2 text-lg">
            <Play size={22} />
            Call Recording
          </h3>
          <div className="bg-white rounded-xl p-6 shadow-inner">
            <div className="flex items-center gap-4">
              <button
                className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white 
                         rounded-full hover:from-purple-600 hover:to-purple-700 transition-all 
                         duration-200 shadow-lg hover:shadow-xl hover:scale-110"
                aria-label="Play recording"
              >
                <Play size={24} />
              </button>
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 w-1/3 rounded-full" />
                </div>
                <p className="text-sm text-gray-600 font-semibold">1:45 / 5:23</p>
              </div>
              <button
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white 
                         rounded-xl hover:from-green-600 hover:to-green-700 transition-all 
                         duration-200 font-semibold flex items-center gap-2 shadow-md hover:shadow-lg"
                aria-label="Download recording"
              >
                <Download size={18} />
                Download
              </button>
            </div>
          </div>
        </div>

        {/* Agent Notes */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-6">
          <h3 className="font-extrabold text-blue-800 mb-4 flex items-center gap-2 text-lg">
            <FileText size={22} />
            Agent Notes & Summary
          </h3>
          <div className="bg-white p-6 rounded-xl shadow-inner">
            <p className="text-gray-700 leading-relaxed">{call.notes}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Info Card Component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.icon - Icon element
 * @param {string} props.label - Label text
 * @param {string} props.value - Value text
 * @returns {React.ReactElement} Info card component
 */
const InfoCard = ({ icon, label, value }) => (
  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 p-5 hover:shadow-md transition-all duration-200">
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">{label}</p>
    </div>
    <p className="font-extrabold text-gray-800 text-lg">{value}</p>
  </div>
);