import { useEffect, useState, useRef, useCallback } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import AuthCheck from "../../components/auth/AuthCheck";
import { db } from "../../lib/firebaseClient";
import { 
  collection, onSnapshot, doc, updateDoc, query, orderBy, setDoc, getDoc 
} from "firebase/firestore";
import { 
  FiPackage, FiTruck, FiClock, FiXCircle, FiCheckCircle, FiUser, FiPhone, FiSearch 
} from "react-icons/fi";

// Helper function to safely convert createdAt to milliseconds
const getCreatedAtMillis = (createdAt) => {
  if (createdAt && typeof createdAt.toMillis === 'function') {
    return createdAt.toMillis();
  } else if (createdAt instanceof Date) {
    return createdAt.getTime();
  } else {
    return createdAt || 0;
  }
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("new"); // Default to "new" tab
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  // Initialize lastCheck as null so we know when it’s loaded
  const [lastCheck, setLastCheck] = useState(null);

  const modalRef = useRef(null);
  // Ref to skip notifications on initial load
  const isInitialLoad = useRef(true);

  // (Optional) Request Notification permission once on mount
  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // Fetch last check data from Firestore
  useEffect(() => {
    const fetchLastCheck = async () => {
      try {
        const docRef = doc(db, "LastOrderCheck", "admin");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setLastCheck(docSnap.data());
        } else {
          // Create the document if it doesn't exist
          const initialData = {
            timestamp: Date.now(),
            orderCount: 0
          };
          await setDoc(docRef, initialData);
          setLastCheck(initialData);
        }
      } catch (err) {
        setError("Failed to load last check: " + err.message);
      }
    };

    fetchLastCheck();
  }, []);

  // Save last check data on unmount
  useEffect(() => {
    return () => {
      const updateLastCheck = async () => {
        try {
          await setDoc(doc(db, "LastOrderCheck", "admin"), {
            timestamp: Date.now(),
            orderCount: orders.length
          });
        } catch (err) {
          console.error("Failed to update last check:", err);
        }
      };

      updateLastCheck();
    };
  }, [orders.length]);

  // Fetch orders from Firestore
  useEffect(() => {
    const ordersCollection = collection(db, "orders");
    const ordersQuery = query(ordersCollection, orderBy("createdAt", sortOrder));

    const unsubscribe = onSnapshot(
      ordersQuery,
      (ordersSnapshot) => {
        const ordersData = ordersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt,
        }));

        // Only show notifications for orders added after the initial load
        if (!isInitialLoad.current && Notification.permission === "granted") {
          ordersSnapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const newOrder = change.doc.data();
              new Notification("New Order Received!", {
                body: `Order #${change.doc.id.slice(0, 8)} - ${newOrder.userInfo?.name || "Unknown Customer"}`,
                icon: "/notif.jpg",
              });
            }
          });
        }
        // Mark initial load as done after the first snapshot
        if (isInitialLoad.current) {
          isInitialLoad.current = false;
        }

        setOrders(ordersData);
        setLoading(false);
      },
      (err) => {
        setError("Failed to fetch orders: " + err.message);
        console.error("Error fetching orders:", err);
      }
    );

    return () => unsubscribe();
  }, [sortOrder]);

  // Filter orders based on search term, active tab, and last viewed timestamp
  const filteredOrders = useCallback(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userInfo?.phone?.includes(searchTerm);

      const matchesTab = {
        // Only apply "new" filtering when lastCheck has been loaded.
        new: lastCheck ? getCreatedAtMillis(order.createdAt) > lastCheck.timestamp : false,
        pending: order.status === "Pending",
        shipped: order.status === "Shipped"
      }[activeTab];

      return matchesSearch && matchesTab;
    });
  }, [orders, searchTerm, activeTab, lastCheck]);

  // Calculate counts for all tabs
  const getTabCount = useCallback((tab) => {
    return orders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userInfo?.phone?.includes(searchTerm);

      const matchesTab = {
        new: lastCheck ? getCreatedAtMillis(order.createdAt) > lastCheck.timestamp : false,
        pending: order.status === "Pending",
        shipped: order.status === "Shipped"
      }[tab];

      return matchesSearch && matchesTab;
    }).length;
  }, [orders, searchTerm, lastCheck]);

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: newStatus });
    } catch (err) {
      setError("Failed to update order status: " + err.message);
      console.error("Error updating order status:", err);
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full">
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
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              {order.status === "Shipped" ? (
                <FiTruck className="mr-2" />
              ) : (
                <FiClock className="mr-2" />
              )}
              {order.status}
            </div>
          </div>
        </div>
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
              ? "bg-[#46c7c7] hover:bg-[#3aa8a8] text-white"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          }`}
        >
          {order.status === "Pending" ? (
            <FiCheckCircle className="mr-2" />
          ) : (
            <FiXCircle className="mr-2" />
          )}
          {order.status === "Pending" ? "Mark Shipped" : "Revert Status"}
        </button>
      </div>
    </div>
  );

  // Render shipping modal
  const renderShippingModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-scroll">
      <div
        ref={modalRef}
        className="bg-white rounded-2xl p-8 max-w-2xl w-full space-y-6 shadow-xl"
      >
        <div className="flex justify-between items-start">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <FiPackage className="text-[#46c7c7]" />
            Order Details
          </h3>
          <button
            onClick={() => setSelectedOrder(null)}
            className="p-2 hover:bg-gray-100 rounded-full"
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
                <p>
                  <span className="font-medium">Name:</span>{" "}
                  {selectedOrder.userInfo?.name || "N/A"}
                </p>
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  {selectedOrder.userInfo?.email || "N/A"}
                </p>
                <p>
                  <span className="font-medium">Phone:</span>{" "}
                  {selectedOrder.userInfo?.phone || "N/A"}
                </p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <FiTruck className="text-[#46c7c7]" />
                Shipping Information
              </h4>
              {selectedOrder.shippingInfo ? (
                <div className="space-y-2 text-sm">
                  <p>{selectedOrder.shippingInfo.addressLine}</p>
                  <p>
                    {selectedOrder.shippingInfo.city},{" "}
                    {selectedOrder.shippingInfo.state}
                  </p>
                  <p>{selectedOrder.shippingInfo.zipCode}</p>
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
                Order Items ({selectedOrder.items?.length})
              </h4>
              <div className="space-y-3">
                {selectedOrder.items?.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-white p-3 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        Size: {item.size || "N/A"}
                      </p>
                    </div>
                    <span className="font-medium">
                      TND {item.price?.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 text-sm text-gray-500">
          <p>
            Ordered on:{" "}
            {new Date(getCreatedAtMillis(selectedOrder.createdAt)).toLocaleString()}
          </p>
        </div>
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
                {tab.charAt(0).toUpperCase() + tab.slice(1)} ({getTabCount(tab)})
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

        {selectedOrder && renderShippingModal()}
      </AdminLayout>
    </AuthCheck>
  );
}
