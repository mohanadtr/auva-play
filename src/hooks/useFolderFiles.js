import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getFolderFiles,
  addFolderFile,
  deleteFolderFile,
  reorderFolderFiles,
  updateFolderFile,
} from '../utils/db';
import { generateThumbnail } from '../utils/thumbnail';
import {
  cacheFolderHandle,
  getCachedFolderHandle,
  removeCachedFolderHandle,
  warmFolderHandleCache,
} from '../utils/handleCache';

function mergeFileHandles(files) {
  return files.map((f) => ({
    ...f,
    handle: f.handle ?? getCachedFolderHandle(f.id),
  }));
}

export function useFolderFiles(folderId) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const folderIdRef = useRef(folderId);

  const refresh = useCallback(async () => {
    if (!folderId) {
      setFiles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await getFolderFiles(folderId);
      warmFolderHandleCache(list);
      setFiles(mergeFileHandles(list));
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    folderIdRef.current = folderId;
    refresh();
  }, [refresh, folderId]);

  const generateAndSaveThumbnail = useCallback(async (record, file, handle) => {
    try {
      const { thumbnail, duration } = await generateThumbnail(file);
      const updates = {};
      if (thumbnail) updates.thumbnail = thumbnail;
      if (duration != null && !Number.isNaN(duration)) updates.duration = duration;
      if (!Object.keys(updates).length) return;

      const handleToKeep = handle ?? getCachedFolderHandle(record.id) ?? record.handle;
      if (handleToKeep) updates.handle = handleToKeep;

      await updateFolderFile(record.id, updates);
      if (handleToKeep) cacheFolderHandle(record.id, handleToKeep);

      setFiles((prev) =>
        prev.map((f) =>
          f.id === record.id ? { ...f, ...updates, handle: handleToKeep ?? f.handle } : f
        )
      );
    } catch {
      /* non-blocking */
    }
  }, []);

  const addFiles = useCallback(
    async (entries) => {
      const added = [];
      for (const { file, handle } of entries) {
        try {
          const record = await addFolderFile(folderId, file, handle);
          if (record) {
            if (handle) {
              cacheFolderHandle(record.id, handle);
              record.handle = handle;
            }
            added.push({ record, file, handle });
          }
        } catch {
          /* skip failed entry */
        }
      }
      await refresh();

      for (const { record, file, handle } of added) {
        generateAndSaveThumbnail(record, file, handle);
      }
    },
    [folderId, refresh, generateAndSaveThumbnail]
  );

  const removeFile = useCallback(
    async (id) => {
      try {
        removeCachedFolderHandle(id);
        await deleteFolderFile(id);
        const remaining = await getFolderFiles(folderId);
        await reorderFolderFiles(
          folderId,
          remaining.filter((f) => f.id !== id).map((f) => f.id)
        );
        await refresh();
      } catch {
        /* ignore */
      }
    },
    [folderId, refresh]
  );

  const reorder = useCallback(
    async (orderedIds) => {
      try {
        await reorderFolderFiles(folderId, orderedIds);
        await refresh();
      } catch {
        /* ignore */
      }
    },
    [folderId, refresh]
  );

  const resolveHandle = useCallback((fileRecord) => {
    return fileRecord.handle ?? getCachedFolderHandle(fileRecord.id);
  }, []);

  return { files, loading, refresh, addFiles, removeFile, reorder, resolveHandle };
}
