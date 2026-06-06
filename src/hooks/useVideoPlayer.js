import { useState, useRef, useCallback, useEffect } from 'react';
import { savePosition, loadPosition, saveVolume, loadVolume, saveSpeed, loadSpeed, loadLoop, saveLoop } from '../utils/storage';
import { snapSpeed } from '../constants/speeds';

/**
 * Core video player hook managing playback state and video element interactions.
 * @param {string|null} filename - Current video filename for persistence
 * @returns {object} Video player state and controls
 */
export function useVideoPlayer(filename) {
  const videoRef = useRef(null);
  const positionSaveInterval = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(loadVolume);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeedState] = useState(loadSpeed);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resumePrompt, setResumePrompt] = useState(null);
  const [buffered, setBuffered] = useState(0);
  const [loop, setLoopState] = useState(loadLoop);

  // Sync volume/speed to video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    video.muted = isMuted;
  }, [volume, isMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    video.preservesPitch = true;
  }, [speed]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.loop = loop;
  }, [loop]);

  // Save position periodically
  useEffect(() => {
    if (!filename) return;

    positionSaveInterval.current = setInterval(() => {
      const video = videoRef.current;
      if (video && video.currentTime > 0) {
        savePosition(filename, video.currentTime);
      }
    }, 5000);

    return () => clearInterval(positionSaveInterval.current);
  }, [filename]);

  // Check for resume position when file changes
  useEffect(() => {
    if (!filename) return;
    const saved = loadPosition(filename);
    if (saved && saved.position > 2) {
      setResumePrompt(saved.position);
    }
  }, [filename]);

  // Fullscreen change listener
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }, []);

  const seek = useCallback((time) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(time, video.duration || 0));
  }, []);

  const seekRelative = useCallback((delta) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.currentTime + delta, video.duration || 0));
  }, []);

  const changeVolume = useCallback((newVol) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolumeState(clamped);
    setIsMuted(clamped === 0);
    saveVolume(clamped);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const changeSpeed = useCallback((newSpeed) => {
    const snapped = snapSpeed(newSpeed);
    setSpeedState(snapped);
    saveSpeed(snapped);
  }, []);

  const setSpeed = useCallback((newSpeed) => {
    const snapped = snapSpeed(newSpeed);
    setSpeedState(snapped);
    saveSpeed(snapped);
  }, []);

  const toggleLoop = useCallback(() => {
    setLoopState((prev) => {
      const next = !prev;
      saveLoop(next);
      return next;
    });
  }, []);

  const toggleFullscreen = useCallback((containerRef) => {
    if (!document.fullscreenElement) {
      containerRef?.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch {
      /* PiP unavailable */
    }
  }, []);

  const handleResume = useCallback((shouldResume) => {
    if (shouldResume && resumePrompt) {
      seek(resumePrompt);
    }
    setResumePrompt(null);
    const video = videoRef.current;
    if (video) {
      video.play();
    }
  }, [resumePrompt, seek]);

  // Video event handlers
  const onTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (video) setCurrentTime(video.currentTime);
  }, []);

  const onLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
    video.volume = volume;
    video.playbackRate = speed;
    video.preservesPitch = true;
    video.loop = loop;
  }, [volume, speed, loop]);

  const onPlay = useCallback(() => setIsPlaying(true), []);
  const onPause = useCallback(() => setIsPlaying(false), []);

  const onProgress = useCallback(() => {
    const video = videoRef.current;
    if (video && video.buffered.length > 0) {
      setBuffered(video.buffered.end(video.buffered.length - 1));
    }
  }, []);

  return {
    videoRef,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    speed,
    isFullscreen,
    resumePrompt,
    buffered,
    loop,
    togglePlay,
    seek,
    seekRelative,
    changeVolume,
    toggleMute,
    changeSpeed,
    setSpeed,
    toggleLoop,
    toggleFullscreen,
    togglePiP,
    handleResume,
    onTimeUpdate,
    onLoadedMetadata,
    onPlay,
    onPause,
    onProgress,
  };
}
