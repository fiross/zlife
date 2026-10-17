import React, { useState, useEffect } from 'react';
import { Lock, Delete, ShieldAlert } from 'lucide-react';
import { api } from '../api';

export default function PasscodeLock({ onAuthenticated }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const handleKeyPress = (digit) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError('');
      // Auto-submit if 4 digits entered
      if (nextPin.length === 4) {
        attemptLogin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const attemptLogin = async (passcodeToTry) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.auth.login(passcodeToTry);
      if (res.success) {
        onAuthenticated(res.role);
      }
    } catch (err) {
      setIsShaking(true);
      setError(err.message || 'Invalid passcode');
      setPin('');
      setTimeout(() => setIsShaking(false), 500);
    } finally {
      setLoading(false);
    }
  };

  // Physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  return (
    <div className="lock-screen-overlay" id="passcode-lock-screen">
      <div className={`lock-card ${isShaking ? 'shake-anim' : ''}`}>
        <div className="lock-icon-wrap">
          <Lock size={28} />
        </div>

        <h2 style={{ fontSize: '1.4rem', color: 'var(--navy-slate)', marginBottom: '4px' }}>
          Daily Tracker Lock
        </h2>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          Enter numeric passcode to unlock
        </p>

        {/* PIN Dots (visualizes 4 slots) */}
        <div className="pin-dots-row">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`pin-dot ${pin.length > index ? 'filled' : ''}`}
            />
          ))}
        </div>

        {error && (
          <div style={{
            color: 'var(--danger-rose)',
            fontSize: '0.82rem',
            fontWeight: '600',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <ShieldAlert size={16} />
            {error}
          </div>
        )}

        {/* 3x4 Numeric Keypad */}
        <div className="keypad-grid">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              className="keypad-key"
              onClick={() => handleKeyPress(digit)}
              disabled={loading}
              id={`keypad-${digit}`}
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            className="keypad-key special"
            onClick={handleClear}
            disabled={loading || pin.length === 0}
            id="keypad-clear"
          >
            CLEAR
          </button>
          <button
            type="button"
            className="keypad-key"
            onClick={() => handleKeyPress('0')}
            disabled={loading}
            id="keypad-0"
          >
            0
          </button>
          <button
            type="button"
            className="keypad-key special"
            onClick={handleBackspace}
            disabled={loading || pin.length === 0}
            id="keypad-backspace"
          >
            <Delete size={20} />
          </button>
        </div>

        <div className="lock-hints">
          <div>🔑 <strong>Parent Passcode:</strong> 0023 (Full Access)</div>
          <div>👨‍🏫 <strong>Teacher Passcode:</strong> 5678 (Summary View)</div>
        </div>
      </div>
    </div>
  );
}
