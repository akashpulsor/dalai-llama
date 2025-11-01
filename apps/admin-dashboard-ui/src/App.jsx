// apps/platform-ui/src/App.jsx
import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster, ErrorBoundary } from "@dalaillama/shared-ui";
import { useAuthBootstrap } from "@dalaillama/shared-hooks";
import store from "@dalaillama/shared-store";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";

function AppRoutes() {
  // ✅ Now inside Router → useNavigate() will work
  useAuthBootstrap();

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
            {/* ✅ Catch-all — ensures fallback to Landing Page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        {/* ✅ Router wraps the hook */}
        <Router>
          <AppRoutes />
        </Router>
      </ErrorBoundary>
    </Provider>
  );
}
