// src/pages/admin/Supervisors/SupervisorManagement.jsx
import React, { useState, useMemo } from "react";
import { UserPlus, Search } from "lucide-react";
import SupervisorRow from "../../components/layout/SupervisorRow.jsx";
import SupervisorDrawer from "../../components/layout/SupervisorDrawer.jsx";

import { useGetAgentsQuery } from "@dalaillama/shared-store";

/**
 * @typedef {Object} Supervisor
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string[]} permissions
 * @property {string[]} agents
 * @property {string[]} queues
 */

/** @typedef {"add" | "edit" | null} DrawerMode */

export default function SupervisorManagement() {
  const { data: supervisors = [], isLoading } = useGetAgentsQuery();

  /** @type {[DrawerMode, React.Dispatch<React.SetStateAction<DrawerMode>>]} */
  const [drawer, setDrawer] = useState(/** @type {DrawerMode} */ (null));

  /** @type {[Supervisor|null, React.Dispatch<React.SetStateAction<Supervisor|null>>]} */
  const [editingSupervisor, setEditingSupervisor] = useState(
    /** @type {Supervisor|null} */ (null)
  );

  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return supervisors.filter(
      /** @param {Supervisor} s */
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [supervisors, search]);

  return (
    <div className="p-6 space-y-6 text-slate-100">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Supervisors</h1>

        <button
          onClick={() => {
            setEditingSupervisor(null);
            setDrawer("add");
          }}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 rounded-lg flex items-center gap-2"
        >
          <UserPlus size={16} />
          Add Supervisor
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-slate-400" size={16} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search supervisors…"
          className="pl-9 p-3 w-full rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white text-slate-700 border border-slate-300 rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">Name / Email</th>
              <th className="px-4 py-3 text-left">Team Size</th>
              <th className="px-4 py-3 text-left">Permissions</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map(
              /** @param {Supervisor} supervisor */
              (supervisor) => (
                <SupervisorRow
                  key={supervisor.id}
                  supervisor={supervisor}
                  onEdit={() => {
                    setEditingSupervisor(supervisor);
                    setDrawer("edit");
                  }}
                />
              )
            )}

            {!filtered.length && (
              <tr>
                <td className="py-6 text-center text-slate-500" colSpan={4}>
                  {isLoading ? "Loading…" : "No supervisors found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {drawer && (
        <SupervisorDrawer
          mode={drawer}
          supervisor={editingSupervisor ?? undefined}
          onClose={() => setDrawer(null)}
        />
      )}
    </div>
  );
}
