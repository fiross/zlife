/**
 * Daily Tracker - Unified REST API Client
 * Interfaces with PHP / MySQL backend with credentials & session support
 */

const API_BASE = './api';

async function apiFetch(endpoint, options = {}) {
  const config = {
    ...options,
    credentials: 'include', // Include PHPSESSID cookie
    headers: {
      'Accept': 'application/json',
      ...(options.headers || {})
    }
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || `HTTP ${response.status}`);
    error.status = response.status;
    error.code = data.code;
    throw error;
  }

  return data;
}

export const api = {
  auth: {
    checkSession: () => apiFetch('/auth.php'),
    login: (passcode) => apiFetch('/auth.php', { method: 'POST', body: { passcode } }),
    logout: () => apiFetch('/auth.php?action=logout', { method: 'POST' }),
  },
  settings: {
    get: () => apiFetch('/settings.php'),
    update: (profileData) => apiFetch('/settings.php', { method: 'POST', body: profileData }),
  },
  lists: {
    get: (all = false) => apiFetch(`/lists.php${all ? '?all=1' : ''}`),
    toggle: (id, isActive) => apiFetch('/lists.php', { method: 'POST', body: { action: 'toggle', id, is_active: isActive } }),
    add: (category, itemName) => apiFetch('/lists.php', { method: 'POST', body: { action: 'add', category, item_name: itemName } }),
  },
  logs: {
    getByDate: (date) => apiFetch(`/logs.php?date=${date}`),
    getAll: (limit = 1000) => apiFetch(`/logs.php?all=1&limit=${limit}`),
    save: (logData) => apiFetch('/logs.php', { method: 'POST', body: logData }),
  },
  passcodes: {
    update: ({ parent_passcode, teacher_passcode }) =>
      apiFetch('/passcodes.php', { method: 'POST', body: { parent_passcode, teacher_passcode } }),
  }
};
