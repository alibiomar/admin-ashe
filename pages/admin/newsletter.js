// pages/admin/newsletter.js
import AdminLayout from "../../components/layout/AdminLayout";
import AuthCheck from "../../components/auth/AuthCheck";

export default function Newsletter() {
  return (
    <AuthCheck>
      <AdminLayout>
        <h1 className="text-xl">Manage Newsletter</h1>
        {/* Add newsletter management components and logic here */}
      </AdminLayout>
    </AuthCheck>
  );
}
