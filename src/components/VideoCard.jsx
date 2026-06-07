import { useRef, useState, useCallback } from 'react';
import { FileVideo, Play, Trash2 } from 'lucide-react';
import { formatTime } from '../utils/formatTime';
import ActionSheet from './ActionSheet';

const LONG_PRESS_MS = 600;

function useIsMobile() {
  const [isMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false
  );
  return isMobile;
}

export default function VideoCard({ file, onOpen, onDelete }) {
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);
  const longPressTimer = useRef(null);
  const didLongPress = useRef(false);

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

  const handleClick = useCallback(() => {
    if (didLongPress.current) {
      didLongPress.current = false;
      return;
    }
    onOpen(file);
  }, [file, onOpen]);

  return (
    <>
      <article
        className="video-card"
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen(file);
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="video-card__thumb">
          {file.thumbnail ? (
            <img src={file.thumbnail} alt="" className="video-card__thumb-img" />
          ) : (
            <div className="video-card__thumb-placeholder">
              <FileVideo size={28} color="#3a3a3a" />
            </div>
          )}
          {file.duration != null && file.duration > 0 && (
            <span className="video-card__duration">{formatTime(file.duration)}</span>
          )}
          <div className="video-card__play-overlay" aria-hidden>
            <span className="video-card__play-btn">
              <Play size={18} color="#fff" fill="#fff" />
            </span>
          </div>
        </div>
        <div className="video-card__info">
          <span className="video-card__name" title={file.name}>
            {file.name}
          </span>
          {!isMobile && (
            <button
              type="button"
              className="video-card__delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(file.id);
              }}
              aria-label={`Remove ${file.name}`}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </article>

      <ActionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={file.name}
        actions={[
          { label: 'Play', variant: 'primary', onClick: () => onOpen(file) },
          { label: 'Remove from folder', variant: 'danger', onClick: () => onDelete(file.id) },
        ]}
      />
    </>
  );
}
