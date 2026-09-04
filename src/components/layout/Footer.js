"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CiCircleRemove, CiTextAlignLeft, CiSearch } from "react-icons/ci";
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from "../../app/contexts/LanguageContext";

export default function Footer() {
  const router = useRouter();
  const { locale } = useLanguage();
  const [isOpen, setIsOpen]   = useState(false);
  const [isOpen2, setIsOpen2] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [isHome, setIsHome] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    setIsHome(pathname === '/');
  }, [pathname]);

  const handleSearchSubmit = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsOpen2(false);
    }
  };

  const container = {
    hidden: { transition: { staggerChildren: 0.15, staggerDirection: -1 } },
    show: { transition: { staggerChildren: 0.15, staggerDirection: 1 } },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: 20, transition: { duration: 0.3 } },
  };

  return (
    <motion.footer
      layout
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className="text-white p-4 fixed w-full bottom-0 flex justify-center z-[99999] pointer-events-none"
    >
      <motion.div
        layout
        className="flex items-center gap-2 pointer-events-auto"
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
      >
        <motion.button
          layout
          className="cursor-pointer inline-flex items-center bg-[#222222] md:px-3 sm:px-2 md:py-2 sm:py-[6.5px] rounded-sm shadow-lg hover:bg-[#47221C] transition-colors"
          onClick={() => {
            setIsOpen(!isOpen);
            setIsOpen2(false);
          }}
          whileTap={{ scale: 0.95 }}
        >
          {isOpen ? <CiCircleRemove size={20} /> : <CiTextAlignLeft size={20} />}
        </motion.button>

        <AnimatePresence mode="popLayout">
          {isOpen && (
            <motion.div
              layout
              variants={container}
              initial="hidden"
              animate="show"
              exit="exit" 
              className="flex items-center gap-2"
            >
              {/* 1. Home */}
              <motion.button
                onClick={() => { router.push('/'); setIsOpen(false); }}
                layout
                className="inline-flex bg-[#222222] md:px-3 sm:px-2 py-2 rounded-sm md:text-[16px] sm:text-[12px] shadow-md hover:bg-[#47221C] transition-colors"
                variants={item}
              >
                {locale === "fa" ? "خانه" : "Home"}
              </motion.button>

              {/* 2. Shop */}
              <motion.button
                onClick={() => { router.push('/shop'); setIsOpen(false); }}
                layout
                className="inline-flex bg-[#222222] md:px-3 sm:px-2 py-2 rounded-sm md:text-[16px] sm:text-[12px] shadow-md hover:bg-[#47221C] transition-colors"
                variants={item}
              >
                {locale === "fa" ? "فروشگاه" : "Shop"}
              </motion.button>

              {/* 3. Contact Us / Communication */}
              <motion.button
                onClick={() => { router.push('/contactUs'); setIsOpen(false); }}
                layout
                className="inline-flex bg-[#222222] md:px-3 sm:px-2 py-2 rounded-sm md:text-[16px] sm:text-[12px] shadow-md hover:bg-[#47221C] transition-colors"
                variants={item}
              >
                {locale === "fa" ? "ارتباط با ما" : "Contact Us"}
              </motion.button>

              {/* 4. Cart */}
              <motion.button
                onClick={() => { router.push('/basket'); setIsOpen(false); }}
                layout
                className="inline-flex bg-[#47221C] md:px-3 sm:px-2 py-2 rounded-sm md:text-[16px] sm:text-[12px] shadow-md hover:bg-[#341813] transition-colors"
                variants={item}
              >
                {locale === "fa" ? "سبد خرید" : "Cart"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {isHome && (
          <motion.button
            layout
            className="cursor-pointer inline-flex items-center bg-[#222222] px-3 py-2 rounded-sm shadow-lg hover:bg-[#47221C] transition-colors"
            onClick={() => {
              setIsOpen2(!isOpen2);
              setIsOpen(false);
            }}
            whileTap={{ scale: 0.95 }}
          >
            {isOpen2 ? <CiCircleRemove size={20} /> : <CiSearch size={20} />}
          </motion.button>
        )}

        <AnimatePresence mode="popLayout">
          {isOpen2 && (
            <motion.div
              layout
              variants={container}
              initial="hidden"
              animate="show"
              exit="exit" 
              className="flex items-center"
            >
              <motion.div
                layout
                className="inline-flex bg-[#222222] px-3 py-2 rounded-sm shadow-md"
                variants={item}
              >
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchSubmit}
                  className="bg-transparent outline-none text-white placeholder-gray-400 text-sm w-44"
                  placeholder={locale === "fa" ? "نام محصول را وارد کنید.." : "Search products..."}
                  autoFocus
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.footer>
  );
}
