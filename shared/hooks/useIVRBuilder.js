// shared/hooks/useIVRBuilder.js
// --------------------------------------------------------------
//  IVR Editor Hook (Nodes, Edges, Selection)
// --------------------------------------------------------------

import store from "@dalaillama/shared-store";
import {
  addNode,
  updateNode,
  removeNode,
  addEdge,
  removeEdge,
  selectNode,
} from "@dalaillama/shared-store/slices/ivrSlice.js";

/**
 * @typedef {import("@dalaillama/shared-store/slices/ivrSlice.js").IVRNode} IVRNode
 * @typedef {import("@dalaillama/shared-store/slices/ivrSlice.js").IVREdge} IVREdge
 */

export function useIVRBuilder() {
  return {
    /** @returns {IVRNode[]} */
    get nodes() {
      return store.getState().ivr.nodes;
    },

    /** @returns {IVREdge[]} */
    get edges() {
      return store.getState().ivr.edges;
    },

    /** @returns {string|null} */
    get selectedNode() {
      return store.getState().ivr.selectedNode;
    },

    /** @param {IVRNode} node */
    addNode: (node) => store.dispatch(addNode(node)),

    /** @param {IVRNode} node */
    updateNode: (node) => store.dispatch(updateNode(node)),

    /** @param {string} id */
    removeNode: (id) => store.dispatch(removeNode(id)),

    /** @param {IVREdge} edge */
    addEdge: (edge) => store.dispatch(addEdge(edge)),

    /** @param {string} id */
    removeEdge: (id) => store.dispatch(removeEdge(id)),

    /** @param {string|null} id */
    selectNode: (id) => store.dispatch(selectNode(id)),
  };
}

export default useIVRBuilder;
