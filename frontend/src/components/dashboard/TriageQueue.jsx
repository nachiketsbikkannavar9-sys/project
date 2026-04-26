import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp, Clock, Users, Radio } from 'lucide-react';

const HAZARD_CONFIG = {
  Flood:      { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  icon: '🌊', class: 'flood'    },
  Fire:       { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: '🔥', class: 'fire'     },
  Earthquake: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: '🏚️', class: 'quake'    },
  Landslide:  { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  icon: '⛰️', class: 'landslide'},
  Chemical:   { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   icon: '☣️', class: 'chemical' },
  SOS:        { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: '🆘', class: 'fire'     },
};

const SEVERITY_COLORS = {
  critical: '#ef4444',
  warning:  '#f59e0b',
  info:     '#3b82f6',
  low:      '#22c55e',
};

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60)         return `${diff}s ago`;
  if (diff < 3600)       return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function ConfidenceBar({ value, color }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${value}%`,
            background: value >= 80 ? '#ef4444' : value >= 60 ? '#f59e0b' : '#3b82f6',
            transition: 'width 0.8s ease-out',
          }}
        />
      </div>
      <span className="text-xs font-bold font-mono flex-shrink-0"
            style={{ color: value >= 80 ? '#f87171' : value >= 60 ? '#fbbf24' : '#60a5fa', minWidth: '36px' }}>
        {value}%
      </span>
    </div>
  );
}

function TriageCard({ report, onVerify, onReject }) {
  const [expanded,   setExpanded]   = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [action,     setAction]     = useState(null); // 'verify' | 'reject'
  const cfg = HAZARD_CONFIG[report.type] ?? { color: '#94a3b8', bg: 'rgba(255,255,255,0.05)', icon: '⚠️' };
  const sev = SEVERITY_COLORS[report.severity] ?? '#94a3b8';

  const handleVerify = () => {
    setAction('verify');
    setDismissing(true);
    setTimeout(() => onVerify(report.id), 400);
  };

  const handleReject = () => {
    setAction('reject');
    setDismissing(true);
    setTimeout(() => onReject(report.id), 400);
  };

  return (
    <div
      className={`triage-card ${report.severity} ${dismissing ? 'card-dismiss' : ''}`}
      style={{
        borderLeftColor: sev,
        // Glow ring for live user-submitted reports
        boxShadow: report.isUserSubmitted
          ? `0 0 0 1px rgba(239,68,68,0.35), inset 2px 0 8px ${sev}22`
          : undefined,
      }}
    >
      {/* Live user-submitted badge */}
      {report.isUserSubmitted && (
        <div className="flex items-center gap-1.5 mb-2 px-2 py-1 rounded-lg"
             style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <span className="w-1.5 h-1.5 rounded-full status-live" style={{ background: '#ef4444' }} />
          <span className="text-xs font-bold" style={{ color: '#f87171' }}>LIVE · USER SUBMITTED</span>
        </div>
      )}

      {/* Top row */}
      <div className="flex items-start gap-2 mb-2">
        <div className="text-xl flex-shrink-0" style={{ lineHeight: 1 }}>{cfg.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {report.type}
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded font-semibold"
                  style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}44` }}>
              {report.severity.toUpperCase()}
            </span>
            <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              {report.id}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="truncate">📍 {report.location}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
          <Clock size={10} />
          {timeAgo(report.timestamp)}
        </div>
      </div>

      {/* AI Confidence */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            🤖 AI Confidence
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {report.aiConfidence >= 80 ? 'High certainty' : report.aiConfidence >= 60 ? 'Moderate certainty' : 'Needs review'}
          </span>
        </div>
        <ConfidenceBar value={report.aiConfidence} color={cfg.color} />
        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          {report.aiConfidence}% probability of {report.type}
        </div>
      </div>

      {/* Evidence chips */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {report.evidence.map((ev, i) => (
          <span key={i} className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
            {ev}
          </span>
        ))}
      </div>

      {/* Inline photo preview (user-submitted reports) */}
      {report.isUserSubmitted && report.photoUrl && (
        <div className="mb-2 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          <img src={report.photoUrl} alt="Field Evidence" className="w-full object-cover" style={{ maxHeight: '100px' }} />
          <div className="px-2 py-1 text-xs" style={{ background: 'rgba(0,0,0,0.5)', color: 'var(--text-muted)' }}>
            📎 Photo evidence from field report
          </div>
        </div>
      )}

      {/* Expandable description */}
      {report.description && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-between text-xs mb-3 py-1"
          style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <span>View Details</span>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      )}
      {expanded && (
        <div className="text-xs mb-3 px-2 py-2 rounded-lg leading-relaxed"
             style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
          {report.description}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleVerify}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(21,128,61,0.3))',
            border: '1px solid rgba(34,197,94,0.5)',
            color: '#4ade80',
            cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34,197,94,0.35), rgba(21,128,61,0.45))'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(34,197,94,0.25)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(21,128,61,0.3))'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <Radio size={12} className="flex-shrink-0" />
          Verify & Broadcast
        </button>
        <button
          onClick={handleReject}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#f87171',
            cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.2)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <XCircle size={12} className="flex-shrink-0" />
          Reject (False Alarm)
        </button>
      </div>
    </div>
  );
}

export default function TriageQueue() {
  const { reports, verifyReport, rejectReport } = useApp();
  const [filter, setFilter] = useState('all');

  const pending  = reports.filter(r => r.status === 'pending');
  const verified = reports.filter(r => r.status === 'verified');
  const rejected = reports.filter(r => r.status === 'rejected');
  const liveUser = pending.filter(r => r.isUserSubmitted);

  const displayed = filter === 'all'      ? pending
                  : filter === 'live'     ? liveUser
                  : filter === 'critical' ? pending.filter(r => r.severity === 'critical')
                  : filter === 'verified' ? verified
                  : rejected;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              HITL Triage Queue
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {pending.length > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                <span className="status-live w-1.5 h-1.5 rounded-full" style={{ background: '#ef4444' }}></span>
                {pending.length} pending
              </span>
            )}
          </div>
        </div>
        <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
          AI-processed reports awaiting human verification
        </p>

        {/* Filter tabs */}
        <div className="flex gap-1 flex-wrap">
          {[
            { id: 'all',      label: `All (${pending.length})` },
            { id: 'live',     label: `🟥 Live (${liveUser.length})` },
            { id: 'critical', label: `Critical (${pending.filter(r => r.severity === 'critical').length})` },
            { id: 'verified', label: `✅ ${verified.length}` },
            { id: 'rejected', label: `❌ ${rejected.length}` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className="flex-1 py-1 rounded-lg text-xs font-medium transition-all"
              style={{
                background: filter === tab.id ? 'rgba(239,68,68,0.15)' : 'var(--bg-card)',
                border: filter === tab.id ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--border-subtle)',
                color: filter === tab.id ? '#f87171' : 'var(--text-muted)',
                cursor: 'pointer',
                minWidth: '0',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards list */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <CheckCircle size={32} style={{ color: '#22c55e', marginBottom: '8px' }} />
            <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              {filter === 'all' ? 'All reports processed' : 'No reports in this category'}
            </div>
          </div>
        ) : (
          displayed.map(report => (
            <TriageCard
              key={report.id}
              report={report}
              onVerify={verifyReport}
              onReject={rejectReport}
            />
          ))
        )}
      </div>
    </div>
  );
}
