import { Star } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa6";
import { NavLink } from "react-router-dom";
import { CartProductContext } from "../../../services/context";
import { useLanguage } from "../../../services/LanguageContext";
import CartPopup from "../../Product/cartPopUp";
import '../home.css';

export const ProductShow = ({ product }) => {
    const { cartItems, setCartItems, setDataForMl } = useContext(CartProductContext);
    const { language } = useLanguage();
    const [popUp, setPopUp] = useState(false);

    const updateQuantity = (productId, newQty) => {
        setCartItems(prevCart =>
            prevCart.map(item =>
                (item._id === productId || item.productID === productId)
                    ? { ...item, quantity: newQty }
                    : item
            )
        );
    };

    useEffect(() => {
        if (popUp) {
            const timer = setTimeout(() => {
                setPopUp(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [popUp]);

    const handleAddtoCart = (prod) => {
        const pId = prod._id || prod.productID;
        const existing = cartItems.find(item => (item._id === pId || item.productID === pId));
        if (existing) {
            updateQuantity(pId, (existing.quantity || 1) + 1);
        } else {
            setCartItems(prev => [...prev, { ...prod, productID: pId, quantity: 1 }]);
        }
    };

    const handleClickedData = () => {
        setDataForMl(prev => ({
            ...prev,
            currentView: {
                product: {
                    productID: product._id || product.productID,
                    category: product?.category,
                    name: product?.name
                },
                startTime: Date.now(),
            },
        }));
    };

    if (!product) return null;

    const productId = product.productID || product._id;
    const productName = product?.name?.[language] || product?.name?.en || product?.name || "Product";
    const vendorName = product?.vendor?.vendor?.companyName || product?.vendor?.name || product?.brand || "Local Vendor";
    const location = product?.vendor?.vendor?.address || product?.location || "Direct from Farm";

    return (
        <NavLink 
            className="block no-underline h-full" 
            onClick={handleClickedData} 
            to={`/productdetail/${productId}`}
        >
            <div className="product-cart-component cursor-pointer border relative border-gray-100 group bg-white w-[256px] min-h-[490px] h-full rounded-2xl hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between">
                <div>
                    {/* Image Header */}
                    <div className="h-[210px] w-full overflow-hidden bg-gray-50 relative">
                        <img 
                            loading="lazy" 
                            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" 
                            src={product?.images?.[0] || "/placeholder.png"} 
                            alt={productName} 
                        />
                        <div className="absolute top-2.5 left-2.5">
                            <span className="text-[12px] font-bold text-emerald-800 px-2.5 py-0.5 bg-white/95 rounded-full shadow-sm border border-emerald-100 backdrop-blur-sm">
                                {product?.category || "Grocery"}
                            </span>
                        </div>
                    </div>

                    {/* Content Body */}
                    <div className="p-4 pb-2">
                        <h3 className="product-card-title text-[16px] font-bold text-gray-800 leading-snug mb-1.5 line-clamp-2" title={productName}>
                            {productName}
                        </h3>
                        
                        <div className="product-card-component-rating flex items-center gap-1.5 mb-2">
                            <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                    <Star 
                                        key={i} 
                                        size={13} 
                                        className={i < Math.floor(product?.ratings?.average || 4.5) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} 
                                    />
                                ))}
                            </div>
                            <span className="text-[12px] font-semibold text-gray-400">
                                {product?.ratings?.average || "4.5"}
                            </span>
                        </div>

                        <div className="text-[12px] text-gray-500 space-y-1">
                            <div className="flex items-center gap-1.5">
                                <span className="shrink-0 text-xs">👨‍🌾</span>
                                <span className="truncate text-gray-600 font-medium">{vendorName}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="shrink-0 text-xs">📍</span>
                                <span className="truncate text-gray-400">{location}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer with Price & Add Button */}
                <div className="p-4 pt-3 mt-auto border-t border-gray-100 flex justify-between items-center bg-gray-50/40">
                    <div className="flex flex-col">
                        <div className="flex items-baseline text-emerald-700">
                            <span className="text-sm font-bold mr-0.5">₹</span>
                            <span className="text-[20px] font-black">{product?.price || 0}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-gray-400">per {product?.unit || "Unit"}</span>
                    </div>
                    
                    <button 
                        type="button"
                        aria-label="Add to cart"
                        onClick={(e) => { 
                            e.preventDefault(); 
                            e.stopPropagation(); 
                            handleAddtoCart(product); 
                            setPopUp(true); 
                        }} 
                        className="cursor-pointer flex justify-center items-center h-10 w-10 rounded-full bg-emerald-600 text-white shadow-md hover:bg-emerald-700 hover:shadow-lg transition-all active:scale-95 shrink-0"
                    >
                        <FaPlus size={15} />
                    </button>
                </div>

                <CartPopup show={popUp} message="Product added to cart!" />
            </div>
        </NavLink>
    );
};
