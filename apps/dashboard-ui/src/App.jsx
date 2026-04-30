import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@dalaillama/shared-ui";

import ProductPage from "./pages/ProductPage.jsx";
import { useAuthBootstrap, useAuthGuard } from "@dalaillama/shared-hooks";
import useDashboardTenantBootstrap from "./hooks/useDashboardTenantBootstrap.js";
import useDashboardTenantEvents from "./hooks/useDashboardTenantEvents.js";

const isSubdomainDeploy = typeof window !== 'undefined' && !window.location.pathname.startsWith('/dashboard');
const routerBasename = import.meta.env.DEV || isSubdomainDeploy ? "/" : "/dashboard";
const safeGetLocalStorage = (/** @type {string} */ key) => {
  try {
    return typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
  } catch (error) {
    console.error(`[dashboard] Unable to read localStorage key "${key}"`, error);
    return null;
  }
};

const FullScreenLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB] px-4">
    <div className="w-full max-w-sm rounded-[2rem] border border-purple-100 bg-white p-8 text-center shadow-[0_24px_80px_rgba(88,28,135,0.08)]">
      <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-[3px] border-purple-600/20 border-t-purple-600 shadow-[0_0_0_6px_rgba(168,85,247,0.08)]" />
      <h1 className="mb-2 text-lg font-bold text-slate-900">Preparing dashboard</h1>
      <p className="text-sm leading-6 text-slate-500">Loading your workspace and securing the session.</p>
    </div>
  </div>
);

const AuthCallbackPage = () => {
  const { status, error } = useAuthBootstrap();

  if (status === "authenticated") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB] px-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-xl sm:p-8">
        <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-[3px] border-purple-600/20 border-t-purple-600 shadow-[0_0_0_6px_rgba(168,85,247,0.08)]" />
        <h1 className="mb-2 text-base font-bold text-slate-900 sm:text-lg">Signing you in</h1>
        <p className="text-sm leading-6 text-slate-500 sm:text-base">
          {error || "Completing your Keycloak login flow."}
        </p>
      </div>
    </div>
  );
};

const ProtectedProductPage = () => {
  const demo = safeGetLocalStorage("demo_mode") === "true";
  const { status } = useAuthGuard();
  useDashboardTenantBootstrap();
  useDashboardTenantEvents();

  if (status === "checking" || status === "redirecting") {
    return <FullScreenLoader />;
  }

  return (
    <>
      <ProductPage demo={demo} />
      <Toaster />
    </>
  );
};

export default function App() {
  return (
    <Router basename={routerBasename}>
      <Routes>
        <Route path="/" element={<ProtectedProductPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
