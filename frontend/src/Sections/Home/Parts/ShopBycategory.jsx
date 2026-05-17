import { CategoryItem } from "../Components/Categoryitem"
import CategorySection from "../Skeleton/category"
import { useLanguage } from "../../../services/LanguageContext"
import { useQuery } from "@tanstack/react-query"
import { getProducts } from "../../../../API/api"
import { useMemo } from "react"

export const ShopbyCategory = ({loadinguser}) =>{
    const { t } = useLanguage();
    
    const { data: productsData, isLoading } = useQuery({
        queryKey: ["products"],
        queryFn: getProducts,
        select: (res) => res?.data?.products || [],
    });

    const categoryConfig = {
        "Vegetables": "https://images.unsplash.com/photo-1566385101042-1a000c1268c4?w=300&h=300&fit=crop",
        "Fruits": "https://images.unsplash.com/photo-1619566636858-adb3ef26400b?w=300&h=300&fit=crop",
        "Dairy & Eggs": "https://images.unsplash.com/photo-1550583724-1d2ee29ad7a1?w=300&h=300&fit=crop",
        "Grains": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&h=300&fit=crop",
        "Pulses": "https://images.unsplash.com/photo-1515942400420-2b98fed1f515?w=300&h=300&fit=crop",
        "Spices": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&h=300&fit=crop",
        "Other": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=300&fit=crop"
    };

    const dynamicCategories = useMemo(() => {
        if (!productsData) return [];

        // Count items per category from the actual database products
        const counts = productsData.reduce((acc, product) => {
            const cat = product.category || "Other";
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, {});

        // Combine with our config to get images and display names
        return Object.keys(categoryConfig).map(catName => ({
            Categoryname: catName,
            no_of_items: counts[catName] || 0,
            img_link: categoryConfig[catName]
        })).filter(cat => cat.no_of_items > 0 || ["Vegetables", "Fruits", "Grains"].includes(cat.Categoryname)); // Always show top categories
    }, [productsData]);

    return (loadinguser || isLoading) ? <CategorySection loading={true} /> : (
    <div className="bg-white py-16 px-6 flex justify-center">
        <div className="w-full max-w-7xl"> 
            <div className="flex justify-center text-[28px] h-[32px] mb-[16px] font-bold text-organic-green-dark">
                {t('categories.title')}
            </div>
            <div className="flex justify-center">
                <div className="text-[18px] text-gray-500 text-center max-w-[600px] leading-relaxed">
                    {t('categories.subtitle')}
                </div>
            </div>
            <div className="mt-12 flex gap-10 justify-center flex-wrap">
                {dynamicCategories.map((item, index) => (
                    <CategoryItem key={index} {...item} />
                ))}
            </div>
        </div>
    </div>)
}