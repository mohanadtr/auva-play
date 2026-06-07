export default function ActionSheet({ open, onClose, title, actions }) {
  if (!open) return null;

  return (
    <div className="action-sheet-backdrop" onClick={onClose} role="presentation">
      <div
        className="action-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {title && <p className="action-sheet__title">{title}</p>}
        <div className="action-sheet__actions">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={`action-sheet__btn${action.variant === 'danger' ? ' action-sheet__btn--danger' : ''}${action.variant === 'primary' ? ' action-sheet__btn--primary' : ''}`}
              onClick={() => {
                action.onClick();
                onClose();
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
        <button type="button" className="action-sheet__cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
