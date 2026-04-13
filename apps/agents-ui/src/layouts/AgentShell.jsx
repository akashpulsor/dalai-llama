import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  Headphones, Clock, User, LogOut, ChevronDown,
  Wifi, WifiOff, Coffee, Zap, Bell,
} from 'lucide-react';

const NAV = [
  { to: '/', icon: Headphones, label: 'Console' },
  { to: '/history', icon: Clock, label: 'History' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const STATUS_OPTS = [
  { val: 'ONLINE', label: 'Available', color: 'bg-emerald-400', icon: Wifi },
  { val: 'BREAK', label: 'Break', color: 'bg-amber-400', icon: Coffee },
  { val: 'OFFLINE', label: 'Offline', color: 'bg-slate-500', icon: WifiOff },
];

/** @param {{ auth: any }} props */
export default function AgentShell({ auth }) {
  const [status, setStatus] = useState('ONLINE');
  const [statusOpen, setStatusOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const location = useLocation();
  const cur = STATUS_OPTS.find((s) => s.val === status) || STATUS_OPTS[0];
  const initials = (auth.user?.display_name || '??').split(' ').map((/** @type {string} */ n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="h-screen flex overflow-hidden">
      {/* ── Rail Nav ── */}
      <nav className="w-[60px] flex flex-col items-center py-5 gap-6 border-r" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center mb-4">
          <Zap className="w-5 h-5 text-white" />
        </div>
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = n.to === '/' ? location.pathname === '/' : location.pathname.startsWith(n.to);
          return (
            <NavLink key={n.to} to={n.to}
              className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all group ${
                active ? 'text-white' : 'text-[var(--text-dim)] hover:text-white'
              }`}
              style={active ? { background: 'var(--accent-soft)' } : {}}>
              <Icon className="w-[18px] h-[18px]" />
              {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" style={{ background: 'var(--accent)' }} />}
              <span className="absolute left-full ml-3 px-2 py-1 rounded-md text-[10px] font-semibold text-white opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap" style={{ background: 'var(--surface-3)' }}>{n.label}</span>
            </NavLink>
          );
        })}
        <div className="flex-1" />
        <div className={`w-2.5 h-2.5 rounded-full ${cur.color}`} title={`Status: ${cur.label}`} />
      </nav>

      {/* ── Main Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-12 flex items-center justify-between px-5 border-b shrink-0" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>Ext. {auth.user?.extension}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Status */}
            <div className="relative">
              <button onClick={() => setStatusOpen(!statusOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:opacity-90"
                style={{ background: 'var(--surface-2)', color: 'var(--text)' }}>
                <div className={`w-2 h-2 rounded-full ${cur.color}`} />
                {cur.label}
                <ChevronDown className="w-3 h-3 opacity-50" />
              </button>
              {statusOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setStatusOpen(false)} />
                  <div className="absolute right-0 mt-1 w-36 rounded-xl py-1 z-50 shadow-2xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    {STATUS_OPTS.map((o) => {
                      const I = o.icon;
                      return (
                        <button key={o.val} onClick={() => { setStatus(o.val); setStatusOpen(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors hover:opacity-80"
                          style={{ color: status === o.val ? 'var(--accent)' : 'var(--text)' }}>
                          <div className={`w-2 h-2 rounded-full ${o.color}`} /> <I className="w-3.5 h-3.5" /> {o.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            {/* Bell */}
            <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ background: 'var(--surface-2)' }}>
              <Bell className="w-3.5 h-3.5" style={{ color: 'var(--text-dim)' }} />
            </button>
            {/* User */}
            <div className="relative">
              <button onClick={() => setUserOpen(!userOpen)}
                className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">{initials}</span>
              </button>
              {userOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserOpen(false)} />
                  <div className="absolute right-0 mt-1 w-44 rounded-xl py-1 z-50 shadow-2xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                      <p className="text-xs font-semibold">{auth.user?.display_name}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{auth.user?.email}</p>
                    </div>
                    <button onClick={() => auth.logout()} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 transition-colors">
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}