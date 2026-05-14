import { useContext, useEffect, useState } from "react";
import { CartProductContext } from "../../services/context";
import { useNavigate } from "react-router-dom";
import { logout } from "../../../API/api";
import Sidebar from "./sidebar";
import Dashboard from "./components/dashboard";
import VendorProducts from "./components/vendorProducts";
import VendorOrders from "./components/vendorOrders";
import { Menu, X } from "lucide-react";

export const VendorDashboard = () => {
  const [selectedField, setSelectedField] = useState("dashboard")
  const { checkAuth, loadinguser } = useContext(CartProductContext);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log(loadinguser)
    if(loadinguser) return
    if (!checkAuth){
      navigate("/signin")
    }
  },[checkAuth, navigate, loadinguser])


  const handleLogout = async () => {
    try {
      const res = await logout();
      if (res?.data?.success) {
        navigate("/signin");
      } else {
        console.error("Logout failed");
        navigate("/signin");
      }
    } catch (error) {
      console.log("Logout error:", error);
      navigate("/signin");
    }
  };

  return (
    <section className="bg-gray-50/50 min-h-screen">
        <div>
            <Sidebar setSelectedField={setSelectedField} isOpen={isOpen} setIsOpen={setIsOpen} selectedField={selectedField}/>
        </div>
        <button
            onClick={() => setIsOpen(!isOpen)}
            className={`fixed top-4 z-50 p-3 bg-white text-gray-600 rounded-2xl shadow-sm border border-gray-100 hover:text-organic-green hover:border-organic-green lg:hidden left-4 transition-all`}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        {
          selectedField === "dashboard" ? <Dashboard handleLogout={handleLogout}/> 
          : selectedField === "products" ? <VendorProducts/>
          : selectedField === "orders" ? <VendorOrders/> : ""
        }
    </section>
  );
}

export default VendorDashboard