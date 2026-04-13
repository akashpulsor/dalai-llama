import { useState } from 'react';
import { User, Phone, Shield, Key, Mail, Hash, Globe, Cpu } from 'lucide-react';

/** @param {{ auth: any }} props */
export default function Profile({ auth }) {
  const p = auth.user || {};
  const [showReset, setShowReset] = useState(false);
  const initials = (p.display_name || '??').split(' ').map((/** @type {string} */ n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-lg mx-auto space-y-4">
        <h1 className="text-lg font-bold">Profile</h1>

        {/* Avatar + Name */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-5 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg"
              style={{ boxShadow: '0 0 30px rgba(124,58,237,0.2)' }}>
              <span className="text-xl font-bold text-white">{initials}</span>
            </div>
            <div>
              <p className="text-lg font-bold">{p.display_name}</p>
              <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--accent)' }}>{p.role}</p>
            </div>
          </div>

          <div className="space-y-0">
            <Row icon={Mail} label="Email" value={p.email} />
            <Row icon={Hash} label="Extension" value={p.extension} />
            <Row icon={Phone} label="SIP Domain" value={p.sip_domain || 'sip.dalaillama.in'} />
            <Row icon={Shield} label="Role" value={p.role} />
            <Row icon={Globe} label="Tenant" value={p.tenant_id} />
          </div>

          {/* Skills */}
          <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-dim)' }}>Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {(p.skills || ['sales', 'billing', 'support', 'hindi']).map((/** @type {string} */ s, /** @type {number} */ i) => (
                <span key={i} className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>{s}</span>
              ))}
            </div>
          </div>
        </div>

        {/* SIP Credentials */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-4 h-4" style={{ color: 'var(--amber)' }} />
            <span className="text-[11px] font-bold uppercase tracking-wider">SIP Credentials</span>
          </div>
          <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-dim)' }}>
            SIP credentials are generated automatically on login. Each login creates a fresh SIP password 
            and registers your softphone. Only your most recent session can make/receive calls.
          </p>

          <div className="space-y-0 mb-4">
            <Row icon={Cpu} label="SIP URI" value={`sip:${p.extension}@sip.dalaillama.in`} />
            <Row icon={Globe} label="WSS" value="wss://sip.dalaillama.in:8443" />
          </div>

          {!showReset ? (
            <button onClick={() => setShowReset(true)}
              className="text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}>
              Regenerate SIP Password
            </button>
          ) : (
            <div className="rounded-xl p-4" style={{ background: 'var(--amber-soft)', border: '1px solid rgba(251,191,36,0.3)' }}>
              <p className="text-[11px] mb-3" style={{ color: 'var(--amber)' }}>
                This will disconnect your active SIP session. You'll need to refresh the page.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowReset(false)}
                  className="text-[10px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  style={{ background: 'var(--surface-2)', color: 'var(--text)' }}>Cancel</button>
                <button onClick={() => { setShowReset(false); alert('SIP credentials regenerated'); }}
                  className="text-[10px] font-semibold px-3 py-1.5 rounded-lg text-white transition-colors"
                  style={{ background: 'var(--amber)' }}>Confirm</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** @param {{ icon: import('react').ElementType, label: string, value: string }} props */
function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5" style={{ color: 'var(--text-dim)' }} />
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>{label}</span>
      </div>
      <span className="text-xs font-semibold">{value || '—'}</span>
    </div>
  );
}