// @ts-nocheck
import React from "react";
import { Outlet } from "react-router-dom";
import CreatorTenantOnboardingModal from "../components/onboarding/CreatorTenantOnboardingModal.jsx";
import Sidebar from "./Sidebar.jsx";
import MobileTopBar from "./MobileTopBar.jsx";
import GlobalRechargeModal from "./GlobalRechargeModal.jsx";

export default function CreatorShell() {
  return (
    <div className="creator-app min-h-screen text-white">
      <Sidebar />
      <MobileTopBar />
      {/* Extra top padding on mobile (lg:pt-0 removes it on desktop) to leave room for the
          MobileTopBar's fixed header. Bottom padding remains for the mobile bottom nav. */}
      <main className="min-h-screen pb-24 pt-14 lg:pl-64 lg:pt-0">
        <Outlet />
      </main>
      <CreatorTenantOnboardingModal />
      <GlobalRechargeModal />
    </div>
  );
}
