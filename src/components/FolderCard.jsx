import { useState, useRef, useEffect, useCallback } from 'react';
import { Folder, MoreHorizontal } from 'lucide-react';
import ActionSheet from './ActionSheet';

const LONG_PRESS_MS = 600;

function useIsMobile() {
  const [isMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false
  );
  return isMobile;
}

export default function FolderCard({ folder, fileCount, onOpen, onRename, onDelete }) {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const menuRef = useRef(null);
  const longPressTimer = useRef(null);
  const didLongPress = useRef(false);

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

  const clearLongPress = useCallback(() => {
    clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  }, []);

  const handleTouchStart = useCallback(() => {
    if (!isMobile) return;
    didLongPress.current = false;
    clearLongPress();
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setSheetOpen(true);
    }, LONG_PRESS_MS);
  }, [isMobile, clearLongPress]);

  const handleTouchEnd = useCallback(() => {
    clearLongPress();
  }, [clearLongPress]);

  const handleRename = (e) => {
    e?.stopPropagation?.();
    setMenuOpen(false);
    setSheetOpen(false);
    const next = window.prompt('Rename folder', folder.name);
    if (next?.trim() && next.trim() !== folder.name) {
      onRename(folder.id, next.trim());
    }
  };

  const handleDelete = (e) => {
    e?.stopPropagation?.();
    setMenuOpen(false);
    setSheetOpen(false);
    if (window.confirm(`Delete "${folder.name}" and all its files?`)) {
      onDelete(folder.id);
    }
  };

  const handleClick = useCallback(() => {
    if (didLongPress.current) {
      didLongPress.current = false;
      return;
    }
    onOpen(folder.id);
  }, [folder.id, onOpen]);

  return (
    <>
      <div
        className="folder-card"
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
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
          {!isMobile && (
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
          )}
        </div>
        <p className="folder-card__name">{folder.name}</p>
        <p className="folder-card__count">
          {fileCount} file{fileCount !== 1 ? 's' : ''}
        </p>
      </div>

      {isMobile && (
        <ActionSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title={folder.name}
          actions={[
            { label: 'Open', variant: 'primary', onClick: () => onOpen(folder.id) },
            { label: 'Rename', onClick: () => handleRename() },
            { label: 'Delete', variant: 'danger', onClick: () => handleDelete() },
          ]}
        />
      )}
    </>
  );
}
