// @ts-nocheck
import { createSlice } from "@reduxjs/toolkit";

const steps = ["trend", "audience", "cast", "ideas", "storyboard"];

const initialState = {
  activeStep: "trend",
  completedSteps: { trend: false, audience: false, cast: false, ideas: false, storyboard: false },
  selectedTrendId: "trend-she-almost",
  selectedAudienceId: "audience-women-22-35-in",
  selectedCreatorId: "creator-priya",
  selectedIdeaId: "idea-she-almost",
  projectId: "project-she-almost",
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
      state.activeStep = "audience";
    },
    selectAudience(state, action) {
      state.selectedAudienceId = action.payload;
      state.completedSteps.audience = true;
      state.activeStep = "cast";
    },
    selectCreator(state, action) {
      state.selectedCreatorId = action.payload;
      state.completedSteps.cast = true;
      state.activeStep = "ideas";
    },
    selectIdea(state, action) {
      state.selectedIdeaId = action.payload;
      state.completedSteps.ideas = true;
      state.activeStep = "storyboard";
    },
    setProjectId(state, action) {
      state.projectId = action.payload;
      state.completedSteps.storyboard = true;
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
} = plannerSlice.actions;

export const selectCreatorPlanner = (state) => state.creatorPlanner;
export default plannerSlice.reducer;
