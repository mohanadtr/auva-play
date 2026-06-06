import { useState, useEffect, useCallback } from 'react';
import {
  getFolderFiles,
  addFolderFile,
  deleteFolderFile,
  reorderFolderFiles,
  updateFolderFile,
} from '../utils/db';
import { generateThumbnail } from '../utils/thumbnail';

export function useFolderFiles(folderId) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!folderId) {
      setFiles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await getFolderFiles(folderId);
      setFiles(list);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const generateAndSaveThumbnail = useCallback(async (record, file) => {
    try {
      const { thumbnail, duration } = await generateThumbnail(file);
      const updates = {};
      if (thumbnail) updates.thumbnail = thumbnail;
      if (duration != null && !Number.isNaN(duration)) updates.duration = duration;
      if (!Object.keys(updates).length) return;

      await updateFolderFile(record.id, updates);
      setFiles((prev) => prev.map((f) => (f.id === record.id ? { ...f, ...updates } : f)));
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
          if (record) added.push({ record, file });
        } catch {
          /* skip failed entry */
        }
      }
      await refresh();

      for (const { record, file } of added) {
        generateAndSaveThumbnail(record, file);
      }
    },
    [folderId, refresh, generateAndSaveThumbnail]
  );

  const removeFile = useCallback(
    async (id) => {
      try {
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

  return { files, loading, refresh, addFiles, removeFile, reorder };
}
