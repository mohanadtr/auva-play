import { useState, useCallback, useEffect } from 'react';

const DB_NAME = 'auva-play-db';
const DB_VERSION = 2;
const BOOKMARKS_STORE = 'bookmarks';

/**
 * Open/upgrade DB to include bookmarks store.
 * @returns {Promise<IDBDatabase|null>}
 */
function openBookmarksDB() {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => resolve(null);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        // Keep existing stores
        if (!db.objectStoreNames.contains('folders')) {
          db.createObjectStore('folders', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('folderFiles')) {
          const store = db.createObjectStore('folderFiles', { keyPath: 'id' });
          store.createIndex('folderId', 'folderId', { unique: false });
        }
        if (!db.objectStoreNames.contains('recentFiles')) {
          db.createObjectStore('recentFiles', { keyPath: 'name' });
        }
        // New bookmarks store
        if (!db.objectStoreNames.contains(BOOKMARKS_STORE)) {
          const store = db.createObjectStore(BOOKMARKS_STORE, { keyPath: 'id' });
          store.createIndex('videoKey', 'videoKey', { unique: false });
        }
      };
    } catch {
      resolve(null);
    }
  });
}

function generateId() {
  return crypto.randomUUID();
}

/**
 * @typedef {{ id: string, videoKey: string, time: number, note: string, createdAt: number }} Bookmark
 */

/**
 * Get all bookmarks for a video.
 * @param {string} videoKey
 * @returns {Promise<Bookmark[]>}
 */
async function getBookmarks(videoKey) {
  const db = await openBookmarksDB();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(BOOKMARKS_STORE, 'readonly');
      const index = tx.objectStore(BOOKMARKS_STORE).index('videoKey');
      const req = index.getAll(IDBKeyRange.only(videoKey));
      req.onsuccess = () => {
        db.close();
        const result = req.result;
        resolve(Array.isArray(result) ? result.sort((a, b) => a.time - b.time) : []);
      };
      req.onerror = () => {
        db.close();
        resolve([]);
      };
    } catch {
      db.close();
      resolve([]);
    }
  });
}

/**
 * Add a bookmark.
 * @param {string} videoKey
 * @param {number} time
 * @param {string} note
 * @returns {Promise<Bookmark|null>}
 */
async function addBookmark(videoKey, time, note = '') {
  const bookmark = {
    id: generateId(),
    videoKey,
    time,
    note,
    createdAt: Date.now(),
  };
  const db = await openBookmarksDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(BOOKMARKS_STORE, 'readwrite');
      tx.objectStore(BOOKMARKS_STORE).put(bookmark);
      tx.oncomplete = () => {
        db.close();
        resolve(bookmark);
      };
      tx.onerror = () => {
        db.close();
        resolve(null);
      };
    } catch {
      db.close();
      resolve(null);
    }
  });
}

/**
 * Update a bookmark's note.
 */
async function updateBookmarkNote(id, note) {
  const db = await openBookmarksDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(BOOKMARKS_STORE, 'readwrite');
      const store = tx.objectStore(BOOKMARKS_STORE);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const existing = getReq.result;
        if (existing) {
          store.put({ ...existing, note });
        }
      };
      tx.oncomplete = () => {
        db.close();
        resolve(true);
      };
      tx.onerror = () => {
        db.close();
        resolve(false);
      };
    } catch {
      db.close();
      resolve(false);
    }
  });
}

/**
 * Delete a bookmark.
 */
async function deleteBookmark(id) {
  const db = await openBookmarksDB();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(BOOKMARKS_STORE, 'readwrite');
      tx.objectStore(BOOKMARKS_STORE).delete(id);
      tx.oncomplete = () => {
        db.close();
        resolve(true);
      };
      tx.onerror = () => {
        db.close();
        resolve(false);
      };
    } catch {
      db.close();
      resolve(false);
    }
  });
}

/**
 * Hook for managing bookmarks per video.
 * @param {string|null} videoKey - Filename or unique key for the video
 */
export function useBookmarks(videoKey) {
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load bookmarks when video changes
  useEffect(() => {
    if (!videoKey) {
      setBookmarks([]);
      return;
    }
    setIsLoading(true);
    getBookmarks(videoKey).then((results) => {
      setBookmarks(results);
      setIsLoading(false);
    });
  }, [videoKey]);

  const add = useCallback(
    async (time, note = '') => {
      if (!videoKey) return null;
      const bookmark = await addBookmark(videoKey, time, note);
      if (bookmark) {
        setBookmarks((prev) => [...prev, bookmark].sort((a, b) => a.time - b.time));
      }
      return bookmark;
    },
    [videoKey]
  );

  const remove = useCallback(async (id) => {
    const success = await deleteBookmark(id);
    if (success) {
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
    }
    return success;
  }, []);

  const updateNote = useCallback(async (id, note) => {
    const success = await updateBookmarkNote(id, note);
    if (success) {
      setBookmarks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, note } : b))
      );
    }
    return success;
  }, []);

  const exportAsMarkdown = useCallback(() => {
    if (!bookmarks.length) return '';
    const lines = [`# Bookmarks — ${videoKey}`, ''];
    bookmarks.forEach((b) => {
      const time = formatTimeForExport(b.time);
      const note = b.note ? ` — ${b.note}` : '';
      lines.push(`- **${time}**${note}`);
    });
    return lines.join('\n');
  }, [bookmarks, videoKey]);

  const exportAsText = useCallback(() => {
    if (!bookmarks.length) return '';
    return bookmarks
      .map((b) => {
        const time = formatTimeForExport(b.time);
        const note = b.note ? ` - ${b.note}` : '';
        return `${time}${note}`;
      })
      .join('\n');
  }, [bookmarks]);

  return {
    bookmarks,
    isLoading,
    add,
    remove,
    updateNote,
    exportAsMarkdown,
    exportAsText,
  };
}

function formatTimeForExport(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
