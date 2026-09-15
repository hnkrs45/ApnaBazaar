import { useState } from "react";
import { Bell, Settings, LogOut, Plus, Eye, Edit, Trash } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getproducts, getVendors, removeproduct } from "../../API/product";
import AddProductForm from "./AddProduct";
import Swal from "sweetalert2";
import "./Products.css";

export default function Products() {
  const [addProduct, setAddProduct] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selected, setSelected] = useState("All");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["product"],
    queryFn: getproducts,
    select: (res) => res?.data || null
  });

  const { data: vendorsData } = useQuery({
    queryKey: ["vendors"],
    queryFn: getVendors,
    select: (res) => res?.data?.vendors || []
  });

  const [product, setProduct] = useState({
    name: "",
    price: "",
    vendor: "",
    stock: "",
    category: "",
    description: "",
    images: [],
  });

  const [mode, setMode] = useState("add");

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
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
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete them!",
    });

    if (result.isConfirmed) {
      try {
        for (const id of selectedProducts) {
          await removeproduct(id);
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
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      const res = await removeproduct(id);
      if (res?.data?.success) {
        Swal.fire("Deleted!", "Product has been deleted.", "success");
        refetch();
      } else {
        Swal.fire("Oops!", "Something went wrong.", "error");
      }
    }
  };

  const handleEdit = (product) => {
    setMode("edit");
    setAddProduct(true);
    const prodName = typeof product?.name === "object"
      ? (product?.name?.en || product?.name?.hi || "")
      : (product?.name || "");
    const prodDesc = typeof product?.description === "object"
      ? (product?.description?.en || product?.description?.hi || "")
      : (product?.description || "");
    setProduct({
      id: product?._id,
      name: prodName,
      price: product?.price,
      vendor: "",
      stock: product?.stock,
      category: product?.category,
      description: prodDesc,
      images: Array.isArray(product?.images) ? product.images : [],
    });
  };

  const filteredProducts = products.filter(p => {
    if (selected === "All") return true;
    if (selected === "Apnabazaar") {
      return !p?.vendor?.vendor?.companyName;
    }
    return p?.vendor?.vendor?.companyName === selected;
  });

  const avgPrice = products.length > 0 
    ? (products.reduce((acc, p) => acc + (Number(p.price) || 0), 0) / products.length).toFixed(2)
    : "0.00";

  return (
    <div className="products-container min-h-screen bg-gray-50">
      <div className="flex-1 w-full p-4 overflow-x-hidden products-content max-w-7xl mx-auto">
        {/* Top Bar */}
        <div className="products-desktop-header flex justify-between items-center gap-3 mb-6 w-full">
          <div>
            <h2 className="products-title text-2xl font-bold text-gray-900">Products Management</h2>
            <p className="text-sm text-gray-500">Manage catalog inventory, pricing, and vendor assignments</p>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => {
                setMode("add");
                setProduct({
                  name: "",
                  price: "",
                  vendor: "",
                  stock: "",
                  category: "",
                  description: "",
                  images: [],
                });
                setAddProduct(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="products-summary-grid grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs sm:text-sm">Total Products</p>
            <p className="products-summary-number text-xl md:text-2xl font-bold mt-1">{products.length}</p>
          </div>
          <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs sm:text-sm">In Stock</p>
            <p className="products-summary-number text-xl md:text-2xl font-bold mt-1 text-emerald-600">
              {products.filter((p) => Number(p.stock) > 0).length}
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs sm:text-sm">Out of Stock</p>
            <p className="products-summary-number text-xl md:text-2xl font-bold mt-1 text-red-500">
              {products.filter((p) => Number(p.stock) <= 0).length}
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs sm:text-sm">Avg. Price</p>
            <p className="products-summary-number text-xl md:text-2xl font-bold mt-1 text-gray-900">
              ₹{avgPrice}
            </p>
          </div>
        </div>

        {addProduct && (
          <AddProductForm 
            setAddProduct={setAddProduct} 
            refetch={refetch} 
            mode={mode} 
            product={product} 
            setProduct={setProduct} 
          />
        )}

        {/* Bulk Action Bar */}
        {selectedProducts.length > 0 && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex justify-between items-center">
            <span className="text-sm font-medium text-emerald-900">
              {selectedProducts.length} product(s) selected
            </span>
            <button
              onClick={handleDeleteSelected}
              className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-600 transition flex items-center gap-1"
            >
              <Trash className="w-3.5 h-3.5" /> Delete Selected
            </button>
          </div>
        )}

        {/* Filter Section */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2 items-center">
            <label className="text-sm font-medium text-gray-700">Filter by Vendor:</label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="border rounded-lg px-3 py-1.5 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">All Vendors</option>
              <option value="Apnabazaar">Direct ApnaBazaar</option>
              {Array.isArray(vendorsData) && vendorsData.map((v) => (
                <option key={v._id} value={v?.vendor?.companyName || v.name}>
                  {v?.vendor?.companyName || v.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500 text-base">No products found matching your filter criteria.</p>
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {filteredProducts.map((p) => (
                <div key={p._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(p._id)}
                      onChange={() => toggleSelectProduct(p._id)}
                      className="rounded text-emerald-600"
                    />
                    <img
                      src={p.images?.[0] || "/placeholder.png"}
                      alt={p.name?.en || p.name}
                      className="w-14 h-14 rounded-lg object-cover bg-gray-100"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{p.name?.en || p.name}</p>
                      <p className="text-xs text-gray-500">{p?.vendor?.vendor?.companyName || "ApnaBazaar"}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                        {p.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm pt-2 border-t">
                    <div>
                      <span className="font-bold text-gray-900">₹{p.price}</span>
                      {p.oldPrice && (
                        <span className="ml-2 line-through text-gray-400 text-xs">₹{p.oldPrice}</span>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      Number(p.stock) > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {Number(p.stock) > 0 ? `${p.stock} in stock` : "Out of Stock"}
                    </span>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <button
                      onClick={() => handleEdit(p)}
                      className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveItem(p._id)}
                      className="p-1.5 hover:bg-red-50 rounded text-red-600"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">
                      <input
                        type="checkbox"
                        onChange={(e) =>
                          setSelectedProducts(
                            e.target.checked ? products.map((p) => p._id) : []
                          )
                        }
                        checked={products.length > 0 && selectedProducts.length === products.length}
                        className="rounded text-emerald-600"
                      />
                    </th>
                    <th className="p-3.5">Product</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Vendor</th>
                    <th className="p-3.5">Price</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Stock</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredProducts.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50 transition">
                      <td className="p-3.5">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(p._id)}
                          onChange={() => toggleSelectProduct(p._id)}
                          className="rounded text-emerald-600"
                        />
                      </td>
                      <td className="p-3.5 flex items-center gap-3">
                        <img
                          src={p.images?.[0] || "/placeholder.png"}
                          alt={p.name?.en || p.name}
                          className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                        />
                        <div>
                          <p className="font-medium text-gray-900 truncate max-w-xs">{p.name?.en || p.name}</p>
                          <p className="text-xs text-gray-500">{p?.vendor?.vendor?.companyName || "ApnaBazaar"}</p>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-700">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-600">
                        {p?.vendor?.vendor?.companyName || "ApnaBazaar"}
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold text-gray-900">₹{p.price}</span>
                        {p.oldPrice && (
                          <span className="ml-1.5 line-through text-gray-400 text-xs">₹{p.oldPrice}</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          Number(p.stock) > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {Number(p.stock) > 0 ? "In Stock" : "Out of Stock"}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium text-gray-700">{p.stock || 0}</td>
                      <td className="p-3.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleEdit(p)}
                            title="Edit"
                            className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveItem(p._id)}
                            title="Delete"
                            className="p-1.5 hover:bg-red-50 rounded text-red-600 transition"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
