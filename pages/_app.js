// pages/_app.js
import { useEffect, useState } from "react";
import { AuthProvider } from "../contexts/authContext";
import NotificationPermission from "../components/NotificationPermission";
import CollectionListener from "../components/CollectionListener";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  const [showPermission, setShowPermission] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js");

          // If the service worker is already active, set it immediately
          if (registration.active) {
            setSwRegistration(registration);
          }

          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "activated") {
                  setSwRegistration(registration);
                }
              });
            }
          });
        } catch (err) {
          console.error("Service Worker Registration Failed:", err);
        }
      };

      registerSW();
    }
  }, []);

  // Delay showing the notification permission request until user interaction
  useEffect(() => {
    let interactionTimeout;

    const handleUserInteraction = () => {
      interactionTimeout = setTimeout(() => {
        setShowPermission(true);
        removeEventListeners();
      }, 1000);
    };

    const removeEventListeners = () => {
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("scroll", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
    };

    window.addEventListener("click", handleUserInteraction);
    window.addEventListener("scroll", handleUserInteraction);
    window.addEventListener("keydown", handleUserInteraction);

    return () => {
      clearTimeout(interactionTimeout);
      removeEventListeners();
    };
  }, []);

  return (
    <AuthProvider>
      {showPermission && <NotificationPermission />}
      {swRegistration && <CollectionListener swRegistration={swRegistration} />}
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;
