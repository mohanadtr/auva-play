import { useState, useCallback, useEffect } from 'react';
import { Download } from 'lucide-react';
import { addRecentFile, clearBookmarkStorage } from './utils/storage';
import { saveFileHandle } from './utils/fileHandles';
import { getFolderFiles, getFolderFile, openFolderFile } from './utils/db';
import { useToast } from './hooks/useToast';
import { useLaunchQueue } from './hooks/useLaunchQueue';
import { BTN_SECONDARY } from './utils/buttonClasses';
import Home from './screens/Home';
import Library from './screens/Library';
import FolderView from './screens/FolderView';
import Player from './components/Player';
import Toast from './components/Toast';

export default function App() {
  const [screen, setScreen] = useState('home');
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [videoSource, setVideoSource] = useState(null);
  const [fromFolder, setFromFolder] = useState(false);
  const [folderName, setFolderName] = useState(null);
  const [folderFileId, setFolderFileId] = useState(null);
  const [folderFiles, setFolderFiles] = useState([]);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [urlLoadError, setUrlLoadError] = useState('');
  const { toast, showToast } = useToast();

  useEffect(() => {
    clearBookmarkStorage();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!installPrompt) {
      showToast('Install is not supported on this browser. Try Chrome or Edge for the full experience.');
      return;
    }
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    localStorage.setItem('auva-install-dismissed', 'true');
  }, [installPrompt, showToast]);

  const playFile = useCallback(async (file, handle, folderMeta = null) => {
    setUrlLoadError('');
    setVideoSource({ type: 'file', file, filename: file.name });
    addRecentFile({ name: file.name, size: file.size });
    if (handle) {
      await saveFileHandle({ handle, name: file.name, size: file.size, lastOpened: Date.now() });
    }
    if (folderMeta) {
      const files = await getFolderFiles(folderMeta.folderId);
      setFromFolder(true);
      setActiveFolderId(folderMeta.folderId);
      setFolderName(folderMeta.folderName);
      setFolderFileId(folderMeta.folderFileId);
      setFolderFiles(files);
    } else {
      setFromFolder(false);
      setActiveFolderId(null);
      setFolderName(null);
      setFolderFileId(null);
      setFolderFiles([]);
    }
    setScreen('player');
  }, []);

  const handleLaunchedFile = useCallback(async (file, fileHandle) => {
    if (!file || !fileHandle) return;

    try {
      await saveFileHandle({
        handle: fileHandle,
        name: file.name,
        size: file.size,
        lastOpened: Date.now(),
      });
    } catch (err) {
      console.warn('Could not save to recent files:', err);
    }

    setUrlLoadError('');
    setVideoSource({ type: 'file', file, filename: file.name });
    addRecentFile({ name: file.name, size: file.size });
    setFromFolder(false);
    setActiveFolderId(null);
    setFolderName(null);
    setFolderFileId(null);
    setFolderFiles([]);
    setScreen('player');
  }, []);

  useLaunchQueue(handleLaunchedFile);

  const playUrl = useCallback((url) => {
    const pathname = url.split('?')[0];
    const filename = pathname.split('/').pop() || 'video';
    setUrlLoadError('');
    setVideoSource({ type: 'url', url, filename });
    addRecentFile({ name: filename, size: 0, url });
    setFromFolder(false);
    setActiveFolderId(null);
    setFolderName(null);
    setFolderFileId(null);
    setFolderFiles([]);
    setScreen('player');
  }, []);

  const handleVideoLoadError = useCallback(
    (sourceType) => {
      if (sourceType === 'url') {
        setUrlLoadError('Could not load video from this URL.');
        setScreen('home');
        setVideoSource(null);
        return;
      }
      showToast('Could not load video. File may be unsupported or corrupted.');
    },
    [showToast]
  );

  const goHome = useCallback(() => {
    setScreen('home');
    setVideoSource(null);
    setActiveFolderId(null);
    setFromFolder(false);
    setFolderName(null);
    setFolderFileId(null);
    setFolderFiles([]);
  }, []);

  const goToLibrary = useCallback(() => {
    setScreen('library');
    setVideoSource(null);
  }, []);

  const goToFolder = useCallback((folderId) => {
    setScreen('folder');
    setActiveFolderId(folderId);
    setVideoSource(null);
  }, []);

  const handlePlayerBack = useCallback(() => {
    if (fromFolder && activeFolderId) {
      setScreen('folder');
      setVideoSource(null);
    } else {
      goHome();
    }
  }, [fromFolder, activeFolderId, goHome]);

  const playAdjacentFile = useCallback(
    async (direction) => {
      if (!folderFiles.length || !folderFileId) return;
      const idx = folderFiles.findIndex((f) => f.id === folderFileId);
      const nextIdx = idx + direction;
      if (nextIdx < 0 || nextIdx >= folderFiles.length) return;
      const record = await getFolderFile(folderFiles[nextIdx].id);
      if (!record) return;
      const { file, denied } = await openFolderFile(record);
      if (denied) {
        showToast('Access to this file was denied.');
        return;
      }
      if (!file) return;
      setFolderFileId(record.id);
      setVideoSource({ type: 'file', file, filename: file.name });
      addRecentFile({ name: file.name, size: file.size });
      if (record.handle) {
        await saveFileHandle({ handle: record.handle, name: file.name, size: file.size, lastOpened: Date.now() });
      }
    },
    [folderFiles, folderFileId, showToast]
  );

  const folderPlayback =
    fromFolder && folderFiles.length > 0
      ? {
          folderName,
          currentFileName: folderFiles.find((f) => f.id === folderFileId)?.name ?? '',
          onPrev: () => playAdjacentFile(-1),
          onNext: () => playAdjacentFile(1),
          hasPrev: folderFiles.findIndex((f) => f.id === folderFileId) > 0,
          hasNext: folderFiles.findIndex((f) => f.id === folderFileId) < folderFiles.length - 1,
        }
      : null;

  return (
    <div className="app-shell">
      {installPrompt && screen === 'home' && (
        <button type="button" onClick={handleInstall} className={`${BTN_SECONDARY} install-btn`}>
          <Download size={14} />
          Install App
        </button>
      )}

      {screen === 'home' && (
        <Home
          onPlayFile={(file, handle) => playFile(file, handle)}
          onPlayUrl={playUrl}
          onOpenLibrary={goToLibrary}
          urlLoadError={urlLoadError}
          onClearUrlError={() => setUrlLoadError('')}
          showToast={showToast}
        />
      )}

      {screen === 'library' && (
        <Library
          onBack={goHome}
          onOpenFolder={goToFolder}
          onFolderCreated={goToFolder}
          onPlayFile={(file, handle) => playFile(file, handle)}
          onPlayUrl={playUrl}
          installPrompt={installPrompt}
          onInstall={handleInstall}
          showToast={showToast}
        />
      )}

      {screen === 'folder' && activeFolderId && (
        <FolderView
          folderId={activeFolderId}
          onBack={goToLibrary}
          onPlayFile={playFile}
          showToast={showToast}
        />
      )}

      {screen === 'player' && videoSource && (
        <Player
          source={videoSource}
          onBack={handlePlayerBack}
          backLabel={fromFolder ? folderName : 'Home'}
          folderPlayback={folderPlayback}
          keyboardEnabled
          onVideoLoadError={handleVideoLoadError}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
