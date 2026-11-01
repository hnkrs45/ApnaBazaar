import { Search, Loader2, Sparkles } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../services/LanguageContext";

export const SearchBar = () => {
    const { t, language } = useLanguage();
    const [search, setSearch] = useState("");
    const [location, setLocation] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // AI Semantic Search Debounce
    useEffect(() => {
        const query = search.trim();
        if (!query || query.length < 2) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const backendUrl =
                    import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
                const res = await fetch(
                    `${backendUrl}/api/product/ai-search?query=${encodeURIComponent(
                        query
                    )}&limit=5`,
                    { credentials: "include" }
                );
                const data = await res.json();
                if (data.success && data.products) {
                    setSuggestions(data.products);
                    setIsOpen(true);
                } else {
                    setSuggestions([]);
                }
            } catch (err) {
                console.error("AI Search Fetch Error:", err);
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    const handleSearch = (e) => {
        e.preventDefault();
        setIsOpen(false);
        if (search || location) {
            const queryParams = new URLSearchParams();
            if (search) queryParams.append("name", search);
            if (location) queryParams.append("location", location);
            navigate(`/search?${queryParams.toString()}`);
        }
    };

    const handleSelectProduct = (productId) => {
        setIsOpen(false);
        navigate(`/productdetail/${productId}`);
    };
    return (
        <div ref={dropdownRef} className="relative">
            <form
                onSubmit={handleSearch}
                className="search-bar relative h-[40px] bg-white flex items-center gap-3 rounded-full w-[35vw] border-solid border-[1.5px] border-gray-200 focus-within:border-organic-green-light focus-within:shadow-sm transition-all px-4"
            >
                {loading ? (
                    <Loader2 width="18px" className="text-organic-green animate-spin" />
                ) : (
                    <Search width="18px" className="text-gray-400" />
                )}

                <input
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setIsOpen(true)}
                    value={search}
                    className="w-[50%] text-black text-[14px] font-medium h-[30px] bg-transparent outline-none"
                    placeholder={t("common.searchPlaceholder") || "AI Smart Search..."}
                />

                <div className="h-[20px] w-[1px] bg-gray-200"></div>

                <input
                    onChange={(e) => setLocation(e.target.value)}
                    value={location}
                    className="w-[45%] text-black text-[14px] font-medium h-[30px] bg-transparent outline-none"
                    placeholder={t("common.locationPlaceholder") || "Location..."}
                />

                <button type="submit" className="hidden"></button>
            </form>

            {/* AI Suggestions Dropdown */}
            {isOpen && suggestions.length > 0 && (
                <div className="absolute top-[48px] left-0 w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[100] animate-in fade-in-50 duration-200">
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5 text-[11px] font-semibold text-organic-green">
                        <Sparkles size={13} />
                        <span>AI Semantic Results</span>
                    </div>
                    <div className="max-h-[320px] overflow-y-auto divide-y divide-gray-50">
                        {suggestions.map((item) => {
                            const productName =
                                typeof item.name === "object"
                                    ? item.name[language] || item.name.en || item.name.hi
                                    : item.name;

                            const productImage =
                                Array.isArray(item.images) && item.images.length > 0
                                    ? item.images[0]
                                    : "/placeholder.png";

                            return (
                                <div
                                    key={item.productID || item._id}
                                    onClick={() => handleSelectProduct(item.productID || item._id)}
                                    className="px-3 py-2.5 flex items-center justify-between hover:bg-gray-50/80 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={productImage}
                                            alt={productName}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "https://placehold.co/100x100?text=Produce";
                                            }}
                                            className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0"
                                        />
                                        <div>
                                            <p className="text-[13px] font-semibold text-gray-800 line-clamp-1">
                                                {productName}
                                            </p>
                                            <p className="text-[11px] text-gray-400">
                                                {item.category} {item.location ? `• ${item.location}` : ""}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0 pl-2">
                                        <p className="text-[13px] font-bold text-gray-900">
                                            ₹{item.price}
                                        </p>
                                        <span
                                            className={`text-[10px] font-medium ${item.inStock ? "text-green-600" : "text-red-500"
                                                }`}
                                        >
                                            {item.inStock ? "In Stock" : "Out of Stock"}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};