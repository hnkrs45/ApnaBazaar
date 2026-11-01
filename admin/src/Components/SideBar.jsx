import { useState, useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Store, 
  Users, 
  LogOut 
} from "lucide-react";
import { logout } from "../../API/product";
import { CartProductContext } from "../services/context";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, setCheckAuth } = useContext(CartProductContext) || {};

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Proceed with frontend logout regardless
    }
    if (setCheckAuth) setCheckAuth(false);
    navigate("/signin");
    window.location.reload();
  };

  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/products", label: "Products", icon: Package },
    { to: "/orders", label: "Orders", icon: ShoppingCart },
    { to: "/vendors", label: "Vendors", icon: Store },
    { to: "/users", label: "Users", icon: Users },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation menu"
          className="p-2.5 bg-gray-900 text-white rounded-xl shadow-lg hover:bg-gray-800 transition active:scale-95"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col p-5 z-40 transition-transform duration-300 ease-in-out md:translate-x-0 md:sticky md:top-0 shrink-0 overflow-y-auto ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:shadow-none"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-3 mb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-black text-lg shadow-sm">
            AB
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-900 leading-tight">ApnaBazaar</h2>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
              Admin Control
            </span>
          </div>
        </div>

        {/* Navigation Section */}
        <div>
          <p className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            Main Menu
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 shadow-xs"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Account & Sign Out Section (placed right under Navigation for quick reach) */}
        <div className="mt-6 pt-5 border-t border-gray-100 space-y-3">
          <p className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Account
          </p>

          {/* Admin User Card */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 uppercase">
              {user?.name ? user.name[0] : "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">
                {user?.name || "Admin User"}
              </p>
              <p className="text-[11px] text-gray-500 truncate">
                {user?.email || "admin@apnabazaar.com"}
              </p>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:text-red-700 bg-red-50/70 hover:bg-red-100/80 border border-red-100 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <LogOut className="w-4 h-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
              <span>Sign Out</span>
            </div>
            <span className="text-xs text-red-400 group-hover:text-red-600 font-medium">Exit</span>
          </button>
        </div>
      </aside>
    </>
  );
}
