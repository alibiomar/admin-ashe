import { AuthProvider } from "../contexts/authContext";
import "../styles/globals.css";
import {PushSubscription} from "../components/PushSubscription";
function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <PushSubscription />
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;