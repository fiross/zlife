import React, { useState, useEffect } from 'react';
import { Lock, Delete, ShieldAlert, Sparkles, KeyRound } from 'lucide-react';
import { api } from '../api';
import logoImg from '../assets/logo.png';

const KEYPAD_BUTTONS = [
  { digit: '1', letters: '—' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
];

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
        <div className="lock-logo-wrap">
          <img
            src={logoImg}
            alt="Z-Life Daily Tracker - Autism Care"
            className="lock-brand-logo"
          />
        </div>
        <p className="lock-prompt-text">
          Enter 4-digit passcode to unlock
        </p>

        {/* Illuminated PIN Dots */}
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
            color: 'var(--coral-accent)',
            fontSize: '0.84rem',
            fontWeight: '700',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <ShieldAlert size={16} />
            {error}
          </div>
        )}

        {/* Tactile 3x4 Keypad with Letters */}
        <div className="keypad-grid">
          {KEYPAD_BUTTONS.map(({ digit, letters }) => (
            <button
              key={digit}
              type="button"
              className="keypad-key"
              onClick={() => handleKeyPress(digit)}
              disabled={loading}
              id={`keypad-${digit}`}
            >
              <span className="keypad-digit">{digit}</span>
              <span className="keypad-letters">{letters}</span>
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
            <span className="keypad-digit">0</span>
            <span className="keypad-letters">+</span>
          </button>
          <button
            type="button"
            className="keypad-key special"
            onClick={handleBackspace}
            disabled={loading || pin.length === 0}
            id="keypad-backspace"
            title="Backspace"
          >
            <Delete size={22} />
          </button>
        </div>

        {/* Demo PIN Quick Access & Information Chip */}
        <div className="lock-keypad-footer-hints">
          <button
            type="button"
            className="lock-demo-chip-btn"
            onClick={() => attemptLogin('1234')}
            disabled={loading}
            title="Enter Demo Mode with PIN 1234"
            id="quick-demo-unlock-btn"
          >
            <span className="demo-pin-pill">DEMO PIN: 1234</span>
            <span className="demo-pin-label">Interactive Parental Preview</span>
          </button>
        </div>
      </div>
    </div>
  );
}
