// pages/_app.js
import { useEffect } from 'react';
import { AuthProvider } from "../contexts/authContext";
import {generateToken} from "../lib/firebaseClient";
import CollectionListener from "../components/CollectionListener";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
useEffect(() => {
    generateToken();
  }, []);

  return (
    <AuthProvider>
        <CollectionListener />
      <Component {...pageProps} />
    </AuthProvider>
  );
}


export default MyApp;