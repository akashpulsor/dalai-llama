# Creator UI Reuse Map

## Existing App Patterns

- Dashboard app: `apps/dashboard-ui`
  - `package.json`: `apps/dashboard-ui/package.json`
  - Vite config: `apps/dashboard-ui/vite.config.mjs`
  - HTML entry: `apps/dashboard-ui/index.html`
  - React entry: `apps/dashboard-ui/src/main.jsx`
  - App/router/auth shell: `apps/dashboard-ui/src/App.jsx`
  - CSS: `apps/dashboard-ui/src/index.css`
- Agents app: `apps/agents-ui`
  - Package name is `agent-ui` even though the folder is `agents-ui`.
  - React entry: `apps/agents-ui/src/main.jsx`
  - App/router/auth shell: `apps/agents-ui/src/App.jsx`
  - Package: `apps/agents-ui/package.json`

## Shared Packages

- `@dalaillama/shared-config`: `shared/config`
  - Main runtime config: `shared/config/appConfig.js`
  - Exports: `shared/config/index.js`
- `@dalaillama/shared-store`: `shared/store`
  - Store factory/default store: `shared/store/index.js`
  - Main RTK Query API: `shared/store/slices/apiSlice.js`
  - PBX RTK Query API: `shared/store/slices/pbxCoreApi.js`
  - Analytics RTK Query API: `shared/store/slices/analyticsApi.js`
  - Auth/tenant/UI state slices: `shared/store/slices/*.js`
- `@dalaillama/shared-hooks`: `shared/hooks`
  - Platform auth helpers: `shared/hooks/keycloakApi.js`
  - Dashboard auth bootstrap/guard: `shared/hooks/useAuthBootstrap.js`, `shared/hooks/useAuthGuard.js`
  - Tenant app auth/events: `shared/hooks/useTenantAuth.js`, `shared/hooks/useTenantEvents.js`, `shared/hooks/useStompEvents.js`
- `@dalaillama/shared-ui`: `shared/ui`
  - Error boundary/toaster/auth states: `shared/ui/ErrorBoundary.jsx`, `shared/ui/Toaster.jsx`, `shared/ui/components/AuthLoader.jsx`, `shared/ui/components/AuthError.jsx`
  - Forms: `shared/ui/components/FormInput.jsx`, `shared/ui/components/FormSelect.jsx`, `shared/ui/components/FormTextArea.jsx`
- `@dalaillama/shared-utils`: `shared/utils`
  - Logging/metrics/formatting/storage helpers: `shared/utils/*.js`

## Bootstrap Pattern Used

- `dashboard-ui` uses the shared default store from `@dalaillama/shared-store`, wraps React in `<Provider store={store}>`, and wraps the app in `ErrorBoundary`.
- `dashboard-ui` auth uses `useAuthBootstrap` for `/auth/callback` and `useAuthGuard` for protected routes.
- Creator UI mirrors the dashboard pattern because `creator.dalaillama.in` is a platform-style app, not a tenant-slug app.

## API Ownership

- `apiSlice.js`: platform, tenant, subscription, wallet, marketplace, and Creator UI endpoints.
- `pbxCoreApi.js`: PBX/contact-center domain such as agents, calls, bots, queues, campaigns, trunks.
- `analyticsApi.js`: reporting/analytics endpoints.

Creator endpoints are injected into `apiSlice.js` from `apps/creator-ui/src/api/creatorEndpoints.js`.

## Config Keys Confirmed

- `appConfig.API_BASE_URL`
- `appConfig.MOCK_MODE`
- `appConfig.DEMO_MODE`
- `appConfig.KEYCLOAK_URL`
- `appConfig.KEYCLOAK_REALM`
- `appConfig.KEYCLOAK_CLIENT_ID`
- `appConfig.REMOTE_APPS`
- `appConfig.APP_ROUTES`

Creator UI is a single shared app at `creator.dalaillama.in`. It does not use tenant slug subdomains.
