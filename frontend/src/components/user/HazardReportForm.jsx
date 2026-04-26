import { useState, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Upload, Camera, Wifi, WifiOff, CheckCircle, AlertTriangle, X, Loader } from 'lucide-react';

const HAZARD_TYPES = [
  { id: 'Flood',      icon: '🌊', label: 'Flood',         class: 'hazard-flood' },
  { id: 'Fire',       icon: '🔥', label: 'Fire',          class: 'hazard-fire' },
  { id: 'Earthquake', icon: '🏚️', label: 'Earthquake',    class: 'hazard-quake' },
  { id: 'Landslide',  icon: '⛰️', label: 'Landslide',     class: 'hazard-landslide' },
  { id: 'Chemical',   icon: '☣️', label: 'Chemical Leak', class: 'hazard-chemical' },
];

const SEVERITY_LEVELS = [
  { id: 'low',      label: 'Low',      color: '#22c55e' },
  { id: 'medium',   label: 'Medium',   color: '#f59e0b' },
  { id: 'high',     label: 'High',     color: '#f97316' },
  { id: 'critical', label: 'Critical', color: '#ef4444' },
];

export default function HazardReportForm() {
  const { submitReport, offlineQueue, isOnline, userLocation } = useApp();
  const fileInputRef = useRef(null);

  const [selectedType, setSelectedType]       = useState(null);
  const [severity,     setSeverity]           = useState('medium');
  const [description,  setDescription]        = useState('');
  const [photoPreview, setPhotoPreview]       = useState(null);
  const [photoFile,    setPhotoFile]          = useState(null);
  const [submitPhase,  setSubmitPhase]        = useState('idle'); // idle | submitting | done | error
  const [lastResult,   setLastResult]         = useState(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => { setPhotoPreview(null); setPhotoFile(null); };

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!selectedType) return;
    setSubmitPhase('submitting');

    const hazard = HAZARD_TYPES.find(h => h.id === selectedType);
    setTimeout(() => {
      const result = submitReport({
        type: selectedType,
        hazardClass: hazard.id.toLowerCase(),
        severity,
        lat: userLocation?.lat ?? 12.9716,
        lng: userLocation?.lng ?? 77.5946,
        location: userLocation
          ? `${userLocation.lat.toFixed(4)}°N, ${userLocation.lng.toFixed(4)}°E`
          : 'Bengaluru (GPS fallback)',
        description: description || `${selectedType} reported by user.`,
        evidence: ['1 User Report', photoFile ? 'Photo Evidence Uploaded' : 'No Photo'],
        photoUrl: photoPreview,
      });
      setSubmitPhase('done');
      setLastResult(result);
    }, 1000);
  }, [selectedType, severity, description, photoPreview, photoFile, userLocation, submitReport]);

  const resetForm = () => {
    setSelectedType(null);
    setSeverity('medium');
    setDescription('');
    setPhotoPreview(null);
    setPhotoFile(null);
    setSubmitPhase('idle');
    setLastResult(null);
  };

  if (submitPhase === 'done' && lastResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-6 py-8 text-center">
        <div className="rounded-full flex items-center justify-center mb-6"
             style={{ width: '80px', height: '80px',
                      background: lastResult.queued ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)',
                      border: `2px solid ${lastResult.queued ? '#f59e0b' : '#22c55e'}` }}>
          {lastResult.queued
            ? <WifiOff size={36} style={{ color: '#fbbf24' }} />
            : <CheckCircle size={36} style={{ color: '#4ade80' }} />}
        </div>

        <h2 className="text-xl font-bold mb-2" style={{ color: lastResult.queued ? '#fbbf24' : '#4ade80' }}>
          {lastResult.queued ? 'Report Queued (Offline)' : 'Report Submitted!'}
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          {lastResult.queued
            ? 'Your report is saved locally and will be transmitted automatically when connectivity is restored.'
            : 'Report received by the command center. AI analysis in progress.'}
        </p>

        <div className="glass-card w-full max-w-sm p-4 text-sm text-left space-y-2 mb-6">
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>Report ID</span>
            <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{lastResult.entry?.id}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>Type</span>
            <span style={{ color: 'var(--text-primary)' }}>{selectedType}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>Status</span>
            <span style={{ color: lastResult.queued ? '#fbbf24' : '#4ade80' }}>
              {lastResult.queued ? '⏳ Queued' : '✅ Transmitted'}
            </span>
          </div>
        </div>

        <button onClick={resetForm} className="btn-ghost">Submit Another Report</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex-shrink-0">
        <h2 className="text-lg font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>
          Report Hazard
        </h2>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Help emergency services by reporting what you see
        </p>

        {/* Network status */}
        <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg text-xs"
             style={{ background: isOnline ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)',
                      border: `1px solid ${isOnline ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
          {isOnline
            ? <><Wifi size={12} style={{ color: '#4ade80' }} /><span style={{ color: '#4ade80' }}>Online — Reports transmit immediately</span></>
            : <><WifiOff size={12} style={{ color: '#fbbf24' }} /><span style={{ color: '#fbbf24' }}>Offline — {offlineQueue.length} report(s) queued for upload</span></>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pb-24 flex-1">
        {/* Hazard Type Grid */}
        <div>
          <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            Hazard Type *
          </label>
          <div className="grid grid-cols-3 gap-2">
            {HAZARD_TYPES.map(h => (
              <button
                key={h.id}
                type="button"
                onClick={() => setSelectedType(h.id)}
                className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: selectedType === h.id ? 'rgba(239,68,68,0.15)' : 'var(--bg-card)',
                  border: selectedType === h.id ? '2px solid #ef4444' : '1px solid var(--border-subtle)',
                  color: selectedType === h.id ? '#f87171' : 'var(--text-secondary)',
                  transform: selectedType === h.id ? 'scale(1.03)' : 'scale(1)',
                }}
              >
                <span className="text-xl">{h.icon}</span>
                <span>{h.label}</span>
              </button>
            ))}
          </div>
          {!selectedType && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Select a hazard type to continue
            </p>
          )}
        </div>

        {/* Severity */}
        <div>
          <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            Severity Level
          </label>
          <div className="flex gap-2">
            {SEVERITY_LEVELS.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSeverity(s.id)}
                className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: severity === s.id ? `${s.color}25` : 'var(--bg-card)',
                  border: severity === s.id ? `2px solid ${s.color}` : '1px solid var(--border-subtle)',
                  color: severity === s.id ? s.color : 'var(--text-muted)',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Photo upload */}
        <div>
          <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            Photo Evidence (Optional)
          </label>
          {photoPreview ? (
            <div className="relative rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
              <img src={photoPreview} alt="Evidence" className="w-full object-cover" style={{ maxHeight: '180px' }} />
              <button
                type="button"
                onClick={clearPhoto}
                className="absolute top-2 right-2 rounded-full flex items-center justify-center"
                style={{ width: '28px', height: '28px', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <X size={14} color="white" />
              </button>
              <div className="px-3 py-1.5 text-xs" style={{ color: 'var(--text-secondary)', background: 'var(--bg-card)' }}>
                📎 {photoFile?.name ?? 'photo'} — Ready for upload
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl flex flex-col items-center justify-center gap-2 py-6 transition-all"
              style={{
                border: '2px dashed var(--border-subtle)',
                background: 'var(--bg-card)',
                color: 'var(--text-muted)',
              }}
            >
              <Camera size={28} />
              <span className="text-xs">Tap to add photo</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                Supports JPEG, PNG, HEIC
              </span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe what you see... (road blocked, building collapsed, water level, etc.)"
            rows={3}
            className="input-dark resize-none"
            style={{ fontFamily: 'Inter, sans-serif' }}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!selectedType || submitPhase === 'submitting'}
          className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all"
          style={{
            background: !selectedType
              ? 'var(--bg-card)'
              : 'linear-gradient(135deg, #ef4444, #b91c1c)',
            color: !selectedType ? 'var(--text-muted)' : 'white',
            border: 'none',
            cursor: !selectedType ? 'not-allowed' : 'pointer',
            boxShadow: selectedType ? '0 4px 20px rgba(239,68,68,0.35)' : 'none',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {submitPhase === 'submitting'
            ? <><Loader size={18} className="animate-spin" /> Submitting...</>
            : !isOnline
            ? <><WifiOff size={18} /> Queue Report (Offline)</>
            : <><Upload size={18} /> Submit Report</>}
        </button>
      </form>
    </div>
  );
}
