import { useEffect, useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import AuthCheck from '../../components/auth/AuthCheck';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg shadow">
                <h2 className="text-xl font-semibold">Total Orders</h2>
                <p>{stats.totalOrders}</p>
              </div>
              <div className="p-4 border rounded-lg shadow">
                <h2 className="text-xl font-semibold">Total Revenue</h2>
                <p>{stats.totalRevenue.toFixed(2)} TND</p>
              </div>
              <div className="p-4 border rounded-lg shadow">
                <h2 className="text-xl font-semibold">Average Order Value</h2>
                <p>{stats.averageOrderValue.toFixed(2)} TND</p>
              </div>
              <div className="p-4 border rounded-lg shadow">
                <h2 className="text-xl font-semibold">Total Products</h2>
                <p>{stats.totalProducts}</p>
              </div>
              <div className="p-4 border rounded-lg shadow">
                <h2 className="text-xl font-semibold">Total Subscribers</h2>
                <p>{stats.totalSubscribers}</p>
              </div>
              <div className="p-4 border rounded-lg shadow">
                <h2 className="text-xl font-semibold">Total Customers</h2>
                <p>{stats.totalCustomers}</p>
              </div>
              <div className="p-4 border rounded-lg shadow">
                <h2 className="text-xl font-semibold">Repeat Customers</h2>
                <p>{stats.repeatCustomers}</p>
              </div>
              <div className="p-4 border rounded-lg shadow">
                <h2 className="text-xl font-semibold">New Customers</h2>
                <p>{stats.newCustomers}</p>
              </div>
              <div className="p-4 border rounded-lg shadow">
                <h2 className="text-xl font-semibold">Out of Stock Products</h2>
                <p>{stats.outOfStock}</p>
              </div>
              <div className="p-4 border rounded-lg shadow">
                <h2 className="text-xl font-semibold">Low Stock Products</h2>
                <p>{stats.lowStock}</p>
              </div>
              <div className="p-4 border rounded-lg shadow">
                <h2 className="text-xl font-semibold">Order Status Breakdown</h2>
                <ul>
                  {Object.entries(stats.orderStatusBreakdown).map(([status, count]) => (
                    <li key={status}>{status}: {count}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AuthCheck>
  );
}
