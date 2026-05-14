// @ts-nocheck
import React from "react";
import { Navigate } from "react-router-dom";
import PlannerPage from "./pages/PlannerPage.jsx";

const routes = [
  { index: true, element: <PlannerPage /> },
  { path: "trends", element: <Navigate to="/#trends" replace /> },
  { path: "audience", element: <Navigate to="/#audience" replace /> },
  { path: "cast", element: <Navigate to="/#cast" replace /> },
  { path: "generate", element: <Navigate to="/#ideas" replace /> },
  { path: "storyboards", element: <Navigate to="/#storyboard" replace /> },
  { path: "storyboards/:projectId", element: <Navigate to="/#storyboard" replace /> },
  { path: "saved", element: <Navigate to="/#saved" replace /> },
  { path: "history", element: <Navigate to="/#history" replace /> },
];

export default routes;
