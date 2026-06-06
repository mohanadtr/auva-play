import { useState, useRef, useEffect } from 'react';
import { Type, Minus, Plus, X } from 'lucide-react';
import { BTN_ICON } from '../utils/buttonClasses';

const SIZES = [
  { label: 'Small', value: '14px' },
  { label: 'Normal', value: '18px' },
  { label: 'Large', value: '24px' },
  { label: 'Huge', value: '32px' },
];

const COLORS = [
  { label: 'White', value: '#ffffff' },
  { label: 'Yellow', value: '#ffff00' },
  { label: 'Green', value: '#4ade80' },
  { label: 'Cyan', value: '#22d3ee' },
];

const BACKGROUNDS = [
  { label: 'Clear', value: 'transparent' },
  { label: 'Dark', value: 'rgba(0, 0, 0, 0.5)' },
  { label: 'Opaque', value: 'rgba(0, 0, 0, 0.85)' },
];

export default function SubtitlePanel({
  enabled,
  hasSubtitles,
  offset,
  onOffsetChange,
  style,
  onStyleChange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick, true);
    document.addEventListener('keydown', handleKey, true);
    return () => {
      document.removeEventListener('mousedown', handleClick, true);
      document.removeEventListener('keydown', handleKey, true);
    };
  }, [isOpen]);

  if (!hasSubtitles) return null;

  return (
    <div className="filter-control" ref={panelRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`${BTN_ICON} filter-btn${enabled ? ' filter-btn--active' : ''}`}
        title="Subtitle Settings (C to toggle)"
      >
        <Type size={18} />
      </button>

      {isOpen && (
        <div className="filter-panel" onClick={(e) => e.stopPropagation()}>
          <div className="filter-panel__header">
            <span className="filter-panel__title">Subtitle Settings</span>
            <div className="filter-panel__actions">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={BTN_ICON}
                aria-label="Close"
                style={{ width: 28, height: 28 }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="p-3 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400">Delay / Sync</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOffsetChange(-0.1)}
                  className="w-8 h-8 flex items-center justify-center bg-zinc-800 rounded border border-zinc-700 hover:bg-zinc-700 transition"
                  title="Backward 100ms"
                >
                  <Minus size={14} />
                </button>
                <div className="flex-1 text-center font-mono text-sm tabular-nums text-zinc-200 bg-zinc-900 rounded py-1 border border-zinc-800">
                  {offset > 0 ? '+' : ''}{offset.toFixed(1)}s
                </div>
                <button
                  type="button"
                  onClick={() => onOffsetChange(0.1)}
                  className="w-8 h-8 flex items-center justify-center bg-zinc-800 rounded border border-zinc-700 hover:bg-zinc-700 transition"
                  title="Forward 100ms"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400">Size</span>
              <div className="flex flex-wrap gap-1">
                {SIZES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => onStyleChange('fontSize', s.value)}
                    className={`filter-preset-btn ${style.fontSize === s.value ? 'filter-preset-btn--active' : ''}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400">Color</span>
              <div className="flex flex-wrap gap-1">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => onStyleChange('color', c.value)}
                    className={`filter-preset-btn ${style.color === c.value ? 'filter-preset-btn--active' : ''}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full border border-zinc-500" style={{ background: c.value }} />
                      {c.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400">Background</span>
              <div className="flex flex-wrap gap-1">
                {BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.value}
                    type="button"
                    onClick={() => onStyleChange('background', bg.value)}
                    className={`filter-preset-btn ${style.background === bg.value ? 'filter-preset-btn--active' : ''}`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
