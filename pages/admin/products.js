import { useState, useCallback, useEffect } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import AuthCheck from "../../components/auth/AuthCheck";
import { db } from "../../lib/firebaseClient";
import { collection, addDoc } from "firebase/firestore";
import { FiTrash, FiPlus, FiUpload } from "react-icons/fi";

export default function Products() {
  const [product, setProduct] = useState({
    name: "",
    description: "",
    index: "",
    price: "",
    images: [""],
    sizes: [],
    colors: [],
    stock: {},
    colorSizeStock: {}
  });

  const [sizeInputs, setSizeInputs] = useState([
    { size: "", stock: "" }
  ]);
  
  const [colorInputs, setColorInputs] = useState([
    { color: "", displayName: "" }
  ]);
  
  const [colorSizeStockInputs, setColorSizeStockInputs] = useState([
    { color: "", size: "", stock: "" }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });

  // Handle basic input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
  };

  const convertGoogleDriveLink = (url) => {
    const match = url.match(/\/d\/(.*)\/view\?/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
    return url; // Return original URL if it's not a Google Drive link
  };

  // Handle image URL changes
  const handleImageChange = (index, value) => {
    const newImages = [...product.images];
    newImages[index] = convertGoogleDriveLink(value);
    setProduct(prev => ({ ...prev, images: newImages }));
  };

  // Handle size/stock input changes
  const handleSizeStockChange = (index, field, value) => {
    const newSizeInputs = [...sizeInputs];
    newSizeInputs[index][field] = value;
    setSizeInputs(newSizeInputs);
  };
  
  // Handle color input changes
  const handleColorChange = (index, field, value) => {
    const newColorInputs = [...colorInputs];
    newColorInputs[index][field] = value;
    setColorInputs(newColorInputs);
  };
  
  // Handle color-size-stock input changes
  const handleColorSizeStockChange = (index, field, value) => {
    const newInputs = [...colorSizeStockInputs];
    newInputs[index][field] = value;
    setColorSizeStockInputs(newInputs);
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
  
  // Add new color field
  const addColorField = () => {
    setColorInputs(prev => [...prev, { color: "", displayName: "" }]);
  };
  
  // Remove color field
  const removeColorField = (index) => {
    setColorInputs(prev => prev.filter((_, i) => i !== index));
  };
  
  // Add new color-size-stock field
  const addColorSizeStockField = () => {
    setColorSizeStockInputs(prev => [...prev, { color: "", size: "", stock: "" }]);
  };
  
  // Remove color-size-stock field
  const removeColorSizeStockField = (index) => {
    setColorSizeStockInputs(prev => prev.filter((_, i) => i !== index));
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

      // Process colors
      const colors = [];
      const colorMap = {};

      colorInputs.forEach(input => {
        const color = input.color.trim();
        if (color) {
          colors.push(color);
          colorMap[color] = input.displayName.trim() || color;
        }
      });
      
      // Process color-size-stock combinations
      const colorSizeStock = {};
      
      colorSizeStockInputs.forEach(input => {
        const color = input.color.trim();
        const size = input.size.trim();
        
        if (color && size) {
          const key = `${color}-${size}`;
          colorSizeStock[key] = Number(input.stock) || 0;
        }
      });

      // Validate sizes
      const uniqueSizes = [...new Set(sizes)];
      if (sizes.length !== uniqueSizes.length) {
        throw new Error("Duplicate sizes found");
      }
      
      // Validate colors
      const uniqueColors = [...new Set(colors)];
      if (colors.length !== uniqueColors.length) {
        throw new Error("Duplicate colors found");
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
        colors: uniqueColors,
        stock: stockMap, // Keeping for backward compatibility
        colorNames: colorMap, // Optional - for display names
        colorSizeStock: colorSizeStock, // New structure for color+size inventory
        createdAt: new Date()
      });

      // Reset form
      setProduct({
        name: "",
        description: "",
        price: "",
        index: "",
        images: [""],
        sizes: [],
        colors: [],
        stock: {},
        colorSizeStock: {}
      });
      setSizeInputs([{ size: "", stock: "" }]);
      setColorInputs([{ color: "", displayName: "" }]);
      setColorSizeStockInputs([{ color: "", size: "", stock: "" }]);

      setNotification({ message: "Product added successfully!", type: "success" });
    } catch (error) {
      console.error("Error adding product:", error);
      setNotification({ message: error.message || "Failed to add product", type: "error" });
    } finally {
      setLoading(false);
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
        <div className="p-6 max-w-4xl mx-auto">
          {notification.message && (
            <div className={`fixed top-4 right-4 z-50 animate-slide-in p-4 rounded-lg shadow-lg ${notification.type === "success" ? "bg-emerald-50 border border-emerald-200" : "bg-rose-50 border border-rose-200"}`}>
              <span className={`text-sm ${notification.type === "success" ? "text-emerald-700" : "text-rose-700"}`}>
                {notification.message}
              </span>
            </div>
          )}

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
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-700 mb-6">Index</h2>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Number of the product</label>
                <input
                  type="text"
                  name="index"
                  value={product.index}
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

            {/* Colors Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:p-8">
              <h2 className="text-lg font-semibold text-gray-700 mb-6 md:text-xl md:mb-8">Colors</h2>
              <div className="space-y-4">
                {colorInputs.map((input, index) => (
                  <div key={index} className="flex flex-col md:flex-row gap-3 items-center md:items-start">
                    <input
                      type="text"
                      placeholder="Color code (e.g., #FF0000 or red)"
                      value={input.color}
                      onChange={(e) => handleColorChange(index, "color", e.target.value)}
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46c7c7] focus:border-[#46c7c7] transition-all w-full md:w-auto"
                    />
                    <input
                      type="text"
                      placeholder="Display name (optional)"
                      value={input.displayName}
                      onChange={(e) => handleColorChange(index, "displayName", e.target.value)}
                      className="w-full md:w-48 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46c7c7] focus:border-[#46c7c7] transition-all mt-2 md:mt-0"
                    />
                    {input.color && (
                      <div 
                        className="w-10 h-10 border border-gray-300 rounded-lg mt-2 md:mt-1"
                        style={{ backgroundColor: input.color }}
                        aria-label={`Color preview: ${input.color}`}
                      ></div>
                    )}
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeColorField(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors mt-2 md:mt-0"
                      >
                        <FiTrash className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addColorField}
                  className="flex items-center gap-2 text-[#46c7c7] hover:text-[#3aa8a8] font-medium py-2 px-4 rounded-lg border border-[#46c7c7] hover:border-[#3aa8a8] transition-all mt-4 w-full md:w-auto justify-center"
                >
                  <FiPlus className="w-5 h-5" />
                  Add Color
                </button>
              </div>
            </div>

            {/* Sizes & Inventory Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:p-8">
              <h2 className="text-lg font-semibold text-gray-700 mb-6 md:text-xl md:mb-8">Sizes</h2>
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
                      placeholder="Default Stock"
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
                  Add Size
                </button>
              </div>
            </div>
            
            {/* Color-Size Stock Combinations */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:p-8">
              <h2 className="text-lg font-semibold text-gray-700 mb-6 md:text-xl md:mb-8">Color & Size Inventory</h2>
              
              {colorInputs.length === 0 || sizeInputs.length === 0 ? (
                <div className="text-amber-600 bg-amber-50 p-4 rounded-lg">
                  Please add at least one color and one size before setting inventory.
                </div>
              ) : (
                <div className="space-y-4">
                  {colorSizeStockInputs.map((input, index) => (
                    <div key={index} className="flex flex-col md:flex-row gap-3 items-center md:items-start">
                      <select
                        value={input.color}
                        onChange={(e) => handleColorSizeStockChange(index, "color", e.target.value)}
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46c7c7] focus:border-[#46c7c7] transition-all"
                      >
                        <option value="">Select Color</option>
                        {colorInputs.map((colorInput, cidx) => 
                          colorInput.color ? (
                            <option key={`color-opt-${cidx}`} value={colorInput.color}>
                              {colorInput.displayName || colorInput.color}
                            </option>
                          ) : null
                        ).filter(Boolean)}
                      </select>
                      
                      <select
                        value={input.size}
                        onChange={(e) => handleColorSizeStockChange(index, "size", e.target.value)}
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46c7c7] focus:border-[#46c7c7] transition-all"
                      >
                        <option value="">Select Size</option>
                        {sizeInputs.map((sizeInput, sidx) => 
                          sizeInput.size ? (
                            <option key={`size-opt-${sidx}`} value={sizeInput.size}>
                              {sizeInput.size}
                            </option>
                          ) : null
                        ).filter(Boolean)}
                      </select>
                      
                      <input
                        type="number"
                        placeholder="Stock"
                        value={input.stock}
                        onChange={(e) => handleColorSizeStockChange(index, "stock", e.target.value)}
                        className="w-full md:w-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46c7c7] focus:border-[#46c7c7] transition-all"
                      />
                      
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeColorSizeStockField(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <FiTrash className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={addColorSizeStockField}
                    className="flex items-center gap-2 text-[#46c7c7] hover:text-[#3aa8a8] font-medium py-2 px-4 rounded-lg border border-[#46c7c7] hover:border-[#3aa8a8] transition-all mt-4 w-full md:w-auto justify-center"
                  >
                    <FiPlus className="w-5 h-5" />
                    Add Color-Size Combination
                  </button>
                </div>
              )}
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