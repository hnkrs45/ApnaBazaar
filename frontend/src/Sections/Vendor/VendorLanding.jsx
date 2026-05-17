import { useContext } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, BarChart3, PackageCheck, ShoppingBag, Store } from "lucide-react";
import { CartProductContext } from "../../services/context";
import VendorForm from "./vendorForm";

export default function VendorLanding() {
  const { checkAuth, loadinguser, user } = useContext(CartProductContext);
  const isActiveVendor = user?.role === "vendor" && user?.vendor?.status === "Active";

  if (loadinguser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm font-bold text-gray-500">Loading farmer panel...</p>
      </div>
    );
  }

  if (isActiveVendor) {
    return <Navigate to="/vendor/dashboard" replace />;
  }

  if (checkAuth) {
    return <VendorForm />;
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-3">
            <img className="w-[140px]" src="/logo.png" alt="ApnaBazaar" />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="rounded-full border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 hover:border-organic-green hover:text-organic-green">
              Storefront
            </Link>
            <Link to="/signin" className="rounded-full bg-organic-green px-5 py-2 text-sm font-bold text-white hover:bg-organic-green-dark">
              Sign in to Apply
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-16 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-organic-green/10 px-4 py-2 text-sm font-bold text-organic-green">
            <Store className="h-4 w-4" />
            Farmer and vendor portal
          </div>
          <h1 className="max-w-3xl text-4xl font-black leading-tight text-gray-900 md:text-6xl">
            Sell farm produce without mixing tools into the customer store.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Manage listings, stock, order status, and revenue from a dedicated workspace built for farmers and vendors.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/signin" className="inline-flex items-center gap-3 rounded-full bg-organic-green px-6 py-3 text-sm font-black text-white shadow-md hover:bg-organic-green-dark">
              Sign in to Apply
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/categories" className="inline-flex items-center rounded-full border border-gray-200 px-6 py-3 text-sm font-black text-gray-700 hover:border-organic-green hover:text-organic-green">
              Browse the store
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          {[
            { icon: PackageCheck, title: "Product Control", text: "Add bilingual product details, images, stock, unit, price, and location." },
            { icon: ShoppingBag, title: "Order Workflow", text: "Move orders from Processing to Shipped to Delivered from one panel." },
            { icon: BarChart3, title: "Sales Visibility", text: "Track orders, revenue, recent activity, and category performance." },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-organic-green shadow-sm">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-black text-gray-900">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">{item.text}</p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
