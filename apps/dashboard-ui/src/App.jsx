import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import ProductPage from "./pages/ProductPage.jsx";
import { useAuthBootstrap, useAuthGuard } from "@dalaillama/shared-hooks";

const routerBasename = import.meta.env.DEV ? "/" : "/dashboard";

const FullScreenLoader = () => (
  <div className="flex h-screen items-center justify-center bg-gray-50 px-4">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
  </div>
);

const AuthCallbackPage = () => {
  const { status, error } = useAuthBootstrap();

  if (status === "authenticated") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-xl sm:p-8">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
        <h1 className="mb-2 text-base font-semibold text-slate-900 sm:text-lg">Signing you in</h1>
        <p className="text-sm leading-6 text-slate-500 sm:text-base">
          {error || "Completing your Keycloak login flow."}
        </p>
      </div>
    </div>
  );
};

const ProtectedProductPage = () => {
  const demo = localStorage.getItem("demo_mode") === "true";
  const { status } = useAuthGuard();

  if (status === "checking" || status === "redirecting") {
    return <FullScreenLoader />;
  }

  return <ProductPage demo={demo} />;
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
