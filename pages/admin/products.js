import { useState } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import AuthCheck from "../../components/auth/AuthCheck";
import { db } from "../../lib/firebaseClient";
import { collection, addDoc } from "firebase/firestore";
import { FiTrash, FiPlus } from "react-icons/fi";

export default function Products() {
  const [product, setProduct] = useState({
    name: "",
    description: "",
    price: "",
    images: [""],
    sizes: [],
    stock: {}
  });

  const [sizeInputs, setSizeInputs] = useState([
    { size: "", stock: "" }
  ]);
  const [loading, setLoading] = useState(false);

  // Handle basic input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
  };

  // Handle image URL changes
  const handleImageChange = (index, value) => {
    const newImages = [...product.images];
    newImages[index] = value;
    setProduct(prev => ({ ...prev, images: newImages }));
  };

  // Handle size/stock input changes
  const handleSizeStockChange = (index, field, value) => {
    const newSizeInputs = [...sizeInputs];
    newSizeInputs[index][field] = value;
    setSizeInputs(newSizeInputs);
  };

  // Add new image field
  const addImageField = () => {
    setProduct(prev => ({ ...prev, images: [...prev.images, ""] }));
  };

  // Remove image field
  const removeImageField = (index) => {
    setProduct(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Add new size/stock pair
  const addSizeStockField = () => {
    setSizeInputs(prev => [...prev, { size: "", stock: "" }]);
  };

  // Remove size/stock pair
  const removeSizeStockField = (index) => {
    setSizeInputs(prev => prev.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Process sizes and stock
      const sizes = [];
      const stockMap = {};
      
      sizeInputs.forEach(input => {
        const size = input.size.trim();
        if (size) {
          sizes.push(size);
          stockMap[size] = Number(input.stock) || 0;
        }
      });

      // Validate sizes
      const uniqueSizes = [...new Set(sizes)];
      if (sizes.length !== uniqueSizes.length) {
        throw new Error("Duplicate sizes found");
      }

      // Add product to Firestore
      const productsCollection = collection(db, "products");
      await addDoc(productsCollection, {
        name: product.name,
        description: product.description,
        price: parseFloat(product.price),
        images: product.images.filter(url => url.trim()),
        sizes: uniqueSizes,
        stock: stockMap,
        createdAt: new Date()
      });

      // Reset form
      setProduct({
        name: "",
        description: "",
        price: "",
        images: [""],
        sizes: [],
        stock: {}
      });
      setSizeInputs([{ size: "", stock: "" }]);
      
      alert("Product added successfully!");
    } catch (error) {
      console.error("Error adding product:", error);
      alert(error.message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCheck>
      <AdminLayout>
        <div className="p-6 max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Manage Products</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Product Name</label>
              <input
                type="text"
                name="name"
                value={product.name}
                onChange={handleInputChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>

            {/* Product Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={product.description}
                onChange={handleInputChange}
                required
                className="w-full p-2 border rounded h-32"
              />
            </div>

            {/* Product Price */}
            <div>
              <label className="block text-sm font-medium mb-2">Price (TND)</label>
              <input
                type="number"
                name="price"
                value={product.price}
                onChange={handleInputChange}
                required
                step="0.01"
                className="w-full p-2 border rounded"
              />
            </div>

            {/* Product Images */}
            <div>
              <label className="block text-sm font-medium mb-2">Image URLs</label>
              <div className="space-y-2">
                {product.images.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => handleImageChange(index, e.target.value)}
                      className="flex-1 p-2 border rounded"
                      placeholder="https://example.com/image.jpg"
                    />
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeImageField(index)}
                        className="p-2 text-red-500 hover:text-red-700"
                      >
                        <FiTrash />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addImageField}
                  className="flex items-center gap-1 text-sm text-[#46c7c7] hover:text-[#3aa8a8]"
                >
                  <FiPlus /> Add Another Image
                </button>
              </div>
            </div>

            {/* Sizes and Stock */}
            <div>
              <label className="block text-sm font-medium mb-2">Sizes & Stock</label>
              <div className="space-y-2">
                {sizeInputs.map((input, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Size (e.g., S/M/L)"
                      value={input.size}
                      onChange={(e) => handleSizeStockChange(index, "size", e.target.value)}
                      className="flex-1 p-2 border rounded"
                    />
                    <input
                      type="number"
                      placeholder="Stock"
                      value={input.stock}
                      onChange={(e) => handleSizeStockChange(index, "stock", e.target.value)}
                      className="w-24 p-2 border rounded"
                    />
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeSizeStockField(index)}
                        className="p-2 text-red-500 hover:text-red-700"
                      >
                        <FiTrash />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSizeStockField}
                  className="flex items-center gap-1 text-sm text-[#46c7c7] hover:text-[#3aa8a8]"
                >
                  <FiPlus /> Add Size & Stock
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#46c7c7] text-white p-3 rounded hover:bg-[#3aa8a8] disabled:opacity-50"
            >
              {loading ? "Adding Product..." : "Add Product"}
            </button>
          </form>
        </div>
      </AdminLayout>
    </AuthCheck>
  );
}