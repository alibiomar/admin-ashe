import { useState, useCallback, useEffect } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import AuthCheck from "../../components/auth/AuthCheck";
import { db } from "../../lib/firebaseClient";
import { collection, addDoc } from "firebase/firestore";
import { FiTrash, FiPlus, FiUpload } from "react-icons/fi";

export default function Products() {
  const initialProductState = {
    name: "",
    description: "",
    index: "",
    price: "",
    colors: [
      {
        name: "",
        code: "",
        images: [""],
        sizeInputs: [{ size: "", stock: "" }]
      }
    ]
  };

  const [product, setProduct] = useState(initialProductState);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });

  // Handle basic product input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
  };

  const convertGoogleDriveLink = (url) => {
    const match = url.match(/\/d\/(.*)\/view\?/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
    return url;
  };

  // -------------------- Colors Handling --------------------

  // Update a specific field in a specific color object
  const handleColorInputChange = (colorIndex, field, value) => {
    setProduct((prev) => {
      const updatedColors = [...prev.colors];
      updatedColors[colorIndex] = { ...updatedColors[colorIndex], [field]: value };
      return { ...prev, colors: updatedColors };
    });
  };

  // Update image URL for a specific color image field
  const handleColorImageChange = (colorIndex, imageIndex, value) => {
    setProduct((prev) => {
      const updatedColors = [...prev.colors];
      const color = updatedColors[colorIndex];
      const updatedImages = [...color.images];
      updatedImages[imageIndex] = convertGoogleDriveLink(value);
      updatedColors[colorIndex] = { ...color, images: updatedImages };
      return { ...prev, colors: updatedColors };
    });
  };

  const addColorImageField = (colorIndex) => {
    setProduct((prev) => {
      const updatedColors = [...prev.colors];
      const color = updatedColors[colorIndex];
      updatedColors[colorIndex] = { ...color, images: [...color.images, ""] };
      return { ...prev, colors: updatedColors };
    });
  };

  const removeColorImageField = (colorIndex, imageIndex) => {
    setProduct((prev) => {
      const updatedColors = [...prev.colors];
      const color = updatedColors[colorIndex];
      updatedColors[colorIndex] = {
        ...color,
        images: color.images.filter((_, i) => i !== imageIndex)
      };
      return { ...prev, colors: updatedColors };
    });
  };

  // Update size/stock for a specific color
  const handleColorSizeStockChange = (colorIndex, sizeStockIndex, field, value) => {
    setProduct((prev) => {
      const updatedColors = [...prev.colors];
      const color = updatedColors[colorIndex];
      const updatedSizeInputs = [...color.sizeInputs];
      updatedSizeInputs[sizeStockIndex] = {
        ...updatedSizeInputs[sizeStockIndex],
        [field]: value
      };
      updatedColors[colorIndex] = { ...color, sizeInputs: updatedSizeInputs };
      return { ...prev, colors: updatedColors };
    });
  };

  const addColorSizeStockField = (colorIndex) => {
    setProduct((prev) => {
      const updatedColors = [...prev.colors];
      const color = updatedColors[colorIndex];
      updatedColors[colorIndex] = {
        ...color,
        sizeInputs: [...color.sizeInputs, { size: "", stock: "" }]
      };
      return { ...prev, colors: updatedColors };
    });
  };

  const removeColorSizeStockField = (colorIndex, sizeStockIndex) => {
    setProduct((prev) => {
      const updatedColors = [...prev.colors];
      const color = updatedColors[colorIndex];
      updatedColors[colorIndex] = {
        ...color,
        sizeInputs: color.sizeInputs.filter((_, i) => i !== sizeStockIndex)
      };
      return { ...prev, colors: updatedColors };
    });
  };

  const addColorField = () => {
    setProduct((prev) => ({
      ...prev,
      colors: [
        ...prev.colors,
        { name: "", code: "", images: [""], sizeInputs: [{ size: "", stock: "" }] }
      ]
    }));
  };

  const removeColorField = (colorIndex) => {
    setProduct((prev) => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== colorIndex)
    }));
  };

  // -------------------- Form Submission --------------------

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Process each color by converting its sizeInputs into a stock object
      const processedColors = product.colors.map((color) => {
        const sizes = [];
        const stock = {};
        color.sizeInputs.forEach((input) => {
          const size = input.size.trim();
          if (size) {
            sizes.push(size);
            stock[size] = Number(input.stock) || 0;
          }
        });
        // Remove duplicate sizes if any
        const uniqueSizes = [...new Set(sizes)];
        return {
          name: color.name,
          code: color.code,
          images: color.images.filter((url) => url.trim()),
          stock
        };
      });

      // Compute overall product sizes (union of sizes from all colors)
      const overallSizes = Array.from(
        new Set(processedColors.flatMap((color) => Object.keys(color.stock)))
      );

      // Add product to Firestore using the Firebase structure
      const productsCollection = collection(db, "products");
      await addDoc(productsCollection, {
        name: product.name,
        index: product.index,
        description: product.description,
        price: Number(parseFloat(product.price).toFixed(2)),

        colors: processedColors,
        sizes: overallSizes,
        createdAt: new Date()
      });

      // Reset form
      setProduct(initialProductState);
      setNotification({ message: "Product added successfully!", type: "success" });
    } catch (error) {
      console.error("Error adding product:", error);
      setNotification({ message: error.message || "Failed to add product", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Clear notifications after a delay
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
            <div
              className={`fixed top-4 right-4 z-50 animate-slide-in p-4 rounded-lg shadow-lg ${
                notification.type === "success"
                  ? "bg-emerald-50 border border-emerald-200"
                  : "bg-rose-50 border border-rose-200"
              }`}
            >
              <span
                className={`text-sm ${
                  notification.type === "success" ? "text-emerald-700" : "text-rose-700"
                }`}
              >
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
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Product Name
                  </label>
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
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={product.description}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46c7c7] focus:border-[#46c7c7] transition-all h-32"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Index
                  </label>
                  <input
                    type="text"
                    name="index"
                    value={product.index}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46c7c7] focus:border-[#46c7c7] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-700 mb-6">Pricing</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Price (TND)
                  </label>
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
            </div>

            {/* Colors Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-700 mb-6">Colors</h2>
              <div className="space-y-8">
                {product.colors.map((color, colorIndex) => (
                  <div key={colorIndex} className="border p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-md font-semibold">Color {colorIndex + 1}</h3>
                      {product.colors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeColorField(colorIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FiTrash />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Color Name
                        </label>
                        <input
                          type="text"
                          value={color.name}
                          onChange={(e) =>
                            handleColorInputChange(colorIndex, "name", e.target.value)
                          }
                          required
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46c7c7] focus:border-[#46c7c7] transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Color Code
                        </label>
                        <input
                          type="text"
                          value={color.code}
                          onChange={(e) =>
                            handleColorInputChange(colorIndex, "code", e.target.value)
                          }
                          required
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46c7c7] focus:border-[#46c7c7] transition-all"
                        />
                      </div>
                    </div>
                    {/* Images for this color */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Images</h4>
                      <div className="space-y-3">
                        {color.images.map((url, imageIndex) => (
                          <div key={imageIndex} className="flex gap-3 items-center">
                            <input
                              type="url"
                              value={url}
                              onChange={(e) =>
                                handleColorImageChange(colorIndex, imageIndex, e.target.value)
                              }
                              required
                              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46c7c7] focus:border-[#46c7c7] transition-all"
                              placeholder="https://example.com/image.jpg"
                            />
                            {imageIndex > 0 && (
                              <button
                                type="button"
                                onClick={() => removeColorImageField(colorIndex, imageIndex)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                              >
                                <FiTrash className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addColorImageField(colorIndex)}
                          className="flex items-center gap-2 text-[#46c7c7] hover:text-[#3aa8a8] font-medium py-2 px-4 rounded-lg border border-[#46c7c7] hover:border-[#3aa8a8] transition-all"
                        >
                          <FiPlus className="w-5 h-5" />
                          Add Image URL
                        </button>
                      </div>
                    </div>
                    {/* Sizes & Inventory for this color */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Sizes & Inventory</h4>
                      <div className="space-y-3">
                        {color.sizeInputs.map((input, sizeIndex) => (
                          <div key={sizeIndex} className="flex flex-col md:flex-row gap-3 items-center">
                            <input
                              type="text"
                              placeholder="Size (e.g., S/M/L)"
                              value={input.size}
                              onChange={(e) =>
                                handleColorSizeStockChange(colorIndex, sizeIndex, "size", e.target.value)
                              }
                              required
                              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46c7c7] focus:border-[#46c7c7] transition-all"
                            />
                            <input
                              type="number"
                              placeholder="Stock"
                              value={input.stock}
                              onChange={(e) =>
                                handleColorSizeStockChange(colorIndex, sizeIndex, "stock", e.target.value)
                              }
                              required
                              className="w-full md:w-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46c7c7] focus:border-[#46c7c7] transition-all"
                            />
                            {sizeIndex > 0 && (
                              <button
                                type="button"
                                onClick={() => removeColorSizeStockField(colorIndex, sizeIndex)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                              >
                                <FiTrash className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addColorSizeStockField(colorIndex)}
                          className="flex items-center gap-2 text-[#46c7c7] hover:text-[#3aa8a8] font-medium py-2 px-4 rounded-lg border border-[#46c7c7] hover:border-[#3aa8a8] transition-all mt-4 w-full md:w-auto justify-center"
                        >
                          <FiPlus className="w-5 h-5" />
                          Add Size & Stock
                        </button>
                      </div>
                    </div>
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#46c7c7] hover:bg-[#3aa8a8] text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
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
