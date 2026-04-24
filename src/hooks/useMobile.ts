import { useState, useEffect } from 'react';

/**
 * Hook to detect if the user's device is a mobile or tablet.
 * It uses both screen width and navigator.userAgent for improved detection.
 */
export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileAgent = /iphone|ipad|ipod|android|blackberry|mini|windows\sphone/i.test(userAgent);
      
      // On desktop simulation (chrome dev tools), we want to respect the width too
      setIsMobile(width < 768 || isMobileAgent);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
