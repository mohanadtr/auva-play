import { useState, useCallback, useRef, useEffect } from 'react';
import { loadSubtitleFile } from '../utils/subtitles';

const STORAGE_KEY = 'auva-subtitle-style';

const DEFAULT_STYLE = {
  fontSize: '18px',
  color: '#ffffff',
  background: 'rgba(0, 0, 0, 0.75)',
};

function loadStyle() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return { ...DEFAULT_STYLE, ...JSON.parse(data) };
  } catch { /* ignore */ }
  return { ...DEFAULT_STYLE };
}

export function useSubtitles(videoRef) {
  const [trackUrl, setTrackUrl] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [offset, setOffset] = useState(0); // in seconds
  const [style, setStyle] = useState(loadStyle);
  const urlRef = useRef(null);
  const styleTagRef = useRef(null);

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
      setOffset(0);
      return true;
    },
    [revokeUrl]
  );

  const changeOffset = useCallback((delta) => {
    setOffset((prev) => {
      const next = prev + delta;
      // Adjust cues directly
      const video = videoRef.current;
      if (video && video.textTracks && video.textTracks.length > 0) {
        const track = video.textTracks[0];
        const cues = track.cues || track.activeCues;
        if (cues) {
          for (let i = 0; i < cues.length; i++) {
            cues[i].startTime += delta;
            cues[i].endTime += delta;
          }
        }
      }
      return next;
    });
  }, [videoRef]);

  const changeStyle = useCallback((key, value) => {
    setStyle((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch { /* ignore */ }
      return next;
    });
  }, []);

  // Inject dynamic CSS for ::cue
  useEffect(() => {
    let styleEl = styleTagRef.current;
    if (!styleEl) {
      styleEl = document.createElement('style');
      document.head.appendChild(styleEl);
      styleTagRef.current = styleEl;
    }
    
    styleEl.textContent = `
      ::cue {
        font-size: ${style.fontSize} !important;
        color: ${style.color} !important;
        background: ${style.background} !important;
        font-family: Inter, sans-serif !important;
        border-radius: 4px;
        line-height: 1.4;
      }
    `;

    return () => {
      if (styleEl && styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
      styleTagRef.current = null;
    };
  }, [style]);

  const toggle = useCallback(() => {
    if (!trackUrl) return;
    setEnabled((v) => !v);
  }, [trackUrl]);

  const clear = useCallback(() => {
    revokeUrl();
    setTrackUrl(null);
    setEnabled(false);
    setOffset(0);
  }, [revokeUrl]);

  return {
    trackUrl,
    enabled,
    hasSubtitles: !!trackUrl,
    offset,
    style,
    loadFile,
    toggle,
    clear,
    changeOffset,
    changeStyle,
  };
}
