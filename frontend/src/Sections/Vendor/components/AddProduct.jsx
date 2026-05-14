import axios from "axios";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import Swal from "sweetalert2";
import { addVendorProduct, editVendorProduct } from "../../../../API/api";

const CLOUDINARY_UPLOAD_PRESET = "ecommerce";
const CLOUDINARY_CLOUD_NAME = "do9m8kc0b";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const AddProductForm = ({setAddProduct, refetch, product, setProduct, mode}) => {

  const [uploading, setUploading] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setProduct((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setProduct((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Upload images to cloudinary
  const onDrop = async (acceptedFiles) => {
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
        images: [...prev.images, ...uploadedImages],
      }));
    } catch (err) {
      console.error("Cloudinary upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: { "image/*": [] },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Form Validation
    if (!product.name?.en?.trim() || !product.name?.hi?.trim()) {
      return Swal.fire({ icon: "error", title: "Error", text: "Product Name is required in both English and Hindi" });
    }
    if (!product.price || product.price <= 0) {
      return Swal.fire({ icon: "error", title: "Error", text: "Price must be greater than 0" });
    }
    if (!product.stock || product.stock < 0) {
      return Swal.fire({ icon: "error", title: "Error", text: "Stock cannot be negative" });
    }
    if (!product.category) {
      return Swal.fire({ icon: "error", title: "Error", text: "Please select a category" });
    }
    if (!product.description?.en?.trim() || !product.description?.hi?.trim()) {
      return Swal.fire({ icon: "error", title: "Error", text: "Description is required in both English and Hindi" });
    }
    if (!product.images.length) {
      return Swal.fire({ icon: "error", title: "Error", text: "Please upload at least one image" });
    }

    // Submit the product
    try {
      const res = await addVendorProduct(product);

      if (res?.data?.success) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Product added successfully",
          timer: 2000,
          showConfirmButton: false,
        });

        refetch();
        setProduct({
          name: { en: "", hi: "" },
          price: "",
          vendor: "",
          stock: "",
          unit: "Quintal",
          category: "",
          location: "",
          description: { en: "", hi: "" },
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
    if (!product.name?.en?.trim() || !product.name?.hi?.trim()) {
      return Swal.fire({ icon: "error", title: "Error", text: "Product Name is required in both English and Hindi" });
    }
    if (!product.price || product.price <= 0) {
      return Swal.fire({ icon: "error", title: "Error", text: "Price must be greater than 0" });
    }
    if (!product.stock || product.stock < 0) {
      return Swal.fire({ icon: "error", title: "Error", text: "Stock cannot be negative" });
    }
    if (!product.category) {
      return Swal.fire({ icon: "error", title: "Error", text: "Please select a category" });
    }
    if (!product.description?.en?.trim() || !product.description?.hi?.trim()) {
      return Swal.fire({ icon: "error", title: "Error", text: "Description is required in both English and Hindi" });
    }
    if (!product.images.length) {
      return Swal.fire({ icon: "error", title: "Error", text: "Please upload at least one image" });
    }

    // Submit the product
    const res = await editVendorProduct(product);
    try {
      if (res?.data?.success) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Product added successfully",
          timer: 2000,
          showConfirmButton: false,
        });

        refetch();
        setProduct({
          name: { en: "", hi: "" },
          price: "",
          vendor: "",
          stock: "",
          unit: "Quintal",
          category: "",
          location: "",
          description: { en: "", hi: "" },
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
  }

  const options = ["Vegetables", "Fruits", "Dairy & Eggs", "Grains", "Pulses", "Spices", "Other"];
  const units = ["kg", "Quintal", "Tonne"];

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-md rounded-xl p-6 mt-[30px] mb-[30px]">
      <h2 className="text-lg font-semibold mb-4">{mode === "add" ? "Add New Product" : "Edit Product"}</h2>
      <form onSubmit={mode==="add" ? handleSubmit : handleEdit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Product Name (English) */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-500 ml-1">Product Name (English)</label>
          <input
            type="text"
            name="name.en"
            placeholder="e.g. Premium Sharbati Wheat"
            value={product.name?.en || ""}
            onChange={handleChange}
            className="border rounded-md px-3 py-2 focus:outline-none focus:ring w-full"
          />
        </div>

        {/* Product Name (Hindi) */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-500 ml-1">Product Name (Hindi)</label>
          <input
            type="text"
            name="name.hi"
            placeholder="उदा. प्रीमियम शरबती गेहूं"
            value={product.name?.hi || ""}
            onChange={handleChange}
            className="border rounded-md px-3 py-2 focus:outline-none focus:ring w-full"
          />
        </div>

        {/* Price */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-500 ml-1">Price (₹)</label>
          <input
            type="number"
            name="price"
            placeholder="Price"
            value={product.price}
            onChange={handleChange}
            className="border rounded-md px-3 py-2 focus:outline-none focus:ring w-full"
          />
        </div>

        {/* Unit */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-500 ml-1">Unit</label>
          <select
            name="unit"
            value={product.unit || "Quintal"}
            onChange={handleChange}
            className="border rounded-md px-3 py-2 focus:outline-none focus:ring w-full"
          >
            {
              units.map((unit, index) => {
                return <option key={index} value={unit}>{unit}</option>
              })
            }
          </select>
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-500 ml-1">Category</label>
          <select
            name="category"
            value={product.category}
            onChange={handleChange}
            className="border rounded-md px-3 py-2 focus:outline-none focus:ring w-full"
          >
            <option value="">Select Category</option>
            {
              options.map((option, index) => {
                return <option key={index} value={option}>{option}</option>
              })
            }
          </select>
        </div>

        {/* Stock */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-500 ml-1">Stock Amount</label>
          <input
            type="number"
            name="stock"
            placeholder="Stock"
            value={product.stock}
            onChange={handleChange}
            className="border rounded-md px-3 py-2 focus:outline-none focus:ring w-full"
          />
        </div>

        {/* Location */}
        <div className="flex flex-col gap-1 col-span-2">
          <label className="text-xs font-bold text-gray-500 ml-1">Farm Location</label>
          <input
            type="text"
            name="location"
            placeholder="e.g. Sehore, Madhya Pradesh"
            value={product.location}
            onChange={handleChange}
            className="border rounded-md px-3 py-2 focus:outline-none focus:ring w-full"
          />
        </div>

        {/* Drag and Drop File Upload */}
        <div
          {...getRootProps()}
          className={`col-span-2 border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer ${
            isDragActive ? "border-indigo-500 bg-indigo-50" : "border-gray-300"
          }`}
        >
          <input {...getInputProps()} />
          <p className="text-gray-600 text-sm">
            {uploading
              ? "Uploading..."
              : isDragActive
              ? "Drop the files here..."
              : "Drag & drop product images here, or click to select files"}
          </p>
        </div>

        {/* Preview of selected files */}
        <div className="col-span-2 flex gap-3 flex-wrap">
          {product.images.map((url, idx) => (
            <div key={idx} className="w-24 h-24 relative border-2 border-gray-200 rounded-xl overflow-hidden group">
              <img src={url} alt={`uploaded-${idx}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  setProduct(prev => ({
                    ...prev,
                    images: prev.images.filter((_, i) => i !== idx)
                  }))
                }}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                &times;
              </button>
            </div>
          ))}
        </div>

        {/* Description (English) */}
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-500 ml-1">Description (English)</label>
          <textarea
            name="description.en"
            placeholder="Product Description in English..."
            value={product.description?.en || ""}
            onChange={handleChange}
            className="border rounded-md px-3 py-2 focus:outline-none focus:ring w-full"
            rows="3"
          ></textarea>
        </div>

        {/* Description (Hindi) */}
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-500 ml-1">Description (Hindi)</label>
          <textarea
            name="description.hi"
            placeholder="उत्पाद का विवरण हिंदी में..."
            value={product.description?.hi || ""}
            onChange={handleChange}
            className="border rounded-md px-3 py-2 focus:outline-none focus:ring w-full"
            rows="3"
          ></textarea>
        </div>

        {/* Buttons */}
        <div className="col-span-2 flex gap-3 mt-2">
          <button
            type="submit"
            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            {mode==="add" ? "Add Product" : "Save Changes"}
          </button>
          <button
            onClick={() => setAddProduct(false)}
            type="button"
            className="border px-6 py-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProductForm;