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
        index: product.index,
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
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Add New Product</h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Product Info Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-700 mb-6">Product Information</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Product Name</label>
                  <input
                    type="text"
                    name="name"
                    value={product.name}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46c7c7] focus:border-[#46c7c7] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Index</label>
                  <input
                    name="index"
                    value={product.index}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46c7c7] focus:border-[#46c7c7] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={product.description}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46c7c7] focus:border-[#46c7c7] transition-all h-32"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-700 mb-6">Pricing</h2>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Price (TND)</label>
                <input
                  type="number"
                  name="price"
                  value={product.price}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46c7c7] focus:border-[#46c7c7] transition-all"
                />
              </div>
            </div>

            {/* Images Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-700 mb-6">Product Images</h2>
              <div className="space-y-4">
                {product.images.map((url, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => handleImageChange(index, e.target.value)}
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46c7c7] focus:border-[#46c7c7] transition-all"
                      placeholder="https://example.com/image.jpg"
                    />
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeImageField(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <FiTrash className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addImageField}
                  className="flex items-center gap-2 text-[#46c7c7] hover:text-[#3aa8a8] font-medium py-2 px-4 rounded-lg border border-[#46c7c7] hover:border-[#3aa8a8] transition-all"
                >
                  <FiPlus className="w-5 h-5" />
                  Add Image URL
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:p-8">
  <h2 className="text-lg font-semibold text-gray-700 mb-6 md:text-xl md:mb-8">Sizes & Inventory</h2>
  <div className="space-y-4">
    {sizeInputs.map((input, index) => (
      <div key={index} className="flex flex-col md:flex-row gap-3 items-center md:items-start">
        <input
          type="text"
          placeholder="Size (e.g., S/M/L)"
          value={input.size}
          onChange={(e) => handleSizeStockChange(index, "size", e.target.value)}
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46c7c7] focus:border-[#46c7c7] transition-all w-full md:w-auto"
        />
        <input
          type="number"
          placeholder="Stock"
          value={input.stock}
          onChange={(e) => handleSizeStockChange(index, "stock", e.target.value)}
          className="w-full md:w-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46c7c7] focus:border-[#46c7c7] transition-all mt-2 md:mt-0"
        />
        {index > 0 && (
          <button
            type="button"
            onClick={() => removeSizeStockField(index)}
            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors mt-2 md:mt-0"
          >
            <FiTrash className="w-5 h-5" />
          </button>
        )}
      </div>
    ))}
    <button
      type="button"
      onClick={addSizeStockField}
      className="flex items-center gap-2 text-[#46c7c7] hover:text-[#3aa8a8] font-medium py-2 px-4 rounded-lg border border-[#46c7c7] hover:border-[#3aa8a8] transition-all mt-4 w-full md:w-auto justify-center"
    >
      <FiPlus className="w-5 h-5" />
      Add Size & Stock
    </button>
  </div>
</div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#46c7c7] hover:bg-[#3aa8a8] text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding Product...
                </div>
              ) : (
                "Add Product"
              )}
            </button>
          </form>
        </div>
      </AdminLayout>
    </AuthCheck>
  );
}