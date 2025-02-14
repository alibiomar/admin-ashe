// components/NotificationPermission.js
import { useEffect, useState } from 'react';
import styles from './NotificationPermission.module.css'; // Create corresponding CSS module

export default function NotificationPermission() {
  const [permission, setPermission] = useState('default');
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Check browser support
    if (!('Notification' in window) || !navigator.serviceWorker) {
      setIsSupported(false);
      return;
    }

    // Initialize permission state
    setPermission(Notification.permission);
  }, []);

  const handlePermissionRequest = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        console.log('Notification permission granted');
        // You could add additional setup here, like subscribing to push notifications
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setPermission('denied');
    }
  };

  if (!isSupported) {
    return (
      <div className={styles.warning}>
        🔔 This browser does not support notifications or service workers
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {permission === 'default' && (
        <div className={styles.permissionRequest}>
          <p>We'd like to send you notifications for important updates</p>
          <button 
            className={styles.permissionButton}
            onClick={handlePermissionRequest}
          >
            Enable Notifications
          </button>
        </div>
      )}

      {permission === 'granted' && (
        <div className={styles.success}>
          ✅ Notifications are enabled
        </div>
      )}

      {permission === 'denied' && (
        <div className={styles.warning}>
          🔕 Notifications are blocked. Please enable them in your browser settings
        </div>
      )}
    </div>
  );
}