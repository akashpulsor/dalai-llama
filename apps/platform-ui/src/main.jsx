import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("❌ Root element #root not found in DOM");

ReactDOM.createRoot(rootEl).render(<App />);
