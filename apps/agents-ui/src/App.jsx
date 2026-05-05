import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useTenantAuth from '@dalaillama/shared-hooks/useTenantAuth.js';
import useTenantEvents from '@dalaillama/shared-hooks/useTenantEvents.js';
import { AuthLoader, AuthError } from '@dalaillama/shared-ui';
import AgentShell from './layouts/AgentShell.jsx';
import Console from './pages/Console.jsx';
import History from './pages/History.jsx';
import Profile from './pages/Profile.jsx';

export default function App() {
  const auth = useTenantAuth('agent');
  useTenantEvents({ source: 'agents-ui', broker: 'pbx-core' });

  if (auth.error) return <AuthError message={auth.error} />;
  if (!auth.isReady) return <AuthLoader message="Loading agent console" />;

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