import { useState } from 'react';
import { Bell, LogOut, User, ChevronDown } from 'lucide-react';

/**
 * @param {{ auth: import('@dalaillama/shared-hooks').TenantAuthResult,
 *           sidebarExpanded: boolean }} props
 */
export default function Header({ auth, sidebarExpanded }) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const userName = auth.user?.display_name || auth.user?.email || 'Admin';
  const initials = userName.split(' ').map((/** @type {string} */ n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-6">
      {/* Left: Page context */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {auth.productCode || 'Admin Panel'}
        </p>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative w-9 h-9 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center transition-colors">
          <Bell className="w-4 h-4 text-slate-500" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl px-3 py-2 transition-colors"
          >
            <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-violet-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">{initials}</span>
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-slate-700 leading-none">{userName}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {auth.user?.role || 'ADMIN'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Dropdown */}
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-700">{userName}</p>
                  <p className="text-[10px] text-slate-400">{auth.user?.email}</p>
                </div>
                <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  <User className="w-3.5 h-3.5" /> Profile
                </button>
                <button
                  onClick={() => auth.logout()}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
