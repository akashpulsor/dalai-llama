// src/pages/agent/AgentDashboard.jsx
import React, { useState, useEffect } from "react";
import {
  Phone,
  PhoneOff,
  Clock,
  TrendingUp,
  Award,
  Target,
  MessageSquare,
  ThumbsUp,
  AlertCircle,
  Calendar,
  BarChart3,
  Activity,
} from "lucide-react";

/**
 * @typedef {Object} AgentStats
 * @property {number} totalCalls - Total calls handled today
 * @property {number} avgHandleTime - Average handle time in seconds
 * @property {number} satisfaction - Customer satisfaction score
 * @property {number} firstCallResolution - FCR percentage
 * @property {number} activeTime - Active time in minutes
 * @property {number} breakTime - Break time in minutes
 */

/**
 * @typedef {Object} RecentCall
 * @property {string} id - Call ID
 * @property {string} customerName - Customer name
 * @property {string} phone - Phone number
 * @property {string} duration - Call duration
 * @property {string} outcome - Call outcome
 * @property {string} timestamp - Call timestamp
 * @property {number} satisfaction - Satisfaction score
 */

/**
 * @typedef {'green' | 'yellow' | 'purple'} ColorTheme
 */

/**
 * Agent Dashboard Component
 * 
 * Provides agents with their performance metrics, recent calls,
 * and quick actions for their daily work.
 * 
 * @returns {React.ReactElement}
 */
export default function AgentDashboard() {
  /** @type {[AgentStats, React.Dispatch<React.SetStateAction<AgentStats>>]} */
  const [stats, setStats] = useState(/** @type {AgentStats} */({
    totalCalls: 24,
    avgHandleTime: 345,
    satisfaction: 4.6,
    firstCallResolution: 87,
    activeTime: 420,
    breakTime: 45,
  }));

  /** @type {[RecentCall[], React.Dispatch<React.SetStateAction<RecentCall[]>>]} */
  const [recentCalls, setRecentCalls] = useState(/** @type {RecentCall[]} */([]));

  /** @type {['available' | 'busy' | 'break' | 'offline', React.Dispatch<React.SetStateAction<'available' | 'busy' | 'break' | 'offline'>>]} */
  const [agentStatus, setAgentStatus] = useState(/** @type {'available' | 'busy' | 'break' | 'offline'} */('available'));

  useEffect(() => {
    // Simulate loading recent calls
    setRecentCalls([
      {
        id: "CALL-001",
        customerName: "Priya Sharma",
        phone: "+91 98765 43210",
        duration: "5m 23s",
        outcome: "Resolved",
        timestamp: "2 minutes ago",
        satisfaction: 5,
      },
      {
        id: "CALL-002",
        customerName: "Rahul Verma",
        phone: "+91 98765 12345",
        duration: "8m 45s",
        outcome: "Escalated",
        timestamp: "15 minutes ago",
        satisfaction: 3,
      },
      {
        id: "CALL-003",
        customerName: "Anjali Desai",
        phone: "+91 98765 67890",
        duration: "3m 12s",
        outcome: "Resolved",
        timestamp: "32 minutes ago",
        satisfaction: 5,
      },
      {
        id: "CALL-004",
        customerName: "Vikram Singh",
        phone: "+91 98765 11111",
        duration: "6m 34s",
        outcome: "Callback Scheduled",
        timestamp: "1 hour ago",
        satisfaction: 4,
      },
    ]);
  }, []);

  /**
   * Formats seconds to MM:SS
   * @param {number} seconds - Seconds to format
   * @returns {string}
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  /**
   * Gets status color class
   * @param {'available' | 'busy' | 'break' | 'offline'} status - Agent status
   * @returns {string}
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-red-500';
      case 'break': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  /**
   * Gets outcome badge style
   * @param {string} outcome - Call outcome
   * @returns {string}
   */
  const getOutcomeBadge = (outcome) => {
    switch (outcome) {
      case 'Resolved': return 'bg-green-100 text-green-800 border-green-300';
      case 'Escalated': return 'bg-red-100 text-red-800 border-red-300';
      case 'Callback Scheduled': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-purple-700 flex items-center gap-3">
            <Activity className="animate-pulse" />
            Agent Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Welcome back, Akash! Here's your performance today.</p>
        </div>

        {/* Status Selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <select
            value={agentStatus}
            onChange={(e) => setAgentStatus(/** @type {'available' | 'busy' | 'break' | 'offline'} */(e.target.value))}
            className="px-4 py-2 rounded-xl border-2 border-purple-200 bg-white font-semibold text-gray-700 focus:outline-none focus:border-purple-400"
          >
            <option value="available">🟢 Available</option>
            <option value="busy">🔴 Busy</option>
            <option value="break">🟡 On Break</option>
            <option value="offline">⚫ Offline</option>
          </select>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard
          icon={<Phone className="text-purple-600" />}
          title="Total Calls"
          value={stats.totalCalls}
          subtitle="Today"
          bgColor="from-purple-50 to-purple-100"
          borderColor="border-purple-300"
        />
        <StatCard
          icon={<Clock className="text-blue-600" />}
          title="Avg Handle Time"
          value={formatTime(stats.avgHandleTime)}
          subtitle="Target: 5:00"
          bgColor="from-blue-50 to-blue-100"
          borderColor="border-blue-300"
        />
        <StatCard
          icon={<ThumbsUp className="text-green-600" />}
          title="Satisfaction"
          value={`${stats.satisfaction}/5.0`}
          subtitle="⭐ Excellent"
          bgColor="from-green-50 to-green-100"
          borderColor="border-green-300"
        />
        <StatCard
          icon={<Target className="text-orange-600" />}
          title="FCR Rate"
          value={`${stats.firstCallResolution}%`}
          subtitle="First Call Resolution"
          bgColor="from-orange-50 to-orange-100"
          borderColor="border-orange-300"
        />
      </div>

      {/* Time Tracking */}
      <div className="grid grid-cols-3 gap-6">
        <TimeCard
          icon={<Activity className="text-green-600" />}
          title="Active Time"
          time={`${Math.floor(stats.activeTime / 60)}h ${stats.activeTime % 60}m`}
          percentage={87}
          color="green"
        />
        <TimeCard
          icon={<Clock className="text-yellow-600" />}
          title="Break Time"
          time={`${stats.breakTime}m`}
          percentage={13}
          color="yellow"
        />
        <TimeCard
          icon={<BarChart3 className="text-purple-600" />}
          title="Utilization"
          time="87%"
          percentage={87}
          color="purple"
        />
      </div>

      {/* Recent Calls */}
      <div className="bg-white rounded-3xl shadow-xl border-2 border-purple-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-purple-700 flex items-center gap-2">
            <MessageSquare size={28} />
            Recent Calls
          </h2>
          <button className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition font-semibold">
            View All History
          </button>
        </div>

        <div className="space-y-3">
          {recentCalls.map((call) => (
            <CallHistoryItem key={call.id} call={call} getOutcomeBadge={getOutcomeBadge} />
          ))}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-300 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <Award className="text-green-600" size={32} />
            <div>
              <h3 className="text-xl font-bold text-green-800">Today's Achievements</h3>
              <p className="text-sm text-green-700">Keep up the great work!</p>
            </div>
          </div>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-green-800">
              <span className="text-green-600">🏆</span>
              <span className="font-medium">Handled 24 calls - Above target!</span>
            </li>
            <li className="flex items-center gap-2 text-green-800">
              <span className="text-green-600">⭐</span>
              <span className="font-medium">4.6 satisfaction - Excellent rating</span>
            </li>
            <li className="flex items-center gap-2 text-green-800">
              <span className="text-green-600">🎯</span>
              <span className="font-medium">87% FCR - Outstanding!</span>
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-300 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="text-blue-600" size={32} />
            <div>
              <h3 className="text-xl font-bold text-blue-800">Areas to Improve</h3>
              <p className="text-sm text-blue-700">Focus on these metrics</p>
            </div>
          </div>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-blue-800">
              <span className="text-blue-600">💡</span>
              <span className="font-medium">Reduce handle time by 30s</span>
            </li>
            <li className="flex items-center gap-2 text-blue-800">
              <span className="text-blue-600">📞</span>
              <span className="font-medium">Target: 30 calls per day</span>
            </li>
            <li className="flex items-center gap-2 text-blue-800">
              <span className="text-blue-600">🎓</span>
              <span className="font-medium">Complete product training module</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Stat Card Component
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Icon element
 * @param {string} props.title - Card title
 * @param {string | number} props.value - Main value
 * @param {string} props.subtitle - Subtitle text
 * @param {string} props.bgColor - Background gradient
 * @param {string} props.borderColor - Border color
 * @returns {React.ReactElement}
 */
const StatCard = ({ icon, title, value, subtitle, bgColor, borderColor }) => (
  <div className={`bg-gradient-to-br ${bgColor} rounded-2xl border-2 ${borderColor} p-6 shadow-lg`}>
    <div className="flex items-center justify-between mb-3">
      <div className="bg-white p-3 rounded-xl shadow-md">
        {icon}
      </div>
    </div>
    <h3 className="text-sm font-semibold text-gray-600 mb-1">{title}</h3>
    <p className="text-3xl font-bold text-gray-800 mb-1">{value}</p>
    <p className="text-xs text-gray-600">{subtitle}</p>
  </div>
);

/**
 * Time Card Component
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Icon element
 * @param {string} props.title - Card title
 * @param {string} props.time - Time value
 * @param {number} props.percentage - Percentage value
 * @param {ColorTheme} props.color - Color theme
 * @returns {React.ReactElement}
 */
const TimeCard = ({ icon, title, time, percentage, color }) => {
  /** @type {Record<ColorTheme, string>} */
  const colorClasses = {
    green: 'from-green-50 to-green-100 border-green-300',
    yellow: 'from-yellow-50 to-yellow-100 border-yellow-300',
    purple: 'from-purple-50 to-purple-100 border-purple-300',
  };

  /** @type {Record<ColorTheme, string>} */
  const barColors = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-2xl border-2 p-6 shadow-lg`}>
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h3 className="font-bold text-gray-800">{title}</h3>
      </div>
      <p className="text-3xl font-bold text-gray-800 mb-3">{time}</p>
      <div className="w-full bg-white rounded-full h-3 shadow-inner">
        <div
          className={`${barColors[color]} h-3 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Call History Item Component
 * @param {Object} props
 * @param {RecentCall} props.call - Call data
 * @param {(outcome: string) => string} props.getOutcomeBadge - Function to get badge style
 * @returns {React.ReactElement}
 */
const CallHistoryItem = ({ call, getOutcomeBadge }) => (
  <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border-2 border-gray-200 p-4 hover:shadow-md transition">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h4 className="font-bold text-gray-800">{call.customerName}</h4>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getOutcomeBadge(call.outcome)}`}>
            {call.outcome}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Phone size={14} />
            {call.phone}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {call.duration}
          </span>
          <span>{call.timestamp}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right mr-4">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={i < call.satisfaction ? 'text-yellow-500' : 'text-gray-300'}>
                ⭐
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-1">Customer Rating</p>
        </div>
        <button className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition font-medium text-sm">
          View Details
        </button>
      </div>
    </div>
  </div>
);