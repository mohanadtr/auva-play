import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Volume1, VolumeX } from 'lucide-react';
import { formatSpeedBadge } from '../constants/speeds';

function formatSeekLabel(seconds) {
  const sign = seconds > 0 ? '+' : '';
  return `${sign}${seconds}s`;
}

export const ActionFeedback = forwardRef(function ActionFeedback(_props, ref) {
  const [feedback, setFeedback] = useState(null);
  const [animKey, setAnimKey] = useState(0);
  const timeoutRef = useRef(null);

  const triggerFeedback = useCallback((type, value) => {
    clearTimeout(timeoutRef.current);
    setFeedback({ type, value });
    setAnimKey((k) => k + 1);
    timeoutRef.current = setTimeout(() => setFeedback(null), 700);
  }, []);

  useImperativeHandle(ref, () => ({ triggerFeedback }), [triggerFeedback]);

  useEffect(
    () => () => {
      clearTimeout(timeoutRef.current);
    },
    []
  );

  if (!feedback) return null;

  const { type, value } = feedback;

  if (type === 'play') {
    const isPausing = value === 'pause';
    return (
      <div className="action-feedback" aria-hidden>
        <div className="action-feedback__center">
          <div key={animKey} className="action-feedback__pulse">
            <div className="action-feedback__circle">
              {isPausing ? (
                <Pause size={72} color="#fff" fill="#fff" />
              ) : (
                <Play size={72} color="#fff" fill="#fff" />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'seek') {
    const isLeft = value.direction === 'left';
    return (
      <div className="action-feedback" aria-hidden>
        <div className={`action-feedback__seek${isLeft ? ' action-feedback__seek--left' : ' action-feedback__seek--right'}`}>
          <div key={animKey} className="action-feedback__pulse action-feedback__seek-content">
            <div className="action-feedback__circle action-feedback__circle--seek">
              {isLeft ? <SkipBack size={32} color="#fff" /> : <SkipForward size={32} color="#fff" />}
            </div>
            <span className="action-feedback__seek-label">{formatSeekLabel(value.seconds)}</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'speed') {
    const label = value.reset ? 'Reset' : formatSpeedBadge(value.speed);
    return (
      <div className="action-feedback" aria-hidden>
        <div className="action-feedback__center">
          <div key={animKey} className="action-feedback__pulse">
            <div className="action-feedback__speed">{label}</div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'volume') {
    const { muted, volume } = value;
    const pct = Math.round(volume * 100);
    return (
      <div className="action-feedback" aria-hidden>
        <div className="action-feedback__volume-anchor">
          <div key={animKey} className="action-feedback__volume action-feedback__pulse">
            {muted || volume === 0 ? (
              <VolumeX size={18} color="#fff" />
            ) : volume < 0.5 ? (
              <Volume1 size={18} color="#fff" />
            ) : (
              <Volume2 size={18} color="#fff" />
            )}
            <span>{muted ? 'Muted' : `${pct}%`}</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
});
