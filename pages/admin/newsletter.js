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
import { FiSearch, FiTrash2, FiMail, FiUser, FiCalendar, FiSend } from "react-icons/fi";

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

  // Filter subscribers based on search term
  const filteredSubscribers = subscribers.filter((sub) =>
    sub.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    setSelectedEmails(filteredSubscribers.map((sub) => sub.id));
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
        <div className="p-6 max-w-6xl mx-auto">
          {/* Notification */}
          {notification.message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                notification.type === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {notification.message}
            </div>
          )}

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h1 className="text-2xl font-bold mb-4 md:mb-0">
              Newsletter Subscribers ({filteredSubscribers.length})
            </h1>
          </div>

          {/* Email Content Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Email Content (HTML)</label>
            <textarea
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              placeholder="Paste your HTML email content here..."
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#46c7c7] h-48"
            />
            <button
              onClick={handleSendEmail}
              disabled={isSending || subscribers.length === 0}
              className="mt-4 flex items-center px-4 py-2 bg-[#46c7c7] text-white rounded hover:bg-[#3aa8a8] disabled:opacity-50"
            >
              <FiSend className="mr-2" />
              {isSending ? "Sending..." : `Send to ${subscribers.length} Subscribers`}
            </button>
          </div>

          {/* Controls */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
            {selectedEmails.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                <FiTrash2 className="mr-2" /> Delete Selected ({selectedEmails.length})
              </button>
            )}
          </div>

          {/* Subscribers Table */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#46c7c7] mx-auto"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          ) : filteredSubscribers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FiMail className="text-4xl mx-auto mb-4" />
              No subscribers found
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <input
                        type="checkbox"
                        checked={selectedEmails.length === filteredSubscribers.length}
                        onChange={selectAllEmails}
                        className="form-checkbox h-4 w-4"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <FiUser className="inline mr-2" /> Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <FiCalendar className="inline mr-2" /> Subscribed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSubscribers.map((sub) => (
                    <tr key={sub.id}>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedEmails.includes(sub.id)}
                          onChange={() => toggleEmailSelection(sub.id)}
                          className="form-checkbox h-4 w-4"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{sub.email}</div>
                        {sub.name && <div className="text-sm text-gray-500">{sub.name}</div>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{sub.timestamp}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDelete(sub.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FiTrash2 className="inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AdminLayout>
    </AuthCheck>
  );
}