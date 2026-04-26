import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { heatmapPoints, mockHazardZones, mockSafeZones } from '../../data/mockData';
import { useApp } from '../../context/AppContext';

// ─── Fix Leaflet icons ────────────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ─── Hazard type config ───────────────────────────────────────────────────────
const HAZARD_CONFIG = {
  Flood:      { color: '#3b82f6', emoji: '🌊' },
  Fire:       { color: '#ef4444', emoji: '🔥' },
  Earthquake: { color: '#f59e0b', emoji: '🏚️' },
  Landslide:  { color: '#8b5cf6', emoji: '⛰️' },
  Chemical:   { color: '#22c55e', emoji: '☣️' },
  SOS:        { color: '#ef4444', emoji: '🆘' },
};

// ─── Leaflet Heatmap Layer (canvas-based) ─────────────────────────────────────
function HeatLayer({ points }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    // Remove previous
    if (layerRef.current) { layerRef.current.remove(); layerRef.current = null; }

    // Draw heatmap circles on canvas via SVG CircleMarkers
    // (react-leaflet provides CircleMarker which we'll use in JSX below)
  }, [map, points]);

  return null;
}

// ─── Report cluster marker ────────────────────────────────────────────────────
function ReportMarker({ report }) {
  const cfg  = HAZARD_CONFIG[report.type] ?? { color: '#94a3b8', emoji: '⚠️' };
  const icon = L.divIcon({
    className: '',
    html: `<div style="
      width:32px;height:32px;border-radius:50%;
      background:${cfg.color}22;
      border:2px solid ${cfg.color};
      display:flex;align-items:center;justify-content:center;
      font-size:14px;
      box-shadow:0 0 12px ${cfg.color}66;
      animation: marker-pop 0.3s ease-out;
    ">${cfg.emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  return (
    <Marker position={[report.lat, report.lng]} icon={icon}>
      <Popup>
        <div style={{ color: 'var(--text-primary)', minWidth: '180px' }}>
          <div className="font-bold mb-1" style={{ color: cfg.color }}>
            {cfg.emoji} {report.type} Alert
          </div>
          <div className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
            <div>📍 {report.location}</div>
            <div>🤖 AI Confidence: <span style={{ color: cfg.color }}>{report.aiConfidence}%</span></div>
            <div>👥 {report.userReports} user reports</div>
            <div>⏱ {new Date(report.timestamp).toLocaleTimeString()}</div>
            <div className="pt-1 font-medium" style={{ color: 'var(--text-primary)' }}>
              {report.description}
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

// ─── Geofence polygon layer ───────────────────────────────────────────────────
function GeofenceLayer({ geofences }) {
  const LEVEL_COLORS = { RED: '#ef4444', ORANGE: '#f97316', YELLOW: '#eab308' };
  return (
    <>
      {geofences.filter(g => g.active).map(gf => (
        <Polygon
          key={gf.id}
          positions={gf.coordinates}
          color={LEVEL_COLORS[gf.level] ?? '#ef4444'}
          fillColor={LEVEL_COLORS[gf.level] ?? '#ef4444'}
          fillOpacity={0.12}
          weight={2}
          dashArray="6 4"
        >
          <Popup>
            <div style={{ color: 'var(--text-primary)', minWidth: '160px' }}>
              <div className="font-bold mb-1" style={{ color: LEVEL_COLORS[gf.level] }}>
                🚧 {gf.name}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Level: {gf.level} — Active Geofence<br />
                Created: {new Date(gf.created).toLocaleTimeString()}
              </div>
            </div>
          </Popup>
        </Polygon>
      ))}
    </>
  );
}

export default function DashboardMap({ showHeatmap = true, showPins = true, showZones = true }) {
  const { reports, geofences } = useApp();
  const pendingReports = reports.filter(r => r.status === 'pending' || r.status === 'verified');

  const safeZoneIcon = L.divIcon({
    className: '',
    html: `<div style="
      width:24px;height:24px;border-radius:50%;
      background:linear-gradient(135deg,#22c55e,#15803d);
      border:2px solid rgba(255,255,255,0.7);
      display:flex;align-items:center;justify-content:center;
      font-size:11px;
      box-shadow:0 0 10px rgba(34,197,94,0.5);">
      🏥
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  return (
    <MapContainer
      center={[12.97, 77.59]}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {/* Heatmap (simulated with graduated circle markers) */}
      {showHeatmap && heatmapPoints.map((pt, i) => (
        <CircleMarker
          key={`heat-${i}`}
          center={[pt[0], pt[1]]}
          radius={pt[2] * 40}
          color="transparent"
          fillColor="#ef4444"
          fillOpacity={pt[2] * 0.35}
          weight={0}
        />
      ))}

      {/* Hazard Zone Polygons */}
      {showZones && mockHazardZones.map(zone => (
        <Polygon
          key={zone.id}
          positions={zone.coordinates}
          color={zone.color}
          fillColor={zone.fillColor}
          fillOpacity={zone.fillOpacity}
          weight={1.5}
        />
      ))}

      {/* Operator Geofences */}
      <GeofenceLayer geofences={geofences} />

      {/* Report Markers */}
      {showPins && pendingReports.map(report => (
        <ReportMarker key={report.id} report={report} />
      ))}

      {/* Safe Zones */}
      {mockSafeZones.map(sz => (
        <Marker key={sz.id} position={[sz.lat, sz.lng]} icon={safeZoneIcon}>
          <Popup>
            <div style={{ color: 'var(--text-primary)', minWidth: '160px' }}>
              <div className="font-semibold mb-1" style={{ color: '#4ade80' }}>🏥 {sz.name}</div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Available: {sz.available}/{sz.capacity} beds
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
