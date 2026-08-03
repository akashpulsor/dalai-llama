// @ts-check
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import store from "@dalaillama/shared-store";
import { ErrorBoundary, Toaster } from "@dalaillama/shared-ui";
import App from "./App.jsx";
import "./index.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found");

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <Provider store={store}>
      <ErrorBoundary>
        <App />
        <Toaster />
      </ErrorBoundary>
    </Provider>
  </React.StrictMode>
);
