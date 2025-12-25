// apps/dashboard-ui/src/pages/partner/TenantsPage.jsx
import React from "react";
import  { useGetTenantsQuery } from "@dalaillama/shared-store"; //useGetTenantsQuery  from "@dalaillama/shared-store";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  PlusCircle,
  Building2,
  ArrowRight,
} from "lucide-react";

/**
 * Single tenant card
 * @param {{tenant: {id: string, name: string, plan: string}, onClick: ()=>void}} props
 */
function TenantCard({ tenant, onClick }) {
  return (
    <div
      className="p-6 bg-white rounded-2xl shadow-md border border-purple-200 hover:shadow-xl hover:scale-[1.01] transition cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className="bg-purple-100 text-purple-700 p-4 rounded-xl shadow-inner">
          <Building2 size={28} />
        </div>

        <div className="flex-1">
          <h3 className="text-xl font-semibold text-purple-700">{tenant.name}</h3>
          <p className="text-gray-600 text-sm">Tenant ID: {tenant.id}</p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              tenant.plan === "shared"
                ? "bg-blue-100 text-blue-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {tenant.plan === "shared" ? "Shared Cloud" : "Dedicated Cloud"}
          </span>

          <ArrowRight size={20} className="text-gray-500" />
        </div>
      </div>
    </div>
  );
}

/**
 * Tenants list page - Partner can view & select tenants
 */
export default function TenantsPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetTenantsQuery();

  const [search, setSearch] = React.useState("");

  
/** @type {Array<{ id: string, name: string, plan: string, status?: string }>} */
const filtered =
  data?.filter(
    /** @param {{ id: string, name: string, plan: string, status?: string }} t */
    (t) => t.name.toLowerCase().includes(search.toLowerCase())
  ) || [];
  
  return (
    <div className="min-h-screen">

      {/* Header Section */}
      <div className="bg-purple-600 text-white p-8 rounded-3xl shadow-xl mb-8">
        <div className="flex items-center gap-4">
          <Users size={40} />
          <div>
            <h1 className="text-3xl font-bold">Manage Tenants</h1>
            <p className="text-purple-200 mt-1">
              View, manage, and configure tenants onboarded to your platform.
            </p>
          </div>
        </div>
      </div>

      {/* Search + Create Row */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute top-3 left-3 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search tenants..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-purple-600"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          onClick={() => navigate("/partner/tenant/create")}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl shadow-md"
        >
          <PlusCircle size={20} />
          New Tenant
        </button>
      </div>

      {/* Tenants List */}
      {isLoading && (
        <div className="text-center text-gray-600 py-10">Loading tenants...</div>
      )}

      {error && (
        <div className="text-center text-red-600 py-10">
          Failed to load tenants.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((tenant) => (
          <TenantCard
            key={tenant.id}
            tenant={tenant}
            onClick={() => navigate(`/partner/tenants/${tenant.id}`)}
          />
        ))}
      </div>

      {filtered.length === 0 && !isLoading && (
        <p className="text-center text-gray-500 mt-10">No tenants found.</p>
      )}
    </div>
  );
}
