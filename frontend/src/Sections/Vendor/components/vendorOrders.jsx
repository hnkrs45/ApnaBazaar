import { useState } from "react";
import { Search, Filter, CheckCircle, Clock, Package, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getVendorOrders, updateOrderStatus } from "../../../../API/api";
import OrderCard from "./OrderDetail";
import { useLanguage } from "../../../services/LanguageContext";
import Swal from "sweetalert2";

const VendorOrders = () => {
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpenDetail, setIsOpenDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { t } = useLanguage();

  const {data, isLoading} = useQuery({
    queryKey: [`orders`],
    queryFn: getVendorOrders,
    select: (res) => res?.data || null
  })

  if (isLoading){
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50/50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-organic-green border-t-transparent mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  const orders = data?.orders || [];

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.orderStatus === "Processing").length,
    processing: orders.filter((o) => o.orderStatus === "Shipped").length,
    completed: orders.filter((o) => o.orderStatus === "Delivered").length,
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === "All" || o.orderStatus === statusFilter;
    const matchesSearch =
      o._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const onUpdateStatus = async (id, nextStatus) => {
    try {
      const res = await updateOrderStatus({id, nextStatus})

      if (res?.data?.success) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Order Status Updated",
          timer: 2000,
          showConfirmButton: false,
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

  const getStatusColor = (status) => {
    switch(status) {
      case "Delivered": return "bg-green-100 text-green-700 border-green-200";
      case "Pending": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Processing": return "bg-blue-100 text-blue-700 border-blue-200";
      case "Shipped": return "bg-purple-100 text-purple-700 border-purple-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  }

  return (
    <div className="p-6 md:p-10 w-full min-h-screen bg-gray-50/50 lg:pl-[280px]">
        {isOpenDetail && <OrderCard order={selectedOrder} setIsOpenDetail={setIsOpenDetail} onUpdateStatus={onUpdateStatus} />}
      
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-[32px] font-black text-gray-800">{t('vendorHub.orders')}</h2>
        <p className="text-gray-500 font-medium mt-1">
          Track and manage customer orders
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="p-6 rounded-3xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">{t('vendorHub.totalOrders')}</p>
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Package className="text-blue-500 w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-800">{stats?.total}</p>
        </div>
        <div className="p-6 rounded-3xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Processing</p>
            <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
                <Clock className="text-yellow-500 w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-800">{stats?.pending}</p>
        </div>
        <div className="p-6 rounded-3xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Shipped</p>
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <Package className="text-purple-500 w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-800">{stats?.processing}</p>
        </div>
        <div className="p-6 rounded-3xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Delivered</p>
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <CheckCircle className="text-organic-green w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-organic-green-dark">{stats?.completed}</p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
        <div className="flex items-center border border-gray-200 rounded-2xl px-4 py-1 flex-1 bg-white focus-within:border-organic-green focus-within:ring-2 focus-within:ring-organic-green/20 transition-all">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            placeholder="Search orders, customers..."
            className="p-2 w-full outline-none text-sm font-medium bg-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
            <select
            className="border border-gray-200 rounded-2xl px-4 py-3 bg-white text-sm font-bold text-gray-600 outline-none focus:border-organic-green transition-all"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            >
            <option value="All">All Statuses</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            </select>
            <button className="flex items-center justify-center gap-2 border border-gray-200 rounded-2xl px-5 py-3 bg-white text-sm font-bold text-gray-600 hover:text-organic-green hover:border-organic-green transition-all">
            <Filter className="w-4 h-4" /> Filters
            </button>
        </div>
      </div>

      {/* Orders Table (desktop) */}
      <div className="hidden lg:block overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-bold">
            <tr>
              <th className="p-5">Order ID</th>
              <th className="p-5">Customer</th>
              <th className="p-5">Date</th>
              <th className="p-5">Status</th>
              <th className="p-5">Total</th>
              <th className="p-5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredOrders.map((o) => (
              <tr key={o?._id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="p-5 font-bold text-gray-800 text-sm">{o?._id?.substring(0, 8)}...</td>
                <td className="p-5">
                  <p className="font-bold text-gray-800">{o?.user?.name || "Unknown"}</p>
                  <p className="text-xs text-gray-500">{o?.user?.email}</p>
                </td>
                <td className="p-5 text-sm font-medium text-gray-600">{new Date(o?.createdAt).toLocaleDateString()}</td>
                <td className="p-5">
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(o?.orderStatus)}`}
                  >
                    {o?.orderStatus}
                  </span>
                </td>
                <td className="p-5 font-black text-gray-800">₹{o?.totalAmount?.toFixed(2)}</td>
                <td className="p-5 text-center">
                    <button onClick={() => {setIsOpenDetail(true); setSelectedOrder(o)}} className="p-2.5 text-gray-400 hover:text-organic-green hover:bg-organic-green/10 rounded-xl transition-all inline-flex">
                        <Eye className="w-4 h-4" />
                    </button>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
                <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-400 font-bold border-t border-gray-100">
                        {t('vendorHub.noOrders')}
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="lg:hidden space-y-4">
        {filteredOrders.map((o) => (
          <div
            key={o._id}
            className="border border-gray-100 rounded-3xl bg-white shadow-sm p-5 space-y-4"
          >
            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <span className="font-bold text-gray-800 text-sm">#{o?._id?.substring(0,8)}</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(o?.orderStatus)}`}
              >
                {o?.orderStatus}
              </span>
            </div>
            
            <div>
                <p className="text-sm font-bold text-gray-800">{o?.user?.name || "Unknown"}</p>
                <p className="text-xs text-gray-500">{o?.user?.email}</p>
            </div>
            
            <div className="flex justify-between items-end pt-2">
                <div>
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Total</p>
                    <p className="text-lg font-black text-gray-800">₹{o?.totalAmount?.toFixed(2)}</p>
                </div>
                <button onClick={() => {setIsOpenDetail(true); setSelectedOrder(o)}} className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-organic-green text-gray-600 hover:text-white rounded-xl transition-colors font-bold text-sm">
                    <Eye className="w-4 h-4" /> View
                </button>
            </div>
          </div>
        ))}
        {filteredOrders.length === 0 && (
            <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-bold">{t('vendorHub.noOrders')}</p>
            </div>
        )}
      </div>
    </div>
  );
}

export default VendorOrders
