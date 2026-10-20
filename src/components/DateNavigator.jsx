import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import { shiftDate, formatDateDisplay, isToday, getLocalDateString } from '../utils/date';

export default function DateNavigator({ selectedDate, onDateChange }) {
  const dateInputRef = useRef(null);
  const isSelectedToday = isToday(selectedDate);

  const handlePrevDay = () => {
    onDateChange(shiftDate(selectedDate, -1));
  };

  const handleNextDay = () => {
    onDateChange(shiftDate(selectedDate, 1));
  };

  const handleJumpToToday = (e) => {
    e.stopPropagation();
    onDateChange(getLocalDateString());
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
          <span className="date-day-text">{formatDateDisplay(selectedDate)}</span>
        </div>
        <span
          className={`date-sub-badge ${isSelectedToday ? 'is-today' : 'is-historical'}`}
          onClick={!isSelectedToday ? handleJumpToToday : undefined}
          title={!isSelectedToday ? 'Click to jump to today' : undefined}
          role={!isSelectedToday ? 'button' : undefined}
        >
          {isSelectedToday ? (
            'TODAY'
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <RotateCcw size={10} /> HISTORICAL • JUMP TO TODAY
            </span>
          )}
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
