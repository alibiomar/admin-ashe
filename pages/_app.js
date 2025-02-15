import { AuthProvider } from "../contexts/authContext";
import "../styles/globals.css";
import { useEffect } from 'react';

import NotificationPrompt from '../components/NotificationPrompt';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/firebase-messaging-sw.js');
    }
  }, []);

  return (
    <AuthProvider>
      <Component {...pageProps} />
      <NotificationPrompt />

    </AuthProvider>
  );
}

export default MyApp;