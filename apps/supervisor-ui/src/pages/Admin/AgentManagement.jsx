// src/pages/admin/AgentManagement/AgentManagement.jsx
import React, { useState, useMemo } from "react";
import { UserPlus, Search } from "lucide-react";

import AgentRow from "../../components/layout/AgentRow.jsx";
import AgentDrawer from "../../components/layout/AgentDrawer.jsx";
import { useGetAgentsQuery } from "@dalaillama/shared-store";

/**
 * @typedef {Object} Agent
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} mobile
 * @property {string[]} skills
 * @property {string[]} queues
 * @property {"Active" | "Disabled"} status
 * @property {number} maxCalls
 * @property {number} maxChats
 * @property {string} [sipUser]
 * @property {string} [sipPass]
 * @property {number} [proficiency]
 */

/** @typedef {"add" | "edit" | null} DrawerMode */

export default function AgentManagement() {
  const { data: agents = [], isLoading } = useGetAgentsQuery();

  /** @type {[DrawerMode, React.Dispatch<React.SetStateAction<DrawerMode>>]} */
  const [drawer, setDrawer] = useState(
    /** @type {DrawerMode} */ (null)
  );

  /** @type {[Agent | null, React.Dispatch<React.SetStateAction<Agent | null>>]} */
  const [editingAgent, setEditingAgent] = useState(
    /** @type {Agent | null} */ (null)
  );

  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("");

  const filteredAgents = useMemo(() => {
    return agents.filter(
      /** @param {Agent} a */
      (a) => {
        const matchesSearch =
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.email.toLowerCase().includes(search.toLowerCase());

        const matchesSkill = !skillFilter || a.skills.includes(skillFilter);

        return matchesSearch && matchesSkill;
      }
    );
  }, [agents, search, skillFilter]);

  return (
    <div className="p-6 space-y-6 text-slate-100">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Agent Management</h1>

        <button
          onClick={() => {
            setEditingAgent(null);
            setDrawer("add");
          }}
          className="px-4 py-2 bg-sky-600 text-white rounded-lg flex items-center gap-2 hover:bg-sky-700"
        >
          <UserPlus size={16} />
          Add Agent
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-slate-400" size={16} />
          <input
            placeholder="Search agents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 p-3 w-full rounded-lg border border-slate-800 bg-slate-900 text-slate-100"
          />
        </div>

        <select
          value={skillFilter}
          onChange={(e) => setSkillFilter(e.target.value)}
          className="p-3 rounded-lg border border-slate-800 bg-slate-900 text-slate-100"
        >
          <option value="">All Skills</option>
          <option value="Sales">Sales</option>
          <option value="Support">Support</option>
          <option value="Billing">Billing</option>
          <option value="English">English</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white text-slate-700 border border-slate-300 rounded-xl overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3">Name / Email</th>
                <th className="text-left px-4 py-3">Skills</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredAgents.map(
                /** @param {Agent} agent */
                (agent) => (
                  <AgentRow
                    key={agent.id}
                    agent={agent}
                    onEdit={() => {
                      setEditingAgent(agent);
                      setDrawer("edit");
                    }}
                  />
                )
              )}

              {!filteredAgents.length && (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-slate-500">
                    {isLoading ? "Loading agents…" : "No agents found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRAWER */}
      {drawer && (
        <AgentDrawer
          mode={drawer}
          agent={editingAgent ?? undefined}
          onClose={() => setDrawer(null)}
        />
      )}
    </div>
  );
}
