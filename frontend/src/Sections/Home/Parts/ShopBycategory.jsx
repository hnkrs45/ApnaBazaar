import { CategoryItem } from "../Components/Categoryitem"
import CategorySection from "../Skeleton/category"
import { useLanguage } from "../../../services/LanguageContext"

export const ShopbyCategory = ({loadinguser}) =>{
    const { t } = useLanguage();
    const data = [
        {Categoryname:t('categories.vegetables'), no_of_items:15, img_link:"https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=300&h=300&fit=crop"},
        {Categoryname:t('categories.fruits'), no_of_items:30, img_link:"https://images.unsplash.com/photo-1619566636858-adb3ef26400b?w=300&h=300&fit=crop"},
        {Categoryname:t('categories.dairy'), no_of_items:8, img_link:"https://images.unsplash.com/photo-1550583724-1d2ee29ad7a1?w=300&h=300&fit=crop"},
        {Categoryname:t('categories.pantry'), no_of_items:5, img_link:"https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300&h=300&fit=crop"},
        {Categoryname:t('categories.bakery'), no_of_items:22, img_link:"https://images.unsplash.com/photo-1585478259715-876acc5be8eb?w=300&h=300&fit=crop"}
    ]
    return loadinguser ? <CategorySection/> : (
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
                {data.map((item, index) => (
                    <CategoryItem key={index} {...item} />
                ))}
            </div>
        </div>
    </div>)

}