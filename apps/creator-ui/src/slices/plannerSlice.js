// @ts-nocheck
import { createSlice } from "@reduxjs/toolkit";

const steps = ["trend", "ideas", "script", "screenplay", "cast", "audience", "storyboard"];

const initialState = {
  activeStep: "trend",
  completedSteps: { trend: false, ideas: false, script: false, screenplay: false, audience: false, cast: false, storyboard: false },
  selectedTrendId: "trend-she-almost",
  selectedAudienceId: "audience-women-22-35-in",
  selectedCreatorId: "creator-priya",
  selectedIdeaId: "idea-she-almost",
  projectId: null,
};

const plannerSlice = createSlice({
  name: "creatorPlanner",
  initialState,
  reducers: {
    setActiveStep(state, action) {
      const target = action.payload;
      if (steps.includes(target)) state.activeStep = target;
    },
    completeStep(state, action) {
      const step = action.payload;
      if (step in state.completedSteps) state.completedSteps[step] = true;
    },
    selectTrend(state, action) {
      state.selectedTrendId = action.payload;
      state.completedSteps.trend = true;
      state.activeStep = "trend";
    },
    selectAudience(state, action) {
      state.selectedAudienceId = action.payload;
      state.completedSteps.audience = true;
      state.activeStep = "storyboard";
    },
    selectCreator(state, action) {
      state.selectedCreatorId = action.payload;
      state.completedSteps.cast = true;
      state.activeStep = "audience";
    },
    selectIdea(state, action) {
      state.selectedIdeaId = action.payload;
      state.completedSteps.ideas = true;
    },
    setProjectId(state, action) {
      state.projectId = action.payload;
    },
    resetPlannerState(state) {
      state.activeStep = "trend";
      state.completedSteps = { trend: false, ideas: false, script: false, screenplay: false, audience: false, cast: false, storyboard: false };
      state.selectedTrendId = null;
      state.selectedAudienceId = null;
      state.selectedCreatorId = null;
      state.selectedIdeaId = null;
      state.projectId = null;
    },
    restorePlannerState(state, action) {
      const next = action.payload || {};
      if (steps.includes(next.activeStep)) {
        state.activeStep = next.activeStep;
      }
      if (next.completedSteps && typeof next.completedSteps === "object") {
        state.completedSteps = {
          ...state.completedSteps,
          ...Object.fromEntries(
            Object.entries(next.completedSteps).filter(([step]) => step in state.completedSteps)
          ),
        };
      }
      if (next.selectedTrendId) state.selectedTrendId = next.selectedTrendId;
      if (next.selectedAudienceId) state.selectedAudienceId = next.selectedAudienceId;
      if (next.selectedCreatorId) state.selectedCreatorId = next.selectedCreatorId;
      if (next.selectedIdeaId) state.selectedIdeaId = next.selectedIdeaId;
      state.projectId = next.projectId || null;
    },
  },
});

export const {
  setActiveStep,
  completeStep,
  selectTrend,
  selectAudience,
  selectCreator,
  selectIdea,
  setProjectId,
  resetPlannerState,
  restorePlannerState,
} = plannerSlice.actions;

export const selectCreatorPlanner = (state) => state.creatorPlanner;
export default plannerSlice.reducer;
