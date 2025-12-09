// apps/dashboard-ui/src/components/PartnerSideNav.jsx
import React from "react";
import {
  Server,
  Cloud,
  CreditCard,
  PhoneCall,
  Building2,
  ShieldCheck,
  Users,
  Globe,
  UploadCloud,
  LogOut,
  Menu,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Collapsible Partner Sidebar
 * @param {{ open: boolean, setOpen: (v:boolean)=>void }} props
 */
export default function PartnerSideNav({ open, setOpen }) {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { label: "Manage Tenants", path: "/partner/tenants", icon: Users },
    { label: "Cloud Connection", path: "/partner/cloud", icon: Cloud },
    { label: "DID Inventory", path: "/partner/dids", icon: PhoneCall },
    { label: "Upload DID Inventory", path: "/partner/dids/upload", icon: UploadCloud },
    { label: "Billing & Licenses", path: "/partner/billing", icon: CreditCard },
    { label: "Trunks", path: "/partner/trunks", icon: Server },
    { label: "Compliance", path: "/partner/compliance", icon: ShieldCheck },
    { label: "Branding / Domain", path: "/partner/branding", icon: Globe },
  ];

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    navigate("/");
  };

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-40 bg-white bg-opacity-95 border-r-2 border-purple-200 shadow-xl transition-all duration-300
      ${open ? "w-72" : "w-20"}`}
    >
      <div className="h-full flex flex-col p-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`rounded-2xl flex items-center justify-center bg-purple-200 shadow-md text-3xl
              ${open ? "w-14 h-14" : "w-10 h-10"}`}
            >
              🦙
            </div>

            {open && (
              <div>
                <div className="text-lg font-bold text-purple-700">Partner Panel</div>
                <div className="text-xs text-gray-500">Dalai Llama</div>
              </div>
            )}
          </div>

          {/* collapse toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded hover:bg-gray-100"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto space-y-1">
          {items.map((item) => {
            const active =
              location.pathname === item.path ||
              location.pathname.startsWith(item.path + "/");

            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition
                  ${
                    active
                      ? "bg-purple-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-purple-50"
                  }`}
              >
                <Icon size={18} />
                {open && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 mt-4"
        >
          <LogOut size={16} />
          {open && <span>Logout</span>}
        </button>

        <div className="mt-4 text-xs text-gray-500 text-center">
          © {new Date().getFullYear()} Dalai Llama
        </div>
      </div>
    </aside>
  );
}
