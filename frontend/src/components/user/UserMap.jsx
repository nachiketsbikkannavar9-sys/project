import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useApp } from '../../context/AppContext';
import { mockSafeZones, mockHazardZones } from '../../data/mockData';
import { Shield, Navigation, AlertTriangle } from 'lucide-react';

// ─── Fix Leaflet default icon paths ──────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ─── Custom Icons ─────────────────────────────────────────────────────────────
const userIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:18px;height:18px;border-radius:50%;
    background:radial-gradient(circle,#60a5fa,#3b82f6);
    border:3px solid white;
    box-shadow:0 0 0 4px rgba(59,130,246,0.4), 0 0 20px rgba(59,130,246,0.6);">
  </div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const safeZoneIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:28px;height:28px;border-radius:50%;
    background:linear-gradient(135deg,#22c55e,#15803d);
    border:2px solid rgba(255,255,255,0.8);
    display:flex;align-items:center;justify-content:center;
    font-size:14px;
    box-shadow:0 0 15px rgba(34,197,94,0.5);">
    🏥
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// ─── Auto-center map on user location ────────────────────────────────────────
function RecenterMap({ location }) {
  const map = useMap();
  useEffect(() => {
    if (location) map.setView([location.lat, location.lng], 14, { animate: true });
  }, [location, map]);
  return null;
}

// ─── Find nearest safe zone ───────────────────────────────────────────────────
function getNearestSafeZone(userLoc) {
  if (!userLoc) return mockSafeZones[0];
  let nearest = null;
  let minDist = Infinity;
  mockSafeZones.forEach(sz => {
    const d = Math.hypot(sz.lat - userLoc.lat, sz.lng - userLoc.lng);
    if (d < minDist) { minDist = d; nearest = sz; }
  });
  return nearest;
}

export default function UserMap() {
  const { userLocation, setUserLocation } = useApp();
  const [locating, setLocating]    = useState(false);
  const defaultCenter              = [12.9716, 77.5946];
  const nearestSZ                  = getNearestSafeZone(userLocation);
  const routePath                  = userLocation && nearestSZ
    ? [[userLocation.lat, userLocation.lng], [nearestSZ.lat, nearestSZ.lng]]
    : null;

  const locateMe = () => {
    setLocating(true);
    navigator.geolocation?.getCurrentPosition(
      (pos) => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }); setLocating(false); },
      () => { setUserLocation({ lat: 12.9716, lng: 77.5946, accuracy: 50 }); setLocating(false); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Map legend bar */}
      <div className="flex items-center gap-3 px-4 py-2 overflow-x-auto flex-shrink-0"
           style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border-subtle)', fontSize: '11px' }}>
        <div className="flex items-center gap-1.5 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: '#3b82f6', boxShadow: '0 0 6px #3b82f6' }}></span>
          Your Location
        </div>
        <div className="flex items-center gap-1.5 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: '#22c55e' }}></span>
          Safe Zones
        </div>
        <div className="flex items-center gap-1.5 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
          <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: 'rgba(59,130,246,0.4)', border: '1px solid #3b82f6' }}></span>
          Flood Zone
        </div>
        <div className="flex items-center gap-1.5 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
          <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: 'rgba(239,68,68,0.4)', border: '1px solid #ef4444' }}></span>
          Fire Zone
        </div>
        <div className="flex items-center gap-1.5 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
          <span className="w-3 h-1 flex-shrink-0" style={{ background: '#22c55e', borderRadius: '1px' }}></span>
          Safe Route
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {userLocation && (
            <>
              <RecenterMap location={userLocation} />
              <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                <Popup>
                  <div style={{ color: 'var(--text-primary)', minWidth: '160px' }}>
                    <div className="font-semibold mb-1" style={{ color: '#60a5fa' }}>📍 Your Location</div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {userLocation.lat.toFixed(5)}°N, {userLocation.lng.toFixed(5)}°E
                      {userLocation.accuracy && <div>Accuracy: ±{userLocation.accuracy.toFixed(0)}m</div>}
                    </div>
                  </div>
                </Popup>
              </Marker>
              {/* Accuracy circle */}
              {userLocation.accuracy && (
                <Circle
                  center={[userLocation.lat, userLocation.lng]}
                  radius={userLocation.accuracy}
                  color="#3b82f6" fillColor="#3b82f6" fillOpacity={0.08}
                  weight={1}
                />
              )}
            </>
          )}

          {/* Hazard Zones */}
          {mockHazardZones.map(zone => (
            <Polygon key={zone.id}
              positions={zone.coordinates}
              color={zone.color}
              fillColor={zone.fillColor}
              fillOpacity={zone.fillOpacity}
              weight={2}
            >
              <Popup>
                <div style={{ color: 'var(--text-primary)', minWidth: '160px' }}>
                  <div className="font-semibold mb-1" style={{ color: zone.color }}>
                    ⚠️ {zone.name}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Type: {zone.type} — Severity: {zone.severity.toUpperCase()}
                  </div>
                </div>
              </Popup>
            </Polygon>
          ))}

          {/* Safe zones */}
          {mockSafeZones.map(sz => (
            <Marker key={sz.id} position={[sz.lat, sz.lng]} icon={safeZoneIcon}>
              <Popup>
                <div style={{ color: 'var(--text-primary)', minWidth: '180px' }}>
                  <div className="font-semibold mb-1" style={{ color: '#4ade80' }}>🏥 {sz.name}</div>
                  <div className="text-xs space-y-0.5" style={{ color: 'var(--text-secondary)' }}>
                    <div>Type: {sz.type}</div>
                    <div>Available: <span style={{ color: '#4ade80' }}>{sz.available}</span> / {sz.capacity}</div>
                    <div>📞 {sz.contact}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {sz.facilities.map(f => (
                        <span key={f} className="px-1.5 py-0.5 rounded text-xs"
                              style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Route to nearest safe zone */}
          {routePath && (
            <Polyline
              positions={routePath}
              color="#22c55e"
              weight={3}
              dashArray="8, 6"
              opacity={0.85}
            />
          )}
        </MapContainer>

        {/* Locate Me FAB */}
        <button
          onClick={locateMe}
          disabled={locating}
          className="absolute z-[1000] rounded-full flex items-center justify-center transition-all"
          style={{
            bottom: '16px', right: '16px',
            width: '48px', height: '48px',
            background: locating ? 'rgba(30,41,59,0.9)' : '#ef4444',
            border: '2px solid rgba(255,255,255,0.2)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            cursor: locating ? 'wait' : 'pointer',
          }}
        >
          <Navigation size={20} color="white" className={locating ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Nearest safe zone banner */}
      {nearestSZ && (
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
             style={{ background: 'rgba(34,197,94,0.08)', borderTop: '1px solid rgba(34,197,94,0.2)' }}>
          <Shield size={18} style={{ color: '#4ade80', flexShrink: 0 }} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold" style={{ color: '#4ade80' }}>Nearest Safe Zone</div>
            <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
              {nearestSZ.name} — {nearestSZ.available} spots available
            </div>
          </div>
          <div className="text-xs font-mono" style={{ color: '#4ade80' }}>
            {nearestSZ.contact}
          </div>
        </div>
      )}
    </div>
  );
}
