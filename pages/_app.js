// pages/_app.js
import { useEffect } from 'react';
import { AuthProvider } from "../contexts/authContext";
import {generateToken} from "../lib/firebaseClient";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
useEffect(() => {
    generateToken();
  }, []);

  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}


export default MyApp;