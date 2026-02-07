import { useState, useEffect } from 'react';

export const useDeviceType = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkDevice = () => {
      const touchCapable = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      // Also check width to be sure, as some laptops have touchscreens
      const isNarrow = window.innerWidth < 1024;
      
      const mobile = touchCapable && isNarrow;
      
      setIsMobile(mobile);
      setIsDesktop(!mobile);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { isMobile, isDesktop };
};
