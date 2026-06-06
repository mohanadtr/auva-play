import { useEffect, useCallback } from 'react';

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
  takeScreenshot,
  folderNext,
  folderPrev,
  toggleShortcuts,
  closeMenus,
  getCurrentTime,
  getDuration,
  getVolume,
  getSpeed,
  isPlaying,
  containerRef,
  hasVideo,
  isABActive,
  isFullscreen,
  shortcutsOpen,
  hasFolderContext,
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
        case 'K':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekRelative(e.shiftKey ? -30 : -5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekRelative(e.shiftKey ? 30 : 5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          changeVolume(getVolume() + 0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          changeVolume(getVolume() - 0.1);
          break;
        case 'j':
        case 'J':
          e.preventDefault();
          seekRelative(-10);
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          seekRelative(10);
          break;
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
        case '=':
          e.preventDefault();
          changeSpeed(getSpeed() + 0.25);
          break;
        case '-':
          e.preventDefault();
          changeSpeed(getSpeed() - 0.25);
          break;
        case '[':
          e.preventDefault();
          changeSpeed(getSpeed() - 0.25);
          break;
        case ']':
          e.preventDefault();
          changeSpeed(getSpeed() + 0.25);
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
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
      takeScreenshot,
      folderNext,
      folderPrev,
      toggleShortcuts,
      closeMenus,
      getCurrentTime,
      getDuration,
      getVolume,
      getSpeed,
      isPlaying,
      containerRef,
      hasVideo,
      isABActive,
      isFullscreen,
      shortcutsOpen,
      hasFolderContext,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
