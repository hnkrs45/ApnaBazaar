import { useContext } from "react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { CartProductContext } from "../../../services/context";
import { useLanguage } from "../../../services/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { getlast7daysorders, getordersbycategory } from "../../../../API/api";

const Dashboard = ({handleLogout}) => {
  const { user, loadinguser } = useContext(CartProductContext);
  const { t } = useLanguage();

  const {data: ordersData} = useQuery({
    queryKey: ["last7days"],
    queryFn: getlast7daysorders,
    select: (res) => res?.data?.data || []
  })

  const {data: salesCategory, isLoading: loading} = useQuery({
    queryKey: ["salebycat"],
    queryFn: getordersbycategory,
    select: (res) => res?.data?.data || []
  })
  
  if (loadinguser || loading){
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50/50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-organic-green border-t-transparent mx-auto mb-4"></div>
        </div>
      </div>
    );
  }
  
  const COLORS = ['#22c55e', '#84cc16', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6'];

  return (
    <>
      <div className="p-6 md:p-10 space-y-8 bg-gray-50/50 min-h-screen w-full lg:pl-[280px]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-[32px] font-black text-gray-800">{t('vendorHub.dashboard')}</h1>
              <p className="text-gray-500 font-medium">Welcome back, {user?.vendor?.companyName || user?.name || "Farmer"}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="bg-white border border-gray-200 text-gray-600 hover:text-organic-green hover:border-organic-green hover:shadow-sm px-6 py-2.5 rounded-2xl transition-all font-bold text-sm">
                  {t('vendorHub.settings')}
              </button>
              <button onClick={handleLogout} className="bg-red-50 text-red-600 hover:bg-red-100 hover:shadow-sm px-6 py-2.5 rounded-2xl transition-all font-bold text-sm">
                  {t('nav.logout')}
              </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white shadow-sm border border-gray-100 rounded-3xl p-8 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-organic-green/10 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-2xl">📦</span>
              </div>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{t('vendorHub.totalOrders')}</h2>
              <p className="text-[40px] font-black text-gray-800 mt-1 leading-none">{user?.vendor?.totalOrders || 0}</p>
            </div>
            <div className="bg-white shadow-sm border border-gray-100 rounded-3xl p-8 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-organic-green/10 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-2xl">₹</span>
              </div>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{t('vendorHub.totalRevenue')}</h2>
              <p className="text-[40px] font-black text-organic-green-dark mt-1 leading-none">₹{user?.vendor?.totalRevenue?.toFixed(2) || "0.00"}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow-sm border border-gray-100 rounded-3xl p-8 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold text-gray-800 mb-6">{t('vendorHub.ordersLast7Days')}</h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ordersData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10}/>
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dx={-10}/>
                    <Tooltip cursor={{stroke: '#cbd5e1', strokeWidth: 1}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                    <Line type="monotone" dataKey="orders" stroke="#22c55e" strokeWidth={4} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6, stroke: '#fff', strokeWidth: 2}} />
                    </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white shadow-sm border border-gray-100 rounded-3xl p-8 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold text-gray-800 mb-6">{t('vendorHub.salesByCategory')}</h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie data={salesCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={2}>
                        {salesCategory?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                    <Legend iconType="circle" wrapperStyle={{fontSize: '14px', fontWeight: '500', color: '#64748b'}}/>
                    </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
        </div>
       </div>
    </>
  )
}

export default Dashboard