import React from 'react';
import {
  Moon, Pill, Smile, Sparkles, ShieldCheck,
  Music, Activity, Utensils, FileText, CheckCircle2,
  Clock, Lock, Mic, Droplets
} from 'lucide-react';

// Comprehensive Glyph & Sub-Tag Dictionary for rich pediatric tactile buttons
const ITEM_GLYPHS = {
  // Medications
  'Focalin (Morning)': { icon: '☀️', tag: 'Morning Dose', color: '#0d9488' },
  'Melatonin (Night)': { icon: '🌙', tag: 'Bedtime Rest', color: '#6366f1' },
  'Guanfacine (Evening)': { icon: '🌅', tag: 'Evening Dose', color: '#0891b2' },

  // Moods
  'Calm': { emoji: '😌', sub: 'Regulated & Serene', color: '#0284c7' },
  'Happy': { emoji: '😊', sub: 'Bright & Engaged', color: '#eab308' },
  'Aggressive': { emoji: '😡', sub: 'High Agitation', color: '#ef4444' },
  'Anxiety': { emoji: '😰', sub: 'Nervous & Tense', color: '#8b5cf6' },
  'Hyperactive': { emoji: '⚡', sub: 'High Motor Drive', color: '#f59e0b' },
  'Sensory Overload': { emoji: '💥', sub: 'Overwhelmed', color: '#ec4899' },
  'Withdrawn': { emoji: '😶', sub: 'Low Response', color: '#64748b' },
  'Sensory Seeking': { emoji: '✨', sub: 'Seeking Input', color: '#10b981' },

  // Sensory Behaviors Observed
  'Ear Covering': { icon: '🎧', tag: 'Sound Overload', color: '#f43f5e' },
  'Food Grabbing': { icon: '🥪', tag: 'Oral Impulse', color: '#f97316' },
  'Cover with Blanket (Cocooning)': { icon: '🛋️', tag: 'Deep Rest', color: '#8b5cf6' },
  'Impulsive Pacing': { icon: '👣', tag: 'Movement Stimming', color: '#ec4899' },
  'Sound Sensitivity': { icon: '🔊', tag: 'Auditory Sensitivity', color: '#e11d48' },
  'Self-Regulation (Stimming)': { icon: '🌀', tag: 'Rhythmic Stimming', color: '#06b6d4' },

  // Calming Interventions Applied
  'Joint Compression': { icon: '🤲', tag: 'Deep Pressure', color: '#0284c7' },
  'Neutral Warmth': { icon: '🧣', tag: 'Gentle Warmth', color: '#0d9488' },
  'Walk': { icon: '🚶', tag: 'Sensory Walk', color: '#10b981' },
  'Earmuffs (Walker\'s Electronics)': { icon: '🎧', tag: 'Decibel Dampening', color: '#6366f1' },
  'Visual Timer': { icon: '⏳', tag: 'Time Predictability', color: '#d97706' },
  'Oral Sensory (Gum/Crunch)': { icon: '🍬', tag: 'Proprioceptive Chew', color: '#f59e0b' },
  'Visual Board Prompt': { icon: '📋', tag: 'Visual Schedule', color: '#8b5cf6' },

  // Creative & Skill Activities
  'Music Class': { icon: '🎵', tag: 'Rhythm & Melody', color: '#9333ea' },
  'Keyboard': { icon: '🎹', tag: 'Fine Motor Keys', color: '#7c3aed' },
  'Speech': { icon: '💬', tag: 'Verbal Expression', color: '#a855f7' },

  // Exercise & Physical Play
  'Pickleball': { icon: '🏓', tag: 'Hand-Eye Play', color: '#16a34a' },
  'Badminton': { icon: '🏸', tag: 'Agility & Rally', color: '#059669' },
  'Yoga': { icon: '🧘', tag: 'Mind-Body Stretch', color: '#0d9488' },
  'Exercise General': { icon: '🏃', tag: 'Gross Motor Play', color: '#15803d' },

  // Food & Dietary Categories
  'High-Protein/High-Fat': { icon: '🥑', tag: 'Steady Energy', color: '#ea580c' },
  'High-Sugar': { icon: '🧁', tag: 'Sweet Energy Spike', color: '#f43f5e' },
  'Salty/Crunchy': { icon: '🥨', tag: 'Sensory Crunch', color: '#d97706' },
  'General Meal': { icon: '🍽️', tag: 'Balanced Meal', color: '#ca8a04' }
};

// Fallback glyphs for newly added custom items in Admin
const CATEGORY_FALLBACK_GLYPHS = {
  medication: { icon: '💊', tag: 'Prescription' },
  behavior: { icon: '⚡', tag: 'Sensory Signal' },
  intervention: { icon: '🛡️', tag: 'Calming Support' },
  activity: { icon: '🎨', tag: 'Creative Session' },
  exercise: { icon: '🏃', tag: 'Active Movement' },
  food: { icon: '🍎', tag: 'Dietary Item' },
  mood: { emoji: '✨', sub: 'Emotional State' }
};

export default function LogDashboard({
  log,
  masterLists,
  role,
  settings,
  onUpdateField,
  onToggleArrayItem,
  onSave,
  saving,
  lastSavedAt
}) {
  const isParent = role === 'parent';
  const childName = settings?.z_name?.trim() || 'The student';

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

  const getGlyphInfo = (itemName, category) => {
    return ITEM_GLYPHS[itemName] || CATEGORY_FALLBACK_GLYPHS[category] || { icon: '✨', tag: '' };
  };

  return (
    <div className="dashboard-content" id="log-dashboard" style={{ paddingBottom: '30px' }}>

      {/* Teacher View-Only Notice */}
      {!isParent && (
        <div style={{
          margin: '12px 16px 0',
          padding: '12px 16px',
          background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
          border: '1.5px solid #c4b5fd',
          borderRadius: 'var(--radius-md)',
          color: '#5b21b6',
          fontSize: '0.86rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: '700',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <Lock size={18} />
          Teacher Mode: Viewing logged routine and medication summary (Read-Only).
        </div>
      )}

      {/* 1. Celestial Sleep Duration Card */}
      <section className="card-section card-sleep" id="section-sleep">
        <div className="section-header">
          <div className="section-title-wrap">
            <div className="section-icon-badge" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', color: '#ffffff' }}>
              <Moon size={20} />
            </div>
            <div>
              <h2 className="section-title">Sleep Duration</h2>
              <p className="section-subtitle">Last night's total rest & recovery</p>
            </div>
          </div>
          <span style={{
            fontSize: '0.84rem',
            fontWeight: '800',
            color: '#4338ca',
            background: '#e0e7ff',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid #c7d2fe'
          }}>
            {log.sleep_hours ? `${log.sleep_hours} hrs` : 'Not recorded'}
          </span>
        </div>

        <div className="sleep-celestial-box">
          <div className="sleep-display-row">
            {isParent && (
              <button
                type="button"
                className="stepper-btn-celestial"
                onClick={() => handleSleepStep(-0.5)}
                disabled={!isParent || Number(log.sleep_hours) <= 0}
                id="sleep-minus-btn"
                title="Decrease 0.5 hours"
              >
                -
              </button>
            )}

            <div className="sleep-number-celestial">
              {Number(log.sleep_hours).toFixed(1)}
              <span>hrs</span>
            </div>

            {isParent && (
              <button
                type="button"
                className="stepper-btn-celestial"
                onClick={() => handleSleepStep(0.5)}
                disabled={!isParent || Number(log.sleep_hours) >= 24}
                id="sleep-plus-btn"
                title="Increase 0.5 hours"
              >
                +
              </button>
            )}
          </div>

          {/* Quick presets (Parents only) */}
          {isParent && (
            <div className="sleep-presets-row">
              {sleepPresets.map((val) => (
                <button
                  key={val}
                  type="button"
                  className={`preset-chip-celestial ${Number(log.sleep_hours) === val ? 'active' : ''}`}
                  onClick={() => onUpdateField('sleep_hours', val)}
                >
                  {val}h
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 2. Dynamic Medication Administered Card */}
      <section className="card-section card-meds" id="section-medications">
        <div className="section-header">
          <div className="section-title-wrap">
            <div className="section-icon-badge" style={{ background: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)', color: '#ffffff' }}>
              <Pill size={20} />
            </div>
            <div>
              <h2 className="section-title">Medication Administered</h2>
              <p className="section-subtitle">Dynamic prescription & supplement checklist</p>
            </div>
          </div>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: '800',
            color: '#047857',
            background: '#d1fae5',
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid #a7f3d0'
          }}>
            {log.medications?.length || 0} Administered
          </span>
        </div>

        {medications.length === 0 ? (
          <p style={{ fontSize: '0.86rem', color: '#64748b' }}>
            No medications configured. Add them in Admin Settings.
          </p>
        ) : (
          <div className="gliffy-grid">
            {medications.map((item) => {
              const isChecked = log.medications?.includes(item.item_name);
              const glyph = getGlyphInfo(item.item_name, 'medication');
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`gliffy-pill-btn category-medication ${isChecked ? 'is-selected' : ''}`}
                  onClick={() => isParent && onToggleArrayItem('medications', item.item_name)}
                  disabled={!isParent}
                  style={{ cursor: isParent ? 'pointer' : 'default', opacity: !isParent && !isChecked ? 0.45 : 1 }}
                  id={`med-toggle-${item.id}`}
                >
                  <span className="glyph-bubble">{glyph.icon}</span>
                  <span className="glyph-text-wrap">
                    <span className="glyph-title">{item.item_name}</span>
                    <span className="glyph-subtitle">{glyph.tag || 'Prescription'}</span>
                  </span>
                  <span className="glyph-status-badge">
                    {isChecked ? <CheckCircle2 className="glyph-check-icon" size={18} /> : <span className="glyph-unselected-ring" />}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Primary Mood & Energy (Vibrant Emoticon Grid) */}
      <section className="card-section card-mood" id="section-mood">
        <div className="section-header">
          <div className="section-title-wrap">
            <div className="section-icon-badge" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#ffffff' }}>
              <Smile size={20} />
            </div>
            <div>
              <h2 className="section-title">Primary Mood & Energy</h2>
              <p className="section-subtitle">Overall emotional & regulation disposition</p>
            </div>
          </div>
          {log.overall_mood && (
            <span style={{
              fontSize: '0.8rem',
              fontWeight: '800',
              color: '#b45309',
              background: '#fef3c7',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid #fde68a'
            }}>
              {log.overall_mood}
            </span>
          )}
        </div>

        <div className="mood-grid-rich">
          {moods.map((item) => {
            const isSelected = log.overall_mood === item.item_name;
            const moodInfo = ITEM_GLYPHS[item.item_name] || { emoji: '✨', sub: 'Emotional State' };
            return (
              <button
                key={item.id}
                type="button"
                className={`mood-card-rich ${isSelected ? 'is-selected' : ''}`}
                onClick={() => isParent && onUpdateField('overall_mood', item.item_name)}
                disabled={!isParent}
                style={{ cursor: isParent ? 'pointer' : 'default', opacity: !isParent && !isSelected ? 0.45 : 1 }}
                id={`mood-btn-${item.id}`}
              >
                <span className="mood-emoji-wrap">{moodInfo.emoji}</span>
                <span className="mood-title">{item.item_name}</span>
                <span className="mood-descriptor">{moodInfo.sub}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Cycle & Menstruation Tracking Card */}
      <section className="card-section card-cycle" id="section-cycle">
        <div className="section-header">
          <div className="section-title-wrap">
            <div className="section-icon-badge" style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)', color: '#ffffff' }}>
              <Droplets size={20} />
            </div>
            <div>
              <h2 className="section-title">Cycle & Menstruation</h2>
              <p className="section-subtitle">Daily cycle monitoring & symptom awareness</p>
            </div>
          </div>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: '800',
            color: log.is_menstruating ? '#9f1239' : '#475569',
            background: log.is_menstruating ? '#ffe4e6' : '#f1f5f9',
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            border: log.is_menstruating ? '1px solid #fecdd3' : '1px solid #e2e8f0'
          }}>
            {log.is_menstruating ? `🩸 Active (${log.flow_intensity || 'Medium'})` : 'Not Active'}
          </span>
        </div>

        <div className="cycle-container">
          {/* Toggle Row */}
          <div className="cycle-toggle-row">
            <div className="cycle-toggle-info">
              <span className="cycle-toggle-title">Menstruating Today?</span>
              <span className="cycle-toggle-sub">Track active period for comfort and accommodations</span>
            </div>

            <div className="cycle-pill-toggle" role="group" aria-label="Menstruating Today">
              <button
                type="button"
                className={`cycle-toggle-btn ${!log.is_menstruating ? 'is-selected-no' : ''}`}
                onClick={() => isParent && onUpdateField('is_menstruating', false)}
                disabled={!isParent}
                id="menstruation-toggle-no"
              >
                No
              </button>
              <button
                type="button"
                className={`cycle-toggle-btn ${log.is_menstruating ? 'is-selected-yes' : ''}`}
                onClick={() => {
                  if (isParent) {
                    onUpdateField('is_menstruating', true);
                    if (!log.flow_intensity) {
                      onUpdateField('flow_intensity', 'Medium');
                    }
                  }
                }}
                disabled={!isParent}
                id="menstruation-toggle-yes"
              >
                🩸 Yes
              </button>
            </div>
          </div>

          {/* Flow Intensity Dropdown & Preset Chips (When Menstruating is Yes) */}
          {log.is_menstruating && (
            <div className="cycle-flow-panel">
              <div className="flow-control-group">
                <label htmlFor="flow-intensity-select" className="flow-control-label">
                  Flow Intensity:
                </label>
                <select
                  id="flow-intensity-select"
                  className="flow-dropdown-styled"
                  value={log.flow_intensity || 'Medium'}
                  onChange={(e) => isParent && onUpdateField('flow_intensity', e.target.value)}
                  disabled={!isParent}
                >
                  <option value="Light">💧 Light Flow</option>
                  <option value="Medium">🩸 Medium Flow (Default)</option>
                  <option value="Heavy">🌊 Heavy Flow</option>
                </select>
              </div>

              {/* Quick Tactile Preset Pills */}
              <div className="flow-pills-row">
                {[
                  { value: 'Light', icon: '💧', label: 'Light' },
                  { value: 'Medium', icon: '🩸', label: 'Medium' },
                  { value: 'Heavy', icon: '🌊', label: 'Heavy' }
                ].map((item) => {
                  const isSelected = (log.flow_intensity || 'Medium') === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      className={`flow-pill-chip ${isSelected ? 'is-active' : ''}`}
                      onClick={() => isParent && onUpdateField('flow_intensity', item.value)}
                      disabled={!isParent}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Teacher Awareness Notice */}
          {!isParent && log.is_menstruating && (
            <div className="teacher-cycle-notice">
              <span className="notice-icon">🩸</span>
              <p>
                <strong>School Care Note:</strong> {childName} is menstruating today ({log.flow_intensity || 'Medium'} flow). Please facilitate frequent bathroom breaks, heating pad access if requested, and sensory grace for cramp sensitivity.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 4. Sensory Behaviors Observed Card */}
      <section className="card-section card-behaviors" id="section-behaviors">
        <div className="section-header">
          <div className="section-title-wrap">
            <div className="section-icon-badge" style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', color: '#ffffff' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="section-title">Sensory Behaviors Observed</h2>
              <p className="section-subtitle">Stimming, sensitivity triggers, or sensory seeking</p>
            </div>
          </div>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: '800',
            color: '#be123c',
            background: '#ffe4e6',
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid #fecdd3'
          }}>
            {log.sensory_behaviors?.length || 0} Observed
          </span>
        </div>

        <div className="gliffy-grid">
          {behaviors.map((item) => {
            const isChecked = log.sensory_behaviors?.includes(item.item_name);
            const glyph = getGlyphInfo(item.item_name, 'behavior');
            return (
              <button
                key={item.id}
                type="button"
                className={`gliffy-pill-btn category-behavior ${isChecked ? 'is-selected' : ''}`}
                onClick={() => isParent && onToggleArrayItem('sensory_behaviors', item.item_name)}
                disabled={!isParent}
                style={{ cursor: isParent ? 'pointer' : 'default', opacity: !isParent && !isChecked ? 0.45 : 1 }}
                id={`behavior-toggle-${item.id}`}
              >
                <span className="glyph-bubble">{glyph.icon}</span>
                <span className="glyph-text-wrap">
                  <span className="glyph-title">{item.item_name}</span>
                  <span className="glyph-subtitle">{glyph.tag || 'Sensory Cue'}</span>
                </span>
                <span className="glyph-status-badge">
                  {isChecked ? <CheckCircle2 className="glyph-check-icon" size={18} /> : <span className="glyph-unselected-ring" />}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. Calming Interventions Applied Card */}
      <section className="card-section card-interventions" id="section-interventions">
        <div className="section-header">
          <div className="section-title-wrap">
            <div className="section-icon-badge" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#ffffff' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="section-title">Calming Interventions Applied</h2>
              <p className="section-subtitle">Deep pressure, warmth, earmuffs, sensory breaks</p>
            </div>
          </div>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: '800',
            color: '#0369a1',
            background: '#e0f2fe',
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid #bae6fd'
          }}>
            {log.interventions?.length || 0} Applied
          </span>
        </div>

        <div className="gliffy-grid">
          {interventions.map((item) => {
            const isChecked = log.interventions?.includes(item.item_name);
            const glyph = getGlyphInfo(item.item_name, 'intervention');
            return (
              <button
                key={item.id}
                type="button"
                className={`gliffy-pill-btn category-intervention ${isChecked ? 'is-selected' : ''}`}
                onClick={() => isParent && onToggleArrayItem('interventions', item.item_name)}
                disabled={!isParent}
                style={{ cursor: isParent ? 'pointer' : 'default', opacity: !isParent && !isChecked ? 0.45 : 1 }}
                id={`intervention-toggle-${item.id}`}
              >
                <span className="glyph-bubble">{glyph.icon}</span>
                <span className="glyph-text-wrap">
                  <span className="glyph-title">{item.item_name}</span>
                  <span className="glyph-subtitle">{glyph.tag || 'Support'}</span>
                </span>
                <span className="glyph-status-badge">
                  {isChecked ? <CheckCircle2 className="glyph-check-icon" size={18} /> : <span className="glyph-unselected-ring" />}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 6. Creative & Skill Activities Card */}
      <section className="card-section card-activities" id="section-activities">
        <div className="section-header">
          <div className="section-title-wrap">
            <div className="section-icon-badge" style={{ background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)', color: '#ffffff' }}>
              <Music size={20} />
            </div>
            <div>
              <h2 className="section-title">Creative & Skill Activities</h2>
              <p className="section-subtitle">Music, keyboard, speech therapy practice</p>
            </div>
          </div>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: '800',
            color: '#7c3aed',
            background: '#f3e8ff',
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid #e9d5ff'
          }}>
            {log.activities?.filter((a) => activities.some((ac) => ac.item_name === a)).length || 0} Active
          </span>
        </div>

        <div className="gliffy-grid">
          {activities.map((item) => {
            const isChecked = log.activities?.includes(item.item_name);
            const glyph = getGlyphInfo(item.item_name, 'activity');
            return (
              <button
                key={item.id}
                type="button"
                className={`gliffy-pill-btn category-activity ${isChecked ? 'is-selected' : ''}`}
                onClick={() => isParent && onToggleArrayItem('activities', item.item_name)}
                disabled={!isParent}
                style={{ cursor: isParent ? 'pointer' : 'default', opacity: !isParent && !isChecked ? 0.45 : 1 }}
                id={`activity-toggle-${item.id}`}
              >
                <span className="glyph-bubble">{glyph.icon}</span>
                <span className="glyph-text-wrap">
                  <span className="glyph-title">{item.item_name}</span>
                  <span className="glyph-subtitle">{glyph.tag || 'Activity'}</span>
                </span>
                <span className="glyph-status-badge">
                  {isChecked ? <CheckCircle2 className="glyph-check-icon" size={18} /> : <span className="glyph-unselected-ring" />}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 7. Exercise & Physical Play Card */}
      <section className="card-section card-exercise" id="section-exercise">
        <div className="section-header">
          <div className="section-title-wrap">
            <div className="section-icon-badge" style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: '#ffffff' }}>
              <Activity size={20} />
            </div>
            <div>
              <h2 className="section-title">Exercise & Physical Play</h2>
              <p className="section-subtitle">Pickleball, badminton, sensory walks, yoga</p>
            </div>
          </div>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: '800',
            color: '#15803d',
            background: '#dcfce7',
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid #bbf7d0'
          }}>
            {log.activities?.filter((a) => exercises.some((ex) => ex.item_name === a)).length || 0} Active
          </span>
        </div>

        <div className="gliffy-grid">
          {exercises.map((item) => {
            const isChecked = log.activities?.includes(item.item_name);
            const glyph = getGlyphInfo(item.item_name, 'exercise');
            return (
              <button
                key={item.id}
                type="button"
                className={`gliffy-pill-btn category-exercise ${isChecked ? 'is-selected' : ''}`}
                onClick={() => isParent && onToggleArrayItem('activities', item.item_name)}
                disabled={!isParent}
                style={{ cursor: isParent ? 'pointer' : 'default', opacity: !isParent && !isChecked ? 0.45 : 1 }}
                id={`exercise-toggle-${item.id}`}
              >
                <span className="glyph-bubble">{glyph.icon}</span>
                <span className="glyph-text-wrap">
                  <span className="glyph-title">{item.item_name}</span>
                  <span className="glyph-subtitle">{glyph.tag || 'Movement'}</span>
                </span>
                <span className="glyph-status-badge">
                  {isChecked ? <CheckCircle2 className="glyph-check-icon" size={18} /> : <span className="glyph-unselected-ring" />}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 8. Food & Nutrition Card */}
      <section className="card-section card-food" id="section-food">
        <div className="section-header">
          <div className="section-title-wrap">
            <div className="section-icon-badge" style={{ background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', color: '#ffffff' }}>
              <Utensils size={20} />
            </div>
            <div>
              <h2 className="section-title">Food & Dietary Categories</h2>
              <p className="section-subtitle">Protein, salty/crunchy, high-sugar, general meal</p>
            </div>
          </div>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: '800',
            color: '#c2410c',
            background: '#ffedd5',
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid #fed7aa'
          }}>
            {log.food?.length || 0} Selected
          </span>
        </div>

        <div className="gliffy-grid">
          {foods.map((item) => {
            const isChecked = log.food?.includes(item.item_name);
            const glyph = getGlyphInfo(item.item_name, 'food');
            return (
              <button
                key={item.id}
                type="button"
                className={`gliffy-pill-btn category-food ${isChecked ? 'is-selected' : ''}`}
                onClick={() => isParent && onToggleArrayItem('food', item.item_name)}
                disabled={!isParent}
                style={{ cursor: isParent ? 'pointer' : 'default', opacity: !isParent && !isChecked ? 0.45 : 1 }}
                id={`food-toggle-${item.id}`}
              >
                <span className="glyph-bubble">{glyph.icon}</span>
                <span className="glyph-text-wrap">
                  <span className="glyph-title">{item.item_name}</span>
                  <span className="glyph-subtitle">{glyph.tag || 'Diet'}</span>
                </span>
                <span className="glyph-status-badge">
                  {isChecked ? <CheckCircle2 className="glyph-check-icon" size={18} /> : <span className="glyph-unselected-ring" />}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 9. Observations & Notes Card */}
      <section className="card-section card-notes" id="section-notes">
        <div className="section-header">
          <div className="section-title-wrap">
            <div className="section-icon-badge" style={{ background: 'linear-gradient(135deg, #475569 0%, #334155 100%)', color: '#ffffff' }}>
              <FileText size={20} />
            </div>
            <div>
              <h2 className="section-title">Observations & Daily Notes</h2>
              <p className="section-subtitle">Teacher feedback, triggers, what went well</p>
            </div>
          </div>
        </div>

        <div className="notes-container-rich">
          <textarea
            className="notes-textarea-rich"
            value={log.notes || ''}
            onChange={(e) => isParent && onUpdateField('notes', e.target.value)}
            disabled={!isParent}
            placeholder={isParent ? "Type daily observations... E.g., 'Calm morning, enjoyed music class. Needed noise earmuffs during cafeteria transition.'" : "No notes recorded for this date."}
            id="notes-input"
          />
          {isParent && (
            <div className="notes-hints-bar">
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Mic size={13} color="#0f766e" /> Voice dictation supported via mobile keyboard
              </span>
              <span>{(log.notes || '').length} characters</span>
            </div>
          )}
        </div>
      </section>

      {/* 10. Sticky Save Island (Parent Only) */}
      {isParent && (
        <div className="save-footer-island" id="save-footer">
          <div className="save-status-badge-island">
            {lastSavedAt ? (
              <>
                <Clock size={14} color="#10b981" />
                <span>Saved at {lastSavedAt}</span>
              </>
            ) : log.exists ? (
              <span>✓ Saved for this date</span>
            ) : (
              <span>● Unsaved changes</span>
            )}
          </div>

          <button
            type="button"
            className="btn save-btn-large-island"
            onClick={onSave}
            disabled={saving}
            id="save-log-btn"
          >
            {saving ? 'Saving...' : '💾 Save Daily Log'}
          </button>
        </div>
      )}
    </div>
  );
}
