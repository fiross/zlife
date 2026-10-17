import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export default function DateNavigator({ selectedDate, onDateChange }) {
  const dateInputRef = useRef(null);

  // Parse YYYY-MM-DD
  const [year, month, day] = selectedDate.split('-').map(Number);
  const currentDate = new Date(year, month - 1, day);

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === todayStr;

  const formatDateDisplay = (dateObj) => {
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handlePrevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    onDateChange(prev.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    onDateChange(next.toISOString().split('T')[0]);
  };

  const handleDatePicked = (e) => {
    if (e.target.value) {
      onDateChange(e.target.value);
    }
  };

  return (
    <div className="date-nav-card" id="date-navigator">
      <button
        type="button"
        className="btn-icon"
        onClick={handlePrevDay}
        id="prev-date-btn"
        title="Previous Day"
      >
        <ChevronLeft size={20} />
      </button>

      <div
        className="date-center"
        onClick={() => dateInputRef.current?.showPicker ? dateInputRef.current.showPicker() : dateInputRef.current?.click()}
        title="Click to select specific date"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CalendarIcon size={16} color="var(--teal-primary)" />
          <span className="date-day-text">{formatDateDisplay(currentDate)}</span>
        </div>
        <span className="date-sub-badge">
          {isToday ? 'TODAY' : 'HISTORICAL LOG'}
        </span>

        {/* Hidden native date input for the picker */}
        <input
          ref={dateInputRef}
          type="date"
          value={selectedDate}
          onChange={handleDatePicked}
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
          id="date-picker-hidden-input"
        />
      </div>

      <button
        type="button"
        className="btn-icon"
        onClick={handleNextDay}
        id="next-date-btn"
        title="Next Day"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
