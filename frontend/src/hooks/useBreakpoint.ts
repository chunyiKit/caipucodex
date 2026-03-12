import { useEffect, useState } from 'react';

function getWidth() {
  if (typeof window === 'undefined') return 1280;
  return window.innerWidth;
}

export function useBreakpoint() {
  const [width, setWidth] = useState(getWidth);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return {
    width,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1200,
    isDesktop: width >= 1200,
  };
}
