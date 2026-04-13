import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';

/**
 * @param {{ auth: import('@dalaillama/shared-hooks').TenantAuthResult }} props
 */
export default function AppLayout({ auth }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        expanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded(!sidebarExpanded)}
        features={auth.features}
        productCode={auth.productCode}
      />

      {/* Main content area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarExpanded ? 'ml-64' : 'ml-20'}`}>
        <Header
          auth={auth}
          sidebarExpanded={sidebarExpanded}
        />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
