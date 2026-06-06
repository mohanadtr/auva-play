import { useEffect, useCallback } from 'react';
import { snapSpeed } from '../constants/speeds';

function isTypingTarget(target) {
  const tag = target?.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || target?.isContentEditable;
}

/**
 * Comprehensive keyboard shortcuts — player screen only.
 */
export function useKeyboard({
  togglePlay,
  seekRelative,
  seek,
  changeVolume,
  toggleMute,
  toggleFullscreen,
  changeSpeed,
  setSpeed,
  setA,
  setB,
  clearAB,
  togglePiP,
  toggleLoop,
  toggleSubtitles,
  toggleAmbient,
  takeScreenshot,
  folderNext,
  folderPrev,
  addBookmark,
  toggleFilters,
  toggleEqualizer,
  zoomIn,
  zoomOut,
  resetZoom,
  panLeft,
  panRight,
  panUp,
  panDown,
  isZoomed,
  toggleShortcuts,
  closeMenus,
  getCurrentTime,
  getDuration,
  getVolume,
  getSpeed,
  getIsMuted,
  isPlaying,
  containerRef,
  hasVideo,
  isABActive,
  isFullscreen,
  shortcutsOpen,
  hasFolderContext,
  onFeedback,
}) {
  const handleKeyDown = useCallback(
    (e) => {
      if (isTypingTarget(e.target)) {
        if (e.key === 'Escape') e.target.blur();
        return;
      }

      if (!hasVideo) return;

      if (shortcutsOpen) {
        if (e.key === '?' || e.key === 'Escape') {
          e.preventDefault();
          toggleShortcuts?.();
        }
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        toggleShortcuts?.();
        return;
      }

      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        takeScreenshot?.();
        return;
      }

      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        toggleLoop?.();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        if (isFullscreen) {
          toggleFullscreen(containerRef);
        } else if (isABActive) {
          clearAB();
        } else {
          closeMenus?.();
        }
        return;
      }

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K': {
          e.preventDefault();
          const wasPlaying = isPlaying();
          togglePlay();
          onFeedback?.('play', wasPlaying ? 'pause' : 'play');
          break;
        }
        case 'ArrowLeft': {
          e.preventDefault();
          if (isZoomed) {
            panLeft?.();
          } else {
            const seconds = e.shiftKey ? -30 : -5;
            seekRelative(seconds);
            onFeedback?.('seek', { direction: 'left', seconds });
          }
          break;
        }
        case 'ArrowRight': {
          e.preventDefault();
          if (isZoomed) {
            panRight?.();
          } else {
            const seconds = e.shiftKey ? 30 : 5;
            seekRelative(seconds);
            onFeedback?.('seek', { direction: 'right', seconds });
          }
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          if (isZoomed) {
            panUp?.();
          } else {
            const next = Math.min(1, getVolume() + 0.1);
            changeVolume(next);
            onFeedback?.('volume', { volume: next, muted: false });
          }
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          if (isZoomed) {
            panDown?.();
          } else {
            const next = Math.max(0, getVolume() - 0.1);
            changeVolume(next);
            onFeedback?.('volume', { volume: next, muted: next === 0 });
          }
          break;
        }
        case 'j':
        case 'J': {
          e.preventDefault();
          seekRelative(-10);
          onFeedback?.('seek', { direction: 'left', seconds: -10 });
          break;
        }
        case 'l':
        case 'L': {
          e.preventDefault();
          seekRelative(10);
          onFeedback?.('seek', { direction: 'right', seconds: 10 });
          break;
        }
        case 'Home':
          e.preventDefault();
          seek(0);
          break;
        case 'End':
          e.preventDefault();
          seek(getDuration());
          break;
        case ',':
          if (!isPlaying()) {
            e.preventDefault();
            seekRelative(-0.04);
          }
          break;
        case '.':
          if (!isPlaying()) {
            e.preventDefault();
            seekRelative(0.04);
          }
          break;
        case '+':
        case '=': {
          e.preventDefault();
          const next = snapSpeed(getSpeed() + 0.25);
          changeSpeed(next);
          onFeedback?.('speed', { speed: next });
          break;
        }
        case '-': {
          e.preventDefault();
          const next = snapSpeed(getSpeed() - 0.25);
          changeSpeed(next);
          onFeedback?.('speed', { speed: next });
          break;
        }
        case '[': {
          e.preventDefault();
          const next = snapSpeed(getSpeed() - 0.25);
          changeSpeed(next);
          onFeedback?.('speed', { speed: next });
          break;
        }
        case ']': {
          e.preventDefault();
          const next = snapSpeed(getSpeed() + 0.25);
          changeSpeed(next);
          onFeedback?.('speed', { speed: next });
          break;
        }
        case 'm':
        case 'M': {
          e.preventDefault();
          const willMute = !getIsMuted();
          toggleMute();
          onFeedback?.('volume', { volume: getVolume(), muted: willMute });
          break;
        }
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen(containerRef);
          break;
        case 't':
        case 'T':
          e.preventDefault();
          togglePiP();
          break;
        case 'g':
        case 'G':
          e.preventDefault();
          toggleAmbient?.();
          break;
        case 'c':
        case 'C':
          e.preventDefault();
          toggleSubtitles?.();
          break;
        case 'a':
        case 'A':
          e.preventDefault();
          setA(getCurrentTime());
          break;
        case 's':
        case 'S':
          if (!e.ctrlKey) {
            e.preventDefault();
            setB(getCurrentTime());
          }
          break;
        case 'r':
        case 'R':
          if (e.shiftKey) {
            e.preventDefault();
            setSpeed?.(1);
            onFeedback?.('speed', { reset: true });
          }
          break;
        case 'n':
        case 'N':
          if (hasFolderContext) {
            e.preventDefault();
            folderNext?.();
          }
          break;
        case 'p':
        case 'P':
          if (hasFolderContext) {
            e.preventDefault();
            folderPrev?.();
          }
          break;
        case 'b':
        case 'B':
          e.preventDefault();
          addBookmark?.();
          break;
        case 'v':
        case 'V':
          e.preventDefault();
          toggleFilters?.();
          break;
        case 'e':
        case 'E':
          e.preventDefault();
          toggleEqualizer?.();
          break;
        case 'z':
        case 'Z':
          e.preventDefault();
          if (e.shiftKey) zoomOut?.();
          else zoomIn?.();
          break;
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            resetZoom?.();
            break;
          }
          // fallthrough to default if not ctrl+0
        default:
          if (e.key >= '0' && e.key <= '9') {
            e.preventDefault();
            const dur = getDuration();
            if (dur > 0) seek((parseInt(e.key, 10) / 10) * dur);
          }
          break;
      }
    },
    [
      togglePlay,
      seekRelative,
      seek,
      changeVolume,
      toggleMute,
      toggleFullscreen,
      changeSpeed,
      setSpeed,
      setA,
      setB,
      clearAB,
      togglePiP,
      toggleLoop,
      toggleSubtitles,
      toggleAmbient,
      takeScreenshot,
      folderNext,
      folderPrev,
      addBookmark,
      toggleFilters,
      toggleEqualizer,
      zoomIn,
      zoomOut,
      resetZoom,
      panLeft,
      panRight,
      panUp,
      panDown,
      isZoomed,
      toggleShortcuts,
      closeMenus,
      getCurrentTime,
      getDuration,
      getVolume,
      getSpeed,
      getIsMuted,
      isPlaying,
      containerRef,
      hasVideo,
      isABActive,
      isFullscreen,
      shortcutsOpen,
      hasFolderContext,
      onFeedback,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
