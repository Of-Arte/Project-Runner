import { useState, useEffect } from "react";
import { useViewMode } from "./useViewMode";

export interface DeviceOrientation {
  isPortrait: boolean;
  isLandscape: boolean;
  isDesktop: boolean;
  isTablet: boolean;
  isPhone: boolean;
  viewMode: 'desktop' | 'mobile-portrait' | 'tablet-landscape';
}

export const useDeviceOrientation = (): DeviceOrientation => {
  const { viewMode: baseViewMode, isStandalone } = useViewMode();
  const [orientation, setOrientation] = useState<DeviceOrientation>({
    isPortrait: false,
    isLandscape: true,
    isDesktop: true,
    isTablet: false,
    isPhone: false,
    viewMode: 'desktop'
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isLandscape = width > height;
      const isPortrait = !isLandscape;
      
      // Basic heuristics for device type
      // Desktop: No touch (handled by useViewMode, but we double check width here for responsiveness)
      // Tablet: roughly 768px - 1024px width in portrait, or larger but touch capable
      // Phone: < 768px width in portrait
      
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isDesktop = !isTouch; // Simplified for this game context
      
      // Tablet detection roughly
      const isTablet = isTouch && (Math.min(width, height) >= 768);
      const isPhone = isTouch && !isTablet;

      let currentViewMode: 'desktop' | 'mobile-portrait' | 'tablet-landscape' = 'desktop';

      if (isDesktop) {
        currentViewMode = 'desktop';
      } else if (isTablet) {
        currentViewMode = 'tablet-landscape'; // Enforce landscape for tablets logic
      } else {
        currentViewMode = isPortrait ? 'mobile-portrait' : 'tablet-landscape'; // Phones in landscape treated like tablets/desktop for rendering? Or just "wrong orientation"?
        // For this specific requirement: "Keep phones in portrait mode"
        if (isPhone && isLandscape) {
             // If phone is landscape, we might want to still show "desktop" view but small?
             // Or maybe we treat phone-landscape as "tablet-landscape" view.
             currentViewMode = 'tablet-landscape';
        } else if (isPhone && isPortrait) {
             currentViewMode = 'mobile-portrait';
        }
      }

      setOrientation({
        isPortrait,
        isLandscape,
        isDesktop,
        isTablet,
        isPhone,
        viewMode: currentViewMode
      });
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener("resize", handleResize);
  }, [baseViewMode]);

  return orientation;
};
