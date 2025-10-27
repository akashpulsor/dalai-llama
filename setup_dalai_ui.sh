#!/bin/bash
set -e

echo "🚀 Setting up Dalai Llama microfrontend workspace with Prometheus metrics..."

mkdir -p apps shared

# -----------------------------
# ROOT WORKSPACE CONFIG
# -----------------------------
cat > package.json <<'EOF'
{
  "name": "dalaillama-ui",
  "private": true,
  "workspaces": ["apps/*", "shared/*"],
  "type": "module",
  "scripts": {
    "dev:platform": "npm run dev --workspace=platform-ui",
    "dev:dashboard": "npm run dev --workspace=dashboard-ui",
    "build:platform": "npm run build --workspace=platform-ui",
    "build:dashboard": "npm run build --workspace=dashboard-ui"
  },
  "devDependencies": {
    "typescript": "^5.6.2"
  }
}
EOF

# -----------------------------
# SHARED CONFIG
# -----------------------------
mkdir -p shared/config
cat > shared/config/package.json <<'EOF'
{
  "name": "@dalaillama/shared-config",
  "version": "1.0.0",
  "private": true,
  "type": "module"
}
EOF

cat > shared/config/appConfig.js <<'EOF'
export const appConfig = {
  APP_NAME: "Dalai Llama",
  PLATFORM_URL: "https://dalaillama.in",
  API_BASE_URL: "https://api.dalaillama.in",
  DASHBOARD_DOMAIN: "dash.dalaillama.in",

  PROM_PUSH_URL: "https://prom.dalaillama.in/api/v1/push",
  PROM_JOB_NAME: "frontend_metrics",
  METRICS_INTERVAL_MS: 15000,
  REQUEST_TIMEOUT_MS: 10000,
  ENABLE_LOGGING: true,

  getDashboardUrl: (planType, id) => {
    if (planType === "shared") return `https://dash.dalaillama.in/s/${id}`;
    if (planType === "single") return `https://dash.dalaillama.in/t/${id}`;
    return "https://dalaillama.in";
  }
};
EOF

# -----------------------------
# SHARED UTILS
# -----------------------------
mkdir -p shared/utils
cat > shared/utils/package.json <<'EOF'
{
  "name": "@dalaillama/shared-utils",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "jwt-decode": "^4.0.0",
    "@dalaillama/shared-config": "1.0.0"
  }
}
EOF

cat > shared/utils/logger.js <<'EOF'
import { appConfig } from "@dalaillama/shared-config";
export const log = (...args) => appConfig.ENABLE_LOGGING && console.log("[DL]", ...args);
export const logError = (e, ...rest) => appConfig.ENABLE_LOGGING && console.error("[DL]", e, ...rest);
EOF

cat > shared/utils/metrics.js <<'EOF'
import { appConfig } from "@dalaillama/shared-config";
import { logError } from "./logger.js";

class PrometheusClient {
  constructor(baseUrl = appConfig.PROM_PUSH_URL) {
    this.baseUrl = baseUrl;
    this.job = appConfig.PROM_JOB_NAME;
  }

  async push(metric, labels = {}, value = 1) {
    try {
      const payload = {
        job: this.job,
        instance: window.location.hostname,
        metric,
        labels,
        value,
        timestamp: Date.now()
      };
      await fetch(this.baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      logError("Prometheus push failed:", err);
    }
  }

  async pushError(error, origin = "ui") {
    return this.push("frontend_error_total", { origin, message: error?.message || String(error) }, 1);
  }

  async pushLatency(name, durationMs, labels = {}) {
    return this.push(name, { ...labels, unit: "ms" }, durationMs);
  }

  async pushHeartbeat() {
    return this.push("frontend_up", { app: appConfig.APP_NAME }, 1);
  }

  async pushTokenStatus(valid = true) {
    return this.push("frontend_auth_status", { valid: valid ? "1" : "0" }, 1);
  }
}

export const prometheusClient = new PrometheusClient();
EOF

cat > shared/utils/index.js <<'EOF'
export * from "./logger.js";
export * from "./metrics.js";
EOF

# -----------------------------
# SHARED STORE
# -----------------------------
mkdir -p shared/store/slices
cat > shared/store/package.json <<'EOF'
{
  "name": "@dalaillama/shared-store",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "@reduxjs/toolkit": "^2.2.7",
    "react-redux": "^9.1.2",
    "jwt-decode": "^4.0.0",
    "@dalaillama/shared-config": "1.0.0",
    "@dalaillama/shared-utils": "1.0.0"
  }
}
EOF

cat > shared/store/index.js <<'EOF'
import { configureStore } from "@reduxjs/toolkit";
import { api } from "./slices/apiSlice.js";
import authReducer from "./slices/authSlice.js";
import flashReducer from "./slices/flashSlice.js";

export const createStore = () =>
  configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
      auth: authReducer,
      flash: flashReducer
    },
    middleware: (getDefault) => getDefault().concat(api.middleware)
  });

export * from "./slices/apiSlice.js";
export * from "./slices/authSlice.js";
export * from "./slices/flashSlice.js";
EOF

# --- apiSlice with metrics ---
cat > shared/store/slices/apiSlice.js <<'EOF'
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { appConfig } from "@dalaillama/shared-config";
import { logout } from "./authSlice.js";
import { showFlash } from "./flashSlice.js";
import { prometheusClient } from "@dalaillama/shared-utils";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: appConfig.API_BASE_URL,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("auth_token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  }
});

const baseQueryWithMetrics = async (args, api, extra) => {
  const start = performance.now();
  const result = await rawBaseQuery(args, api, extra);
  const latency = performance.now() - start;

  prometheusClient.pushLatency("frontend_api_latency_ms", latency, {
    endpoint: typeof args === "string" ? args : args.url || "unknown"
  });

  if (result.error) {
    const status = result.error.status;
    prometheusClient.push("frontend_api_error_total", { status }, 1);

    if (status === 401 || status === 403) {
      api.dispatch(logout());
      api.dispatch(showFlash({ message: "Session expired.", type: "error" }));
    } else if (status >= 500) {
      api.dispatch(showFlash({ message: "Server error", type: "error" }));
    }
  }
  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithMetrics,
  endpoints: (builder) => ({
    getHealth: builder.query({ query: () => "/health" })
  })
});

export const { useGetHealthQuery } = api;
EOF

# --- authSlice with token validation ---
cat > shared/store/slices/authSlice.js <<'EOF'
import { createSlice } from "@reduxjs/toolkit";
import jwtDecode from "jwt-decode";
import { appConfig } from "@dalaillama/shared-config";
import { prometheusClient } from "@dalaillama/shared-utils";

const tokenExpired = (token) => {
  try {
    const { exp } = jwtDecode(token);
    return exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

const initialState = {
  user: null,
  token: localStorage.getItem("auth_token") || null
};

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action) {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      localStorage.setItem("auth_token", token);
    },
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem("auth_token");
      window.location.href = `${appConfig.PLATFORM_URL}/login`;
    },
    validateToken(state) {
      const token = localStorage.getItem("auth_token");
      const expired = !token || tokenExpired(token);
      prometheusClient.pushTokenStatus(!expired);
      if (expired) {
        localStorage.removeItem("auth_token");
        window.location.href = `${appConfig.PLATFORM_URL}/login`;
      }
    }
  }
});

export const { setUser, logout, validateToken } = slice.actions;
export default slice.reducer;
EOF

# --- flashSlice ---
cat > shared/store/slices/flashSlice.js <<'EOF'
import { createSlice } from "@reduxjs/toolkit";
const slice = createSlice({
  name: "flash",
  initialState: { message: null, type: "info" },
  reducers: {
    showFlash(state, action) {
      state.message = action.payload.message;
      state.type = action.payload.type || "info";
    },
    clearFlash(state) {
      state.message = null;
    }
  }
});
export const { showFlash, clearFlash } = slice.actions;
export default slice.reducer;
EOF

# -----------------------------
# SHARED UI (Flash + Logout + ErrorBoundary)
# -----------------------------
mkdir -p shared/ui
cat > shared/ui/package.json <<'EOF'
{
  "name": "@dalaillama/shared-ui",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "@dalaillama/shared-store": "1.0.0",
    "@dalaillama/shared-utils": "1.0.0",
    "react": "^18.3.1",
    "react-redux": "^9.1.2",
    "lucide-react": "^0.452.0"
  }
}
EOF

cat > shared/ui/ErrorBoundary.jsx <<'EOF'
import React from "react";
import { prometheusClient } from "@dalaillama/shared-utils";
export class ErrorBoundary extends React.Component {
  constructor(p){super(p);this.state={hasError:false};}
  static getDerivedStateFromError(){return{hasError:true};}
  async componentDidCatch(e,i){
    console.error("UI crash:",e,i);
    await prometheusClient.pushError(e,"render");
  }
  render(){
    if(this.state.hasError)
      return <div className="h-screen flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-3">Something went wrong</h2>
        <p>Try refreshing or contact support.</p></div>;
    return this.props.children;
  }
}
EOF

# -----------------------------
# SHARED HOOKS (with heartbeat)
# -----------------------------
mkdir -p shared/hooks
cat > shared/hooks/package.json <<'EOF'
{
  "name": "@dalaillama/shared-hooks",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "@dalaillama/shared-store": "1.0.0",
    "@dalaillama/shared-utils": "1.0.0",
    "@dalaillama/shared-config": "1.0.0",
    "react": "^18.3.1"
  }
}
EOF

cat > shared/hooks/useMetricsHeartbeat.js <<'EOF'
import { useEffect } from "react";
import { prometheusClient } from "@dalaillama/shared-utils";
import { appConfig } from "@dalaillama/shared-config";

export const useMetricsHeartbeat = () => {
  useEffect(() => {
    prometheusClient.pushHeartbeat();
    const id = setInterval(() => prometheusClient.pushHeartbeat(), appConfig.METRICS_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);
};
EOF

echo "✅ All Prometheus hooks integrated!"
echo "👉 Next steps:"
echo "1. npm install"
echo "2. npm run dev:platform"
echo "3. npm run dev:dashboard"
