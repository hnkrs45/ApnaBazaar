import { Menu, X, LayoutDashboard, Package, ShoppingBag } from "lucide-react";
import { useLanguage } from "../../services/LanguageContext";

export default function Sidebar({setSelectedField, isOpen, setIsOpen, selectedField}) {
  const { t } = useLanguage();
  return (
    <>
      {/* 🔹 Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 md:w-[280px] bg-white border-r border-gray-100 p-6 space-y-8 z-40 transform transition-transform duration-300 shadow-sm
        ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="flex items-center gap-3 mb-8 px-2 pt-4">
            <div className="w-10 h-10 bg-organic-green rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
            </div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">
            Apna<span className="text-organic-green">Bazaar</span>
            </h2>
        </div>
        
        <div className="space-y-1">
            <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">{t('vendorHub.panel')}</p>
            <ul className="flex flex-col space-y-2">
            <li>
                <button
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${selectedField === "dashboard" || !selectedField ? "bg-organic-green text-white shadow-md shadow-organic-green/20" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}
                onClick={() => {setIsOpen(false); setSelectedField("dashboard");}}
                >
                <LayoutDashboard className="w-5 h-5" />
                {t('vendorHub.dashboard')}
                </button>
            </li>
            <li>
                <button
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${selectedField === "products" ? "bg-organic-green text-white shadow-md shadow-organic-green/20" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}
                onClick={() => {setIsOpen(false); setSelectedField("products");}}
                >
                <Package className="w-5 h-5" />
                {t('vendorHub.products')}
                </button>
            </li>
            <li>
                <button
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${selectedField === "orders" ? "bg-organic-green text-white shadow-md shadow-organic-green/20" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}
                onClick={() => {setIsOpen(false); setSelectedField("orders");}}
                >
                <ShoppingBag className="w-5 h-5" />
                {t('vendorHub.orders')}
                </button>
            </li>
            </ul>
        </div>
      </div>

      {/* 🔹 Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}