import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import ProductPage from "./pages/ProductPage.jsx";

//import TenantsPage from "./pages/TenantsPage.jsx";
import { useAuthGuard } from "@dalaillama/shared-hooks";
export default function App() {
  const demo = localStorage.getItem("demo_mode") === "true";
  console.log("Added here");
const { status, user } = useAuthGuard();
    if (status === "checking" || status === "redirecting") {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin h-10 w-10 border-4 border-purple-600 rounded-full border-t-transparent" />
      </div>
   );
  }
  return (

    <Router basename="/dashboard">
      <Routes>
        {/* Product selection page */}
        <Route path="/" element={<ProductPage demo={demo} />} />



        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>

  );
}
