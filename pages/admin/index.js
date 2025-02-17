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
        <div className="p-4 md:p-8 space-y-8">
          <h1 className="text-3xl font-bold mb-4">Dashboard</h1>

          {loading && <p>Loading stats...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {stats && (
            <div className="space-y-12">
              {/* Section 1: Online Users */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-full bg-[#46c7c7] text-white text-2xl font-bold">
                  {onlineUsers.length}
                </div>
                <div className="overflow-x-auto w-full">
                  <table className="min-w-full border border-gray-200 rounded-lg shadow">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Online Users
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {onlineUsers.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.firstName} {user.lastName}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 2: Customer Stats */}
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg shadow">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Customers
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        New Customers
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">{stats.totalCustomers}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{stats.newCustomers}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 3: Order Stats */}
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg shadow">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Status Breakdown
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Count
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(stats.orderStatusBreakdown).map(([status, count]) => (
                      <tr key={status}>
                        <td className="px-6 py-4 whitespace-nowrap">{status}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{count}</td>
                      </tr>
                    ))}
                    <tr className="font-bold">
                      <td className="px-6 py-4">Total Orders</td>
                      <td className="px-6 py-4">{stats.totalOrders}</td>
                    </tr>
                    <tr className="font-bold">
                      <td className="px-6 py-4">Total Revenue</td>
                      <td className="px-6 py-4">{stats.totalRevenue.toFixed(2)} TND</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 4: Subscribers & Products */}
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg shadow">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Subscribers
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Products
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">{stats.totalSubscribers}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{stats.totalProducts}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 5: Out-of-Stock Products */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Out-of-Stock Products</h2>
                <OutOfStockProductsTable products={stats.outOfStockProducts} />
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AuthCheck>
  );
}

const OutOfStockProductsTable = ({ products }) => {
  if (!products || products.length === 0) {
    return <p>No out-of-stock products.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200 rounded-lg shadow">
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
