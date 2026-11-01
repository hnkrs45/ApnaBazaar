import { useState } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { addproduct, editProduct } from "../../API/product";
import Swal from "sweetalert2";
import { Trash2, UploadCloud, Plus } from "lucide-react";

const CLOUDINARY_UPLOAD_PRESET = "ecommerce";
const CLOUDINARY_CLOUD_NAME = "do9m8kc0b";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const AddProductForm = ({ setAddProduct, refetch, mode, product, setProduct }) => {
  const [uploading, setUploading] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
  };

  // Upload images to cloudinary
  const onDrop = async (acceptedFiles) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;
    setUploading(true);
    try {
      const uploadedImages = await Promise.all(
        acceptedFiles.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

          const res = await axios.post(CLOUDINARY_URL, formData);
          return res.data.secure_url; // return the uploaded URL
        })
      );

      setProduct((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...uploadedImages],
      }));
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: "Could not upload image(s). You can also enter direct image URLs below.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAddImageUrl = (e) => {
    e.preventDefault();
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      return Swal.fire({
        icon: "warning",
        title: "Invalid URL",
        text: "Please enter a valid image URL starting with http:// or https://",
      });
    }

    setProduct((prev) => ({
      ...prev,
      images: [...(prev.images || []), trimmed],
    }));
    setImageUrlInput("");
  };

  const handleRemoveImage = (indexToRemove) => {
    setProduct((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: { "image/*": [] },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Form Validation
    if (!product.name?.trim()) {
      return Swal.fire({ icon: "error", title: "Error", text: "Product Name is required" });
    }
    if (!product.price || Number(product.price) <= 0) {
      return Swal.fire({ icon: "error", title: "Error", text: "Price must be greater than 0" });
    }
    if (product.stock === undefined || product.stock === "" || Number(product.stock) < 0) {
      return Swal.fire({ icon: "error", title: "Error", text: "Stock cannot be negative" });
    }
    if (!product.category) {
      return Swal.fire({ icon: "error", title: "Error", text: "Please select a category" });
    }
    if (!product.description?.trim()) {
      return Swal.fire({ icon: "error", title: "Error", text: "Description is required" });
    }
    if (!product.images || !product.images.length) {
      return Swal.fire({ icon: "error", title: "Error", text: "Please upload or enter at least one image" });
    }

    // Submit the product
    try {
      const res = await addproduct(product);

      if (res?.data?.success) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Product added successfully",
          timer: 2000,
          showConfirmButton: false,
        });

        if (typeof refetch === "function") refetch();
        setAddProduct(false);
        setProduct({
          name: "",
          price: "",
          vendor: "",
          stock: "",
          category: "",
          description: "",
          images: [],
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: res?.data?.message || "Something went wrong!",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Server error",
      });
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();

    // Form Validation
    if (!product.name?.trim()) {
      return Swal.fire({ icon: "error", title: "Error", text: "Product Name is required" });
    }
    if (!product.price || Number(product.price) <= 0) {
      return Swal.fire({ icon: "error", title: "Error", text: "Price must be greater than 0" });
    }
    if (product.stock === undefined || product.stock === "" || Number(product.stock) < 0) {
      return Swal.fire({ icon: "error", title: "Error", text: "Stock cannot be negative" });
    }
    if (!product.category) {
      return Swal.fire({ icon: "error", title: "Error", text: "Please select a category" });
    }
    if (!product.description?.trim()) {
      return Swal.fire({ icon: "error", title: "Error", text: "Description is required" });
    }
    if (!product.images || !product.images.length) {
      return Swal.fire({ icon: "error", title: "Error", text: "Please upload or enter at least one image" });
    }

    try {
      const res = await editProduct(product);

      if (res?.data?.success) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Product updated successfully",
          timer: 2000,
          showConfirmButton: false,
        });

        if (typeof refetch === "function") refetch();
        setAddProduct(false);
        setProduct({
          name: "",
          price: "",
          vendor: "",
          stock: "",
          category: "",
          description: "",
          images: [],
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: res?.data?.message || "Something went wrong!",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Server error",
      });
    }
  };

  // Dedicated Grocery Tags / Categories (Vegetables & Fruits separated, non-groceries removed)
  const options = [
    "Vegetables",
    "Fruits",
    "Dairy & Eggs",
    "Grains",
    "Pulses",
    "Spices",
    "Dry Fruits",
    "Edible Oils & Ghee",
    "Snacks & Beverages",
    "Bakery & Breads",
    "Groceries & Staples",
  ];

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-md rounded-xl p-6 mt-[30px] mb-[30px]">
      <h2 className="text-lg font-semibold mb-4">
        {mode === "add" ? "Add New Product" : "Edit Product"}
      </h2>
      <form onSubmit={mode === "add" ? handleSubmit : handleEdit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Product Name */}
        <input
          type="text"
          name="name"
          placeholder="Product Name"
          value={product.name}
          onChange={handleChange}
          className="border rounded-md px-3 py-2 focus:outline-none focus:ring w-full"
        />

        {/* Price */}
        <input
          type="number"
          name="price"
          placeholder="Price"
          value={product.price}
          onChange={handleChange}
          className="border rounded-md px-3 py-2 focus:outline-none focus:ring w-full"
        />

        {/* Stock */}
        <input
          type="number"
          name="stock"
          placeholder="Stock"
          value={product.stock}
          onChange={handleChange}
          className="border rounded-md px-3 py-2 focus:outline-none focus:ring w-full"
        />

        {/* Category Dropdown */}
        <select
          name="category"
          value={product.category}
          onChange={handleChange}
          className="border rounded-md px-3 py-2 focus:outline-none focus:ring w-full"
        >
          <option value="">Select Category</option>
          {options.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>

        {/* Drag and Drop File Upload */}
        <div
          {...getRootProps()}
          className={`col-span-2 border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition ${
            isDragActive ? "border-emerald-500 bg-emerald-50/50" : "border-gray-300 hover:border-emerald-400 bg-gray-50/50"
          }`}
        >
          <input {...getInputProps()} />
          <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-gray-700 text-sm font-medium">
            {uploading
              ? "Uploading images to Cloudinary..."
              : isDragActive
              ? "Drop the files here..."
              : "Drag & drop product images here, or click to browse files"}
          </p>
          <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP formats supported</p>
        </div>

        {/* Or add by Image URL */}
        <div className="col-span-2 flex gap-2">
          <input
            type="url"
            placeholder="Or enter image URL (https://...)"
            value={imageUrlInput}
            onChange={(e) => setImageUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddImageUrl(e);
              }
            }}
            className="border rounded-md px-3 py-2 text-sm flex-1 focus:outline-none focus:ring focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={handleAddImageUrl}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add URL
          </button>
        </div>

        {/* Preview of current product images */}
        {product.images && product.images.length > 0 && (
          <div className="col-span-2 space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold uppercase text-gray-600 tracking-wider">
                Product Images ({product.images.length})
              </label>
              <span className="text-xs text-gray-500">
                First image is used as the cover thumbnail
              </span>
            </div>
            <div className="flex gap-3 flex-wrap">
              {product.images.map((url, idx) => (
                <div
                  key={idx}
                  className="w-24 h-24 relative border-2 border-gray-200 rounded-lg overflow-hidden group bg-gray-50 shadow-sm transition hover:border-gray-400"
                >
                  <img
                    src={url}
                    alt={`product-img-${idx}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "/placeholder.png";
                    }}
                  />
                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    title="Delete image"
                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow transition flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {/* Cover / Position Badge */}
                  <span className="absolute bottom-1 left-1 bg-black/75 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                    {idx === 0 ? "Cover" : `#${idx + 1}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <textarea
          name="description"
          placeholder="Product Description (use **bold** or *italic*)"
          value={product.description}
          onChange={handleChange}
          className="col-span-2 border rounded-md px-3 py-2 focus:outline-none focus:ring w-full"
          rows="3"
        ></textarea>

        {/* Buttons */}
        <div className="col-span-2 flex gap-3 mt-2">
          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition cursor-pointer"
          >
            {mode === "add" ? "Add Product" : "Save Changes"}
          </button>
          <button
            onClick={() => setAddProduct(false)}
            type="button"
            className="border px-4 py-2 rounded-md hover:bg-gray-100 transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProductForm;
