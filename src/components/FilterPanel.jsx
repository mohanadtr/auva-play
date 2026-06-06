import { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, RotateCcw, X } from 'lucide-react';
import { FILTER_PRESETS } from '../hooks/useVideoFilters';
import { BTN_ICON } from '../utils/buttonClasses';

function FilterSlider({ label, value, min, max, step, unit, onChange }) {
  const isDefault =
    (label === 'Hue' && value === 0) || (label !== 'Hue' && value === 100);

  return (
    <div className="filter-slider">
      <div className="filter-slider__header">
        <span className="filter-slider__label">{label}</span>
        <span className="filter-slider__value">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`filter-slider__input${!isDefault ? ' filter-slider__input--active' : ''}`}
      />
    </div>
  );
}

export default function FilterPanel({
  filters,
  activePreset,
  isDefault,
  onUpdateFilter,
  onApplyPreset,
  onReset,
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

  return (
    <div className="filter-control" ref={panelRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`${BTN_ICON} filter-btn${!isDefault ? ' filter-btn--active' : ''}`}
        title="Video Filters (V)"
      >
        <SlidersHorizontal size={18} />
      </button>

      {isOpen && (
        <div className="filter-panel" onClick={(e) => e.stopPropagation()}>
          <div className="filter-panel__header">
            <span className="filter-panel__title">Video Filters</span>
            <div className="filter-panel__actions">
              {!isDefault && (
                <button
                  type="button"
                  onClick={onReset}
                  className="filter-panel__reset"
                  title="Reset to default"
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

          <div className="filter-panel__presets">
            {FILTER_PRESETS.map((preset) => (
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

          <div className="filter-panel__sliders">
            <FilterSlider
              label="Brightness"
              value={filters.brightness}
              min={50}
              max={200}
              step={5}
              unit="%"
              onChange={(v) => onUpdateFilter('brightness', v)}
            />
            <FilterSlider
              label="Contrast"
              value={filters.contrast}
              min={50}
              max={200}
              step={5}
              unit="%"
              onChange={(v) => onUpdateFilter('contrast', v)}
            />
            <FilterSlider
              label="Saturation"
              value={filters.saturation}
              min={0}
              max={200}
              step={5}
              unit="%"
              onChange={(v) => onUpdateFilter('saturation', v)}
            />
            <FilterSlider
              label="Hue"
              value={filters.hue}
              min={-180}
              max={180}
              step={5}
              unit="°"
              onChange={(v) => onUpdateFilter('hue', v)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
