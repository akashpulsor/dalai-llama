import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Bot, FlaskConical, Megaphone, Layers,
  Phone, GitBranch, CreditCard, Settings, ChevronLeft, ChevronRight,
  Zap,
} from 'lucide-react';

/**
 * @param {{ expanded: boolean, onToggle: () => void,
 *           features: Record<string, any>, productCode: string|null }} props
 */
export default function Sidebar({ expanded, onToggle, features, productCode }) {
  const location = useLocation();

  /** @type {Array<{to: string, icon: any, label: string, feature?: string}>} */
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/agents', icon: Users, label: 'Agents', feature: 'queue_management' },
    { to: '/bots', icon: Bot, label: 'Bots', feature: 'bot_management' },
    { to: '/bot-test', icon: FlaskConical, label: 'Bot Testing', feature: 'bot_testing' },
    { to: '/campaigns', icon: Megaphone, label: 'Campaigns', feature: 'campaigns' },
    { to: '/queues', icon: Layers, label: 'Queues', feature: 'queue_management' },
    { to: '/calls', icon: Phone, label: 'Call Records' },
    { to: '/routing', icon: GitBranch, label: 'Routing', feature: 'routing_policies' },
    { to: '/billing', icon: CreditCard, label: 'Billing' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const visibleItems = navItems.filter((item) => {
    if (!item.feature) return true;
    return !!features[item.feature];
  });

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-100 shadow-sm z-40 transition-all duration-300 flex flex-col ${expanded ? 'w-64' : 'w-20'}`}>
      {/* Logo */}
      <div className={`h-16 flex items-center border-b border-slate-100 ${expanded ? 'px-6' : 'px-0 justify-center'}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-violet-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          {expanded && (
            <div className="overflow-hidden">
              <p className="font-bold text-slate-900 text-sm leading-tight">Dalai LLAMA</p>
              <p className="text-[10px] text-primary-600 font-semibold uppercase tracking-wider">Admin</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="space-y-1 px-3">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-xl transition-all duration-200 group relative ${
                  expanded ? 'px-4 py-2.5' : 'px-0 py-2.5 justify-center'
                } ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                {expanded && (
                  <span className={`text-sm font-medium ${isActive ? 'text-primary-700' : ''}`}>
                    {item.label}
                  </span>
                )}
                {!expanded && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-600 rounded-r-full" />
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-slate-100">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
        >
          {expanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {expanded && <span className="text-xs font-medium">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
