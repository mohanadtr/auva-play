import { useRef, useState, useCallback, useEffect } from 'react';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { useABRepeat } from '../hooks/useABRepeat';
import { useKeyboard } from '../hooks/useKeyboard';
import { useSubtitles } from '../hooks/useSubtitles';
import { useSleepTimer } from '../hooks/useSleepTimer';
import { useToast } from '../hooks/useToast';
import { useControlsVisibility } from '../hooks/useControlsVisibility';
import { useDocumentPiP } from '../hooks/useDocumentPiP';
import { useVideoFilters } from '../hooks/useVideoFilters';
import { useGestures } from '../hooks/useGestures';
import { useBookmarks } from '../hooks/useBookmarks';
import { formatTime } from '../utils/formatTime';
import { captureScreenshot } from '../utils/screenshot';
import { loadAmbient, saveAmbient } from '../utils/storage';
import { BTN_PRIMARY, BTN_SECONDARY } from '../utils/buttonClasses';
import Controls from './Controls';
import ShortcutsOverlay from './ShortcutsOverlay';
import Toast from './Toast';
import VideoSpinner from './VideoSpinner';
import { ActionFeedback } from './ActionFeedback';
import AmbientLayer from './AmbientLayer';

export default function Player({
  source,
  onBack,
  backLabel = 'Home',
  folderPlayback = null,
  keyboardEnabled = true,
  onVideoLoadError,
}) {
  const containerRef = useRef(null);
  const feedbackRef = useRef(null);
  const videoClickTimerRef = useRef(null);
  const objectUrlRef = useRef(null);
  const [videoSrc, setVideoSrc] = useState(null);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [ambientEnabled, setAmbientEnabled] = useState(loadAmbient);
  const { toast, showToast } = useToast();

  const { filename } = source;
  const player = useVideoPlayer(filename);
  const abRepeat = useABRepeat();
  const subtitles = useSubtitles(player.videoRef);
  const { isMiniPlayerActive, toggleMiniPlayer } = useDocumentPiP(player.videoRef, { showToast });
  const videoFilters = useVideoFilters();
  const bookmarks = useBookmarks(filename);
  const { controlsVisible, showControls, toggleControlsVisibility } = useControlsVisibility(
    containerRef,
    player.isPlaying
  );

  const sleepTimer = useSleepTimer(() => {
    player.videoRef.current?.pause();
    showToast('Sleep timer ended');
  });

  const triggerFeedback = useCallback((type, value) => {
    feedbackRef.current?.triggerFeedback(type, value);
  }, []);

  const toggleAmbient = useCallback(() => {
    setAmbientEnabled((prev) => {
      const next = !prev;
      saveAmbient(next);
      return next;
    });
  }, []);

  // Gesture controls for touch devices
  useGestures({
    containerRef,
    enabled: keyboardEnabled,
    seekRelative: player.seekRelative,
    changeVolume: player.changeVolume,
    getVolume: () => player.volume,
    togglePlay: player.togglePlay,
    changeSpeed: player.changeSpeed,
    getSpeed: () => player.speed,
    onBrightnessChange: (val) => videoFilters.updateFilter('brightness', val),
    getBrightness: () => videoFilters.filters.brightness,
    onFeedback: triggerFeedback,
    showControls,
  });

  const handleAddBookmark = useCallback(
    async () => {
      const time = player.videoRef.current?.currentTime;
      if (time === undefined) return;
      const bm = await bookmarks.add(time);
      if (bm) showToast(`Bookmark added at ${formatTime(time)}`);
    },
    [bookmarks, player.videoRef, showToast]
  );

  const cleanupVideo = useCallback(() => {
    const video = player.videoRef.current;
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, [player.videoRef]);

  useEffect(() => {
    subtitles.clear();
  }, [filename]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setIsVideoLoading(true);

    if (source.type === 'file' && source.file) {
      const url = URL.createObjectURL(source.file);
      objectUrlRef.current = url;
      setVideoSrc(url);
    } else if (source.type === 'url' && source.url) {
      setVideoSrc(source.url);
    } else {
      setVideoSrc(null);
    }

    return () => {
      cleanupVideo();
    };
  }, [source, cleanupVideo]);

  useEffect(() => {
    return () => {
      clearTimeout(videoClickTimerRef.current);
      sleepTimer.clear();
      subtitles.clear();
      cleanupVideo();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!abRepeat.isActive) return;
    const video = player.videoRef.current;
    if (!video) return;
    const handleTimeUpdate = () => {
      if (video.currentTime >= abRepeat.pointB) video.currentTime = abRepeat.pointA;
    };
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [abRepeat.isActive, abRepeat.pointA, abRepeat.pointB, player.videoRef]);

  useEffect(() => {
    const video = player.videoRef.current;
    if (!video || !folderPlayback || player.loop) return;
    const handleEnded = () => {
      if (folderPlayback.hasNext) folderPlayback.onNext();
    };
    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, [folderPlayback, player.loop, player.videoRef]);

  const handleScreenshot = useCallback(() => {
    const video = player.videoRef.current;
    if (!video) return;
    captureScreenshot(video);
    showToast('Screenshot saved');
  }, [player.videoRef, showToast]);

  const handleSubtitleDrop = useCallback(
    async (e) => {
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'srt' || ext === 'vtt') {
        e.preventDefault();
        await subtitles.loadFile(file);
      }
    },
    [subtitles]
  );

  const handleDoubleClick = useCallback(() => {
    clearTimeout(videoClickTimerRef.current);
    player.toggleFullscreen(containerRef);
  }, [player]);

  const handleVideoClick = useCallback(() => {
    clearTimeout(videoClickTimerRef.current);
    videoClickTimerRef.current = setTimeout(() => {
      toggleControlsVisibility();
    }, 220);
  }, [toggleControlsVisibility]);

  const handleWheel = useCallback(
    (e) => {
      if (shortcutsOpen || e.target.closest('.shortcuts-card')) return;

      e.preventDefault();
      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 16;
      else if (e.deltaMode === 2) delta *= window.innerHeight;

      const change = -delta * 0.003;
      if (Math.abs(change) < 0.005) return;

      const next = Math.max(0, Math.min(1, player.volume + Math.sign(change) * Math.min(Math.abs(change), 0.08)));
      player.changeVolume(next);
      triggerFeedback('volume', { volume: next, muted: next === 0 });
      showControls();
    },
    [player, showControls, shortcutsOpen, triggerFeedback]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const opts = { passive: false, capture: true };
    el.addEventListener('wheel', handleWheel, opts);
    return () => el.removeEventListener('wheel', handleWheel, opts);
  }, [handleWheel]);

  const handleCanPlay = useCallback(() => {
    setIsVideoLoading(false);
  }, []);

  const handleVideoError = useCallback(() => {
    setIsVideoLoading(false);
    onVideoLoadError?.(source.type);
  }, [onVideoLoadError, source.type]);

  useKeyboard({
    togglePlay: player.togglePlay,
    seekRelative: player.seekRelative,
    seek: player.seek,
    changeVolume: player.changeVolume,
    toggleMute: player.toggleMute,
    toggleFullscreen: () => player.toggleFullscreen(containerRef),
    changeSpeed: player.changeSpeed,
    setSpeed: player.setSpeed,
    setA: abRepeat.setA,
    setB: abRepeat.setB,
    clearAB: abRepeat.clear,
    togglePiP: toggleMiniPlayer,
    toggleLoop: player.toggleLoop,
    toggleSubtitles: subtitles.toggle,
    toggleAmbient,
    takeScreenshot: handleScreenshot,
    folderNext: folderPlayback?.onNext,
    folderPrev: folderPlayback?.onPrev,
    addBookmark: handleAddBookmark,
    toggleFilters: () => {}, // Handled by FilterPanel
    toggleShortcuts: () => setShortcutsOpen((v) => !v),
    closeMenus: () => setShortcutsOpen(false),
    getCurrentTime: () => player.videoRef.current?.currentTime || 0,
    getDuration: () => player.duration,
    getVolume: () => player.volume,
    getSpeed: () => player.speed,
    getIsMuted: () => player.isMuted,
    isPlaying: () => player.isPlaying,
    containerRef,
    hasVideo: keyboardEnabled,
    isABActive: abRepeat.isActive,
    isFullscreen: player.isFullscreen,
    shortcutsOpen,
    hasFolderContext: !!folderPlayback,
    onFeedback: triggerFeedback,
  });

  return (
    <div
      ref={containerRef}
      className={`player-shell${ambientEnabled ? ' player-shell--ambient' : ''}`}
      style={{ cursor: controlsVisible ? 'default' : 'none' }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleSubtitleDrop}
    >
      <div className="player-media">
        <AmbientLayer videoRef={player.videoRef} enabled={ambientEnabled} isPlaying={player.isPlaying} />
        <video
          ref={player.videoRef}
          src={videoSrc}
          className="player-video"
          style={videoFilters.filterStyle}
          onTimeUpdate={player.onTimeUpdate}
          onLoadedMetadata={player.onLoadedMetadata}
          onPlay={player.onPlay}
          onPause={player.onPause}
          onProgress={player.onProgress}
          onCanPlay={handleCanPlay}
          onError={handleVideoError}
          onClick={handleVideoClick}
          onDoubleClick={handleDoubleClick}
          playsInline
          crossOrigin={source.type === 'url' ? 'anonymous' : undefined}
        >
          {subtitles.trackUrl && (
            <track kind="subtitles" src={subtitles.trackUrl} srcLang="en" label="Subtitles" default />
          )}
        </video>
      </div>

      {isVideoLoading && <VideoSpinner />}

      <ActionFeedback ref={feedbackRef} />

      <Controls
        isPlaying={player.isPlaying}
        currentTime={player.currentTime}
        duration={player.duration}
        volume={player.volume}
        isMuted={player.isMuted}
        speed={player.speed}
        isFullscreen={player.isFullscreen}
        buffered={player.buffered}
        loop={player.loop}
        subtitlesEnabled={subtitles.enabled}
        hasSubtitles={subtitles.hasSubtitles}
        ambientEnabled={ambientEnabled}
        isMiniPlayerActive={isMiniPlayerActive}
        visible={controlsVisible}
        onTogglePlay={player.togglePlay}
        onToggleControls={toggleControlsVisibility}
        onSeek={player.seek}
        onVolumeChange={player.changeVolume}
        onToggleMute={player.toggleMute}
        onSpeedChange={player.changeSpeed}
        onToggleFullscreen={() => player.toggleFullscreen(containerRef)}
        onTogglePiP={toggleMiniPlayer}
        onToggleLoop={player.toggleLoop}
        onToggleSubtitles={subtitles.toggle}
        onToggleAmbient={toggleAmbient}
        onLoadSubtitles={subtitles.loadFile}
        onScreenshot={handleScreenshot}
        onToggleShortcuts={() => setShortcutsOpen((v) => !v)}
        onBack={onBack}
        backLabel={backLabel}
        folderPlayback={folderPlayback}
        sleepTimer={sleepTimer}
        videoFilters={videoFilters}
        bookmarks={bookmarks}
        onAddBookmark={handleAddBookmark}
        getCurrentTime={() => player.videoRef.current?.currentTime || 0}
      />

      {player.resumePrompt !== null && (
        <div className="modal-overlay">
          <div className="card" style={{ maxWidth: 360, width: '100%', margin: '0 24px' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Resume playback?</h2>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
              You were at {formatTime(player.resumePrompt)}
            </p>
            <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => player.handleResume(true)} className={`${BTN_PRIMARY} flex-1`}>
                Resume
              </button>
              <button type="button" onClick={() => player.handleResume(false)} className={`${BTN_SECONDARY} flex-1`}>
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}

      {shortcutsOpen && <ShortcutsOverlay onClose={() => setShortcutsOpen(false)} />}
      <Toast toast={toast} />
    </div>
  );
}
