// src/App.jsx
import React from "react";
import { useAuthBootstrap } from "@dalaillama/shared-hooks";
import AppRoutes from "./routes/routes.jsx";

/**
 * @typedef {object} AuthGateProps
 * @property {React.ReactNode} children
 */

/** @param {AuthGateProps} props */
function AuthGate({ children }) {
  useAuthBootstrap();
  return children;
}


export default function App() {
  return (
    <AuthGate>
      <AppRoutes />
    </AuthGate>
  );
}
