// @ts-nocheck
import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthError, AuthLoader } from "@dalaillama/shared-ui";
import { useAuthBootstrap, useAuthGuard } from "@dalaillama/shared-hooks";
import useTenantEvents from "@dalaillama/shared-hooks/useTenantEvents.js";
import CreatorShell from "./layout/CreatorShell.jsx";
import routes from "./routes.jsx";
import ClientFundingPage from "./pages/ClientFundingPage.jsx";
import ClientReviewPage from "./pages/ClientReviewPage.jsx";
import "./api/creatorEndpoints.js";

const AuthCallbackPage = () => {
  const { status, error } = useAuthBootstrap();

  if (status === "authenticated") {
    return <Navigate to="/#ideas" replace />;
  }

  if (error) return <AuthError message={error} />;
  return <AuthLoader message="Signing you in" />;
};

const ProtectedCreatorShell = () => {
  const { status } = useAuthGuard();
  useTenantEvents({ source: "creator-ui", broker: "tenant-service", topics: ["wallet", "billing", "apps"] });

  if (status === "checking" || status === "redirecting") {
    return <AuthLoader message="Preparing creator workspace" />;
  }

  return <CreatorShell />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        {/* Public, unauthenticated -- whoever holds the share link, not a tenant user. */}
        <Route path="/brief/:shareToken" element={<ClientFundingPage />} />
        <Route path="/review/:token" element={<ClientReviewPage />} />
        <Route path="/" element={<ProtectedCreatorShell />}>
          {routes.map((route) => (
            <Route key={route.path || "index"} index={route.index} path={route.path} element={route.element} />
          ))}
        </Route>
        <Route path="*" element={<Navigate to="/#ideas" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
