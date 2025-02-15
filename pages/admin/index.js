import { useEffect, useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import AuthCheck from '../../components/auth/AuthCheck';
import { messaging, getToken } from '../../lib/firebaseClient';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

    async function requestFCMToken() {
      try {
        const token = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
        if (token) {
          console.log("FCM Token:", token);
              await fetch("/api/saveAdminToken", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fcmToken: token }),
          });
        } else {
          console.log("No registration token available. Request permission.");
        }
      } catch (error) {
        console.error("Error retrieving FCM token:", error);
      }
    }
    requestFCMToken();


  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/stats');
        if (!response.ok) throw new Error('Failed to fetch stats');
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <AuthCheck>
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          
          {loading && <p>Loading stats...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {stats && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg shadow">
                <h2 className="text-xl font-semibold">Total Orders</h2>
                <p>{stats.totalOrders}</p>
              </div>
              <div className="p-4 border rounded-lg shadow">
                <h2 className="text-xl font-semibold">Total Revenue</h2>
                <p>{stats.totalRevenue.toFixed(2)} TND</p>
              </div>
              <div className="p-4 border rounded-lg shadow">
                <h2 className="text-xl font-semibold">Total Products</h2>
                <p>{stats.totalProducts}</p>
              </div>
              <div className="p-4 border rounded-lg shadow">
                <h2 className="text-xl font-semibold">Total Subscribers</h2>
                <p>{stats.totalSubscribers}</p>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AuthCheck>
  );
}
