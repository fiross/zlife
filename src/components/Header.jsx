import React from 'react';
import { Settings, LogOut, HeartPulse, User } from 'lucide-react';

export default function Header({ settings, role, onOpenAdmin, onOpenSOS, onLogout }) {
  const isParent = role === 'parent';

  return (
    <header className="app-header" id="main-header">
      <div className="header-top">
        <div className="brand-wrapper">
          <div className="brand-logo-icon">🌱</div>
          <div className="brand-text">
            <h1>Daily Tracker</h1>
            <p>Neurodivergent Care Log</p>
          </div>
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
            SENSORY SOS
          </button>

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
            <strong>{settings?.z_name || 'Zeba'}</strong> • {settings?.z_age || 15} yrs • {settings?.z_class || 'Grade 9'}
          </span>
        </div>
        <div className={`role-badge ${isParent ? 'parent' : 'teacher'}`}>
          {isParent ? 'Parent (Full Access)' : 'Teacher (View Only)'}
        </div>
      </div>
    </header>
  );
}
