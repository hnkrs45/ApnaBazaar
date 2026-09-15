import { useState } from "react";
import { Eye, CheckCircle, Clock, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getVendors } from "../../API/product";
import VendorDetailsModal from "./vendorDetailModel";

export default function Vendors() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [expandedVendor, setExpandedVendor] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["vendors"],
    queryFn: getVendors,
    select: (res) => res?.data || null
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vendors...</p>
        </div>
      </div>
    );
  }

  const vendors = Array.isArray(data?.vendors) ? data.vendors : [];

  const filteredVendors = vendors.filter((v) => {
    const status = v?.vendor?.status || "Pending";
    const matchesStatus = statusFilter === "All" || status === statusFilter;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesStatus;

    const matchesSearch =
      (v.name && v.name.toLowerCase().includes(query)) ||
      (v.email && v.email.toLowerCase().includes(query)) ||
      (v.vendor?.companyName && v.vendor.companyName.toLowerCase().includes(query)) ||
      (v.vendor?.address && v.vendor.address.toLowerCase().includes(query));

    return matchesStatus && matchesSearch;
  });

  const toggleVendorDetails = (id) => {
    setExpandedVendor(prev => (prev === id ? null : id));
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <VendorDetailsModal
        vendor={selectedVendor}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        refetch={refetch}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vendors Management</h2>
          <p className="text-gray-500 text-sm">
            Review partner applications, verify documentation, and monitor vendor sales
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
          <p className="text-gray-500 text-xs sm:text-sm">Total Applications</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{vendors.length}</p>
        </div>
        <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
          <p className="text-gray-500 text-xs sm:text-sm">Active Vendors</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {vendors.filter((v) => v?.vendor?.status === "Active").length}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
          <p className="text-gray-500 text-xs sm:text-sm">Pending Approval</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {vendors.filter((v) => v?.vendor?.status === "Pending" || !v?.vendor?.status).length}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
          <p className="text-gray-500 text-xs sm:text-sm">Total Listed Products</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {vendors.reduce((sum, v) => sum + (v?.vendor?.products?.length || 0), 0)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search vendors by company, name, location..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm w-full bg-white outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      {/* Empty State */}
      {filteredVendors.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-600 font-medium">No vendors found.</p>
          <p className="text-gray-400 text-sm mt-1">Try refining your search or status filter.</p>
        </div>
      ) : (
        /* Vendors Table */
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          {/* Table Header for Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Vendor</th>
                  <th className="p-3.5">Address</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Products</th>
                  <th className="p-3.5">Sales</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredVendors.map((v) => (
                  <tr key={v._id} className="hover:bg-gray-50 transition">
                    <td className="p-3.5">
                      <div>
                        <p className="font-semibold text-gray-900">{v?.vendor?.companyName || v?.name}</p>
                        <p className="text-xs text-gray-500">{v?.email}</p>
                      </div>
                    </td>
                    <td className="p-3.5 text-gray-600 max-w-xs truncate">{v?.vendor?.address || "N/A"}</td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          v?.vendor?.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {v?.vendor?.status === "Active" ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        {v?.vendor?.status || "Pending"}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-gray-700">{v?.vendor?.products?.length || 0}</td>
                    <td className="p-3.5 font-semibold text-gray-900">
                      ₹{Number(v?.vendor?.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3.5 text-right">
                      <button 
                        onClick={() => {
                          setSelectedVendor(v);
                          setIsOpen(true);
                        }} 
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-medium transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> Review Application
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden divide-y divide-gray-100">
            {filteredVendors.map((v) => (
              <div key={v._id} className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">{v?.vendor?.companyName || v?.name}</p>
                    <p className="text-xs text-gray-500">{v?.email}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      v?.vendor?.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {v?.vendor?.status || "Pending"}
                  </span>
                </div>
                
                <p className="text-xs text-gray-600">📍 {v?.vendor?.address || "No address provided"}</p>
                <div className="flex justify-between text-xs text-gray-500 pt-1">
                  <span>Products: {v?.vendor?.products?.length || 0}</span>
                  <span className="font-semibold text-gray-900">Sales: ₹{Number(v?.vendor?.totalRevenue || 0).toFixed(2)}</span>
                </div>

                <button
                  onClick={() => {
                    setSelectedVendor(v);
                    setIsOpen(true);
                  }}
                  className="w-full mt-2 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> Review Application
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}