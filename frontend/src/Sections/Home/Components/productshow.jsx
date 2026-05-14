import { Star } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { FaIndianRupeeSign, FaPlus } from "react-icons/fa6";
import { NavLink } from "react-router-dom";
import { CartProductContext } from "../../../services/context";
import CartPopup from "../../Product/cartPopUp";
import '../home.css';

export const ProductShow= ({product}) =>{
    const {cartItems, setCartItems, setDataForMl } = useContext(CartProductContext)
    const [popUp, setPopUp] = useState(false);
    const updateQuantity = (productId, newQty) => {
        setCartItems(prevCart =>
            prevCart.map(item =>
            item.id === productId
                ? { ...item, quantity: newQty }
                : item
            )
        )
    }

    useEffect(() => {
        if (popUp) {
        const timer = setTimeout(() => {
            setPopUp(false);
        }, 2000);
        return () => clearTimeout(timer);
        }
    }, [popUp]);
    const handleAddtoCart = (product) => {
        for (let i=0;i<cartItems.length;i++){
            if (cartItems[i]._id === product._id){
                updateQuantity(cartItems[i].id, cartItems[i].quantity+1)
                return;
            }
        }
        product["quantity"] = 1;
        setCartItems(prev => [...prev, product])
    }

    const handleClickedData = () => {
        setDataForMl(prev => ({
            ...prev,
            currentView: {
                product: {
                    productID: product._id,
                    category: product?.category,
                    name: product?.name
                },
                startTime: Date.now(),
            },
        }));
    }

    if (!product) return null;

    return (
        <NavLink className="block no-underline" onClick={handleClickedData} to={`/productdetail/${product.productID || product._id}`}>
            <div className="product-cart-component cursor-pointer border-solid relative border-[1px] border-gray-100 group h-[480px] bg-white w-[256px] rounded-2xl hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="h-[240px] w-full overflow-hidden bg-gray-50">
                    <img loading="lazy" className="object-cover w-full h-full transition-all group-hover:scale-110 duration-500" src={product?.images?.[0] || ""} alt={product?.name || "Product"} />
                </div>
                <div className="p-4 flex flex-col h-[240px] min-w-0">
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-[14px] font-bold text-organic-green px-2 py-0.5 bg-organic-green/5 rounded-full border border-organic-green/10">
                            {product?.category || "General"}
                        </div>
                    </div>
                    <h3 className="product-card-title text-[17px] font-bold text-gray-800 leading-snug mb-2">
                        {product?.name || "Unknown Product"}
                    </h3>
                    
                    <div className="product-card-component-rating flex items-center gap-1.5 mb-3">
                        <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={14} className={i < Math.floor(product?.ratings?.average || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
                            ))}
                        </div>
                        <span className="text-[12px] font-bold text-gray-400">
                            {product?.ratings?.average || 0}
                        </span>
                    </div>

                    <div className="text-[12px] text-gray-500 mb-4 space-y-0.5 min-h-[38px]">
                        <div className="flex items-center gap-1">
                            <span className="shrink-0">👨‍🌾</span>
                            <span className="truncate">{product?.vendor?.vendor?.companyName || product?.vendor?.name || "Local Vendor"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="shrink-0">📍</span>
                            <span className="truncate">{product?.vendor?.vendor?.address || product?.location || "Local Area"}</span>
                        </div>
                    </div>

                    <div className="mt-auto flex justify-between items-center pt-3 border-t border-gray-50">
                        <div className="flex items-baseline text-organic-green-dark">
                            <span className="text-[14px] font-bold mr-0.5">₹</span>
                            <span className="text-[22px] font-black">{product?.price || 0}</span>
                        </div>
                        <div 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddtoCart(product); setPopUp(true) }} 
                            className="cursor-pointer flex justify-center items-center h-10 w-10 rounded-full bg-organic-green text-white shadow-md hover:bg-organic-green-dark hover:shadow-lg transition-all active:scale-90"
                        >
                            <FaPlus size={16}/>
                        </div>
                    </div>
                </div>
                <CartPopup show={popUp} message="Product added to cart!" />
            </div>
        </NavLink>
    )
}
