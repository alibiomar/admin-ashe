import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import AuthCheck from "../../components/auth/AuthCheck";
import { db } from "../../lib/firebaseClient";
import { collection, onSnapshot, doc, updateDoc, query, orderBy, limit } from "firebase/firestore";
import { FiPackage, FiTruck, FiClock, FiXCircle, FiCheckCircle, FiUser, FiPhone, FiSearch } from "react-icons/fi";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("new");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);

  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setSelectedOrder(null);
      }
    };

    if (selectedOrder) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedOrder]);

  useEffect(() => {
    const ordersCollection = collection(db, "orders");
    const q = query(ordersCollection, orderBy("createdAt", "desc"), limit(ordersPerPage));

    const unsubscribe = onSnapshot(
      q,
      (ordersSnapshot) => {
        const ordersData = ordersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(ordersData);
        setLoading(false);
      },
      (err) => {
        setError("Failed to fetch orders.");
        console.error("Error fetching orders:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentPage, ordersPerPage]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderDoc = doc(db, "orders", orderId);
      await updateDoc(orderDoc, { status: newStatus });

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (err) {
      setError("Failed to update order status.");
      console.error("Error updating order status:", err);
    }
  };

  const handleStatusChange = (order) => {
    if (order.status === "New") {
      updateOrderStatus(order.id, "Pending");
    } else if (order.status === "Pending") {
      updateOrderStatus(order.id, "Shipped");
    } else if (order.status === "Shipped") {
      updateOrderStatus(order.id, "Pending");
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) =>
      order.userInfo?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.includes(searchQuery)
    );
  }, [orders, searchQuery]);

  const pendingOrders = filteredOrders.filter((order) => order.status === "Pending");
  const shippedOrders = filteredOrders.filter((order) => order.status === "Shipped");
  const newOrders = filteredOrders.filter((order) => order.status === "New");

  const renderOrderCard = useCallback((order) => (
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
              {new Date(order.createdAt).toLocaleDateString()}
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
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
              order.status === "Shipped"
                ? "bg-green-100 text-green-700"
                : order.status === "New"
                ? "bg-blue-100 text-blue-700"
                : order.status === "Pending"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-orange-100 text-orange-700"
            }`}>
              {order.status === "Shipped" ? (
                <FiTruck className="mr-2" />
              ) : order.status === "Pending" ? (
                <FiClock className="mr-2" />
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
            handleStatusChange(order);
          }}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
            order.status === "New" || order.status === "Pending" || order.status === "Shipped"
              ? "bg-[#46c7c7] hover:bg-[#3aa8a8] text-white"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          }`}
        >
          {order.status === "New" ? (
            <FiCheckCircle className="mr-2" />
          ) : order.status === "Pending" ? (
            <FiClock className="mr-2" />
          ) : (
            <FiClock className="mr-2" />
          )}
          {order.status === "New" 
            ? "Mark Pending" 
            : order.status === "Pending" 
            ? "Mark Shipped" 
            : "Mark Pending"}
        </button>
      </div>
    </div>
  ), []);

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
                <p><span className="font-medium">Name:</span> {selectedOrder.userInfo?.name || "N/A"}</p>
                <p><span className="font-medium">Email:</span> {selectedOrder.userInfo?.email || "N/A"}</p>
                <p><span className="font-medium">Phone:</span> {selectedOrder.userInfo?.phone || "N/A"}</p>
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
                    {selectedOrder.shippingInfo.district}, {selectedOrder.shippingInfo.delegation}, {selectedOrder.shippingInfo.governorate}
                  </p>
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
                  <div key={index} className="flex flex-col md:flex-row justify-between items-center bg-white p-3 rounded-lg">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        Size: {item.size || "N/A"} {item.color ? `| Color: ${item.color}` : ""}
                      </p>
                    </div>
                    <span className="font-medium">TND {item.price?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 text-sm text-gray-500">
          <p>Ordered on: {new Date(selectedOrder.createdAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  return (
    <AuthCheck>
      <AdminLayout>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
            {["new", "shipped", "pending"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-[#46c7c7] text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} (
                {tab === "new" ? newOrders.length : tab === "shipped" ? shippedOrders.length : pendingOrders.length})
              </button>
            ))}
          </div>
          <div className="relative flex items-center">
            <FiSearch className="absolute left-3 text-gray-500" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#46c7c7]"
            />
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#46c7c7]"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-6">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {(activeTab === "new" ? newOrders : activeTab === "shipped" ? shippedOrders : pendingOrders).map(
            renderOrderCard
          )}
        </div>

        <div className="flex justify-center mt-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="mx-4">Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 disabled:opacity-50"
          >
            Next
          </button>
        </div>

        {selectedOrder && renderShippingModal()}
      </AdminLayout>
    </AuthCheck>
  );
}
