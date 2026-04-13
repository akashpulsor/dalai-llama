// src/components/layouts/UniversalLayout.jsx
// @ts-check

import React, { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import {
  Menu,
  ChevronLeft,
  LogOut,
  Users,
  Shield,
  PhoneCall,
  Grid3x3,
  Gauge,
  Activity,
  PhoneForwarded,
  GitBranch,
  Bot,
  Radio,
  ClipboardCheck,
  CreditCard,
  FileText,
  Library,
  History,
  MonitorCheck,
  TrendingUp,
  ScanEye,
  CalendarClock   
} from "lucide-react";

import { useSelector, useDispatch } from "react-redux";
import { logout } from "@dalaillama/shared-store";

/**
 * @typedef {Object} MenuItem
 * @property {string} to
 * @property {string} label
 * @property {React.ReactNode} icon
 */

export default function UniversalLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const dispatch = useDispatch();

  /** ---------------------------------
   * ROLE DETECTION (typed selector)
   * ----------------------------------*/
  const role =
    useSelector(
      /** @param {{auth?: {user?: {role?: string}}}} state */
      (state) => state.auth?.user?.role
    ) || "agent";

  /** ---------------------------------
   * ROLE-BASED MENUS (fully typed)
   * ----------------------------------*/
  /** @type {Record<string, MenuItem[]>} */
  const MENUS = {
    agent: [
    {
      to: "/agent/dashboard",
      label: "Dashboard",
      icon: <Gauge size={20} />,
    },
    {
      to: "/agent/live",
      label: "Live Console",
      icon: <PhoneCall size={20} />,
    },
    {
      to: "/agent/dial",
      label: "Dialpad",
      icon: <Grid3x3 size={20} />,
    },
    {
      to: "/agent/history",
      label: "Call History",
      icon: <History size={20} />,
    },
    ],
    //supervisor/dashboard
    supervisor: [
      { to: "/supervisor/dashboard", label: "Dashboard", icon: <Gauge size={20} /> },
      { to: "/supervisor/queues", label: "Queues", icon: <MonitorCheck  size={20} /> },  
      { to: "/supervisor/agents", label: "Live Agents", icon: <Gauge size={20} /> },
      { to: "/supervisor/livecalls", label: "Live Calls", icon: <PhoneCall  size={20} /> },
      { to: "/supervisor/quality", label: "Quality", icon: <Activity  size={20} /> },
      { to: "/supervisor/performance", label: "Performance", icon: <TrendingUp   size={20} /> },
      { to: "/supervisor/call-review", label: "Call Review", icon: <ScanEye   size={20} /> },
      { to: "/supervisor/forecasting", label: "Work Force Forecasting", icon: <CalendarClock  size={20} /> },
    ],

    admin: [{
      to: "/admin/dashboard",
      label: "Dashboard",
      icon: <Gauge size={20} />,
    },
      { to: "/admin/agents", label: "Agents", icon: <Users size={20} /> },
      { to: "/admin/supervisors", label: "Supervisors", icon: <Shield size={20} /> },
      { to: "/admin/queues", label: "Queues", icon: <PhoneForwarded size={20} /> },
      { to: "/admin/routing", label: "Routing Rules", icon: <GitBranch size={20} /> },
      { to: "/admin/ivr", label: "IVR Builder", icon: <Radio size={20} /> },
      { to: "/admin/bots", label: "Voice Bots", icon: <Bot size={20} /> },
      { to: "/admin/recording", label: "Recording", icon: <Library size={20} /> },
      { to: "/admin/compliance", label: "Compliance", icon: <ClipboardCheck size={20} /> },
      { to: "/admin/billing", label: "Billing", icon: <CreditCard size={20} /> },
      { to: "/admin/subscription", label: "Subscription", icon: <FileText size={20} /> },
      { to: "/admin/audit", label: "Audit Log", icon: <History size={20} /> },
    ],
  };

  const menuItems = MENUS[role] ?? MENUS.agent;

  /** ---------------------------------
   * Determine if current role uses new design
   * ----------------------------------*/
  const isAdminRole = role === "admin";

    const isSuperVisorRole = role === "supervisor";

  /** ---------------------------------
   * Sidebar Item Component (typed)
   * ----------------------------------*/
  /**
   * @param {MenuItem} param0
   */
  const NavItem = ({ to, icon, label }) => {
    if (isAdminRole || isSuperVisorRole) {
      // New enterprise SaaS design for admin
      return (
        <NavLink
          to={to}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-md font-medium text-sm transition-all
            ${collapsed ? "justify-center px-3 py-2.5" : "px-3 py-2"}
            ${
              isActive
                ? "bg-slate-900 text-white"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            }`
          }
          title={collapsed ? label : ""}
        >
          <span className="flex-shrink-0">{icon}</span>
          {!collapsed && <span>{label}</span>}
        </NavLink>
      );
    }

    // Original design for agent/supervisor
    return (
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all
          ${collapsed ? "justify-center" : ""}
          ${
            isActive
              ? "bg-purple-600 text-white shadow-lg scale-105"
              : "text-gray-700 hover:bg-purple-100 hover:text-purple-700"
          }`
        }
        title={collapsed ? label : ""}
      >
        {icon}
        {!collapsed && <span>{label}</span>}
      </NavLink>
    );
  };

  // Admin layout with enterprise SaaS design
  if (isAdminRole || isSuperVisorRole) {
    return (
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        {/* ----------------- SIDEBAR - ENTERPRISE DESIGN ----------------- */}
        <aside
          className={`h-full bg-white shadow-sm border-r border-slate-200 transition-all duration-300 flex flex-col
          ${collapsed ? "w-16" : "w-64"}`}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            {!collapsed ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🦙</span>
                  <div>
                    <div className="text-lg font-semibold text-slate-900">
                      Dalai Llama
                    </div>
                    <div className="text-xs text-slate-600 font-medium uppercase tracking-wide">
                      Admin
                    </div>
                  </div>
                </div>
                <button
                  className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition flex-shrink-0"
                  onClick={() => setCollapsed(!collapsed)}
                >
                  <ChevronLeft size={20} />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 w-full">
                <span className="text-2xl">🦙</span>
                <button
                  className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition"
                  onClick={() => setCollapsed(!collapsed)}
                >
                  <Menu size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Sidebar Menu - Scrollable */}
          <nav className="flex-1 flex flex-col gap-1 px-3 py-4 overflow-y-auto">
            {menuItems.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-slate-200 p-4">
            {!collapsed && (
              <div className="text-xs text-slate-500 mb-3">
                <div className="font-medium text-slate-700">AI Contact Center</div>
                <div className="text-slate-400">v1.0.0</div>
              </div>
            )}
            <button
              onClick={() => dispatch(logout())}
              className={`w-full flex items-center gap-2 text-slate-700 rounded-md hover:bg-slate-100 transition font-medium text-sm
                ${collapsed ? "justify-center px-3 py-2.5" : "px-3 py-2"}`}
              title="Logout"
            >
              <span className="flex-shrink-0"><LogOut size={18} /></span>
              {!collapsed && "Logout"}
            </button>
          </div>
        </aside>

        {/* ----------------- MAIN CONTENT - SCROLLABLE ----------------- */}
        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    );
  }

  // Original layout for agent/supervisor
  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-50 to-blue-50 overflow-hidden">
      {/* ----------------- SIDEBAR ----------------- */}
      <aside
        className={`h-full bg-white shadow-2xl border-r border-purple-200 transition-all duration-300 flex flex-col
        ${collapsed ? "w-20" : "w-72"}`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-purple-100">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span className="text-3xl">🦙</span>
              <div>
                <div className="text-xl font-extrabold text-purple-700">
                  Dalai Llama
                </div>
                <div className="text-xs text-purple-600 font-semibold uppercase tracking-wide">
                  {role}
                </div>
              </div>
            </div>
          )}
          {collapsed && (
            <span className="text-2xl">🦙</span>
          )}
          <button
            className="p-2 rounded-lg hover:bg-purple-100 text-purple-700 transition"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <Menu size={22} /> : <ChevronLeft size={22} />}
          </button>
        </div>

        {/* Sidebar Menu - Scrollable */}
        <nav className="flex-1 flex flex-col gap-2 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-transparent">
          {menuItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        {/* Footer Branding */}
        <div className="border-t border-purple-100 p-4 text-center text-xs text-gray-500">
          {!collapsed && (
            <div className="flex flex-col items-center gap-1">
              <span className="text-purple-700 font-semibold">
                AI-Native Contact Center
              </span>
              <span className="text-gray-400">v1.0.0</span>
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="p-3 border-t border-purple-100">
          <button
            onClick={() => dispatch(logout())}
            className={`w-full flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl hover:bg-red-100 transition font-medium
              ${collapsed ? "justify-center" : ""}`}
            title="Logout"
          >
            <LogOut size={18} />
            {!collapsed && "Logout"}
          </button>
        </div>
      </aside>

      {/* ----------------- MAIN CONTENT - SCROLLABLE ----------------- */}
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}