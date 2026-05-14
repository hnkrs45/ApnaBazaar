import { useQuery } from "@tanstack/react-query";
import { Heart, MessageCircle, Star } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa6";
import { HiOutlineTruck } from "react-icons/hi";
import { MdOutlineShare } from "react-icons/md";
import { useNavigate, useParams } from "react-router-dom";
import { deleteWishlist, getProductsById, updateWishlist } from "../../../API/api";
import { userSearchMl } from "../../../API/ml";
import { useLanguage } from "../../services/LanguageContext";
import { CartProductContext } from "../../services/context";
import { ProductShow } from "../Home/Components/productshow";
import FavoritesSkeleton from "../User/Profile/Skeletons/favoritesSkeleton";
import CartPopup from "./cartPopUp";
import Detail from "./detail";
import "./productdetail.css";
import ProductDetailSkeleton from "./productDetailSkeleton";
import Reviews from "./reviews";
import Vendor from "./vendor";

const ProductDetails = () => {
  const { t, language } = useLanguage();
  const {user, cartItems, setCartItems, setCmenu, dataForMl, setDataForMl} = useContext(CartProductContext)
  const [wishlist, setWishlist] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [btn, setBtn] = useState("Add to Cart")
  const [select, setSelect] = useState(0)
  const navigate = useNavigate();
  const param = useParams();
  const Productid = param?.Productid
  const [selectedImage, setSelectedImage] = useState(null);
   const [popUp, setPopUp] = useState(false);
  
  const {data: product, isLoading, refetch} = useQuery({
    queryKey : ["showproduct", Productid],
    queryFn: () => getProductsById(Productid),
    select: (res) => (res?.data?.product) || [],
    enabled: !!Productid,
  })

  const {data: mlprd, mlLoading} = useQuery({
    queryKey: [`mlprd`, Productid],
    queryFn: () => userSearchMl(product?.name),
    select: (res) => res?.data,
    enabled: !!product?.name
  })

  useEffect(() => {
    if (product?.images?.length > 0) {
      setSelectedImage(product.images[0]);
    }
  },[product])

  useEffect(() => {
      if (popUp) {
        const timer = setTimeout(() => {
        setPopUp(false);
      }, 2000);
      return () => clearTimeout(timer);
      }
  }, [popUp]);

  useEffect(() => {
    const check = user?.wishlist?.includes(Productid)
    check ? setWishlist(true) : setWishlist(false);
  },[user, Productid])

  useEffect(() => {
    const product = cartItems.filter(p => p._id === Productid)
    product.length===0 ? setBtn("Add to Cart") : setBtn("Go to Cart")
  },[cartItems, Productid])

  useEffect(() => {
    return () => {
      if (dataForMl?.currentView) {
        const duration = Date.now() - dataForMl.currentView.startTime;

        setDataForMl(prev => {
          const updated = {
            ...prev,
            products: [
              ...(prev.products || []),
              {
                product: {
                  productID: prev.currentView.product.productID,
                  category: prev.currentView.product.category,
                  name: prev.currentView.product.name
                },
                time: new Date(Date.now()).toLocaleString(),
                duration,
                event: { type: "view", time: new Date(Date.now()).toLocaleString() },
              },
            ],
            currentView: null,
          };

          localStorage.setItem("interaction", JSON.stringify(updated));
          return updated;
        });
      }
    };
  }, [dataForMl?.currentView, setDataForMl]);

  const handleAddtoCart = () => {
    if (btn === "Add to Cart") {
      const exists = cartItems.some(item => item._id === product._id);
      if (exists) return;

      product.quantity = quantity;
      setCartItems(prev => [...prev, product]);

      setDataForMl(prev => {
        const updated = {
          ...prev,
          products: [
            ...(prev.products || []),
            {
              product: {
                productID: prev.currentView.product.productID,
                category: prev.currentView.product.category,
                name: prev.currentView.product.name
              },
              time: new Date(Date.now()).toLocaleString(),
              duration:
                prev.currentView && prev.currentView.product.productID === product._id
                  ? Date.now() - prev.currentView.startTime
                  : 0,
              event: { type: "add_to_cart", time: new Date(Date.now()).toLocaleString() },
            },
          ],
        };

        localStorage.setItem("interaction", JSON.stringify(updated));
        return updated;
      });
    } else {
      setCmenu(true);
    }
  };

  const handleWishlist = async () => {
    setWishlist(!wishlist);
    if (user?.wishlist?.includes(Productid)){
      await deleteWishlist(Productid)
    } else {
      await updateWishlist(Productid)
    }
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: "Check this out!",
        text: "Cool product I found 👇",
        url: window.location.href,
      });
    } catch (err) {
      console.log("Share failed:", err);
    }
  };

  if (isLoading || mlLoading){
    return <ProductDetailSkeleton/>
  }
  function renderBoldItalic(text) {
    let html = text.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
    html = html.replace(/\*(.*?)\*/g, "<i>$1</i>");
    html = html.replace(/\n/g, "<br/>");
    return html;
  }

  return (
    <section className="product-detail flex flex-col items-center bg-gray-50/30 min-h-screen">
      <div className="product-detail-section w-full max-w-7xl mt-[100px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 p-6 bg-white rounded-3xl shadow-sm border border-gray-100">
        <div className="md:col-span-2">
            <button 
                onClick={() => navigate(-1)} 
                className="flex items-center gap-2 text-gray-500 hover:text-organic-green transition-colors font-semibold text-sm group"
            >
                <FaArrowLeft className="group-hover:-translate-x-1 transition-transform"/>
                {t('nav.back')}
            </button>
        </div>
        
        <div className="product-detail-section-left space-y-6">
          <div className="bg-gray-50 rounded-3xl p-8 flex justify-center items-center h-[500px] border border-gray-100 overflow-hidden group">
            <img 
                src={selectedImage} 
                alt={product?.name} 
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
            />
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            {product?.images?.map((img, i) => (
              <button 
                key={i} 
                onClick={() => setSelectedImage(img)}
                className={`w-24 h-24 rounded-2xl p-2 border-2 transition-all overflow-hidden ${selectedImage === img ? "border-organic-green bg-white shadow-md" : "border-gray-100 bg-gray-50 hover:border-organic-green/30"}`}
              >
                <img src={img} alt={`thumb-${i}`} className="w-full h-full object-contain"/>
              </button>
            ))}
          </div>
        </div>

        <div className="product-detail-section-right flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div>
                <span className="text-sm font-bold text-organic-green bg-organic-green/5 px-3 py-1 rounded-full border border-organic-green/10">
                    {product?.category}
                </span>
                <h1 className="text-[36px] font-black text-gray-800 mt-3 leading-tight">
                    {product?.name?.[language] || product?.name?.en || product?.name}
                </h1>
            </div>
            <div className="flex gap-3">
              {product?.vendor?._id && (
                 <button 
                    onClick={() => navigate(`/chat/${product?.vendor?._id}`)} 
                    className="p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-organic-green/10 hover:text-organic-green transition-all"
                >
                    <MessageCircle size={22}/>
                </button>
              )}
              <button 
                onClick={handleWishlist} 
                className={`p-3 rounded-full transition-all ${wishlist ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600"}`}
              >
                <Heart size={22} className={wishlist ? "fill-current" : ""}/>
              </button>
              <button 
                onClick={handleShare} 
                className="p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
              >
                <MdOutlineShare size={22}/>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                <Star key={i} size={18} className={i < Math.floor(product?.ratings?.average) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
                ))}
            </div>
            <span className="text-sm font-bold text-gray-400">
              {product?.ratings?.average || 0} ({product?.reviews?.length || 0} reviews)
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-8">
            <span className="text-[18px] font-bold text-gray-400">Price:</span>
            <span className="text-[42px] font-black text-organic-green-dark">₹{product?.price}</span>
            <span className="text-[18px] font-bold text-gray-400">/ {product?.unit || "Quintal"}</span>
          </div>

          <div className="prose prose-sm text-gray-600 mb-8 max-w-none border-t border-gray-100 pt-6">
            <div
                className="leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderBoldItalic(product?.description?.[language] || product?.description?.en || product?.description || "") }}
            />
          </div>

          <div className="p-4 bg-organic-green/5 rounded-2xl border border-organic-green/10 mb-8">
            <div className="flex items-center gap-4 text-organic-green-dark">
              <HiOutlineTruck size={28}/>
              <div>
                <p className="font-bold">Bulk Logistics Support Available</p>
                <p className="text-sm opacity-80 font-medium">Special handling for Quintals and Tonnes</p>
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between">
                <div className="flex items-center bg-gray-100 rounded-2xl p-1">
                    <button 
                        className="w-12 h-12 flex items-center justify-center text-xl font-bold text-gray-600 hover:bg-white rounded-xl transition-all shadow-none hover:shadow-sm" 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                        -
                    </button>
                    <span className="w-16 text-center font-bold text-gray-800 text-lg">{quantity}</span>
                    <button 
                        className="w-12 h-12 flex items-center justify-center text-xl font-bold text-gray-600 hover:bg-white rounded-xl transition-all shadow-none hover:shadow-sm" 
                        onClick={() => setQuantity(quantity + 1)}
                    >
                        +
                    </button>
                </div>
                <span className="text-gray-500 font-bold text-lg ml-2">{product?.unit || "Quintal"}</span>
                <div className="text-right ml-auto">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Price</p>
                    <p className="text-2xl font-black text-gray-800">₹{(product?.price * quantity).toFixed(2)}</p>
                </div>
            </div>
            
            <button 
                onClick={(e) => {
                    if (btn === "Add to Cart") {
                        handleAddtoCart(e);
                        setPopUp(true);
                    } else {
                        handleAddtoCart(e);
                    }
                }}
                className={`w-full py-5 rounded-2xl font-black text-lg transition-all shadow-lg active:scale-[0.98] ${btn === "Add to Cart" ? "bg-organic-green text-white hover:bg-organic-green-dark shadow-organic-green/20" : "bg-gray-800 text-white hover:bg-black shadow-black/10"}`}
            >
              {btn === "Add to Cart" ? "ADD TO CART" : "VIEW IN CART"}
            </button>
          </div>
        </div>
      </div>

      <div className="other-details w-full max-w-7xl mt-16 px-6 relative pb-24">
        <div className="flex justify-center mb-10">
            <div className="inline-flex rounded-2xl bg-gray-100 p-1.5 border border-gray-200">
            {
                ["Detail", "Vendor Info", "Reviews"].map((item, index) => (
                <button 
                    onClick={() => setSelect(index)} 
                    key={index} 
                    className={`px-8 py-3 font-bold rounded-xl text-sm transition-all ${select===index ? "bg-white text-organic-green shadow-md" : "text-gray-500 hover:text-organic-green"}`}
                >
                    {item}
                </button>
                ))
            }
            </div>
        </div>
        
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-16">
            {select===0 ? <Detail product={product}/> :
             select===1 ? <Vendor vendor={product?.vendor?.vendor}/> : 
             <Reviews product={product} refetch={refetch}/>}
        </div>

        <div className="feature-products border-t border-gray-100 pt-16">
            <div className="text-center mb-12">
                <h3 className="text-[28px] font-black text-gray-800">You Might Also Like</h3>
                <p className="text-gray-500 mt-2">Recommended bulk produce from nearby farms</p>
            </div>
            <div className="w-full flex gap-6 flex-wrap justify-center">
                {
                    mlprd?.recommendations?.slice(0, 4).map((product, index) => {
                        return <ProductShow key={index} product={product} />
                    })
                }
            </div>
        </div>
      </div>
      <CartPopup show={popUp} message="Product added to cart!" />
    </section>
  );
};

export default ProductDetails;
