import { getRecentFileHandle, saveRecentFileHandle } from './db';
import { openFileWithPermission } from './openFileWithPermission';
import { getCachedRecentHandle, cacheRecentHandle } from './handleCache';

/**
 * Open a recent file entry (localStorage metadata + IndexedDB handle).
 * @param {{ name: string, url?: string }} recent
 * @param {{ onPlayFile: Function, onPlayUrl?: Function, onFallbackPicker?: Function, showToast?: Function }} callbacks
 */
export async function openRecentFile(recent, { onPlayFile, onPlayUrl, onFallbackPicker, showToast }) {
  if (recent.url) {
    onPlayUrl?.(recent.url);
    return;
  }

  let handle = getCachedRecentHandle(recent.name);

  if (!handle) {
    const record = await getRecentFileHandle(recent.name);
    handle = record?.handle ?? null;
    if (handle) cacheRecentHandle(recent.name, handle);
  }

  if (!handle) {
    showToast?.('No saved file access. Please select the file manually.');
    return;
  }

  try {
    const { file, denied } = await openFileWithPermission(handle);

    if (denied) {
      showToast?.('Permission denied.');
      return;
    }

    if (!file) {
      showToast?.('Could not reopen file. Please select it manually.');
      onFallbackPicker?.();
      return;
    }

    cacheRecentHandle(recent.name, handle);
    await saveRecentFileHandle({
      handle,
      name: file.name,
      size: file.size,
      lastOpened: Date.now(),
    });

    onPlayFile(file, handle);
  } catch (err) {
    if (err?.name === 'AbortError') return;
    showToast?.('Could not reopen file. Please select it manually.');
    onFallbackPicker?.();
  }
}
