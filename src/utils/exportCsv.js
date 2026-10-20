/**
 * CSV Export utility for Daily Tracker care logs.
 * Exports tabular data with UTF-8 BOM for full Microsoft Excel, Apple Numbers,
 * and Google Sheets compatibility.
 */

export function exportLogsToCSV(logs, filename = null) {
  if (!logs || logs.length === 0) {
    alert('No logs available to export.');
    return;
  }

  // Column headers
  const headers = [
    'Date',
    'Day of Week',
    'Sleep (Hours)',
    'Overall Mood',
    'Medications',
    'Sensory Behaviors',
    'Calming Interventions',
    'Activities & Sports',
    'Food & Nutrition',
    'Comments & Observations',
    'Last Saved'
  ];

  // Helper to escape CSV cell according to RFC 4180
  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  // Format rows
  const rows = logs.map((log) => {
    let dayName = '';
    try {
      const [y, m, d] = (log.log_date || '').split('-').map(Number);
      if (y && m && d) {
        dayName = new Date(y, m - 1, d, 12).toLocaleDateString('en-US', { weekday: 'long' });
      }
    } catch {
      dayName = '';
    }

    return [
      escapeCell(log.log_date),
      escapeCell(dayName),
      escapeCell(log.sleep_hours !== undefined ? log.sleep_hours : 0),
      escapeCell(log.overall_mood || ''),
      escapeCell(Array.isArray(log.medications) ? log.medications.join('; ') : ''),
      escapeCell(Array.isArray(log.sensory_behaviors) ? log.sensory_behaviors.join('; ') : ''),
      escapeCell(Array.isArray(log.interventions) ? log.interventions.join('; ') : ''),
      escapeCell(Array.isArray(log.activities) ? log.activities.join('; ') : ''),
      escapeCell(Array.isArray(log.food) ? log.food.join('; ') : ''),
      escapeCell(log.notes || ''),
      escapeCell(log.updated_at || log.created_at || '')
    ].join(',');
  });

  // Prepend UTF-8 BOM (\uFEFF) for Excel compatibility
  const csvContent = '\uFEFF' + [headers.map(escapeCell).join(','), ...rows].join('\r\n');

  // Trigger browser download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const todayStr = new Date().toISOString().split('T')[0];
  link.setAttribute('download', filename || `zlife_care_logs_${todayStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
