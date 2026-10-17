import React from 'react';
import { X, HeartPulse, Check, ShieldAlert, Sparkles, VolumeX, EyeOff, Coffee } from 'lucide-react';

const SOS_STEPS = [
  {
    title: "1. Noise Dampening",
    desc: "Offer Walker's Electronics earmuffs or move to quiet room immediately.",
    icon: <VolumeX size={22} color="#e11d48" />
  },
  {
    title: "2. Deep Pressure & Neutral Warmth",
    desc: "Provide firm joint compression (arms/shoulders) and weighted blanket cocoon.",
    icon: <Sparkles size={22} color="#0d9488" />
  },
  {
    title: "3. Visual Stimuli Reduction",
    desc: "Dim room lighting and display clear visual timer for break length.",
    icon: <EyeOff size={22} color="#7c3aed" />
  },
  {
    title: "4. Oral Sensory Input",
    desc: "Offer chewing gum or crunchy/salty snack for oral proprioceptive grounding.",
    icon: <Coffee size={22} color="#d97706" />
  }
];

export default function SensorySOSModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      id="sos-modal-overlay"
      onClick={(e) => {
        if (e.target.id === 'sos-modal-overlay') onClose();
      }}
    >
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header sos-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="section-icon-badge" style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)', color: '#ffffff' }}>
              <HeartPulse size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#9f1239' }}>Sensory SOS Protocols</h2>
              <p style={{ fontSize: '0.76rem', color: '#be123c', fontWeight: '600' }}>Rapid de-escalation & emergency calming guide</p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose} id="close-sos-btn" title="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px 22px 24px' }}>
          <div className="sos-info-banner">
            <ShieldAlert size={20} style={{ flexShrink: 0 }} />
            <span>
              If Zeba experiences sensory overload or emotional distress, apply these proven calming interventions in sequence:
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {SOS_STEPS.map((step, idx) => (
              <div key={idx} className="sos-step-card">
                <div className="sos-step-icon-wrap">
                  {step.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: '0.94rem', fontWeight: '800', color: 'var(--slate-navy)', marginBottom: '3px' }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: '1.45', fontWeight: '500' }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
            style={{
              height: '48px',
              marginTop: '10px',
              background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
              boxShadow: '0 6px 16px rgba(13, 148, 136, 0.35)'
            }}
            id="understood-sos-btn"
          >
            <Check size={18} /> Understood, Return to Tracker
          </button>
        </div>
      </div>
    </div>
  );
}
