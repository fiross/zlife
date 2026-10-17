import React from 'react';
import {
  Moon, Pill, Smile, Sparkles, ShieldCheck,
  Music, Activity, Utensils, FileText, CheckCircle2,
  Clock, Lock
} from 'lucide-react';

const MOOD_EMOJIS = {
  'Calm': '😌',
  'Happy': '😊',
  'Aggressive': '😡',
  'Anxiety': '😰',
  'Hyperactive': '⚡',
  'Sensory Overload': '💥',
  'Withdrawn': '😶'
};

export default function LogDashboard({
  log,
  masterLists,
  role,
  onUpdateField,
  onToggleArrayItem,
  onSave,
  saving,
  lastSavedAt
}) {
  const isParent = role === 'parent';

  // Master lists
  const moods = masterLists?.mood || [];
  const medications = masterLists?.medication || [];
  const behaviors = masterLists?.behavior || [];
  const interventions = masterLists?.intervention || [];
  const activities = masterLists?.activity || [];
  const exercises = masterLists?.exercise || [];
  const foods = masterLists?.food || [];

  const sleepPresets = [6, 7, 7.5, 8, 8.5, 9, 10];

  const handleSleepStep = (delta) => {
    if (!isParent) return;
    const current = Number(log.sleep_hours) || 0;
    const nextVal = Math.max(0, Math.min(24, Math.round((current + delta) * 10) / 10));
    onUpdateField('sleep_hours', nextVal);
  };

  return (
    <div className="dashboard-content" id="log-dashboard">

      {/* Teacher View-Only Notice */}
      {!isParent && (
        <div style={{
          margin: '10px 16px 0',
          padding: '10px 14px',
          background: 'var(--purple-light)',
          border: '1px solid var(--purple-calm)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--purple-calm)',
          fontSize: '0.84rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: '600'
        }}>
          <Lock size={16} />
          Teacher Mode: Viewing logged routine and medication summary (Read-Only).
        </div>
      )}

      {/* 1. Sleep Tracking */}
      <section className="card-section" id="section-sleep">
        <div className="section-header">
          <div className="section-title-wrap">
            <div className="section-icon-badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>
              <Moon size={18} />
            </div>
            <div>
              <h2 className="section-title">Sleep Duration</h2>
              <p className="section-subtitle">Last night's total rest</p>
            </div>
          </div>
          <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--teal-primary)' }}>
            {log.sleep_hours ? `${log.sleep_hours} hrs` : 'Not recorded'}
          </span>
        </div>

        <div className="sleep-widget">
          <div className="sleep-display-row">
            {isParent && (
              <button
                type="button"
                className="stepper-btn"
                onClick={() => handleSleepStep(-0.5)}
                disabled={!isParent || Number(log.sleep_hours) <= 0}
                id="sleep-minus-btn"
              >
                -
              </button>
            )}

            <div className="sleep-number">
              {Number(log.sleep_hours).toFixed(1)}
              <span>hrs</span>
            </div>

            {isParent && (
              <button
                type="button"
                className="stepper-btn"
                onClick={() => handleSleepStep(0.5)}
                disabled={!isParent || Number(log.sleep_hours) >= 24}
                id="sleep-plus-btn"
              >
                +
              </button>
            )}
          </div>

          {/* Quick presets (Parents only) */}
          {isParent && (
            <div className="sleep-presets">
              {sleepPresets.map((val) => (
                <button
                  key={val}
                  type="button"
                  className={`preset-chip ${Number(log.sleep_hours) === val ? 'active' : ''}`}
                  onClick={() => onUpdateField('sleep_hours', val)}
                >
                  {val}h
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 2. Dynamic Medication Tracking */}
      <section className="card-section" id="section-medications">
        <div className="section-header">
          <div className="section-title-wrap">
            <div className="section-icon-badge" style={{ background: 'var(--teal-light)', color: 'var(--teal-primary)' }}>
              <Pill size={18} />
            </div>
            <div>
              <h2 className="section-title">Medication Administered</h2>
              <p className="section-subtitle">Dynamic prescription & supplement checklist</p>
            </div>
          </div>
          <span style={{
            fontSize: '0.78rem',
            fontWeight: '700',
            color: 'var(--teal-primary)',
            background: 'var(--teal-light)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)'
          }}>
            {log.medications?.length || 0} Given
          </span>
        </div>

        {medications.length === 0 ? (
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            No medications configured. Add them in Admin Settings.
          </p>
        ) : isParent ? (
          <div className="tag-grid">
            {medications.map((item) => {
              const isChecked = log.medications?.includes(item.item_name);
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`tag-btn ${isChecked ? 'med-active' : ''}`}
                  onClick={() => onToggleArrayItem('medications', item.item_name)}
                  id={`med-toggle-${item.id}`}
                >
                  <Pill size={15} />
                  <span>{item.item_name}</span>
                  {isChecked && <CheckCircle2 size={16} />}
                </button>
              );
            })}
          </div>
        ) : (
          /* Teacher View: Summary Badges */
          <div className="tag-grid">
            {medications.map((item) => {
              const isChecked = log.medications?.includes(item.item_name);
              return (
                <div
                  key={item.id}
                  className={`tag-btn ${isChecked ? 'med-active' : ''}`}
                  style={{ cursor: 'default', opacity: isChecked ? 1 : 0.4 }}
                >
                  <Pill size={15} />
                  <span>{item.item_name}</span>
                  {isChecked ? <CheckCircle2 size={16} /> : <span style={{ fontSize: '0.75rem' }}>(Not given)</span>}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Mood & Energy (Single Select) */}
      <section className="card-section" id="section-mood">
        <div className="section-header">
          <div className="section-title-wrap">
            <div className="section-icon-badge" style={{ background: '#fef3c7', color: '#b45309' }}>
              <Smile size={18} />
            </div>
            <div>
              <h2 className="section-title">Primary Mood & Energy</h2>
              <p className="section-subtitle">Overall emotional disposition</p>
            </div>
          </div>
        </div>

        <div className="mood-grid">
          {moods.map((item) => {
            const isSelected = log.overall_mood === item.item_name;
            const emoji = MOOD_EMOJIS[item.item_name] || '✨';
            return (
              <button
                key={item.id}
                type="button"
                className={`mood-card ${isSelected ? 'selected' : ''}`}
                onClick={() => isParent && onUpdateField('overall_mood', item.item_name)}
                disabled={!isParent}
                style={{ cursor: isParent ? 'pointer' : 'default' }}
                id={`mood-btn-${item.id}`}
              >
                <span style={{ fontSize: '1.25rem' }}>{emoji}</span>
                <span>{item.item_name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Sensory Behaviors Observed (Multi-Select) */}
      <section className="card-section" id="section-behaviors">
        <div className="section-header">
          <div className="section-title-wrap">
            <div className="section-icon-badge" style={{ background: 'var(--coral-light)', color: 'var(--coral-accent)' }}>
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="section-title">Sensory Behaviors Observed</h2>
              <p className="section-subtitle">Stimming, sensitivity, or escalation signs</p>
            </div>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {log.sensory_behaviors?.length || 0} selected
          </span>
        </div>

        <div className="tag-grid">
          {behaviors.map((item) => {
            const isChecked = log.sensory_behaviors?.includes(item.item_name);
            return (
              <button
                key={item.id}
                type="button"
                className={`tag-btn ${isChecked ? 'behavior-active' : ''}`}
                onClick={() => isParent && onToggleArrayItem('sensory_behaviors', item.item_name)}
                disabled={!isParent}
                style={{ cursor: isParent ? 'pointer' : 'default', opacity: !isParent && !isChecked ? 0.35 : 1 }}
                id={`behavior-toggle-${item.id}`}
              >
                <span>{item.item_name}</span>
                {isChecked && <CheckCircle2 size={16} />}
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. Calming Interventions (Multi-Select) */}
      <section className="card-section" id="section-interventions">
        <div className="section-header">
          <div className="section-title-wrap">
            <div className="section-icon-badge" style={{ background: 'var(--navy-light)', color: 'var(--navy-slate)' }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="section-title">Calming Interventions Applied</h2>
              <p className="section-subtitle">Deep pressure, warmth, earmuffs, sensory breaks</p>
            </div>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {log.interventions?.length || 0} applied
          </span>
        </div>

        <div className="tag-grid">
          {interventions.map((item) => {
            const isChecked = log.interventions?.includes(item.item_name);
            return (
              <button
                key={item.id}
                type="button"
                className={`tag-btn ${isChecked ? 'intervention-active' : ''}`}
                onClick={() => isParent && onToggleArrayItem('interventions', item.item_name)}
                disabled={!isParent}
                style={{ cursor: isParent ? 'pointer' : 'default', opacity: !isParent && !isChecked ? 0.35 : 1 }}
                id={`intervention-toggle-${item.id}`}
              >
                <span>{item.item_name}</span>
                {isChecked && <CheckCircle2 size={16} />}
              </button>
            );
          })}
        </div>
      </section>

      {/* 6. Creative & Skill Activities */}
      <section className="card-section" id="section-activities">
        <div className="section-header">
          <div className="section-title-wrap">
            <div className="section-icon-badge" style={{ background: 'var(--purple-light)', color: 'var(--purple-calm)' }}>
              <Music size={18} />
            </div>
            <div>
              <h2 className="section-title">Creative & Skill Activities</h2>
              <p className="section-subtitle">Music, keyboard, speech therapy</p>
            </div>
          </div>
        </div>

        <div className="tag-grid">
          {activities.map((item) => {
            const isChecked = log.activities?.includes(item.item_name);
            return (
              <button
                key={item.id}
                type="button"
                className={`tag-btn ${isChecked ? 'activity-active' : ''}`}
                onClick={() => isParent && onToggleArrayItem('activities', item.item_name)}
                disabled={!isParent}
                style={{ cursor: isParent ? 'pointer' : 'default', opacity: !isParent && !isChecked ? 0.35 : 1 }}
                id={`activity-toggle-${item.id}`}
              >
                <span>{item.item_name}</span>
                {isChecked && <CheckCircle2 size={16} />}
              </button>
            );
          })}
        </div>
      </section>

      {/* 7. Exercise & Movement */}
      <section className="card-section" id="section-exercise">
        <div className="section-header">
          <div className="section-title-wrap">
            <div className="section-icon-badge" style={{ background: '#ecfdf5', color: '#059669' }}>
              <Activity size={18} />
            </div>
            <div>
              <h2 className="section-title">Exercise & Physical Play</h2>
              <p className="section-subtitle">Pickleball, badminton, walks, yoga</p>
            </div>
          </div>
        </div>

        <div className="tag-grid">
          {exercises.map((item) => {
            const isChecked = log.activities?.includes(item.item_name);
            return (
              <button
                key={item.id}
                type="button"
                className={`tag-btn ${isChecked ? 'active' : ''}`}
                onClick={() => isParent && onToggleArrayItem('activities', item.item_name)}
                disabled={!isParent}
                style={{ cursor: isParent ? 'pointer' : 'default', opacity: !isParent && !isChecked ? 0.35 : 1 }}
                id={`exercise-toggle-${item.id}`}
              >
                <span>{item.item_name}</span>
                {isChecked && <CheckCircle2 size={16} />}
              </button>
            );
          })}
        </div>
      </section>

      {/* 8. Food & Nutrition */}
      <section className="card-section" id="section-food">
        <div className="section-header">
          <div className="section-title-wrap">
            <div className="section-icon-badge" style={{ background: 'var(--amber-light)', color: 'var(--amber-sun)' }}>
              <Utensils size={18} />
            </div>
            <div>
              <h2 className="section-title">Food & Dietary Categories</h2>
              <p className="section-subtitle">Protein, salty/crunchy, high-sugar, general</p>
            </div>
          </div>
        </div>

        <div className="tag-grid">
          {foods.map((item) => {
            const isChecked = log.food?.includes(item.item_name);
            return (
              <button
                key={item.id}
                type="button"
                className={`tag-btn ${isChecked ? 'food-active' : ''}`}
                onClick={() => isParent && onToggleArrayItem('food', item.item_name)}
                disabled={!isParent}
                style={{ cursor: isParent ? 'pointer' : 'default', opacity: !isParent && !isChecked ? 0.35 : 1 }}
                id={`food-toggle-${item.id}`}
              >
                <span>{item.item_name}</span>
                {isChecked && <CheckCircle2 size={16} />}
              </button>
            );
          })}
        </div>
      </section>

      {/* 9. Narrative Notes */}
      <section className="card-section" id="section-notes">
        <div className="section-header">
          <div className="section-title-wrap">
            <div className="section-icon-badge" style={{ background: '#f1f5f9', color: '#475569' }}>
              <FileText size={18} />
            </div>
            <div>
              <h2 className="section-title">Observations & Notes</h2>
              <p className="section-subtitle">Voice-friendly narrative, school feedback</p>
            </div>
          </div>
        </div>

        <textarea
          className="notes-textarea"
          value={log.notes || ''}
          onChange={(e) => isParent && onUpdateField('notes', e.target.value)}
          disabled={!isParent}
          placeholder={isParent ? "Type or dictate daily observations, teacher feedback, or triggers..." : "No notes recorded for this date."}
          id="notes-input"
        />
      </section>

      {/* Sticky Save Bar (Parent Only) */}
      {isParent && (
        <div className="save-footer" id="save-footer">
          <div className="save-status-text">
            {lastSavedAt ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> Last saved: {lastSavedAt}
              </span>
            ) : log.exists ? (
              <span>Existing log loaded</span>
            ) : (
              <span>Unsaved changes for this date</span>
            )}
          </div>

          <button
            type="button"
            className="btn btn-primary save-btn-large"
            onClick={onSave}
            disabled={saving}
            id="save-log-btn"
          >
            {saving ? 'Saving...' : 'Save Daily Log'}
          </button>
        </div>
      )}
    </div>
  );
}
