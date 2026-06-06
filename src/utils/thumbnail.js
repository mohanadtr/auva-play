/**
 * Generate a JPEG thumbnail and duration from a video File.
 * @param {File} file
 * @returns {Promise<{ thumbnail: string|null, duration: number|null }>}
 */
export function generateThumbnail(file) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    video.src = url;
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => URL.revokeObjectURL(url);

    video.addEventListener('loadedmetadata', () => {
      video.currentTime = Math.min(video.duration * 0.1, 5);
    });

    video.addEventListener('seeked', () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          resolve({ thumbnail: null, duration: video.duration ?? null });
          return;
        }
        ctx.drawImage(video, 0, 0, 320, 180);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
        cleanup();
        resolve({ thumbnail, duration: video.duration ?? null });
      } catch {
        cleanup();
        resolve({ thumbnail: null, duration: video.duration ?? null });
      }
    });

    video.addEventListener('error', () => {
      cleanup();
      resolve({ thumbnail: null, duration: null });
    });

    video.load();
  });
}
