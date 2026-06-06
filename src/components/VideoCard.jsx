import { FileVideo, Play, Trash2 } from 'lucide-react';
import { formatTime } from '../utils/formatTime';

export default function VideoCard({ file, onOpen, onDelete }) {
  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(file.id);
  };

  return (
    <article
      className="video-card"
      onClick={() => onOpen(file)}
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
        <button
          type="button"
          className="video-card__delete"
          onClick={handleDelete}
          aria-label={`Remove ${file.name}`}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </article>
  );
}
