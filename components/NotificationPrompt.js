import useFCM from '../hooks/useFCM';

const NotificationPrompt = () => {
  useFCM();

  const enableNotifications = async () => {
    if (Notification.permission === 'granted') {
      console.log('Notifications already enabled');
    } else {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted');
      }
    }
  };

  return (
    <button onClick={enableNotifications}>
      Enable Notifications
    </button>
  );
};

export default NotificationPrompt;