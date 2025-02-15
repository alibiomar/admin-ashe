// pages/_app.js
import { useEffect, useState } from "react";
import { AuthProvider } from "../contexts/authContext";
import NotificationPermission from "../components/NotificationPermission";
import CollectionListener from "../components/CollectionListener";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  const [showPermission, setShowPermission] = useState(false);




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
        <CollectionListener />
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