import React from 'react';
import { Settings, LogOut, HeartPulse, User, FileSpreadsheet, Sparkles } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Header({ settings, role, activeView, onToggleForecast, onOpenAdmin, onOpenHistory, onOpenSOS, onLogout }) {
  const isParent = role === 'parent';
  const isDemo = role === 'demo';

  return (
    <header className="app-header" id="main-header">
      <div className="header-top">
        <div className="brand-wrapper" title="Z-Life Daily Tracker - Autism Care">
          <img
            src={logoImg}
            alt="Z-Life Daily Tracker - Autism Care"
            className="brand-logo-img"
          />
        </div>

        <div className="header-actions">
          {/* Sensory SOS Quick Trigger */}
          <button
            type="button"
            className="btn btn-sos"
            onClick={onOpenSOS}
            id="sos-button"
            title="Emergency Calming & Sensory Protocols"
          >
            <HeartPulse size={14} />
            <span className="sos-btn-text">SENSORY SOS</span>
          </button>

          {/* History & Export Quick Trigger (Parent or Demo) */}
          {(isParent || isDemo) && (
            <button
              type="button"
              className="btn-icon"
              onClick={onOpenHistory}
              id="history-quick-btn"
              title="View All Logs & Export CSV"
            >
              <FileSpreadsheet size={18} />
            </button>
          )}

          {/* Admin Configuration (Parent Only) */}
          {isParent && (
            <button
              type="button"
              className="btn-icon"
              onClick={onOpenAdmin}
              id="admin-button"
              title="Admin Configuration"
            >
              <Settings size={18} />
            </button>
          )}

          {/* AI Behavioral Forecast Trigger */}
          <button
            type="button"
            className={`btn-icon ${activeView === 'forecast' ? 'is-active' : ''}`}
            onClick={onToggleForecast}
            id="ai-forecast-quick-btn"
            title="AI Behavioral & Mood Forecast (7-Day Trends)"
          >
            <Sparkles size={18} />
          </button>

          {/* Logout / Lock Button */}
          <button
            type="button"
            className="btn-icon"
            onClick={onLogout}
            id="lock-logout-button"
            title="Lock Application"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Profile & Role Banner */}
      <div className="profile-chip-bar">
        <div className="profile-meta">
          <User size={14} />
          <span>
            <strong>{settings?.z_name || 'Child'}</strong> • {settings?.z_age ? `${settings.z_age} yrs` : 'Profile'} • {settings?.z_class || ''}
          </span>
        </div>
        <div className={`role-badge ${isDemo ? 'demo' : isParent ? 'parent' : 'teacher'}`}>
          {isDemo ? '✨ Demo (Parental View)' : isParent ? 'Parent (Full Access)' : 'Teacher (View Only)'}
        </div>
      </div>
    </header>
  );
}
