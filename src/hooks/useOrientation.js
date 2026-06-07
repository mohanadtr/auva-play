import { useState, useEffect } from 'react';

export function useOrientation() {
  const [isPortrait, setIsPortrait] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(orientation: portrait)').matches : true
  );
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false
  );

  useEffect(() => {
    const portraitMq = window.matchMedia('(orientation: portrait)');
    const mobileMq = window.matchMedia('(max-width: 768px)');

    const update = () => {
      setIsPortrait(portraitMq.matches);
      setIsMobile(mobileMq.matches);
    };

    portraitMq.addEventListener('change', update);
    mobileMq.addEventListener('change', update);
    return () => {
      portraitMq.removeEventListener('change', update);
      mobileMq.removeEventListener('change', update);
    };
  }, []);

  return { isPortrait, isMobile, isPortraitMobile: isPortrait && isMobile, isLandscapeMobile: !isPortrait && isMobile };
}
