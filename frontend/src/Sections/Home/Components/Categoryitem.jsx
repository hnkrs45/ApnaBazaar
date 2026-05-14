import { Link } from "react-router-dom";

export const CategoryItem = ({
    Categoryname,
    no_of_items,
    img_link
}) =>{
    return (
    <Link to={`/categories?category=${Categoryname}`} className="flex flex-col items-center group cursor-pointer">
        <div className="h-[140px] w-[140px] overflow-hidden rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 relative">
            <img className="object-cover w-full h-full transition-all group-hover:scale-110 duration-500" src={img_link} alt={Categoryname} />
            <div className="absolute top-2 right-2 bg-organic-green text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                {no_of_items}
            </div>
        </div>
        <div className="mt-3 text-[15px] font-bold text-gray-800 group-hover:text-organic-green transition-colors">{Categoryname}</div>
    </Link>)
}