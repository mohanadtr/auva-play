/**
 * Open a FileSystemFileHandle with read permission.
 * Tries getFile() first (works when permission was granted at pick time),
 * then requestPermission() if needed.
 * @param {FileSystemFileHandle} handle
 * @returns {Promise<{ file: File|null, denied: boolean }>}
 */
export async function openFileWithPermission(handle) {
  if (!handle || typeof handle.getFile !== 'function') {
    return { file: null, denied: false };
  }

  try {
    try {
      const file = await handle.getFile();
      if (file) return { file, denied: false };
    } catch {
      /* permission not granted yet */
    }

    if (typeof handle.requestPermission === 'function') {
      const result = await handle.requestPermission({ mode: 'read' });
      if (result !== 'granted') return { file: null, denied: true };
      const file = await handle.getFile();
      return { file, denied: false };
    }

    const file = await handle.getFile();
    return { file, denied: false };
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    return { file: null, denied: false };
  }
}
