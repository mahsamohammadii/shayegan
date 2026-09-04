"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BiRightArrowAlt } from "react-icons/bi";
import { CiSearch, CiFilter } from "react-icons/ci";
import { HiChevronDown, HiChevronUp } from "react-icons/hi2";
import { IoClose } from "react-icons/io5";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../app/contexts/LanguageContext";
import Footer2 from "../layout/Footer2";
import { getProducts, getMinPrice, getCategories } from "../../lib/api/products";

const LIMIT     = 12;
const PRICE_MIN = 10_000_000;
const PRICE_MAX = 1_000_000_000;

function formatPrice(val, locale) {
  const millions = val / 1_000_000;
  if (locale === "fa") {
    return new Intl.NumberFormat("fa-IR").format(millions) + " میلیون";
  }
  return millions.toLocaleString() + "M";
}

// ─── Animation variants ────────────────────────────────────────────────────────
const containerVar = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const wordVar  = { hidden: { y: 100, opacity: 1 }, show: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } } };
const fadeUp   = { hidden: { opacity: 0, y: 24 },  show:  { opacity: 1, y: 0,  transition: { duration: 0.5, ease: "easeOut" } } };
const boxVar   = { hidden: { opacity: 0, y: 40 }, visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.5, ease: "easeOut" } }) };
const imgVar   = { hidden: { scale: 0.8, opacity: 0 }, visible: (i) => ({ scale: 1, opacity: 1, transition: { delay: i * 0.06, duration: 0.45, ease: "easeOut" } }) };
const labelVar = { hidden: { x: -40, opacity: 0 }, visible: (i) => ({ x: 0, opacity: 1, transition: { delay: i * 0.4, duration: 1.2, ease: "easeOut" } }) };

// ─── Dual Price Slider ─────────────────────────────────────────────────────────
function DualSlider({ minVal, maxVal, onMinChange, onMaxChange, locale }) {
  const minPercent = ((minVal - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  const maxPercent = ((maxVal - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  const STEP = 5_000_000;

  return (
    <div className="w-full px-1" dir="ltr">
      <style>{`
        .shop-range {
          -webkit-appearance: none;
          appearance: none;
          position: absolute;
          width: 100%;
          height: 0;
          background: transparent;
          outline: none;
          pointer-events: none;
        }
        .shop-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          border: 3px solid #786548;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          cursor: pointer;
          pointer-events: all;
          margin-top: -8px;
        }
        .shop-range::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          border: 3px solid #786548;
          cursor: pointer;
          pointer-events: all;
        }
      `}</style>

      {/* Track */}
      <div className="relative h-2 bg-gray-200 rounded-full w-full my-4">
        <div
          className="absolute h-full bg-[#786548] rounded-full"
          style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
        />
      </div>

      {/* Inputs */}
      <div className="relative" style={{ height: 0 }}>
        <input
          type="range"
          className="shop-range"
          style={{ top: "-16px", zIndex: minVal > PRICE_MAX - STEP * 2 ? 5 : 3 }}
          min={PRICE_MIN} max={PRICE_MAX} step={STEP}
          value={minVal}
          onChange={(e) => onMinChange(Math.min(Number(e.target.value), maxVal - STEP))}
        />
        <input
          type="range"
          className="shop-range"
          style={{ top: "-16px", zIndex: 4 }}
          min={PRICE_MIN} max={PRICE_MAX} step={STEP}
          value={maxVal}
          onChange={(e) => onMaxChange(Math.max(Number(e.target.value), minVal + STEP))}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-5 text-[11px] text-gray-600 font-semibold" dir="ltr">
        <span>{formatPrice(minVal, locale)}</span>
        <span>{formatPrice(maxVal, locale)}</span>
      </div>
    </div>
  );
}

// ─── Category Tree Filter ──────────────────────────────────────────────────────
function CategoryFilter({ categories, selectedCategoryId, onSelect, locale }) {
  const [expandedParents, setExpandedParents] = useState({});

  // Build hierarchy: roots and children map
  const roots    = categories.filter(c => !c.parentId);
  const childMap = {};
  categories.forEach(c => {
    if (c.parentId) {
      if (!childMap[c.parentId]) childMap[c.parentId] = [];
      childMap[c.parentId].push(c);
    }
  });

  const toggleParent = (id) =>
    setExpandedParents(prev => ({ ...prev, [id]: !prev[id] }));

  const getName = (cat) =>
    locale === "fa" ? (cat.name?.fa || cat.name?.en || "") : (cat.name?.en || cat.name?.fa || "");

  return (
    <div className="space-y-1">
      {/* All categories */}
      <button
        onClick={() => onSelect(null)}
        className={`w-full text-right px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
          !selectedCategoryId
            ? "bg-[#786548] text-white shadow-sm"
            : "text-gray-600 hover:bg-gray-50"
        }`}
      >
        {locale === "fa" ? "همه محصولات" : "All Products"}
      </button>

      {roots.map(root => {
        const children   = childMap[root._id] || [];
        const isExpanded = expandedParents[root._id];
        const isActive   = selectedCategoryId === root._id;
        const hasActive  = children.some(c => c._id === selectedCategoryId);

        return (
          <div key={root._id}>
            {/* Root category row */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => { onSelect(root._id); }}
                className={`flex-1 text-right px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                  isActive || hasActive
                    ? "text-[#786548] font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {getName(root)}
              </button>
              {children.length > 0 && (
                <button
                  onClick={() => toggleParent(root._id)}
                  className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  {isExpanded
                    ? <HiChevronUp size={14} />
                    : <HiChevronDown size={14} />}
                </button>
              )}
            </div>

            {/* Subcategories */}
            <AnimatePresence>
              {isExpanded && children.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className={`mr-4 border-r-2 border-gray-100 pr-2 mt-1 space-y-0.5 ${locale === "fa" ? "" : "ml-4 border-l-2 border-r-0 pl-2 pr-0"}`}>
                    {children.map(child => (
                      <button
                        key={child._id}
                        onClick={() => onSelect(child._id)}
                        className={`w-full text-right px-3 py-1.5 rounded-md text-[12px] transition-all duration-200 ${
                          selectedCategoryId === child._id
                            ? "bg-[#786548]/10 text-[#786548] font-semibold"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                        }`}
                      >
                        {getName(child)}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ─── Filter Panel ──────────────────────────────────────────────────────────────
function FilterPanel({ filters, setFilters, onApply, locale, totalProducts, categories, onClose }) {
  const [localQ,           setLocalQ]           = useState(filters.q            || "");
  const [localMinPrice,    setLocalMinPrice]    = useState(filters.minPrice      || PRICE_MIN);
  const [localMaxPrice,    setLocalMaxPrice]    = useState(filters.maxPrice      || PRICE_MAX);
  const [localInStock,     setLocalInStock]     = useState(filters.inStock       || false);
  const [localSortBy,      setLocalSortBy]      = useState(filters.sortBy        || "");
  const [localCategoryId,  setLocalCategoryId]  = useState(filters.categoryId   || null);

  const sortOptions = [
    { value: "",           label: locale === "fa" ? "پیش‌فرض"     : "Default" },
    { value: "price-asc",  label: locale === "fa" ? "ارزان‌ترین"  : "Price: Low → High" },
    { value: "price-desc", label: locale === "fa" ? "گران‌ترین"   : "Price: High → Low" },
    { value: "newest",     label: locale === "fa" ? "جدیدترین"    : "Newest" },
  ];

  const apply = () => {
    let sortBy = ""; let sortOrder = "asc";
    if (localSortBy === "price-asc")  { sortBy = "price";     sortOrder = "asc";  }
    if (localSortBy === "price-desc") { sortBy = "price";     sortOrder = "desc"; }
    if (localSortBy === "newest")     { sortBy = "createdAt"; sortOrder = "desc"; }

    const newFilters = {
      q:          localQ.trim()   || undefined,
      minPrice:   localMinPrice !== PRICE_MIN ? localMinPrice : undefined,
      maxPrice:   localMaxPrice !== PRICE_MAX ? localMaxPrice : undefined,
      inStock:    localInStock    ? "true"  : undefined,
      sortBy:     sortBy          || undefined,
      sortOrder:  sortBy          ? sortOrder : undefined,
      categoryId: localCategoryId || undefined,
    };

    setFilters(newFilters);
    onApply(newFilters);
    if (onClose) onClose();
  };

  const reset = () => {
    setLocalQ(""); setLocalMinPrice(PRICE_MIN); setLocalMaxPrice(PRICE_MAX);
    setLocalInStock(false); setLocalSortBy(""); setLocalCategoryId(null);
    setFilters({});
    onApply({});
    if (onClose) onClose();
  };

  const hasActiveFilters = localQ || localMinPrice !== PRICE_MIN || localMaxPrice !== PRICE_MAX
    || localInStock || localSortBy || localCategoryId;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden" dir={locale === "fa" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="bg-gradient-to-l from-[#0D1828] to-[#1e2f4a] px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CiFilter size={18} className="text-white" />
          <h3 className="text-white font-semibold text-[14px]">
            {locale === "fa" ? "فیلترها" : "Filters"}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              onClick={reset}
              className="text-[11px] text-white/80 hover:text-white border border-white/40 hover:border-white px-2 py-0.5 rounded-full transition-all"
            >
              {locale === "fa" ? "پاک کردن" : "Clear"}
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
              <IoClose size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Search */}
        <div>
          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2 block">
            {locale === "fa" ? "جستجو" : "Search"}
          </label>
          <div className="flex items-center border border-gray-200 rounded-xl px-3 gap-2 bg-gray-50 focus-within:border-[#786548] focus-within:bg-white transition-all">
            <CiSearch size={16} className="text-gray-400 shrink-0" />
            <input
              dir={locale === "fa" ? "rtl" : "ltr"}
              value={localQ}
              onChange={(e) => setLocalQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && apply()}
              placeholder={locale === "fa" ? "نام محصول..." : "Product name..."}
              className="w-full bg-transparent outline-none text-[13px] py-2.5 text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-gray-100" />

        {/* Price Range */}
        <div>
          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2 block">
            {locale === "fa" ? "محدوده قیمت" : "Price Range"}
          </label>
          <DualSlider
            minVal={localMinPrice}
            maxVal={localMaxPrice}
            onMinChange={setLocalMinPrice}
            onMaxChange={setLocalMaxPrice}
            locale={locale}
          />
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-gray-100" />

        {/* Categories */}
        {categories.length > 0 && (
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2 block">
              {locale === "fa" ? "دسته‌بندی" : "Category"}
            </label>
            <CategoryFilter
              categories={categories}
              selectedCategoryId={localCategoryId}
              onSelect={setLocalCategoryId}
              locale={locale}
            />
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-dashed border-gray-100" />

        {/* In Stock */}
        <div className="flex items-center justify-between">
          <label className="text-[13px] text-gray-700 font-medium">
            {locale === "fa" ? "فقط موجود" : "In stock only"}
          </label>
          <button
            onClick={() => setLocalInStock(v => !v)}
            className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${localInStock ? "bg-[#786548]" : "bg-gray-200"}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${localInStock ? (locale === "fa" ? "right-1" : "left-6") : (locale === "fa" ? "right-6" : "left-1")}`} />
          </button>
        </div>

        {/* Sort */}
        {/* <div>
          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2 block">
            {locale === "fa" ? "مرتب‌سازی" : "Sort by"}
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLocalSortBy(opt.value)}
                className={`px-2 py-2 rounded-xl text-[12px] border transition-all text-center ${
                  localSortBy === opt.value
                    ? "bg-[#0D1828] text-white border-[#0D1828]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#786548] hover:text-[#786548]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div> */}

        {/* Apply Button */}
        <button
          onClick={apply}
          className="w-full bg-[#47221C] text-white py-3 rounded-xl text-[14px] font-bold hover:bg-[#341813] transition-all shadow-md flex items-center justify-center gap-2"
        >
          {locale === "fa" ? "اعمال فیلتر" : "Apply Filters"}
        </button>

        {totalProducts > 0 && (
          <p className="text-center text-[12px] text-gray-400 font-mono">
            {new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en").format(totalProducts)}{" "}
            {locale === "fa" ? "محصول یافت شد" : "products found"}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ product, index, locale, router }) {
  const images   = product.images?.length ? product.images : [];
  const [cur, setCur]       = useState(0);
  const [dragX, setDragX]   = useState(0);
  const [hovered, setHovered] = useState(false);
  const [w, setW]           = useState(0);
  const startX  = useRef(null);
  const dragging = useRef(false);
  const threshold = 80;

  const start = (x) => { startX.current = x; dragging.current = true; };
  const move  = (x) => { if (!dragging.current) return; setDragX((x - startX.current) * 0.6); };
  const end   = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (dragX < -threshold && cur < images.length - 1) setCur(p => p + 1);
    else if (dragX > threshold && cur > 0)              setCur(p => p - 1);
    setDragX(0); startX.current = null;
  };

  const minPrice = getMinPrice(product);
  const name     = locale === "fa"
    ? (product.name?.fa || product.name?.en || "")
    : (product.name?.en || product.name?.fa || "");

  return (
    <motion.div
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={boxVar}
      className="flex flex-col relative group cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Slider */}
      <div className="relative w-full h-64 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-sm group-hover:shadow-md transition-shadow duration-300">
        <div
          style={{ width: "100%", overflow: "hidden", touchAction: "none", userSelect: "none" }}
          onTouchStart={(e) => start(e.touches[0].clientX)}
          onTouchMove={(e)  => move(e.touches[0].clientX)}
          onTouchEnd={end}
          onMouseDown={(e)  => { e.preventDefault(); start(e.clientX); }}
          onMouseMove={(e)  => { if (dragging.current) { e.preventDefault(); move(e.clientX); }}}
          onMouseUp={end}
          onMouseLeave={end}
        >
          <motion.div
            style={{ display: "flex", cursor: "grab" }}
            animate={{ x: -(cur * w) + dragX }}
            transition={{ type: "spring", stiffness: 80, damping: 50, mass: 1 }}
          >
            {images.length ? images.map((img, i) => (
              <motion.div
                key={i}
                ref={(el) => { if (el && i === 0) setW(el.offsetWidth); }}
                style={{ minWidth: "100%" }}
                className="flex items-center justify-center"
                variants={imgVar} custom={i} initial="hidden"
                whileInView="visible" viewport={{ once: true, amount: 0.2 }}
              >
                <img
                  src={img.url || img.thumbnailUrl || ""}
                  alt={name}
                  draggable={false}
                  className="pointer-events-none h-64 md:w-[55%] sm:w-[70%] object-contain"
                />
              </motion.div>
            )) : (
              <div style={{ minWidth: "100%" }} className="flex items-center justify-center h-64 text-gray-300 text-sm">
                {locale === "fa" ? "بدون تصویر" : "No image"}
              </div>
            )}
          </motion.div>
        </div>

        {/* Progress dots */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
            {images.map((_, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === cur ? "bg-[#786548] w-3" : "bg-gray-300"}`} />
            ))}
          </div>
        )}

        {/* Name label */}
        <motion.p
          variants={labelVar} custom={index} initial="hidden" whileInView="visible" viewport={{ once: true }}
          dir={locale === "fa" ? "rtl" : "ltr"}
          className="absolute left-2 bottom-5 text-[12px] font-light text-gray-700 px-2 py-[2px] rounded-md bg-white/90 border border-gray-200 max-w-[62%] line-clamp-1 backdrop-blur-sm"
        >
          {name}
        </motion.p>

        {/* Price label */}
        {minPrice > 0 && (
          <motion.p
            variants={labelVar} custom={index} initial="hidden" whileInView="visible" viewport={{ once: true }}
            dir="ltr"
            className="absolute left-2 top-2.5 text-[12px] font-light text-gray-700 px-2 py-[2px] rounded-md bg-white/90 border border-gray-200 backdrop-blur-sm"
          >
            {new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(minPrice)} {locale === "fa" ? "تومان" : "IRT"}
          </motion.p>
        )}

        {/* Explore button */}
        <motion.button
          initial={{ opacity: 0, y: -43 }}
          animate={hovered ? { opacity: 1, y: 1 } : { opacity: 0, y: -43 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="absolute flex gap-[1px] top-2 right-2 z-10"
          onClick={() => {
            const targetSlug = product.slug || product._id || product.id;
            if (targetSlug) router.push(`/product/${targetSlug}`);
          }}
        >
          <BiRightArrowAlt size={30} className="text-white px-[7px] h-[27px] rounded-md shadow bg-[#222222]" />
          <motion.p
            whileHover={{ scale: 1.05 }}
            className="text-white px-2 py-1 rounded-md shadow text-[13px] bg-[#222222] inline-flex font-bold"
          >
            {locale === "fa" ? "مشاهده" : "explore"}
          </motion.p>
        </motion.button>
      </div>

      {/* Info */}
      <div className="mt-3 flex justify-between items-center w-full px-1">
        {/* <p className="text-[13px] font-light text-gray-600 line-clamp-1 max-w-[70%]">{name}</p> */}
        {images.length > 1 && (
          <span className="text-[11px] text-gray-400">{cur + 1}/{images.length}</span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onPageChange, locale }) {
  const getPageNumbers = () => {
    const pages = [];
    const delta = 2;
    const left  = Math.max(1, page - delta);
    const right = Math.min(totalPages, page + delta);
    if (left > 1)          { pages.push(1); if (left > 2) pages.push("..."); }
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages) { if (right < totalPages - 1) pages.push("..."); pages.push(totalPages); }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1.5 mt-12 mb-4 flex-wrap">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="w-9 h-9 rounded-xl border border-gray-200 text-gray-500 hover:bg-[#786548]/10 hover:border-[#786548] hover:text-[#786548] disabled:opacity-30 transition-all text-sm flex items-center justify-center"
      >
        ‹
      </button>
      {getPageNumbers().map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-9 h-9 rounded-xl border text-sm transition-all font-medium ${
              p === page
                ? "bg-[#0D1828] text-white border-[#0D1828] shadow-md"
                : "border-gray-200 text-gray-600 hover:border-[#786548] hover:text-[#786548]"
            }`}
          >
            {locale === "fa" ? new Intl.NumberFormat("fa-IR").format(p) : p}
          </button>
        )
      )}
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="w-9 h-9 rounded-xl border border-gray-200 text-gray-500 hover:bg-[#786548]/10 hover:border-[#786548] hover:text-[#786548] disabled:opacity-30 transition-all text-sm flex items-center justify-center"
      >
        ›
      </button>
    </div>
  );
}

// ─── Main Shop ─────────────────────────────────────────────────────────────────
export default function Shop() {
  const { locale } = useLanguage();
  const router     = useRouter();
  const isRTL      = locale === "fa";

  const [filters,       setFilters]       = useState({});
  const [products,      setProducts]      = useState([]);
  const [meta,          setMeta]          = useState({ total: 0, totalPages: 1 });
  const [page,          setPage]          = useState(1);
  const [loading,       setLoading]       = useState(false);
  const [mobileFilter,  setMobileFilter]  = useState(false);
  const [categories,    setCategories]    = useState([]);

  const title      = isRTL ? "فروشگاه" : "Shop";
  const titleWords = title.split(" ");

  // Load categories once
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const load = useCallback((p, f) => {
    setLoading(true);
    getProducts({
      status:     "published",
      page:       p,
      limit:      LIMIT,
      q:          f.q,
      minPrice:   f.minPrice,
      maxPrice:   f.maxPrice,
      categoryId: f.categoryId,
      inStock:    f.inStock,
      sortBy:     f.sortBy,
      sortOrder:  f.sortOrder,
    })
      .then(({ products, meta }) => {
        setProducts(products);
        setMeta({ total: meta.total ?? 0, totalPages: meta.totalPages ?? 1 });
        window.scrollTo({ top: 0, behavior: "smooth" });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(1, {}); }, [load]);

  const handleApply      = (newFilters) => { setPage(1); load(1, newFilters || filters); };
  const handlePageChange = (p)          => { setPage(p); load(p, filters); };

  return (
    <div className="mt-24 min-h-screen" dir={isRTL ? "rtl" : "ltr"}>
      <div className="px-4 md:px-8 max-w-[1400px] mx-auto">

        {/* Hero heading */}
        <motion.h1
          variants={containerVar}
          initial="hidden"
          animate="show"
          className="md:text-7xl sm:text-3xl font-thin mb-2 flex flex-wrap"
        >
          {titleWords.map((word, idx) => (
            <span key={idx} className="overflow-hidden inline-block mb-2 text-[#0D1828] md:h-20 sm:h-9">
              <motion.span variants={wordVar} className={`${isRTL ? "md:ml-4 sm:ml-2" : "md:mr-4 sm:mr-2"} inline-block`}>{word}</motion.span>
            </span>
          ))}
        </motion.h1>

        <motion.p
          variants={fadeUp} initial="hidden" animate="show"
          className="text-[13px] text-gray-500 mb-6"
        >
          {isRTL
            ? "جستجو و فیلتر میان تمام محصولات شایگان دیزاین"
            : "Search and filter across all Shayegan Design products"}
        </motion.p>

        {/* Mobile filter button */}
        <div className="flex lg:hidden items-center gap-3 mb-5">
          <button
            onClick={() => setMobileFilter(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0D1828] text-white rounded-xl text-[13px] shadow-sm hover:bg-[#1e2f4a] transition-colors"
          >
            <CiFilter size={18} />
            {isRTL ? "فیلترها" : "Filters"}
            {Object.keys(filters).filter(k => filters[k]).length > 0 && (
              <span className="bg-[#786548] text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {Object.keys(filters).filter(k => filters[k]).length}
              </span>
            )}
          </button>
          <span className="text-[12px] text-gray-400">
            {new Intl.NumberFormat(isRTL ? "fa-IR" : "en").format(meta.total)}{" "}
            {isRTL ? "محصول" : "products"}
          </span>
        </div>

        {/* Mobile Filter Drawer */}
        <AnimatePresence>
          {mobileFilter && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                onClick={() => setMobileFilter(false)}
              />
              <motion.div
                initial={{ x: isRTL ? "100%" : "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: isRTL ? "100%" : "-100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className={`fixed top-0 ${isRTL ? "right-0" : "left-0"} h-full w-[85%] max-w-[360px] bg-white z-50 overflow-y-auto shadow-2xl`}
              >
                <FilterPanel
                  filters={filters}
                  setFilters={setFilters}
                  onApply={handleApply}
                  locale={locale}
                  totalProducts={meta.total}
                  categories={categories}
                  onClose={() => setMobileFilter(false)}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Desktop Layout: sidebar + products */}
        <div className="flex gap-6 items-start">

          {/* ─── Sidebar (right for RTL / left for LTR) — desktop only ─── */}
          <div className={`hidden lg:block w-[280px] shrink-0 sticky top-24 ${isRTL ? "order-2" : "order-1"}`}>
            <FilterPanel
              filters={filters}
              setFilters={setFilters}
              onApply={handleApply}
              locale={locale}
              totalProducts={meta.total}
              categories={categories}
            />
          </div>

          {/* ─── Products area ─── */}
          <div className={`flex-1 min-w-0 ${isRTL ? "order-1" : "order-2"}`}>

            {/* Result count — desktop */}
            <div className="hidden lg:flex items-center justify-between mb-5">
              <span className="text-[13px] text-gray-500 font-mono">
                {new Intl.NumberFormat(isRTL ? "fa-IR" : "en").format(meta.total)}{" "}
                {isRTL ? "محصول یافت شد" : "products found"}
              </span>
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loader"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex justify-center items-center h-64"
                >
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-2 border-[#786548]/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-[#786548] border-t-transparent animate-spin" />
                  </div>
                </motion.div>
              ) : products.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-64 text-gray-400 gap-4"
                >
                  <span className="text-6xl">🪑</span>
                  <p className="text-[15px]">{isRTL ? "محصولی یافت نشد" : "No products found"}</p>
                  <p className="text-[12px] text-gray-300">{isRTL ? "فیلترها را تغییر دهید" : "Try adjusting your filters"}</p>
                </motion.div>
              ) : (
                <motion.div
                  key={`pg-${page}`}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="grid sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
                >
                  {products.map((product, i) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      index={i}
                      locale={locale}
                      router={router}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {!loading && meta.totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={meta.totalPages}
                onPageChange={handlePageChange}
                locale={locale}
              />
            )}
          </div>
        </div>
      </div>

      <div className="mt-20">
        <Footer2 />
      </div>
    </div>
  );
}
