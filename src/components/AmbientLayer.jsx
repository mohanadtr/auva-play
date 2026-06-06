import { useEffect, useRef } from 'react';

export default function AmbientLayer({ videoRef, enabled, isPlaying }) {
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return undefined;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return undefined;

    const draw = () => {
      if (video.readyState >= 2) {
        try {
          ctx.drawImage(video, 0, 0, 64, 36);
        } catch {
          /* frame not ready */
        }
      }
    };

    if (isPlaying) {
      draw();
      intervalRef.current = setInterval(draw, 100);
    }

    return () => {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [videoRef, enabled, isPlaying]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="ambient-layer"
      width={64}
      height={36}
      aria-hidden
    />
  );
}
