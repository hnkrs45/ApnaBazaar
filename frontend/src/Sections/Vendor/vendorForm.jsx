import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { addVendor } from "../../../API/api";
import { CartProductContext } from "../../services/context";

export default function VendorForm() {
  const {user, loadinguser, refetch} = useContext(CartProductContext)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const [vendor, setVendor] = useState({
    address: "",
    companyName: "",
  });

  const [errors, setErrors] = useState({});

  // validation function
  const validate = () => {
    const newErrors = {};
    if (!vendor.address.trim()) newErrors.address = "Address is required";
    if (!vendor.companyName.trim())
      newErrors.companyName = "Company name is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVendor((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      console.log("Vendor Data: ", vendor);
      const res = await addVendor(vendor);
      console.log("Response:", res);
      
      if (res?.data?.success) {
        alert("Application Submitted successfully!");
        await refetch(); // Update user role/status in context
      } else {
        alert(res?.data?.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert(error.response?.data?.message || "Error submitting application");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loadinguser){
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  console.log(user?.role === 'vendor' && user?.vendor?.status === "Pending")
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/">
            <img className="w-[140px]" src="/logo.png" alt="ApnaBazaar" />
          </Link>
          <Link to="/sell" className="rounded-full border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 hover:border-organic-green hover:text-organic-green">
            Farmer Portal
          </Link>
        </div>
      </header>
      <div className="flex justify-center items-center min-h-[calc(100vh-82px)] p-6">
      {user?.role === 'vendor' && user?.vendor?.status === "Pending" ? (
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-md">
          <h2 className="text-2xl font-black text-gray-900">Application Under Review</h2>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Your farmer application is waiting for admin approval. Once approved, your dashboard will unlock here.
          </p>
        </div>
      ) : user?.vendor?.status === "Active" ? (
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl max-w-md w-full border border-gray-100 flex flex-col items-center">
          <span className="text-5xl mb-4 animate-bounce">🎉</span>
          <h2 className="text-2xl font-black text-gray-800 mb-2">Congratulations!</h2>
          <p className="text-gray-500 mb-6 leading-relaxed">
            Your application has been accepted. You are now a registered farmer on Apna-Bazaar!
          </p>
          <button 
            onClick={() => navigate("/vendor/dashboard")}
            className="w-full bg-organic-green hover:bg-organic-green-dark text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            Go to Vendor Dashboard
          </button>
        </div>
      ) : <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-white p-6 rounded-xl shadow-md space-y-4"
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
           Vendor Application Form
        </h2>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium mb-1">Address *</label>
          <textarea
            name="address"
            value={vendor.address}
            onChange={handleChange}
            className="w-full border rounded-md p-2 text-sm outline-none"
          />
          {errors.address && (
            <p className="text-red-600 text-xs">{errors.address}</p>
          )}
        </div>

        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Company Name *
          </label>
          <input
            type="text"
            name="companyName"
            value={vendor.companyName}
            onChange={handleChange}
            className="w-full border rounded-md p-2 text-sm outline-none"
          />
          {errors.companyName && (
            <p className="text-red-600 text-xs">{errors.companyName}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full ${isSubmitting ? 'bg-gray-400' : 'bg-black hover:bg-gray-800'} text-white py-2 rounded-md transition`}
        >
          {isSubmitting ? "Applying..." : "Apply"}
        </button>
      </form>}
      </div>
    </div>
  );
}
