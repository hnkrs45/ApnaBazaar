import { Search } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useLanguage } from "../../../services/LanguageContext"

export const SearchBar = () =>{
    const { t } = useLanguage();
    const [search, setSearch] = useState("")
    const [location, setLocation] = useState("")
    const navigate = useNavigate()
    const handleSearch = async (e) => {
        e.preventDefault();
        if (search || location){
            const queryParams = new URLSearchParams();
            if (search) queryParams.append("name", search);
            if (location) queryParams.append("location", location);
            navigate(`/search?${queryParams.toString()}`)
        }
    }
    return(
        <form onSubmit={handleSearch} className={`search-bar relative h-[40px] bg-white flex items-center gap-3 rounded-full w-[35vw] border-solid border-[1.5px] border-gray-200 focus-within:border-organic-green-light focus-within:shadow-sm transition-all px-4`}>
            <Search width="20px" className="text-gray-400"/>
            <input onChange={(e) => setSearch(e.target.value)} value={search} className="w-[50%] text-black text-[14px] font-medium h-[30px] bg-transparent outline-none" placeholder={t('common.searchPlaceholder')}/>
            <div className="h-[20px] w-[1px] bg-gray-200"></div>
            <input onChange={(e) => setLocation(e.target.value)} value={location} className="w-[45%] text-black text-[14px] font-medium h-[30px] bg-transparent outline-none" placeholder={t('common.locationPlaceholder')}/>
            <button type="submit" className="hidden"></button>
        </form>
    )
}