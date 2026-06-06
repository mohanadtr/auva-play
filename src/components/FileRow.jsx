import { GripVertical, FileVideo, Play, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatFileSize } from '../utils/formatFileSize';
import { BTN_ICON } from '../utils/buttonClasses';

export default function FileRow({ file, onPlay, onDelete, isOverlay, isTouch = false }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: file.id,
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !isOverlay ? 0.4 : 1,
  };

  const dragProps = isOverlay ? {} : { ...attributes, ...listeners };

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      className={`file-row${isOverlay ? ' file-row--overlay' : ''}${isTouch ? ' file-row--touch' : ''}`}
      {...(isTouch && !isOverlay ? dragProps : {})}
    >
      {!isTouch && (
        <button
          type="button"
          className="file-row__grip"
          {...dragProps}
          aria-label="Drag to reorder"
        >
          <GripVertical size={16} color="#3a3a3a" />
        </button>
      )}
      <FileVideo size={16} color="#52525b" className="file-row__icon" />
      <span className="file-row__name" title={file.name}>
        {file.name}
      </span>
      <span className="file-row__size">{formatFileSize(file.size)}</span>
      <button
        type="button"
        className={`${BTN_ICON} file-row__action`}
        onClick={() => onPlay(file)}
        title="Play"
      >
        <Play size={16} fill="currentColor" />
      </button>
      <button
        type="button"
        className={`${BTN_ICON} file-row__action file-row__action--delete`}
        onClick={() => onDelete(file.id)}
        title="Remove"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
