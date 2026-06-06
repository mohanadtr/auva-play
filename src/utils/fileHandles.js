import { saveRecentFileHandle, getRecentFileHandle, openRecentFileHandle } from './db';

/**
 * @returns {boolean}
 */
export function supportsFileSystemAccess() {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window;
}

export const VIDEO_PICKER_OPTIONS = {
  multiple: false,
  types: [
    {
      description: 'Video',
      accept: {
        'video/mp4': ['.mp4'],
        'video/webm': ['.webm'],
        'video/x-matroska': ['.mkv'],
        'video/quicktime': ['.mov'],
      },
    },
  ],
};

export const VIDEO_PICKER_OPTIONS_MULTIPLE = {
  ...VIDEO_PICKER_OPTIONS,
  multiple: true,
};

/**
 * @typedef {{ handle: FileSystemFileHandle, name: string, size: number, lastOpened: number }} FileHandleRecord
 */

/** @param {FileHandleRecord} record */
export async function saveFileHandle(record) {
  return saveRecentFileHandle(record);
}

/** @param {string} name */
export async function getFileHandle(name) {
  return getRecentFileHandle(name);
}

/**
 * @param {string} name
 * @returns {Promise<{ file: File|null, denied: boolean, handle: FileSystemFileHandle|null }>}
 */
export async function openFileFromHandle(name) {
  const record = await getRecentFileHandle(name);
  const result = await openRecentFileHandle(name);
  return {
    ...result,
    handle: record?.handle ?? null,
  };
}
