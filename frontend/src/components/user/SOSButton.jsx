import { useState, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { AlertTriangle, CheckCircle, Loader, Navigation } from 'lucide-react';

export default function SOSButton() {
  const { submitReport, setUserLocation, userLocation, isOnline } = useApp();
  const [phase, setPhase] = useState('idle'); // idle | locating | sending | sent | error
  const [coords, setCoords] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const holdTimer = useRef(null);
  const [holding, setHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdInterval = useRef(null);

  const startHold = useCallback(() => {
    if (phase === 'sent' || phase === 'sending' || phase === 'locating') return;
    setHolding(true);
    setHoldProgress(0);
    let progress = 0;
    holdInterval.current = setInterval(() => {
      progress += 5;
      setHoldProgress(progress);
      if (progress >= 100) {
        clearInterval(holdInterval.current);
        triggerSOS();
      }
    }, 100);
  }, [phase]);

  const cancelHold = useCallback(() => {
    if (holdProgress < 100) {
      setHolding(false);
      setHoldProgress(0);
      clearInterval(holdInterval.current);
      clearTimeout(holdTimer.current);
    }
  }, [holdProgress]);

  const triggerSOS = useCallback(() => {
    setHolding(false);
    setPhase('locating');

    if (!navigator.geolocation) {
      setPhase('error');
      setErrorMsg('Geolocation not supported on this device.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const loc = { lat: latitude, lng: longitude, accuracy };
        setCoords(loc);
        setUserLocation(loc);
        setPhase('sending');

        setTimeout(() => {
          submitReport({
            type: 'SOS',
            hazardClass: 'fire',
            severity: 'critical',
            lat: latitude,
            lng: longitude,
            location: `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`,
            description: 'SOS Emergency — User triggered distress signal.',
            evidence: ['User SOS Signal', `GPS Accuracy: ${accuracy.toFixed(0)}m`],
          });
          setPhase('sent');
        }, 1200);
      },
      (err) => {
        // Fallback: mock location for demo
        const mockLoc = { lat: 12.9716, lng: 77.5946, accuracy: 15 };
        setCoords(mockLoc);
        setUserLocation(mockLoc);
        setPhase('sending');
        setTimeout(() => {
          submitReport({
            type: 'SOS',
            hazardClass: 'fire',
            severity: 'critical',
            lat: mockLoc.lat,
            lng: mockLoc.lng,
            location: 'Bengaluru (GPS Approx)',
            description: 'SOS Emergency — Device GPS fallback.',
            evidence: ['User SOS Signal', 'GPS Fallback Mode'],
          });
          setPhase('sent');
        }, 1200);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [submitReport, setUserLocation]);

  const reset = () => {
    setPhase('idle');
    setCoords(null);
    setErrorMsg('');
    setHoldProgress(0);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 pb-8 pt-4 select-none">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black tracking-wider mb-2" style={{ fontFamily: 'Rajdhani, sans-serif', color: '#ef4444' }}>
          EMERGENCY SOS
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {phase === 'idle' ? 'Hold button for 2 seconds to send distress signal' :
           phase === 'locating' ? 'Acquiring GPS coordinates...' :
           phase === 'sending' ? 'Transmitting SOS signal...' :
           phase === 'sent' ? 'SOS signal broadcast successfully' :
           'An error occurred. Please retry.'}
        </p>
      </div>

      {/* Network badge */}
      <div className="flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full text-xs font-medium"
           style={{ background: isOnline ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${isOnline ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
        <span className="w-2 h-2 rounded-full status-live" style={{ background: isOnline ? '#22c55e' : '#ef4444' }}></span>
        <span style={{ color: isOnline ? '#4ade80' : '#f87171' }}>
          {isOnline ? 'Network Online — Direct Transmission' : 'Offline — Will Queue on Recovery'}
        </span>
      </div>

      {/* SOS Button Container */}
      <div className="relative flex items-center justify-center mb-12">
        {/* Pulse rings — only during idle */}
        {phase === 'idle' && (
          <>
            <div className="absolute rounded-full sos-ring"
                 style={{ width: '240px', height: '240px', border: '2px solid rgba(239,68,68,0.4)' }} />
            <div className="absolute rounded-full sos-ring-2"
                 style={{ width: '240px', height: '240px', border: '2px solid rgba(239,68,68,0.3)' }} />
          </>
        )}

        {/* Hold progress ring */}
        {holding && (
          <svg className="absolute" style={{ width: '240px', height: '240px', transform: 'rotate(-90deg)' }}>
            <circle cx="120" cy="120" r="108"
              fill="none" stroke="rgba(239,68,68,0.2)" strokeWidth="6" />
            <circle cx="120" cy="120" r="108"
              fill="none" stroke="#ef4444" strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 108}`}
              strokeDashoffset={`${2 * Math.PI * 108 * (1 - holdProgress / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.1s linear' }} />
          </svg>
        )}

        {/* Main button */}
        <button
          onMouseDown={startHold}
          onMouseUp={cancelHold}
          onMouseLeave={cancelHold}
          onTouchStart={startHold}
          onTouchEnd={cancelHold}
          onClick={phase === 'sent' || phase === 'error' ? reset : undefined}
          disabled={phase === 'locating' || phase === 'sending'}
          className="relative z-10 rounded-full font-black text-white flex flex-col items-center justify-center cursor-pointer transition-all"
          style={{
            width: '200px',
            height: '200px',
            fontSize: phase === 'sent' ? '18px' : '52px',
            fontFamily: 'Rajdhani, sans-serif',
            letterSpacing: '4px',
            background: phase === 'sent'
              ? 'linear-gradient(135deg, #22c55e, #15803d)'
              : phase === 'error'
              ? 'linear-gradient(135deg, #f97316, #b91c1c)'
              : 'linear-gradient(135deg, #ef4444, #7f1d1d)',
            boxShadow: phase === 'sent'
              ? '0 0 60px rgba(34,197,94,0.5), 0 0 120px rgba(34,197,94,0.2)'
              : '0 0 60px rgba(239,68,68,0.5), 0 0 120px rgba(239,68,68,0.2)',
            animation: phase === 'idle' ? 'sos-pulse 2s ease-in-out infinite' : 'none',
            transform: holding ? 'scale(0.97)' : 'scale(1)',
          }}
        >
          {phase === 'idle' && 'SOS'}
          {phase === 'locating' && <Loader size={40} className="animate-spin" />}
          {phase === 'sending' && <Loader size={40} className="animate-spin" />}
          {phase === 'sent' && (
            <>
              <CheckCircle size={36} />
              <span className="text-sm font-bold mt-1" style={{ letterSpacing: '1px' }}>SENT</span>
            </>
          )}
          {phase === 'error' && (
            <>
              <AlertTriangle size={36} />
              <span className="text-sm font-bold mt-1">RETRY</span>
            </>
          )}
        </button>
      </div>

      {/* Status cards */}
      {phase === 'sent' && coords && (
        <div className="glass-card w-full max-w-sm p-4 text-sm space-y-2">
          <div className="flex items-center gap-2 font-semibold" style={{ color: '#4ade80' }}>
            <CheckCircle size={16} />
            SOS Transmitted Successfully
          </div>
          <div className="space-y-1" style={{ color: 'var(--text-secondary)' }}>
            <div className="flex justify-between">
              <span>Latitude</span>
              <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{coords.lat.toFixed(6)}°</span>
            </div>
            <div className="flex justify-between">
              <span>Longitude</span>
              <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{coords.lng.toFixed(6)}°</span>
            </div>
            <div className="flex justify-between">
              <span>GPS Accuracy</span>
              <span className="font-mono" style={{ color: 'var(--text-primary)' }}>±{coords.accuracy?.toFixed(0) ?? '~15'}m</span>
            </div>
            <div className="flex justify-between">
              <span>Status</span>
              <span style={{ color: '#4ade80' }}>{isOnline ? 'Relayed to command' : 'Queued (offline)'}</span>
            </div>
          </div>
          <button onClick={reset} className="btn-ghost w-full text-center mt-2" style={{ fontSize: '13px' }}>
            Dismiss
          </button>
        </div>
      )}

      {phase === 'idle' && (
        <div className="text-center space-y-1" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
          <div className="flex items-center justify-center gap-1">
            <Navigation size={12} />
            <span>Your location will be shared with emergency teams</span>
          </div>
          <div>Tap-and-hold until button fills to activate</div>
        </div>
      )}
    </div>
  );
}
