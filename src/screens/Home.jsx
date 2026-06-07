import { Link } from 'react-router-dom';
import { FolderOpen } from 'lucide-react';
import Navbar from '../components/Navbar';
import QuickPlayDropZone from '../components/QuickPlayDropZone';
import { BTN_SECONDARY } from '../utils/buttonClasses';

export default function Home({
  onPlayFile,
  onPlayUrl,
  installPrompt,
  onInstall,
  urlLoadError,
  onClearUrlError,
  showToast,
}) {
  return (
    <div className="home-screen page-with-navbar">
      <Navbar installPrompt={installPrompt} onInstall={onInstall}>
        <Link to="/library" className={`${BTN_SECONDARY} navbar__action`}>
          <FolderOpen size={14} />
          Library
        </Link>
      </Navbar>

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
