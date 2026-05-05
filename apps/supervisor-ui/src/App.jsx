// src/App.jsx
import React from "react";
import useTenantAuth from "@dalaillama/shared-hooks/useTenantAuth.js";
import useTenantEvents from "@dalaillama/shared-hooks/useTenantEvents.js";
import { AuthLoader, AuthError } from "@dalaillama/shared-ui";
import AppRoutes from "./routes/routes.jsx";

export default function App() {
  const auth = useTenantAuth('supervisor');
  useTenantEvents({ source: 'supervisor-ui', broker: 'pbx-core' });

  if (auth.error) return <AuthError message={auth.error} />;
  if (!auth.isReady) return <AuthLoader message="Loading supervisor panel" />;

  return <AppRoutes />;
}
