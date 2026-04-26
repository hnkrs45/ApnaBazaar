import { useQuery } from "@tanstack/react-query";
import { getProducts } from "../../../../API/api";
import { ProductShow } from "../Components/productshow";
import ProductSkeleton from "../Skeleton/ProductSkeleton";

export const FeaturedLocalProducts = () => {
    const { data: products, isLoading } = useQuery({
        queryKey: ["featurePrd"],
        queryFn: getProducts,
        select: (res) => res?.data?.products || []
    })
    
    if (isLoading) return (
        <div  id="feature-products" className="bg-white mb-[30px] relative flex flex-col items-center">
            <div className="feature-products w-[1200px]">
                <div className="flex justify-center text-[26.5px] mt-[10px] mb-[14px] font-[500]">
                    Featured Local Products
                </div>
                <div className="flex justify-center">
                    <div className="text-[14px] text-[#717182] text-center">
                        Discover fresh, local products from trusted vendors in your community
                    </div>
                </div>
                <div className="w-full mt-8 flex gap-4 flex-wrap justify-center">
                    {[1,2,3,4,5,6,7,8,9,10].map((n) => <ProductSkeleton key={n} />)}
                </div>
            </div>
        </div>
    )

    return (
        <div  id="feature-products" className="bg-white mb-[30px] relative flex flex-col items-center">
            <div className="feature-products w-[1200px]">
                <div className="flex justify-center text-[26.5px] mt-[10px] mb-[14px] font-[500]">
                    Featured Local Products
                </div>
                <div className="flex justify-center">
                    <div className="text-[14px] text-[#717182] text-center">
                        Discover fresh, local products from trusted vendors in your community
                    </div>
                </div>
                <div className="w-full mt-8 flex gap-4 flex-wrap justify-center">
                    {
                        products && products.slice(0, 10).map((product, index) => {
                            return <ProductShow key={index} product={product} />
                        })
                    }
                </div>
            </div>
        </div>)
}