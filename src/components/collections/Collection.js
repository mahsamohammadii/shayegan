"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BiRightArrowAlt } from "react-icons/bi";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "../../app/contexts/LanguageContext";
import { useContent } from "../../app/contexts/ContentContext";
import Footer2 from "../layout/Footer2";
import { getProducts, getMinPrice } from "../../lib/api/products";

const LIMIT = 12;

// ─── Animation variants ───────────────────────────────────────────────────────
const containerVar = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const wordVar      = { hidden: { y: 100, opacity: 1 }, show: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } } };
const aboutVar     = { hidden: { y: 100, opacity: 0 }, show: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } } };
const boxVar       = { hidden: { opacity: 0, y: 50 }, visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.6, ease: "easeOut" } }) };
const imgVar       = { hidden: { scale: 0, opacity: 0 }, visible: (i) => ({ opacity: 1, scale: 1, transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" } }) };
const labelVar     = { hidden: { x: -60, opacity: 0 }, visible: (i) => ({ x: 0, opacity: 1, transition: { delay: i * 0.5, duration: 1.5, ease: "easeOut" } }) };

// ─── Single product card with horizontal drag ─────────────────────────────────
function ProductCard({ product, index, locale, router }) {
  const images = product.images?.length ? product.images : [];
  const [current,    setCurrent]    = useState(0);
  const [dragX,      setDragX]      = useState(0);
  const [hovered,    setHovered]    = useState(false);
  const [cardWidth,  setCardWidth]  = useState(0);
  const startX      = useRef(null);
  const dragging    = useRef(false);
  const threshold   = 80;

  const startDrag = (x) => { startX.current = x; dragging.current = true; };
  const moveDrag  = (x) => { if (!dragging.current) return; setDragX((x - startX.current) * 0.6); };
  const endDrag   = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (dragX < -threshold && current < images.length - 1) setCurrent(p => p + 1);
    else if (dragX > threshold && current > 0)              setCurrent(p => p - 1);
    setDragX(0);
    startX.current = null;
  };

  const minPrice = getMinPrice(product);
  const name     = locale === "fa" ? (product.name?.fa || product.name?.en || "") : (product.name?.en || product.name?.fa || "");

  return (
    <motion.div
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={boxVar}
      className="flex flex-col items-center relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image slider */}
      <motion.div className="relative w-full h-64 overflow-hidden rounded-lg bg-white/70 backdrop-blur-sm border border-gray-200 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer">
        <div
          style={{ width: "100%", overflow: "hidden", touchAction: "none", userSelect: "none" }}
          onTouchStart={(e) => startDrag(e.touches[0].clientX)}
          onTouchMove={(e)  => moveDrag(e.touches[0].clientX)}
          onTouchEnd={endDrag}
          onMouseDown={(e)  => { e.preventDefault(); startDrag(e.clientX); }}
          onMouseMove={(e)  => { if (dragging.current) { e.preventDefault(); moveDrag(e.clientX); }}}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
        >
          <motion.div
            style={{ display: "flex", cursor: "grab" }}
            animate={{ x: -(current * cardWidth) + dragX }}
            transition={{ type: "spring", stiffness: 80, damping: 50, mass: 1 }}
          >
            {images.length ? images.map((img, i) => (
              <motion.div
                key={i}
                ref={(el) => { if (el && i === 0) setCardWidth(el.offsetWidth); }}
                style={{ minWidth: "100%" }}
                className="flex items-center justify-center relative"
                variants={imgVar}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
              >
                <img
                  src={img.url || img.thumbnailUrl || ""}
                  alt={name || `slide-${i}`}
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

        {/* Progress bar */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 h-[3px] bg-gray-200 rounded-full mx-2">
            <div
              className="h-[3px] bg-[#786548] rounded-full transition-all duration-300"
              style={{ width: `${((current + 1) / images.length) * 100}%` }}
            />
          </div>
        )}

        {/* Product name label — bottom left */}
        <motion.p
          variants={labelVar}
          custom={index}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          dir={locale === "fa" ? "rtl" : "ltr"}
          className="absolute left-2 bottom-5 md:text-[13px] sm:text-[11px] font-light text-gray-700 px-2 py-[2px] rounded-sm bg-white/80 border border-gray-200 max-w-[60%] line-clamp-1"
        >
          {name}
        </motion.p>

        {/* Price — top left */}
        {minPrice > 0 && (
          <motion.p
            variants={labelVar}
            custom={index}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            dir="ltr"
            className="absolute left-2 top-2.5 md:text-[12px] sm:text-[11px] font-light text-gray-700 px-2 py-[2px] rounded-sm bg-white/80 border border-gray-200"
          >
            {new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(minPrice)} {locale === "fa" ? "تومان" : "IRT"}
          </motion.p>
        )}

        {/* Explore button — slides in on hover */}
        <motion.button
          initial={{ opacity: 0, y: -43 }}
          animate={hovered ? { opacity: 1, y: 1 } : { opacity: 0, y: -43 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="absolute flex gap-[1px] top-2 right-2 text-white cursor-pointer"
          onClick={() => {
            const targetSlug = product.slug || product._id || product.id;
            if (targetSlug) router.push(`/product/${targetSlug}`);
          }}
        >
          <motion.p
            whileHover={{ scale: 1.05 }}
            className="text-white px-2 py-1 rounded-sm shadow text-[13px] bg-[#222222] inline-flex"
          >
            {locale === "fa" ? "مشاهده" : "explore"}
          </motion.p>
          <span className="text-white">
            <BiRightArrowAlt size={30} className="text-white px-[7px] h-[27px] rounded-sm shadow bg-[#222222] inline-flex" />
          </span>
        </motion.button>
      </motion.div>

      {/* Info row */}
      <div className="w-full mt-3 flex justify-between items-start">
        <motion.p variants={aboutVar} className="md:text-[15px] sm:text-[13px] font-light text-gray-600 text-left line-clamp-1 max-w-[60%]">
          {name}
        </motion.p>
        {images.length > 1 && (
          <span className="md:text-[12px] sm:text-[11px] font-light text-gray-400">
            {current + 1}/{images.length}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Pagination controls ──────────────────────────────────────────────────────
function Pagination({ page, totalPages, onPageChange }) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-center gap-2 mt-10 mb-4">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="w-9 h-9 rounded-sm border border-gray-300 text-gray-600 hover:bg-[#F0BD92]/30 disabled:opacity-30 transition-all"
      >
        ‹
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-9 h-9 rounded-sm border text-sm transition-all ${
            p === page
              ? "bg-[#222222] text-white border-[#222222]"
              : "border-gray-300 text-gray-600 hover:bg-[#F0BD92]/30"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="w-9 h-9 rounded-sm border border-gray-300 text-gray-600 hover:bg-[#F0BD92]/30 disabled:opacity-30 transition-all"
      >
        ›
      </button>
    </div>
  );
}

// ─── Main Collection component ─────────────────────────────────────────────────
export default function Collection() {
  const { locale }   = useLanguage();
  const { getByKey } = useContent();
  const router       = useRouter();
  const searchParams = useSearchParams();

  const categoryId   = searchParams.get("category") || searchParams.get("slug") || undefined;
  const categoryName = searchParams.get("name")     || "";

  const [products,   setProducts]   = useState([]);
  const [meta,       setMeta]       = useState({ total: 0, totalPages: 1 });
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(false);
  const [collectionBody, setCollectionBody] = useState("");

  const title      = locale === "fa" ? "شایگان دیزاین" : "Shayegan Design";
  const titleWords = title.split(" ");

  useEffect(() => {
    const item = getByKey("collection");
    if (item) {
      const bodyText = typeof item.body === 'object' ? (item.body[locale] || item.body.fa || item.body.en || "") : (item.body || "");
      setCollectionBody(bodyText);
    }
  }, [getByKey, locale]);

  const loadPage = useCallback((p) => {
    setLoading(true);
    getProducts({ categoryId, status: "published", page: p, limit: LIMIT })
      .then(({ products, meta }) => {
        setProducts(products);
        setMeta({
          total:      meta.total      ?? 0,
          totalPages: meta.totalPages ?? 1,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [categoryId]);

  useEffect(() => { setPage(1); loadPage(1); }, [categoryId, loadPage]);

  const handlePageChange = (p) => { setPage(p); loadPage(p); };

  const displayName = categoryName
    ? categoryName
    : locale === "fa" ? "همه محصولات" : "All Products";

  return (
    <div className="mt-28 min-h-screen">
      <div className="px-4">
        {/* Hero heading */}
        <motion.h1
          dir={locale === "fa" ? "rtl" : "ltr"}
          variants={containerVar}
          initial="hidden"
          animate="show"
          className="md:text-7xl sm:text-3xl font-thin mb-4 flex flex-wrap"
        >
          {titleWords.map((word, idx) => (
            <span key={idx} className="overflow-hidden inline-block mb-2 text-[#0D1828] md:h-20 sm:h-9">
              <motion.span variants={wordVar} className="md:mr-4 sm:mr-2 inline-block">{word}</motion.span>
            </span>
          ))}
        </motion.h1>

        {/* Collection body subtitle from API */}
        {collectionBody && (
          <motion.div
            dir={locale === "fa" ? "rtl" : "ltr"}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="md:text-[16px] sm:text-[13px] text-gray-700 mb-6 leading-relaxed flex flex-col gap-2 w-full max-w-none"
            dangerouslySetInnerHTML={{ __html: collectionBody }}
          />
        )}

        {/* Collection title + filter button row */}
        <div className="flex items-center justify-between mt-8 mb-6">
          <motion.h2
            dir={locale === "fa" ? "rtl" : "ltr"}
            variants={aboutVar}
            initial="hidden"
            animate="show"
            className="font-bold md:text-[22px] sm:text-[17px] text-[#0D1828]"
          >
            {displayName}
          </motion.h2>
          <motion.span
            variants={aboutVar}
            initial="hidden"
            animate="show"
            className="md:text-[13px] sm:text-[11px] text-gray-400 font-light"
          >
            {meta.total} {locale === "fa" ? "محصول" : "products"}
          </motion.span>
        </div>

        {/* Product grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center items-center h-64"
            >
              <div className="w-8 h-8 rounded-full border-2 border-[#786548] border-t-transparent animate-spin" />
            </motion.div>
          ) : products.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3"
            >
              <span className="text-5xl">🪑</span>
              <p>{locale === "fa" ? "محصولی یافت نشد" : "No products found"}</p>
            </motion.div>
          ) : (
            <motion.div
              key={`page-${page}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-8"
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

        {/* Pagination */}
        {!loading && meta.totalPages > 1 && (
          <Pagination page={page} totalPages={meta.totalPages} onPageChange={handlePageChange} />
        )}
      </div>
      <Footer2 />
    </div>
  );
}
