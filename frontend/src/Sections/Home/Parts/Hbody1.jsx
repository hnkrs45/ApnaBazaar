import "../home.css"
import HeroSkeleton from "../Skeleton/hbody"
import { LuClock3 } from "react-icons/lu";
import { IoShieldCheckmarkOutline } from "react-icons/io5";
import { CiDeliveryTruck } from "react-icons/ci";
import { FaArrowRight } from "react-icons/fa6";
import { NavLink } from "react-router-dom"
import { useContext } from "react";
import { CartProductContext } from "../../../services/context";
import { useLanguage } from "../../../services/LanguageContext";

export const Hbody1 = () => {
  const {user, loadinguser} = useContext(CartProductContext)
  const { t } = useLanguage();

  const handleScroll = () => {
    const productsSection = document.getElementById("feature-products");
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: "smooth" });
    }
  }
  return (
    <div className="home-hero bg-gradient-to-b from-organic-green/5 to-white flex justify-center pt-[120px] pb-16 px-6">
      <div className="hero w-full max-w-7xl flex justify-between gap-12 items-center">
        {loadinguser ? (
          <HeroSkeleton />
        ) : (
            <>
          <div className="hero-top-seciton">
            <div className="hero-text hero-section-text text-[42px] text-[#070616]">
              <div>{t('hero.title')}</div>
              <div>{t('hero.subtitle')}</div>
            </div>
            <div className="hero-text text-[20px] mt-6 text-neutral-500 font-xl">
              {t('hero.description')}
            </div>
            <div className="home-buttons-div flex gap-4 mt-5">
              <div onClick={handleScroll} className="cursor-pointer shopnow-btn h-[45px] w-fit min-w-[160px] bg-organic-green text-white font-bold flex justify-center gap-3 px-6 items-center rounded-full text-[14px] shadow-lg hover:bg-organic-green-dark transition-all">
                {t('hero.browse')}
                <FaArrowRight/>
              </div>

              {user?.role==="vendor" && user?.vendor?.status==="Active" ? <NavLink to="/vendor/dashboard"><div className="cursor-pointer vendor-btn h-[45px] w-[180px] border-organic-green border-[2px] bg-white text-organic-green font-bold flex justify-center items-center rounded-full text-[14px] hover:bg-organic-green/5 transition-all">
                {t('hero.vendorDashboard')}
              </div></NavLink> :<NavLink to="/vendor/form"><div className="cursor-pointer vendor-btn h-[45px] w-[200px] border-organic-green border-[2px] bg-white text-organic-green font-bold flex justify-center items-center rounded-full text-[14px] hover:bg-organic-green/5 transition-all">
                {t('hero.startSelling')}
              </div></NavLink>}
            </div>

            <div className="hero-text quality-btns h-[98px] flex justify-between px-10 pt-10 border-t border-gray-100 mt-10">
              <div className="flex flex-col items-center">
                <div className="h-[48px] w-[48px] bg-organic-green/10 text-organic-green flex justify-center items-center rounded-full mb-2">
                  <CiDeliveryTruck size={24}/>
                </div>
                <div className="text-[13px] font-bold text-gray-700">{t('hero.delivery')}</div>
              </div>

              <div className="flex flex-col items-center">
                <div className="h-[48px] w-[48px] bg-organic-green/10 text-organic-green flex justify-center items-center rounded-full mb-2">
                  <IoShieldCheckmarkOutline size={22}/>
                </div>
                <div className="text-[13px] font-bold text-gray-700">{t('hero.quality')}</div>
              </div>

              <div className="flex flex-col items-center">
                <div className="h-[48px] w-[48px] bg-organic-green/10 text-organic-green flex justify-center items-center rounded-full mb-2">
                  <LuClock3 size={20}/>
                </div>
                <div className="text-[13px] font-bold text-gray-700">{t('hero.fresh')}</div>
              </div>
            </div>
          </div>
          <div>
            <div className="fruitimg-right ml-[400px] flex justify-center translate-x-6 translate-y-12 h-[76px] items-center bg-white w-[126px] rounded-2xl shadow-lg">
              <div>
                <div className="text-[21px] justify-center flex">10K+</div>
                <div className="text-[12.25px] text-[#717182] ">
                  {t('hero.happyCustomers')}
                </div>
              </div>
            </div>
            <img
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=600&fit=crop"
              className="hero-text w-[532px] h-[399px] object-cover rounded-xl"
            />
            <div className="fruitimg-left h-[76px] w-[105px] bg-white rounded-2xl shadow-lg flex justify-center items-center -translate-x-6 -translate-y-12 ">
              <div>
                <div className="text-[21px] justify-center flex">500+</div>
                <div className="text-[12.25px] text-[#717182] ">
                  {t('hero.localVendors')}
                </div>
              </div>
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  )
}