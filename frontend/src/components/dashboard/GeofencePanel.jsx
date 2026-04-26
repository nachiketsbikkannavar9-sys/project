import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Radio, ToggleLeft, ToggleRight, Hexagon, AlertTriangle } from 'lucide-react';

const LEVEL_CONFIG = {
  RED:    { label: 'Evacuate',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.4)'  },
  ORANGE: { label: 'Warning',   color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.4)' },
  YELLOW: { label: 'Monitor',   color: '#eab308', bg: 'rgba(234,179,8,0.12)',  border: 'rgba(234,179,8,0.4)'  },
};

const MOCK_ZONES_UI = [
  { name: 'North Flood Perimeter',  area: '12.4 km²', population: '~22,000', reports: 18 },
  { name: 'Industrial Fire Zone',   area: '3.2 km²',  population: '~4,500',  reports: 12 },
  { name: 'Highway Landslide Risk', area: '1.8 km²',  population: '~800',    reports: 7  },
];

export default function GeofencePanel() {
  const { geofences, toggleGeofence, addGeofence } = useApp();
  const [drawing,     setDrawing]     = useState(false);
  const [newLevel,    setNewLevel]    = useState('RED');
  const [newName,     setNewName]     = useState('');
  const [broadcastId, setBroadcastId] = useState(null);

  const handleDraw = () => {
    if (!newName.trim()) return;
    // Mock: add a predefined polygon offset from existing ones
    const offset = geofences.length * 0.01;
    addGeofence({
      name: newName,
      level: newLevel,
      active: true,
      coordinates: [
        [12.960 + offset, 77.582 + offset],
        [12.955 + offset, 77.598 + offset],
        [12.945 + offset, 77.593 + offset],
        [12.947 + offset, 77.578 + offset],
      ],
    });
    setDrawing(false);
    setNewName('');
    setNewLevel('RED');
  };

  const handleBroadcast = (id) => {
    setBroadcastId(id);
    setTimeout(() => setBroadcastId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Hexagon size={16} style={{ color: '#f97316' }} />
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Geofence Manager</h3>
          </div>
          <button
            onClick={() => setDrawing(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <Plus size={12} /> New Zone
          </button>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Define danger perimeters and broadcast alerts
        </p>
      </div>

      {/* Draw Zone Form */}
      {drawing && (
        <div className="mx-3 my-3 p-3 rounded-xl flex-shrink-0"
             style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <div className="text-xs font-semibold mb-2" style={{ color: '#f87171' }}>
            📐 Define New Zone
          </div>
          <input
            type="text"
            placeholder="Zone name (e.g. River Overflow Zone)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="input-dark mb-2"
            style={{ fontSize: '12px', padding: '8px 10px' }}
          />
          <div className="flex gap-2 mb-3">
            {Object.entries(LEVEL_CONFIG).map(([level, cfg]) => (
              <button
                key={level}
                onClick={() => setNewLevel(level)}
                className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: newLevel === level ? cfg.bg : 'transparent',
                  border: `1px solid ${newLevel === level ? cfg.color : 'var(--border-subtle)'}`,
                  color: newLevel === level ? cfg.color : 'var(--text-muted)',
                }}
              >
                {level}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleDraw} className="btn-danger flex-1 text-xs py-2"
                    disabled={!newName.trim()}
                    style={{ opacity: newName.trim() ? 1 : 0.5, fontSize: '12px', padding: '8px 12px' }}>
              Add to Map
            </button>
            <button onClick={() => setDrawing(false)} className="btn-ghost text-xs py-2"
                    style={{ fontSize: '12px', padding: '8px 12px' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active Geofences */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {geofences.map(gf => {
          const cfg = LEVEL_CONFIG[gf.level] ?? LEVEL_CONFIG.RED;
          const isBroadcasting = broadcastId === gf.id;
          return (
            <div key={gf.id} className="rounded-xl p-3"
                 style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {gf.level} · {cfg.label}
                    </span>
                    {gf.active && (
                      <span className="w-1.5 h-1.5 rounded-full status-live flex-shrink-0"
                            style={{ background: cfg.color }} />
                    )}
                  </div>
                  <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {gf.name}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Created {new Date(gf.created).toLocaleTimeString()}
                  </div>
                </div>
                <button
                  onClick={() => toggleGeofence(gf.id)}
                  className="ml-2 flex-shrink-0"
                  style={{ color: gf.active ? cfg.color : 'var(--text-muted)' }}
                >
                  {gf.active
                    ? <ToggleRight size={24} />
                    : <ToggleLeft  size={24} />}
                </button>
              </div>

              {/* Broadcast button */}
              <button
                onClick={() => handleBroadcast(gf.id)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: isBroadcasting ? 'rgba(34,197,94,0.2)' : cfg.bg,
                  border: `1px solid ${isBroadcasting ? '#22c55e' : cfg.color}`,
                  color: isBroadcasting ? '#4ade80' : cfg.color,
                }}
              >
                <Radio size={12} className={isBroadcasting ? 'animate-pulse' : ''} />
                {isBroadcasting ? 'Broadcasting...' : 'Broadcast Alert'}
              </button>
            </div>
          );
        })}

        {/* Static zone reference cards */}
        <div className="pt-1">
          <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
            SYSTEM ZONES (Read-only)
          </div>
          {MOCK_ZONES_UI.map((z, i) => (
            <div key={i} className="rounded-lg p-3 mb-2"
                 style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{z.name}</div>
              <div className="flex gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>📐 {z.area}</span>
                <span>👥 {z.population}</span>
                <span>📋 {z.reports} reports</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
