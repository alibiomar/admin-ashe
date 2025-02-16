import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import AuthCheck from "../../components/auth/AuthCheck";
import { db } from "../../lib/firebaseClient";
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { FiPackage, FiTruck, FiClock, FiXCircle, FiCheckCircle, FiUser, FiPhone, FiSearch, FiArrowUp, FiArrowDown, FiPlusCircle } from "react-icons/fi";
import { useClickAway } from "react-use";
import FocusLock from "react-focus-lock";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("new"); // Default to "new" tab
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });

  // Memoized filtered and sorted orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = order.userInfo?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter by active tab status
      if (activeTab === "new") {
        return matchesSearch && order.status === "New";
      } else if (activeTab === "pending") {
        return matchesSearch && order.status === "Pending";
      } else if (activeTab === "shipped") {
        return matchesSearch && order.status === "Shipped";
      }
      return matchesSearch;
    }).sort((a, b) => {
      if (sortConfig.key === "createdAt") {
        return sortConfig.direction === "asc" 
          ? a.createdAt - b.createdAt 
          : b.createdAt - a.createdAt;
      }
      if (sortConfig.key === "totalAmount") {
        return sortConfig.direction === "asc" 
          ? a.totalAmount - b.totalAmount 
          : b.totalAmount - a.totalAmount;
      }
      return 0;
    });
  }, [orders, activeTab, searchQuery, sortConfig]);

  // Firestore query setup
  useEffect(() => {
    const ordersCollection = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      ordersCollection,
      (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() // Convert Firestore timestamp
        }));
        setOrders(ordersData);
        setLoading(false);
      },
      (err) => {
        setError("Failed to fetch orders. Please refresh the page.");
        console.error("Firestore error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Order status update handler
  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    try {
      const orderDoc = doc(db, "orders", orderId);
      await updateDoc(orderDoc, { status: newStatus });
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (err) {
      setError("Status update failed. Please check your permissions.");
      console.error("Update error:", err);
    }
  }, []);

  // Sorting handler
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc"
    }));
  };

  return (
    <AuthCheck>
      <AdminLayout>
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#46c7c7] focus:border-transparent"
                />
              </div>
              
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
                    {tab.charAt(0).toUpperCase() + tab.slice(1)} ({filteredOrders.length})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sorting Controls */}
          <div className="flex gap-4 items-center">
            <span className="text-sm text-gray-500">Sort by:</span>
            <button
              onClick={() => handleSort("createdAt")}
              className="flex items-center gap-1 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Date
              {sortConfig.key === "createdAt" && (
                sortConfig.direction === "asc" ? <FiArrowUp /> : <FiArrowDown />
              )}
            </button>
            <button
              onClick={() => handleSort("totalAmount")}
              className="flex items-center gap-1 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Total
              {sortConfig.key === "totalAmount" && (
                sortConfig.direction === "asc" ? <FiArrowUp /> : <FiArrowDown />
              )}
            </button>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading ? (
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <p className="text-gray-500">No orders found in this category</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onSelect={setSelectedOrder}
                onStatusChange={updateOrderStatus}
              />
            ))}
          </div>
        )}

        {selectedOrder && (
          <ShippingModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </AdminLayout>
    </AuthCheck>
  );
}

// Memoized Order Card Component
const OrderCard = React.memo(({ order, onSelect, onStatusChange }) => {
  const statusColors = {
    New: { bg: "bg-blue-100", text: "text-blue-700" },
    Pending: { bg: "bg-orange-100", text: "text-orange-700" },
    Shipped: { bg: "bg-green-100", text: "text-green-700" }
  };

  const statusIcons = {
    New: <FiPlusCircle className="mr-2" />,
    Pending: <FiClock className="mr-2" />,
    Shipped: <FiTruck className="mr-2" />
  };

  return (
    <div
      onClick={() => onSelect(order)}
      className="group p-6 bg-white rounded-xl border border-gray-100 hover:border-[#46c7c7] shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer"
      role="button"
      tabIndex="0"
      aria-label={`View order ${order.id.slice(0, 8)} details`}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full">
          {/* Order ID */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400">ORDER ID</label>
            <p className="font-medium text-gray-800 truncate">{order.id.slice(0, 8)}</p>
          </div>

          {/* Date */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400">DATE</label>
            <p className="text-gray-600">
              {order.createdAt?.toLocaleDateString("en-GB") || "N/A"}
            </p>
          </div>

          {/* Total */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400">TOTAL</label>
            <p className="font-semibold text-[#46c7c7]">
              TND {order.totalAmount?.toFixed(2) || "0.00"}
            </p>
          </div>

          {/* Client Info */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400">CLIENT</label>
            <div className="flex items-center gap-2">
              <FiUser className="text-gray-500" />
              <p className="text-gray-600 truncate">{order.userInfo?.name || "N/A"}</p>
            </div>
            <div className="flex items-center gap-2">
              <FiPhone className="text-gray-500" />
              <p className="text-gray-600">{order.userInfo?.phone || "N/A"}</p>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400">STATUS</label>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${statusColors[order.status].bg} ${statusColors[order.status].text}`}>
              {statusIcons[order.status]}
              <span className="ml-2">{order.status}</span>
            </div>
          </div>
        </div>

        {/* Status Toggle Button */}
        {order.status === "New" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(order.id, "Pending");
            }}
            className="flex items-center px-4 py-2 rounded-lg bg-[#46c7c7] hover:bg-[#3aa8a8] text-white transition-colors"
            aria-label="Mark order as Pending"
          >
            <FiCheckCircle className="mr-2" />
            <span>Mark as Pending</span>
          </button>
        )}
      </div>
    </div>
  );
});

// Shipping Modal Component
const ShippingModal = ({ order, onClose }) => {
  const modalRef = useRef(null);

  // Handle click outside and ESC key
  useClickAway(modalRef, onClose);
  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <FocusLock>
      <div 
        role="dialog"
        aria-labelledby="modal-title"
        className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      >
        <div
          ref={modalRef}
          className="bg-white rounded-2xl p-8 max-w-2xl w-full space-y-6 shadow-xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-start">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <FiPackage className="text-[#46c7c7]" />
              Order Details
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
              aria-label="Close modal"
            >
              <FiXCircle className="text-gray-500 text-xl" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FiUser className="text-[#46c7c7]" />
                  Client Information
                </h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Name:</span> {order.userInfo?.name || "N/A"}</p>
                  <p><span className="font-medium">Email:</span> {order.userInfo?.email || "N/A"}</p>
                  <p><span className="font-medium">Phone:</span> {order.userInfo?.phone || "N/A"}</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FiTruck className="text-[#46c7c7]" />
                  Shipping Information
                </h4>
                {order.shippingInfo ? (
                  <div className="space-y-2 text-sm">
                    <p>{order.shippingInfo.addressLine}</p>
                    <p>{order.shippingInfo.city}, {order.shippingInfo.state}</p>
                    <p>{order.shippingInfo.zipCode}</p>
                  </div>
                ) : (
                  <p className="text-gray-400">No shipping information</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FiPackage className="text-[#46c7c7]" />
                  Order Items ({order.items?.length})
                </h4>
                <div className="space-y-3">
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center bg-white p-3 rounded-lg">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-gray-500">Size: {item.size || "N/A"}</p>
                      </div>
                      <span className="font-medium">TND {item.price?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 text-sm text-gray-500">
            <p>Ordered on: {new Date(order.createdAt).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </FocusLock>
  );
};