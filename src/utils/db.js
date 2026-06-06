const DB_NAME = 'auva-play-db';
const DB_VERSION = 1;

const STORES = {
  FOLDERS: 'folders',
  FOLDER_FILES: 'folderFiles',
  RECENT_FILES: 'recentFiles',
};

/**
 * @returns {Promise<IDBDatabase|null>}
 */
function openDB() {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => resolve(null);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORES.FOLDERS)) {
          db.createObjectStore(STORES.FOLDERS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.FOLDER_FILES)) {
          const store = db.createObjectStore(STORES.FOLDER_FILES, { keyPath: 'id' });
          store.createIndex('folderId', 'folderId', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.RECENT_FILES)) {
          db.createObjectStore(STORES.RECENT_FILES, { keyPath: 'name' });
        }
      };
    } catch {
      resolve(null);
    }
  });
}

function runTransaction(storeName, mode, fn) {
  return openDB().then((db) => {
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        let result;
        try {
          result = fn(store, tx);
        } catch {
          result = null;
        }
        tx.oncomplete = () => {
          db.close();
          resolve(result);
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
  });
}

function runRequest(request) {
  return new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

export function createId() {
  return crypto.randomUUID();
}

// ── Folders ──

/**
 * @typedef {{ id: string, name: string, createdAt: number }} Folder
 */

/** @returns {Promise<Folder[]>} */
export async function getAllFolders() {
  const folders = await runTransaction(STORES.FOLDERS, 'readonly', (store) =>
    runRequest(store.getAll())
  );
  if (!Array.isArray(folders)) return [];
  return folders.sort((a, b) => b.createdAt - a.createdAt);
}

/** @returns {Promise<Folder|null>} */
export async function createFolder(name) {
  const folder = { id: createId(), name, createdAt: Date.now() };
  const ok = await runTransaction(STORES.FOLDERS, 'readwrite', (store) => {
    store.put(folder);
  });
  return ok !== null ? folder : null;
}

/** @returns {Promise<Folder|null>} */
export async function getFolder(id) {
  return runTransaction(STORES.FOLDERS, 'readonly', (store) => runRequest(store.get(id)));
}

/** @returns {Promise<Folder|null>} */
export async function updateFolder(id, updates) {
  const existing = await getFolder(id);
  if (!existing) return null;
  const updated = { ...existing, ...updates };
  const ok = await runTransaction(STORES.FOLDERS, 'readwrite', (store) => {
    store.put(updated);
  });
  return ok !== null ? updated : null;
}

/** @returns {Promise<boolean>} */
export async function deleteFolder(id) {
  const db = await openDB();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORES.FOLDERS, STORES.FOLDER_FILES], 'readwrite');
      const folderStore = tx.objectStore(STORES.FOLDERS);
      const fileStore = tx.objectStore(STORES.FOLDER_FILES);
      const index = fileStore.index('folderId');
      const req = index.openCursor(IDBKeyRange.only(id));
      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
      folderStore.delete(id);
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

// ── Folder files ──

/**
 * @typedef {{
 *   id: string,
 *   folderId: string,
 *   name: string,
 *   size: number,
 *   addedAt: number,
 *   order: number,
 *   handle: FileSystemFileHandle,
 * }} FolderFile
 */

/** @returns {Promise<FolderFile[]>} */
export async function getFolderFiles(folderId) {
  const db = await openDB();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORES.FOLDER_FILES, 'readonly');
      const index = tx.objectStore(STORES.FOLDER_FILES).index('folderId');
      const req = index.getAll(IDBKeyRange.only(folderId));
      req.onsuccess = () => {
        db.close();
        const result = req.result;
        resolve(Array.isArray(result) ? result.sort((a, b) => a.order - b.order) : []);
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

/** @returns {Promise<number>} */
export async function getFolderFileCount(folderId) {
  const files = await getFolderFiles(folderId);
  return files.length;
}

/** @returns {Promise<FolderFile|null>} */
export async function addFolderFile(folderId, file, handle = null) {
  const existing = await getFolderFiles(folderId);
  const record = {
    id: createId(),
    folderId,
    name: file.name,
    size: file.size,
    addedAt: Date.now(),
    order: existing.length,
    ...(handle ? { handle } : {}),
  };
  const ok = await runTransaction(STORES.FOLDER_FILES, 'readwrite', (store) => {
    store.put(record);
  });
  return ok !== null ? record : null;
}

/** @returns {Promise<FolderFile|null>} */
export async function getFolderFile(id) {
  return runTransaction(STORES.FOLDER_FILES, 'readonly', (store) => runRequest(store.get(id)));
}

/** @returns {Promise<boolean>} */
export async function deleteFolderFile(id) {
  const ok = await runTransaction(STORES.FOLDER_FILES, 'readwrite', (store) => {
    store.delete(id);
  });
  return ok !== null;
}

/** @param {string} folderId @param {string[]} orderedIds */
export async function reorderFolderFiles(folderId, orderedIds) {
  const files = await getFolderFiles(folderId);
  const db = await openDB();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORES.FOLDER_FILES, 'readwrite');
      const store = tx.objectStore(STORES.FOLDER_FILES);
      orderedIds.forEach((id, index) => {
        const file = files.find((f) => f.id === id);
        if (file) store.put({ ...file, order: index });
      });
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
 * @returns {Promise<{ file: File|null, denied: boolean }>}
 */
export async function openFolderFile(record) {
  try {
    if (!record?.handle) return { file: null, denied: false };
    const permission = await record.handle.requestPermission({ mode: 'read' });
    if (permission !== 'granted') return { file: null, denied: true };
    const file = await record.handle.getFile();
    return { file, denied: false };
  } catch {
    return { file: null, denied: false };
  }
}

// ── Recent file handles ──

/**
 * @typedef {{ handle: FileSystemFileHandle, name: string, size: number, lastOpened: number }} RecentFileRecord
 */

/** @param {RecentFileRecord} record */
export async function saveRecentFileHandle(record) {
  const ok = await runTransaction(STORES.RECENT_FILES, 'readwrite', (store) => {
    store.put({
      handle: record.handle,
      name: record.name,
      size: record.size,
      lastOpened: record.lastOpened ?? Date.now(),
    });
  });
  return ok !== null;
}

/** @param {string} name @returns {Promise<RecentFileRecord|null>} */
export async function getRecentFileHandle(name) {
  return runTransaction(STORES.RECENT_FILES, 'readonly', (store) => runRequest(store.get(name)));
}

/**
 * @param {string} name
 * @returns {Promise<{ file: File|null, denied: boolean }>}
 */
export async function openRecentFileHandle(name) {
  try {
    const record = await getRecentFileHandle(name);
    if (!record?.handle) return { file: null, denied: false };
    const permission = await record.handle.requestPermission({ mode: 'read' });
    if (permission !== 'granted') return { file: null, denied: true };
    const file = await record.handle.getFile();
    await saveRecentFileHandle({
      handle: record.handle,
      name: file.name,
      size: file.size,
      lastOpened: Date.now(),
    });
    return { file, denied: false };
  } catch {
    return { file: null, denied: false };
  }
}
