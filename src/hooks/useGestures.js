import { useRef, useCallback, useEffect } from 'react';

const SWIPE_THRESHOLD = 30;
const TAP_TIMEOUT = 280;
const LONG_PRESS_DELAY = 500;
const DOUBLE_TAP_DELAY = 300;

/**
 * Touch gesture controls for mobile/tablet:
 * - Double-tap left/right → seek ±10s
 * - Vertical swipe right side → volume
 * - Vertical swipe left side → brightness (CSS filter)
 * - Horizontal swipe → seek
 * - Long press → temporary 2× speed
 */
export function useGestures({
  containerRef,
  enabled = true,
  seekRelative,
  changeVolume,
  getVolume,
  togglePlay,
  changeSpeed,
  getSpeed,
  onBrightnessChange,
  getBrightness,
  onFeedback,
  showControls,
}) {
  const touchStartRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const doubleTapTimerRef = useRef(null);
  const lastTapRef = useRef({ time: 0, x: 0 });
  const isLongPressActiveRef = useRef(false);
  const originalSpeedRef = useRef(null);
  const gestureActiveRef = useRef(false);
  const feedbackRef = useRef(null);

  const cleanup = useCallback(() => {
    clearTimeout(longPressTimerRef.current);
    clearTimeout(doubleTapTimerRef.current);
    if (isLongPressActiveRef.current && originalSpeedRef.current !== null) {
      changeSpeed(originalSpeedRef.current);
      isLongPressActiveRef.current = false;
      originalSpeedRef.current = null;
    }
  }, [changeSpeed]);

  const handleTouchStart = useCallback(
    (e) => {
      if (!enabled) return;
      const touch = e.touches[0];
      if (!touch) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
        rectWidth: rect.width,
        rectHeight: rect.height,
        rectLeft: rect.left,
      };
      gestureActiveRef.current = false;

      // Long press detection
      longPressTimerRef.current = setTimeout(() => {
        if (!touchStartRef.current) return;
        isLongPressActiveRef.current = true;
        originalSpeedRef.current = getSpeed();
        changeSpeed(2);
        onFeedback?.('speed', { speed: 2 });
        gestureActiveRef.current = true;
      }, LONG_PRESS_DELAY);
    },
    [enabled, containerRef, getSpeed, changeSpeed, onFeedback]
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (!enabled || !touchStartRef.current) return;
      const touch = e.touches[0];
      if (!touch) return;

      clearTimeout(longPressTimerRef.current);

      const start = touchStartRef.current;
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;

      if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;

      gestureActiveRef.current = true;

      const touchXRelative = (start.x - start.rectLeft) / start.rectWidth;

      // Vertical swipe
      if (Math.abs(dy) > Math.abs(dx)) {
        e.preventDefault();
        const deltaPercent = -dy / (start.rectHeight * 0.6);

        if (touchXRelative > 0.55) {
          // Right side: volume
          const newVol = Math.max(0, Math.min(1, getVolume() + deltaPercent * 0.02));
          changeVolume(newVol);
          onFeedback?.('volume', { volume: newVol, muted: newVol === 0 });
        } else if (touchXRelative < 0.45) {
          // Left side: brightness
          const current = getBrightness?.() ?? 100;
          const newBright = Math.max(30, Math.min(200, current + deltaPercent * 1.5));
          onBrightnessChange?.(Math.round(newBright));
          onFeedback?.('brightness', { brightness: Math.round(newBright) });
        }

        // Update start position for continuous gesture
        touchStartRef.current = { ...start, y: touch.clientY };
      } else if (Math.abs(dx) > SWIPE_THRESHOLD * 1.5) {
        // Horizontal swipe: seek
        const seekAmount = Math.sign(dx) * 5;
        seekRelative(seekAmount);
        onFeedback?.('seek', { direction: dx > 0 ? 'right' : 'left', seconds: seekAmount });
        touchStartRef.current = { ...start, x: touch.clientX };
      }
    },
    [enabled, seekRelative, changeVolume, getVolume, getBrightness, onBrightnessChange, onFeedback]
  );

  const handleTouchEnd = useCallback(
    (e) => {
      if (!enabled) return;
      const start = touchStartRef.current;
      if (!start) return;

      clearTimeout(longPressTimerRef.current);

      // Long press release
      if (isLongPressActiveRef.current) {
        if (originalSpeedRef.current !== null) {
          changeSpeed(originalSpeedRef.current);
          onFeedback?.('speed', { speed: originalSpeedRef.current });
        }
        isLongPressActiveRef.current = false;
        originalSpeedRef.current = null;
        touchStartRef.current = null;
        return;
      }

      // Skip if it was a swipe gesture
      if (gestureActiveRef.current) {
        touchStartRef.current = null;
        return;
      }

      // Double-tap detection
      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current.time;
      const touchX = start.x;
      const touchXRelative = (touchX - start.rectLeft) / start.rectWidth;

      if (timeSinceLastTap < DOUBLE_TAP_DELAY && Math.abs(touchX - lastTapRef.current.x) < 60) {
        // Double tap
        clearTimeout(doubleTapTimerRef.current);
        e.preventDefault();

        if (touchXRelative < 0.4) {
          // Left side: -10s
          seekRelative(-10);
          onFeedback?.('seek', { direction: 'left', seconds: -10 });
        } else if (touchXRelative > 0.6) {
          // Right side: +10s
          seekRelative(10);
          onFeedback?.('seek', { direction: 'right', seconds: 10 });
        } else {
          // Center: toggle play/pause
          togglePlay();
        }

        lastTapRef.current = { time: 0, x: 0 };
      } else {
        lastTapRef.current = { time: now, x: touchX };

        // Single tap — show/hide controls (handled by existing click handler)
        doubleTapTimerRef.current = setTimeout(() => {
          // Let the existing click handler deal with single taps
        }, DOUBLE_TAP_DELAY);
      }

      touchStartRef.current = null;
    },
    [enabled, seekRelative, togglePlay, changeSpeed, onFeedback]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !enabled) return;

    const opts = { passive: false };
    el.addEventListener('touchstart', handleTouchStart, opts);
    el.addEventListener('touchmove', handleTouchMove, opts);
    el.addEventListener('touchend', handleTouchEnd, opts);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart, opts);
      el.removeEventListener('touchmove', handleTouchMove, opts);
      el.removeEventListener('touchend', handleTouchEnd, opts);
      cleanup();
    };
  }, [containerRef, enabled, handleTouchStart, handleTouchMove, handleTouchEnd, cleanup]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);
}
