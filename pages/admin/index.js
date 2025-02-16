import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import AuthCheck from '../../components/auth/AuthCheck';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <AuthCheck>
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>

          {loading && <p>Loading stats...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard title="Total Orders" value={stats.totalOrders} />
              <StatCard title="Total Revenue" value={`${stats.totalRevenue.toFixed(2)} TND`} />
              <StatCard title="Average Order Value" value={`${stats.averageOrderValue.toFixed(2)} TND`} />
              <StatCard title="Total Products" value={stats.totalProducts} />
              <StatCard title="Total Subscribers" value={stats.totalSubscribers} />
              <StatCard title="Total Customers" value={stats.totalCustomers} />
              <StatCard title="Repeat Customers" value={stats.repeatCustomers} />
              <StatCard title="New Customers" value={stats.newCustomers} />
              <StatCard title="Out of Stock Products" value={stats.outOfStock} />
              <StatCard title="Low Stock Products" value={stats.lowStock} />
              <OrderStatusBreakdown orderStatusBreakdown={stats.orderStatusBreakdown} />
            </div>
          )}
        </div>
      </AdminLayout>
    </AuthCheck>
  );
}

const StatCard = ({ title, value }) => (
  <div className="p-4 border rounded-lg shadow">
    <h2 className="text-xl font-semibold">{title}</h2>
    <p>{value}</p>
  </div>
);

const OrderStatusBreakdown = ({ orderStatusBreakdown }) => (
  <div className="p-4 border rounded-lg shadow">
    <h2 className="text-xl font-semibold">Order Status Breakdown</h2>
    <ul>
      {Object.entries(orderStatusBreakdown).map(([status, count]) => (
        <li key={status}>{status}: {count}</li>
      ))}
    </ul>
  </div>
);
