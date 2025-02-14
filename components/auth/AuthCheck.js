import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/authContext';

export default function AuthCheck({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter(); // ✅ Initialize router

  useEffect(() => {
    if (!loading && !user) {
      router.push('/'); // ✅ Redirect only when not loading
    }
  }, [user, loading, router]); // ✅ Include 'loading' in dependencies

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return user ? children : null;
}
