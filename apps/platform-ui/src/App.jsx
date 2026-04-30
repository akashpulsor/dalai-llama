// @ts-check
// apps/platform-ui/src/App.jsx
import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { Toaster, ErrorBoundary } from "@dalaillama/shared-ui";
import store from "@dalaillama/shared-store";
import { appConfig } from "@dalaillama/shared-config";
import { useExchangeTokenMutation } from "@dalaillama/shared-hooks/keycloakApi";

import LandingPage from "./pages/LandingPage.jsx";

/* ------------------------------------------------------------
 * OAuth Callback Handler
 * ------------------------------------------------------------ */
const AuthCallback = () => {
  const [exchangeToken] = useExchangeTokenMutation();

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");
      const error = params.get("error");

      if (error) {
        console.error("[Auth] OAuth error:", error);
        window.location.href = "/";
        return;
      }

      if (code && state) {
        try {
          // @ts-ignore - RTK Query queryFn types not inferred
          await exchangeToken({ code, state }).unwrap();
          const dashboardUrl = appConfig.REMOTE_APPS?.dashboard || "/dashboard";
          window.location.href = dashboardUrl;
        } catch (err) {
          console.error("[Auth] Token exchange failed:", err);
          window.location.href = "/";
        }
      } else {
        window.location.href = "/";
      }
    };

    handleCallback();
  }, [exchangeToken]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-xl sm:p-8">
        <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-purple-600 sm:h-12 sm:w-12" />
        <p className="text-sm text-gray-600 sm:text-base">Signing you in...</p>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------
 * External redirect component
 * ------------------------------------------------------------ */
/** @param {{ to: string }} props */
const ExternalRedirect = ({ to }) => {
  useEffect(() => {
    window.location.href = to;
  }, [to]);
  return null;
};

/* ------------------------------------------------------------
 * App-level routes
 * ------------------------------------------------------------ */
function AppRoutes() {
  const R = appConfig.APP_ROUTES;
  const REMOTE = appConfig.REMOTE_APPS;

  return (
    <>
      <Routes>
        <Route path={R.ROOT} element={<LandingPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path={R.LOGIN} element={<AuthCallback />} />
        <Route path={R.PLATFORM} element={<div>Platform Home</div>} />
        <Route path={R.TENANT} element={<div>Tenant List</div>} />
        {REMOTE.agent && <Route path={`${R.AGENT}/*`} element={<ExternalRedirect to={REMOTE.agent} />} />}
        {REMOTE.dashboard && <Route path={`${R.DASHBOARD}/*`} element={<ExternalRedirect to={REMOTE.dashboard} />} />}
        {REMOTE.analytics && <Route path={`${R.ANALYTICS}/*`} element={<ExternalRedirect to={REMOTE.analytics} />} />}
        {REMOTE.subscription && <Route path={`${R.SUBSCRIPTION}/*`} element={<ExternalRedirect to={REMOTE.subscription} />} />}
        <Route path="*" element={<Navigate to={R.ROOT} replace />} />
      </Routes>
      <Toaster />
    </>
  );
}

/* ------------------------------------------------------------
 * Root App
 * ------------------------------------------------------------ */
export default function App() {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <Router basename={typeof window !== 'undefined' && !window.location.pathname.startsWith('/platform') ? '/' : '/platform'}>
          <AppRoutes />
        </Router>
      </ErrorBoundary>
    </Provider>
  );
}
