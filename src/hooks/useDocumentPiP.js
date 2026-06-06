import { useState, useRef, useCallback, useEffect } from 'react';

export function useDocumentPiP(videoRef, { showToast } = {}) {
  const [isMiniPlayerActive, setIsMiniPlayerActive] = useState(false);
  const pipWindowRef = useRef(null);
  const videoCloneRef = useRef(null);
  const syncFromCloneRef = useRef(false);

  const closeMiniPlayer = useCallback(() => {
    if (pipWindowRef.current && !pipWindowRef.current.closed) {
      try {
        pipWindowRef.current.close();
      } catch {
        /* ignore */
      }
    }
    pipWindowRef.current = null;
    videoCloneRef.current = null;
    setIsMiniPlayerActive(false);
  }, []);

  const toggleMiniPlayer = useCallback(async () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (document.pictureInPictureElement === videoEl) {
      await document.exitPictureInPicture().catch(() => {});
      return;
    }

    if (pipWindowRef.current && !pipWindowRef.current.closed) {
      closeMiniPlayer();
      return;
    }

    if (!('documentPictureInPicture' in window)) {
      if (videoEl.requestPictureInPicture) {
        try {
          await videoEl.requestPictureInPicture();
        } catch {
          showToast?.('Mini Player requires Chrome 116 or newer');
        }
      } else {
        showToast?.('Mini Player requires Chrome 116 or newer');
      }
      return;
    }

    try {
      const pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 480,
        height: 270,
        disallowReturnToOpener: false,
      });

      pipWindowRef.current = pipWindow;
      pipWindow.document.documentElement.style.background = '#000';
      pipWindow.document.documentElement.style.margin = '0';
      pipWindow.document.body.style.margin = '0';
      pipWindow.document.body.style.overflow = 'hidden';
      pipWindow.document.body.style.background = '#000';

      const videoClone = videoEl.cloneNode();
      videoClone.style.width = '100%';
      videoClone.style.height = '100%';
      videoClone.style.objectFit = 'contain';
      videoClone.src = videoEl.src;
      videoClone.currentTime = videoEl.currentTime;
      videoClone.playbackRate = videoEl.playbackRate;
      videoClone.muted = videoEl.muted;
      videoClone.volume = videoEl.volume;
      if (!videoEl.paused) {
        await videoClone.play().catch(() => {});
      }

      videoCloneRef.current = videoClone;
      pipWindow.document.body.appendChild(videoClone);

      videoClone.addEventListener('seeked', () => {
        syncFromCloneRef.current = true;
        videoEl.currentTime = videoClone.currentTime;
        syncFromCloneRef.current = false;
      });

      videoClone.addEventListener('play', () => {
        if (videoEl.paused) videoEl.play().catch(() => {});
      });

      videoClone.addEventListener('pause', () => {
        if (!videoEl.paused) videoEl.pause();
      });

      pipWindow.addEventListener('pagehide', () => {
        closeMiniPlayer();
      });

      setIsMiniPlayerActive(true);
    } catch {
      showToast?.('Mini Player requires Chrome 116 or newer');
    }
  }, [videoRef, closeMiniPlayer, showToast]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const onEnter = () => setIsMiniPlayerActive(true);
    const onLeave = () => {
      if (!pipWindowRef.current) setIsMiniPlayerActive(false);
    };

    video.addEventListener('enterpictureinpicture', onEnter);
    video.addEventListener('leavepictureinpicture', onLeave);

    return () => {
      video.removeEventListener('enterpictureinpicture', onEnter);
      video.removeEventListener('leavepictureinpicture', onLeave);
    };
  }, [videoRef]);

  useEffect(() => {
    if (!isMiniPlayerActive || !videoCloneRef.current) return undefined;

    const clone = videoCloneRef.current;
    const main = videoRef.current;
    if (!main) return undefined;

    const onTimeUpdate = () => {
      if (syncFromCloneRef.current) return;
      if (Math.abs(clone.currentTime - main.currentTime) > 0.5) {
        clone.currentTime = main.currentTime;
      }
    };

    main.addEventListener('timeupdate', onTimeUpdate);
    return () => main.removeEventListener('timeupdate', onTimeUpdate);
  }, [isMiniPlayerActive, videoRef]);

  useEffect(() => () => closeMiniPlayer(), [closeMiniPlayer]);

  return { isMiniPlayerActive, toggleMiniPlayer };
}
