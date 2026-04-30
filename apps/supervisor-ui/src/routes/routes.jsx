// src/routes/routes.jsx
// @ts-check
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import UniversalLayout from "../components/layout/UniversalLayout.jsx";

import Login from "../pages/Login/Login.jsx";

import LiveCallConsole from "../pages/Agent/LiveCallConsole.jsx";
import OutboundDialpad from "../pages/Agent/OutboundDialpad.jsx";

import SupervisorCockpit from "../pages/Supervisor/Cockpit.jsx";
import QueueHeatmap from "../pages/Supervisor/QueueHeatmap.jsx";

import CallHistory from "../pages/Agent/CallHistory.jsx";
import AgentDashboard from "../pages/Agent/AgentDashboard.jsx";
import SupervisorDashboard from "../pages/Supervisor/SupervisorDashboard.jsx";
import LiveQueueMonitor from "../pages/Supervisor/LiveQueueMonitor.jsx";
import LiveAgents from "../pages/Supervisor/LiveAgents.jsx";
import LiveCalls from "../pages/Supervisor/LiveCalls.jsx";
import AIQualityCenter from "../pages/Supervisor/AIQualityCenter.jsx";

import PerformanceOverview from "../pages/Supervisor/Performanceoverview.jsx";  

import CallReview from "../pages/Supervisor/CallReview.jsx";
import WorkforceForecasting from "../pages/Supervisor/WorkforceForecasting.jsx";


export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<UniversalLayout />}>
        <Route index element={<Navigate to="/login" replace />} />

        {/* Agent */}
        <Route path="agent/live" element={<LiveCallConsole />} />
        <Route path="agent/dial" element={<OutboundDialpad />} />
        <Route path="agent/history" element={<CallHistory />} />
        <Route path="agent/dashboard" element={<AgentDashboard />} />

        {/* Supervisor */}
        <Route path="supervisor/dashboard" element={<SupervisorDashboard />} />
        <Route path="supervisor/queues" element={<LiveQueueMonitor />} />
        <Route path="supervisor/agents" element={<LiveAgents />} />
        <Route path="supervisor/livecalls" element={<LiveCalls />} />
        <Route path="supervisor/heatmap" element={<QueueHeatmap />} />
        <Route path="supervisor/quality" element={<AIQualityCenter />} />
        <Route path="supervisor/performance" element={< PerformanceOverview/>} />
        <Route path="supervisor/call-review" element={< CallReview/>} />
        <Route path="supervisor/forecasting" element={< WorkforceForecasting/>} />
      </Route>

      {/* 404 */}
      <Route
        path="*"
        element={
          <div className="flex h-screen items-center justify-center text-xl font-bold text-purple-700">
            404 — Page Not Found
          </div>
        }
      />
    </Routes>
  );
}
