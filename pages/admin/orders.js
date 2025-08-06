import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import AuthCheck from "../../components/auth/AuthCheck";
import { db } from "../../lib/firebaseClient";
import { collection, onSnapshot, doc, updateDoc, query, orderBy, limit, startAfter, getDocs } from "firebase/firestore";
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
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const modalRef = useRef(null);

  // Handle modal click outside
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

  // Fetch orders with proper pagination
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const ordersCollection = collection(db, "orders");
        let q;

        if (currentPage === 1) {
          q = query(ordersCollection, orderBy("createdAt", "desc"), limit(ordersPerPage));
        } else {
          q = query(
            ordersCollection, 
            orderBy("createdAt", "desc"), 
            startAfter(lastDoc), 
            limit(ordersPerPage)
          );
        }

        const snapshot = await getDocs(q);
        const ordersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt || Date.now())
        }));

        if (currentPage === 1) {
          setOrders(ordersData);
        } else {
          setOrders(prev => [...prev, ...ordersData]);
        }

        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === ordersPerPage);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch orders.");
        console.error("Error fetching orders:", err);
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentPage, ordersPerPage]);

  // Real-time updates for order status changes
  useEffect(() => {
    const ordersCollection = collection(db, "orders");
    const q = query(ordersCollection, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const changes = snapshot.docChanges();
        changes.forEach((change) => {
          if (change.type === "modified") {
            const updatedOrder = {
              id: change.doc.id,
              ...change.doc.data(),
              createdAt: change.doc.data().createdAt?.toDate?.() || new Date(change.doc.data().createdAt || Date.now())
            };
            
            setOrders(prevOrders => 
              prevOrders.map(order => 
                order.id === updatedOrder.id ? updatedOrder : order
              )
            );
          }
        });
      },
      (err) => {
        console.error("Error listening to order changes:", err);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderDoc = doc(db, "orders", orderId);
      await updateDoc(orderDoc, { 
        status: newStatus,
        updatedAt: new Date()
      });

      // Optimistically update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      // Update selected order if it's the one being modified
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      setError("Failed to update order status.");
      console.error("Error updating order status:", err);
    }
  };

  const handleStatusChange = (order, e) => {
    e.stopPropagation();
    
    const statusFlow = {
      "New": "Pending",
      "Pending": "Shipped",
      "Shipped": "Pending"
    };
    
    const newStatus = statusFlow[order.status] || "Pending";
    updateOrderStatus(order.id, newStatus);
  };

  // Memoized filtered orders
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    
    return orders.filter((order) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        order.userInfo?.name?.toLowerCase().includes(searchLower) ||
        order.userInfo?.email?.toLowerCase().includes(searchLower) ||
        order.userInfo?.phone?.includes(searchQuery) ||
        order.id.toLowerCase().includes(searchLower)
      );
    });
  }, [orders, searchQuery]);

  // Categorized orders
  const newOrders = useMemo(() => filteredOrders.filter(order => order.status === "New"), [filteredOrders]);
  const pendingOrders = useMemo(() => filteredOrders.filter(order => order.status === "Pending"), [filteredOrders]);
  const shippedOrders = useMemo(() => filteredOrders.filter(order => order.status === "Shipped"), [filteredOrders]);

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
              {order.createdAt instanceof Date 
                ? order.createdAt.toLocaleDateString() 
                : new Date(order.createdAt).toLocaleDateString()
              }
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400">TOTAL</label>
            <p className="font-semibold text-[#46c7c7]">
              TND {(order.totalAmount || 0).toFixed(2)}
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
                : "bg-gray-100 text-gray-700"
            }`}>
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
        <button
          onClick={(e) => handleStatusChange(order, e)}
          className="flex items-center px-4 py-2 rounded-lg transition-colors bg-[#46c7c7] hover:bg-[#3aa8a8] text-white"
        >
          {order.status === "New" ? (
            <>
              <FiClock className="mr-2" />
              Mark Pending
            </>
          ) : order.status === "Pending" ? (
            <>
              <FiTruck className="mr-2" />
              Mark Shipped
            </>
          ) : (
            <>
              <FiClock className="mr-2" />
              Mark Pending
            </>
          )}
        </button>
      </div>
    </div>
  ), []);

  const renderShippingModal = () => {
    if (!selectedOrder) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              ref={modalRef}
              className="bg-white rounded-2xl p-8 max-w-4xl w-full space-y-6 shadow-xl max-h-[90vh] overflow-y-auto"
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
                      Order Items ({selectedOrder.items?.length || 0})
                    </h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {selectedOrder.items?.map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-white p-3 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{item.name || "Unnamed Item"}</p>
                            <p className="text-xs text-gray-500">
                              {item.size && `Size: ${item.size}`}
                              {item.size && item.color && " | "}
                              {item.color && `Color: ${item.color}`}
                              {item.quantity && ` | Qty: ${item.quantity}`}
                            </p>
                          </div>
                          <span className="font-medium">TND {(item.price || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <div className="flex justify-between items-center font-semibold">
                        <span>Total:</span>
                        <span className="text-[#46c7c7]">TND {(selectedOrder.totalAmount || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 text-sm text-gray-500">
                <p>Ordered on: {
                  selectedOrder.createdAt instanceof Date 
                    ? selectedOrder.createdAt.toLocaleString() 
                    : new Date(selectedOrder.createdAt).toLocaleString()
                }</p>
                {selectedOrder.updatedAt && (
                  <p>Last updated: {
                    selectedOrder.updatedAt instanceof Date 
                      ? selectedOrder.updatedAt.toLocaleString() 
                      : new Date(selectedOrder.updatedAt).toLocaleString()
                  }</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getCurrentOrders = () => {
    switch (activeTab) {
      case "new": return newOrders;
      case "shipped": return shippedOrders;
      case "pending": return pendingOrders;
      default: return newOrders;
    }
  };

  const currentOrders = getCurrentOrders();

  return (
    <AuthCheck>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                {[
                  { key: "new", label: "New", count: newOrders.length },
                  { key: "pending", label: "Pending", count: pendingOrders.length },
                  { key: "shipped", label: "Shipped", count: shippedOrders.length }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? "bg-[#46c7c7] text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
              
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#46c7c7] focus:ring-2 focus:ring-[#46c7c7]/20"
                />
              </div>
            </div>
          </div>

          {loading && currentOrders.length === 0 && (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#46c7c7]"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          )}

          {!loading && currentOrders.length === 0 ? (
            <div className="text-center py-12">
              <FiPackage className="mx-auto text-4xl text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No {activeTab} orders found</p>
              {searchQuery && (
                <p className="text-gray-400 text-sm mt-2">
                  Try adjusting your search criteria
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {currentOrders.map(renderOrderCard)}
            </div>
          )}

          {selectedOrder && renderShippingModal()}
        </div>
      </AdminLayout>
    </AuthCheck>
  );
}