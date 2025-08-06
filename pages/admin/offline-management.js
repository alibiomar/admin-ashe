import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Minus,
  ShoppingBag,
  DollarSign,
  Package,
  Calendar,
  Trash2,
  Edit,
  Save,
  X,
  Search,
  Filter,
  Download,
  AlertCircle,
  User,
  Hash,
  RefreshCw
} from 'lucide-react';

// Import these components with correct paths
import AdminLayout from '../../components/layout/AdminLayout';
import AuthCheck from '../../components/auth/AuthCheck';

export default function OfflineManagement() {
  const [activeTab, setActiveTab] = useState('sales');
  const [offlineSales, setOfflineSales] = useState([]);
  const [spendings, setSpendings] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddSale, setShowAddSale] = useState(false);
  const [showAddSpending, setShowAddSpending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  // New sale form state
  const [newSale, setNewSale] = useState({
    productId: '',
    colorName: '',
    sizes: {},
    customerInfo: {
      name: '',
      phone: '',
      email: ''
    },
    totalAmount: 0,
    notes: '',
    saleDate: new Date().toISOString().split('T')[0]
  });

  // New spending form state
  const [newSpending, setNewSpending] = useState({
    category: 'general',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const spendingCategories = [
    'general',
    'inventory',
    'marketing',
    'shipping',
    'equipment',
    'supplies',
    'utilities',
    'other'
  ];

  // Fetch data on component mount
  useEffect(() => {
    fetchOfflineSales();
    fetchSpendings();
  }, []);

  const fetchProducts = async (searchQuery = '') => {
    try {
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      // Ensure data is an array
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  const fetchOfflineSales = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/offline-sales');
      if (!response.ok) throw new Error('Failed to fetch offline sales');
      const data = await response.json();
      // Ensure data is an array
      setOfflineSales(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching offline sales:', error);
      setOfflineSales([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpendings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/spendings');
      if (!response.ok) throw new Error('Failed to fetch spendings');
      const data = await response.json();
      // Ensure data is an array
      setSpendings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching spendings:', error);
      setSpendings([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle product selection
  const handleProductSelect = (product) => {
    setNewSale({
      ...newSale,
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      colorName: '',
      sizes: {}
    });
  };

  // Handle color selection
  const handleColorSelect = (colorName) => {
    setNewSale({
      ...newSale,
      colorName,
      sizes: {}
    });
  };

  // Handle size quantity change
  const handleSizeQuantityChange = (size, quantity) => {
    const newSizes = { ...newSale.sizes };
    if (quantity > 0) {
      newSizes[size] = quantity;
    } else {
      delete newSizes[size];
    }

    const totalQuantity = Object.values(newSizes).reduce((sum, qty) => sum + qty, 0);
    const selectedProduct = products.find(p => p.id === newSale.productId);
    const totalAmount = selectedProduct ? totalQuantity * selectedProduct.price : 0;

    setNewSale({
      ...newSale,
      sizes: newSizes,
      totalAmount
    });
  };

  // Add offline sale
  const addOfflineSale = async () => {
    if (!newSale.productId || !newSale.colorName || Object.keys(newSale.sizes).length === 0) {
      alert('Please select product, color, and at least one size with quantity');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/offline-sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: newSale.productId,
          colorName: newSale.colorName,
          sizes: newSale.sizes,
          customerInfo: newSale.customerInfo,
          totalAmount: newSale.totalAmount,
          notes: newSale.notes
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Reset form
        setNewSale({
          productId: '',
          colorName: '',
          sizes: {},
          customerInfo: { name: '', phone: '', email: '' },
          totalAmount: 0,
          notes: '',
          saleDate: new Date().toISOString().split('T')[0]
        });
        setProducts([]);
        setShowAddSale(false);
        fetchOfflineSales(); // Refresh the list
        alert('Offline sale recorded successfully!');
      } else {
        alert(data.message || 'Error recording sale');
      }
    } catch (error) {
      console.error('Error adding offline sale:', error);
      alert('Error recording sale');
    } finally {
      setLoading(false);
    }
  };

  // Add spending
  const addSpending = async () => {
    if (!newSpending.description || !newSpending.amount) {
      alert('Please fill in description and amount');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/spendings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSpending),
      });

      const data = await response.json();

      if (response.ok) {
        // Reset form
        setNewSpending({
          category: 'general',
          description: '',
          amount: 0,
          date: new Date().toISOString().split('T')[0],
          notes: ''
        });
        setShowAddSpending(false);
        fetchSpendings(); // Refresh the list
        alert('Spending added successfully!');
      } else {
        alert(data.message || 'Error adding spending');
      }
    } catch (error) {
      console.error('Error adding spending:', error);
      alert('Error adding spending');
    } finally {
      setLoading(false);
    }
  };

  // Delete spending
  const deleteSpending = async (id) => {
    if (!confirm('Are you sure you want to delete this spending?')) return;

    try {
      const response = await fetch(`/api/spendings?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchSpendings(); // Refresh the list
        alert('Spending deleted successfully!');
      } else {
        alert('Error deleting spending');
      }
    } catch (error) {
      console.error('Error deleting spending:', error);
      alert('Error deleting spending');
    }
  };

  // Get selected product
  const selectedProduct = products.find(p => p.id === newSale.productId);
  const selectedColor = selectedProduct?.colors.find(c => c.name === newSale.colorName);

  // Filter functions with fallback
  const filteredSales = Array.isArray(offlineSales) ? offlineSales.filter(sale => {
    const matchesSearch = sale.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.customerInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) : [];

  const filteredSpendings = Array.isArray(spendings) ? spendings.filter(spending => {
    const matchesSearch = spending.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         spending.category?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) : [];

  // Calculate totals
  const totalSalesAmount = filteredSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
  const totalSpendingsAmount = filteredSpendings.reduce((sum, spending) => sum + (spending.amount || 0), 0);
  const netProfit = totalSalesAmount - totalSpendingsAmount;

  return (
    <AuthCheck>
      <AdminLayout>
        <div className="p-4 md:p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Offline Sales & Expenses</h1>
              <p className="text-gray-600">Track offline sales and manage your business expenses</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  fetchOfflineSales();
                  fetchSpendings();
                }}
                disabled={loading}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 p-6 rounded-xl border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 font-medium">Total Offline Sales</p>
                  <p className="text-2xl font-bold text-green-900">{totalSalesAmount.toFixed(2)} TND</p>
                </div>
                <ShoppingBag className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-red-50 p-6 rounded-xl border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 font-medium">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-900">{totalSpendingsAmount.toFixed(2)} TND</p>
                </div>
                <DollarSign className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <div className={`p-6 rounded-xl border ${netProfit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Net Profit</p>
                  <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                    {netProfit.toFixed(2)} TND
                  </p>
                </div>
                <Package className={`w-8 h-8 ${netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'sales'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Offline Sales ({filteredSales.length})
            </button>
            <button
              onClick={() => setActiveTab('spendings')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'spendings'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Expenses ({filteredSpendings.length})
            </button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'sales' && (
            <div>
              {/* Add Sale Button */}
              <div className="mb-6">
                <button
                  onClick={() => setShowAddSale(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Record Offline Sale</span>
                </button>
              </div>

              {/* Add Sale Form */}
              {showAddSale && (
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Record Offline Sale</h2>
                    <button
                      onClick={() => setShowAddSale(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Search Product</label>
                      <input
                        type="text"
                        onChange={(e) => fetchProducts(e.target.value)}
                        placeholder="Search for a product..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {products.length > 0 && (
                        <div className="mt-2 bg-gray-50 rounded-lg p-2 max-h-40 overflow-y-auto">
                          {products.map(product => (
                            <div
                              key={product.id}
                              onClick={() => handleProductSelect(product)}
                              className="p-2 hover:bg-gray-100 cursor-pointer rounded"
                            >
                              {product.name} - {product.price} TND
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {selectedProduct && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Select Color</label>
                          <select
                            value={newSale.colorName}
                            onChange={(e) => handleColorSelect(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select a color</option>
                            {selectedProduct.colors.map(color => (
                              <option key={color.name} value={color.name}>{color.name}</option>
                            ))}
                          </select>
                        </div>

                        {selectedColor && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sizes & Quantities</label>
                            <div className="space-y-2">
                              {Object.keys(selectedColor.stock || {}).map(size => (
                                <div key={size} className="flex items-center space-x-2">
                                  <span className="w-20">{size}</span>
                                  <button
                                    onClick={() => handleSizeQuantityChange(size, (newSale.sizes[size] || 0) - 1)}
                                    className="p-1 bg-gray-200 rounded"
                                    disabled={(newSale.sizes[size] || 0) <= 0}
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span>{newSale.sizes[size] || 0}</span>
                                  <button
                                    onClick={() => handleSizeQuantityChange(size, (newSale.sizes[size] || 0) + 1)}
                                    className="p-1 bg-gray-200 rounded"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                  <span className="text-sm text-gray-500">
                                    (Available: {selectedColor.stock[size]})
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                          <input
                            type="text"
                            value={newSale.customerInfo.name}
                            onChange={(e) => setNewSale({ ...newSale, customerInfo: { ...newSale.customerInfo, name: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Customer name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone</label>
                          <input
                            type="text"
                            value={newSale.customerInfo.phone}
                            onChange={(e) => setNewSale({ ...newSale, customerInfo: { ...newSale.customerInfo, phone: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Customer phone"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
                          <input
                            type="email"
                            value={newSale.customerInfo.email}
                            onChange={(e) => setNewSale({ ...newSale, customerInfo: { ...newSale.customerInfo, email: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Customer email"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                          <input
                            type="text"
                            value={newSale.totalAmount.toFixed(2)}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <textarea
                            value={newSale.notes}
                            onChange={(e) => setNewSale({ ...newSale, notes: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Additional notes"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Sale Date</label>
                          <input
                            type="date"
                            value={newSale.saleDate}
                            onChange={(e) => setNewSale({ ...newSale, saleDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </>
                    )}
                    <div className="flex space-x-3 mt-6 pt-4 border-t">
                      <button
                        onClick={() => setShowAddSale(false)}
                        className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addOfflineSale}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Adding...' : 'Add Sale'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Sales List */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredSales.map(sale => (
                        <tr key={sale.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {sale.productName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {sale.customerInfo?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {sale.totalAmount.toFixed(2)} TND
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(sale.saleDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button className="text-blue-600 hover:text-blue-800">View</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'spendings' && (
            <div>
              {/* Add Spending Button */}
              <div className="mb-6">
                <button
                  onClick={() => setShowAddSpending(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Expense</span>
                </button>
              </div>

              {/* Add Spending Form */}
              {showAddSpending && (
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Add Expense</h2>
                    <button
                      onClick={() => setShowAddSpending(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        value={newSpending.category}
                        onChange={(e) => setNewSpending({ ...newSpending, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent capitalize"
                      >
                        {spendingCategories.map(category => (
                          <option key={category} value={category} className="capitalize">
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description *
                      </label>
                      <input
                        type="text"
                        value={newSpending.description}
                        onChange={(e) => setNewSpending({ ...newSpending, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="What did you spend money on?"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount (TND) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newSpending.amount}
                        onChange={(e) => setNewSpending({ ...newSpending, amount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={newSpending.date}
                        onChange={(e) => setNewSpending({ ...newSpending, date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={newSpending.notes}
                        onChange={(e) => setNewSpending({ ...newSpending, notes: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Additional details about this expense"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3 mt-6 pt-4 border-t">
                    <button
                      onClick={() => setShowAddSpending(false)}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addSpending}
                      disabled={loading || !newSpending.description || !newSpending.amount}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Adding...' : 'Add Expense'}
                    </button>
                  </div>
                </div>
              )}

              {/* Spendings List */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredSpendings.map(spending => (
                        <tr key={spending.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {spending.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                            {spending.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {spending.amount.toFixed(2)} TND
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(spending.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => deleteSpending(spending.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-gray-700">Processing...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AuthCheck>
  );
}