import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { searchProduct } from "../../../API/api";
import { userSearchMl } from "../../../API/ml";
import { ProductShow } from "../Home/Components/productshow";
import ProductSkeleton from "../Home/Skeleton/ProductSkeleton";
import "./productdetail.css";

const Search = () => {
    const [searchParams] = useSearchParams();
    const name = searchParams.get('name') || "";
    const location = searchParams.get('location') || "";
    const [selected, setSelected] = useState('name');
    
    const {data, isLoading} = useQuery({
        queryKey: ["search", name, location],
        queryFn: () => searchProduct(name, location),
        select: (res) => res?.data
    })

    const {data: mlprd, isLoading: productLoading} = useQuery({
        queryKey: ["mlproducts", name],
        queryFn: () => userSearchMl(name || "default"),
        select: (res) => res?.data
    })

    if (isLoading || productLoading){
        return (
            <div className="search-result-section bg-white mb-[30px] relative flex flex-col items-center mt-[120px]">
                <div className="feature-products flex flex-col items-center">
                    <div className="search-result-section-filter feature-products w-[1200px] flex justify-between">
                        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="search-product-recommendation mt-8 flex gap-4 flex-wrap justify-center w-[1200px]">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <ProductSkeleton key={n} />)}
                    </div>
                </div>
            </div>
        )
    }

    let products = [];
    if (data?.success){
        products = data?.data || [];
    }
    console.log(data)
    console.log("ml products", mlprd)

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
  return (
    <div className="search-result-section bg-white min-h-screen py-16 px-6 flex justify-center mt-[80px]">
        <div className="w-full max-w-7xl">
            {products.length > 0 ? (
                <div className="flex flex-col">
                    <div className="search-result-section-filter flex justify-between items-end border-b border-gray-100 pb-8 mb-12">
                        <div>
                            <div className="text-[32px] font-bold text-organic-green-dark">
                                Search Results
                            </div>
                            <div className="text-gray-500 mt-2">
                                Showing results for <span className="font-bold text-gray-800">"{name || location || "All"}"</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <select 
                                className="outline-none border-solid border-[1.5px] h-10 px-4 rounded-full border-gray-200 text-sm font-semibold focus:border-organic-green transition-all" 
                                value={selected} 
                                onChange={e => setSelected(e.target.value)}
                            >
                                <option value="name">Sort by Name</option>
                                <option value="date">Sort by Date</option>
                                <option value="rating">Sort by Rating</option>
                                <option value="price">Sort by Price</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-6 flex-wrap justify-start">
                        {products.map((product, index) => (
                            <ProductShow key={index} product={product} />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-20">
                    <h2 className="text-[28px] font-bold text-gray-800 mb-4">No Products Found</h2>
                    <p className="text-gray-500">We couldn't find anything matching <span className="font-bold">"{name || location || "All"}"</span></p>
                </div>
            )}

            {(mlprd?.recommendations?.length > 0) && (
                <div className="mt-24 pt-16 border-t border-gray-100">
                    <div className="flex justify-center mb-12">
                        <div className="text-center">
                            <h3 className="text-[28px] font-bold text-organic-green-dark">You Might Also Like</h3>
                            <p className="text-gray-500 mt-2">Curated fresh picks just for you</p>
                        </div>
                    </div>
                    <div className="flex gap-6 flex-wrap justify-center">
                        {mlprd?.recommendations?.map((product, index) => (
                            <ProductShow key={index} product={product} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    </div>
  )
}

export default Search