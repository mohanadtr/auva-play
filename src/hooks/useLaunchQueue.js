import { useEffect } from 'react';

export function useLaunchQueue(onFileReceived) {
  useEffect(() => {
    if (!('launchQueue' in window)) return;

    window.launchQueue.setConsumer(async (launchParams) => {
      if (!launchParams.files || launchParams.files.length === 0) return;

      try {
        const fileHandle = launchParams.files[0];
        const file = await fileHandle.getFile();
        onFileReceived(file, fileHandle);
      } catch (error) {
        console.error('Launch queue error:', error);
      }
    });
  }, [onFileReceived]);
}
