import { useState, useEffect } from 'react';

export const useDeviceType = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkDevice = () => {
      const touchCapable = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      // Also check width to be sure, as some laptops have touchscreens
      const isNarrow = window.innerWidth < 1024;
      
      // Allow mobile mode if screen is phone-sized (e.g. < 768) even if no touch (for dev testing)
      const isPhoneSize = window.innerWidth < 768; 

      const mobile = (touchCapable && isNarrow) || isPhoneSize;
      
      setIsMobile(mobile);
      setIsDesktop(!mobile);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { isMobile, isDesktop };
};
