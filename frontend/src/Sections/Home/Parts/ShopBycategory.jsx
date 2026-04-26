import { CategoryItem } from "../Components/Categoryitem"
import CategorySection from "../Skeleton/category"

export const ShopbyCategory = ({loadinguser}) =>{
    const data = [
        {Categoryname:"Electronics", no_of_items:15, img_link:"https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300&h=300&fit=crop"},
        {Categoryname:"Clothes", no_of_items:30, img_link:"https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=300&h=300&fit=crop"},
        {Categoryname:"Furniture", no_of_items:8, img_link:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=300&fit=crop"},
        {Categoryname:"Vehicles", no_of_items:5, img_link:"https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=300&h=300&fit=crop"},
        {Categoryname:"Other", no_of_items:22, img_link:"https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=300&h=300&fit=crop"}
    ]
    return loadinguser ? <CategorySection/> : (
    <div className="bg-[#f5f5f7] pt-[42px] pb-[42px]">
        <div> 
            <div className="flex justify-center text-[26.5px] h-[32px] mb-[14px] font-[500]">
                Shop By Category
            </div>
            <div className="flex justify-center">
                <div className="text-[20px] h-[21px] text-[#717182] text-center">
                    Browse our wide selection of local products organized by category
                </div>
            </div>
            <div className="mt-8 flex gap-4 justify-center flex-wrap">
                {
                    data.map((item, index) => {
                        return (
                            <CategoryItem key={index} Categoryname={item.Categoryname} no_of_items={item.no_of_items} img_link={item.img_link}/>
                        )
                    })
                }
            </div>
        </div>
    </div>)

}