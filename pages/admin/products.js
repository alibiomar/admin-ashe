// pages/admin/products.js
import AdminLayout from "../../components/layout/AdminLayout";
import AuthCheck from "../../components/auth/AuthCheck";

export default function Products() {
  return (
    <AuthCheck>
      <AdminLayout>
        <h1 className="text-xl">Manage Products</h1>
        {/* Add product management components and logic here */}
      </AdminLayout>
    </AuthCheck>
  );
}
