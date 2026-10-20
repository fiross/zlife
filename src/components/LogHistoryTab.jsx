import React, { useState, useEffect, useMemo } from 'react';
import {
  Download,
  Search,
  Calendar,
  ExternalLink,
  MessageSquare,
  Clock,
  RefreshCw,
  FileSpreadsheet,
  Moon,
  Sparkles,
  Pill,
  HandHeart,
  Activity,
  Utensils
} from 'lucide-react';
import { api } from '../api';
import { exportLogsToCSV } from '../utils/exportCsv';
import { formatDateDisplay, isToday } from '../utils/date';

const MOOD_STYLES = {
  Happy: { bg: '#dcfce7', color: '#15803d', icon: '😊' },
  Calm: { bg: '#e0f2fe', color: '#0369a1', icon: '😌' },
  Anxiety: { bg: '#fef3c7', color: '#b45309', icon: '😰' },
  Aggressive: { bg: '#fee2e2', color: '#b91c1c', icon: '😡' },
  Hyperactive: { bg: '#ffedd5', color: '#c2410c', icon: '⚡' },
  'Sensory Overload': { bg: '#fce7f3', color: '#be185d', icon: '💥' },
  Withdrawn: { bg: '#f1f5f9', color: '#475569', icon: '😶' },
  'Sensory Seeking': { bg: '#f3e8ff', color: '#7e22ce', icon: '✨' },
};

export default function LogHistoryTab({ onSelectDate }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState('all');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.logs.getAll();
      if (res.success && Array.isArray(res.data)) {
        setLogs(res.data);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error('Failed to load log history:', err);
      setError(err.message || 'Failed to load historical logs.');
    } finally {
      setLoading(false);
    }
  };

  // Filter logs based on search query and mood filter
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Mood filter
      if (selectedMood !== 'all' && log.overall_mood !== selectedMood) {
        return false;
      }

      // Search query filter (matches date, notes/comment, medications, behaviors, interventions, etc.)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const inDate = (log.log_date || '').toLowerCase().includes(query);
        const inNotes = (log.notes || '').toLowerCase().includes(query);
        const inCycle = (log.is_menstruating ? 'menstruating period flow cycle' : '').includes(query);
        const inMeds = Array.isArray(log.medications) && log.medications.some((m) => m.toLowerCase().includes(query));
        const inBehaviors = Array.isArray(log.sensory_behaviors) && log.sensory_behaviors.some((b) => b.toLowerCase().includes(query));
        const inInterventions = Array.isArray(log.interventions) && log.interventions.some((i) => i.toLowerCase().includes(query));
        const inActivities = Array.isArray(log.activities) && log.activities.some((a) => a.toLowerCase().includes(query));
        const inFood = Array.isArray(log.food) && log.food.some((f) => f.toLowerCase().includes(query));

        return inDate || inNotes || inMood || inCycle || inMeds || inBehaviors || inInterventions || inActivities || inFood;
      }

      return true;
    });
  }, [logs, searchQuery, selectedMood]);

  // Overall Statistics
  const stats = useMemo(() => {
    if (!logs.length) return null;
    const total = logs.length;
    const totalSleep = logs.reduce((acc, curr) => acc + (Number(curr.sleep_hours) || 0), 0);
    const avgSleep = (totalSleep / total).toFixed(1);
    const withNotes = logs.filter((l) => (l.notes || '').trim().length > 0).length;
    return { total, avgSleep, withNotes };
  }, [logs]);

  // Trigger CSV export
  const handleExportCSV = () => {
    setExporting(true);
    try {
      const dataToExport = filteredLogs.length > 0 ? filteredLogs : logs;
      exportLogsToCSV(dataToExport);
    } catch (err) {
      alert('Error generating CSV export: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="log-history-tab">
      {/* Top Controls & Action Bar */}
      <div className="history-toolbar">
        <div className="history-search-wrap">
          <Search size={16} className="history-search-icon" />
          <input
            type="text"
            className="history-search-input"
            placeholder="Search date, comments, meds, behaviors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="history-clear-btn"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className="history-actions-row">
          <select
            className="history-select"
            value={selectedMood}
            onChange={(e) => setSelectedMood(e.target.value)}
            title="Filter by mood"
          >
            <option value="all">All Moods ({logs.length})</option>
            {Object.keys(MOOD_STYLES).map((mood) => {
              const count = logs.filter((l) => l.overall_mood === mood).length;
              return (
                <option key={mood} value={mood}>
                  {MOOD_STYLES[mood].icon} {mood} ({count})
                </option>
              );
            })}
          </select>

          <button
            type="button"
            className="btn-export-csv"
            onClick={handleExportCSV}
            disabled={exporting || logs.length === 0}
            title="Download complete logs with column headers in CSV format (Excel compatible)"
          >
            <FileSpreadsheet size={16} />
            <span>Export CSV</span>
            <span className="export-pill-count">({filteredLogs.length})</span>
          </button>

          <button
            type="button"
            className="btn-icon-subtle"
            onClick={fetchLogs}
            title="Refresh history list"
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} />
          </button>
        </div>
      </div>

      {/* Summary Stats Strip */}
      {stats && (
        <div className="history-stats-strip">
          <div className="history-stat-item">
            <span className="stat-label">Total Logs:</span>
            <span className="stat-value">{stats.total} days</span>
          </div>
          <div className="history-stat-divider">•</div>
          <div className="history-stat-item">
            <span className="stat-label">Avg Sleep:</span>
            <span className="stat-value">{stats.avgSleep} hrs</span>
          </div>
          <div className="history-stat-divider">•</div>
          <div className="history-stat-item">
            <span className="stat-label">Logged Comments:</span>
            <span className="stat-value">{stats.withNotes}</span>
          </div>
          <div className="history-stat-divider">•</div>
          <div className="history-stat-item">
            <span className="stat-label">Showing:</span>
            <span className="stat-value text-teal">{filteredLogs.length} matching</span>
          </div>
        </div>
      )}

      {/* Loading & Error States */}
      {loading && (
        <div className="history-loading-state">
          <RefreshCw size={24} className="spin-icon text-teal" />
          <p>Loading historical care records...</p>
        </div>
      )}

      {error && !loading && (
        <div className="history-error-banner">
          <p>{error}</p>
          <button type="button" className="btn btn-primary btn-sm" onClick={fetchLogs}>
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredLogs.length === 0 && (
        <div className="history-empty-state">
          <Calendar size={36} color="#94a3b8" />
          <h4>No logs match your filter</h4>
          <p>
            {searchQuery || selectedMood !== 'all'
              ? 'Try resetting the search keyword or mood filter.'
              : 'No daily records have been saved yet. Use the daily tracker to start logging.'}
          </p>
          {(searchQuery || selectedMood !== 'all') && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedMood('all');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Scrollable History List */}
      {!loading && !error && filteredLogs.length > 0 && (
        <div className="history-scroll-container">
          {filteredLogs.map((item) => {
            const today = isToday(item.log_date);
            const moodStyle = MOOD_STYLES[item.overall_mood] || { bg: '#f1f5f9', color: '#475569', icon: '📝' };
            const hasNotes = Boolean((item.notes || '').trim());

            return (
              <div key={item.log_date || item.id} className={`history-card ${today ? 'is-today-card' : ''}`}>
                {/* Card Header */}
                <div className="history-card-header">
                  <div className="history-date-group">
                    <span className="history-date-title">{formatDateDisplay(item.log_date)}</span>
                    <span className="history-date-sub">{item.log_date}</span>
                    {today && <span className="badge-today-pill">TODAY</span>}
                  </div>

                  <div className="history-header-actions">
                    {item.overall_mood && (
                      <span
                        className="history-mood-badge"
                        style={{ background: moodStyle.bg, color: moodStyle.color }}
                      >
                        {moodStyle.icon} {item.overall_mood}
                      </span>
                    )}

                    <span className="history-sleep-badge" title="Sleep hours recorded">
                      <Moon size={12} /> {item.sleep_hours || 0}h
                    </span>

                    {item.is_menstruating && (
                      <span className="history-cycle-badge" title={`Menstruating (${item.flow_intensity || 'Medium'} Flow)`}>
                        🩸 {item.flow_intensity || 'Medium'}
                      </span>
                    )}

                    {onSelectDate && (
                      <button
                        type="button"
                        className="btn-open-dashboard"
                        onClick={() => onSelectDate(item.log_date)}
                        title="Open this date directly in daily dashboard"
                      >
                        <ExternalLink size={13} />
                        <span>Open</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Categorized Logged Data */}
                <div className="history-card-body">
                  {/* Medications */}
                  {Array.isArray(item.medications) && item.medications.length > 0 && (
                    <div className="history-category-row">
                      <div className="history-cat-label">
                        <Pill size={13} color="#2563eb" />
                        <span>Medications:</span>
                      </div>
                      <div className="history-tag-wrap">
                        {item.medications.map((m, idx) => (
                          <span key={idx} className="history-tag tag-med">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sensory Behaviors */}
                  {Array.isArray(item.sensory_behaviors) && item.sensory_behaviors.length > 0 && (
                    <div className="history-category-row">
                      <div className="history-cat-label">
                        <Sparkles size={13} color="#9333ea" />
                        <span>Sensory:</span>
                      </div>
                      <div className="history-tag-wrap">
                        {item.sensory_behaviors.map((b, idx) => (
                          <span key={idx} className="history-tag tag-sensory">
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interventions */}
                  {Array.isArray(item.interventions) && item.interventions.length > 0 && (
                    <div className="history-category-row">
                      <div className="history-cat-label">
                        <HandHeart size={13} color="#059669" />
                        <span>Interventions:</span>
                      </div>
                      <div className="history-tag-wrap">
                        {item.interventions.map((i, idx) => (
                          <span key={idx} className="history-tag tag-intervention">
                            {i}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Activities */}
                  {Array.isArray(item.activities) && item.activities.length > 0 && (
                    <div className="history-category-row">
                      <div className="history-cat-label">
                        <Activity size={13} color="#ea580c" />
                        <span>Activities:</span>
                      </div>
                      <div className="history-tag-wrap">
                        {item.activities.map((a, idx) => (
                          <span key={idx} className="history-tag tag-activity">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Food / Nutrition */}
                  {Array.isArray(item.food) && item.food.length > 0 && (
                    <div className="history-category-row">
                      <div className="history-cat-label">
                        <Utensils size={13} color="#0d9488" />
                        <span>Nutrition:</span>
                      </div>
                      <div className="history-tag-wrap">
                        {item.food.map((f, idx) => (
                          <span key={idx} className="history-tag tag-food">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Comments / Notes */}
                  <div className={`history-comment-box ${hasNotes ? 'has-notes' : 'empty-notes'}`}>
                    <div className="history-comment-header">
                      <MessageSquare size={13} color={hasNotes ? '#0f766e' : '#94a3b8'} />
                      <span className="history-comment-label">Parent Comments & Observations:</span>
                    </div>
                    {hasNotes ? (
                      <p className="history-comment-text">{item.notes}</p>
                    ) : (
                      <p className="history-comment-placeholder">No observations or notes entered for this date.</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
