"use client"
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { CiShoppingCart } from "react-icons/ci";
import { CiLogin } from "react-icons/ci";
import { CiUser } from "react-icons/ci";
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from "../../app/contexts/LanguageContext"
import { useLogin } from "../../app/contexts/LoginContext"
import { useCart } from "../../app/contexts/CartContext"

export default function Header() {
    const router = useRouter();
    const { locale, toggleLanguage } = useLanguage();
    const { isLoggedIn } = useLogin();
    const { cartCount, cartItems, showCartHint } = useCart();

    const [manualTooltip, setManualTooltip] = useState(false);
    const tooltipTimeout = useRef(null);
    const cartBtnRef = useRef(null);

    // Show tooltip when cart is mutated externally (from Product page)
    const showCartTooltip = showCartHint || manualTooltip;

    const openManualTooltip = () => {
        if (!isLoggedIn || cartCount === 0) return;
        setManualTooltip(true);
        clearTimeout(tooltipTimeout.current);
        tooltipTimeout.current = setTimeout(() => setManualTooltip(false), 3000);
    };

    useEffect(() => () => clearTimeout(tooltipTimeout.current), []);

    return (
      <header dir="rtl" className="w-full px-2 fixed z-10 top-0 backdrop-blur-[8px] bg-[#36363500]">
          <div className="float-left flex">
              <div className="flex gap-1 mt-5">
                <button
                  onClick={() => toggleLanguage("fa")}
                  className={`px-2 py-1 h-[26px] text-sm rounded ${locale === "fa" ? "bg-[#36363500] shadow-md back-drop-blur-[2px] text-gray-800" : "bg-none text-gray-800"}`}
                >
                  fa
                </button>
                <button
                  onClick={() => toggleLanguage("en")}
                  className={`px-2 py-1 h-[26px] text-sm rounded ${locale === "en" ? "bg-[#36363500] shadow-md back-drop-blur-[2px] text-gray-800 text-gray-800" : "bg-none text-gray-800"}`}
                >
                  en
                </button>
              </div>
              <img src="/images/logo.png" className="h-16 w-auto"/>              
          </div>
          <div className="float-right mr-5 mt-2">

            {/* Cart button + tooltip */}
            <div className="relative inline-block" ref={cartBtnRef}>
              <button
                onClick={() => router.push('/basket')}
                onMouseEnter={openManualTooltip}
                className="px-1 py-1 mt-2 rounded-sm mx-1 cursor-pointer relative shadow-md back-drop-blur-[2px]"
              >
                <CiShoppingCart size={30} className="text-black font-bold"/>
                <span className="absolute top-1 right-0.5 rounded-full w-4 h-4 m-auto flex items-center justify-center bg-black text-white text-[8.5px]">
                  {isLoggedIn ? cartCount : 0}
                </span>
              </button>

              {/* Mini-cart tooltip */}
              <AnimatePresence>
                {showCartTooltip && isLoggedIn && cartCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    dir="rtl"
                    className="absolute -right-4 -translate-x-1/2 top-[calc(100%+8px)] w-64 bg-white border border-[#47221C30] rounded-2xl shadow-xl z-50 overflow-hidden"
                  >
                    {/* Arrow */}
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-[#47221C30] rotate-45" />

                    {/* Header */}
                    <div className="bg-gradient-to-l from-[#47221C] to-[#7a3929] px-4 py-2.5 flex items-center justify-between">
                      <span className="text-white text-[13px] font-bold">
                        {locale === "fa" ? "سبد خرید شما" : "Your Shopping Cart"}
                      </span>
                      <span className="bg-white/20 text-white text-[11px] font-mono px-2 py-0.5 rounded-full">
                        {cartCount} {locale === "fa" ? "کالا" : "items"}
                      </span>
                    </div>

                    {/* Items preview (max 3) */}
                    <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
                      {cartItems.slice(0, 3).map((item, i) => {
                        const imgUrl = item.product?.image || "/images/sandali.png";
                        const name = locale === "fa" 
                          ? (item.product?.name?.fa || item.product?.name?.en || item.name || "محصول") 
                          : (item.product?.name?.en || item.product?.name?.fa || item.name || "Product");
                        const price = item.unitPrice || item.price || 0;
                        return (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <img src={imgUrl} alt={name} className="w-9 h-9 object-contain rounded border bg-gray-50 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-800 truncate">{name}</p>
                              {price > 0 && (
                                <p className="text-gray-500 font-mono">
                                  {new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(price)} {locale === "fa" ? "تومان" : "IRT"}
                                </p>
                              )}
                            </div>
                            <span className="text-[#47221C] font-mono font-bold shrink-0">×{item.quantity}</span>
                          </div>
                        );
                      })}
                      {cartItems.length > 3 && (
                        <p className="text-center text-[11px] text-gray-400">
                          {locale === "fa" ? `و ${cartItems.length - 3} کالای دیگر...` : `and ${cartItems.length - 3} more items...`}
                        </p>
                      )}
                    </div>

                    {/* Go to basket */}
                    <div className="border-t border-gray-100 p-2">
                      <button
                        onClick={() => { setShowCartTooltip(false); router.push('/basket'); }}
                        className="w-full py-2 bg-[#47221C] text-white text-[12px] font-bold rounded-xl hover:bg-[#341813] transition-colors"
                      >
                        {locale === "fa" ? "مشاهده سبد خرید ←" : "View Shopping Cart →"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isLoggedIn ? (
              <button onClick={() => router.push('/user-panel')} className="px-1 py-1 mt-2 rounded-sm mx-1 cursor-pointer shadow-md back-drop-blur-[2px]">
                <CiUser size={30} className="text-black font-bold"/>
              </button>
            ) : (
              <button onClick={() => router.push('/login')} className="px-1 py-1 mt-2 rounded-sm mx-1 cursor-pointer shadow-md back-drop-blur-[2px]">
                <CiLogin size={30} className="text-black font-bold"/>
              </button>
            )}
            
          </div>
      </header>
    );
  }