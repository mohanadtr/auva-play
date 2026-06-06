/**
 * Open a FileSystemFileHandle with read permission.
 * @param {FileSystemFileHandle} handle
 * @returns {Promise<{ file: File|null, denied: boolean }>}
 */
export async function openFileWithPermission(handle) {
  if (!handle) return { file: null, denied: false };

  try {
    const permission = await handle.queryPermission({ mode: 'read' });
    let granted = permission === 'granted';

    if (!granted) {
      const request = await handle.requestPermission({ mode: 'read' });
      granted = request === 'granted';
    }

    if (!granted) return { file: null, denied: true };

    const file = await handle.getFile();
    return { file, denied: false };
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    return { file: null, denied: false };
  }
}
