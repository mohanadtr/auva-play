import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useFolders } from '../hooks/useFolders';
import FolderCard from '../components/FolderCard';
import NewFolderModal from '../components/NewFolderModal';
import { BTN_PRIMARY, BTN_SECONDARY } from '../utils/buttonClasses';

function FolderCardSkeleton() {
  return <div className="folder-card-skeleton" aria-hidden />;
}

export default function Library({ onBack, onOpenFolder, onFolderCreated }) {
  const { folders, fileCounts, loading, createFolder, renameFolder, removeFolder } = useFolders();
  const [modalOpen, setModalOpen] = useState(false);

  const handleCreate = async (name) => {
    const folder = await createFolder(name);
    setModalOpen(false);
    if (folder) onFolderCreated(folder.id);
  };

  return (
    <div className="library-screen">
      <header className="library-header">
        <button type="button" className="folder-view-back" onClick={onBack}>
          <ChevronLeft size={18} />
          Home
        </button>
        <h1 className="library-brand">Library</h1>
        <button type="button" className={BTN_SECONDARY} onClick={() => setModalOpen(true)}>
          New Folder
        </button>
      </header>

      <main className="library-body custom-scroll">
        {loading ? (
          <div className="library-grid">
            <FolderCardSkeleton />
            <FolderCardSkeleton />
            <FolderCardSkeleton />
          </div>
        ) : folders.length === 0 ? (
          <div className="library-empty-simple">
            <p className="library-empty-title">No folders yet</p>
            <p className="library-empty-text">Create a folder to organize your lecture videos</p>
            <button type="button" className={BTN_PRIMARY} onClick={() => setModalOpen(true)}>
              New Folder
            </button>
          </div>
        ) : (
          <>
            <p className="library-section-title">Folders</p>
            <div className="library-grid">
              {folders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  fileCount={fileCounts[folder.id] ?? 0}
                  onOpen={onOpenFolder}
                  onRename={renameFolder}
                  onDelete={removeFolder}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <NewFolderModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreate} />
    </div>
  );
}
