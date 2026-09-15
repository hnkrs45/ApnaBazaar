import { useContext } from "react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { CartProductContext } from "../services/context";
import { useNavigate } from "react-router-dom";
import { dashboardDetail, getLast7DaysOrders, getOrdersByCategory, getSalesByVendors, logout } from "../../API/product";
import { useQuery } from "@tanstack/react-query";

const STABLE_COLORS = [
  "#10B981", "#3B82F6", "#F59E0B", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316", "#6366F1"
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { setCheckAuth } = useContext(CartProductContext);

  const { data: last7days, isLoading: loadingDays } = useQuery({
    queryKey: ["last7days"],
    queryFn: getLast7DaysOrders,
    select: (res) => res?.data?.data || []
  });

  const { data: sales, isLoading: loadingSales } = useQuery({
    queryKey: ["salesCategory"],
    queryFn: getOrdersByCategory,
    select: (res) => res?.data || null
  });
  
  const { data: vendor, isLoading: loadingVendors } = useQuery({
    queryKey: ["vendor"],
    queryFn: getSalesByVendors,
    select: (res) => res?.data || null
  });

  const { data: detail, isLoading: loadingDetail } = useQuery({
    queryKey: ["detail"],
    queryFn: dashboardDetail,
    select: (res) => res?.data || null
  });

  const salesCategory = (sales?.success && Array.isArray(sales?.data)) ? sales.data : [];
  const vendorSales = (vendor?.success && Array.isArray(vendor?.data)) ? vendor.data : [];

  const handleLogout = async () => {
    try {
      const res = await logout();
      if (res?.data?.success) {
        setCheckAuth(false);
        navigate("/signin");
      } else {
        setCheckAuth(false);
        navigate("/signin");
      }
    } catch (error) {
      setCheckAuth(false);
      navigate("/signin");
    }
  };

  const isLoading = loadingDays && loadingSales && loadingVendors && loadingDetail;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 transition-all duration-300 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Real-time overview of orders, vendors, and revenue</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleLogout} className="bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm">
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white shadow rounded-xl p-5 border border-gray-100">
          <h2 className="text-sm font-medium text-gray-500">Total Orders</h2>
          <p className="text-2xl md:text-3xl font-bold mt-2 text-gray-900">{detail?.totalOrder ?? 0}</p>
        </div>
        <div className="bg-white shadow rounded-xl p-5 border border-gray-100">
          <h2 className="text-sm font-medium text-gray-500">Total Revenue</h2>
          <p className="text-2xl md:text-3xl font-bold mt-2 text-emerald-600">₹{Number(detail?.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white shadow rounded-xl p-5 border border-gray-100">
          <h2 className="text-sm font-medium text-gray-500">Active Vendors</h2>
          <p className="text-2xl md:text-3xl font-bold mt-2 text-gray-900">{detail?.totalVendors ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-xl p-5 border border-gray-100">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Orders Last 7 Days</h2>
          {last7days && last7days.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={last7days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={2} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-gray-400 text-sm">
              No orders recorded in the last 7 days.
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-xl p-5 border border-gray-100">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Sales by Category</h2>
          {salesCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={salesCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {salesCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STABLE_COLORS[index % STABLE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-gray-400 text-sm">
              No category sales data available.
            </div>
          )}
        </div>
      </div>

      <div className="bg-white shadow rounded-xl p-5 border border-gray-100">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Top Vendors by Sales</h2>
        {vendorSales.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vendorSales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="vendor" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
            No vendor sales recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}