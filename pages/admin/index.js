import { useEffect, useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import AuthCheck from '../../components/auth/AuthCheck';
import { 
  ShoppingCartIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CubeIcon,
  ChartPieIcon,
  TrendingUpIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, icon: Icon, color = 'bg-blue-50', currency = false }) => (
  <div className={`p-6 rounded-lg ${color} flex items-center justify-between`}>
    <div>
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <p className="mt-2 text-3xl font-semibold">
        {currency ? 'TND ' : ''}{typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
    <Icon className="w-12 h-12 text-gray-400" />
  </div>
);

const SkeletonLoader = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-10 bg-gray-200 rounded w-1/4"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
      ))}
    </div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
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
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <AuthCheck>
      <AdminLayout>
        <div className="space-y-8 p-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          
          {loading && <SkeletonLoader />}
          
          {error && (
            <div className="p-4 bg-red-50 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-red-600">{error}</p>
                <button 
                  onClick={fetchStats}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
              <ExclamationTriangleIcon className="w-12 h-12 text-red-400" />
            </div>
          )}

          {stats && (
            <div className="space-y-8">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Orders"
                  value={stats.totalOrders}
                  icon={ShoppingCartIcon}
                  color="bg-indigo-50"
                />
                <StatCard
                  title="Total Revenue"
                  value={stats.totalRevenue}
                  icon={CurrencyDollarIcon}
                  color="bg-green-50"
                  currency
                />
                <StatCard
                  title="Total Customers"
                  value={stats.totalCustomers}
                  icon={UserGroupIcon}
                  color="bg-purple-50"
                />
                <StatCard
                  title="Total Products"
                  value={stats.totalProducts}
                  icon={CubeIcon}
                  color="bg-amber-50"
                />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 bg-white rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <ChartPieIcon className="w-5 h-5 mr-2" />
                    Order Status Distribution
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={Object.entries(stats.orderStatusBreakdown).map(([name, value]) => ({ name, value }))}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {Object.keys(stats.orderStatusBreakdown).map((_, index) => (
                            <Cell key={index} fill={['#6366f1', '#3b82f6', '#10b981'][index % 3]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <TrendingUpIcon className="w-5 h-5 mr-2" />
                    Revenue Trend
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="revenue" stroke="#3b82f6" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-6 bg-white rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Customer Insights</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Repeat Customers:</span>
                      <span className="font-semibold">{stats.repeatCustomers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>New Customers:</span>
                      <span className="font-semibold">{stats.newCustomers}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Inventory Status</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between text-red-600">
                      <span>Out of Stock:</span>
                      <span className="font-semibold">{stats.outOfStock}</span>
                    </div>
                    <div className="flex justify-between text-amber-600">
                      <span>Low Stock:</span>
                      <span className="font-semibold">{stats.lowStock}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Order Value</h3>
                  <div className="text-3xl font-bold text-indigo-600">
                    TND {stats.averageOrderValue.toFixed(2)}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Average order value</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AuthCheck>
  );
}