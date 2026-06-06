import { useState, useRef, useCallback, useEffect } from 'react';

const HIDE_DELAY = 2500;

export function useControlsVisibility(containerRef, isPlaying) {
  const [controlsVisible, setControlsVisible] = useState(true);
  const timerRef = useRef(null);

  const clearHideTimer = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    if (!isPlaying) return;
    timerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, HIDE_DELAY);
  }, [isPlaying, clearHideTimer]);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  const toggleControlsVisibility = useCallback(() => {
    setControlsVisible((prev) => {
      const next = !prev;
      clearHideTimer();
      if (next && isPlaying) scheduleHide();
      return next;
    });
  }, [isPlaying, clearHideTimer, scheduleHide]);

  useEffect(() => {
    if (!isPlaying) {
      setControlsVisible(true);
      clearHideTimer();
    } else {
      scheduleHide();
    }
  }, [isPlaying, clearHideTimer, scheduleHide]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onMove = () => showControls();
    const onTouch = () => showControls();
    const onKey = () => showControls();
    const onLeave = () => {
      if (isPlaying) {
        clearHideTimer();
        setControlsVisible(false);
      }
    };

    container.addEventListener('mousemove', onMove);
    container.addEventListener('touchstart', onTouch, { passive: true });
    container.addEventListener('mouseleave', onLeave);
    window.addEventListener('keydown', onKey);

    return () => {
      container.removeEventListener('mousemove', onMove);
      container.removeEventListener('touchstart', onTouch);
      container.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('keydown', onKey);
      clearHideTimer();
    };
  }, [containerRef, isPlaying, showControls, clearHideTimer]);

  return { controlsVisible, showControls, toggleControlsVisibility };
}
