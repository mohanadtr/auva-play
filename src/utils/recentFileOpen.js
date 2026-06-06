import { getRecentFileHandle, saveRecentFileHandle } from './db';
import { openFileWithPermission } from './openFileWithPermission';

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

  const record = await getRecentFileHandle(recent.name);

  if (!record?.handle) {
    showToast?.('No saved file access. Please select the file manually.');
    return;
  }

  try {
    const { file, denied } = await openFileWithPermission(record.handle);

    if (denied) {
      showToast?.('Permission denied.');
      return;
    }

    if (!file) {
      showToast?.('Could not reopen file. Please select it manually.');
      onFallbackPicker?.();
      return;
    }

    await saveRecentFileHandle({
      handle: record.handle,
      name: file.name,
      size: file.size,
      lastOpened: Date.now(),
    });

    onPlayFile(file, record.handle);
  } catch (err) {
    if (err?.name === 'AbortError') return;
    showToast?.('Could not reopen file. Please select it manually.');
    onFallbackPicker?.();
  }
}
