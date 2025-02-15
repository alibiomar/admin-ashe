// pages/_app.js
import { useEffect, useState } from "react";
import { AuthProvider } from "../contexts/authContext";
import NotificationPermission from "../components/NotificationPermission";
import CollectionListener from "../components/CollectionListener";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  const [showPermission, setShowPermission] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);

  // Service Worker registration and management
  useEffect(() => {
    const registerServiceWorker = async () => {
      if (!("serviceWorker" in navigator)) {
        console.log("❌ Service Workers not supported");
        return;
      }

      try {
        // Check for existing registration
        const existingReg = await navigator.serviceWorker.getRegistration();
        
        if (existingReg) {
          console.log("🔄 Using existing SW:", existingReg);
          setSwRegistration(existingReg);
          
          if (existingReg.active) {
            console.log("✅ Service Worker is already active");
          }
          
          // Monitor state changes for existing registration
          existingReg.addEventListener("statechange", (event) => {
            console.log(`Service Worker state changed to: ${event.target.state}`);
            if (event.target.state === "activated") {
              console.log("🚀 Service Worker activated!");
            }
          });
          
        } else {
          // Register new Service Worker
          const newRegistration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/"
          });
          
          console.log("✅ SW Registered:", newRegistration);
          setSwRegistration(newRegistration);

          // Monitor state changes for new registration
          newRegistration.addEventListener("statechange", (event) => {
            console.log(`Service Worker state changed to: ${event.target.state}`);
            if (event.target.state === "activated") {
              console.log("🚀 Service Worker activated!");
            }
          });
        }

      } catch (error) {
        console.error("❌ SW Registration Failed:", error);
      }
    };

    registerServiceWorker();

    // Cleanup function
    return () => {
      if (swRegistration) {
        // Remove event listeners if needed
        swRegistration.removeEventListener("statechange", () => {});
      }
    };
  }, []);

  // Notification permission management
  useEffect(() => {
    let interactionTimeout;
    let isSubscribed = false;

    const handleUserInteraction = () => {
      if (isSubscribed) return;
      
      interactionTimeout = setTimeout(() => {
        setShowPermission(true);
        removeEventListeners();
        isSubscribed = true;
      }, 1000);
    };

    const removeEventListeners = () => {
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("scroll", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
    };

    // Add event listeners
    window.addEventListener("click", handleUserInteraction);
    window.addEventListener("scroll", handleUserInteraction);
    window.addEventListener("keydown", handleUserInteraction);

    // Cleanup function
    return () => {
      clearTimeout(interactionTimeout);
      removeEventListeners();
    };
  }, []);

  // Optional: Add error boundary
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
      {swRegistration && <CollectionListener swRegistration={swRegistration} />}
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;