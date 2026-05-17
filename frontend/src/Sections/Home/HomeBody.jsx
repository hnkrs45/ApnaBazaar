import { FeaturedLocalProducts } from "./Parts/Featuredprod"
import { Hbody1 } from "./Parts/Hbody1"
import { ShopbyCategory } from "./Parts/ShopBycategory"

export const HomeBody = () =>{
    return (
    <div>
        <Hbody1/>
        <ShopbyCategory/>
        <FeaturedLocalProducts/>
    </div>
)}
