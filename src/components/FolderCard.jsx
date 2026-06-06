import { useState, useRef, useEffect } from 'react';
import { Folder, MoreHorizontal } from 'lucide-react';

export default function FolderCard({ folder, fileCount, onOpen, onRename, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

  const handleRename = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    const next = window.prompt('Rename folder', folder.name);
    if (next?.trim() && next.trim() !== folder.name) {
      onRename(folder.id, next.trim());
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (window.confirm(`Delete "${folder.name}" and all its files?`)) {
      onDelete(folder.id);
    }
  };

  return (
    <div
      className="folder-card"
      onClick={() => onOpen(folder.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(folder.id);
        }
      }}
    >
      <div className="folder-card__top">
        <Folder size={20} color="#52525b" />
        <div className="folder-card__menu-wrap" ref={menuRef}>
          <button
            type="button"
            className="folder-card__menu-btn"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            aria-label="Folder options"
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div className="speed-dropdown folder-card__menu">
              <button type="button" className="speed-dropdown__item" onClick={handleRename}>
                Rename
              </button>
              <button
                type="button"
                className="speed-dropdown__item"
                onClick={handleDelete}
                style={{ color: '#f87171' }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="folder-card__name">{folder.name}</p>
      <p className="folder-card__count">
        {fileCount} file{fileCount !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
