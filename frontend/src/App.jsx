import { GoogleOAuthProvider } from "@react-oauth/google";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { authCheck, userInteresctionDataServer } from "../API/api";
import ScrollToTop from "./scrolltotop";
import { NavBar } from "./Sections/Navbar/navbar";
import { HomeBody } from "./Sections/Home/HomeBody";
import { FooterSection } from "./Sections/footer-section/Footer";
import { CartProductContext } from "./services/context";

// Lazy-load route pages for bundle size optimization and faster initial load
const CategoryBody = lazy(() => import("./Sections/Category/Parts/Body").then(m => ({ default: m.CategoryBody })));
const ContactUs = lazy(() => import("./Sections/Contact/Parts/contact"));
const Checkout = lazy(() => import("./Sections/Order/checkout"));
const Orders = lazy(() => import("./Sections/Order/orders"));
const TrackOrder = lazy(() => import("./Sections/Order/trackOrder"));
const ProductDetails = lazy(() => import("./Sections/Product/ProductDetails"));
const Search = lazy(() => import("./Sections/Product/search"));
const Profile = lazy(() => import("./Sections/User/Profile/profile"));
const SigninForm = lazy(() => import("./Sections/User/Signin"));
const SignupForm = lazy(() => import("./Sections/User/SignUp"));
const VendorDashboard = lazy(() => import("./Sections/Vendor/vendorDashboard").then(m => ({ default: m.VendorDashboard })));
const VendorLanding = lazy(() => import("./Sections/Vendor/VendorLanding"));
const VendorForm = lazy(() => import("./Sections/Vendor/vendorForm"));
const Chat = lazy(() => import("./Sections/Chat/Chat"));
const Story = lazy(() => import("./Sections/About/Parts/Story").then(m => ({ default: m.Story })));
const Stats = lazy(() => import("./Sections/About/Parts/stats").then(m => ({ default: m.Stats })));
const Mission = lazy(() => import("./Sections/About/Parts/Mission").then(m => ({ default: m.Mission })));
const MeetTeam = lazy(() => import("./Sections/About/Parts/MeetTeam").then(m => ({ default: m.MeetTeam })));

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "316084868865-6cm9ag49f38mgqp25ttja2i61cbjbl6l.apps.googleusercontent.com";

const GoogleAuthWrapper = ({ children }) => (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    {children}
  </GoogleOAuthProvider>
);

const PageLoader = () => (
  <div className="flex justify-center items-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
  </div>
);

function CategoryPage() {
  return (
    <div className="flex justify-center min-h-[60vh]">
      <CategoryBody />
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

const App = () => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem("Cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["authcheck"],
    queryFn: authCheck,
    select: (res) => res?.data || null,
  });

  const [dataForMl, setDataForMl] = useState(() => {
    try {
      const saved = localStorage.getItem("interaction");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const userId = data?.user?._id;
  
  useEffect(() => {
    setDataForMl(prev => ({
      ...prev,
      user: userId,
    }));
  }, [userId]);

  const checkAuth = !!data?.isAuthenticate;
  const [items, setItems] = useState(0);
  const [cmenu, setCmenu] = useState(false);
  const location = useLocation();
  const hideStorefrontChrome = ["/signup", "/signin", "/checkout"].includes(location.pathname)
    || location.pathname.startsWith("/vendor")
    || location.pathname === "/sell";

  useEffect(() => {
    const sendInteractionData = async () => {
      if (!dataForMl?.products?.length) return;

      try {
        await userInteresctionDataServer(dataForMl);
        setDataForMl({ user: userId, products: [], currentView: null });
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
  }, [dataForMl, userId]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (dataForMl?.products?.length > 0) {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
        navigator.sendBeacon(`${backendUrl}/api/user/interaction`, JSON.stringify(dataForMl));
        setDataForMl({ user: userId, products: [], currentView: null });
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dataForMl, userId]);

  const ProtectedRoute = ({ children, isLoading, checkAuth }) => {
    if (isLoading) return <PageLoader />;
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
      {!hideStorefrontChrome && <NavBar />}
      <ScrollToTop />

      <Suspense fallback={<PageLoader />}>
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
          <Route path="/productdetail/:Productid" element={<ProductDetails />} />
          <Route path="/sell" element={<VendorLanding />} />
          <Route path="/vendor/form" element={<ProtectedRoute isLoading={isLoading} checkAuth={checkAuth}><VendorForm/></ProtectedRoute>} />
          <Route path="/vendor/dashboard" element={<ProtectedRoute isLoading={isLoading} checkAuth={checkAuth}><VendorDashboard/></ProtectedRoute>} />
          <Route path="/orders/:orderId" element={<ProtectedRoute isLoading={isLoading} checkAuth={checkAuth}><TrackOrder/></ProtectedRoute>} />
          <Route path="/search" element={<Search/>} />
          <Route path="/chat/:userId" element={<ProtectedRoute isLoading={isLoading} checkAuth={checkAuth}><Chat/></ProtectedRoute>} />
        </Routes>
      </Suspense>

      {!hideStorefrontChrome && <FooterSection loadinguser={isLoading} />}
    </CartProductContext.Provider>
  );
};

export default App;
