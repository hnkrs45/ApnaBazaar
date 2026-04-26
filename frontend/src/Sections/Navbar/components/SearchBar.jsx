import { Search } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

export const SearchBar = () =>{
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
        <form onSubmit={handleSearch} className={`search-bar relative h-[31.5px] bg-[#f3f3f5] flex items-center gap-3 rounded-lg w-[35vw] border-solid border-[1px] border-gray-200`}>
            <Search width="23px" className="pl-[4px]"/>
            <input onChange={(e) => setSearch(e.target.value)} value={search} className="w-[50%] text-black text-[14px] font-medium font-lg h-[30px] bg-[#f3f3f5] outline-none" placeholder="Search products..."/>
            <div className="h-[20px] w-[1px] bg-gray-300"></div>
            <input onChange={(e) => setLocation(e.target.value)} value={location} className="w-[45%] text-black text-[14px] font-medium font-lg h-[30px] bg-[#f3f3f5] outline-none" placeholder="Location..."/>
            <button type="submit" className="hidden"></button>
        </form>
    )
}