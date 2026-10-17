import React, { useState, useEffect } from 'react';
import { X, User, Key, ListFilter, Plus, Eye, EyeOff, Save, Check } from 'lucide-react';
import { api } from '../api';

const CATEGORIES = [
  { id: 'medication', label: 'Medications' },
  { id: 'mood', label: 'Moods' },
  { id: 'behavior', label: 'Sensory Behaviors' },
  { id: 'intervention', label: 'Calming Interventions' },
  { id: 'activity', label: 'Creative & Skills' },
  { id: 'exercise', label: 'Exercise & Sports' },
  { id: 'food', label: 'Food Categories' }
];

export default function AdminModal({ isOpen, onClose, currentSettings, onSettingsUpdated, onListsUpdated }) {
  const [activeTab, setActiveTab] = useState('lists');
  
  // Profile State
  const [profile, setProfile] = useState({
    z_name: currentSettings?.z_name || 'Zeba',
    z_age: currentSettings?.z_age || 15,
    z_class: currentSettings?.z_class || 'Grade 9',
    z_school: currentSettings?.z_school || 'Greenwood High'
  });
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
      loadAllLists();
      if (currentSettings) {
        setProfile({
          z_name: currentSettings.z_name || 'Zeba',
          z_age: currentSettings.z_age || 15,
          z_class: currentSettings.z_class || 'Grade 9',
          z_school: currentSettings.z_school || 'Greenwood High'
        });
      }
    }
  }, [isOpen, currentSettings]);

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
    <div className="modal-overlay" id="admin-modal-overlay">
      <div className="modal-sheet">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="section-icon-badge" style={{ background: 'var(--navy-light)', color: 'var(--navy-slate)' }}>
              <ListFilter size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', color: 'var(--navy-slate)' }}>Admin Configuration</h2>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Parent Management Portal</p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose} id="close-admin-btn">
            <X size={20} />
          </button>
        </div>

        {/* Tab navigation */}
        <div style={{ padding: '12px 20px 0' }}>
          <div className="tab-list">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'lists' ? 'active' : ''}`}
              onClick={() => setActiveTab('lists')}
            >
              Lists & Meds
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile & Bio
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'passcodes' ? 'active' : ''}`}
              onClick={() => setActiveTab('passcodes')}
            >
              Passcodes
            </button>
          </div>
        </div>

        <div className="modal-body">

          {/* TAB 1: DYNAMIC MASTER LISTS & MEDS */}
          {activeTab === 'lists' && (
            <div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Manage checklist options. Toggle items inactive to hide them without losing past logs.
              </p>

              {/* Category selector pills */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`preset-chip ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Add new item form */}
              <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '8px', margin: '12px 0' }}>
                <input
                  type="text"
                  placeholder={`Add new ${selectedCategory} item...`}
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  style={{
                    flex: 1,
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.86rem'
                  }}
                  id="new-item-input"
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0 16px' }} id="add-item-btn">
                  <Plus size={16} /> Add
                </button>
              </form>

              {listMessage && (
                <div style={{ color: 'var(--teal-primary)', fontSize: '0.8rem', fontWeight: '600', marginBottom: '8px' }}>
                  ✓ {listMessage}
                </div>
              )}

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto' }}>
                {currentCategoryItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: item.is_active ? 'var(--bg-page)' : '#f8fafc',
                      border: '1px solid var(--border-subtle)',
                      opacity: item.is_active ? 1 : 0.55
                    }}
                  >
                    <span style={{
                      fontSize: '0.86rem',
                      fontWeight: '600',
                      textDecoration: item.is_active ? 'none' : 'line-through'
                    }}>
                      {item.item_name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleItem(item)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: item.is_active ? 'var(--teal-primary)' : 'var(--text-light)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.78rem',
                        fontWeight: '600'
                      }}
                      title={item.is_active ? 'Hide from daily tracker' : 'Show on daily tracker'}
                    >
                      {item.is_active ? (
                        <>
                          <Eye size={16} /> Active
                        </>
                      ) : (
                        <>
                          <EyeOff size={16} /> Inactive
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: PROFILE & BIO */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  TEENAGER NAME
                </label>
                <input
                  type="text"
                  value={profile.z_name}
                  onChange={(e) => setProfile({ ...profile, z_name: e.target.value })}
                  required
                  style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}
                  id="profile-name-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    AGE
                  </label>
                  <input
                    type="number"
                    value={profile.z_age}
                    onChange={(e) => setProfile({ ...profile, z_age: parseInt(e.target.value) || 0 })}
                    required
                    style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}
                    id="profile-age-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    CLASS / GRADE
                  </label>
                  <input
                    type="text"
                    value={profile.z_class}
                    onChange={(e) => setProfile({ ...profile, z_class: e.target.value })}
                    required
                    style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}
                    id="profile-class-input"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  SCHOOL NAME
                </label>
                <input
                  type="text"
                  value={profile.z_school}
                  onChange={(e) => setProfile({ ...profile, z_school: e.target.value })}
                  required
                  style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}
                  id="profile-school-input"
                />
              </div>

              {profileSuccess && (
                <div style={{ color: 'var(--teal-primary)', fontSize: '0.84rem', fontWeight: '600' }}>
                  ✓ {profileSuccess}
                </div>
              )}

              <button type="submit" className="btn btn-primary" disabled={profileSaving} style={{ marginTop: '8px' }}>
                <Save size={16} /> {profileSaving ? 'Saving...' : 'Update Profile'}
              </button>
            </form>
          )}

          {/* TAB 3: PASSCODE MANAGEMENT */}
          {activeTab === 'passcodes' && (
            <form onSubmit={handleSavePasscodes} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Update numeric passcodes. Must be at least 4 numeric digits.
              </p>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  NEW PARENT PASSCODE (Leave blank to keep unchanged)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  placeholder="e.g. 0023"
                  value={parentPasscode}
                  onChange={(e) => setParentPasscode(e.target.value)}
                  style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}
                  id="new-parent-passcode-input"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  NEW TEACHER PASSCODE (Leave blank to keep unchanged)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  placeholder="e.g. 5678"
                  value={teacherPasscode}
                  onChange={(e) => setTeacherPasscode(e.target.value)}
                  style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}
                  id="new-teacher-passcode-input"
                />
              </div>

              {passError && (
                <div style={{ color: 'var(--danger-rose)', fontSize: '0.82rem', fontWeight: '600' }}>
                  {passError}
                </div>
              )}

              {passSuccess && (
                <div style={{ color: 'var(--teal-primary)', fontSize: '0.84rem', fontWeight: '600' }}>
                  ✓ {passSuccess}
                </div>
              )}

              <button type="submit" className="btn btn-primary" disabled={passSaving} style={{ marginTop: '8px' }}>
                <Key size={16} /> {passSaving ? 'Updating...' : 'Update Passcodes'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
