import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./Components/SideBar";
import Dashboard from "./Components/Dashbord";
import Products from "./Components/Products";
import Orders from "./Components/Orders";
import Vendors from "./Components/Vendors";
import Users from "./Components/Users";
import { GoogleOAuthProvider } from "@react-oauth/google";
import SigninForm from "./Components/Signin";
import SignupForm from "./Components/SignUp";
import { useQuery } from "@tanstack/react-query";
import { authCheck } from "../API/product";
import { CartProductContext } from "./services/context";
import { useEffect, useState } from "react";
import ProtectedRoute from "./services/protectedRoute";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const GoogleAuthWrapper = ({ children }) => (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || "not-configured.apps.googleusercontent.com"}>
    {children}
  </GoogleOAuthProvider>
);

export const App = () => {
  const [checkAuth, setCheckAuth] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["authcheck"],
    queryFn: authCheck,
    select: (res) => res?.data || null,
    retry: 1, // Only retry once to avoid long delays
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
  });

  const location = useLocation();
  const isSignupPage = ["/signup", "/signin"].includes(location.pathname);

  useEffect(() => {
    if (!isLoading) {
      // Set auth state based on API response
      setCheckAuth(!!data?.isAuthenticate);
      setInitialLoadComplete(true);
    }
  }, [data, isLoading]);

  // Show loading spinner during initial authentication check
  // But only if we haven't completed the initial load yet
  if (isLoading && !initialLoadComplete) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If there's an error with auth check and we're not on public pages, redirect to signin
  if (error && !isSignupPage && initialLoadComplete) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <CartProductContext.Provider 
      value={{
        user: data?.user, 
        isLoading, 
        checkAuth, 
        setCheckAuth,
        initialLoadComplete
      }}
    >
      <div className="flex min-h-screen">
        {!isSignupPage && checkAuth && (
          <div className="md:sticky md:top-0 md:h-screen shrink-0">
            <Sidebar />
          </div>
        )}
        <main className="flex-1 p-4 bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route
              path="/signup"
              element={
                <GoogleAuthWrapper>
                  <SignupForm setCheckAuth={setCheckAuth} />
                </GoogleAuthWrapper>
              }
            />
            <Route
              path="/signin"
              element={
                <GoogleAuthWrapper>
                  <SigninForm setCheckAuth={setCheckAuth} />
                </GoogleAuthWrapper>
              }
            />
            
            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <Products />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendors"
              element={
                <ProtectedRoute>
                  <Vendors />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <Users />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </CartProductContext.Provider>
  );
};

export default App;
