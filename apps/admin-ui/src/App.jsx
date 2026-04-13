import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useTenantAuth from '@dalaillama/shared-hooks/useTenantAuth.js';
import AppLayout from './layouts/AppLayout.jsx';
import { lazy, Suspense } from 'react';

// Lazy-loaded pages
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Agents = lazy(() => import('./pages/Agents.jsx'));
const Bots = lazy(() => import('./pages/Bots.jsx'));
const BotTest = lazy(() => import('./pages/BotTest.jsx'));
const Campaigns = lazy(() => import('./pages/Campaigns.jsx'));
const Queues = lazy(() => import('./pages/Queues.jsx'));
const Calls = lazy(() => import('./pages/Calls.jsx'));
const Routing = lazy(() => import('./pages/Routing.jsx'));
const Billing = lazy(() => import('./pages/Billing.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-full">
    <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  //const auth = useTenantAuth('admin');
  // TEMPORARY: Comment out real auth, use mock
// const auth = useTenantAuth('admin');

const auth = {
  isReady: true,
  isAuthenticated: true,
  user: { display_name: 'Akash Admin', email: 'akash@acme.com', role: 'TENANT_ADMIN', extension: '1001' },
  tenantId: 'demo-tenant-id',
  productCode: 'AI_CC',
  features: {
    ai_bot: true, recording: true, campaigns: true, whisper: true, barge: true,
    listen: true, live_transcript: true, softphone: true, queue_management: true,
    bot_management: true, bot_testing: true, routing_policies: true, sip_trunks: true,
    max_agents: 15, max_queues: 10, max_channels: 30, max_ai_minutes: 5000,
  },
  token: 'mock-token',
  keycloak: null,
  error: null,
  logout: () => console.log('logout'),
};

  if (auth.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-3xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Configuration Error</h1>
          <p className="text-slate-500 text-sm">{auth.error}</p>
        </div>
      </div>
    );
  }

  if (!auth.isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout auth={auth} />}>
          <Route index element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
          <Route path="agents/*" element={<Suspense fallback={<PageLoader />}><Agents /></Suspense>} />
          <Route path="bots/*" element={<Suspense fallback={<PageLoader />}><Bots /></Suspense>} />
          <Route path="bot-test" element={<Suspense fallback={<PageLoader />}><BotTest /></Suspense>} />
          <Route path="campaigns/*" element={<Suspense fallback={<PageLoader />}><Campaigns /></Suspense>} />
          <Route path="queues/*" element={<Suspense fallback={<PageLoader />}><Queues /></Suspense>} />
          <Route path="calls" element={<Suspense fallback={<PageLoader />}><Calls /></Suspense>} />
          <Route path="routing" element={<Suspense fallback={<PageLoader />}><Routing /></Suspense>} />
          <Route path="billing" element={<Suspense fallback={<PageLoader />}><Billing /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
