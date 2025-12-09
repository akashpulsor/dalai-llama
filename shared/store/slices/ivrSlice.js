// shared/store/slices/ivrSlice.js
// --------------------------------------------------------------
// IVR Flow Builder Slice
// --------------------------------------------------------------

import { createSlice } from "@reduxjs/toolkit";

/**
 * @typedef {"entry"|"menu"|"playback"|"transfer"} IVRNodeType
 */

/**
 * @typedef {object} IVRNode
 * @property {string} id
 * @property {IVRNodeType} type
 * @property {string} label
 * @property {Record<string, any>} config
 */

/**
 * @typedef {object} IVREdge
 * @property {string} id
 * @property {string} from
 * @property {string} to
 * @property {string} condition
 */

/**
 * @typedef {object} IVRState
 * @property {IVRNode[]} nodes
 * @property {IVREdge[]} edges
 * @property {string|null} selectedNode
 */

/** @type {IVRState} */
const initialState = {
  nodes: [],
  edges: [],
  selectedNode: null,
};

const ivrSlice = createSlice({
  name: "ivr",
  initialState,
  reducers: {
    /**
     * @param {IVRState} state
     * @param {{payload: IVRNode}} action
     */
    addNode(state, action) {
      state.nodes.push(action.payload);
    },

    /**
     * @param {IVRState} state
     * @param {{payload: IVRNode}} action
     */
    updateNode(state, action) {
      const node = action.payload;
      const idx = state.nodes.findIndex((n) => n.id === node.id);
      if (idx >= 0) state.nodes[idx] = { ...state.nodes[idx], ...node };
    },

    /**
     * @param {IVRState} state
     * @param {{payload: string}} action
     */
    removeNode(state, action) {
      const id = action.payload;
      state.nodes = state.nodes.filter((n) => n.id !== id);
      state.edges = state.edges.filter((e) => e.from !== id && e.to !== id);
    },

    /**
     * @param {IVRState} state
     * @param {{payload: IVREdge}} action
     */
    addEdge(state, action) {
      state.edges.push(action.payload);
    },

    /**
     * @param {IVRState} state
     * @param {{payload: string}} action
     */
    removeEdge(state, action) {
      state.edges = state.edges.filter((e) => e.id !== action.payload);
    },

    /**
     * @param {IVRState} state
     * @param {{payload: string|null}} action
     */
    selectNode(state, action) {
      state.selectedNode = action.payload;
    },

    resetIVR() {
      return initialState;
    },
  },
});

export const {
  addNode,
  updateNode,
  removeNode,
  addEdge,
  removeEdge,
  selectNode,
  resetIVR,
} = ivrSlice.actions;

export default ivrSlice.reducer;
