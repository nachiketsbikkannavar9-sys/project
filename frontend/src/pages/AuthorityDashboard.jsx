import { useState, useEffect } from 'react';
import { Shield, Activity, Users, AlertTriangle, CheckCircle, Radio, Layers, Map as MapIcon, List, Hexagon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { systemStats } from '../data/mockData';
import DashboardMap from '../components/dashboard/DashboardMap';
import GeofencePanel from '../components/dashboard/GeofencePanel';
import TriageQueue from '../components/dashboard/TriageQueue';

// ─── Live Clock ───────────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="text-right">
      <div className="font-mono text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
        {time.toLocaleTimeString('en-IN', { hour12: false })}
      </div>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {time.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, pulse }) {
  return (
    <div className="glass-card flex items-center gap-3 px-4 py-3">
      <div className="flex items-center justify-center rounded-lg flex-shrink-0"
           style={{ width: '38px', height: '38px', background: `${color}20`, border: `1px solid ${color}44` }}>
        <Icon size={18} style={{ color }} />
        {pulse && <span className="absolute" />}
      </div>
      <div>
        <div className="text-xl font-black leading-none" style={{ color: 'var(--text-primary)', fontFamily: 'Rajdhani, sans-serif' }}>
          {value}
        </div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
      </div>
    </div>
  );
}

// ─── Map Layer Toggle ─────────────────────────────────────────────────────────
function LayerToggle({ label, active, onToggle, color = '#ef4444' }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
      style={{
        background: active ? `${color}18` : 'var(--bg-card)',
        border: `1px solid ${active ? color + '55' : 'var(--border-subtle)'}`,
        color: active ? color : 'var(--text-muted)',
      }}
    >
      <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: active ? color : 'var(--text-muted)' }} />
      {label}
    </button>
  );
}

export default function AuthorityDashboard() {
  const { reports, activeAlerts } = useApp();
  const [rightPanel,    setRightPanel]    = useState('triage'); // triage | geofence
  const [showHeatmap,   setShowHeatmap]   = useState(true);
  const [showPins,      setShowPins]      = useState(true);
  const [showZones,     setShowZones]     = useState(true);

  const pending        = reports.filter(r => r.status === 'pending').length;
  const verified       = reports.filter(r => r.status === 'verified').length;
  const rejected       = reports.filter(r => r.status === 'rejected').length;
  const newUserReports = reports.filter(r => r.status === 'pending' && r.isUserSubmitted).length;
  const liveIncidents  = reports.filter(r => r.status !== 'rejected').length;

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--bg-dark)', overflow: 'hidden' }}>

      {/* ── Top Header ───────────────────────────────────────────────── */}
      <header className="glass flex-shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-4 px-6 py-3">
          {/* Brand */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center justify-center rounded-lg"
                 style={{ width: '36px', height: '36px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)' }}>
              <Shield size={20} style={{ color: '#ef4444' }} />
            </div>
            <div>
              <div className="font-black text-lg leading-none gradient-text" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '3px' }}>
                ANTIGRAVITY
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                Real-Time Incident Reporting for Effective
              </div>
            </div>
          </div>

          {/* Live status */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
               style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <span className="w-2 h-2 rounded-full status-live" style={{ background: '#22c55e' }}></span>
            <span className="text-xs font-semibold" style={{ color: '#4ade80' }}>LIVE OPERATIONS</span>
          </div>

          {/* Alert banner */}
          {activeAlerts.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-1 max-w-md"
                 style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)' }}>
              <Radio size={14} style={{ color: '#f87171', flexShrink: 0 }} className="animate-pulse" />
              <span className="text-xs font-semibold truncate" style={{ color: '#f87171' }}>
                {activeAlerts[0]?.message}
              </span>
            </div>
          )}

          <div className="flex-1" />

          {/* Stats row */}
          <div className="flex items-center gap-3 text-xs">
            <div className="text-center px-3 py-1 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <div className="font-black text-base leading-none" style={{ color: '#f87171', fontFamily: 'Rajdhani, sans-serif' }}>
                {pending}
              </div>
              <div style={{ color: 'var(--text-muted)' }}>Pending</div>
            </div>
            <div className="text-center px-3 py-1 rounded-lg" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
              <div className="font-black text-base leading-none" style={{ color: '#4ade80', fontFamily: 'Rajdhani, sans-serif' }}>
                {verified}
              </div>
              <div style={{ color: 'var(--text-muted)' }}>Verified</div>
            </div>
            <div className="text-center px-3 py-1 rounded-lg" style={{ background: 'rgba(148,163,184,0.05)', border: '1px solid var(--border-subtle)' }}>
              <div className="font-black text-base leading-none" style={{ color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif' }}>
                {rejected}
              </div>
              <div style={{ color: 'var(--text-muted)' }}>Rejected</div>
            </div>
          </div>

          <LiveClock />

          {/* Mobile link */}
          <a href="/"
             className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
             style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}>
            <Shield size={12} />
            User View
          </a>
        </div>

        {/* ── Stats strip ─────────────────────────────────────────── */}
        <div className="flex gap-3 px-6 pb-3 overflow-x-auto">
          <StatCard icon={AlertTriangle}  label="Active Incidents"     value={liveIncidents}                  color="#ef4444" pulse />
          <StatCard icon={Activity}       label="AI Queue"             value={pending}                        color="#f59e0b" />
          <StatCard icon={Radio}          label="Broadcast Alerts"     value={systemStats.broadcastAlerts + verified} color="#3b82f6" />
          <StatCard icon={Users}          label="Affected Population"  value={systemStats.affectedPopulation} color="#8b5cf6" />
          <StatCard icon={CheckCircle}    label="Responder Teams"      value={systemStats.responderTeams}     color="#22c55e" />
        </div>
      </header>

      {/* ── Main 3-Column Layout ──────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden" style={{ gap: '0' }}>

        {/* ── Left Sidebar ─────────────────────────────────────────── */}
        <aside className="sidebar flex-shrink-0 flex flex-col" style={{ width: '200px' }}>
          <div className="px-4 py-4 flex-shrink-0">
            <div className="text-xs font-semibold mb-3 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Map Layers
            </div>
            <div className="space-y-2">
              <LayerToggle label="Heatmap" active={showHeatmap} onToggle={() => setShowHeatmap(h => !h)} color="#ef4444" />
              <LayerToggle label="Pins"    active={showPins}    onToggle={() => setShowPins(p => !p)}    color="#f59e0b" />
              <LayerToggle label="Zones"   active={showZones}   onToggle={() => setShowZones(z => !z)}   color="#3b82f6" />
            </div>
          </div>

          {/* Legend */}
          <div className="px-4 pb-4 flex-shrink-0" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginTop: '4px' }}>
            <div className="text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Legend
            </div>
            <div className="space-y-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
              {[
                { color: '#ef4444', label: 'Fire' },
                { color: '#3b82f6', label: 'Flood' },
                { color: '#f59e0b', label: 'Earthquake' },
                { color: '#8b5cf6', label: 'Landslide' },
                { color: '#22c55e', label: 'Safe Zone' },
                { color: '#f97316', label: 'Geofence' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: item.color, opacity: 0.85 }} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* Recent broadcasts */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              Recent Alerts
            </div>
            {activeAlerts.length === 0 ? (
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>No active alerts</div>
            ) : (
              activeAlerts.slice(0, 5).map(alert => (
                <div key={alert.id} className="mb-2 p-2 rounded-lg text-xs"
                     style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                  <div className="font-semibold mb-0.5">{alert.type} Alert</div>
                  <div style={{ color: 'var(--text-muted)' }}>{alert.location}</div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* ── Center Map ────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          <DashboardMap
            showHeatmap={showHeatmap}
            showPins={showPins}
            showZones={showZones}
          />

          {/* Map overlay: incident count badge */}
          <div className="absolute top-4 left-4 z-[1000] glass px-3 py-2 rounded-xl"
               style={{ border: '1px solid var(--border-subtle)', pointerEvents: 'none' }}>
            <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Live Incidents
            </div>
            <div className="text-2xl font-black leading-none gradient-text" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              {reports.filter(r => r.status !== 'rejected').length}
            </div>
          </div>
        </main>

        {/* ── Right Panel ───────────────────────────────────────────── */}
        <aside className="flex flex-col flex-shrink-0" style={{ width: '340px', borderLeft: '1px solid var(--border-subtle)', background: 'var(--bg-panel)' }}>
          {/* Panel switcher tabs */}
          <div className="flex flex-shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            {[
              { id: 'triage',   label: 'Triage Queue',    icon: List },
              { id: 'geofence', label: 'Geofence',        icon: Hexagon },
            ].map(tab => {
              const Icon = tab.icon;
              const active = rightPanel === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setRightPanel(tab.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold transition-all relative"
                  style={{
                    background: active ? 'rgba(239,68,68,0.08)' : 'transparent',
                    color: active ? '#f87171' : 'var(--text-muted)',
                    border: 'none',
                    borderBottom: active ? '2px solid #ef4444' : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                >
                  <Icon size={14} />
                  {tab.label}
                  {/* NEW badge: shows when user-submitted reports are waiting */}
                  {tab.id === 'triage' && newUserReports > 0 && (
                    <span
                      className="flex items-center justify-center rounded-full text-xs font-black status-live"
                      style={{
                        minWidth: '18px', height: '18px', padding: '0 4px',
                        background: '#ef4444',
                        color: 'white',
                        fontSize: '10px',
                        boxShadow: '0 0 8px rgba(239,68,68,0.6)',
                      }}
                    >
                      {newUserReports}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-hidden">
            {rightPanel === 'triage'   ? <TriageQueue   /> : <GeofencePanel />}
          </div>
        </aside>
      </div>
    </div>
  );
}
