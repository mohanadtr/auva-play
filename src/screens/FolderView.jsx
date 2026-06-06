import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ChevronLeft } from 'lucide-react';
import { getFolder } from '../utils/db';
import { useFolderFiles } from '../hooks/useFolderFiles';
import {
  supportsFileSystemAccess,
  VIDEO_PICKER_OPTIONS_MULTIPLE,
} from '../utils/fileHandles';
import FileRow from '../components/FileRow';
import FileRowSkeleton from '../components/FileRowSkeleton';
import { BTN_PRIMARY } from '../utils/buttonClasses';

const ACCEPTED_EXT = ['.mp4', '.webm', '.mkv', '.mov'];

export default function FolderView({ folderId, onBack, onPlayFile, showToast }) {
  const [folderName, setFolderName] = useState('');
  const [activeId, setActiveId] = useState(null);
  const { files, loading, addFiles, removeFile, reorder, openFile } = useFolderFiles(folderId);

  useEffect(() => {
    getFolder(folderId).then((f) => setFolderName(f?.name ?? 'Folder'));
  }, [folderId]);

  const isTouch = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
    []
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: isTouch ? { delay: 500, tolerance: 8 } : { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 500, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      setActiveId(null);
      if (!over || active.id === over.id) return;
      const oldIndex = files.findIndex((f) => f.id === active.id);
      const newIndex = files.findIndex((f) => f.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = [...files];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);
      reorder(reordered.map((f) => f.id));
    },
    [files, reorder]
  );

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

  const handlePlay = useCallback(
    async (record) => {
      const { file, denied } = await openFile(record);
      if (denied) {
        showToast?.('Access to this file was denied.');
        return;
      }
      if (file) {
        onPlayFile(file, record.handle, { folderId, folderFileId: record.id, folderName });
      }
    },
    [openFile, onPlayFile, folderId, folderName, showToast]
  );

  const activeFile = files.find((f) => f.id === activeId);

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

      <main className="folder-view-body">
        {loading ? (
          <div className="file-list">
            <FileRowSkeleton />
            <FileRowSkeleton />
            <FileRowSkeleton />
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={(e) => setActiveId(e.active.id)}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveId(null)}
          >
            <SortableContext items={files.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              <div className="file-list">
                {files.map((file) => (
                  <FileRow
                    key={file.id}
                    file={file}
                    onPlay={handlePlay}
                    onDelete={removeFile}
                    isTouch={isTouch}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeFile ? (
                <FileRow file={activeFile} onPlay={() => {}} onDelete={() => {}} isOverlay isTouch={isTouch} />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </main>
    </div>
  );
}
