import { useEffect, useState, useMemo } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import AuthCheck from '../../components/auth/AuthCheck';
import { 
  ShoppingCartIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CubeIcon,
  ChartPieIcon,
  TrendingUpIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CHART_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const StatCard = ({ title, value, icon: Icon, color = 'bg-blue-50', currency = false }) => {
  const formattedValue = useMemo(() => {
    if (value === undefined || value === null) return 'N/A';
    return currency 
      ? `TND ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
      : Number(value).toLocaleString();
  }, [value, currency]);

  return (
    <div className={`p-6 rounded-lg ${color} flex items-center justify-between`}>
      <div>
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <p className="mt-2 text-3xl font-semibold">{formattedValue}</p>
      </div>
      <Icon className="w-12 h-12 text-gray-400" />
    </div>
  );
};

const SkeletonLoader = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-10 bg-gray-200 rounded w-1/4"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
      ))}
    </div>
  </div>
);

const ErrorDisplay = ({ message, onRetry }) => (
  <div className="p-4 bg-red-50 rounded-lg flex items-center justify-between">
    <div>
      <p className="text-red-600">{message}</p>
      <button 
        onClick={onRetry}
        className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ArrowPathIcon className="w-4 h-4" />
          Retry
        </div>
      </button>
    </div>
    <ExclamationTriangleIcon className="w-12 h-12 text-red-400" />
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
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch stats: ${response.status}`);
      }
      const data = await response.json();
      
      // Validate required data
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data format received');
      }
      
      setStats(data);
    } catch (err) {
      setError(err.message);
      console.error('Dashboard stats fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Optional: Set up polling for real-time updates
    const pollInterval = setInterval(fetchStats, 5 * 60 * 1000); // Poll every 5 minutes
    
    return () => clearInterval(pollInterval);
  }, []);

  const orderStatusData = useMemo(() => {
    if (!stats?.orderStatusBreakdown) return [];
    return Object.entries(stats.orderStatusBreakdown)
      .map(([name, value]) => ({ 
        name, 
        value: Number(value) || 0 
      }))
      .filter(item => item.value > 0); // Only show non-zero values
  }, [stats?.orderStatusBreakdown]);

  const revenueTrendData = useMemo(() => {
    return stats?.revenueTrend || [];
  }, [stats?.revenueTrend]);

  return (
    <AuthCheck>
      <AdminLayout>
        <div className="space-y-8 p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
            {!loading && !error && (
              <button 
                onClick={fetchStats}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                <ArrowPathIcon className="w-5 h-5" />
                Refresh
              </button>
            )}
          </div>
          
          {loading && <SkeletonLoader />}
          
          {error && <ErrorDisplay message={error} onRetry={fetchStats} />}

          {stats && !loading && (
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
                {/* Order Status Distribution Chart */}
                <div className="p-6 bg-white rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <ChartPieIcon className="w-5 h-5 mr-2" />
                    Order Status Distribution
                  </h3>
                  <div className="h-64">
                    {orderStatusData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={orderStatusData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, percent }) => 
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {orderStatusData.map((_, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={CHART_COLORS[index % CHART_COLORS.length]} 
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500">
                        No order status data available
                      </div>
                    )}
                  </div>
                </div>

                {/* Revenue Trend Chart */}
                <div className="p-6 bg-white rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <TrendingUpIcon className="w-5 h-5 mr-2" />
                    Revenue Trend
                  </h3>
                  <div className="h-64">
                    {revenueTrendData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={revenueTrendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={date => new Date(date).toLocaleDateString()}
                          />
                          <YAxis 
                            tickFormatter={value => `TND ${value.toLocaleString()}`}
                          />
                          <Tooltip 
                            formatter={value => [`TND ${value.toLocaleString()}`, 'Revenue']}
                            labelFormatter={date => new Date(date).toLocaleDateString()}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500">
                        No revenue trend data available
                      </div>
                    )}
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
                      <span className="font-semibold">
                        {stats.repeatCustomers?.toLocaleString() ?? 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>New Customers:</span>
                      <span className="font-semibold">
                        {stats.newCustomers?.toLocaleString() ?? 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Inventory Status</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between text-red-600">
                      <span>Out of Stock:</span>
                      <span className="font-semibold">
                        {stats.outOfStock?.toLocaleString() ?? 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between text-amber-600">
                      <span>Low Stock:</span>
                      <span className="font-semibold">
                        {stats.lowStock?.toLocaleString() ?? 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Order Value</h3>
                  <div className="text-3xl font-bold text-indigo-600">
                    {typeof stats.averageOrderValue === 'number' 
                      ? `TND ${stats.averageOrderValue.toFixed(2)}` 
                      : 'N/A'
                    }
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