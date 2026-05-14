// @ts-nocheck
import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";

export default function CreatorShell() {
  return (
    <div className="creator-app min-h-screen text-white">
      <Sidebar />
      <main className="min-h-screen pb-24 lg:pl-64">
        <Outlet />
      </main>
    </div>
  );
}
