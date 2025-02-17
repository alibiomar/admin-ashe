import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import AuthCheck from '../../components/auth/AuthCheck';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

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

  const fetchOnlineUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/online-users');
      if (!response.ok) throw new Error('Failed to fetch online users');
      const data = await response.json();
      setOnlineUsers(data.onlineUsers);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchOnlineUsers();
  }, [fetchStats, fetchOnlineUsers]);

  return (
    <AuthCheck>
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>

          {loading && <p>Loading stats...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {stats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard title="Online Users" value={onlineUsers.length} />
                <OnlineUsersList users={onlineUsers} />

                <StatCard title="Total Orders" value={stats.totalOrders} />
                <OrderStatusBreakdown orderStatusBreakdown={stats.orderStatusBreakdown} />

                <StatCard
                  title="Total Revenue"
                  value={`${stats.totalRevenue.toFixed(2)} TND`}
                />
                <StatCard title="Total Products" value={stats.totalProducts} />
                <StatCard title="Total Customers" value={stats.totalCustomers} />
                <StatCard title="New Customers" value={stats.newCustomers} />
                <StatCard title="Total Subscribers" value={stats.totalSubscribers} />
              </div>

              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">Out of Stock Products</h2>
                <OutOfStockProductsTable products={stats.outOfStockProducts} />
              </div>
            </>
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
        <li key={status}>
          {status}: {count}
        </li>
      ))}
    </ul>
  </div>
);

const OnlineUsersList = ({ users }) => (
  <div className="p-4 border rounded-lg shadow">
    <h2 className="text-xl font-semibold">Online Users</h2>
    <ul>
      {users.map((user) => (
        <li key={user.id}>
          {user.firstName} {user.lastName}
        </li>
      ))}
    </ul>
  </div>
);

const OutOfStockProductsTable = ({ products }) => {
  if (!products || products.length === 0) {
    return <p>No out-of-stock products.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Product Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stock by Size
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.map((product, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <ul>
                  {Object.entries(product.stock).map(([size, quantity]) => (
                    <li key={size}>
                      {size}: {quantity}
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
