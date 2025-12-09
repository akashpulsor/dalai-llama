// apps/dashboard-ui/src/layouts/PartnerLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import PartnerSideNav from "../components/PartnerSideNav.jsx";


export default function PartnerLayout() {
  const [open, setOpen] = React.useState(true);

  return (
    <div className="flex min-h-screen bg-[#d3d3d3]">
      <PartnerSideNav open={open} setOpen={setOpen} />
      <main
        className={`flex-1 p-6 transition-all duration-300 ${
          open ? "md:ml-72" : "md:ml-20"
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
