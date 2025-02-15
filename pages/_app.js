import { useEffect } from 'react';
import { AuthProvider } from "../contexts/authContext";
import { generateToken } from "../lib/firebaseClient";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Ensure the code is running on the client-side (browser) and handle async call
    if (typeof window !== "undefined") {
      const initializeToken = async () => {
        try {
          await generateToken(); // If it's an async function
        } catch (error) {
          console.error("Error generating token:", error);
        }
      };

      initializeToken();
    }
  }, []); // Empty dependency array, ensures it runs only once when the component mounts

  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;
