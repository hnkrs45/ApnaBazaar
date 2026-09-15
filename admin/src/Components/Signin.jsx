import { useEffect, useState } from "react";
import { FiMail, FiLock } from "react-icons/fi";
import { IoIosEye, IoIosEyeOff } from "react-icons/io";
import { NavLink, useNavigate } from "react-router-dom";
import { authCheck, googleLogin, signin } from "../../API/product";
import { useGoogleLogin } from "@react-oauth/google";
import { useQueryClient } from "@tanstack/react-query";
import LoginError from "./loginError";

export default function SigninForm({ setCheckAuth }) {
  const [eye1, setEye1] = useState(false);
  const [showbtn, setShowbtn] = useState(false);
  const [check, setCheck] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  useEffect(() => {
    if (formData.email === "" || formData.password === "") {
      setShowbtn(false);
    } else {
      setShowbtn(true);
    }
  }, [formData]);

  const Icon1 = eye1 ? IoIosEye : IoIosEyeOff;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const sendData = async (userData) => {
    return await signin(userData);
  };

  const verifyAdminSession = async () => {
    const authRes = await authCheck();
    return authRes?.data?.isAuthenticate === true && authRes?.data?.role === "admin";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValidEmail(formData.email)) {
      setCheck(true);
      setTimeout(() => {
        setCheck(false);
      }, 3000);
      return;
    }

    if (formData.email === "" || formData.password === "") {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    try {
      const res = await sendData(formData);

      if (res?.data?.success) {
        await queryClient.invalidateQueries({ queryKey: ["authcheck"] });
        const isAdmin = await verifyAdminSession();
        if (isAdmin) {
          setCheckAuth(true);
          navigate('/');
        } else {
          setCheckAuth(false);
          setErrorMessage("Only admin accounts can access this panel.");
        }
      } else {
        setErrorMessage(res?.data?.message || "Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      const msg = error?.response?.data?.message || error?.message || "Login failed. Please try again.";
      setErrorMessage(msg);
    }

    setFormData({
      email: "",
      password: "",
    });
  };

  const responseGoogle = async (authResult) => {
    try {
      if (authResult['code']) {
        const res = await googleLogin(authResult['code']);
        if (res?.data?.success) {
          await queryClient.invalidateQueries({ queryKey: ["authcheck"] });
          const isAdmin = await verifyAdminSession();
          if (isAdmin) {
            setCheckAuth(true);
            return navigate("/");
          }
          setCheckAuth(false);
          setErrorMessage("Only admin accounts can access this panel.");
          return;
        }
        setErrorMessage("Login Error From Google");
      }
    } catch (error) {
      console.error("Error while logging in with Google: ", error.message);
      setErrorMessage("Google login failed. Please try again.");
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: responseGoogle,
    onError: responseGoogle,
    flow: "auth-code"
  });

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 rounded-lg">
        <div className="flex justify-center mb-4">
          <div className="font-semibold"><img className="w-[150px]" src="/logo.png" alt="ApnaBazaar" /></div>
        </div>

        {errorMessage && (
          <LoginError message={errorMessage} onClose={() => setErrorMessage("")} />
        )}

        <h1 className="text-xl font-semibold text-center">Welcome back to Apnabazaar</h1>
        <p className="text-gray-500 text-center mb-6">
          Sign in to your account to continue managing the platform
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 border-[#d8d8d8] border-[1px] rounded-xl p-[20px]">
          <h2 className="text-center font-medium">Admin Sign In</h2>
          <p className="text-gray-500 text-center text-sm mb-4">
            Enter your admin credentials to access the dashboard
          </p>

          {/* Email */}
          <div>
            <label className="text-[13px] ml-[3px] font-medium">Email Address*</label>
            <div className="relative w-full">
              <FiMail className="absolute left-3 top-[8px] text-gray-600" />
              <input 
                type="email" 
                name="email" 
                placeholder="admin@apnabazaar.com" 
                value={formData.email} 
                onChange={handleChange} 
                className="outline-none bg-[#f3f3f5] w-full pl-10 pr-3 h-[30px] border rounded-md text-sm"
              />
            </div>
            <p className={`${check ? "block" : "hidden"} text-[10px] text-red-700 ml-[3px] font-medium`}>Enter a valid email</p>
          </div>

          {/* Password */}
          <div>
            <label className="text-[13px] ml-[3px] font-medium">Password</label>
            <div className="relative w-full">
              <FiLock className="absolute left-3 top-[8px] text-gray-600" />
              <input 
                type={eye1 ? "text" : "password"} 
                name="password" 
                placeholder="Enter password" 
                value={formData.password} 
                onChange={handleChange} 
                className="outline-none bg-[#f3f3f5] w-full pl-10 pr-3 h-[30px] border rounded-md text-sm"
              />
              <Icon1 onClick={() => setEye1(!eye1)} className="absolute cursor-pointer right-3 top-[8px] text-gray-600"/>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={!showbtn} 
            className={`w-full h-[30px] text-[13px] text-white rounded-md ${showbtn ? "bg-gray-800 hover:bg-gray-900" : "bg-gray-500"}`}>
            Sign in
          </button>

          {/* Divider */}
          <div className="flex items-center my-4">
            <hr className="flex-grow border-gray-300" />
            <span className="mx-2 text-gray-500 text-[12px]">OR SIGN IN WITH</span>
            <hr className="flex-grow border-gray-300" />
          </div>

          {/* Social Buttons */}
          <div className="flex gap-3">
            <button type="button" onClick={handleGoogleLogin} className="flex-1 flex items-center justify-center gap-2 border rounded-md h-[30px] hover:bg-gray-50 text-sm">
              <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google" className="w-5 h-5"/>
              Google
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
