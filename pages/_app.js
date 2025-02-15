
import { AuthProvider } from "../contexts/authContext";
import "../styles/globals.css";
import { useEffect } from "react";


function MyApp({ Component, pageProps }) {
  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;