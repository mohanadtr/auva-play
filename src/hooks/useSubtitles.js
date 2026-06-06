import { useState, useCallback, useRef, useEffect } from 'react';
import { loadSubtitleFile } from '../utils/subtitles';

export function useSubtitles(videoRef) {
  const [trackUrl, setTrackUrl] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const urlRef = useRef(null);

  const revokeUrl = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  useEffect(() => () => revokeUrl(), [revokeUrl]);

  const syncTrackMode = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    for (let i = 0; i < video.textTracks.length; i++) {
      video.textTracks[i].mode = enabled && trackUrl ? 'showing' : 'hidden';
    }
  }, [enabled, trackUrl, videoRef]);

  useEffect(() => {
    syncTrackMode();
    const video = videoRef.current;
    if (!video) return;
    video.addEventListener('loadedmetadata', syncTrackMode);
    return () => video.removeEventListener('loadedmetadata', syncTrackMode);
  }, [syncTrackMode, videoRef]);

  const loadFile = useCallback(
    async (file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'srt' && ext !== 'vtt') return false;
      revokeUrl();
      const url = await loadSubtitleFile(file);
      urlRef.current = url;
      setTrackUrl(url);
      setEnabled(true);
      return true;
    },
    [revokeUrl]
  );

  const toggle = useCallback(() => {
    if (!trackUrl) return;
    setEnabled((v) => !v);
  }, [trackUrl]);

  const clear = useCallback(() => {
    revokeUrl();
    setTrackUrl(null);
    setEnabled(false);
  }, [revokeUrl]);

  return { trackUrl, enabled, hasSubtitles: !!trackUrl, loadFile, toggle, clear };
}
