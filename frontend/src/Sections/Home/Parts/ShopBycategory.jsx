import { CategoryItem } from "../Components/Categoryitem"
import CategorySection from "../Skeleton/category"

export const ShopbyCategory = ({loadinguser}) =>{
    const data = [
        {Categoryname:"Vegetables", no_of_items:15, img_link:"https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=300&h=300&fit=crop"},
        {Categoryname:"Fruits", no_of_items:30, img_link:"https://images.unsplash.com/photo-1619566636858-adb3ef26400b?w=300&h=300&fit=crop"},
        {Categoryname:"Dairy & Eggs", no_of_items:8, img_link:"https://images.unsplash.com/photo-1550583724-1d2ee29ad7a1?w=300&h=300&fit=crop"},
        {Categoryname:"Pantry", no_of_items:5, img_link:"https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300&h=300&fit=crop"},
        {Categoryname:"Bakery", no_of_items:22, img_link:"https://images.unsplash.com/photo-1585478259715-876acc5be8eb?w=300&h=300&fit=crop"}
    ]
    return loadinguser ? <CategorySection/> : (
    <div className="bg-[#f5f5f7] pt-[42px] pb-[42px]">
        <div> 
            <div className="flex justify-center text-[26.5px] h-[32px] mb-[14px] font-[500]">
                Shop Fresh Groceries
            </div>
            <div className="flex justify-center">
                <div className="text-[20px] h-[21px] text-[#717182] text-center">
                    Browse our wide selection of farm-fresh groceries delivered from local farms
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