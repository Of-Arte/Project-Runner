import { useState, useEffect } from 'react';

export type ViewMode = 'desktop' | 'mobile' | 'webapp';

interface ViewModeResult {
  viewMode: ViewMode;
  isStandalone: boolean;
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export const useViewMode = (): ViewModeResult => {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [isStandalone, setIsStandalone] = useState(false);
  const [safeAreaInsets, setSafeAreaInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  });

  useEffect(() => {
    const detectViewMode = () => {
      // Check if running in standalone mode (PWA)
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');
      
      setIsStandalone(standalone);

      // Detect if device is touch-capable
      const isTouchCapable = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isNarrowScreen = window.innerWidth < 1024;

      // Determine view mode
      if (!isTouchCapable || !isNarrowScreen) {
        setViewMode('desktop');
      } else if (standalone) {
        setViewMode('webapp');
      } else {
        setViewMode('mobile');
      }

      // Get safe area insets (primarily for iOS PWAs)
      if (standalone && CSS.supports('padding-top: env(safe-area-inset-top)')) {
        const computedStyle = getComputedStyle(document.documentElement);
        setSafeAreaInsets({
          top: parseInt(computedStyle.getPropertyValue('padding-top')) || 0,
          bottom: parseInt(computedStyle.getPropertyValue('padding-bottom')) || 0,
          left: parseInt(computedStyle.getPropertyValue('padding-left')) || 0,
          right: parseInt(computedStyle.getPropertyValue('padding-right')) || 0
        });
      }
    };

    detectViewMode();
    
    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => detectViewMode();
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    }

    window.addEventListener('resize', detectViewMode);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      }
      window.removeEventListener('resize', detectViewMode);
    };
  }, []);

  return { viewMode, isStandalone, safeAreaInsets };
};
