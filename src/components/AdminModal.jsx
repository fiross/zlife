import React, { useState, useEffect } from 'react';
import { X, User, Key, ListFilter, Plus, Eye, EyeOff, Save, Check, ShieldCheck, Sparkles, School, FileSpreadsheet, Mail, Zap, FileText } from 'lucide-react';
import { api } from '../api';
import LogHistoryTab from './LogHistoryTab';

const SUGGESTED_CHALLENGES = [
  'Auditory Sensitivity',
  'Sensory Overload',
  'Transitions & Changes',
  'Executive Functioning',
  'Impulsive Pacing',
  'Emotional Dysregulation',
  'Oral Sensory Seeking',
  'Fine Motor Fatigue'
];

const CATEGORIES = [
  { id: 'medication', label: 'Medications', icon: '💊' },
  { id: 'mood', label: 'Moods', icon: '😊' },
  { id: 'behavior', label: 'Sensory Behaviors', icon: '🎧' },
  { id: 'intervention', label: 'Interventions', icon: '🤲' },
  { id: 'activity', label: 'Creative & Skills', icon: '🎵' },
  { id: 'exercise', label: 'Exercise & Sports', icon: '🏓' },
  { id: 'food', label: 'Food & Nutrition', icon: '🥑' }
];

const ITEM_ICONS = {
  'Focalin (Morning)': '☀️',
  'Melatonin (Night)': '🌙',
  'Guanfacine (Evening)': '🌅',
  'Calm': '😌',
  'Happy': '😊',
  'Aggressive': '😡',
  'Anxiety': '😰',
  'Hyperactive': '⚡',
  'Sensory Overload': '💥',
  'Withdrawn': '😶',
  'Sensory Seeking': '✨',
  'Ear Covering': '🎧',
  'Food Grabbing': '🥪',
  'Cover with Blanket (Cocooning)': '🛋️',
  'Impulsive Pacing': '👣',
  'Sound Sensitivity': '🔊',
  'Self-Regulation (Stimming)': '🌀',
  'Joint Compression': '🤲',
  'Neutral Warmth': '🧣',
  'Walk': '🚶',
  'Earmuffs (Walker\'s Electronics)': '🎧',
  'Visual Timer': '⏳',
  'Oral Sensory (Gum/Crunch)': '🍬',
  'Visual Board Prompt': '📋',
  'Music Class': '🎵',
  'Keyboard': '🎹',
  'Speech': '💬',
  'Pickleball': '🏓',
  'Badminton': '🏸',
  'Yoga': '🧘',
  'Exercise General': '🏃',
  'High-Protein/High-Fat': '🥑',
  'High-Sugar': '🧁',
  'Salty/Crunchy': '🥨',
  'General Meal': '🍽️'
};

export default function AdminModal({
  isOpen,
  onClose,
  currentSettings,
  onSettingsUpdated,
  onListsUpdated,
  onSelectDate,
  initialTab = 'history'
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'history');
  
  // Profile State
  const [profile, setProfile] = useState({
    z_name: currentSettings?.z_name || '',
    z_age: currentSettings?.z_age ?? '',
    z_class: currentSettings?.z_class || '',
    z_school: currentSettings?.z_school || '',
    parent_email_1: currentSettings?.parent_email_1 || '',
    parent_email_2: currentSettings?.parent_email_2 || '',
    active_challenges: Array.isArray(currentSettings?.active_challenges) ? currentSettings.active_challenges : [],
    diagnostic_summary: currentSettings?.diagnostic_summary || ''
  });
  const [newChallengeInput, setNewChallengeInput] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');

  // Passcodes State
  const [parentPasscode, setParentPasscode] = useState('');
  const [teacherPasscode, setTeacherPasscode] = useState('');
  const [passSaving, setPassSaving] = useState(false);
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  // Lists Management State
  const [selectedCategory, setSelectedCategory] = useState('medication');
  const [allLists, setAllLists] = useState({});
  const [newItemName, setNewItemName] = useState('');
  const [listLoading, setListLoading] = useState(false);
  const [listMessage, setListMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      loadAllLists();
      if (currentSettings) {
        setProfile({
          z_name: currentSettings.z_name || '',
          z_age: currentSettings.z_age ?? '',
          z_class: currentSettings.z_class || '',
          z_school: currentSettings.z_school || '',
          parent_email_1: currentSettings.parent_email_1 || '',
          parent_email_2: currentSettings.parent_email_2 || '',
          active_challenges: Array.isArray(currentSettings.active_challenges) ? currentSettings.active_challenges : [],
          diagnostic_summary: currentSettings.diagnostic_summary || ''
        });
      }
    }
  }, [isOpen, initialTab, currentSettings]);

  const handleAddChallenge = (challengeText) => {
    const textToAdd = (challengeText || newChallengeInput).trim();
    if (!textToAdd) return;
    if (!profile.active_challenges.includes(textToAdd)) {
      setProfile(prev => ({
        ...prev,
        active_challenges: [...prev.active_challenges, textToAdd]
      }));
    }
    setNewChallengeInput('');
  };

  const handleRemoveChallenge = (indexToRemove) => {
    setProfile(prev => ({
      ...prev,
      active_challenges: prev.active_challenges.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const loadAllLists = async () => {
    try {
      setListLoading(true);
      const res = await api.lists.get(true); // get all including inactive
      if (res.success) {
        setAllLists(res.data);
      }
    } catch (err) {
      console.error('Failed to load all lists', err);
    } finally {
      setListLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess('');
    try {
      const res = await api.settings.update(profile);
      if (res.success) {
        setProfileSuccess('Profile updated successfully!');
        onSettingsUpdated(res.data);
        setTimeout(() => setProfileSuccess(''), 3000);
      }
    } catch (err) {
      alert(err.message || 'Error updating profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSavePasscodes = async (e) => {
    e.preventDefault();
    setPassSaving(true);
    setPassSuccess('');
    setPassError('');
    try {
      const res = await api.passcodes.update({
        parent_passcode: parentPasscode,
        teacher_passcode: teacherPasscode
      });
      if (res.success) {
        setPassSuccess(res.message);
        setParentPasscode('');
        setTeacherPasscode('');
        setTimeout(() => setPassSuccess(''), 4000);
      }
    } catch (err) {
      setPassError(err.message || 'Error updating passcodes');
    } finally {
      setPassSaving(false);
    }
  };

  const handleToggleItem = async (item) => {
    try {
      const nextActive = item.is_active ? 0 : 1;
      await api.lists.toggle(item.id, nextActive);
      await loadAllLists();
      onListsUpdated();
    } catch (err) {
      alert(err.message || 'Failed to toggle item');
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    try {
      await api.lists.add(selectedCategory, newItemName.trim());
      setNewItemName('');
      setListMessage('Item added successfully!');
      setTimeout(() => setListMessage(''), 3000);
      await loadAllLists();
      onListsUpdated();
    } catch (err) {
      alert(err.message || 'Failed to add item');
    }
  };

  if (!isOpen) return null;

  const currentCategoryItems = allLists[selectedCategory] || [];

  return (
    <div className="modal-overlay" id="admin-modal-overlay" onClick={(e) => {
      if (e.target.id === 'admin-modal-overlay') onClose();
    }}>
      <div className="modal-sheet admin-modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header admin-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="section-icon-badge" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', color: '#ffffff' }}>
              <ListFilter size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--slate-navy)' }}>Admin Configuration</h2>
              <p style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: '600' }}>Manage profile, passcodes & dynamic checklist options</p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose} id="close-admin-btn" title="Close">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ padding: '14px 20px 0' }}>
          <div className="admin-tabs-bar">
            <button
              type="button"
              className={`admin-tab-btn ${activeTab === 'history' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('history')}
              id="tab-history-btn"
            >
              <span>📊</span> All Logs & Export
            </button>
            <button
              type="button"
              className={`admin-tab-btn ${activeTab === 'lists' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('lists')}
              id="tab-lists-btn"
            >
              <span>📋</span> Lists & Meds
            </button>
            <button
              type="button"
              className={`admin-tab-btn ${activeTab === 'profile' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('profile')}
              id="tab-profile-btn"
            >
              <span>👤</span> Student Profile
            </button>
            <button
              type="button"
              className={`admin-tab-btn ${activeTab === 'passcodes' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('passcodes')}
              id="tab-passcodes-btn"
            >
              <span>🔑</span> Passcodes
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ padding: activeTab === 'history' ? '14px 18px 24px' : '16px 20px 24px' }}>

          {/* TAB 0: ALL LOGS HISTORY & CSV EXPORT */}
          {activeTab === 'history' && (
            <LogHistoryTab onSelectDate={onSelectDate} />
          )}

          {/* TAB 1: DYNAMIC MASTER LISTS & MEDS */}
          {activeTab === 'lists' && (
            <div>
              <p style={{ fontSize: '0.84rem', color: '#64748b', fontWeight: '600', marginBottom: '10px' }}>
                Manage daily options. Inactive items are hidden from daily logging without affecting historical data.
              </p>

              {/* Category Pills Selector */}
              <div className="admin-category-pills">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`admin-cat-pill ${selectedCategory === cat.id ? 'is-active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Add New Item Form */}
              <form onSubmit={handleAddItem} className="admin-add-form">
                <input
                  type="text"
                  placeholder={`Add custom item to ${selectedCategory}...`}
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="admin-input-styled"
                  id="new-item-input"
                />
                <button type="submit" className="btn btn-primary" style={{ height: '46px', padding: '0 20px', whiteSpace: 'nowrap' }} id="add-item-btn">
                  <Plus size={18} /> Add
                </button>
              </form>

              {listMessage && (
                <div style={{ color: '#059669', fontSize: '0.84rem', fontWeight: '700', marginBottom: '10px' }}>
                  ✓ {listMessage}
                </div>
              )}

              {/* Items List */}
              <div className="admin-items-list">
                {listLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Loading items...</div>
                ) : currentCategoryItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No items in this category yet.</div>
                ) : (
                  currentCategoryItems.map((item) => {
                    const icon = ITEM_ICONS[item.item_name] || '✨';
                    return (
                      <div
                        key={item.id}
                        className={`admin-item-row ${item.is_active ? '' : 'is-inactive'}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: item.is_active ? '#ecfdf5' : '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.1rem',
                            border: '1px solid #e2e8f0'
                          }}>
                            {icon}
                          </span>
                          <span style={{
                            fontSize: '0.9rem',
                            fontWeight: '700',
                            color: item.is_active ? '#1e293b' : '#94a3b8',
                            textDecoration: item.is_active ? 'none' : 'line-through'
                          }}>
                            {item.item_name}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleItem(item)}
                          className={`admin-toggle-badge ${item.is_active ? 'active-state' : 'inactive-state'}`}
                          title={item.is_active ? 'Click to hide from tracker' : 'Click to restore to tracker'}
                        >
                          {item.is_active ? (
                            <>
                              <Eye size={15} /> Active
                            </>
                          ) : (
                            <>
                              <EyeOff size={15} /> Hidden
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PROFILE & BIO */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="admin-form-card">
              <div className="admin-field-group">
                <label className="admin-field-label">
                  <User size={15} color="#0f766e" /> CHILD / STUDENT NAME
                </label>
                <input
                  type="text"
                  value={profile.z_name}
                  onChange={(e) => setProfile({ ...profile, z_name: e.target.value })}
                  placeholder="e.g. Child Name"
                  required
                  className="admin-input-styled"
                  id="profile-name-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="admin-field-group">
                  <label className="admin-field-label">
                    <span>🎂</span> AGE
                  </label>
                  <input
                    type="number"
                    value={profile.z_age}
                    onChange={(e) => setProfile({ ...profile, z_age: parseInt(e.target.value) || 0 })}
                    required
                    className="admin-input-styled"
                    id="profile-age-input"
                  />
                </div>
                <div className="admin-field-group">
                  <label className="admin-field-label">
                    <span>🎒</span> CLASS / GRADE
                  </label>
                  <input
                    type="text"
                    value={profile.z_class}
                    onChange={(e) => setProfile({ ...profile, z_class: e.target.value })}
                    required
                    className="admin-input-styled"
                    id="profile-class-input"
                  />
                </div>
              </div>

              <div className="admin-field-group">
                <label className="admin-field-label">
                  <School size={15} color="#0f766e" /> SCHOOL NAME
                </label>
                <input
                  type="text"
                  value={profile.z_school}
                  onChange={(e) => setProfile({ ...profile, z_school: e.target.value })}
                  required
                  className="admin-input-styled"
                  id="profile-school-input"
                />
              </div>

              <div className="admin-field-group">
                <label className="admin-field-label">
                  <Mail size={15} color="#0f766e" /> PARENT EMAIL 1 (Primary Notifications)
                </label>
                <input
                  type="email"
                  value={profile.parent_email_1}
                  onChange={(e) => setProfile({ ...profile, parent_email_1: e.target.value })}
                  placeholder="parent1@example.com"
                  className="admin-input-styled"
                  id="profile-email-1-input"
                />
                <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                  Primary email for future automated care alerts & summaries.
                </span>
              </div>

              <div className="admin-field-group">
                <label className="admin-field-label">
                  <Mail size={15} color="#0f766e" /> PARENT EMAIL 2 (Secondary / Alternate)
                </label>
                <input
                  type="email"
                  value={profile.parent_email_2}
                  onChange={(e) => setProfile({ ...profile, parent_email_2: e.target.value })}
                  placeholder="parent2@example.com"
                  className="admin-input-styled"
                  id="profile-email-2-input"
                />
                <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                  Secondary parent or emergency caregiver contact.
                </span>
              </div>

              {/* Dynamic Active Challenges List */}
              <div className="admin-field-group" style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label className="admin-field-label" style={{ margin: 0 }}>
                    <Zap size={15} color="#d97706" /> ACTIVE CHALLENGES (DYNAMIC LIST)
                  </label>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', background: '#e2e8f0', padding: '2px 8px', borderRadius: '10px' }}>
                    {profile.active_challenges.length} active
                  </span>
                </div>
                <span style={{ fontSize: '0.74rem', color: '#64748b', marginBottom: '10px', display: 'block' }}>
                  Primary sensory, behavioral, or transition focus areas to monitor during daily care.
                </span>

                {/* Challenges Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', minHeight: '32px' }}>
                  {profile.active_challenges.length === 0 ? (
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                      No active challenges added yet. Use the quick-add suggestions below or type a custom one.
                    </span>
                  ) : (
                    profile.active_challenges.map((challenge, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '20px',
                          padding: '4px 10px',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          color: '#1e293b',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                        }}
                      >
                        <span>⚡ {challenge}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveChallenge(idx)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '2px',
                            borderRadius: '50%'
                          }}
                          title="Remove challenge"
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Add Custom Challenge Form */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    value={newChallengeInput}
                    onChange={(e) => setNewChallengeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddChallenge();
                      }
                    }}
                    placeholder="Add custom challenge (e.g. Transitions, Auditory Fatigue)..."
                    className="admin-input-styled"
                    style={{ height: '40px', fontSize: '0.85rem' }}
                    id="new-challenge-tag-input"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddChallenge()}
                    className="btn btn-primary"
                    style={{ height: '40px', padding: '0 16px', fontSize: '0.84rem', whiteSpace: 'nowrap' }}
                    id="add-challenge-btn"
                  >
                    <Plus size={15} /> Add
                  </button>
                </div>

                {/* Quick Add Suggestions */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#64748b' }}>Quick Add:</span>
                  {SUGGESTED_CHALLENGES.map((sug) => {
                    const isAdded = profile.active_challenges.includes(sug);
                    return (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleAddChallenge(sug)}
                        disabled={isAdded}
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: '600',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          border: isAdded ? '1px solid #e2e8f0' : '1px solid #cbd5e1',
                          background: isAdded ? '#f1f5f9' : '#ffffff',
                          color: isAdded ? '#94a3b8' : '#334155',
                          cursor: isAdded ? 'default' : 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isAdded ? '✓ ' : '+ '}{sug}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Diagnostic Summary Textarea */}
              <div className="admin-field-group">
                <label className="admin-field-label">
                  <FileText size={15} color="#0f766e" /> DIAGNOSTIC SUMMARY & CLINICAL CONTEXT
                </label>
                <textarea
                  value={profile.diagnostic_summary}
                  onChange={(e) => setProfile({ ...profile, diagnostic_summary: e.target.value })}
                  placeholder="e.g., Level 2 Autism Spectrum Disorder (ASD) and ADHD Combined Type. Highly responsive to deep pressure compression, calm sensory pacing, noise-dampening earmuffs, and predictable visual task timers."
                  rows={4}
                  className="admin-input-styled"
                  style={{ minHeight: '90px', resize: 'vertical', lineHeight: '1.5', padding: '10px 12px' }}
                  id="profile-diagnostic-summary-input"
                />
                <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                  Clinical notes, IEP accommodations, and sensory profiles for care team alignment.
                </span>
              </div>

              {profileSuccess && (
                <div style={{ color: '#059669', fontSize: '0.86rem', fontWeight: '700' }}>
                  ✓ {profileSuccess}
                </div>
              )}

              <button type="submit" className="btn btn-primary" disabled={profileSaving} style={{ height: '48px', marginTop: '6px' }}>
                <Save size={18} /> {profileSaving ? 'Saving...' : 'Update Profile Details'}
              </button>
            </form>
          )}

          {/* TAB 3: PASSCODE MANAGEMENT */}
          {activeTab === 'passcodes' && (
            <form onSubmit={handleSavePasscodes} className="admin-form-card">
              <p style={{ fontSize: '0.84rem', color: '#64748b', fontWeight: '600' }}>
                Change numeric passcodes for login access. Passcodes must be at least 4 digits.
              </p>

              <div className="admin-field-group">
                <label className="admin-field-label">
                  <ShieldCheck size={16} color="#0f766e" /> NEW PARENT PASSCODE (Leave blank to keep unchanged)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  placeholder="e.g. 1234"
                  value={parentPasscode}
                  onChange={(e) => setParentPasscode(e.target.value)}
                  className="admin-input-styled"
                  id="new-parent-passcode-input"
                />
              </div>

              <div className="admin-field-group">
                <label className="admin-field-label">
                  <Key size={16} color="#7c3aed" /> NEW TEACHER PASSCODE (Leave blank to keep unchanged)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  placeholder="e.g. 5678"
                  value={teacherPasscode}
                  onChange={(e) => setTeacherPasscode(e.target.value)}
                  className="admin-input-styled"
                  id="new-teacher-passcode-input"
                />
              </div>

              {passError && (
                <div style={{ color: '#e11d48', fontSize: '0.84rem', fontWeight: '700' }}>
                  {passError}
                </div>
              )}

              {passSuccess && (
                <div style={{ color: '#059669', fontSize: '0.86rem', fontWeight: '700' }}>
                  ✓ {passSuccess}
                </div>
              )}

              <button type="submit" className="btn btn-primary" disabled={passSaving} style={{ height: '48px', marginTop: '6px' }}>
                <Key size={18} /> {passSaving ? 'Updating...' : 'Save New Passcodes'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
