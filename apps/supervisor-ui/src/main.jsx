import store from "@dalaillama/shared-store";
import App from "./App.jsx";
import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";

const rootEl = document.getElementById("root");

if (!rootEl) {
  throw new Error("Root element #root not found in index.html");
}

ReactDOM.createRoot(rootEl).render(
  <Provider store={store}>
       <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
 
  
);
