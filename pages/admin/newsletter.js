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
  onSnapshot,
} from "firebase/firestore";
import {
  FiSearch,
  FiTrash2,
  FiMail,
  FiUser,
  FiCalendar,
  FiSend,
  FiFilter,
  FiDownload,
  FiEye,
} from "react-icons/fi";

// Flux-inspired state management with added stats & filtering
const useNewsletterStore = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    activeThisMonth: 0,
    averageOpenRate: 0,
  });

  useEffect(() => {
    const q = query(
      collection(db, "newsletter_signups"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const subs = snapshot.docs.map((doc) => {
          const data = doc.data();
          const timestamp = data.timestamp ? data.timestamp.toDate() : null;
          const lastOpened = data.lastOpened ? data.lastOpened.toDate() : null;
          const openRate =
            data.openCount && data.emailsSent
              ? ((data.openCount / data.emailsSent) * 100).toFixed(1) + "%"
              : "N/A";

          return {
            id: doc.id,
            ...data,
            timestamp: timestamp ? timestamp.toLocaleDateString() : "N/A",
            lastOpened: lastOpened ? lastOpened.toLocaleDateString() : "Never",
            openRate,
            status: data.unsubscribed ? "Unsubscribed" : "Active",
          };
        });
        setSubscribers(subs);
        calculateStats(subs);
        setLoading(false);
      },
      (err) => {
        setError("Failed to fetch subscribers");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const calculateStats = (subs) => {
    const total = subs.length;
    const now = new Date();
    const activeThisMonth = subs.filter((sub) => {
      if (sub.lastOpened === "Never" || sub.lastOpened === "N/A") return false;
      const lastOpened = new Date(sub.lastOpened);
      return (
        lastOpened.getMonth() === now.getMonth() &&
        lastOpened.getFullYear() === now.getFullYear()
      );
    }).length;

    const openRates = subs
      .map((sub) => parseFloat(sub.openRate))
      .filter((rate) => !isNaN(rate));
    const averageOpenRate = openRates.length
      ? (openRates.reduce((a, b) => a + b, 0) / openRates.length).toFixed(1) +
        "%"
      : "N/A";

    setStats({ total, activeThisMonth, averageOpenRate });
  };

  const deleteSubscriber = async (id) => {
    try {
      await deleteDoc(doc(db, "newsletter_signups", id));
      return true;
    } catch (err) {
      setError("Failed to delete subscriber");
      return false;
    }
  };

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
    stats,
    deleteSubscriber,
    bulkDeleteSubscribers,
  };
};

// Email preview modal
const EmailPreview = ({ content, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto p-6">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-semibold">Email Preview</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
          &times;
        </button>
      </div>
      <div
        dangerouslySetInnerHTML={{ __html: content }}
        className="prose max-w-none"
      />
    </div>
  </div>
);

export default function Newsletter() {
  const {
    subscribers,
    loading,
    error,
    stats,
    deleteSubscriber,
    bulkDeleteSubscribers,
  } = useNewsletterStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [emailContent, setEmailContent] = useState(""); // HTML email content
  const [emailSubject, setEmailSubject] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  // Filter subscribers based on search term and status
  const filteredSubscribers = subscribers.filter((sub) => {
    const matchesSearch = sub.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "active"
        ? sub.status === "Active"
        : filterStatus === "unsubscribed"
        ? sub.status === "Unsubscribed"
        : true;
    return matchesSearch && matchesStatus;
  });

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (
      window.confirm(`Are you sure you want to delete ${selectedEmails.length} subscriber(s)?`)
    ) {
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
    }
  };

  // Handle individual delete
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this subscriber?")) {
      const success = await deleteSubscriber(id);
      if (success) {
        setNotification({ message: "Subscriber deleted successfully", type: "success" });
      } else {
        setNotification({ message: "Failed to delete subscriber", type: "error" });
      }
    }
  };

  // Select/deselect a subscriber
  const toggleEmailSelection = (id) => {
    setSelectedEmails((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  // Select all filtered subscribers
  const selectAllEmails = (e) => {
    if (e.target.checked) {
      setSelectedEmails(filteredSubscribers.map((sub) => sub.id));
    } else {
      setSelectedEmails([]);
    }
  };

  // Export filtered subscribers to CSV
  const exportSubscribers = () => {
    const csv = [
      ["Email", "Name", "Subscribed Date", "Status", "Open Rate", "Last Opened"],
      ...filteredSubscribers.map((sub) => [
        sub.email,
        sub.name || "",
        sub.timestamp,
        sub.status,
        sub.openRate,
        sub.lastOpened,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${new Date()
      .toISOString()
      .split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Send email to all filtered subscribers
  const handleSendEmail = async () => {
    if (!emailSubject.trim()) {
      setNotification({ message: "Please enter an email subject", type: "error" });
      return;
    }
    if (!emailContent.trim()) {
      setNotification({ message: "Please enter email content", type: "error" });
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails: filteredSubscribers.map((sub) => sub.email),
          subject: emailSubject,
          htmlContent: emailContent,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setNotification({ message: "Emails sent successfully!", type: "success" });
        setEmailSubject("");
        setEmailContent("");
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

          {/* Stats Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-gray-500 text-sm">Total Subscribers</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-gray-500 text-sm">Active This Month</div>
              <div className="text-2xl font-bold">{stats.activeThisMonth}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-gray-500 text-sm">Average Open Rate</div>
              <div className="text-2xl font-bold">{stats.averageOpenRate}</div>
            </div>
          </div>

          {/* Email Composer */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Compose Newsletter</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Subject Line</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Enter email subject..."
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#46c7c7]"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Email Content (HTML)
              </label>
              <textarea
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                placeholder="Paste your HTML email content here..."
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#46c7c7] h-48"
              />
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                <FiEye className="mr-2" /> Preview
              </button>
              <button
                onClick={handleSendEmail}
                disabled={isSending || filteredSubscribers.length === 0}
                className="flex items-center px-4 py-2 bg-[#46c7c7] text-white rounded hover:bg-[#3aa8a8] disabled:opacity-50"
              >
                <FiSend className="mr-2" />
                {isSending
                  ? "Sending..."
                  : `Send to ${filteredSubscribers.length} Subscribers`}
              </button>
            </div>
          </div>

          {/* Subscriber Management */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <h2 className="text-xl font-bold mb-4 md:mb-0">
                Subscriber Management ({filteredSubscribers.length})
              </h2>
              <button
                onClick={exportSubscribers}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                <FiDownload className="mr-2" /> Export CSV
              </button>
            </div>

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
              <div className="relative">
                <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg appearance-none"
                >
                  <option value="all">All Subscribers</option>
                  <option value="active">Active Only</option>
                  <option value="unsubscribed">Unsubscribed Only</option>
                </select>
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
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3">
                        <input
                          type="checkbox"
                          onChange={selectAllEmails}
                          checked={
                            filteredSubscribers.length > 0 &&
                            selectedEmails.length === filteredSubscribers.length
                          }
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Subscribed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Open Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Last Opened
                      </th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSubscribers.map((sub) => (
                      <tr key={sub.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedEmails.includes(sub.id)}
                            onChange={() => toggleEmailSelection(sub.id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{sub.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{sub.name || "—"}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{sub.timestamp}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{sub.status}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{sub.openRate}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{sub.lastOpened}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleDelete(sub.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Email Preview Modal */}
        {showPreview && (
          <EmailPreview content={emailContent} onClose={() => setShowPreview(false)} />
        )}
      </AdminLayout>
    </AuthCheck>
  );
}
