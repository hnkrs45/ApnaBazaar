import { useLanguage } from "../../../services/LanguageContext";
import { FiUserPlus, FiShoppingBag } from "react-icons/fi";
import { Link } from "react-router-dom";

export const FarmerGuide = () => {
    const { language, setLanguage, t } = useLanguage();

    const steps = [
        { 
            icon: <FiUserPlus size={24}/>, 
            title: t('farmerGuide.step1.title'), 
            desc: t('farmerGuide.step1.desc'),
            link: "/vendor/form"
        },
        { 
            icon: <FiShoppingBag size={24}/>, 
            title: t('farmerGuide.step2.title'), 
            desc: t('farmerGuide.step2.desc'),
            link: "/vendor/dashboard?tab=products"
        },

    ];

    return (
        <div className="bg-organic-green py-16 px-6 flex justify-center text-white">
            <div className="w-full max-w-7xl">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                    <div className="text-center md:text-left">
                        <h2 className="text-[32px] font-bold mb-2">{t('farmerGuide.title')}</h2>
                        <p className="text-organic-green-light text-[18px] opacity-90">{t('farmerGuide.subtitle')}</p>
                    </div>
                    <div className="flex bg-white/10 p-1 rounded-full border border-white/20 backdrop-blur-md">
                        <button
                            onClick={() => setLanguage('en')}
                            className={`px-6 py-2 rounded-full text-[13px] font-bold transition-all ${language === 'en' ? 'bg-white text-organic-green shadow-lg' : 'text-white/60 hover:text-white'}`}
                        >
                            English
                        </button>
                        <button
                            onClick={() => setLanguage('hi')}
                            className={`px-6 py-2 rounded-full text-[13px] font-bold transition-all ${language === 'hi' ? 'bg-white text-organic-green shadow-lg' : 'text-white/60 hover:text-white'}`}
                        >
                            हिन्दी
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {steps.map((step, index) => (
                        <Link 
                            to={step.link} 
                            key={index} 
                            className="bg-white/10 backdrop-blur-sm border border-white/10 p-8 rounded-3xl hover:bg-white/20 transition-all group flex flex-col items-center md:items-start text-center md:text-left"
                        >
                            <div className="h-14 w-14 bg-white text-organic-green flex justify-center items-center rounded-2xl mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300">
                                {step.icon}
                            </div>
                            <h3 className="text-[24px] font-bold mb-3">{step.title}</h3>
                            <p className="text-[16px] text-white/80 leading-relaxed">{step.desc}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

