import { useContext, useEffect, useState } from "react";
import { BsCart3 } from "react-icons/bs";
import { IoMdClose, IoMdMenu } from "react-icons/io";
import { NavLink } from 'react-router-dom';
import { CartProductContext } from "../../services/context";
import { useLanguage } from "../../services/LanguageContext";
import Cart from "../Cart/cart";
import { SearchBar } from "./components/SearchBar";
import "./navbar.css";
import NavbarSkeleton from "./NavbarSkeleton.jsx";

export const NavBar = () => {
    const [menu, setMenu] = useState(false);
    const { cartItems, items, setItems, checkAuth, cmenu, setCmenu, loadinguser } = useContext(CartProductContext);
    const { language, setLanguage, t } = useLanguage();

    useEffect(() => {
        let total = 0;
        for (let i = 0; i < cartItems.length; i++) {
            total += cartItems[i].quantity;
        }
        setItems(total);
    }, [cartItems, setItems]);

    const handleMenu = () => {
        setMenu(false);
        setCmenu(false);
    };

    const Icon = menu ? IoMdClose : IoMdMenu;
    const handleCartMenu = () => {
        setCmenu(true);
    };

    return (
        <div className="navbar z-[50] fixed top-0 items-center right-0 left-0 flex justify-center shadow-md backdrop-blur-lg px-6 py-3" style={{ backgroundColor: "rgba(255, 255, 255, 0.9)" }}>
            {loadinguser ? (
                <NavbarSkeleton />
            ) : (
                <nav className="navbar-section flex justify-between items-center w-full max-w-[1280px] gap-4">
                    <div className="logo flex items-center shrink-0">
                        <NavLink to="/">
                            <div className="font-semibold">
                                <img className="w-[140px]" src="/logo.png" alt="Apna-Bazaar Farm Fresh" />
                            </div>
                        </NavLink>
                    </div>
                    <ul className={`options flex gap-6 justify-center cursor-pointer text-[16px] font-semibold text-gray-700`}>
                        <NavLink className="link [&.active]:text-organic-green hover:text-organic-green transition-all" onClick={handleMenu} to="/"><li>{t('nav.home')}</li></NavLink>
                        <NavLink className="link [&.active]:text-organic-green hover:text-organic-green transition-all" onClick={handleMenu} to="/categories"><li>{t('nav.categories')}</li></NavLink>
                        <NavLink className="link [&.active]:text-organic-green hover:text-organic-green transition-all" onClick={handleMenu} to="/vendor/form"><li>{t('nav.farmerHub')}</li></NavLink>
                        <NavLink className="link [&.active]:text-organic-green hover:text-organic-green transition-all" onClick={handleMenu} to="/about"><li>{t('nav.about')}</li></NavLink>
                    </ul>
                    <ul className={`mobile-options hidden flex-col items-center text-[20px] gap-[14px] justify-between cursor-pointer overflow-hidden duration-300 ease-linear tarnsition-all ${(menu) ? "h-[135px]" : "h-0"}`}>
                        <NavLink className="link [&.active>li]:font-bold" onClick={handleMenu} to="/"><li>Home</li></NavLink>
                        <NavLink className="link [&.active>li]:font-bold" onClick={handleMenu} to="/categories"><li>Categories</li></NavLink>
                        <NavLink className="link [&.active>li]:font-bold" onClick={handleMenu} to="/about"><li>About</li></NavLink>
                        <NavLink className="link [&.active>li]:font-bold" onClick={handleMenu} to="/contact"><li>Contact</li></NavLink>
                    </ul>
                    <SearchBar />
                    <div className="icons flex gap-4 items-center shrink-0">
                        {checkAuth ? (
                            <div className="flex gap-4 items-center">
                                <div className="flex bg-gray-100 p-1 rounded-full border border-gray-200 mr-2">
                                    <button
                                        onClick={() => setLanguage('en')}
                                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${language === 'en' ? 'bg-white text-organic-green shadow-sm' : 'text-gray-500 hover:text-organic-green'}`}
                                    >
                                        EN
                                    </button>
                                    <button
                                        onClick={() => setLanguage('hi')}
                                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${language === 'hi' ? 'bg-white text-organic-green shadow-sm' : 'text-gray-500 hover:text-organic-green'}`}
                                    >
                                        हिन्दी
                                    </button>
                                </div>
                                <NavLink to="/profile">
                                    <div className="w-[36px] h-[36px] relative rounded-full group">
                                        <img className="cursor-pointer w-[36px] h-[36px] rounded-full object-cover" src="/profile.jpg" alt="" />
                                        <div className="absolute top-[45px] left-1/2 -translate-x-1/2 w-fit hidden bg-black/80 backdrop-blur-sm group-hover:block px-2 py-1 rounded shadow-lg">
                                            <p className="text-white text-[10px] whitespace-nowrap">{t('nav.profile')}</p>
                                        </div>
                                    </div>
                                </NavLink>
                                <button
                                    onClick={async () => {
                                        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
                                        await fetch(`${backendUrl}/api/user/logout`, { credentials: "include" });
                                        window.location.href = "/";
                                    }}
                                    className="px-4 py-1.5 bg-red-500 text-white rounded-full text-[12px] font-bold hover:bg-red-600 transition-all shadow-sm"
                                >
                                    {t('nav.logout')}
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-3 items-center">
                            <div className="flex bg-gray-100 p-1 rounded-full border border-gray-200">
                                <button
                                    onClick={() => setLanguage('en')}
                                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${language === 'en' ? 'bg-white text-organic-green shadow-sm' : 'text-gray-500 hover:text-organic-green'}`}
                                >
                                    EN
                                </button>
                                <button
                                    onClick={() => setLanguage('hi')}
                                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${language === 'hi' ? 'bg-white text-organic-green shadow-sm' : 'text-gray-500 hover:text-organic-green'}`}
                                >
                                    हिन्दी
                                </button>
                            </div>
                                <NavLink to="/signin">
                                    <button className={`px-4 py-1.5 border-organic-green/30 border-[1.5px] text-organic-green rounded-full text-[13px] font-bold hover:bg-organic-green hover:text-white transition-all ${checkAuth && loadinguser ? "hidden" : "block"}`}>{t('nav.login')}</button>
                                </NavLink>
                                <NavLink to="/signup">
                                    <button className={`px-5 py-1.5 bg-organic-green text-white rounded-full text-[13px] font-bold hover:bg-organic-green-dark shadow-sm hover:shadow-md transition-all ${checkAuth && loadinguser ? "hidden" : "block"}`}>{t('nav.signup')}</button>
                                </NavLink>
                            </div>
                        )}
                        <div onClick={handleCartMenu} className="relative flex items-center justify-center p-2 hover:bg-gray-100 rounded-full transition-all cursor-pointer">
                            <BsCart3 className="cart-icon text-[22px] text-gray-700" />
                            {cartItems.length !== 0 ? (
                                <div className="min-w-[18px] h-[18px] rounded-full bg-red-600 flex justify-center items-center p-[3px] absolute top-0 right-0 border-2 border-white">
                                    <p className="text-white text-[9px] font-bold">{items}</p>
                                </div>
                            ) : ""}
                        </div>
                        <Icon onClick={() => setMenu(!menu)} className="menu-icon hidden text-2xl font-medium" />
                    </div>
                    <div className={`absolute top-0 right-0 duration-300 ease-linear transition-transform ${cmenu ? "translate-x-0" : "translate-x-[100%]"}`}>
                        <Cart cmenu={cmenu} setCmenu={setCmenu} />
                    </div>
                </nav>
            )}
        </div>
    );
};
