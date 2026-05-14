import { FaArrowLeft } from "react-icons/fa6";
import "./checkout.css"
import { useContext, useEffect, useState } from "react";
import { CartProductContext } from "../../services/context";
import { useNavigate } from "react-router-dom";
import OrderDetail from "./orderDetail";
import PaymentOptions from "./paymentOptions";
import DeliveryOption from "./deliveryOption";
import AddressForm from "./addressForm";
import { createOrder, getOrder, verifyPayment } from "../../../API/api";
import Addresses from "./addresses";
import OrderPage from "./orderPage";
import {useQuery} from "@tanstack/react-query"
import CheckoutSkeleton from "./Skeletons/checkoutSkeleton"
import Loading from "../Loading/loading"

const Checkout = () => {
    const {cartItems , user, setCartItems, setCmenu} = useContext(CartProductContext)
    const [priceDetail, setPriceDetail] = useState({subtotal: "", platform_fees: "", delivery: "", total: ""});
    const [count, setCount] = useState(1);
    const [selected, setSelected] = useState(0);
    const [paymentSelected, setPaymentSelected] = useState(0);
    const [addNew, setaddNew] = useState(false);
    const [loading, setLoading] = useState(false);
    const [orderStatus, setOrderStatus] = useState(false);
    const [orderId, setOrderId] = useState(null)
    const navigate = useNavigate();
    const [addressForm, setAddressForm] = useState({
        email: "",
        name: "",
        street: "",
        city: "",
        state: "",
        phone: "",
        zipcode: "",
        remember: false
    })

    const {data: orderData, isLoading} = useQuery({
        queryKey: ["orders"],
        queryFn: () => getOrder(orderId),
        select: (res) => (res?.data?.order) || [],
        enabled: !!orderStatus && !!orderId,
    })

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };

    }, []);

    useEffect(() => {
        if (cartItems.length===0){
            navigate("/")
        }
    }, [cartItems.length, navigate]);
    useEffect(() => {
        let subtotal = 0;
        for (let i=0;i<cartItems.length;i++){
            subtotal += (cartItems[i].price)*(cartItems[i].quantity)
        }
        const platform_fees = subtotal*2/100
        let delivery = 0;
        subtotal<=499 ? delivery = 40 : 0
        selected===1 ? delivery = 60 : 0;
        const total = subtotal + platform_fees + delivery
        setPriceDetail({subtotal: subtotal, platform_fees: platform_fees.toFixed(2), delivery: delivery===0 ? "Free Delivery" : `₹${delivery}`, total: total})
    },[cartItems, selected])

    const handleCreateOrder = async (e) => {
        e.preventDefault();
        setCmenu(false)
        setLoading(true);
        if (cartItems?.length<=0){
            alert("Cart Should Not be Empty")
            setLoading(false)
            return
        }
        const orderData = {
            user,
            items: cartItems,
            shippingAddress: addressForm,
            deliveryMethod: selected===0 ? "Standard" : "Express",
            paymentMethod: paymentSelected===0 ? "ONLINE" : "COD",
        }
        if (paymentSelected === 1) {
            try {
                const response = await createOrder(orderData);
                const data = response?.data;

                if (!data.success) {
                    alert(data.msg || "Order creation failed");
                    return;
                }
                setCartItems([]);
                setLoading(false);
                setOrderId(data?.orderid);
                localStorage.removeItem("Cart");
                setOrderStatus(true);
            } catch (err) {
                console.error("COD Order Error:", err);
                alert("Failed to create COD order.");
            }
            return;
        }
        
        if (!user) return;

        try {
            if (!Array.isArray(orderData?.items) || orderData?.items.length === 0) {
                console.error("Cart is empty");
                setLoading(false)
                return;
            }
            const response = await createOrder(orderData);
            const data = response?.data;
            console.log(data);

            if (!data.success) {
                alert(data.msg || "Order creation failed");
                setLoading(false)
                return;
            }

            const options = {
                key: data.key_id,
                amount: data.amount,
                currency: "INR",
                name: data.product_name,
                description: data.description,
                image: orderData?.items?.[0]?.images?.[0],
                order_id: data.order_id,
                handler: async function (response) {
                    const verifyRes = await verifyPayment({
                        payment_id: response.razorpay_payment_id,
                        order_id: response.razorpay_order_id,
                        signature: response.razorpay_signature,
                        orderData
                    })

                    const verifyData = await verifyRes?.data

                    if (verifyData.success) {
                        setCartItems([]);
                        setLoading(false)
                        console.log(verifyData)
                        setOrderId(verifyData.orderid)
                        localStorage.removeItem("Cart");
                        setOrderStatus(true)
                    } else {
                        setLoading(false)
                        alert("❌ Payment Verification Failed");
                    }
                },
                prefill: {
                name: orderData?.user?.name,
                email: orderData?.user.email,
                contact: orderData?.user?.phone,
                },
                theme: { color: "#2300a3" },
            };
            if (!window.Razorpay) {
                setLoading(false)
                alert("Razorpay SDK failed to load. Check your internet connection.");
                return;
            }
            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", () => alert("❌ Payment Failed"));
            rzp.open();
        } catch (err) {
            setLoading(false)
            console.error("Payment error:", err);
        }
    };

    if (loading){
        return <Loading/>
    }
  return isLoading ? <CheckoutSkeleton/> : (
    <section className="min-h-screen flex justify-center bg-gray-50/50 py-16 px-6">
      <div className="w-full max-w-7xl">
        {orderStatus ? <OrderPage orderData={orderData}/> : 
        (<div className="checkout-section relative flex flex-col lg:flex-row gap-12 mt-8">
            <div className="checkout-section-left flex flex-col gap-10 flex-1">
                <div className="flex gap-6 items-center mb-4">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="p-3 rounded-full bg-white shadow-sm border border-gray-100 hover:text-organic-green hover:shadow-md transition-all"
                    >
                        <FaArrowLeft size={18}/>
                    </button>
                    <div className="flex flex-col">
                        <h3 className="text-[28px] font-black text-gray-800 leading-none">Checkout</h3>
                        <p className="text-gray-500 text-sm mt-2">Complete your order from Apnabazaar</p>
                    </div>
                </div>
                
                <div className="steps flex items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    {[1,2,3].map((step, index) => (
                        <div key={index} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center gap-2">
                                <div className={`w-10 h-10 text-sm font-black rounded-full flex justify-center items-center transition-all ${count > step ? "bg-organic-green text-white shadow-lg shadow-organic-green/20" : count === step ? "bg-gray-800 text-white shadow-lg" : "bg-gray-100 text-gray-400 border border-gray-200"}`}>
                                    {count > step ? "✓" : step}
                                </div>
                                <span className={`text-[11px] font-bold uppercase tracking-wider ${count >= step ? "text-gray-800" : "text-gray-400"}`}>
                                    {step === 1 ? "Address" : step === 2 ? "Delivery" : "Payment"}
                                </span>
                            </div>
                            {index !== 2 && (
                                <div className={`h-[2px] mx-4 flex-1 transition-all ${count > step ? "bg-organic-green" : "bg-gray-200"}`}/>
                            )}
                        </div>
                        )
                    )}
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    {user?.addresses?.length > 0 ? 
                        <Addresses user={user} addNew={addNew} setaddNew={setaddNew} addressForm={addressForm} setAddressForm={setAddressForm} setCount={setCount} count={count}/> :
                        <AddressForm addressForm={addressForm} setAddressForm={setAddressForm} setCount={setCount} count={count}/>
                    }
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <DeliveryOption count={count} setCount={setCount} setSelected={setSelected} selected={selected} priceDetail={priceDetail}/>
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <PaymentOptions count={count} setCount={setCount} paymentSelected={paymentSelected} setPaymentSelected={setPaymentSelected} handleCreateOrder={handleCreateOrder} loading={loading}/>
                </div>
            </div>
            
            <div className="lg:w-[400px]">
                <div className="sticky top-24">
                    <OrderDetail cartItems={cartItems} priceDetail={priceDetail}/>
                </div>
            </div>
        </div>)}
      </div>
    </section>
  )
}

export default Checkout
