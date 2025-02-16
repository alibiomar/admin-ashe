import { useEffect, useState, useCallback } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import AuthCheck from "../../components/auth/AuthCheck";
import { db } from "../../lib/firebaseClient";
import { collection, doc, updateDoc, query, orderBy, getDocs } from "firebase/firestore";
import {
  FiPackage,
  FiTruck,
  FiClock,
  FiXCircle,
  FiCheckCircle,
  FiUser,
  FiPhone,
  FiSearch,
  FiCreditCard,
  FiBox,
} from "react-icons/fi";

const getCreatedAtMillis = (createdAt) => {
  if (createdAt?.toMillis) return createdAt.toMillis();
  if (createdAt instanceof Date) return createdAt.getTime();
  return createdAt || 0;
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("new");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

  // Fetch orders on initial load
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const ordersCollection = collection(db, "orders");
        const ordersQuery = query(ordersCollection, orderBy("createdAt", sortOrder));
        const snapshot = await getDocs(ordersQuery);

        const ordersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt,
        }));

        setOrders(ordersData);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch orders: " + err.message);
        setLoading(false);
      }
    };

    fetchOrders();
  }, [sortOrder]);

  // Filter orders based on search and tab
  const filteredOrders = useCallback(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userInfo?.phone?.includes(searchTerm);

      const matchesTab = {
        new: order.status === "New",
        pending: order.status === "Pending",
        shipped: order.status === "Shipped",
      }[activeTab];

      return matchesSearch && matchesTab;
    });
  }, [orders, searchTerm, activeTab]);

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: newStatus });

      // Refresh orders after update
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (err) {
      setError("Failed to update order status: " + err.message);
    }
  };

  // Render controls (search and sort)
  const renderControls = () => (
    <div className="mb-6 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
      <div className="relative flex-1 max-w-md">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by order ID, customer name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#46c7c7] focus:border-transparent"
        />
      </div>

      <div className="flex items-center gap-4">
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#46c7c7]"
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>
    </div>
  );

  // Render empty state
  const renderEmptyState = () => (
    <div className="text-center py-12">
      <FiPackage className="mx-auto text-6xl text-gray-300 mb-4" />
      <h3 className="text-xl font-medium text-gray-600 mb-2">No Orders Found</h3>
      <p className="text-gray-400">
        {searchTerm
          ? "Try adjusting your search terms"
          : `No ${activeTab} orders at the moment`}
      </p>
    </div>
  );

  // Render order card
  const renderOrderCard = (order) => (
    <div
      key={order.id}
      onClick={() => setSelectedOrder(order)}
      className="group p-6 bg-white rounded-xl border border-gray-100 hover:border-[#46c7c7] shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4 w-full">
          {/* Added Items and Payment columns */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400">ITEMS</label>
            <div className="flex items-center gap-2">
              <FiBox className="text-gray-500" />
              <p className="text-gray-600">{order.items?.length || 0}</p>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400">PAYMENT</label>
            <div className="flex items-center gap-2">
              <FiCreditCard className="text-gray-500" />
              <p className="text-gray-600">{order.paymentMethod || "N/A"}</p>
            </div>
          </div>
          {/* Existing columns */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400">ORDER ID</label>
            <p className="font-medium text-gray-800">{order.id.slice(0, 8)}</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400">DATE</label>
            <p className="text-gray-600">
              {new Date(getCreatedAtMillis(order.createdAt)).toLocaleDateString()}
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400">TOTAL</label>
            <p className="font-semibold text-[#46c7c7]">
              TND {order.totalAmount?.toFixed(2)}
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400">CLIENT</label>
            <div className="flex items-center gap-2">
              <FiUser className="text-gray-500" />
              <p className="text-gray-600">{order.userInfo?.name || "N/A"}</p>
            </div>
            <div className="flex items-center gap-2">
              <FiPhone className="text-gray-500" />
              <p className="text-gray-600">{order.userInfo?.phone || "N/A"}</p>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400">STATUS</label>
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                order.status === "Shipped"
                  ? "bg-green-100 text-green-700"
                  : order.status === "Pending"
                  ? "bg-orange-100 text-orange-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {order.status === "Shipped" ? (
                <FiTruck className="mr-2" />
              ) : order.status === "Pending" ? (
                <FiClock className="mr-2" />
              ) : (
                <FiPackage className="mr-2" />
              )}
              {order.status}
            </div>
          </div>
        </div>
        {/* Improved status toggle button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            updateOrderStatus(
              order.id,
              order.status === "Pending" ? "Shipped" : "Pending"
            );
          }}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
            order.status === "Pending"
              ? "bg-[#46c7c7] hover:bg-[#3aa8a8] text-white shadow-md"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          }`}
        >
          {order.status === "Pending" ? (
            <>
              <FiCheckCircle className="mr-2" />
              Confirm Shipment
            </>
          ) : (
            <>
              <FiClock className="mr-2" />
              Mark as Pending
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <AuthCheck>
      <AdminLayout>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
            {["new", "pending", "shipped"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-[#46c7c7] text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {renderControls()}

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#46c7c7]"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-6">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        ) : filteredOrders().length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="space-y-4">
            {filteredOrders().map(renderOrderCard)}
          </div>
        )}
      </AdminLayout>
    </AuthCheck>
  );
}