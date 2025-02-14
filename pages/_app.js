// pages/_app.js
import { useEffect, useState } from "react";
import { AuthProvider } from "../contexts/authContext";
import NotificationPermission from "../components/NotificationPermission";
import "../styles/globals.css";
import CollectionListener from "../components/CollectionListener";

function MyApp({ Component, pageProps }) {
  const [showPermission, setShowPermission] = useState(false);

  // Register the service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("Service Worker Registered"))
        .catch((err) => console.error("Service Worker Registration Failed:", err));
    }
  }, []);

  // Delay showing the permission request until the user interacts with the app
  useEffect(() => {
    const handleUserInteraction = () => {
      setShowPermission(true);
      // Remove the event listener after the first interaction
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("scroll", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
    };

    // Wait for user interaction before showing the permission request
    window.addEventListener("click", handleUserInteraction);
    window.addEventListener("scroll", handleUserInteraction);
    window.addEventListener("keydown", handleUserInteraction);

    return () => {
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("scroll", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
    };
  }, []);

  return (
    <AuthProvider>
      {/* Show NotificationPermission after user interaction */}
      {showPermission && <NotificationPermission />}
      <CollectionListener />

      {/* Render the page component */}
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;