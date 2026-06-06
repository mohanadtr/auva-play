import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { BTN_PRIMARY, BTN_ICON } from '../utils/buttonClasses';

function isPwaInstalled() {
  return (
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  );
}

export default function InstallBanner({ installPrompt, onInstall, onDismiss }) {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('auva-install-dismissed') === 'true'
  );

  if (isPwaInstalled() || dismissed || !installPrompt) return null;

  const handleDismiss = () => {
    localStorage.setItem('auva-install-dismissed', 'true');
    setDismissed(true);
    onDismiss?.();
  };

  const handleInstall = () => {
    onInstall();
  };

  return (
    <>
      <div className="install-banner">
        <Download size={16} className="install-banner__icon" aria-hidden />
        <p className="install-banner__text">
          Install Auva Play to open videos directly from your file explorer
        </p>
        <div className="install-banner__actions">
          <button type="button" className={`${BTN_PRIMARY} install-banner__install`} onClick={handleInstall}>
            Install
          </button>
          <button type="button" className={`${BTN_ICON} install-banner__dismiss`} onClick={handleDismiss} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="install-banner-spacer" aria-hidden />
    </>
  );
}
