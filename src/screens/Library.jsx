import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileVideo, ArrowRight } from 'lucide-react';
import { useFolders } from '../hooks/useFolders';
import { getRecentFiles } from '../utils/storage';
import { formatFileSize } from '../utils/formatFileSize';
import { openRecentFile } from '../utils/recentFileOpen';
import {
  supportsFileSystemAccess,
  VIDEO_PICKER_OPTIONS,
  warmRecentHandleCache,
} from '../utils/fileHandles';
import Navbar from '../components/Navbar';
import FolderCard from '../components/FolderCard';
import NewFolderModal from '../components/NewFolderModal';
import { BTN_PRIMARY, BTN_SECONDARY } from '../utils/buttonClasses';

function FolderCardSkeleton() {
  return <div className="folder-card-skeleton" aria-hidden />;
}

function truncateName(name, max = 26) {
  if (name.length <= max) return name;
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';
  const base = name.slice(0, name.length - ext.length);
  const available = max - ext.length - 1;
  if (available <= 0) return name.slice(0, max - 1) + '…';
  return base.slice(0, available) + '…' + ext;
}

export default function Library({
  onPlayFile,
  onPlayUrl,
  installPrompt,
  onInstall,
  showToast,
}) {
  const navigate = useNavigate();
  const { folders, fileCounts, loading, createFolder, renameFolder, removeFolder } = useFolders();
  const [modalOpen, setModalOpen] = useState(false);
  const [recentFiles, setRecentFiles] = useState(() => getRecentFiles());

  const refreshRecent = useCallback(() => {
    setRecentFiles(getRecentFiles());
  }, []);

  useEffect(() => {
    warmRecentHandleCache();
  }, []);

  const openFilePicker = useCallback(async () => {
    if (!supportsFileSystemAccess()) return;
    try {
      const [handle] = await window.showOpenFilePicker(VIDEO_PICKER_OPTIONS);
      const file = await handle.getFile();
      onPlayFile?.(file, handle);
      refreshRecent();
    } catch (err) {
      if (err?.name === 'AbortError') return;
    }
  }, [onPlayFile, refreshRecent]);

  const handleRecentClick = useCallback(
    async (recent) => {
      await openRecentFile(recent, {
        onPlayFile: (file, handle) => {
          onPlayFile?.(file, handle);
          refreshRecent();
        },
        onPlayUrl: (url) => {
          onPlayUrl?.(url);
          refreshRecent();
        },
        onFallbackPicker: openFilePicker,
        showToast,
      });
    },
    [onPlayFile, onPlayUrl, openFilePicker, refreshRecent, showToast]
  );

  const handleCreate = async (name) => {
    const folder = await createFolder(name);
    setModalOpen(false);
    if (folder) navigate(`/library/${folder.id}`);
  };

  const handleOpenFolder = useCallback(
    (folderId) => {
      navigate(`/library/${folderId}`);
    },
    [navigate]
  );

  const hasFolders = !loading && folders.length > 0;

  return (
    <div className="library-screen page-with-navbar">
      <Navbar installPrompt={installPrompt} onInstall={onInstall} />

      <main className="library-body custom-scroll page-content">
        {loading ? (
          <div className="library-grid">
            <FolderCardSkeleton />
            <FolderCardSkeleton />
            <FolderCardSkeleton />
          </div>
        ) : !hasFolders ? (
          <div className="library-empty-simple">
            <p className="library-empty-title">No folders yet</p>
            <p className="library-empty-text">Create a folder to organize your lecture videos</p>
            <button type="button" className={BTN_PRIMARY} onClick={() => setModalOpen(true)}>
              New Folder
            </button>
          </div>
        ) : (
          <>
            <div className="library-toolbar">
              <p className="library-section-title">Library</p>
              <button type="button" className={BTN_SECONDARY} onClick={() => setModalOpen(true)}>
                New Folder
              </button>
            </div>
            <div className="library-grid">
              {folders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  fileCount={fileCounts[folder.id] ?? 0}
                  onOpen={handleOpenFolder}
                  onRename={renameFolder}
                  onDelete={removeFolder}
                />
              ))}
            </div>
          </>
        )}

        {recentFiles.length > 0 && (
          <div className="recent-section">
            <p className="recent-label">Recent</p>
            <div className="recent-list">
              {recentFiles.map((recent) => (
                <button
                  key={`${recent.name}-${recent.openedAt}`}
                  type="button"
                  onClick={() => handleRecentClick(recent)}
                  className="recent-item"
                  title={recent.url ? recent.url : recent.name}
                >
                  <FileVideo size={16} color="var(--text-3)" />
                  <span className="recent-item__name">{truncateName(recent.name)}</span>
                  {recent.size > 0 && (
                    <span className="recent-item__size">{formatFileSize(recent.size)}</span>
                  )}
                  <ArrowRight size={14} className="recent-item__arrow" />
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      <NewFolderModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreate} />
    </div>
  );
}
