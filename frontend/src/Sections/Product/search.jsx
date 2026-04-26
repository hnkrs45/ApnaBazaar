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
        products = data?.data;
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
    <>
        <div className="search-result-section bg-white mb-[30px] relative flex flex-col items-center mt-[120px]">
            {products.length > 0 ? 
            <div className="feature-products flex flex-col items-center">
                <div className="search-result-section-filter feature-products w-[1200px] flex justify-between">
                    <div className="text-[24px] text-black">
                        Search Result for <b>"{name || location || "All"}"</b>
                    </div>
                    <div className="category-section-items flex items-center gap-4 justify-start">
                        <div className="flex gap-[10px] items-center">
                            <select className="outline-none border-solid border-[1px] h-9 px-2 flex justify-center rounded-md border-grey-100" value={selected} onChange={e => setSelected(e.target.value)}>
                                <option value="name">Sort by Name</option>
                                <option value="date">Sort by Date</option>
                                <option value="priority">Sort by Priority</option>
                                <option value="price">Sort by Price</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="search-product-recommendation mt-8 flex gap-4 flex-wrap justify-center">
                    {
                        (products && products.map((product, index) => {
                            return <ProductShow key={index} product={product} />
                        }))
                    }
                </div>
            </div> : <h2 className="text-[22px] font-bold mt-[50px] mb-[50px]">No Product Found with <b>"{name || location || "All"}"</b></h2>}

            <div className="feature-products">
                <div className="flex justify-center">
                    <div className="text-[24px] text-black text-center">
                        You Might Also Like
                    </div>
                </div>
                <div className="search-product-recommendation mt-8 flex gap-4 flex-wrap justify-center">
                    {
                        (mlprd?.recommendations && mlprd?.recommendations.map((product, index) => {
                            return <ProductShow key={index} product={product} />
                        }))
                    }
                </div>
            </div>
        </div>
    </>
  )
}

export default Search