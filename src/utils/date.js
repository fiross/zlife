/**
 * Date utility helpers for local timezone handling.
 * Avoids UTC skew bugs caused by Date.prototype.toISOString().
 */

/**
 * Returns a 'YYYY-MM-DD' formatted string from a Date object using the client's local timezone.
 *
 * @param {Date|number|string} [date=new Date()]
 * @returns {string} e.g. "2026-10-19"
 */
export function getLocalDateString(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a 'YYYY-MM-DD' string into a local Date object.
 * Sets time to 12:00:00 (noon) to safely prevent Daylight Saving Time (DST)
 * rollovers across midnight.
 *
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @returns {Date}
 */
export function parseLocalDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    return new Date();
  }
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return new Date();
  }
  const [year, month, day] = parts;
  return new Date(year, month - 1, day, 12, 0, 0);
}

/**
 * Formats a Date or 'YYYY-MM-DD' string for user-friendly display.
 * e.g., "Mon, Oct 19, 2026"
 *
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function formatDateDisplay(dateInput) {
  const dateObj = typeof dateInput === 'string' ? parseLocalDate(dateInput) : dateInput;
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return '';
  }
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Adds or subtracts days from a 'YYYY-MM-DD' string safely in local time.
 *
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {number} days - e.g. -1 for previous day, +1 for next day
 * @returns {string} - 'YYYY-MM-DD'
 */
export function shiftDate(dateStr, days) {
  const date = parseLocalDate(dateStr);
  date.setDate(date.getDate() + days);
  return getLocalDateString(date);
}

/**
 * Checks whether a given 'YYYY-MM-DD' matches today in the client's local timezone.
 *
 * @param {string} dateStr
 * @returns {boolean}
 */
export function isToday(dateStr) {
  return dateStr === getLocalDateString();
}
