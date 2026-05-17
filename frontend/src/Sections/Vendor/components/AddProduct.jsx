import axios from "axios";
import { useState, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import Swal from "sweetalert2";
import { addVendorProduct, editVendorProduct } from "../../../../API/api";
import { Loader2, Languages } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "../../../services/LanguageContext";

const CLOUDINARY_UPLOAD_PRESET = "ecommerce";
const CLOUDINARY_CLOUD_NAME = "do9m8kc0b";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const AddProductForm = ({setAddProduct, refetch, product, setProduct, mode}) => {

  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [translating, setTranslating] = useState({ name: false, description: false });
  const lastTranslated = useRef({ enName: "", hiName: "", enDesc: "", hiDesc: "" });

  const translateText = async (text, from, to, field, subfield) => {
    if (!text || text.length < 3) return;
    
    // Avoid re-translating if it's the same as what we just translated
    const cacheKey = from === 'en' ? `en${subfield}` : `hi${subfield}`;
    if (lastTranslated.current[cacheKey] === text) return;

    try {
      setTranslating(prev => ({ ...prev, [field]: true }));
      const res = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`);
      const translated = res.data.responseData.translatedText;
      
      if (translated) {
        setProduct(prev => ({
          ...prev,
          [field]: {
            ...prev[field],
            [to]: translated
          }
        }));
        // Update cache to prevent infinite loops
        const targetCacheKey = to === 'en' ? `en${subfield}` : `hi${subfield}`;
        lastTranslated.current[targetCacheKey] = translated;
        lastTranslated.current[cacheKey] = text;
      }
    } catch (err) {
      console.error("Translation error:", err);
    } finally {
      setTranslating(prev => ({ ...prev, [field]: false }));
    }
  };

  // Debounced translation for Name
  useEffect(() => {
    if (product.name?.en && !product.name?.hi) {
      const timer = setTimeout(() => translateText(product.name.en, 'en', 'hi', 'name', 'Name'), 1000);
      return () => clearTimeout(timer);
    }
    if (product.name?.hi && !product.name?.en) {
      const timer = setTimeout(() => translateText(product.name.hi, 'hi', 'en', 'name', 'Name'), 1000);
      return () => clearTimeout(timer);
    }
  }, [product.name?.en, product.name?.hi]);

  // Debounced translation for Description
  useEffect(() => {
    if (product.description?.en && !product.description?.hi) {
      const timer = setTimeout(() => translateText(product.description.en, 'en', 'hi', 'description', 'Desc'), 1500);
      return () => clearTimeout(timer);
    }
    if (product.description?.hi && !product.description?.en) {
      const timer = setTimeout(() => translateText(product.description.hi, 'hi', 'en', 'description', 'Desc'), 1500);
      return () => clearTimeout(timer);
    }
  }, [product.description?.en, product.description?.hi]);

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

        queryClient.invalidateQueries(["products"]);
        queryClient.invalidateQueries(["featurePrd"]);
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

        queryClient.invalidateQueries(["products"]);
        queryClient.invalidateQueries(["featurePrd"]);
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">{mode === "add" ? t('vendorHub.addNewProduct') : t('vendorHub.editProduct')}</h2>
        <div className="flex items-center gap-2 px-3 py-1 bg-organic-green/10 text-organic-green rounded-full">
            <Languages size={16} />
            <span className="text-[11px] font-bold">{t('vendorHub.autoTranslateEnabled')}</span>
        </div>
      </div>
      <form onSubmit={mode==="add" ? handleSubmit : handleEdit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Product Name (English) */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center ml-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('vendorHub.productNameEn')}</label>
            {translating.name && <Loader2 className="w-3 h-3 animate-spin text-organic-green" />}
          </div>
          <input
            type="text"
            name="name.en"
            placeholder="e.g. Premium Sharbati Wheat"
            value={product.name?.en || ""}
            onChange={handleChange}
            className="border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-organic-green/50 w-full transition-all"
          />
        </div>

        {/* Product Name (Hindi) */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center ml-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('vendorHub.productNameHi')}</label>
            {translating.name && <Loader2 className="w-3 h-3 animate-spin text-organic-green" />}
          </div>
          <input
            type="text"
            name="name.hi"
            placeholder="उदा. प्रीमियम शरबती गेहूं"
            value={product.name?.hi || ""}
            onChange={handleChange}
            className="border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-organic-green/50 w-full transition-all"
          />
        </div>

        {/* Price */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{t('vendorHub.priceWithSymbol')}</label>
          <input
            type="number"
            name="price"
            placeholder="Price"
            value={product.price}
            onChange={handleChange}
            className="border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-organic-green/50 w-full transition-all"
          />
        </div>

        {/* Unit */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{t('vendorHub.unit')}</label>
          <select
            name="unit"
            value={product.unit || "Quintal"}
            onChange={handleChange}
            className="border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-organic-green/50 w-full transition-all appearance-none bg-no-repeat bg-right"
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
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{t('vendorHub.category')}</label>
          <select
            name="category"
            value={product.category}
            onChange={handleChange}
            className="border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-organic-green/50 w-full transition-all appearance-none bg-no-repeat bg-right"
          >
            <option value="">{t('vendorHub.selectCategory')}</option>
            {
              options.map((option, index) => {
                return <option key={index} value={option}>{option}</option>
              })
            }
          </select>
        </div>

        {/* Stock */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{t('vendorHub.stockAmount')}</label>
          <input
            type="number"
            name="stock"
            placeholder="Stock"
            value={product.stock}
            onChange={handleChange}
            className="border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-organic-green/50 w-full transition-all"
          />
        </div>

        {/* Location */}
        <div className="flex flex-col gap-1 col-span-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{t('vendorHub.farmLocation')}</label>
          <input
            type="text"
            name="location"
            placeholder="e.g. Sehore, Madhya Pradesh"
            value={product.location}
            onChange={handleChange}
            className="border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-organic-green/50 w-full transition-all"
          />
        </div>

        {/* Drag and Drop File Upload */}
        <div
          {...getRootProps()}
          className={`col-span-2 border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
            isDragActive ? "border-organic-green bg-organic-green/5" : "border-gray-200 hover:border-organic-green/50 hover:bg-gray-50"
          }`}
        >
          <input {...getInputProps()} />
          <p className="text-gray-500 text-sm font-medium">
            {uploading
              ? t('vendorHub.uploading')
              : isDragActive
              ? t('vendorHub.dropFilesHere')
              : t('vendorHub.dragDropImages')}
          </p>
        </div>

        {/* Preview of selected files */}
        <div className="col-span-2 flex gap-3 flex-wrap">
          {product.images.map((url, idx) => (
            <div key={idx} className="w-24 h-24 relative border-2 border-gray-100 rounded-2xl overflow-hidden group shadow-sm">
              <img src={url} alt={`uploaded-${idx}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  setProduct(prev => ({
                    ...prev,
                    images: prev.images.filter((_, i) => i !== idx)
                  }))
                }}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              >
                &times;
              </button>
            </div>
          ))}
        </div>

        {/* Description (English) */}
        <div className="col-span-2 flex flex-col gap-1">
          <div className="flex justify-between items-center ml-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('vendorHub.descriptionEn')}</label>
            {translating.description && <Loader2 className="w-4 h-4 animate-spin text-organic-green" />}
          </div>
          <textarea
            name="description.en"
            placeholder="Product Description in English..."
            value={product.description?.en || ""}
            onChange={handleChange}
            className="border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-organic-green/50 w-full transition-all min-h-[120px]"
            rows="4"
          ></textarea>
        </div>

        {/* Description (Hindi) */}
        <div className="col-span-2 flex flex-col gap-1">
          <div className="flex justify-between items-center ml-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('vendorHub.descriptionHi')}</label>
            {translating.description && <Loader2 className="w-4 h-4 animate-spin text-organic-green" />}
          </div>
          <textarea
            name="description.hi"
            placeholder="उत्पाद का विवरण हिंदी में..."
            value={product.description?.hi || ""}
            onChange={handleChange}
            className="border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-organic-green/50 w-full transition-all min-h-[120px]"
            rows="4"
          ></textarea>
        </div>

        {/* Buttons */}
        <div className="col-span-2 flex gap-4 mt-6">
          <button
            type="submit"
            className="flex-1 bg-black text-white px-8 py-3.5 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-black/10 active:scale-[0.98]"
          >
            {mode==="add" ? t('vendorHub.addProduct') : t('vendorHub.saveChanges')}
          </button>
          <button
            onClick={() => setAddProduct(false)}
            type="button"
            className="px-8 py-3.5 border-2 border-gray-100 text-gray-500 rounded-xl font-bold hover:bg-gray-50 transition-all active:scale-[0.98]"
          >
            {t('vendorHub.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProductForm;