// src/pages/admin/QueueManagement/QueueManagement.jsx
import React, { useState, useMemo } from "react";
import { Search, Plus } from "lucide-react";

import QueueRow from "../../components/layout/QueueRow.jsx";
import QueueDrawer from "../../components/layout/QueueDrawer.jsx";

import { useGetQueuesQuery } from "@dalaillama/shared-store";

/**
 * @typedef {Object} Queue
 * @property {string} id
 * @property {string} name
 * @property {string} strategy
 * @property {number} maxWait
 * @property {number} maxSize
 * @property {number} wrapUp
 * @property {string[]} skills
 * @property {number} slaTime
 * @property {number} slaPercent
 * @property {string} businessHours

 * @property {string} name
 * @property {string} strategy
 * @property {number|string} slaTime
 * @property {number|string} slaPercent
 * @property {number} agentsCount
 * @property {string[]} skills
 */




/** @typedef {"add" | "edit" | null} DrawerMode */

export default function QueueManagement() {
  const { data: queues = [], isLoading } = useGetQueuesQuery();

  /** @type {[DrawerMode, React.Dispatch<React.SetStateAction<DrawerMode>>]} */
  const [drawer, setDrawer] = useState(
    /** @type {DrawerMode} */ (null)
  );

  /** @type {[Queue | null, React.Dispatch<React.SetStateAction<Queue | null>>]} */
  const [editingQueue, setEditingQueue] = useState(
    /** @type {Queue | null} */ (null)
  );

  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return queues.filter(
      /**
       * @param {Queue} q
       */
      (q) => q.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [queues, search]);

  return (
    <div className="p-6 space-y-6 text-slate-100">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Queue Management</h1>

        <button
          onClick={() => {
            setEditingQueue(null);
            setDrawer("add");
          }}
          className="px-4 py-2 bg-sky-600 text-white rounded-lg flex items-center gap-2 hover:bg-sky-700"
        >
          <Plus size={16} /> Create Queue
        </button>
      </div>

      {/* SEARCH */}
      <div className="relative w-full md:w-1/3">
        <Search size={16} className="absolute left-3 top-3 text-slate-400" />
        <input
          placeholder="Search queues…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 p-3 rounded-lg w-full border border-slate-700 bg-slate-900 text-slate-100"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white text-slate-700 border border-slate-300 rounded-xl overflow-hidden shadow">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">Queue Name</th>
              <th className="px-4 py-3 text-left">Strategy</th>
              <th className="px-4 py-3 text-left">SLA</th>
              <th className="px-4 py-3 text-left">Agents</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map(
              /**
               * @param {Queue} queue
               */
              (queue) => (
                <QueueRow
                  key={queue.id}
                  queue={queue}
                  onEdit={() => {
                    setEditingQueue(queue);
                    setDrawer("edit");
                  }}
                />
              )
            )}

            {!filtered.length && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-500">
                  {isLoading ? "Loading queues…" : "No queues found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* DRAWER */}
      {drawer && (
        <QueueDrawer
          mode={drawer}
          queue={editingQueue ?? undefined}
          onClose={() => setDrawer(null)}
        />
      )}
    </div>
  );
}
