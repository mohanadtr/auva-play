import { useState, useEffect, useRef } from 'react';
import { BTN_PRIMARY, BTN_SECONDARY } from '../utils/buttonClasses';

export default function NewFolderModal({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="card"
        style={{ maxWidth: 360, width: '100%', margin: '0 24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>New Folder</h2>
        <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Folder name"
            className="input-field"
            maxLength={80}
          />
          <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
            <button type="submit" className={`${BTN_PRIMARY} flex-1`} disabled={!name.trim()}>
              Create
            </button>
            <button type="button" onClick={onClose} className={`${BTN_SECONDARY} flex-1`}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
