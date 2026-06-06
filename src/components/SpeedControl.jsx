import { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';
import { SPEEDS, formatSpeedBadge } from '../constants/speeds';

export default function SpeedControl({ speed, onSpeedChange }) {
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

  return (
    <div ref={containerRef} className="speed-control">
      {isOpen && (
        <div className="speed-dropdown">
          {SPEEDS.map((preset) => {
            const isActive = speed === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  onSpeedChange(preset);
                  setIsOpen(false);
                }}
                className={`speed-dropdown__item${isActive ? ' speed-dropdown__item--active' : ''}`}
              >
                <span>{preset}x</span>
                {isActive && <Check size={14} color="#ffffff" />}
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="speed-badge"
        title="Playback speed"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {formatSpeedBadge(speed)}
      </button>
    </div>
  );
}
