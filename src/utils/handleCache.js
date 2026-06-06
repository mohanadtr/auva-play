/** @type {Map<string, FileSystemFileHandle>} */
const folderFileHandles = new Map();

/** @type {Map<string, FileSystemFileHandle>} */
const recentFileHandles = new Map();

export function cacheFolderHandle(fileId, handle) {
  if (fileId && handle) folderFileHandles.set(fileId, handle);
}

export function getCachedFolderHandle(fileId) {
  return folderFileHandles.get(fileId) ?? null;
}

export function removeCachedFolderHandle(fileId) {
  folderFileHandles.delete(fileId);
}

export function cacheRecentHandle(name, handle) {
  if (name && handle) recentFileHandles.set(name, handle);
}

export function getCachedRecentHandle(name) {
  return recentFileHandles.get(name) ?? null;
}

/**
 * @param {Array<{ id: string, handle?: FileSystemFileHandle }>} files
 */
export function warmFolderHandleCache(files) {
  for (const file of files) {
    if (file.handle) cacheFolderHandle(file.id, file.handle);
  }
}
