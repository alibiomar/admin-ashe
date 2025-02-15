// pages/_app.js
import { useEffect, useState } from "react";
import { AuthProvider } from "../contexts/authContext";
import NotificationPermission from "../components/NotificationPermission";
import CollectionListener from "../components/CollectionListener";
import { registerServiceWorker } from "../lib/serviceWorkerUtils";
import "../styles/globals.css";
import { useRouter } from 'next/router'; // Add this import

function MyApp({ Component, pageProps }) {
  const [showPermission, setShowPermission] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);
  const [isSwReady, setIsSwReady] = useState(false);
  const router = useRouter(); // Initialize router
  const { storeCode } = router.query;
  useEffect(() => {
    if (storeCode) {
      const manifestElement = document.getElementById("manifest");
      const manifestString = JSON.stringify({
        ...manifest,
        start_url: `/s/${storeCode}`,
      });
      manifestElement?.setAttribute(
        "href",
        "data:application/json;charset=utf-8," + encodeURIComponent(manifestString),
      );
    }
  }, [storeCode]);
  // Service Worker registration and management
  useEffect(() => {
    const initServiceWorker = async () => {
      try {
        const registration = await registerServiceWorker();
        if (registration) {
          setSwRegistration(registration);
          
          // Handle Service Worker state changes
          const handleStateChange = (event) => {
            console.log(`Service Worker state changed to: ${event.target.state}`);
            if (event.target.state === "activated") {
              console.log("🚀 Service Worker activated!");
              setIsSwReady(true);
            }
          };

          registration.addEventListener("statechange", handleStateChange);

          // Cleanup listener
          return () => {
            registration.removeEventListener("statechange", handleStateChange);
          };
        }
      } catch (error) {
        console.error("❌ Service Worker initialization failed:", error);
      }
    };

    initServiceWorker();
  }, []);

  // Notification permission management with user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      if (Notification.permission === "default") {
        setShowPermission(true);
        removeEventListeners();
      }
    };

    const removeEventListeners = () => {
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("scroll", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
    };

    // Add event listeners with debounce
    const debouncedInteraction = debounce(handleUserInteraction, 1000);
    window.addEventListener("click", debouncedInteraction);
    window.addEventListener("scroll", debouncedInteraction);
    window.addEventListener("keydown", debouncedInteraction);

    return removeEventListeners;
  }, []);

  // Error boundary and monitoring
  useEffect(() => {
    const handleError = (error) => {
      console.error("Application Error:", error);
      // Implement error reporting/handling as needed
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  return (
    <AuthProvider>
      {showPermission && <NotificationPermission />}
      {isSwReady && swRegistration && (
        <CollectionListener swRegistration={swRegistration} />
      )}
      <Component {...pageProps} />
    </AuthProvider>
  );
}

// Utility function for debouncing
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export default MyApp;