import { useRef, useCallback, useState } from 'react';
import {
  Play,
  Pause,
  PictureInPicture2,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  ChevronLeft,
  SkipBack,
  SkipForward,
  Repeat,
  Subtitles,
  Camera,
  Keyboard,
  Sparkles,
} from 'lucide-react';
import { formatTime, formatRemainingTime } from '../utils/formatTime';
import { loadTimeDisplayMode, saveTimeDisplayMode } from '../utils/storage';
import { BTN_ICON } from '../utils/buttonClasses';
import SpeedControl from './SpeedControl';
import SleepTimerControl from './SleepTimerControl';

export default function Controls({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  speed,
  isFullscreen,
  buffered,
  loop,
  subtitlesEnabled,
  hasSubtitles,
  ambientEnabled,
  isMiniPlayerActive,
  visible,
  onTogglePlay,
  onToggleControls,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onSpeedChange,
  onToggleFullscreen,
  onTogglePiP,
  onToggleLoop,
  onToggleSubtitles,
  onToggleAmbient,
  onLoadSubtitles,
  onScreenshot,
  onToggleShortcuts,
  onBack,
  backLabel,
  folderPlayback,
  sleepTimer,
}) {
  const seekBarRef = useRef(null);
  const volumeBarRef = useRef(null);
  const subtitleInputRef = useRef(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [volumeSliderHover, setVolumeSliderHover] = useState(false);
  const [isVolumeDragging, setIsVolumeDragging] = useState(false);
  const [timeDisplayMode, setTimeDisplayMode] = useState(loadTimeDisplayMode);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  const toggleTimeDisplay = useCallback(() => {
    setTimeDisplayMode((prev) => {
      const next = prev === 'elapsed' ? 'remaining' : 'elapsed';
      saveTimeDisplayMode(next);
      return next;
    });
  }, []);

  const handleSeekBarClick = useCallback(
    (e) => {
      const rect = seekBarRef.current?.getBoundingClientRect();
      if (!rect || !duration) return;
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      onSeek((x / rect.width) * duration);
    },
    [duration, onSeek]
  );

  const handleSeekBarMouseMove = useCallback(
    (e) => {
      const rect = seekBarRef.current?.getBoundingClientRect();
      if (!rect || !duration) return;
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const percent = x / rect.width;
      const tooltipX = Math.max(24, Math.min(x, rect.width - 24));
      setHoverTime(percent * duration);
      setHoverPosition(tooltipX);
      if (isSeeking) onSeek(percent * duration);
    },
    [duration, isSeeking, onSeek]
  );

  const handleSeekBarMouseDown = useCallback(
    (e) => {
      setIsSeeking(true);
      handleSeekBarClick(e);
      const handleMouseMove = (ev) => {
        const rect = seekBarRef.current?.getBoundingClientRect();
        if (!rect || !duration) return;
        const x = Math.max(0, Math.min(ev.clientX - rect.left, rect.width));
        onSeek((x / rect.width) * duration);
      };
      const handleMouseUp = () => {
        setIsSeeking(false);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [duration, handleSeekBarClick, onSeek]
  );

  const updateVolumeFromClientX = useCallback(
    (clientX) => {
      const rect = volumeBarRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      onVolumeChange(x / rect.width);
    },
    [onVolumeChange]
  );

  const handleVolumePointerDown = useCallback(
    (e) => {
      e.preventDefault();
      setIsVolumeDragging(true);
      setShowVolumeSlider(true);
      setVolumeSliderHover(true);
      updateVolumeFromClientX(e.clientX);

      const pointerId = e.pointerId;
      volumeBarRef.current?.setPointerCapture(pointerId);

      const handlePointerMove = (ev) => {
        if (ev.pointerId !== pointerId) return;
        updateVolumeFromClientX(ev.clientX);
      };

      const handlePointerUp = (ev) => {
        if (ev.pointerId !== pointerId) return;
        setIsVolumeDragging(false);
        volumeBarRef.current?.releasePointerCapture(pointerId);
        volumeBarRef.current?.removeEventListener('pointermove', handlePointerMove);
        volumeBarRef.current?.removeEventListener('pointerup', handlePointerUp);
        volumeBarRef.current?.removeEventListener('pointercancel', handlePointerUp);
      };

      volumeBarRef.current?.addEventListener('pointermove', handlePointerMove);
      volumeBarRef.current?.addEventListener('pointerup', handlePointerUp);
      volumeBarRef.current?.addEventListener('pointercancel', handlePointerUp);
    },
    [updateVolumeFromClientX]
  );

  const handleSubtitleFile = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) onLoadSubtitles(file);
      e.target.value = '';
    },
    [onLoadSubtitles]
  );

  const effectiveVolume = isMuted ? 0 : volume;
  const timeDisplay =
    timeDisplayMode === 'remaining'
      ? formatRemainingTime(currentTime, duration)
      : `${formatTime(currentTime)} / ${formatTime(duration)}`;

  return (
    <div
      className="controls-overlay"
      style={{
        opacity: visible || isSeeking ? 1 : 0,
        pointerEvents: visible || isSeeking ? 'auto' : 'none',
        transition: 'opacity 300ms ease',
      }}
    >
      <div className="controls-gradient-top" aria-hidden />
      <div className="controls-top">
        <div className="controls-top__row">
          {onBack ? (
            <button type="button" onClick={onBack} className="player-back-btn">
              <ChevronLeft size={14} />
              <span className="player-back-btn__label">{backLabel}</span>
            </button>
          ) : (
            <span className="controls-brand">Auva Play</span>
          )}
          <button
            type="button"
            onClick={onToggleShortcuts}
            className={`${BTN_ICON} shortcuts-trigger`}
            title="Keyboard shortcuts (?)"
          >
            <Keyboard size={14} />
          </button>
        </div>
      </div>

      <div className="controls-spacer" onClick={onToggleControls} />

      <div className="controls-gradient-bottom" aria-hidden />

      <div className="controls-bar">
        <div
          ref={seekBarRef}
          className={`seek-bar${isSeeking ? ' seek-bar--seeking' : ''}`}
          onMouseDown={handleSeekBarMouseDown}
          onMouseMove={handleSeekBarMouseMove}
          onMouseLeave={() => setHoverTime(null)}
        >
          <div className="seek-bar__track">
            <div className="seek-bar__buffered" style={{ width: `${bufferedPercent}%` }} />
            <div className="seek-bar__progress" style={{ width: `${progress}%` }} />
          </div>
          <div className="seek-bar__thumb" style={{ left: `calc(${progress}% - 6px)` }} />
          {hoverTime !== null && (
            <div className="seek-bar__tooltip" style={{ left: `${hoverPosition}px` }}>
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        <div className="controls-row">
          <div className="controls-row__left">
            <button
              type="button"
              onClick={onTogglePlay}
              className={BTN_ICON}
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>

            <button type="button" onClick={toggleTimeDisplay} className="time-display" title="Toggle time display">
              {timeDisplay}
            </button>

            <div
              className="volume-control"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => {
                if (isVolumeDragging) return;
                setShowVolumeSlider(false);
                setVolumeSliderHover(false);
              }}
            >
              <button type="button" onClick={onToggleMute} className={BTN_ICON} title="Mute (M)">
                {effectiveVolume === 0 ? (
                  <VolumeX size={18} />
                ) : effectiveVolume < 0.5 ? (
                  <Volume1 size={18} />
                ) : (
                  <Volume2 size={18} />
                )}
              </button>
              <div
                className={`volume-control__slider-wrap${showVolumeSlider ? ' volume-control__slider-wrap--open' : ''}`}
              >
                <div
                  ref={volumeBarRef}
                  className={`volume-bar${volumeSliderHover || isVolumeDragging ? ' volume-bar--hover' : ''}${isVolumeDragging ? ' volume-bar--dragging' : ''}`}
                  onPointerDown={handleVolumePointerDown}
                  onMouseEnter={() => setVolumeSliderHover(true)}
                  onMouseLeave={() => {
                    if (!isVolumeDragging) setVolumeSliderHover(false);
                  }}
                >
                  <div className="volume-bar__track">
                    <div className="volume-bar__fill" style={{ width: `${effectiveVolume * 100}%` }} />
                  </div>
                  <div
                    className="volume-bar__thumb"
                    style={{ left: `${effectiveVolume * 100}%` }}
                    aria-hidden
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="controls-row__right">
            {folderPlayback && (
              <>
                <button
                  type="button"
                  className={BTN_ICON}
                  onClick={folderPlayback.onPrev}
                  disabled={!folderPlayback.hasPrev}
                  title="Previous file (P)"
                  style={{ opacity: folderPlayback.hasPrev ? 1 : 0.35 }}
                >
                  <SkipBack size={18} />
                </button>
                <button
                  type="button"
                  className={BTN_ICON}
                  onClick={folderPlayback.onNext}
                  disabled={!folderPlayback.hasNext}
                  title="Next file (N)"
                  style={{ opacity: folderPlayback.hasNext ? 1 : 0.35 }}
                >
                  <SkipForward size={18} />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onToggleLoop}
              className={`${BTN_ICON} loop-btn${loop ? ' loop-btn--active' : ''}`}
              title="Loop (Ctrl+L)"
            >
              <Repeat size={18} />
            </button>

            <button
              type="button"
              onClick={onToggleAmbient}
              className={`${BTN_ICON} ambient-btn${ambientEnabled ? ' ambient-btn--active' : ''}`}
              title="Ambient mode (G)"
              style={{ opacity: ambientEnabled ? 1 : 0.55 }}
            >
              <Sparkles size={18} />
            </button>

            <button
              type="button"
              onClick={() => (hasSubtitles ? onToggleSubtitles() : subtitleInputRef.current?.click())}
              className={`${BTN_ICON} cc-btn${subtitlesEnabled && hasSubtitles ? ' cc-btn--active' : ''}`}
              title="Subtitles (C)"
              style={{ opacity: hasSubtitles && subtitlesEnabled ? 1 : hasSubtitles ? 0.7 : 0.4 }}
            >
              <Subtitles size={18} />
            </button>
            <input
              ref={subtitleInputRef}
              type="file"
              accept=".srt,.vtt"
              className="hidden"
              onChange={handleSubtitleFile}
              aria-hidden
            />

            <SleepTimerControl timer={sleepTimer} />

            <button type="button" onClick={onScreenshot} className={BTN_ICON} title="Screenshot (Ctrl+S)">
              <Camera size={18} />
            </button>

            <SpeedControl speed={speed} onSpeedChange={onSpeedChange} />

            <button
              type="button"
              onClick={onTogglePiP}
              className={`${BTN_ICON} pip-btn${isMiniPlayerActive ? ' pip-btn--active' : ''}`}
              title="Mini Player (T)"
            >
              <PictureInPicture2 size={18} />
            </button>

            <button type="button" onClick={onToggleFullscreen} className={BTN_ICON} title="Fullscreen (F)">
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
