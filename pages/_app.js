// pages/_app.js
import { useEffect, useState } from "react";
import { AuthProvider } from "../contexts/authContext";
import NotificationPermission from "../components/NotificationPermission";
import CollectionListener from "../components/CollectionListener";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  const [showPermission, setShowPermission] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);

// Register the service worker and handle updates
useEffect(() => {
  if ("serviceWorker" in navigator) {
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("Service Worker Registered");
        setSwRegistration(registration);

        // Ensure the service worker is active before sending messages
        if (registration.active) {
          console.log("Service Worker is active");
        } else {
          registration.addEventListener("statechange", () => {
            if (registration.active) {
              console.log("Service Worker is now active");
              setSwRegistration(registration);
            }
          });
        }

        // Handle service worker updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "activated") {
              console.log("Service Worker updated and activated");
            }
          });
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
      // Wait a moment to ensure the interaction is intentional
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
