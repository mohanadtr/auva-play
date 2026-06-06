import { X, Pencil } from 'lucide-react';
import { formatTime } from '../utils/formatTime';
import { BTN_ICON } from '../utils/buttonClasses';

/**
 * A-B repeat indicator and controls.
 */
export default function ABRepeat({ pointA, pointB, isActive, onClear }) {
  if (pointA === null && pointB === null) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div className="ab-badge">
        <Pencil size={12} className={isActive ? 'ab-badge__active' : ''} color={isActive ? '#60a5fa' : 'var(--text-3)'} />
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          <span className={pointA !== null ? 'ab-badge__active' : ''} style={{ color: pointA !== null ? '#60a5fa' : 'var(--text-3)' }}>
            A:{pointA !== null ? formatTime(pointA) : '--:--'}
          </span>
          <span style={{ color: 'var(--border)', margin: '0 4px' }}>→</span>
          <span className={pointB !== null ? 'ab-badge__active' : ''} style={{ color: pointB !== null ? '#60a5fa' : 'var(--text-3)' }}>
            B:{pointB !== null ? formatTime(pointB) : '--:--'}
          </span>
        </span>
      </div>

      <button type="button" onClick={onClear} className={BTN_ICON} style={{ width: 28, height: 28 }} title="Clear A-B (Escape)">
        <X size={14} />
      </button>

      {isActive && (
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#60a5fa',
            animation: 'pulse 2s infinite',
          }}
        />
      )}
    </div>
  );
}
