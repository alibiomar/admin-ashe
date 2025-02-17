import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import AuthCheck from "../../components/auth/AuthCheck";
import { db } from "../../lib/firebaseClient";
import {
  collection,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import {
  FiSearch,
  FiTrash2,
  FiMail,
  FiUser,
  FiCalendar,
  FiSend,
  FiDownload,
  FiEye,
  FiX,
} from "react-icons/fi";
import { marked } from "marked"; 

// Flux-inspired state management
const useNewsletterStore = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch subscribers in real-time
  useEffect(() => {
    const q = query(collection(db, "newsletter_signups"), orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const subs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate().toLocaleDateString(),
        }));
        setSubscribers(subs);
        setLoading(false);
      },
      (err) => {
        setError("Failed to fetch subscribers");
        setLoading(false);
      }
    );

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  // Delete a subscriber
  const deleteSubscriber = async (id) => {
    try {
      await deleteDoc(doc(db, "newsletter_signups", id));
      return true;
    } catch (err) {
      setError("Failed to delete subscriber");
      return false;
    }
  };

  // Bulk delete subscribers
  const bulkDeleteSubscribers = async (ids) => {
    try {
      await Promise.all(ids.map((id) => deleteDoc(doc(db, "newsletter_signups", id))));
      return true;
    } catch (err) {
      setError("Failed to delete subscribers");
      return false;
    }
  };

  return {
    subscribers,
    loading,
    error,
    deleteSubscriber,
    bulkDeleteSubscribers,
  };
};

export default function Newsletter() {
  const {
    subscribers,
    loading,
    error,
    deleteSubscriber,
    bulkDeleteSubscribers,
  } = useNewsletterStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [emailContent, setEmailContent] = useState(""); // HTML email content
  const [isSending, setIsSending] = useState(false); // Loading state for sending emails
  const [currentPage, setCurrentPage] = useState(1); // Pagination state
  const [itemsPerPage] = useState(10); // Items per page
  const [showPreview, setShowPreview] = useState(false); // Email preview modal

  // Deletion confirmation modal state
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    type: "", // 'single' or 'bulk'
    id: null,
    ids: [],
  });

  // Filter subscribers based on search term
  const filteredSubscribers = subscribers.filter((sub) =>
    sub.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSubscribers = filteredSubscribers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSubscribers.length / itemsPerPage);

  // Show confirmation modal before bulk deletion
  const handleBulkDeleteConfirm = () => {
    if (selectedEmails.length > 0) {
      setDeleteConfirm({ show: true, type: "bulk", id: null, ids: selectedEmails });
    }
  };

  // Show confirmation modal before single deletion
  const handleDeleteConfirm = (id) => {
    setDeleteConfirm({ show: true, type: "single", id, ids: [] });
  };

  // Confirm deletion (bulk or single)
  const handleConfirmDelete = async () => {
    if (deleteConfirm.type === "single") {
      const success = await deleteSubscriber(deleteConfirm.id);
      if (success) {
        setNotification({ message: "Subscriber deleted successfully", type: "success" });
      } else {
        setNotification({ message: "Failed to delete subscriber", type: "error" });
      }
    } else if (deleteConfirm.type === "bulk") {
      const success = await bulkDeleteSubscribers(deleteConfirm.ids);
      if (success) {
        setNotification({ message: `Deleted ${deleteConfirm.ids.length} subscriber(s) successfully`, type: "success" });
        setSelectedEmails([]);
      } else {
        setNotification({ message: "Failed to delete subscribers", type: "error" });
      }
    }
    setDeleteConfirm({ show: false, type: "", id: null, ids: [] });
  };

  // Handle sending email (to selected if any, else broadcast to all)
  const handleSendEmail = async () => {
    if (!emailContent.trim()) {
      setNotification({ message: "Please enter email content", type: "error" });
      return;
    }

    setIsSending(true);
    try {
      const targetSubscribers =
        selectedEmails.length > 0
          ? subscribers.filter((sub) => selectedEmails.includes(sub.id))
          : subscribers;

      if (targetSubscribers.length === 0) {
        setNotification({ message: "No subscribers selected", type: "error" });
        setIsSending(false);
        return;
      }

      const response = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emails: targetSubscribers.map((sub) => sub.email),
          htmlContent: emailContent,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNotification({ message: "Emails sent successfully!", type: "success" });
      } else {
        setNotification({ message: data.error || "Failed to send emails", type: "error" });
      }
    } catch (err) {
      setNotification({ message: "Failed to send emails", type: "error" });
    } finally {
      setIsSending(false);
    }
  };

  // Clear notification after a delay
  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(() => {
        setNotification({ message: "", type: "" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Toggle email selection
  const toggleEmailSelection = (id) => {
    setSelectedEmails((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  // Select all emails on current page
  const selectAllEmails = () => {
    setSelectedEmails(currentSubscribers.map((sub) => sub.id));
  };

  // Memoize the renderSubscriber function to prevent unnecessary re-renders
  const renderSubscriber = useCallback(
    (sub) => (
      <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
        <td className="px-6 py-4">
          <input
            type="checkbox"
            checked={selectedEmails.includes(sub.id)}
            onChange={() => toggleEmailSelection(sub.id)}
            className="form-checkbox h-4 w-4 rounded border-gray-300 text-[#46c7c7] focus:ring-[#46c7c7]"
          />
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#46c7c7]/10 text-[#46c7c7]">
              <FiUser className="w-4 h-4" />
            </div>
            <div>
              <div className="font-medium text-gray-900">{sub.email}</div>
              {sub.name && <div className="text-sm text-gray-500">{sub.name}</div>}
            </div>
          </div>
        </td>
        <td className="px-6 py-4 text-sm text-gray-500">{sub.timestamp}</td>
        <td className="px-6 py-4">
          <button
            onClick={() => handleDeleteConfirm(sub.id)}
            className="flex items-center text-gray-400 hover:text-rose-500 transition-colors"
          >
            <FiTrash2 className="w-5 h-5" />
          </button>
        </td>
      </tr>
    ),
    [selectedEmails]
  );

  return (
    <AuthCheck>
      <AdminLayout>
        <div className="p-6 max-w-7xl mx-auto">
          {/* Notification Toast */}
          {notification.message && (
            <div className="fixed top-4 right-4 z-50 animate-slide-in">
              <div
                className={`flex items-center p-4 rounded-lg shadow-lg ${
                  notification.type === "success"
                    ? "bg-emerald-50 border border-emerald-200"
                    : "bg-rose-50 border border-rose-200"
                }`}
              >
                {notification.type === "success" ? (
                  <FiMail className="w-5 h-5 text-emerald-600 mr-3" />
                ) : (
                  <FiTrash2 className="w-5 h-5 text-rose-600 mr-3" />
                )}
                <span
                  className={`text-sm ${
                    notification.type === "success" ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {notification.message}
                </span>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Newsletter Management</h1>
              <p className="text-gray-500 mt-1">
                {subscribers.length} total subscribers • {filteredSubscribers.length} filtered
              </p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search subscribers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#46c7c7] focus:ring-2 focus:ring-[#46c7c7]/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Email Composition Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FiSend className="w-5 h-5 text-[#46c7c7]" />
              Compose Newsletter
            </h2>
            <textarea
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              placeholder="Write your HTML email content here..."
              className="w-full p-4 border border-gray-200 rounded-lg focus:border-[#46c7c7] focus:ring-2 focus:ring-[#46c7c7]/20 transition-all h-48 md:h-64 font-mono text-sm"
            />
            <div className="mt-4 flex flex-col md:flex-row items-center justify-between">
              <span className="text-sm text-gray-500 mb-2 md:mb-0">
                {emailContent.length} characters • {emailContent.split(/\s+/).length} words
              </span>
              <div className="flex gap-3 flex-col md:flex-row">
                <button
                  onClick={() => setShowPreview(true)}
                  className="flex items-center px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-all"
                >
                  <FiEye className="w-5 h-5 mr-2" />
                  Preview
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={isSending || subscribers.length === 0}
                  className="flex items-center px-6 py-2.5 bg-gradient-to-br from-[#46c7c7] to-[#3aa8a8] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:hover:opacity-50 transition-all"
                >
                  {isSending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <FiSend className="w-5 h-5 mr-2" />
                      {selectedEmails.length > 0 ? "Send to Selected" : "Broadcast to All Subscribers"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Subscribers Table Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Subscriber List</h3>
              {selectedEmails.length > 0 && (
                <button
                  onClick={handleBulkDeleteConfirm}
                  className="flex items-center px-4 py-2 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition-all"
                >
                  <FiTrash2 className="w-5 h-5 mr-2" />
                  Delete Selected ({selectedEmails.length})
                </button>
              )}
            </div>

            {loading ? (
              <div className="p-8">
                <div className="animate-pulse space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-100 rounded-lg"></div>
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <div className="inline-flex items-center px-4 py-2 bg-rose-50 text-rose-700 rounded-lg">
                  <FiTrash2 className="w-5 h-5 mr-2" />
                  {error}
                </div>
              </div>
            ) : filteredSubscribers.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex flex-col items-center">
                  <FiMail className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No subscribers found matching your criteria</p>
                  <p className="text-sm text-gray-400 mt-2">Try adjusting your search filters</p>
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                          <input
                            type="checkbox"
                            checked={selectedEmails.length === currentSubscribers.length}
                            onChange={selectAllEmails}
                            className="form-checkbox h-4 w-4 rounded border-gray-300 text-[#46c7c7] focus:ring-[#46c7c7]"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Subscriber</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Signup Date</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {currentSubscribers.map(renderSubscriber)}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500 mb-2 sm:mb-0">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredSubscribers.length)} of {filteredSubscribers.length} entries
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Email Preview Modal */}
          {showPreview && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-lg md:max-w-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Email Preview</h3>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: marked(emailContent) }}
                />
              </div>
            </div>
          )}

          {/* Deletion Confirmation Modal */}
          {deleteConfirm.show && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
                <p className="mb-6">
                  {deleteConfirm.type === "bulk"
                    ? `Are you sure you want to delete ${deleteConfirm.ids.length} subscriber(s)?`
                    : "Are you sure you want to delete this subscriber?"}
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setDeleteConfirm({ show: false, type: "", id: null, ids: [] })}
                    className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AuthCheck>
  );
}
