import { useState } from "react";
import { Search, Filter, CheckCircle, Clock, Package, EyeIcon } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllOrders, updateOrderStatus } from "../../API/product";
import OrderCard from "./orderDetail";
import Swal from "sweetalert2";

export default function Orders() {
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpenDetail, setIsOpenDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: getAllOrders,
    select: (res) => res?.data || null
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  const orders = Array.isArray(data?.orders) ? data.orders : [];

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.orderStatus === "Pending").length,
    processing: orders.filter((o) => o.orderStatus === "Processing").length,
    completed: orders.filter((o) => o.orderStatus === "Delivered" || o.orderStatus === "Completed").length,
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === "All" || o.orderStatus === statusFilter;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesStatus;

    const matchesSearch =
      (o._id && o._id.toLowerCase().includes(query)) ||
      (o.orderId && o.orderId.toLowerCase().includes(query)) ||
      (o.user?.name && o.user.name.toLowerCase().includes(query)) ||
      (o.user?.email && o.user.email.toLowerCase().includes(query)) ||
      (o.shippingAddress?.name && o.shippingAddress.name.toLowerCase().includes(query));

    return matchesStatus && matchesSearch;
  });

  const onUpdateStatus = async (id, nextStatus) => {
    try {
      const res = await updateOrderStatus({ id, nextStatus });

      if (res?.data?.success) {
        setSelectedOrder(res.data.order);
        await queryClient.invalidateQueries({ queryKey: ["orders"] });
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Order status updated",
          timer: 1800,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Update failed",
          text: res?.data?.message || "Unable to update order status",
        });
      }

      return res;
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Update failed",
        text: err?.response?.data?.message || err.message || "Unable to update order status",
      });
      return err?.response;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Delivered":
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Processing":
        return "bg-blue-100 text-blue-800";
      case "Shipped":
        return "bg-purple-100 text-purple-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {isOpenDetail && (
        <OrderCard 
          order={selectedOrder} 
          setIsOpenDetail={setIsOpenDetail} 
          onUpdateStatus={onUpdateStatus} 
        />
      )}

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Orders Management</h2>
        <p className="text-gray-500 text-sm md:text-base">
          Track fulfillment status, payment confirmations, and customer details
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
          <p className="text-gray-500 text-xs sm:text-sm">Total Orders</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl md:text-2xl font-bold text-gray-900">{stats.total}</span>
            <Package className="text-blue-500 w-5 h-5" />
          </div>
        </div>
        <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
          <p className="text-gray-500 text-xs sm:text-sm">Pending</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl md:text-2xl font-bold text-yellow-600">{stats.pending}</span>
            <Clock className="text-yellow-500 w-5 h-5" />
          </div>
        </div>
        <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
          <p className="text-gray-500 text-xs sm:text-sm">Processing</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl md:text-2xl font-bold text-blue-600">{stats.processing}</span>
            <Package className="text-purple-500 w-5 h-5" />
          </div>
        </div>
        <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
          <p className="text-gray-500 text-xs sm:text-sm">Delivered</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl md:text-2xl font-bold text-green-600">{stats.completed}</span>
            <CheckCircle className="text-green-500 w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="flex items-center border border-gray-200 rounded-lg px-3 flex-1 bg-white focus-within:ring-2 focus-within:ring-emerald-500">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            placeholder="Search by Order ID, customer name, email..."
            className="p-2 w-full outline-none text-sm bg-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No orders found.</p>
          <p className="text-gray-400 text-sm mt-1">Try changing your search terms or filter selection.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Order ID</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Total</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredOrders.map((o) => (
                  <tr key={o?._id} className="hover:bg-gray-50 transition">
                    <td className="p-3.5 font-medium text-gray-900">
                      <p>{o?.orderId || o?._id?.slice(-8)}</p>
                      <p className="text-xs text-gray-400">{o?.paymentMethod} • {o?.paymentStatus}</p>
                    </td>
                    <td className="p-3.5">
                      <p className="font-medium text-gray-900">{o?.shippingAddress?.name || o?.user?.name || "Customer"}</p>
                      <p className="text-xs text-gray-500">{o?.shippingAddress?.email || o?.user?.email}</p>
                    </td>
                    <td className="p-3.5 text-gray-600">
                      {o?.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : "N/A"}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(o?.orderStatus)}`}>
                        {o?.orderStatus}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-gray-900">
                      ₹{Number(o?.totalAmount || 0).toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedOrder(o);
                          setIsOpenDetail(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-medium transition"
                      >
                        <EyeIcon className="w-3.5 h-3.5" /> View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
            {filteredOrders.map((o) => (
              <div
                key={o._id}
                className="border border-gray-100 rounded-xl bg-white shadow-sm p-4 space-y-2.5"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-gray-900">{o.orderId || o._id.slice(-8)}</span>
                    <p className="text-xs text-gray-400">{o.paymentMethod} • {o.paymentStatus}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(o?.orderStatus)}`}>
                    {o?.orderStatus}
                  </span>
                </div>

                <div className="text-sm">
                  <p className="font-medium text-gray-800">{o?.shippingAddress?.name || o?.user?.name || "Customer"}</p>
                  <p className="text-xs text-gray-500">{o?.shippingAddress?.email || o?.user?.email}</p>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t">
                  <span>📅 {o?.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : "N/A"}</span>
                  <span className="text-sm font-bold text-gray-900">₹{Number(o?.totalAmount || 0).toFixed(2)}</span>
                </div>

                <button
                  onClick={() => {
                    setSelectedOrder(o);
                    setIsOpenDetail(true);
                  }}
                  className="w-full mt-2 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
                >
                  <EyeIcon className="w-3.5 h-3.5" /> View Order Details
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
