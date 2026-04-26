import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { Provider } from "react-redux";
import store from "@dalaillama/shared-store";   // <-- IMPORTANT
import { ErrorBoundary } from "@dalaillama/shared-ui";
import "./index.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("❌ Root element #root not found in DOM");

let rootOwnedByReact = false;

const renderBootError = (error) => {
  const message = error instanceof Error ? error.message : String(error);
  rootEl.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f8fafc;padding:24px;font-family:system-ui,sans-serif;">
      <div style="max-width:720px;width:100%;background:white;border:1px solid #e2e8f0;border-radius:24px;padding:24px;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
        <h1 style="margin:0 0 12px;color:#b91c1c;font-size:24px;font-weight:800;">Dashboard failed to start</h1>
        <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6;">A runtime error occurred during application startup.</p>
        <pre style="margin:0;white-space:pre-wrap;word-break:break-word;background:#0f172a;color:#e2e8f0;border-radius:16px;padding:16px;font-size:12px;overflow:auto;">${message}</pre>
      </div>
    </div>
  `;
};

window.addEventListener("error", (event) => {
  console.error("[dashboard] Unhandled error during boot:", event.error || event.message);
  if (!rootOwnedByReact && (event.error || event.message)) {
    renderBootError(event.error || event.message);
  }
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("[dashboard] Unhandled promise rejection during boot:", event.reason);
  if (!rootOwnedByReact) {
    renderBootError(event.reason);
  }
});

try {
  console.log("[dashboard] Store ready:", !!store);
  const root = ReactDOM.createRoot(rootEl);
  rootOwnedByReact = true;
  root.render(
    <Provider store={store}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </Provider>
  );
} catch (error) {
  console.error("[dashboard] Fatal render error:", error);
  renderBootError(error);
}
