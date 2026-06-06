import { X } from 'lucide-react';
import { BTN_ICON } from '../utils/buttonClasses';

const SECTIONS = [
  {
    title: 'Playback',
    rows: [
      { keys: ['Space', 'K'], action: 'Play / pause' },
      { keys: ['Click'], action: 'Show / hide controls' },
      { keys: ['Double-click'], action: 'Toggle fullscreen' },
    ],
  },
  {
    title: 'Seeking',
    rows: [
      { keys: ['←'], action: 'Back 5 seconds' },
      { keys: ['→'], action: 'Forward 5 seconds' },
      { keys: ['Shift', '←'], action: 'Back 30 seconds' },
      { keys: ['Shift', '→'], action: 'Forward 30 seconds' },
      { keys: ['J'], action: 'Back 10 seconds' },
      { keys: ['L'], action: 'Forward 10 seconds' },
      { keys: ['Home'], action: 'Go to start' },
      { keys: ['End'], action: 'Go to end' },
      { keys: ['0–9'], action: 'Seek to 0%–90%' },
      { keys: [','], action: 'Back 1 frame (paused)' },
      { keys: ['.'], action: 'Forward 1 frame (paused)' },
    ],
  },
  {
    title: 'Speed',
    rows: [
      { keys: ['+'], action: 'Speed +0.25×' },
      { keys: ['-'], action: 'Speed −0.25×' },
      { keys: ['['], action: 'Speed −0.25×' },
      { keys: [']'], action: 'Speed +0.25×' },
      { keys: ['Shift', 'R'], action: 'Reset speed to 1×' },
    ],
  },
  {
    title: 'Volume',
    rows: [
      { keys: ['↑'], action: 'Volume +10%' },
      { keys: ['↓'], action: 'Volume −10%' },
      { keys: ['M'], action: 'Mute toggle' },
      { keys: ['Scroll'], action: 'Adjust volume on video' },
    ],
  },
  {
    title: 'Player',
    rows: [
      { keys: ['F'], action: 'Fullscreen' },
      { keys: ['T'], action: 'Mini player' },
      { keys: ['G'], action: 'Toggle ambient mode' },
      { keys: ['Escape'], action: 'Exit fullscreen / clear A-B' },
      { keys: ['A'], action: 'Set A point' },
      { keys: ['S'], action: 'Set B point' },
      { keys: ['Ctrl', 'S'], action: 'Screenshot' },
      { keys: ['Ctrl', 'L'], action: 'Toggle loop' },
      { keys: ['?'], action: 'This overlay' },
      { keys: ['N'], action: 'Next file (folder)' },
      { keys: ['P'], action: 'Previous file (folder)' },
    ],
  },
  {
    title: 'Subtitles',
    rows: [{ keys: ['C'], action: 'Toggle subtitles' }],
  },
  {
    title: 'Panels & Tools',
    rows: [
      { keys: ['B'], action: 'Add bookmark at current time' },
      { keys: ['V'], action: 'Toggle video filters panel' },
      { keys: ['E'], action: 'Toggle audio equalizer panel' },
    ],
  },
  {
    title: 'Zoom & Pan',
    rows: [
      { keys: ['Z'], action: 'Zoom in' },
      { keys: ['Shift', 'Z'], action: 'Zoom out' },
      { keys: ['Ctrl', '0'], action: 'Reset zoom' },
      { keys: ['Arrows'], action: 'Pan (when zoomed in)' },
      { keys: ['Drag'], action: 'Pan with mouse' },
    ],
  },
  {
    title: 'Touch Gestures',
    rows: [
      { keys: ['Double-tap ←'], action: 'Back 10 seconds' },
      { keys: ['Double-tap →'], action: 'Forward 10 seconds' },
      { keys: ['Swipe ↕ right'], action: 'Adjust volume' },
      { keys: ['Swipe ↕ left'], action: 'Adjust brightness' },
      { keys: ['Long press'], action: 'Temporary 2× speed' },
    ],
  },
];

function KeyBadge({ children }) {
  return <span className="shortcut-key">{children}</span>;
}

export default function ShortcutsOverlay({ onClose }) {
  return (
    <div className="shortcuts-overlay" onClick={onClose}>
      <div className="shortcuts-card" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-card__header">
          <h2>Keyboard shortcuts</h2>
          <button type="button" onClick={onClose} className={BTN_ICON} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div
          className="shortcuts-card__body custom-scroll"
          onWheel={(e) => e.stopPropagation()}
        >
          {SECTIONS.map((section) => (
            <div key={section.title} className="shortcuts-section">
              <h3 className="shortcuts-section__title">{section.title}</h3>
              {section.rows.map((row) => (
                <div key={row.action} className="shortcuts-row">
                  <div className="shortcuts-row__keys">
                    {row.keys.map((key, i) => (
                      <span key={`${key}-${i}`} className="shortcuts-row__key-group">
                        {i > 0 && row.keys.length > 1 && i === row.keys.length - 1 && (
                          <span className="shortcuts-or">or</span>
                        )}
                        <KeyBadge>{key}</KeyBadge>
                      </span>
                    ))}
                  </div>
                  <span className="shortcuts-row__dots" />
                  <span className="shortcuts-row__action">{row.action}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
