// @ts-nocheck
import React from "react";
import { Navigate } from "react-router-dom";
import PlannerPage from "./pages/PlannerPage.jsx";
import PatchEditorPage from "./pages/PatchEditorPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import BrandPage from "./pages/BrandPage.jsx";
import ProjectRequirementPage from "./pages/ProjectRequirementPage.jsx";
import ProjectPage from "./pages/ProjectPage.jsx";
import WalletBillingPage from "./pages/WalletBillingPage.jsx";
import CastLibraryPage from "./pages/CastLibraryPage.jsx";

const routes = [
  { index: true, element: <HomePage /> },
  { path: "planner", element: <PlannerPage /> },
  { path: "brand", element: <BrandPage /> },
  { path: "wallet-billing", element: <WalletBillingPage /> },
  { path: "cast-library", element: <CastLibraryPage /> },
  { path: "home", element: <Navigate to="/" replace /> },
  { path: "requirements/:requirementId", element: <ProjectRequirementPage /> },
  { path: "projects/:projectId", element: <ProjectPage /> },
  { path: "editor", element: <PatchEditorPage /> },
  { path: "patch-editor", element: <Navigate to="/editor" replace /> },
  { path: "generate-shorts", element: <Navigate to="/#projects" replace /> },
  { path: "shorts-history", element: <Navigate to="/#projects" replace /> },
  { path: "shorts", element: <Navigate to="/#projects" replace /> },
  { path: "trends", element: <Navigate to="/#ideas" replace /> },
  { path: "generated-ideas", element: <Navigate to="/#generated-ideas" replace /> },
  { path: "storyline", element: <Navigate to="/#script" replace /> },
  { path: "script", element: <Navigate to="/#screenplay" replace /> },
  { path: "audience", element: <Navigate to="/#audience" replace /> },
  { path: "cast", element: <Navigate to="/#cast" replace /> },
  { path: "generate", element: <Navigate to="/#ideas" replace /> },
  { path: "storyboards", element: <Navigate to="/#storyboard" replace /> },
  { path: "storyboards/:projectId", element: <Navigate to="/#storyboard" replace /> },
  { path: "saved", element: <Navigate to="/#saved" replace /> },
  { path: "history", element: <Navigate to="/#history" replace /> },
];

export default routes;
