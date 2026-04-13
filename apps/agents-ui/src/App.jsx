import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AgentShell from './layouts/AgentShell.jsx';
import Console from './pages/Console.jsx';
import History from './pages/History.jsx';
import Profile from './pages/Profile.jsx';

const AUTH = {
  isReady: true, isAuthenticated: true,
  user: { display_name: 'Priya Sharma', email: 'priya@acme.com', role: 'AGENT', extension: '1001', tenant_id: 'demo' },
  tenantId: 'demo', productCode: 'AI_CC', token: 'mock',
  features: { softphone: true, live_transcript: true, recording: true },
  logout: () => window.location.reload(),
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AgentShell auth={AUTH} />}>
          <Route index element={<Console auth={AUTH} />} />
          <Route path="history" element={<History />} />
          <Route path="profile" element={<Profile auth={AUTH} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}