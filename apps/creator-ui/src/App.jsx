// @ts-nocheck
import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import CreatorShell from "./layout/CreatorShell.jsx";
import routes from "./routes.jsx";
import "./api/creatorEndpoints.js";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/callback" element={<Navigate to="/" replace />} />
        <Route path="/" element={<CreatorShell />}>
          {routes.map((route) => (
            <Route key={route.path || "index"} index={route.index} path={route.path} element={route.element} />
          ))}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
