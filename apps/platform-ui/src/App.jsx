// apps/platform-ui/src/App.jsx
import React from "react";
import { Provider } from "react-redux";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { Toaster, ErrorBoundary } from "@dalaillama/shared-ui";
import { useAuthBootstrap } from "@dalaillama/shared-hooks";
import store from "@dalaillama/shared-store";

import { appConfig } from "@dalaillama/shared-config";

import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";

/* ------------------------------------------------------------
 * External redirect component
 * ------------------------------------------------------------ */

/**
 * @typedef {object} ExternalRedirectProps
 * @property {string} to
 */

/**
 * Redirects to external micro-app
 * @param {ExternalRedirectProps} props
 */
const ExternalRedirect = ({ to }) => {
  window.location.href = to;
  return null;
};

/* ------------------------------------------------------------
 * App-level routes
 * ------------------------------------------------------------ */
function AppRoutes() {
  useAuthBootstrap();

  const R = appConfig.APP_ROUTES;
  const REMOTE = appConfig.REMOTE_APPS;

  return (
    <>
      <Routes>
        {/* ---------- Public Screens ---------- */}
        <Route path={R.ROOT} element={<LandingPage />} />
        <Route path={R.LOGIN} element={<LoginPage />} />

        {/* ---------- Local screens inside platform-ui ---------- */}
        <Route path={R.PLATFORM} element={<div>Platform Home</div>} />

        {/* Generic tenant list screen inside platform-ui */}
        <Route path={R.TENANT} element={<div>Tenant List Placeholder</div>} />

        {/* ---------- Remote Micro-app Redirects ---------- */}
        {REMOTE.agent && (
          <Route
            path={`${R.AGENT}/*`}
            element={<ExternalRedirect to={REMOTE.agent} />}
          />
        )}

        {REMOTE.dashboard && (
          <Route
            path={`${R.DASHBOARD}/*`}
            element={<ExternalRedirect to={REMOTE.dashboard} />}
          />
        )}

        {REMOTE.analytics && (
          <Route
            path={`${R.ANALYTICS}/*`}
            element={<ExternalRedirect to={REMOTE.analytics} />}
          />
        )}

        {REMOTE.subscription && (
          <Route
            path={`${R.SUBSCRIPTION}/*`}
            element={<ExternalRedirect to={REMOTE.subscription} />}
          />
        )}

        {/* ---------- Catch-all fallback ---------- */}
        <Route path="*" element={<Navigate to={R.ROOT} replace />} />
      </Routes>

      <Toaster />
    </>
  );
}

/* ------------------------------------------------------------
 * Root App Component
 * ------------------------------------------------------------ */
export default function App() {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <Router>
          <AppRoutes />
        </Router>
      </ErrorBoundary>
    </Provider>
  );
}
