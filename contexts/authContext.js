import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth, authService } from "../lib/auth";

const AuthContext = createContext({
  user: null,
  loading: true,
  error: null,
  setUser: () => {},
  setLoading: () => {},
  setError: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      setLoading(true);
      setError(null);

      if (authUser) {
        try {
          const isAdmin = await authService.verifyAdminStatus(authUser.uid);
          if (isAdmin) {
            setUser(authUser);
          } else {
            await authService.logout();
            setError("Access denied: Not an admin.");
          }
        } catch (err) {
          setError(err.message);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, setUser, setLoading, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useProtectedRoute() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);
}