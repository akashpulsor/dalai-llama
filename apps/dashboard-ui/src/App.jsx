import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster, AuthLoader, AuthError } from "@dalaillama/shared-ui";

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

const AuthCallbackPage = () => {
  const { status, error } = useAuthBootstrap();

  if (status === "authenticated") {
    return <Navigate to="/" replace />;
  }

  if (error) return <AuthError message={error} />;
  return <AuthLoader message="Signing you in" />;
};

const ProtectedProductPage = () => {
  const demo = safeGetLocalStorage("demo_mode") === "true";
  const { status } = useAuthGuard();
  useDashboardTenantBootstrap();
  useDashboardTenantEvents();

  if (status === "checking" || status === "redirecting") {
    return <AuthLoader message="Preparing dashboard" />;
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
