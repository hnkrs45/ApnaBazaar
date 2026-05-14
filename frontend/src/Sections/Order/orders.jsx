import { Eye, Package, Search } from "lucide-react";
import "./checkout.css"
import { getOrders } from "../../../API/api";
import { useState } from "react";
import dayjs from "dayjs";
import { FaChevronDown } from "react-icons/fa";
import {useQuery} from "@tanstack/react-query"
import OrdersSkeleton from "./Skeletons/ordersSkeleton";
import {NavLink} from "react-router-dom"

const Orders = ({user}) => {
    const [filter, setFilter] = useState("All")
    const [year, setYear] = useState("2025")

    const {data: orders, isLoading} = useQuery({
        queryKey: ["orders"],
        queryFn: getOrders,
        select: (res) => (res?.data?.orders) || []
    })
  return isLoading ? <OrdersSkeleton/> : (
    <section className="flex flex-col items-center bg-gray-50/50 min-h-screen py-16 px-6">
        <div className="orders-page relative w-full max-w-7xl mt-[80px]">
            <div className="w-full mb-12 px-2 flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                    <h2 className="text-[32px] font-black text-gray-800 leading-tight">Order History</h2>
                    <p className="text-gray-500 mt-2">
                    Track your orders and view your purchase history with Apnabazaar
                    </p>
                </div>

                <div className="orders-section-filters flex items-center gap-3 bg-white border border-gray-100 rounded-2xl shadow-sm p-2">
                    <div className="relative">
                        <select 
                            onChange={(e) => setFilter(e.target.value)} 
                            className="bg-gray-50 text-sm font-bold w-[130px] rounded-xl px-4 appearance-none py-2.5 focus:outline-none focus:ring-2 focus:ring-organic-green/20 transition-all cursor-pointer"
                        >
                            <option value={"All"}>All Orders</option>
                            <option value={"processing"}>Processing</option>
                            <option value={"pending"}>Pending</option>
                            <option value={"shipped"}>Shipped</option>
                            <option value={"delivered"}>Delivered</option>
                            <option value={"cancelled"}>Cancelled</option>
                        </select>
                        <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 size-3"/>
                    </div>
                    <div className="relative">
                        <select 
                            onChange={(e) => setYear(e.target.value)} 
                            className="bg-gray-50 text-sm font-bold w-[100px] rounded-xl px-4 appearance-none py-2.5 focus:outline-none focus:ring-2 focus:ring-organic-green/20 transition-all cursor-pointer"
                        >
                            {Array.from(
                                { length: new Date().getFullYear() - new Date(user?.createdAt || Date.now()).getFullYear() + 1 },
                                (_, i) => new Date(user?.createdAt || Date.now()).getFullYear() + i
                            )
                            .reverse()
                            .map((y) => (
                            <option key={y} value={y}>
                                {y}
                            </option>
                            ))}
                        </select>
                        <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 size-3"/>
                    </div>
                </div>
            </div>
            
            <div className="w-full flex flex-col gap-6 items-center relative">
                {orders?.filter(order => {
                    const orderYear = new Date(order.createdAt).getFullYear();
                    const matchesStatus = filter === "All" || order.orderStatus === filter;
                    const matchesYear = orderYear === Number(year);
                    return matchesStatus && matchesYear;
                })
                ?.slice().reverse().map((order, index) => (
                    <div key={index} className="w-full bg-white shadow-sm hover:shadow-md transition-shadow rounded-3xl p-6 flex flex-col gap-6 border border-gray-100 group" >
                        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-50 pb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-gray-100 text-gray-500 group-hover:bg-organic-green/10 group-hover:text-organic-green transition-colors">
                                    <Package size={24} />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider">{order?.orderId}</h2>
                                    <p className="text-xs font-bold text-gray-400 mt-0.5">Ordered on {dayjs(order?.createdAt).format("DD MMM YYYY, hh:mm A")}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[20px] font-black text-gray-800">₹{order?.totalAmount}</span>
                                <span className={`text-[11px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mt-1 ${order?.orderStatus === 'delivered' ? 'bg-green-100 text-green-600' : 'bg-organic-green/10 text-organic-green'}`}>
                                    {order?.orderStatus || 'Processing'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex gap-3 flex-wrap">
                                {
                                    order?.items?.map((item, idx) => (
                                        <div key={idx} className="w-16 h-16 rounded-2xl bg-gray-50 p-1.5 border border-gray-100 overflow-hidden">
                                            <img src={item?.product?.images?.[0]} alt={item?.product?.name} className="w-full h-full object-contain" />
                                        </div>
                                    ))
                                }
                            </div>

                            <div className="flex flex-col items-end gap-3">
                                <p className="text-xs font-bold text-gray-400">
                                    {order?.items?.length} item{order?.items?.length > 1 ? "s" : ""}{" "}
                                    <span className="mx-2 opacity-30">•</span> 
                                    Expected <span className="text-gray-600">{dayjs(order?.createdAt).add(3, 'day').format("DD MMM YYYY")}</span>
                                </p>
                                <NavLink to={`/orders/${order?.orderId}`}>
                                    <button className="flex items-center gap-2 text-sm font-black text-gray-800 bg-white border-2 border-gray-100 px-6 py-2.5 rounded-2xl hover:border-organic-green hover:text-organic-green transition-all shadow-sm active:scale-95">
                                        <Eye size={18}/> VIEW DETAILS
                                    </button>
                                </NavLink>
                            </div>
                        </div>

                    </div>
                ))}
                
                {orders?.length === 0 && (
                    <div className="text-center py-20 bg-white w-full rounded-3xl border-2 border-dashed border-gray-100">
                        <Package size={48} className="mx-auto text-gray-200 mb-4"/>
                        <h3 className="text-xl font-bold text-gray-400">No orders found</h3>
                        <NavLink to="/" className="text-organic-green font-bold text-sm mt-4 inline-block hover:underline">Start shopping fresh today</NavLink>
                    </div>
                )}
            </div>
        </div>
    </section>)
}

export default Orders
