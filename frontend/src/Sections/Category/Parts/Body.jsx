import { ProductShow } from "../../Home/Components/productshow";
import { useState, useMemo, useContext, useEffect } from "react";
import "./category.css";
import { getProducts } from "../../../../API/api";
import { useQuery } from "@tanstack/react-query";
import CategorySkeleton from "./categorySkeleton";
import { CartProductContext } from "../../../services/context";
import { useLanguage } from "../../../services/LanguageContext";
import { useSearchParams } from "react-router-dom";

export const CategoryBody = () => {
  const { loadinguser } = useContext(CartProductContext);
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState('name');
  const [category, setCategory] = useState(searchParams.get("category") || "All Products");
  const [items, setItems] = useState("");

  const { data, isError, error, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
    select: (res) => res?.data?.products || [],
  });

  useEffect(() => {
    const isMobile = window.innerWidth <= 600;

    if (isMobile) {
      const productsSection = document.getElementById("products-section");
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [category, selected]);

  const categories = useMemo(() => {
    if (!data) return ["All Products"];
    const uniqueCategories = [
      ...new Set(data.map((p) => p.category?.trim())),
    ];
    return ["All Products", ...uniqueCategories];
  }, [data]);

  let products = useMemo(() => {
    if (!data) return [];
    if (category === "All Products") return data;
    return data.filter(
      (p) => p.category?.toLowerCase() === category.toLowerCase()
    );
  }, [category, data]);

  const categoriesWithCount = useMemo(() => {
    if (!data) return categories.map((c) => ({ name: c, quantity: 0 }));
    return categories.map((c) => ({
      name: c,
      quantity:
        c === "All Products"
          ? data.length
          : data.filter(
              (p) => p.category?.toLowerCase() === c.toLowerCase()
            ).length,
    }));
  }, [categories, data]);

  // update item count when products change
  useMemo(() => {
    setItems(products?.length || 0);
  }, [products]);

  if (isError) return <p>Error: {error.message}</p>;

  if (selected === 'name') {
    products = [...products].sort((a, b) =>
      a.name.localeCompare(b.name) // A-Z
    );
  } else if (selected === 'date') {
    products = [...products].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt) // Newest first
    );
  } else if (selected === 'rating') {
    products = [...products].sort(
      (a, b) => b.ratings?.average - a.ratings?.average // High → low
    );
  } else if (selected === 'price') {
    products = [...products].sort((a, b) => a.price - b.price); // Low → high
  }

  if (isLoading){
    return <CategorySkeleton/>
  }

  return loadinguser ? (
    <CategorySkeleton />
  ) : (
    <div className="category-section-top w-full max-w-7xl mx-auto px-6 py-16 mb-[50px]">
      <div className="category-section-start mt-[40px] flex justify-between items-end relative pb-8 border-b border-gray-100">
          <div>
              <div className="text-[32px] font-bold text-organic-green-dark">{t('nav.categories')}</div>
              <div className="text-[16px] text-gray-500 py-2 max-w-[600px]">{t('categories.subtitle')}</div>
          </div>
          <div className="category-section-items flex items-center gap-4 justify-start">
              <div className="flex gap-[10px] items-center">
                  <select className="outline-none border-solid border-[1.5px] h-10 px-4 flex justify-center rounded-full border-gray-200 text-sm font-semibold focus:border-organic-green transition-all" value={selected} onChange={e => setSelected(e.target.value)}>
                      <option value="name">Sort by Name</option>
                      <option value="date">Sort by Date</option>
                      <option value="priority">Sort by Priority</option>
                      <option value="price">Sort by Price</option>
                  </select>
              </div>
          </div>
      </div>
      <div className="category-grid flex gap-8 mt-8">
        <div className="sticky top-[100px] h-fit">
          <div className="text-[18px] font-bold mb-4 text-gray-800 px-2">Filter by Category</div>
          <div className="space-y-2">
            {categoriesWithCount.map((item, index) => (
              <div
                id={index===categoriesWithCount.length-1 ? "products-section" : ""}
                key={index}
                onClick={() => {
                  setCategory(item.name);
                  setSearchParams(item.name === "All Products" ? {} : { category: item.name });
                }}
                className={`category-select-btn cursor-pointer transition-all duration-200 group ${
                  category === item.name
                    ? "bg-organic-green text-white shadow-md translate-x-1"
                    : "bg-white text-gray-600 hover:bg-organic-green/5 hover:text-organic-green"
                }
                px-4 py-3 text-[15px] font-semibold flex justify-between items-center w-[260px] rounded-xl border border-gray-100`}
              >
                {item.name}
                <div className={`h-6 min-w-[24px] px-1.5 rounded-lg flex items-center justify-center text-[12px] font-bold ${
                    category === item.name ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500 group-hover:bg-organic-green/10"
                }`}>
                  {item.quantity}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Products Section */}
        <div className="flex-1">
          <div>{items !== 0 ? `Showing ${items} products` : ""}</div>
          <div className="category-product-section flex gap-6 mt-2 flex-wrap relative">
            {products?.length === 0 ? (
              <p className="w-[100%] h-[100%] text-center text-2xl font-bold">
                Product Not Available
              </p>
            ) : (
              products?.map((product, index) => (
                <ProductShow key={index} product={product} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};