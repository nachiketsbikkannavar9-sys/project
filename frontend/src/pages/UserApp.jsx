import { useState } from 'react';
import { MapPin, Radio, FileText, Shield } from 'lucide-react';
import SOSButton from '../components/user/SOSButton';
import UserMap from '../components/user/UserMap';
import HazardReportForm from '../components/user/HazardReportForm';
import { useApp } from '../context/AppContext';

const TABS = [
  { id: 'map',    label: 'Map',    icon: MapPin },
  { id: 'sos',    label: 'SOS',    icon: Radio },
  { id: 'report', label: 'Report', icon: FileText },
];

export default function UserApp() {
  const [activeTab, setActiveTab] = useState('sos');
  const { activeAlerts, isOnline } = useApp();

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative"
         style={{ background: 'var(--bg-dark)' }}>

      {/* ── Top Status Bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 glass"
           style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-2">
          <Shield size={18} style={{ color: '#ef4444' }} />
          <span className="font-black text-base" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '2px', color: '#ef4444' }}>
            ANTIGRAVITY
          </span>
        </div>
        <div className="flex items-center gap-2">
          {activeAlerts.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
                 style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171' }}>
              <span className="w-1.5 h-1.5 rounded-full status-live" style={{ background: '#ef4444' }}></span>
              {activeAlerts.length} ALERT{activeAlerts.length > 1 ? 'S' : ''}
            </div>
          )}
          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
               style={{ background: isOnline ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                        border: `1px solid ${isOnline ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
                        color: isOnline ? '#4ade80' : '#fbbf24' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: isOnline ? '#22c55e' : '#f59e0b' }}></span>
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>

      {/* ── Active Alert Banner ────────────────────────────────────── */}
      {activeAlerts.length > 0 && (
        <div className="flex items-start gap-2 px-4 py-2.5 flex-shrink-0"
             style={{ background: 'rgba(239,68,68,0.12)', borderBottom: '1px solid rgba(239,68,68,0.2)' }}>
          <span className="text-sm">🚨</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold mb-0.5" style={{ color: '#f87171' }}>EMERGENCY BROADCAST</div>
            <p className="text-xs leading-relaxed truncate" style={{ color: 'var(--text-secondary)' }}>
              {activeAlerts[0]?.message}
            </p>
          </div>
        </div>
      )}

      {/* ── Main Content ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden relative">
        {/* Map tab */}
        <div className={`absolute inset-0 transition-opacity duration-200 ${activeTab === 'map' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <UserMap />
        </div>

        {/* SOS tab */}
        <div className={`absolute inset-0 overflow-y-auto transition-opacity duration-200 ${activeTab === 'sos' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <SOSButton />
        </div>

        {/* Report tab */}
        <div className={`absolute inset-0 overflow-y-auto transition-opacity duration-200 ${activeTab === 'report' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <HazardReportForm />
        </div>
      </div>

      {/* ── Bottom Navigation ──────────────────────────────────────── */}
      <nav className="mobile-nav flex-shrink-0">
        <div className="flex">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isSOS = tab.id === 'sos';
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all relative"
                style={{
                  color: isSOS && isActive ? '#ef4444' : isActive ? '#ef4444' : 'var(--text-muted)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {isSOS ? (
                  <div className="flex items-center justify-center rounded-full mb-0.5"
                       style={{
                         width: '40px', height: '40px',
                         background: isActive ? 'rgba(239,68,68,0.2)' : 'transparent',
                         border: isActive ? '2px solid rgba(239,68,68,0.5)' : '2px solid rgba(255,255,255,0.1)',
                         transition: 'all 0.2s',
                       }}>
                    <Icon size={20} />
                  </div>
                ) : (
                  <Icon size={20} />
                )}
                <span className="text-xs font-medium">{tab.label}</span>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                        style={{ background: '#ef4444' }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Safe zone link to dashboard */}
        <div className="flex items-center justify-center gap-1 py-2 text-xs border-t"
             style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
          <span>Authority Dashboard:</span>
          <a href="/dashboard" className="font-medium" style={{ color: '#60a5fa' }}>Open →</a>
        </div>
      </nav>
    </div>
  );
}
