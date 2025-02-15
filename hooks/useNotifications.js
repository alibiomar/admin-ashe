// hooks/useNotifications.js
import { useEffect, useCallback, useState } from 'react';

export const useNotifications = (swRegistration) => {
  const [permission, setPermission] = useState('default');
  const [isSupported, setIsSupported] = useState(false);

  // Check notification support
  useEffect(() => {
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
  }, []);

  // Request permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }, [isSupported]);

  // Notification sender with enhanced retry
  const sendNotification = useCallback(async (payload, retryOptions = {}) => {
    if (!swRegistration || !isSupported) {
      throw new Error('Notifications not supported or SW not ready');
    }

    const defaultOptions = {
      retries: 5,
      retryDelay: 2000,
      backoffFactor: 2
    };
    const options = { ...defaultOptions, ...retryOptions };

    let attempt = 0;
    const send = async () => {
      attempt++;
      try {
        await swRegistration.showNotification(payload.title, payload);
        return true;
      } catch (error) {
        if (attempt <= options.retries) {
          const delay = options.retryDelay * Math.pow(options.backoffFactor, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          return send();
        }
        throw error;
      }
    };

    return send();
  }, [swRegistration, isSupported]);

  return { isSupported, permission, requestPermission, sendNotification };
};