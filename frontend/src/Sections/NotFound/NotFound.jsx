import { NavLink } from "react-router-dom";
import { FiHome, FiShoppingBag } from "react-icons/fi";

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="w-24 h-24 mb-6 rounded-full bg-emerald-50 flex items-center justify-center text-organic-green">
        <span className="text-4xl font-extrabold">404</span>
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">
        Page Not Found
      </h1>
      <p className="text-gray-500 max-w-md mb-8 text-sm sm:text-base">
        Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved, deleted, or perhaps never existed.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <NavLink
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-organic-green text-white font-semibold rounded-full hover:bg-organic-green-dark transition-all shadow-sm hover:shadow"
        >
          <FiHome size={18} />
          <span>Back to Home</span>
        </NavLink>
        <NavLink
          to="/categories"
          className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-full hover:bg-gray-50 transition-all"
        >
          <FiShoppingBag size={18} />
          <span>Browse Groceries</span>
        </NavLink>
      </div>
    </div>
  );
};

export default NotFound;

