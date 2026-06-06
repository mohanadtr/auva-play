import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft } from 'lucide-react';
import { getFolder } from '../utils/db';
import { openFileWithPermission } from '../utils/openFileWithPermission';
import { useFolderFiles } from '../hooks/useFolderFiles';
import {
  supportsFileSystemAccess,
  VIDEO_PICKER_OPTIONS_MULTIPLE,
} from '../utils/fileHandles';
import VideoCard from '../components/VideoCard';
import VideoCardSkeleton from '../components/VideoCardSkeleton';
import { BTN_PRIMARY } from '../utils/buttonClasses';

const ACCEPTED_EXT = ['.mp4', '.webm', '.mkv', '.mov'];

export default function FolderView({ folderId, onBack, onPlayFile, showToast }) {
  const [folderName, setFolderName] = useState('');
  const { files, loading, addFiles, removeFile, resolveHandle } = useFolderFiles(folderId);

  useEffect(() => {
    getFolder(folderId).then((f) => setFolderName(f?.name ?? 'Folder'));
  }, [folderId]);

  const handleAddFiles = useCallback(async () => {
    if (supportsFileSystemAccess()) {
      try {
        const handles = await window.showOpenFilePicker(VIDEO_PICKER_OPTIONS_MULTIPLE);
        const entries = [];
        for (const handle of handles) {
          const file = await handle.getFile();
          const ext = '.' + file.name.split('.').pop().toLowerCase();
          if (ACCEPTED_EXT.includes(ext) || file.type.startsWith('video/')) {
            entries.push({ file, handle });
          }
        }
        if (entries.length) await addFiles(entries);
      } catch (err) {
        if (err?.name === 'AbortError') return;
        if (err?.name === 'NotAllowedError') {
          showToast?.('Permission denied. Try opening the file again.');
        }
      }
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.mp4,.webm,.mkv,.mov,video/*';
    input.onchange = async (e) => {
      const list = Array.from(e.target.files ?? []);
      const entries = list.map((file) => ({ file, handle: null }));
      if (entries.length) await addFiles(entries.filter((entry) => entry.file));
    };
    input.click();
  }, [addFiles, showToast]);

  const handleOpen = useCallback(
    (fileRecord) => {
      const handle = resolveHandle(fileRecord);

      if (!handle) {
        showToast?.('File access not saved. Remove and re-add this file using "Add files".');
        return;
      }

      openFileWithPermission(handle)
        .then(({ file, denied }) => {
          if (denied) {
            showToast?.('Permission denied. Please try again.');
            return;
          }
          if (!file) {
            showToast?.('Could not open file. Try adding it again.');
            return;
          }
          onPlayFile(file, handle, { folderId, folderFileId: fileRecord.id, folderName });
        })
        .catch((err) => {
          if (err?.name === 'AbortError') return;
          showToast?.('Could not open file. Try adding it again.');
        });
    },
    [resolveHandle, onPlayFile, folderId, folderName, showToast]
  );

  return (
    <div className="folder-view-screen">
      <header className="folder-view-header">
        <button type="button" className="folder-view-back" onClick={onBack}>
          <ChevronLeft size={18} />
          Library
        </button>
        <h1 className="folder-view-title">{folderName}</h1>
        <button type="button" className={BTN_PRIMARY} onClick={handleAddFiles}>
          Add files
        </button>
      </header>

      <main className="folder-view-body custom-scroll">
        {loading ? (
          <div className="video-card-grid">
            <VideoCardSkeleton />
            <VideoCardSkeleton />
            <VideoCardSkeleton />
          </div>
        ) : files.length === 0 ? (
          <div className="folder-view-empty">
            <p className="folder-view-empty-title">No files yet</p>
            <p className="folder-view-empty-sub">Add files to start watching</p>
            <button type="button" className={BTN_PRIMARY} onClick={handleAddFiles}>
              Add files
            </button>
          </div>
        ) : (
          <div className="video-card-grid">
            {files.map((file) => (
              <VideoCard key={file.id} file={file} onOpen={handleOpen} onDelete={removeFile} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
