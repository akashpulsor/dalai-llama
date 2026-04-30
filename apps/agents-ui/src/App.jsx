import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useTenantAuth from '@dalaillama/shared-hooks/useTenantAuth.js';
import AgentShell from './layouts/AgentShell.jsx';
import Console from './pages/Console.jsx';
import History from './pages/History.jsx';
import Profile from './pages/Profile.jsx';

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="text-center">
      <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Loading agent console...</p>
    </div>
  </div>
);

export default function App() {
  const auth = useTenantAuth('agent');

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

  if (!auth.isReady) return <PageLoader />;

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AgentShell auth={auth} />}>
          <Route index element={<Console auth={auth} />} />
          <Route path="history" element={<History />} />
          <Route path="profile" element={<Profile auth={auth} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}