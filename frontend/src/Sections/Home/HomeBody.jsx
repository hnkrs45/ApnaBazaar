import { useContext } from "react"
import { FeaturedLocalProducts } from "./Parts/Featuredprod"
import { Hbody1 } from "./Parts/Hbody1"
import { ShopbyCategory } from "./Parts/ShopBycategory"
import { FarmerGuide } from "./Parts/FarmerGuide"
import { CartProductContext } from "../../services/context"

export const HomeBody = () =>{
    const { user, loadinguser } = useContext(CartProductContext)
    return (
    <div>
        <Hbody1 loadinguser={loadinguser}/>
        {user?.role === "vendor" && <FarmerGuide />}
        <ShopbyCategory loadinguser={loadinguser}/>
        <FeaturedLocalProducts loadinguser={loadinguser}/>
    </div>
)}