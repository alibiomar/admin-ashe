// hooks/useServiceWorker.js
import { useEffect, useState } from 'react';

export const useServiceWorker = () => {
  const [registration, setRegistration] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const registerSW = async () => {
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none'
          });
          
          // Wait until the service worker is controlling the page
          if (reg.active && !navigator.serviceWorker.controller) {
            await new Promise(resolve => {
              navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
            });
          }

          setRegistration(reg);
          setIsReady(true);
        }
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        setIsReady(false);
      }
    };

    const handleControllerChange = () => {
      setIsReady(!!navigator.serviceWorker.controller);
    };

    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      registerSW();
    }

    return () => {
      navigator.serviceWorker?.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  return { registration, isReady };
};