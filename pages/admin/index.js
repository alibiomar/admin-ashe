import { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  AlertTriangle,
  Mail,
  BarChart3,
  RefreshCw,
  Calendar,
  MapPin,
  CreditCard,
  Boxes,
  Wallet
} from 'lucide-react';

// Import these components with correct paths
import AdminLayout from '../../components/layout/AdminLayout';
import AuthCheck from '../../components/auth/AuthCheck';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
      setLastUpdated(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const formatCurrency = (amount) => `${amount?.toFixed(2)} TND`;
  const formatPercentage = (value) => `${value > 0 ? '+' : ''}${value}%`;

  return (
    <AuthCheck>
      <AdminLayout>
        {loading && !stats && (
          <div className="flex items-center justify-center min-h-96">
            <div className="flex flex-col items-center space-y-4">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" aria-label="Loading" />
              <p className="text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        )}

        {error && !stats && (
          <div className="flex items-center justify-center min-h-96">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
              <div className="flex items-center space-x-3 text-red-600 mb-4">
                <AlertTriangle className="w-6 h-6" aria-label="Error" />
                <h2 className="text-lg font-semibold">Error Loading Dashboard</h2>
              </div>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchStats}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                aria-label="Retry"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="p-4 md:p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">
                {lastUpdated && `Last updated: ${lastUpdated}`}
                {stats?.dataQuality && !Object.values(stats.dataQuality).every(Boolean) && (
                  <span className="ml-2 text-amber-600" aria-label="Warning">⚠ Some data sources unavailable</span>
                )}
              </p>
            </div>
            <button
              onClick={fetchStats}
              disabled={loading}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              aria-label="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {stats && (
            <div className="space-y-8">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                  title="Product Revenue"
                  value={formatCurrency(stats.totalProductRevenue)}
                  change={stats.productRevenueGrowth}
                  icon={DollarSign}
                  color="green"
                />
                <KPICard
                  title="Total Orders & Sales"
                  value={stats.totalOrders?.toLocaleString()}
                  change={stats.ordersGrowth}
                  icon={ShoppingCart}
                  color="blue"
                />
                <KPICard
                  title="Total Customers"
                  value={stats.totalCustomers?.toLocaleString()}
                  change={stats.customerGrowth}
                  icon={Users}
                  color="purple"
                />
                <KPICard
                  title="Net Profit"
                  value={formatCurrency(stats.netProfit)}
                  change={stats.netProfit >= 0 ? stats.productRevenueGrowth : -stats.expensesGrowth}
                  icon={Wallet}
                  color="indigo"
                />
                <KPICard
                  title="Total Expenses"
                  value={formatCurrency(stats.totalExpenses)}
                  change={stats.expensesGrowth}
                  icon={DollarSign}
                  color="red"
                />
              </div>

              {/* Revenue & Expenses Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <StatsCard title="Revenue Breakdown" icon={DollarSign}>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Online Product Revenue</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(stats.totalOnlineProductRevenue || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Offline Product Revenue</span>
                      <span className="font-semibold text-blue-600">
                        {formatCurrency(stats.totalOfflineProductRevenue || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Shipping Revenue</span>
                      <span className="font-semibold text-blue-600">
                        {formatCurrency(stats.totalShippingRevenue)}
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Total Revenue</span>
                        <span className="font-bold text-gray-900">
                          {formatCurrency(stats.totalRevenue)}
                        </span>
                      </div>
                    </div>
                  </div>
                </StatsCard>

                <StatsCard title="Monthly Performance" icon={Calendar}>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">This Month Products</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(stats.currentMonthProductRevenue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">This Month Shipping</span>
                      <span className="font-semibold text-blue-600">
                        {formatCurrency(stats.currentMonthShippingRevenue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">This Month Expenses</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(stats.currentMonthExpenses)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Weekly Total</span>
                      <span className="font-semibold text-purple-600">
                        {formatCurrency(stats.weeklyRevenue)}
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Product Growth</span>
                        <span className={`font-semibold ${stats.productRevenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(stats.productRevenueGrowth)}
                        </span>
                      </div>
                    </div>
                  </div>
                </StatsCard>

                <StatsCard title="Expenses by Category" icon={Wallet}>
                  <div className="space-y-4">
                    {Object.entries(stats.expenseByCategory || {}).map(([category, amount]) => (
                      <div key={category} className="flex justify-between items-center">
                        <span className="text-gray-600 capitalize">{category}</span>
                        <span className="font-semibold text-red-600">
                          {formatCurrency(amount)}
                        </span>
                      </div>
                    ))}
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Total Expenses</span>
                        <span className="font-bold text-red-900">
                          {formatCurrency(stats.totalExpenses)}
                        </span>
                      </div>
                    </div>
                  </div>
                </StatsCard>
              </div>

              {/* Order Status & Payment Methods */}
              <div className="grid grid-cols-1 lg:grid-cols-1">
                <StatsCard title="Order Status Breakdown" icon={ShoppingCart}>
                  <div className="space-y-3">
                    {Object.entries(stats.orderStatusBreakdown || {}).map(([status, count]) => (
                      <div key={status} className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}></div>
                          <span className="text-gray-700 capitalize">{status}</span>
                        </div>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </StatsCard>
              </div>

              {/* Inventory Management */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <StatsCard title="Inventory Overview" icon={Package}>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Products</span>
                      <span className="font-semibold text-blue-600">
                        {stats.totalProducts?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Stock Units</span>
                      <span className="font-semibold text-green-600">
                        {stats.totalStockUnits?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Inventory Value</span>
                      <span className="font-semibold text-purple-600">
                        {formatCurrency(stats.totalInventoryValue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Out of Stock Items</span>
                      <span className="font-semibold text-red-600">
                        {stats.outOfStockProducts?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Low Stock Items</span>
                      <span className="font-semibold text-amber-600">
                        {stats.lowStockProducts?.length || 0}
                      </span>
                    </div>
                  </div>
                </StatsCard>

                {stats.productsByCategory && Object.keys(stats.productsByCategory).length > 0 && (
                  <StatsCard title="Products by Category" icon={Boxes}>
                    <div className="space-y-3">
                      {Object.entries(stats.productsByCategory).map(([category, count]) => (
                        <div key={category} className="flex justify-between items-center">
                          <span className="text-gray-700 capitalize">{category}</span>
                          <span className="font-semibold">{count}</span>
                        </div>
                      ))}
                    </div>
                  </StatsCard>
                )}
              </div>

              {/* Customer Insights */}
              <StatsCard title="Customer Insights" icon={Users}>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">New This Month</span>
                    <span className="font-semibold text-green-600">
                      {stats.newCustomersThisMonth?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">New This Week</span>
                    <span className="font-semibold text-blue-600">
                      {stats.newCustomersLastWeek?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Newsletter Subscribers</span>
                    <span className="font-semibold text-purple-600">
                      {stats.totalSubscribers?.toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Conversion Rate</span>
                      <span className="font-semibold text-purple-600">
                        {stats.conversionRate}%</span>
                    </div>
                  </div>
                </div>
              </StatsCard>

              {/* Customer Locations */}
              {stats.customersByLocation && Object.keys(stats.customersByLocation).length > 0 && (
                <StatsCard title="Customers by Location" icon={MapPin}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(stats.customersByLocation)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 9)
                      .map(([location, count]) => (
                        <div key={location} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-700">{location}</span>
                          <span className="font-semibold text-blue-600">{count}</span>
                        </div>
                      ))}
                  </div>
                </StatsCard>
              )}

              {/* Stock Alerts */}
              {(stats.outOfStockProducts?.length > 0 || stats.lowStockProducts?.length > 0) && (
                <div className="space-y-6">
                  {stats.outOfStockProducts?.length > 0 && (
                    <StockAlertTable
                      title="Out of Stock Products"
                      products={stats.outOfStockProducts}
                      alertType="outOfStock"
                    />
                  )}

                  {stats.lowStockProducts?.length > 0 && (
                    <StockAlertTable
                      title="Low Stock Products"
                      products={stats.lowStockProducts}
                      alertType="lowStock"
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </AdminLayout>
    </AuthCheck>
  );
}

const KPICard = ({ title, value, change, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    red: 'bg-red-50 text-red-600'
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <div className="flex items-center mt-2">
              {change >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" aria-label="Trending up" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" aria-label="Trending down" />
              )}
              <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(change)}
              </span>
              <span className="text-xs text-gray-500 ml-1">vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" aria-label={title} />
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ title, children, icon: Icon }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <div className="flex items-center space-x-2 mb-4">
      {Icon && <Icon className="w-5 h-5 text-gray-600" aria-label={title} />}
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </div>
    {children}
  </div>
);

const StockAlertTable = ({ title, products, alertType }) => {
  const alertColors = {
    outOfStock: 'border-red-200 bg-red-50',
    lowStock: 'border-amber-200 bg-amber-50'
  };

  const alertIcons = {
    outOfStock: <AlertTriangle className="w-5 h-5 text-red-600" aria-label="Out of stock" />,
    lowStock: <AlertTriangle className="w-5 h-5 text-amber-600" aria-label="Low stock" />
  };

  return (
    <div className={`border-2 rounded-xl p-6 ${alertColors[alertType]}`}>
      <div className="flex items-center space-x-2 mb-4">
        {alertIcons[alertType]}
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <span className="bg-white px-2 py-1 rounded-full text-sm font-medium">
          {products.length}
        </span>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Stock
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product, index) => (
                <tr key={product.id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      {(product.outOfStockDetails || product.lowStockDetails || []).map((detail, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="font-medium text-gray-700">{detail.color}:</span>
                          <div className="inline-flex flex-wrap gap-1 mt-1">
                            {Object.entries(detail.outOfStockSizes || detail.lowStockSizes || {}).map(([size, quantity]) => (
                              <span
                                key={size}
                                className={`px-2 py-1 rounded-md text-xs font-medium ${
                                  quantity === 0
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {size} ({quantity})
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {product.totalStock || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-400',
    processing: 'bg-blue-400',
    shipped: 'bg-green-400',
    delivered: 'bg-green-600',
    cancelled: 'bg-red-400',
    refunded: 'bg-gray-400'
  };
  return colors[status.toLowerCase()] || 'bg-gray-400';
};

const formatPercentage = (value) => `${value > 0 ? '+' : ''}${value}%`;