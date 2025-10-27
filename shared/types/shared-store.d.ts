declare module "@dalaillama/shared-store" {
  import type { EnhancedStore } from "@reduxjs/toolkit";
import type { AnyAction, ThunkDispatch } from "@reduxjs/toolkit";
 const store: EnhancedStore<any>;
  export default store;

    // extras re-exported from slices
  export function createStore(): EnhancedStore<any>;
  export const setUser: (payload: { user: any; token: string }) => AnyAction;
  export const logout: () => AnyAction;
  export const validateToken: () => AnyAction;
}
