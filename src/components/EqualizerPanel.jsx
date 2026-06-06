import { useState, useRef, useEffect } from 'react';
import { AudioLines, RotateCcw, X, Power } from 'lucide-react';
import { EQ_PRESETS } from '../hooks/useEqualizer';
import { BTN_ICON } from '../utils/buttonClasses';

function EqSlider({ label, value, min, max, step, onChange, disabled }) {
  const isDefault = value === 0;

  return (
    <div className={`filter-slider ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="filter-slider__header">
        <span className="filter-slider__label">{label}Hz</span>
        <span className="filter-slider__value">
          {value > 0 ? '+' : ''}{value}dB
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`filter-slider__input${!isDefault && !disabled ? ' filter-slider__input--active' : ''}`}
        disabled={disabled}
      />
    </div>
  );
}

export default function EqualizerPanel({
  bands,
  gains,
  activePreset,
  isEnabled,
  isFlat,
  initAudio,
  onUpdateGain,
  onApplyPreset,
  onReset,
  onToggleEQ,
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

  const handleOpen = () => {
    setIsOpen((v) => !v);
    if (!isEnabled) {
      initAudio();
    }
  };

  return (
    <div className="filter-control" ref={panelRef}>
      <button
        type="button"
        onClick={handleOpen}
        className={`${BTN_ICON} filter-btn${!isFlat && isEnabled ? ' filter-btn--active' : ''}`}
        title="Equalizer (E)"
      >
        <AudioLines size={18} />
      </button>

      {isOpen && (
        <div className="filter-panel" onClick={(e) => e.stopPropagation()}>
          <div className="filter-panel__header">
            <span className="filter-panel__title">Audio Equalizer</span>
            <div className="filter-panel__actions">
              <button
                type="button"
                onClick={onToggleEQ}
                className={`filter-panel__reset ${isEnabled ? 'text-green-400' : 'text-gray-400'}`}
                title={isEnabled ? 'Disable EQ' : 'Enable EQ'}
                style={{ color: isEnabled ? '#4ade80' : 'var(--text-3)' }}
              >
                <Power size={13} />
                {isEnabled ? 'On' : 'Off'}
              </button>
              {!isFlat && isEnabled && (
                <button
                  type="button"
                  onClick={onReset}
                  className="filter-panel__reset"
                  title="Reset to flat"
                >
                  <RotateCcw size={13} />
                  Reset
                </button>
              )}
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

          <div className={`filter-panel__presets ${!isEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
            {EQ_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => onApplyPreset(preset)}
                className={`filter-preset-btn${activePreset === preset.name ? ' filter-preset-btn--active' : ''}`}
              >
                {preset.name}
              </button>
            ))}
          </div>

          <div className="filter-panel__sliders" style={{ paddingTop: '10px' }}>
            {bands.map((band, i) => (
              <EqSlider
                key={band.freq}
                label={band.label}
                value={gains[i]}
                min={-12}
                max={12}
                step={1}
                onChange={(val) => onUpdateGain(i, val)}
                disabled={!isEnabled}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
