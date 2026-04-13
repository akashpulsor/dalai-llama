import React from "react";
import { Activity } from "lucide-react";

export default function SupervisorCockpit() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-purple-700 mb-6">
        Supervisor Cockpit
      </h1>

      <div className="bg-white p-8 rounded-3xl shadow-xl border border-purple-200">
        <div className="flex items-center gap-4 mb-4">
          <Activity size={32} className="text-purple-600" />
          <span className="text-lg font-medium text-gray-700">
            Real-time metrics will be displayed here.
          </span>
        </div>

        <div className="text-gray-600">
          Queue performance, agent performance, and call analytics will load dynamically.
        </div>
      </div>
    </div>
  );
}
