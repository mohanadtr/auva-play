import { FolderOpen } from 'lucide-react';
import QuickPlayDropZone from '../components/QuickPlayDropZone';
import { BTN_SECONDARY } from '../utils/buttonClasses';

export default function Home({ onPlayFile, onPlayUrl, onOpenLibrary, urlLoadError, onClearUrlError, showToast }) {
  return (
    <div className="home-screen">
      <header className="home-header">
        <span className="home-brand">Auva Play</span>
        <button type="button" className={`${BTN_SECONDARY} header-action-btn`} onClick={onOpenLibrary}>
          <FolderOpen size={14} />
          Library
        </button>
      </header>

      <main className="home-body custom-scroll">
        <QuickPlayDropZone
          onFileSelect={onPlayFile}
          onUrlSelect={onPlayUrl}
          urlLoadError={urlLoadError}
          onClearUrlError={onClearUrlError}
          showToast={showToast}
        />
      </main>
    </div>
  );
}
