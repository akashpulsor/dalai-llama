import React from "react";

export default function QueueHeatmap() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-purple-700 mb-6">
        Queue Heatmap
      </h1>

      <div className="bg-white rounded-3xl p-8 shadow-xl border border-purple-200">
        <div className="text-gray-600">
          Queue distribution & congestion heatmap will be rendered here.
        </div>
        <div className="mt-6 h-64 bg-purple-100 rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}
