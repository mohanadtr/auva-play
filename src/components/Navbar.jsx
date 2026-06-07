import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, Download } from 'lucide-react';
import { BTN_SECONDARY } from '../utils/buttonClasses';

export default function Navbar({ installPrompt, onInstall, children }) {
  const { pathname } = useLocation();
  const onLibrary = pathname.startsWith('/library');
  const backTo = pathname !== '/library' && onLibrary ? '/library' : '/';

  return (
    <nav className="navbar">
      <div className="navbar__left">
        {onLibrary && (
          <Link to={backTo} className="navbar__back" aria-label="Back">
            <ChevronLeft size={20} />
          </Link>
        )}
        <Link to="/" className="navbar__brand">
          <span className="navbar__brand-muted">Auva</span>
          <span className="navbar__brand-bold">Play</span>
        </Link>
      </div>

      <div className="navbar__actions">
        {installPrompt && (
          <button type="button" onClick={onInstall} className={`${BTN_SECONDARY} navbar__action`}>
            <Download size={14} />
            Install App
          </button>
        )}
        {children}
      </div>
    </nav>
  );
}
