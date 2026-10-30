import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { api } from './api';
import PasscodeLock from './components/PasscodeLock';
import Header from './components/Header';
import DateNavigator from './components/DateNavigator';
import LogDashboard from './components/LogDashboard';
import AdminModal from './components/AdminModal';
import SensorySOSModal from './components/SensorySOSModal';
import { CheckCircle2 } from 'lucide-react';
import { getLocalDateString } from './utils/date';
import logoIcon from './assets/logo-icon.png';

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [role, setRole] = useState(null); // 'parent' | 'teacher'
  const [loadingSession, setLoadingSession] = useState(true);

  // Settings & Lists
  const [settings, setSettings] = useState(null);
  const [masterLists, setMasterLists] = useState(null);

  // Date & Current Log (uses client's local date, avoiding UTC shift)
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString());
  const [log, setLog] = useState({
    sleep_hours: 0,
    overall_mood: '',
    is_menstruating: false,
    flow_intensity: 'Medium',
    medications: [],
    sensory_behaviors: [],
    interventions: [],
    activities: [],
    food: [],
    notes: '',
    exists: false
  });
  const [logLoading, setLogLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Modals
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminTab, setAdminTab] = useState('history');
  const [sosOpen, setSosOpen] = useState(false);

  const handleOpenAdmin = (tab = 'history') => {
    setAdminTab(tab);
    setAdminOpen(true);
  };

  // Check initial session
  useEffect(() => {
    checkAuthSession();
  }, []);

  const checkAuthSession = async () => {
    try {
      setLoadingSession(true);
      const res = await api.auth.checkSession();
      if (res.authenticated && res.role) {
        setAuthenticated(true);
        setRole(res.role);
      } else {
        setAuthenticated(false);
        setRole(null);
      }
    } catch {
      setAuthenticated(false);
      setRole(null);
    } finally {
      setLoadingSession(false);
    }
  };

  // When authenticated, load settings and active master lists
  const loadMasterData = useCallback(async () => {
    try {
      const [settingsRes, listsRes] = await Promise.all([
        api.settings.get().catch(() => ({ success: false })),
        api.lists.get(false).catch(() => ({ success: false }))
      ]);

      if (settingsRes.success) setSettings(settingsRes.data);
      if (listsRes.success) setMasterLists(listsRes.data);
    } catch (err) {
      console.error('Error loading master data:', err);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadMasterData();
    }
  }, [authenticated, loadMasterData]);

  // Load log whenever selectedDate or authenticated status changes
  const loadLogForDate = useCallback(async (date) => {
    try {
      setLogLoading(true);
      const res = await api.logs.getByDate(date);
      if (res.success && res.data) {
        setLog(res.data);
      }
    } catch (err) {
      console.error('Failed to load log for date:', err);
    } finally {
      setLogLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated && selectedDate) {
      loadLogForDate(selectedDate);
    }
  }, [authenticated, selectedDate, loadLogForDate]);

  // Auth Handlers
  const handleAuthenticated = (userRole) => {
    setAuthenticated(true);
    setRole(userRole);
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    setAuthenticated(false);
    setRole(null);
  };

  // Form State Mutators (Optimistic Updates)
  const handleUpdateField = (field, value) => {
    setLog((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleToggleArrayItem = (arrayField, item) => {
    setLog((prev) => {
      const currentList = prev[arrayField] || [];
      const exists = currentList.includes(item);
      const updatedList = exists
        ? currentList.filter((x) => x !== item)
        : [...currentList, item];

      return {
        ...prev,
        [arrayField]: updatedList
      };
    });
  };

  // Save Log Handler
  const handleSaveLog = async () => {
    if (role === 'demo') {
      showToast('ℹ️ Save is disabled in Demo Mode.');
      return;
    }
    if (role !== 'parent') return;
    setSaving(true);
    try {
      const payload = {
        log_date: selectedDate,
        sleep_hours: log.sleep_hours,
        overall_mood: log.overall_mood,
        is_menstruating: Boolean(log.is_menstruating),
        flow_intensity: log.is_menstruating ? (log.flow_intensity || 'Medium') : null,
        medications: log.medications,
        sensory_behaviors: log.sensory_behaviors,
        interventions: log.interventions,
        activities: log.activities,
        food: log.food,
        notes: log.notes
      };

      const res = await api.logs.save(payload);
      if (res.success) {
        const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastSavedAt(timeNow);
        setLog((prev) => ({ ...prev, exists: true }));
        showToast('Daily log saved successfully!');
      }
    } catch (err) {
      alert(err.message || 'Error saving log');
    } finally {
      setSaving(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  if (loadingSession) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-page)',
        fontFamily: 'var(--font-heading)',
        color: 'var(--navy-slate)',
        gap: '14px'
      }}>
        <img
          src={logoIcon}
          alt="Z-Life"
          style={{ width: '56px', height: '56px', animation: 'pulse-sos 2s infinite' }}
        />
        <div style={{ fontSize: '1.15rem', fontWeight: '700', letterSpacing: '-0.01em' }}>
          Loading Z-Life Daily Tracker...
        </div>
      </div>
    );
  }

  // Not logged in -> Render numeric keypad lock
  if (!authenticated) {
    return <PasscodeLock onAuthenticated={handleAuthenticated} />;
  }

  return (
    <>
      <div className="app-container" id="app-root">
      {/* Header */}
      <Header
        settings={settings}
        role={role}
        onOpenAdmin={() => handleOpenAdmin('lists')}
        onOpenHistory={() => handleOpenAdmin('history')}
        onOpenSOS={() => setSosOpen(true)}
        onLogout={handleLogout}
      />

      {/* Date Navigation */}
      <DateNavigator
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      {/* Main Logging Dashboard */}
      {logLoading ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading log for {selectedDate}...
        </div>
      ) : (
        <LogDashboard
          log={log}
          masterLists={masterLists}
          role={role}
          settings={settings}
          onUpdateField={handleUpdateField}
          onToggleArrayItem={handleToggleArrayItem}
          onSave={handleSaveLog}
          saving={saving}
          lastSavedAt={lastSavedAt}
        />
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="toast-notice" id="toast-message">
          <CheckCircle2 size={18} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>

    {/* Admin & History Modal - Portaled to document.body for true viewport centering */}
    {(role === 'parent' || role === 'demo') && adminOpen && createPortal(
      <AdminModal
        isOpen={adminOpen}
        onClose={() => setAdminOpen(false)}
        currentSettings={settings}
        onSettingsUpdated={setSettings}
        onListsUpdated={loadMasterData}
        onSelectDate={(date) => {
          setSelectedDate(date);
          setAdminOpen(false);
        }}
        initialTab={adminTab}
        isDemo={role === 'demo'}
      />,
      document.body
    )}

    {/* Sensory SOS Modal - Portaled to document.body */}
    {sosOpen && createPortal(
      <SensorySOSModal
        isOpen={sosOpen}
        onClose={() => setSosOpen(false)}
        childName={settings?.z_name || 'your child'}
      />,
      document.body
    )}
  </>
  );
}
