import { useState, useEffect, useCallback } from 'react';
import {
  getFolderFiles,
  addFolderFile,
  deleteFolderFile,
  reorderFolderFiles,
  openFolderFile,
} from '../utils/db';

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

  const addFiles = useCallback(
    async (entries) => {
      for (const { file, handle } of entries) {
        await addFolderFile(folderId, file, handle);
      }
      await refresh();
    },
    [folderId, refresh]
  );

  const removeFile = useCallback(
    async (id) => {
      await deleteFolderFile(id);
      const remaining = await getFolderFiles(folderId);
      await reorderFolderFiles(
        folderId,
        remaining.filter((f) => f.id !== id).map((f) => f.id)
      );
      await refresh();
    },
    [folderId, refresh]
  );

  const reorder = useCallback(
    async (orderedIds) => {
      await reorderFolderFiles(folderId, orderedIds);
      await refresh();
    },
    [folderId, refresh]
  );

  const openFile = useCallback(async (record) => openFolderFile(record), []);

  return { files, loading, refresh, addFiles, removeFile, reorder, openFile };
}
