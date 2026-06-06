import { useState, useRef, useEffect, useCallback } from 'react';
import { Bookmark, X, Trash2, Download, Edit3, Check } from 'lucide-react';
import { formatTime } from '../utils/formatTime';
import { BTN_ICON } from '../utils/buttonClasses';

export default function BookmarkPanel({
  bookmarks,
  onAdd,
  onRemove,
  onUpdateNote,
  onSeek,
  onExportMarkdown,
  onExportText,
  getCurrentTime,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editNote, setEditNote] = useState('');
  const [newNote, setNewNote] = useState('');
  const [showExport, setShowExport] = useState(false);
  const panelRef = useRef(null);
  const noteInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
        setShowExport(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setShowExport(false);
      }
    };
    document.addEventListener('mousedown', handleClick, true);
    document.addEventListener('keydown', handleKey, true);
    return () => {
      document.removeEventListener('mousedown', handleClick, true);
      document.removeEventListener('keydown', handleKey, true);
    };
  }, [isOpen]);

  const handleAddBookmark = useCallback(async () => {
    const time = getCurrentTime();
    if (time === undefined || time === null) return;
    await onAdd(time, newNote.trim());
    setNewNote('');
  }, [getCurrentTime, onAdd, newNote]);

  const handleStartEdit = useCallback((bookmark) => {
    setEditingId(bookmark.id);
    setEditNote(bookmark.note || '');
    setTimeout(() => noteInputRef.current?.focus(), 50);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (editingId) {
      await onUpdateNote(editingId, editNote.trim());
      setEditingId(null);
      setEditNote('');
    }
  }, [editingId, editNote, onUpdateNote]);

  const handleExport = useCallback((format) => {
    const text = format === 'markdown' ? onExportMarkdown() : onExportText();
    if (!text) return;

    // Copy to clipboard
    navigator.clipboard.writeText(text).catch(() => {});

    // Also download as file
    const ext = format === 'markdown' ? 'md' : 'txt';
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookmarks.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  }, [onExportMarkdown, onExportText]);

  return (
    <div className="bookmark-control" ref={panelRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`${BTN_ICON} bookmark-btn${bookmarks.length > 0 ? ' bookmark-btn--has-bookmarks' : ''}`}
        title="Bookmarks (B)"
      >
        <Bookmark size={18} />
        {bookmarks.length > 0 && (
          <span className="bookmark-btn__count">{bookmarks.length}</span>
        )}
      </button>

      {isOpen && (
        <div className="bookmark-panel" onClick={(e) => e.stopPropagation()}>
          <div className="bookmark-panel__header">
            <span className="bookmark-panel__title">Bookmarks</span>
            <div className="bookmark-panel__actions">
              {bookmarks.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowExport((v) => !v)}
                  className="bookmark-panel__export-btn"
                  title="Export bookmarks"
                >
                  <Download size={13} />
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

          {showExport && (
            <div className="bookmark-export-menu">
              <button onClick={() => handleExport('markdown')} className="bookmark-export-item">
                Export as Markdown
              </button>
              <button onClick={() => handleExport('text')} className="bookmark-export-item">
                Export as Text
              </button>
            </div>
          )}

          <div className="bookmark-panel__add">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddBookmark();
                }
                e.stopPropagation();
              }}
              placeholder="Add note (optional)..."
              className="bookmark-note-input"
            />
            <button
              type="button"
              onClick={handleAddBookmark}
              className="bookmark-add-btn"
            >
              + Add
            </button>
          </div>

          <div className="bookmark-panel__list custom-scroll">
            {bookmarks.length === 0 ? (
              <p className="bookmark-empty">
                No bookmarks yet. Press <span className="shortcut-key">B</span> or click "Add" to bookmark the current time.
              </p>
            ) : (
              bookmarks.map((bookmark) => (
                <div key={bookmark.id} className="bookmark-item">
                  <button
                    type="button"
                    className="bookmark-item__time"
                    onClick={() => onSeek(bookmark.time)}
                    title={`Go to ${formatTime(bookmark.time)}`}
                  >
                    {formatTime(bookmark.time)}
                  </button>

                  {editingId === bookmark.id ? (
                    <div className="bookmark-item__edit">
                      <input
                        ref={noteInputRef}
                        type="text"
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveEdit();
                          }
                          if (e.key === 'Escape') {
                            setEditingId(null);
                          }
                          e.stopPropagation();
                        }}
                        className="bookmark-edit-input"
                      />
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        className="bookmark-item__save"
                        title="Save"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    <span
                      className="bookmark-item__note"
                      onClick={() => handleStartEdit(bookmark)}
                      title={bookmark.note || 'Click to add note'}
                    >
                      {bookmark.note || '—'}
                    </span>
                  )}

                  <div className="bookmark-item__actions">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(bookmark)}
                      className="bookmark-item__action"
                      title="Edit note"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(bookmark.id)}
                      className="bookmark-item__action bookmark-item__action--delete"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
