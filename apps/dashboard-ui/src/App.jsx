import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import ProductPage from "./pages/ProductPage.jsx";
import PartnerLayout from "./pages/components/PartnerLayout.jsx";
import TenantOnboarding from "./pages/TenantOnboarding.jsx";
//import TenantsPage from "./pages/TenantsPage.jsx";

export default function App() {
  const demo = localStorage.getItem("demo_mode") === "true";

  return (
    <Router>
      <Routes>
        {/* Product selection page */}
        <Route path="/" element={<ProductPage demo={demo} />} />

        <Route path="/partner" element={<PartnerLayout />}>
            
        </Route>
        {/* Onboarding flow */}
        <Route path="/onboarding/*" element={<TenantOnboarding />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
