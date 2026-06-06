import { useEffect } from 'react';

export function useLaunchQueue(onFileReceived) {
  useEffect(() => {
    if (!('launchQueue' in window)) return;
    if (typeof window.launchQueue.setConsumer !== 'function') return;

    try {
      window.launchQueue.setConsumer(async (launchParams) => {
        try {
          if (!launchParams?.files?.length) return;

          const fileHandle = launchParams.files[0];
          if (!fileHandle) return;

          const file = await fileHandle.getFile();
          if (!file) return;

          onFileReceived(file, fileHandle);
        } catch (err) {
          console.warn('LaunchQueue file error:', err);
        }
      });
    } catch (err) {
      console.warn('LaunchQueue setup error:', err);
    }
  }, []);
}
