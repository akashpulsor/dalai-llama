import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useTenantAuth from '@dalaillama/shared-hooks/useTenantAuth.js';
import useWallet from '@dalaillama/shared-hooks/useWallet.js';
import useTenantEvents from '@dalaillama/shared-hooks/useTenantEvents.js';
import { AuthLoader, AuthError } from '@dalaillama/shared-ui';
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
  const auth = useTenantAuth('admin');
  useWallet();
  useTenantEvents({ source: 'admin-ui', broker: 'tenant-service' });
  useTenantEvents({ source: 'admin-ui', broker: 'pbx-core' });

  if (auth.error) return <AuthError message={auth.error} />;
  if (!auth.isReady) return <AuthLoader message="Loading admin panel" />;

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
