import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { mockReports, mockGeofences } from '../data/mockData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // ─── Report state (persisted to localStorage) ──────────────────────────────
  const [reports, setReports] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ag_reports') || 'null');
      // Merge saved user-submitted reports on top of the mock seed data
      if (saved && saved.length > 0) {
        // Keep mock reports at bottom, user-submitted on top
        const mockIds = new Set(mockReports.map(r => r.id));
        const userReports = saved.filter(r => !mockIds.has(r.id));
        return [...userReports, ...mockReports];
      }
    } catch { /* ignore */ }
    return mockReports;
  });

  // ─── Offline queue (persisted to localStorage) ─────────────────────────────
  const [offlineQueue, setOfflineQueue] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ag_offline_queue') || '[]');
    } catch {
      return [];
    }
  });

  // ─── Geofences ────────────────────────────────────────────────────────────
  const [geofences, setGeofences] = useState(mockGeofences);

  // ─── Active alerts ────────────────────────────────────────────────────────
  const [activeAlerts, setActiveAlerts] = useState([]);

  // ─── User location ────────────────────────────────────────────────────────
  const [userLocation, setUserLocation] = useState(null);

  // ─── Online status ────────────────────────────────────────────────────────
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ─── Persist offline queue ────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('ag_offline_queue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  // ─── Persist live reports (only user-submitted, not mock seed) ────────────
  useEffect(() => {
    const mockIds = new Set(mockReports.map(r => r.id));
    const userReports = reports.filter(r => !mockIds.has(r.id));
    if (userReports.length > 0) {
      localStorage.setItem('ag_reports', JSON.stringify(userReports));
    }
  }, [reports]);

  // ─── Add a report to offline queue ────────────────────────────────────────
  const addToQueue = useCallback((report) => {
    const entry = {
      ...report,
      id: `LOCAL-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'queued',
    };
    setOfflineQueue(q => [entry, ...q]);
    return entry;
  }, []);

  // ─── Submit offline queue when back online ────────────────────────────────
  const flushQueue = useCallback(async () => {
    if (!isOnline || offlineQueue.length === 0) return;
    // Mock: move all queued items to live reports
    setReports(prev => [...offlineQueue.map(r => ({ ...r, status: 'pending', aiConfidence: Math.floor(Math.random() * 30) + 60 })), ...prev]);
    setOfflineQueue([]);
  }, [isOnline, offlineQueue]);

  useEffect(() => {
    if (isOnline) flushQueue();
  }, [isOnline, flushQueue]);

  // ─── Submit report (online-first, queue if offline) ────────────────────────
  const submitReport = useCallback((report) => {
    if (isOnline) {
      const reportId = `RPT-USR-${Date.now()}`;
      // Build evidence — preserve what the form provides, add AI processing note
      const baseEvidence = report.evidence?.length > 0
        ? report.evidence
        : ['1 User Report'];
      const fullEvidence = [
        ...baseEvidence,
        report.photoUrl ? '📷 Photo Evidence Attached' : null,
        'AI Classification Pending...',
      ].filter(Boolean);

      const entry = {
        ...report,
        id: reportId,
        timestamp: new Date().toISOString(),
        status: 'pending',
        // Simulate AI confidence arriving ~2s after submission
        aiConfidence: Math.floor(Math.random() * 25) + 62,
        userReports: 1,
        evidence: fullEvidence,
        isUserSubmitted: true,          // flag for dashboard highlighting
      };
      setReports(prev => [entry, ...prev]);
      return { queued: false, entry };
    } else {
      const entry = addToQueue(report);
      return { queued: true, entry };
    }
  }, [isOnline, reports.length, offlineQueue.length, addToQueue]);

  // ─── HITL: Verify report → broadcast alert ───────────────────────────────
  const verifyReport = useCallback((reportId) => {
    setReports(prev =>
      prev.map(r => r.id === reportId ? { ...r, status: 'verified' } : r)
    );
    const report = reports.find(r => r.id === reportId);
    if (report) {
      const alert = {
        id: `ALERT-${Date.now()}`,
        type: report.type,
        location: report.location,
        message: `⚠️ VERIFIED ALERT: ${report.type} confirmed at ${report.location}. Follow evacuation routes.`,
        timestamp: new Date().toISOString(),
        severity: report.severity,
      };
      setActiveAlerts(prev => [alert, ...prev]);
    }
  }, [reports]);

  // ─── HITL: Reject report (false alarm) ───────────────────────────────────
  const rejectReport = useCallback((reportId) => {
    setReports(prev =>
      prev.map(r => r.id === reportId ? { ...r, status: 'rejected' } : r)
    );
  }, []);

  // ─── Add geofence ─────────────────────────────────────────────────────────
  const addGeofence = useCallback((geofence) => {
    setGeofences(prev => [{ ...geofence, id: `GF-${Date.now()}`, created: new Date().toISOString() }, ...prev]);
  }, []);

  // ─── Toggle geofence active ───────────────────────────────────────────────
  const toggleGeofence = useCallback((id) => {
    setGeofences(prev => prev.map(g => g.id === id ? { ...g, active: !g.active } : g));
  }, []);

  return (
    <AppContext.Provider value={{
      reports,
      offlineQueue,
      geofences,
      activeAlerts,
      userLocation,
      setUserLocation,
      isOnline,
      submitReport,
      flushQueue,
      verifyReport,
      rejectReport,
      addGeofence,
      toggleGeofence,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
