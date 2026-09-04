"use client";
import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { BiRightArrowAlt } from "react-icons/bi";
import { useLanguage } from "../../app/contexts/LanguageContext";
import { useRouter } from "next/navigation";

/**
 * BoxWithLocalDrag
 *
 * Receives a `subcategory` node from the catalog-tree API:
 * {
 *   type: "category",
 *   id, name, slug,
 *   children: [ ...products | ...subCategories ]
 * }
 *
 * Extracts products from the subcategory (direct children of type "product",
 * plus any products nested one more level down).
 */

// ─── Flatten all product nodes from a subtree ────────────────────────────────
function extractProducts(node) {
  const results = [];
  if (!node.children) return results;
  for (const child of node.children) {
    if (child.type === "product") {
      results.push(child);
    } else if (child.type === "category" && child.children) {
      // one more level
      for (const grandchild of child.children) {
        if (grandchild.type === "product") results.push(grandchild);
      }
    }
  }
  return results;
}

export default function BoxWithLocalDrag({
  subcategory,
  boxIndex,
  boxVariant,
  imageVariant,
  textVariant,
}) {
  const router = useRouter();
  const { locale } = useLanguage();

  const products = extractProducts(subcategory);

  const [hoveredIndex, setHoveredIndex]   = useState(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [currentIndexX, setCurrentIndexX] = useState(0);
  const [dragX, setDragX]                 = useState(0);
  const startXRef    = useRef(null);
  const isDraggingX  = useRef(false);
  const thresholdX   = 80;

  const handleDragStartX = (clientX) => {
    startXRef.current    = clientX;
    isDraggingX.current  = true;
  };

  const handleDragMoveX = (clientX) => {
    if (!isDraggingX.current) return;
    setDragX((clientX - startXRef.current) * 0.6);
  };

  const handleDragEndX = () => {
    if (!isDraggingX.current) return;
    isDraggingX.current = false;

    if (dragX < -thresholdX && currentIndexX < products.length - 1) {
      setCurrentIndexX(prev => prev + 1);
    } else if (dragX > thresholdX && currentIndexX > 0) {
      setCurrentIndexX(prev => prev - 1);
    }

    setDragX(0);
    startXRef.current = null;
  };

  const onTouchStartX = (e) => handleDragStartX(e.touches[0].clientX);
  const onTouchMoveX  = (e) => handleDragMoveX(e.touches[0].clientX);
  const onMouseDownX  = (e) => { e.preventDefault(); handleDragStartX(e.clientX); };
  const onMouseMoveX  = (e) => { if (!isDraggingX.current) return; e.preventDefault(); handleDragMoveX(e.clientX); };

  const imageVariant2 = {
    hidden:  { x: -1000, y: 0, opacity: 0 },
    visible: (i) => ({
      opacity: 1, x: 1, y: 0,
      transition: { delay: i * 0.5, duration: 2, ease: "easeOut" },
    }),
  };

  const subcatName = locale === "fa"
    ? (subcategory.name?.fa || subcategory.name?.en || "")
    : (subcategory.name?.en || "");

  if (!products.length) return null;

  return (
    <motion.div
      custom={boxIndex}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={boxVariant}
      className="flex flex-col items-center relative"
      onMouseEnter={() => setHoveredIndex(boxIndex)}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {/* ─── Drag slider ──────────────────────────────────────────────────── */}
      <motion.div className="relative w-full h-64 overflow-hidden rounded-lg bg-white/70 backdrop-blur-sm border border-gray-300 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer">
        <div
          style={{ width: "100%", overflow: "hidden", touchAction: "none", userSelect: "none" }}
          onTouchStart={onTouchStartX}
          onTouchMove={onTouchMoveX}
          onTouchEnd={handleDragEndX}
          onMouseDown={onMouseDownX}
          onMouseMove={onMouseMoveX}
          onMouseUp={handleDragEndX}
          onMouseLeave={handleDragEndX}
        >
          <motion.div
            style={{ display: "flex", cursor: "grab" }}
            animate={{ x: -currentIndexX * containerWidth + dragX }}
            transition={{ type: "spring", stiffness: 80, damping: 50, mass: 1 }}
          >
            {products.map((product, i) => {
              const imgUrl =
                product.images?.find(img => img.isPrimary)?.url ||
                product.images?.[0]?.url ||
                "";

              return (
                <motion.div
                  key={product.id || i}
                  ref={(el) => { if (el && i === 0) setContainerWidth(el.offsetWidth); }}
                  style={{ minWidth: "100%" }}
                  className="flex items-center justify-center relative"
                  variants={imageVariant}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                >
                  <img
                    src={imgUrl}
                    alt={product.name?.fa || product.name?.en || `slide-${i}`}
                    draggable={false}
                    className="pointer-events-none h-64 md:w-[55%] sm:w-[70%] object-contain"
                  />

                  {/* Product name — bottom left */}
                  <motion.p
                    variants={imageVariant2}
                    dir={locale === "fa" ? "rtl" : "ltr"}
                    className="absolute left-2 bottom-5 md:text-[13px] sm:text-[11px] font-light text-gray-600 p-1 rounded-sm border border-gray-300 max-w-[70%] line-clamp-1"
                  >
                    {locale === "fa" ? (product.name?.fa || "") : (product.name?.en || "")}
                  </motion.p>

                  {/* Price — top left */}
                  {product.basePrice > 0 && (
                    <motion.p
                      dir="ltr"
                      variants={imageVariant2}
                      className="absolute left-2 top-2.5 md:text-[13px] sm:text-[11px] font-light text-gray-600 p-1 rounded-sm border border-gray-300"
                    >
                      {new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(product.basePrice)} {locale === "fa" ? "تومان" : "IRT"}
                    </motion.p>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Progress bar */}
        {products.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 h-1 bg-gray-200 rounded-full mx-2">
            <div
              className="h-1 bg-gray-600 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndexX + 1) / products.length) * 100}%` }}
            />
          </div>
        )}

        {/* Explore button */}
        <motion.button
          initial={{ opacity: 1, y: -43 }}
          animate={hoveredIndex === boxIndex ? { opacity: 1, y: 1 } : { opacity: 1, y: -43 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="absolute flex gap-[1px] top-2 right-2 text-white cursor-pointer"
          onClick={() => router.push(`/collection?slug=${subcategory.slug}`)}
        >
          <motion.p
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            className="text-white px-2 py-1 rounded-sm shadow text-[13px] bg-[#222222] inline-flex"
          >
            {locale === "fa" ? "مشاهده" : "explore"}
          </motion.p>
          <span className="text-white">
            <BiRightArrowAlt
              size={30}
              className="text-white px-[7px] h-[27px] rounded-sm shadow bg-[#222222] inline-flex"
            />
          </span>
        </motion.button>
      </motion.div>

      {/* ─── Info row ──────────────────────────────────────────────────────── */}
      <div className="w-full md:mt-4 sm:mt-2">
        <span className="inline-flex float-left">
          <motion.p
            variants={textVariant}
            className="md:text-[18px] sm:text-[15px] font-light text-gray-600 text-left"
          >
            {subcatName}
          </motion.p>
        </span>
        <span className="inline-flex float-right">
          <motion.p
            dir={locale === "fa" ? "rtl" : "ltr"}
            variants={textVariant}
            className="md:text-[18px] sm:text-[15px] font-light text-gray-600 text-right inline-flex float-right"
          >
            {products.length}&nbsp;{locale === "fa" ? "محصول" : "products"}
          </motion.p>
        </span>
      </div>
    </motion.div>
  );
}
