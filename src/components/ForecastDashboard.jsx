import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Brain,
  Calendar,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  HeartPulse,
  Info,
  Activity,
  FileText
} from 'lucide-react';

/**
 * Format date or day string into friendly, empathetic labels
 */
function formatForecastDay(dayStr, index) {
  if (!dayStr) {
    const rel = index === 0 ? 'Tomorrow' : `Day ${index + 1}`;
    return { title: rel, subDate: '' };
  }

  // Handle ISO date format like "2026-11-01"
  if (/^\d{4}-\d{2}-\d{2}$/.test(dayStr.trim())) {
    const parts = dayStr.trim().split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    const dayName = d.toLocaleDateString([], { weekday: 'short' });
    const monthName = d.toLocaleDateString([], { month: 'short' });
    const relTag = index === 0 ? 'Tomorrow' : (index === 1 ? 'In 2 Days' : 'In 3 Days');
    return {
      title: `${relTag} (${dayName})`,
      subDate: `${monthName} ${day}`
    };
  }

  // Handle plain day names or relative strings
  const relTag = index === 0 ? 'Tomorrow' : (index === 1 ? 'Day 2' : 'Day 3');
  return {
    title: `${relTag} • ${dayStr}`,
    subDate: ''
  };
}

/**
 * Helper to select empathetic icon and color palette based on mood text
 */
function getMoodVisuals(mood = '') {
  const m = mood.toLowerCase();
  if (m.includes('calm') || m.includes('peace') || m.includes('serene')) {
    return {
      emoji: '😌',
      badgeBg: '#d1fae5',
      badgeColor: '#065f46',
      badgeBorder: '#a7f3d0',
      cardBorder: '#a7f3d0',
      label: 'Regulated & Calm'
    };
  }
  if (m.includes('happy') || m.includes('bright') || m.includes('content') || m.includes('engaged')) {
    return {
      emoji: '😊',
      badgeBg: '#fef3c7',
      badgeColor: '#92400e',
      badgeBorder: '#fde68a',
      cardBorder: '#fde68a',
      label: 'Bright & Positive'
    };
  }
  if (m.includes('overload') || m.includes('meltdown') || m.includes('aggress')) {
    return {
      emoji: '💥',
      badgeBg: '#ffe4e6',
      badgeColor: '#9f1239',
      badgeBorder: '#fecdd3',
      cardBorder: '#fda4af',
      label: 'High Sensory Alert'
    };
  }
  if (m.includes('anxiety') || m.includes('tense') || m.includes('nervous')) {
    return {
      emoji: '😰',
      badgeBg: '#ede9fe',
      badgeColor: '#5b21b6',
      badgeBorder: '#ddd6fe',
      cardBorder: '#c4b5fd',
      label: 'Sensory Tension'
    };
  }
  if (m.includes('hyper') || m.includes('active') || m.includes('energy')) {
    return {
      emoji: '⚡',
      badgeBg: '#ffedd5',
      badgeColor: '#9a3412',
      badgeBorder: '#fed7aa',
      cardBorder: '#fdba74',
      label: 'High Motor Drive'
    };
  }
  if (m.includes('seek') || m.includes('stimming')) {
    return {
      emoji: '✨',
      badgeBg: '#cffafe',
      badgeColor: '#155e75',
      badgeBorder: '#a5f3fc',
      cardBorder: '#67e8f9',
      label: 'Sensory Seeking'
    };
  }
  if (m.includes('withdrawn') || m.includes('low') || m.includes('fatigue')) {
    return {
      emoji: '😶',
      badgeBg: '#f1f5f9',
      badgeColor: '#475569',
      badgeBorder: '#cbd5e1',
      cardBorder: '#cbd5e1',
      label: 'Low Energy / Rest'
    };
  }
  return {
    emoji: '🌸',
    badgeBg: '#ede9fe',
    badgeColor: '#4338ca',
    badgeBorder: '#c7d2fe',
    cardBorder: '#c7d2fe',
    label: 'Observation Mode'
  };
}

/**
 * Helper to assess risk severity for empathetic iconography
 */
function getRiskVisuals(risk = '') {
  const r = risk.toLowerCase();
  if (r.includes('low') || r.includes('none') || r.includes('minimal')) {
    return {
      icon: ShieldCheck,
      color: '#059669',
      bg: '#ecfdf5',
      border: '#a7f3d0',
      tag: 'Low Risk'
    };
  }
  if (r.includes('high') || r.includes('severe') || r.includes('overload') || r.includes('meltdown')) {
    return {
      icon: ShieldAlert,
      color: '#e11d48',
      bg: '#fff1f2',
      border: '#fecdd3',
      tag: 'Watch Alert'
    };
  }
  return {
    icon: AlertTriangle,
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    tag: 'Caution'
  };
}

/**
 * ForecastDashboard Component
 * 30-Day Longitudinal Synthesis incorporating active_challenges and diagnostic_summary.
 */
export default function ForecastDashboard({ childName = 'Zeba', className = '' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Option to display / expand analysis card (defaults to true)
  const [showAnalysis, setShowAnalysis] = useState(() => {
    try {
      const saved = localStorage.getItem('zlife_show_ai_analysis');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const toggleAnalysisOption = () => {
    setShowAnalysis((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('zlife_show_ai_analysis', JSON.stringify(next));
      } catch (e) {
        console.warn('Could not save analysis view preference', e);
      }
      return next;
    });
  };

  const fetchForecast = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const endpoint = `api/get_app_forecast.php${isRefresh ? '?refresh=1' : ''}`;
      const response = await fetch(endpoint, {
        headers: {
          Accept: 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const json = await response.json();

      const normalized = {
        current_analysis: json.current_analysis ?? json.data?.current_analysis ?? '',
        mood_forecast: json.mood_forecast ?? json.data?.mood_forecast ?? [],
        active_challenges: json.active_challenges ?? json.data?.active_challenges ?? [],
        diagnostic_summary: json.diagnostic_summary ?? json.data?.diagnostic_summary ?? '',
        days_analyzed: json.days_analyzed ?? json.data?.days_analyzed ?? 30
      };

      setData(normalized);
    } catch (err) {
      console.error('Forecast fetch failed:', err);
      setError(err.message || 'Unable to load behavioral forecast.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchForecast(false);
  }, [fetchForecast]);

  const activeChallenges = data?.active_challenges || [];
  const diagnosticSummary = data?.diagnostic_summary || '';
  const daysAnalyzed = data?.days_analyzed || 30;

  return (
    <section
      className={`card-section card-ai-forecast ${className}`}
      id="forecast-dashboard"
      aria-label="Behavioral Mood & Sensory Forecast"
      style={{
        padding: '22px 20px',
        margin: '14px 16px',
        borderRadius: '24px'
      }}
    >
      {/* 1. SECTION HEADER (Harmonized with Z-Life Design System) */}
      <div
        className="section-header"
        style={{
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px'
        }}
      >
        <div className="section-title-wrap" style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: 0 }}>
          <div
            className="section-icon-badge"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #7c3aed 100%)',
              color: '#ffffff',
              boxShadow: '0 6px 16px rgba(124, 58, 237, 0.35)',
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Brain size={25} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2
                className="section-title"
                style={{
                  fontSize: '1.25rem',
                  fontWeight: '800',
                  color: '#1e1b4b',
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '-0.01em',
                  margin: 0,
                  lineHeight: '1.25'
                }}
              >
                AI Behavioral & Mood Forecast
              </h2>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  color: '#6d28d9',
                  background: '#ffffff',
                  padding: '3px 9px',
                  borderRadius: '999px',
                  border: '1.5px solid #ddd6fe',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 5px rgba(109, 40, 217, 0.06)',
                  lineHeight: '1'
                }}
              >
                <Sparkles size={11} /> {daysAnalyzed}-Day Clinical Synthesis
              </span>
            </div>
            <p
              className="section-subtitle"
              style={{
                fontSize: '0.85rem',
                color: '#64748b',
                marginTop: '4px',
                marginBottom: 0,
                fontFamily: 'var(--font-body)',
                lineHeight: '1.4'
              }}
            >
              Longitudinal autonomic trajectory & trigger prevention for <strong>{childName}</strong>
            </p>
          </div>
        </div>

        {/* Action Buttons: Display Option Toggle & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginTop: '2px' }}>
          {/* Option Button to Display/Hide Analysis (Task 3 requirement) */}
          <button
            type="button"
            onClick={toggleAnalysisOption}
            id="toggle-analysis-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 13px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: '700',
              fontFamily: 'var(--font-heading)',
              border: '1.5px solid #c4b5fd',
              background: showAnalysis ? '#ffffff' : '#f5f3ff',
              color: '#6d28d9',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(109, 40, 217, 0.08)',
              transition: 'all 0.15s ease',
              lineHeight: '1',
              whiteSpace: 'nowrap'
            }}
            title={showAnalysis ? 'Hide Nervous System Analysis' : 'Display Nervous System Analysis'}
          >
            {showAnalysis ? (
              <>
                <EyeOff size={14} />
                <span>Hide Analysis</span>
                <ChevronUp size={14} style={{ opacity: 0.7 }} />
              </>
            ) : (
              <>
                <Eye size={14} />
                <span>Display Analysis</span>
                <ChevronDown size={14} style={{ opacity: 0.7 }} />
              </>
            )}
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchForecast(true)}
            disabled={loading || refreshing}
            id="refresh-forecast-btn"
            style={{
              width: '38px',
              height: '38px',
              padding: 0,
              borderRadius: 'var(--radius-full)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#ffffff',
              color: '#6d28d9',
              border: '1.5px solid #c4b5fd',
              cursor: loading || refreshing ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.15s ease',
              opacity: loading || refreshing ? 0.6 : 1,
              flexShrink: 0
            }}
            title="Re-run forecast analysis on latest 30-day logs and clinical profile"
          >
            <RefreshCw
              size={15}
              style={{
                animation: refreshing ? 'spin 1s linear infinite' : 'none'
              }}
            />
          </button>
        </div>
      </div>

      {/* 2. LOADING STATE */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '24px 22px',
              border: '1.5px solid #ddd6fe',
              boxShadow: '0 4px 12px rgba(109, 40, 217, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ height: '16px', background: '#ede9fe', borderRadius: '6px', width: '35%' }} />
            <div style={{ height: '14px', background: '#f5f3ff', borderRadius: '6px', width: '100%' }} />
            <div style={{ height: '14px', background: '#f5f3ff', borderRadius: '6px', width: '85%' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px' }}>
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  padding: '20px',
                  border: '1.5px solid #e2e8f0',
                  height: '190px'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* 3. ERROR STATE */}
      {error && !loading && (
        <div
          style={{
            background: '#fff1f2',
            border: '1.5px solid #fecdd3',
            borderRadius: '18px',
            padding: '18px 22px',
            color: '#9f1239',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            marginBottom: '18px'
          }}
        >
          <AlertTriangle size={22} style={{ color: '#e11d48', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1, fontSize: '0.9rem' }}>
            <strong style={{ display: 'block', marginBottom: '3px' }}>Unable to load forecast</strong>
            <p style={{ margin: 0, color: '#be123c', fontSize: '0.84rem', lineHeight: '1.45' }}>{error}</p>
            <button
              type="button"
              onClick={() => fetchForecast(true)}
              style={{
                marginTop: '10px',
                background: '#ffffff',
                border: '1px solid #fda4af',
                color: '#be123c',
                padding: '5px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* 4. MAIN CONTENT AREA */}
      {data && !loading && (
        <div>
          {/* Card: Current Nervous System Analysis (Clean modern Tailwind CSS card as requested) */}
          {showAnalysis && (
            <div
              className="bg-white rounded-2xl border border-purple-200/90 shadow-sm relative overflow-hidden mb-6 transition-all duration-300"
              id="current-analysis-card"
              style={{
                background: '#ffffff',
                border: '1.5px solid #ddd6fe',
                borderRadius: '20px',
                padding: '22px 24px',
                boxShadow: '0 6px 20px -3px rgba(109, 40, 217, 0.08)'
              }}
            >
              {/* Card Subheader */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '14px',
                  marginBottom: '16px',
                  borderBottom: '1.5px solid #f3e8ff',
                  gap: '10px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '9px',
                      background: '#ede9fe',
                      color: '#7c3aed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <HeartPulse size={18} />
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '0.88rem',
                      fontWeight: '800',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: '#312e81',
                      lineHeight: '1'
                    }}
                  >
                    Current Nervous System State ({daysAnalyzed}-Day Trajectory)
                  </span>
                </div>

                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: '700',
                    color: '#6d28d9',
                    background: '#f5f3ff',
                    padding: '5px 12px',
                    borderRadius: '999px',
                    border: '1px solid #ddd6fe',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    lineHeight: '1',
                    flexShrink: 0
                  }}
                >
                  <Activity size={13} /> Autonomic Synthesis
                </span>
              </div>

              {/* Analysis Body - Empathetic Highlight Callout */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #faf5ff 0%, #f5f3ff 100%)',
                  borderRadius: '14px',
                  padding: '20px 22px',
                  borderLeft: '4.5px solid #7c3aed',
                  borderTop: '1px solid #f3e8ff',
                  borderRight: '1px solid #f3e8ff',
                  borderBottom: '1px solid #f3e8ff',
                  boxShadow: 'inset 0 1px 3px rgba(124, 58, 237, 0.03)'
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '1rem',
                    lineHeight: '1.75',
                    color: '#1e293b',
                    fontWeight: '500',
                    margin: 0
                  }}
                >
                  "{data.current_analysis || 'No behavioral analysis recorded.'}"
                </p>
              </div>

              {/* Active Clinical Challenges Tags */}
              {activeChallenges.length > 0 && (
                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f3e8ff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <ShieldAlert size={14} style={{ color: '#7c3aed' }} />
                    <span
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '0.76rem',
                        fontWeight: '800',
                        color: '#4338ca',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}
                    >
                      Active Clinical Challenges Considered
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {activeChallenges.map((challenge, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: '700',
                          padding: '4px 11px',
                          borderRadius: '999px',
                          background: '#ede9fe',
                          color: '#5b21b6',
                          border: '1px solid #ddd6fe',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span style={{ fontSize: '0.9em', color: '#7c3aed' }}>•</span>
                        {challenge}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Diagnostic Profile Context */}
              {diagnosticSummary && (
                <div
                  style={{
                    marginTop: '12px',
                    background: 'rgba(248, 250, 252, 0.85)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    border: '1px dashed #cbd5e1',
                    fontSize: '0.78rem',
                    color: '#475569',
                    lineHeight: '1.45',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}
                >
                  <FileText size={15} style={{ color: '#6366f1', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: '#1e293b' }}>Clinical Diagnostic Summary:</strong> {diagnosticSummary}
                  </div>
                </div>
              )}

              {/* Footnote Context */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  marginTop: '14px',
                  fontSize: '0.76rem',
                  color: '#64748b',
                  lineHeight: '1.45'
                }}
              >
                <Info size={15} style={{ color: '#7c3aed', flexShrink: 0, marginTop: '2px' }} />
                <span>
                  Synthesized by Gemini AI from {daysAnalyzed}-day longitudinal care logs, active sensory challenges, and pediatric diagnostic profile.
                </span>
              </div>
            </div>
          )}

          {/* Collapsed State Bar (when user toggles analysis off) */}
          {!showAnalysis && (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '18px',
                padding: '14px 20px',
                marginBottom: '18px',
                border: '1.5px solid #ddd6fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
                gap: '10px'
              }}
            >
              <span
                style={{
                  fontSize: '0.86rem',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Info size={16} style={{ color: '#7c3aed', flexShrink: 0 }} />
                Nervous system analysis narrative is currently hidden.
              </span>
              <button
                type="button"
                onClick={toggleAnalysisOption}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#7c3aed',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 8px'
                }}
              >
                <Eye size={15} />
                <span>Show Narrative</span>
              </button>
            </div>
          )}

          {/* 3-DAY MOOD FORECAST SECTION */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
                padding: '0 4px',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} style={{ color: '#6d28d9', flexShrink: 0 }} />
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.94rem',
                    fontWeight: '800',
                    color: '#1e1b4b',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    margin: 0,
                    lineHeight: '1.2'
                  }}
                >
                  Upcoming 3-Day Mood & Trigger Risks
                </h3>
              </div>
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: '700',
                  color: '#6d28d9',
                  background: '#ffffff',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  border: '1.5px solid #ddd6fe',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                  lineHeight: '1',
                  flexShrink: 0
                }}
              >
                Next 72 Hours
              </span>
            </div>

            {/* Grid of 3 Separate Cards (Responsive 3-Column on Desktop/Tablet, 1-Column on Phone) */}
            <div className="forecast-cards-grid">
              {(data.mood_forecast || []).map((item, idx) => {
                const moodStyle = getMoodVisuals(item.predicted_mood);
                const riskStyle = getRiskVisuals(item.primary_trigger_risk);
                const RiskIcon = riskStyle.icon;
                const formattedDay = formatForecastDay(item.day, idx);

                return (
                  <div
                    key={idx}
                    className="forecast-single-card"
                    style={{
                      background: '#ffffff',
                      borderRadius: '20px',
                      padding: '18px 16px',
                      border: `1.5px solid ${moodStyle.cardBorder}`,
                      boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '14px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Top colored accent line */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: moodStyle.badgeColor
                      }}
                    />

                    <div>
                      {/* Day Label & Badge Header */}
                      <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            justifyContent: 'space-between',
                            gap: '6px'
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'var(--font-heading)',
                              fontSize: '0.94rem',
                              fontWeight: '800',
                              color: '#1e293b',
                              lineHeight: '1.25'
                            }}
                          >
                            {formattedDay.title}
                          </span>
                          {formattedDay.subDate && (
                            <span
                              style={{
                                fontSize: '0.74rem',
                                color: '#64748b',
                                fontWeight: '700',
                                lineHeight: '1.2'
                              }}
                            >
                              {formattedDay.subDate}
                            </span>
                          )}
                        </div>

                        <div>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: '700',
                              padding: '3px 10px',
                              borderRadius: '999px',
                              background: moodStyle.badgeBg,
                              color: moodStyle.badgeColor,
                              border: `1px solid ${moodStyle.badgeBorder}`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              lineHeight: '1.2'
                            }}
                          >
                            {moodStyle.label}
                          </span>
                        </div>
                      </div>

                      {/* Predicted Mood Section */}
                      <div
                        style={{
                          background: '#f8fafc',
                          borderRadius: '14px',
                          padding: '12px 14px',
                          border: '1px solid #f1f5f9',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.68rem',
                            color: '#94a3b8',
                            fontWeight: '800',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            display: 'block',
                            lineHeight: '1'
                          }}
                        >
                          Predicted Disposition
                        </span>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}
                        >
                          <span
                            style={{
                              fontSize: '1.85rem',
                              lineHeight: '1',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
                            }}
                            role="img"
                            aria-label={item.predicted_mood}
                          >
                            {moodStyle.emoji}
                          </span>
                          <span
                            style={{
                              fontFamily: 'var(--font-heading)',
                              fontSize: '1.14rem',
                              fontWeight: '800',
                              color: '#0f172a',
                              lineHeight: '1.2'
                            }}
                          >
                            {item.predicted_mood || 'Calm'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Primary Trigger Risk Card Footer */}
                    <div
                      style={{
                        background: riskStyle.bg,
                        border: `1.5px solid ${riskStyle.border}`,
                        borderRadius: '14px',
                        padding: '12px 14px',
                        marginTop: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                          flexWrap: 'wrap'
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.72rem',
                            fontWeight: '800',
                            color: riskStyle.color,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            lineHeight: '1.2'
                          }}
                        >
                          <RiskIcon size={14} style={{ flexShrink: 0 }} />
                          <span>Trigger Risk</span>
                        </div>
                        <span
                          style={{
                            fontSize: '0.66rem',
                            fontWeight: '800',
                            color: riskStyle.color,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            padding: '2px 7px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.75)',
                            border: `1px solid ${riskStyle.border}`,
                            lineHeight: '1.2'
                          }}
                        >
                          {riskStyle.tag}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.82rem',
                          color: '#334155',
                          lineHeight: '1.45',
                          fontWeight: '500'
                        }}
                      >
                        {item.primary_trigger_risk || 'Low / None observed.'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
