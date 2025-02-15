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
      navigator.serviceWorker.getRegistration().then((existingReg) => {
        if (!existingReg) {
          navigator.serviceWorker
            .register("/sw.js")
            .then((reg) => {
              console.log("✅ SW Registered:", reg);
              reg.addEventListener("statechange", (event) => {
                if (event.target.state === "activated") {
                  console.log("Service Worker activated!");
                }
              });
            })
            .catch((err) => console.error("❌ SW Registration Failed:", err));
        } else {
          console.log("🔄 Using existing SW:", existingReg);
          if (existingReg.active) {
            console.log("Service Worker is already active.");
          } else {
            existingReg.addEventListener("statechange", (event) => {
              if (event.target.state === "activated") {
                console.log("Service Worker activated!");
              }
            });
          }
        }
      });
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
