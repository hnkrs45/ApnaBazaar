import { useState, useEffect } from "react";
import { Search, Users as UsersIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "../../API/product";

export default function UsersManagement() {
  const [input, setInput] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [users, setUsers] = useState([]);

  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: getAllUsers,
    select: (res) => res?.data || null,
  });

  useEffect(() => {
    if (Array.isArray(data?.users)) {
      setAllUsers(data.users);
      setUsers(data.users);
    }
  }, [data]);

  useEffect(() => {
    if (!input.trim()) {
      setUsers(allUsers);
      return;
    }
    const query = input.toLowerCase();
    const searchResult = allUsers.filter((u) =>
      (u?.name && u.name.toLowerCase().includes(query)) ||
      (u?.email && u.email.toLowerCase().includes(query)) ||
      (u?.phone && u.phone.toLowerCase().includes(query))
    );
    setUsers(searchResult);
  }, [input, allUsers]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  const avgSpent = users.length
    ? (users.reduce((sum, u) => sum + (Number(u.spent) || 0), 0) / users.length).toFixed(2)
    : "0.00";

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Users Management</h2>
        <p className="text-gray-500 text-sm">
          Overview of registered customers, purchase history, and account status
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-gray-500 text-xs sm:text-sm font-medium">Total Customers</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{allUsers.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-gray-500 text-xs sm:text-sm font-medium">Avg. Lifetime Value</h3>
          <p className="text-2xl font-bold text-emerald-600 mt-1">₹{avgSpent}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          type="text"
          placeholder="Search by name, email, or phone..."
          className="pl-9 pr-3 py-2 w-full bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Contact</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Orders</th>
                <th className="p-3.5">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    <UsersIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="font-medium text-gray-700">No users found</p>
                    <p className="text-xs text-gray-400 mt-1">Try searching with a different name or email</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 transition">
                    <td className="p-3.5 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {u?.name ? u.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.name || "Unnamed User"}</p>
                        <p className="text-gray-400 text-xs">
                          Joined {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : "Recently"}
                        </p>
                      </div>
                    </td>
                    <td className="p-3.5 text-gray-600">
                      <p>{u.email}</p>
                      <p className="text-xs text-gray-400">{u.phone || "No phone"}</p>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.role === "admin" ? "bg-purple-100 text-purple-700" :
                        u.role === "vendor" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {u.role || "customer"}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-gray-700">{u?.orders?.length || 0}</td>
                    <td className="p-3.5 font-semibold text-gray-900">
                      ₹{Number(u.spent || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}