'use client';

import { AuthProvider } from "../contexts/authContext";
import "../styles/globals.css";

import NotificationHandler from '../components/NotificationHandler';

function MyApp({ Component, pageProps }) {

  return (
    <AuthProvider>
      <Component {...pageProps} />
      <NotificationHandler />

    </AuthProvider>
  );
}

export default MyApp;