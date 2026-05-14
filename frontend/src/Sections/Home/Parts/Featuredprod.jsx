import { useQuery } from "@tanstack/react-query";
import { getProducts } from "../../../../API/api";
import { ProductShow } from "../Components/productshow";
import ProductSkeleton from "../Skeleton/ProductSkeleton";
import { useLanguage } from "../../../services/LanguageContext";

export const FeaturedLocalProducts = () => {
    const { t } = useLanguage();
    const { data: products, isLoading } = useQuery({
        queryKey: ["featurePrd"],
        queryFn: getProducts,
        select: (res) => res?.data?.products || []
    })
    
    if (isLoading) return (
        <div  id="feature-products" className="bg-white py-16 px-6 flex justify-center">
            <div className="feature-products w-full max-w-7xl">
                <div className="flex justify-center text-[28px] mt-[40px] mb-[16px] font-bold text-organic-green-dark">
                    {t('featured.title')}
                </div>
                <div className="flex justify-center">
                    <div className="text-[16px] text-gray-500 text-center max-w-[600px] leading-relaxed">
                        {t('featured.subtitle')}
                    </div>
                </div>
                <div className="w-full mt-8 flex gap-4 flex-wrap justify-center">
                    {[1,2,3,4,5,6,7,8,9,10].map((n) => <ProductSkeleton key={n} />)}
                </div>
            </div>
        </div>
    )

    return (
        <div  id="feature-products" className="bg-white py-16 px-6 flex justify-center border-t border-gray-50">
            <div className="feature-products w-full max-w-7xl">
                <div className="flex justify-center text-[28px] mt-[40px] mb-[16px] font-bold text-organic-green-dark">
                    {t('featured.title')}
                </div>
                <div className="flex justify-center">
                    <div className="text-[16px] text-gray-500 text-center max-w-[600px] leading-relaxed">
                        {t('featured.subtitle')}
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