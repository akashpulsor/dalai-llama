import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import pbxCoreApi from '@dalaillama/shared-store/slices/pbxCoreApi.js';
import tenantReducer from '@dalaillama/shared-store/slices/tenantSlice.js';
import sipReducer from '@dalaillama/shared-store/slices/sipSlice.js';
import botTestReducer from '@dalaillama/shared-store/slices/botTestSlice.js';
import authReducer from '@dalaillama/shared-store/slices/authSlice.js';
import flashReducer from '@dalaillama/shared-store/slices/flashSlice.js';
import App from './App.jsx';
import './index.css';

const store = configureStore({
  reducer: {
    [pbxCoreApi.reducerPath]: pbxCoreApi.reducer,
    auth: authReducer,
    flash: flashReducer,
    tenant: tenantReducer,
    sip: sipReducer,
    botTest: botTestReducer,
  },
  middleware: (getDefault) => getDefault().concat(pbxCoreApi.middleware),
});

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>
  );
}
