import React from 'react';
import { X, HeartPulse, Check, ShieldAlert, Sparkles, VolumeX, EyeOff, Coffee } from 'lucide-react';

const SOS_STEPS = [
  {
    title: "1. Noise Dampening",
    desc: "Offer Walker's Electronics earmuffs or move to quiet room immediately.",
    icon: <VolumeX size={20} color="#e76f51" />
  },
  {
    title: "2. Deep Pressure & Neutral Warmth",
    desc: "Provide firm joint compression (arms/shoulders) and weighted blanket cocoon.",
    icon: <Sparkles size={20} color="#1e7b75" />
  },
  {
    title: "3. Visual Stimuli Reduction",
    desc: "Dim room lighting and display clear visual timer for break length.",
    icon: <EyeOff size={20} color="#7b2cbf" />
  },
  {
    title: "4. Oral Sensory Input",
    desc: "Offer chewing gum or crunchy/salty snack for oral proprioceptive grounding.",
    icon: <Coffee size={20} color="#f4a261" />
  }
];

export default function SensorySOSModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" id="sos-modal-overlay">
      <div className="modal-sheet">
        <div className="modal-header" style={{ background: '#fff0f3', borderBottomColor: '#ffd6de' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="section-icon-badge" style={{ background: '#ffe3e8', color: '#c9184a' }}>
              <HeartPulse size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', color: '#a01a3b' }}>Sensory SOS Protocols</h2>
              <p style={{ fontSize: '0.74rem', color: '#c9184a' }}>Rapid de-escalation & calming guide</p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose} id="close-sos-btn">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{
            background: '#fff5f7',
            border: '1px solid #ffd1dc',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            fontSize: '0.84rem',
            color: '#80132f',
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>
              If Zeba experiences sensory overload or emotional distress, apply these proven interventions in sequence:
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {SOS_STEPS.map((step, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-page)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--radius-md)',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {step.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--navy-slate)', marginBottom: '2px' }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
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
            style={{ marginTop: '8px' }}
            id="understood-sos-btn"
          >
            <Check size={16} /> Understood, Return to Tracker
          </button>
        </div>
      </div>
    </div>
  );
}
