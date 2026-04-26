import { GoogleOAuthProvider } from "@react-oauth/google";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { authCheck, userInteresctionDataServer } from "../API/api";
import ScrollToTop from "./scrolltotop";
import { MeetTeam } from "./Sections/About/Parts/MeetTeam";
import { Mission } from "./Sections/About/Parts/Mission";
import { Stats } from "./Sections/About/Parts/stats";
import { Story } from "./Sections/About/Parts/Story";
import { CategoryBody } from "./Sections/Category/Parts/Body";
import Chat from "./Sections/Chat/Chat";
import ContactUs from "./Sections/Contact/Parts/contact";
import { FooterSection } from "./Sections/footer-section/Footer";
import { HomeBody } from "./Sections/Home/HomeBody";
import { NavBar } from "./Sections/Navbar/navbar";
import Checkout from "./Sections/Order/checkout";
import Orders from "./Sections/Order/orders";
import TrackOrder from "./Sections/Order/trackOrder";
import ProductDetails from "./Sections/Product/ProductDetails";
import Search from "./Sections/Product/search";
import Profile from "./Sections/User/Profile/profile";
import SigninForm from "./Sections/User/Signin";
import SignupForm from "./Sections/User/SignUp";
import { VendorDashboard } from "./Sections/Vendor/vendorDashboard";
import VendorForm from "./Sections/Vendor/vendorForm";
import { CartProductContext } from "./services/context";

const GOOGLE_CLIENT_ID = "316084868865-6cm9ag49f38mgqp25ttja2i61cbjbl6l.apps.googleusercontent.com";

const GoogleAuthWrapper = ({ children }) => (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    {children}
  </GoogleOAuthProvider>
);

const App = () => {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem("Cart");
    return saved ? JSON.parse(saved) : [];
  });


  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["authcheck"],
    queryFn: authCheck,
    select: (res) => res?.data || null,
  });
  const [dataForMl, setDataForMl] = useState(() => {
    const saved = localStorage.getItem("interaction");
    return saved ? JSON.parse(saved) : {};
  });
  
  useEffect(() => {
    setDataForMl(prev => ({
      ...prev,
      user: data?.user?._id,
    }))
  },[data])

  const checkAuth = !!data?.isAuthenticate;

  const [items, setItems] = useState(0);
  const [cmenu, setCmenu] = useState(false);
  const location = useLocation();
  const isSignupPage = ["/signup", "/signin", "/checkout" ,"/vendor/dashboard"].includes(location.pathname);

  useEffect(() => {
    const sendInteractionData = async () => {
      if (!dataForMl?.products?.length) return;

      try {
        const res = await userInteresctionDataServer(dataForMl);
        console.log("Interaction data sent:", res?.data);

        setDataForMl({user: data?.user?._id, products: [], currentView: null });
        localStorage.removeItem("interaction");
      } catch (err) {
        console.error("Error sending interaction data:", err);
      }
    };

    if (dataForMl?.products?.length >= 10) {
      sendInteractionData();
    }

    const interval = setInterval(sendInteractionData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [dataForMl]);



  useEffect(() => {
    const handleBeforeUnload = () => {
      if (dataForMl?.products?.length > 0) {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
        navigator.sendBeacon(`${backendUrl}/api/user/interaction`, JSON.stringify(dataForMl));
        setDataForMl({user: data?.user?._id, products: [], currentView: null });
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dataForMl]);


  const ProtectedRoute = ({ children, isLoading, checkAuth }) => {
    if (isLoading) return <p className="text-center py-5">Loading...</p>;
    if (!checkAuth) return <Navigate to="/signin" replace />;
    return children;
  };

  return (
    <CartProductContext.Provider
      value={{
        cartItems,
        setCartItems,
        items,
        setItems,
        checkAuth,
        user: data?.user,
        cmenu,
        setCmenu,
        loadinguser: isLoading,
        dataForMl,
        setDataForMl,
        refetch
      }}
    >
      {!isSignupPage && <NavBar />}
      <ScrollToTop />

      {isLoading && <p className="text-center py-5">Loading...</p>}
      {error && <p className="text-center text-red-500 py-5">Failed to fetch user</p>}

      <Routes>
        <Route path="/" element={<HomeBody />} />
        <Route path="/categories" element={<CategoryPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route
          path="/signup"
          element={
            <GoogleAuthWrapper>
              <SignupForm />
            </GoogleAuthWrapper>
          }
        />
        <Route
          path="/signin"
          element={
            <GoogleAuthWrapper>
              <SigninForm />
            </GoogleAuthWrapper>
          }
        />
        <Route path="/profile" element={<ProtectedRoute isLoading={isLoading} checkAuth={checkAuth}><Profile /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute isLoading={isLoading} checkAuth={checkAuth}><Checkout /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute isLoading={isLoading} checkAuth={checkAuth}><Orders user={data?.user} /></ProtectedRoute>} />
        <Route path="productdetail/:Productid" element={<ProductDetails />} />
        <Route path="/vendor/form" element={<ProtectedRoute isLoading={isLoading} checkAuth={checkAuth}><VendorForm/></ProtectedRoute>} />
        <Route path="/vendor/dashboard" element={<ProtectedRoute isLoading={isLoading} checkAuth={checkAuth}><VendorDashboard/></ProtectedRoute>} />
        <Route path="/orders/:orderId" element={<ProtectedRoute isLoading={isLoading} checkAuth={checkAuth}><TrackOrder/></ProtectedRoute>} />
        <Route path="/search" element={<Search/>} />
        <Route path="/chat/:userId" element={<ProtectedRoute isLoading={isLoading} checkAuth={checkAuth}><Chat/></ProtectedRoute>} />
      </Routes>

      {!isSignupPage && <FooterSection loadinguser={isLoading} />}
    </CartProductContext.Provider>
  );
};

function CategoryPage() {
  return (
    <div className="flex justify-center">
      <CategoryBody/>
    </div>
  );
}

function About() {
  return (
    <div>
      <Story />
      <Stats />
      <Mission />
      <MeetTeam />
    </div>
  );
}

export default App;