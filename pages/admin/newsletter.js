import { useState, useEffect } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import AuthCheck from "../../components/auth/AuthCheck";
import { db } from "../../lib/firebaseClient";
import {
  collection,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
  onSnapshot,
} from "firebase/firestore";
import { FiSearch, FiTrash2, FiMail, FiUser, FiCalendar, FiSend, FiDownload, FiEye } from "react-icons/fi";
import { marked } from "marked"; // For markdown to HTML conversion (optional)

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
  const [exportLoading, setExportLoading] = useState(false); // Export loading state

  // Filter subscribers based on search term
  const filteredSubscribers = subscribers.filter((sub) =>
    sub.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSubscribers = filteredSubscribers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSubscribers.length / itemsPerPage);

  // Handle bulk delete
  const handleBulkDelete = async () => {
    const success = await bulkDeleteSubscribers(selectedEmails);
    if (success) {
      setNotification({
        message: `Deleted ${selectedEmails.length} subscriber(s) successfully`,
        type: "success",
      });
      setSelectedEmails([]);
    } else {
      setNotification({ message: "Failed to delete subscribers", type: "error" });
    }
  };

  // Handle individual delete
  const handleDelete = async (id) => {
    const success = await deleteSubscriber(id);
    if (success) {
      setNotification({ message: "Subscriber deleted successfully", type: "success" });
    } else {
      setNotification({ message: "Failed to delete subscriber", type: "error" });
    }
  };

  // Toggle email selection
  const toggleEmailSelection = (id) => {
    setSelectedEmails((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  // Select all emails
  const selectAllEmails = () => {
    setSelectedEmails(currentSubscribers.map((sub) => sub.id));
  };

  // Handle sending email to all subscribers
  const handleSendEmail = async () => {
    if (!emailContent.trim()) {
      setNotification({ message: "Please enter email content", type: "error" });
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emails: subscribers.map((sub) => sub.email),
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
              className="w-full p-4 border border-gray-200 rounded-lg focus:border-[#46c7c7] focus:ring-2 focus:ring-[#46c7c7]/20 h-64 transition-all font-mono text-sm"
            />
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {emailContent.length} characters • {emailContent.split(/\s+/).length} words
              </span>
              <div className="flex gap-3">
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
                        {/* ... (spinner SVG) */}
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <FiSend className="w-5 h-5 mr-2" />
                      Broadcast to All Subscribers
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
                  onClick={handleBulkDelete}
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
                  <table className="w-full">
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
                      {currentSubscribers.map((sub) => (
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
                              onClick={() => handleDelete(sub.id)}
                              className="flex items-center text-gray-400 hover:text-rose-500 transition-colors"
                            >
                              <FiTrash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between p-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">
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
              <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Email Preview</h3>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: marked(emailContent) }}
                />
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AuthCheck>
  );
}