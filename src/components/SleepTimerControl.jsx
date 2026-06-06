import { useState, useRef, useEffect } from 'react';
import { Timer } from 'lucide-react';
import { BTN_ICON } from '../utils/buttonClasses';

export default function SleepTimerControl({ timer }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (ms) => {
    if (ms === null) timer.clear();
    else timer.start(ms);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="speed-control sleep-timer-control">
      {isOpen && (
        <div className="speed-dropdown sleep-dropdown">
          {timer.options.map((opt) => (
            <button
              key={opt.ms}
              type="button"
              className="speed-dropdown__item"
              onClick={() => handleSelect(opt.ms)}
            >
              {opt.label}
            </button>
          ))}
          {timer.isActive && (
            <button
              type="button"
              className="speed-dropdown__item"
              onClick={() => handleSelect(null)}
              style={{ color: '#f87171' }}
            >
              Cancel
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`${BTN_ICON}${timer.isActive ? ' btn-icon--active' : ''}${timer.isUrgent ? ' sleep-timer--urgent' : ''}`}
        title={timer.isActive ? `Sleep timer: ${timer.display}` : 'Sleep timer'}
        style={timer.isActive ? { color: 'rgba(255,255,255,0.9)' } : undefined}
      >
        <Timer size={18} className="sleep-timer-icon" />
        {timer.isActive && (
          <span className="sleep-timer-countdown">{timer.display}</span>
        )}
      </button>
    </div>
  );
}
