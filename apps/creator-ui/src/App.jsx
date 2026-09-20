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
import AdminOpsPage from "./pages/AdminOpsPage.jsx";
import usePostHogIdentity from "./hooks/usePostHogIdentity.js";
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
  // Attach the current authed user + tenant to PostHog so session replays and
  // events are attributed to them instead of an anonymous distinct_id. No-op
  // when POSTHOG_API_KEY is unset (dev builds).
  usePostHogIdentity();

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
        {/* /admin is served under ops.dalaillama.in behind oauth2-proxy + dalai_admin (see
         * ops-virtualservice.yaml + ops-oauth2-authz.yaml). The Istio gate is the perimeter,
         * so this route MUST NOT sit behind ProtectedCreatorShell -- that shell uses creator-
         * ui's own Keycloak client (creator-ui) whose JWT the ops-dashboard flow never mints.
         * Sitting behind the shell caused the "Authenticated but nothing shows" loop
         * on ops.dalaillama.in/admin. AdminOpsPage does its own host check
         * (isServedOnOpsHost) so if it is loaded from creator.dalaillama.in it explains and
         * redirects the user. */}
        <Route path="/admin" element={<AdminOpsPage />} />
        <Route path="/" element={<ProtectedCreatorShell />}>
          {routes.filter((r) => r.path !== "admin").map((route) => (
            <Route key={route.path || "index"} index={route.index} path={route.path} element={route.element} />
          ))}
        </Route>
        <Route path="*" element={<Navigate to="/#ideas" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
