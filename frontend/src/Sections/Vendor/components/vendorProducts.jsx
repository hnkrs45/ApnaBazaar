import { useState } from "react";
import { Bell, Settings, LogOut, Plus, Eye, Edit, Trash, Menu, X, Cross } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getVendorProducts, removeVendorProduct } from "../../../../API/api";
import AddProductForm from "./AddProduct";
import Swal from "sweetalert2";
import { useLanguage } from "../../../services/LanguageContext";
import "./product.css";

export default function Products() {
  const [addProduct, setAddProduct] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const { t } = useLanguage();
  
  const {data, isLoading, refetch} = useQuery({
    queryKey: ["product"],
    queryFn: getVendorProducts,
    select: (res) => res?.data || null
  })
  const [product, setProduct] = useState({
    name: "",
    price: "",
    stock: "",
    category: "",
    description: "",
    images: [],
  });
  const [mode, setMode] = useState("add")
  
  if (isLoading){
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50/50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-organic-green border-t-transparent mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  const products = data?.products || [];
  
  const toggleSelectProduct = (id) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedProducts.length === 0) {
      Swal.fire("No Product Selected", "Please select at least one product.", "warning");
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete ${selectedProducts.length} products!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete them!",
    });

    if (result.isConfirmed) {
      try {
        for (const id of selectedProducts) {
          await removeVendorProduct(id);
        }
        Swal.fire("Deleted!", "Selected products have been deleted.", "success");
        setSelectedProducts([]);
        refetch();
      } catch {
        Swal.fire("Oops!", "Something went wrong.", "error");
      }
    }
  };

  const handleRemoveItem = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      const res = await removeVendorProduct(id);
      if (res?.data?.success) {
        Swal.fire({
          title: "Deleted!",
          text: "Product has been deleted successfully.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
        refetch();
      } else {
        Swal.fire({
          title: "Oops!",
          text: "Something went wrong.",
          icon: "error",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    }
  };

  const handleEdit = (product) => {
    setMode("edit")
    setAddProduct(true)
    setProduct({
      id: product?._id,
      name: product?.name,
      price: product?.price,
      vendor: "",
      stock: product?.stock,
      category: product?.category,
      description: product?.description,
      images: product?.images || [],
    })
  }

  return (
    <div className="products-container min-h-screen bg-gray-50/50 lg:pl-[280px]">
      <div className="flex-1 w-full p-6 md:p-10 overflow-x-hidden products-content">
        {/* Top Bar */}
        <div className="products-desktop-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 w-full">
          <h2 className="products-title text-[32px] font-black text-gray-800">{t('vendorHub.productsMgmt')}</h2>
          <div className="flex gap-3 items-center hidden sm:flex">
            <button className="p-3 bg-white border border-gray-200 text-gray-600 rounded-2xl hover:text-organic-green hover:border-organic-green hover:shadow-sm transition-all">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-3 bg-white border border-gray-200 text-gray-600 rounded-2xl hover:text-organic-green hover:border-organic-green hover:shadow-sm transition-all">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="products-summary-grid grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">{t('vendorHub.totalProducts')}</p>
            <p className="products-summary-number text-3xl font-black text-gray-800">{products.length}</p>
          </div>
          <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">{t('vendorHub.inStock')}</p>
            <p className="products-summary-number text-3xl font-black text-organic-green-dark">
              {products.filter((p) => p.stock > 0).length}
            </p>
          </div>
          <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">{t('vendorHub.outOfStock')}</p>
            <p className="products-summary-number text-3xl font-black text-red-500">
              {products.filter((p) => p.stock <= 0).length}
            </p>
          </div>
          <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">{t('vendorHub.avgPrice')}</p>
            <p className="products-summary-number text-3xl font-black text-gray-800">
              ₹
              {products.length > 0 ? (
                products.reduce((acc, p) => acc + (Number(p.price) || 0), 0) / products.length
              ).toFixed(2) : "0.00"}
            </p>
          </div>
        </div>
        {addProduct && <AddProductForm setAddProduct={setAddProduct} refetch={refetch} product={product} setProduct={setProduct} mode={mode} />}

        {selectedProducts.length > 0 && (
          <div className="mb-6 flex">
            <button
              onClick={handleDeleteSelected}
              className="px-6 py-2.5 bg-red-50 text-red-600 font-bold hover:bg-red-100 rounded-2xl transition-all shadow-sm flex items-center gap-2"
            >
              <Trash size={18}/> {t('vendorHub.deleteSelected')} ({selectedProducts.length})
            </button>
          </div>
        )}

        {/* Mobile Product Cards */}
        <div className="products-mobile-cards lg:hidden mb-6">
          <div className="p-3 flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
                <input
                type="checkbox"
                className="w-5 h-5 rounded border-gray-300 text-organic-green focus:ring-organic-green"
                onChange={(e) =>
                    setSelectedProducts(
                    e.target.checked ? products.map((p) => p._id) : []
                    )
                }
                checked={selectedProducts.length > 0 && selectedProducts.length === products.length}
                />
                <span className="text-sm font-bold text-gray-500">Select All</span>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {products.map((p, index) => (
              <div key={index} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-start gap-4 mb-4">
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-gray-300 text-organic-green focus:ring-organic-green"
                      checked={selectedProducts.includes(p._id)}
                      onChange={() => toggleSelectProduct(p._id)}
                    />
                  </div>
                  <div className="w-20 h-20 bg-gray-50 rounded-2xl p-1 border border-gray-100 shrink-0">
                    <img
                        src={p.images?.[0] || ""}
                        alt={p.name}
                        className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 text-base line-clamp-2 leading-tight mb-1">{p.name}</h3>
                    <p className="text-xs text-gray-500 truncate mb-2">{p?.vendor?.vendor?.companyName}</p>
                    <span className="inline-block px-3 py-1 bg-organic-green/10 text-organic-green font-bold rounded-full text-xs">
                      {p.category}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mb-4 bg-gray-50 p-4 rounded-2xl">
                  <div>
                    <p className="text-gray-400 font-bold uppercase text-[10px] mb-1">{t('vendorHub.price')}</p>
                    <p className="font-black text-gray-800 text-lg">₹{p.price}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-gray-400 font-bold uppercase text-[10px] mb-1">{t('vendorHub.status')}</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      parseInt(p.stock) > 0
                        ? "bg-green-100 text-green-600" 
                        : "bg-red-100 text-red-600"
                    }`}>
                      {parseInt(p.stock) > 0 ? t('vendorHub.inStock') : t('vendorHub.outOfStock')}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button className="p-2.5 bg-gray-50 hover:bg-organic-green hover:text-white text-gray-500 rounded-xl transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleEdit(p)} className="p-2.5 bg-gray-50 hover:bg-blue-500 hover:text-white text-gray-500 rounded-xl transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleRemoveItem(p._id)} className="p-2.5 bg-red-50 hover:bg-red-500 hover:text-white text-red-600 rounded-xl transition-colors">
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {products.length === 0 && (
                <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 font-bold">No products found</p>
                </div>
            )}
          </div>
        </div>

        {/* Table for Large Screens */}
        <div className="products-desktop-table hidden lg:block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-bold">
              <tr>
                 <th className="p-5 w-16 text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-organic-green focus:ring-organic-green"
                    onChange={(e) =>
                      setSelectedProducts(
                        e.target.checked ? products.map((p) => p._id) : []
                      )
                    }
                    checked={selectedProducts.length > 0 && selectedProducts.length === products.length}
                  />
                </th>
                <th className="p-5">{t('vendorHub.product')}</th>
                <th className="p-5">{t('vendorHub.category')}</th>
                <th className="p-5">{t('vendorHub.price')}</th>
                <th className="p-5">{t('vendorHub.status')}</th>
                <th className="p-5">{t('vendorHub.rating')}</th>
                <th className="p-5 text-center">{t('vendorHub.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-50/50 transition-colors group"
                >
                  <td className="p-5 text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-organic-green focus:ring-organic-green"
                      checked={selectedProducts.includes(p._id)}
                      onChange={() => toggleSelectProduct(p._id)}
                    />
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white border border-gray-100 rounded-xl p-1 shrink-0 group-hover:border-organic-green/30 transition-colors">
                            <img
                            src={p.images?.[0] || ""}
                            alt={p.name}
                            className="w-full h-full object-contain"
                            />
                        </div>
                        <div>
                        <p className="font-bold text-gray-800 truncate w-48">{p.name}</p>
                        </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 font-medium rounded-full text-xs">
                      {p.category}
                    </span>
                  </td>
                  <td className="p-5">
                    <span className="font-black text-gray-800 text-base">₹{p.price}</span>
                  </td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      parseInt(p.stock) > 0
                        ? "bg-green-100 text-green-600" 
                        : "bg-red-100 text-red-600"
                    }`}>
                      {parseInt(p.stock) > 0 ? t('vendorHub.inStock') : t('vendorHub.outOfStock')}
                  </span>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-1">
                        <span className="font-bold text-gray-800">{p.ratings?.average || 0}</span>
                        <span className="text-yellow-400 text-sm">⭐</span>
                        <span className="text-gray-400 text-xs ml-1">({p.reviews?.length || 0})</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex justify-center gap-2">
                        <button className="p-2 text-gray-400 hover:text-organic-green hover:bg-organic-green/10 rounded-xl transition-all">
                        <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEdit(p)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all">
                        <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleRemoveItem(p._id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                        <Trash className="w-4 h-4" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-400 font-bold">
                        No products found
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="products-fab fixed bottom-8 right-8 z-40 flex items-end group">
        <div className="products-fab-tooltip w-fit p-2 absolute right-16 bg-gray-800 text-white font-bold rounded-xl mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <p className="text-xs whitespace-nowrap px-2">{t('vendorHub.addProduct')}</p>
        </div>
        <button 
          onClick={() => setAddProduct(!addProduct)}
          className="flex items-center justify-center w-14 h-14 bg-organic-green text-white rounded-2xl shadow-lg shadow-organic-green/30 transition-transform duration-200 hover:scale-110 active:scale-95"
        >
          {addProduct ? <Plus className="w-6 h-6 rotate-45 transition-transform duration-200" /> : <Plus className="w-6 h-6 transition-transform duration-200"/>}
        </button>
      </div>
    </div>
  );
}
