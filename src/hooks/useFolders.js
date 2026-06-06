import { useState, useEffect, useCallback } from 'react';
import {
  getAllFolders,
  getFolderFileCount,
  createFolder as dbCreateFolder,
  updateFolder,
  deleteFolder,
} from '../utils/db';

export function useFolders() {
  const [folders, setFolders] = useState([]);
  const [fileCounts, setFileCounts] = useState({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getAllFolders();
      setFolders(all);
      const counts = {};
      await Promise.all(
        all.map(async (folder) => {
          counts[folder.id] = await getFolderFileCount(folder.id);
        })
      );
      setFileCounts(counts);
    } catch {
      setFolders([]);
      setFileCounts({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createFolder = useCallback(
    async (name) => {
      const folder = await dbCreateFolder(name);
      if (folder) await refresh();
      return folder;
    },
    [refresh]
  );

  const renameFolder = useCallback(
    async (id, name) => {
      await updateFolder(id, { name });
      await refresh();
    },
    [refresh]
  );

  const removeFolder = useCallback(
    async (id) => {
      await deleteFolder(id);
      await refresh();
    },
    [refresh]
  );

  return { folders, fileCounts, loading, refresh, createFolder, renameFolder, removeFolder };
}
