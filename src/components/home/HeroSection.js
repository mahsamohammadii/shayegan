"use client"
import React, { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BiRightArrowAlt } from "react-icons/bi";
import { CiCircleRemove, CiTextAlignLeft, CiSearch } from "react-icons/ci";
import { useRouter } from 'next/navigation';
import { getProducts, pickRandomImage, getMinPrice, getCatalogTree } from "../../lib/api/products";
import BoxWithLocalDrag from "./BoxWithLocalDrag";
import { useLanguage } from "../../app/contexts/LanguageContext"
import { useMatn } from "../../app/contexts/MatnContext"
import { useContent } from "../../app/contexts/ContentContext";
import Footer2 from "../layout/Footer2";

export default function HeroSection() {
  return <PlateGallery2 />;
}

function PlateGallery2() {
  const router = useRouter();
  const { locale } = useLanguage();
  const { textaslifa } = useMatn();
  const { getByKey } = useContent();

  const containerRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [selectedid, setSelectedid] = useState(null);
  const [returningPlate, setReturningPlate] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [overview, setOverview] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [draggingStarted, setDraggingStarted] = useState(false);
  const [visiblePlates, setVisiblePlates] = useState({});

  const defaultHomeSubtitleFa = "<p>گرید مرتب — تولید و عرضهٔ مبلمان باکیفیت شایگان دیزاین.</p>";
  const defaultHomeSubtitleEn = "<p>Sorted Grid — Quality furniture by Shayegan Design.</p>";
  const [homeSubtitle, setHomeSubtitle] = useState(locale === "fa" ? defaultHomeSubtitleFa : defaultHomeSubtitleEn);

  const [sortedGrid, setSortedGrid] = useState([]);
  const [notsortedGrid, setNotsortedGrid] = useState([]);
  const [productImages, setProductImages] = useState({});

  useEffect(() => {
    // ─── Fetch sorted-grid content item for Home Page subtitle ─────────────
    const item = getByKey("sorted-grid");
    if (item) {
      const bodyText = typeof item.body === 'object' ? (item.body[locale] || item.body.fa || item.body.en || "") : (item.body || "");
      if (bodyText) setHomeSubtitle(bodyText);
    }

    // ─── Unsorted grid: published products ─────────────────────────────────────────────
    getProducts({ status: 'published', page: 1, limit: 50 })
      .then(({ products }) => {
        setNotsortedGrid(products);
        const imgMap = {};
        products.forEach(p => { imgMap[p._id] = pickRandomImage(p.images); });
        setProductImages(imgMap);
      })
      .catch(console.error);

    // ─── Sorted grid: catalog tree (category → subcategory → products) ─────────────
    getCatalogTree({ limit: 5 })
      .then(data => setSortedGrid(data))
      .catch(console.error);
  }, [locale, getByKey]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOverview(false);
      setInitialLoad(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const isDown = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const lerp = 0.12;
  let raf;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    current.current.x = container.scrollLeft;
    current.current.y = container.scrollTop;

    const loop = () => {
      current.current.x += (target.current.x - current.current.x) * lerp;
      current.current.y += (target.current.y - current.current.y) * lerp;

      container.scrollLeft = current.current.x;
      container.scrollTop = current.current.y;

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const content = container.firstElementChild;
    if (!content) return;

    const centerX = (content.offsetWidth - container.clientWidth) / 2;
    const centerY = (content.offsetHeight - container.clientHeight) / 2;

    current.current.x = centerX;
    current.current.y = centerY;
    target.current.x = centerX;
    target.current.y = centerY;

    container.scrollLeft = centerX;
    container.scrollTop = centerY;
  }, [notsortedGrid.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e) => {
      e.preventDefault();
      target.current.x += e.deltaX;
      target.current.y += e.deltaY;
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, []);

  const startDrag = (clientX, clientY) => {
    isDown.current = true;
    lastPos.current = { x: clientX, y: clientY };

    const container = containerRef.current;
    target.current.x = container.scrollLeft;
    target.current.y = container.scrollTop;
  };

  const moveDrag = (clientX, clientY) => {
    if (!isDown.current) return;

    const dx = clientX - lastPos.current.x;
    const dy = clientY - lastPos.current.y;

    target.current.x -= dx;
    target.current.y -= dy;

    velocity.current.x = dx;
    velocity.current.y = dy;

    lastPos.current = { x: clientX, y: clientY };
  };

  const endDrag = () => {
    isDown.current = false;

    const inertia = () => {
      velocity.current.x *= 0.92;
      velocity.current.y *= 0.92;

      target.current.x -= velocity.current.x;
      target.current.y -= velocity.current.y;

      if (Math.abs(velocity.current.x) > 0.5 || Math.abs(velocity.current.y) > 0.5) {
        requestAnimationFrame(inertia);
      }
    };

    requestAnimationFrame(inertia);
  };

  useEffect(() => {
    if (notsortedGrid.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute("data-id");
          if (entry.isIntersecting) {
            setVisiblePlates((prev) => ({ ...prev, [id]: true }));
          }
        });
      },
      { threshold: 0.3 }
    );

    const items = document.querySelectorAll(".plate-item");
    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [notsortedGrid]);

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  };
  const wordd = {
    hidden: { y: 100, opacity: 1 },
    show: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
  };
  const aboutustext = {
    hidden: { y: 100, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const [collectionImages, setCollectionImages] = useState([]);
  useEffect(() => {
    if (!selected) return;
    getProducts({ categoryId: selected.categoryId, page: 1, limit: 8 })
      .then(({ products }) => {
        const matched = products.filter(p => p._id === selected._id);
        const others  = products.filter(p => p._id !== selected._id);
        setCollectionImages([...matched, ...others]);
      })
      .catch(console.error);
  }, [selected]);

  const [isSorted, setIsSorted] = useState(false);
  const handleClick = () => {
    setIsSorted(!isSorted);
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragY, setDragY] = useState(0); 
  const startY2 = useRef(null);
  const isDragging2 = useRef(false);
  const threshold = 100;

  const handleDragStart = (clientY) => {
    startY2.current = clientY;
    isDragging2.current = true;
  };
  const handleDragMove = (clientY) => {
    if (!isDragging2.current) return;
    const diff = clientY - startY2.current;
    setDragY(diff);
  };
  const handleDragEnd = () => {
    if (!isDragging2.current) return;
    isDragging2.current = false;

    if (dragY < -threshold && currentIndex < collectionImages.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (dragY > threshold && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
    setDragY(0);
    startY2.current = null;
  };
  const onTouchStart = (e) => {
    handleDragStart(e.touches[0].clientY);
  };
  const onTouchMove = (e) => {
    handleDragMove(e.touches[0].clientY);
  };
  const onTouchEnd = () => {
    handleDragEnd();
  };
  const onMouseDown = (e) => {
    e.preventDefault();
    handleDragStart(e.clientY);
  };
  const onMouseMove = (e) => {
    if (!isDragging2.current) return;
    e.preventDefault();
    handleDragMove(e.clientY);
  };
  const onMouseUp = () => {
    handleDragEnd();
  };
  const onMouseLeave = () => {
    if (isDragging2.current) {
      handleDragEnd();
    }
  };

  const boxVariant = {
    hidden: { opacity: 0, y: 50 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.6, ease: "easeOut" },
    }),
  };
  const imageVariant = {
    hidden: { scale: 0, opacity: 1 },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
    }),
  };
  const textVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { delay: 1.4, duration: 0.6, ease: "easeOut" }},
  };
  const title = `${locale === "fa" ? "شایگان دیزاین" : "Shayegan Design"}`;
  const titleWords = title.split(" ");

  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });
  const handleMouseMove = (e, titleText) => {
    setTooltip({
      visible: true,
      x: e.pageX + 10,
      y: e.pageY + 45,
      text: titleText,
    });
  };
  const hideTooltip = () => {
    setTooltip({ ...tooltip, visible: false });
  };

  const [isOpen,  setIsOpen]  = useState(false);
  const [isOpen2, setIsOpen2] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const item = {
    hidden: { opacity: 0, y: 20 },
    show:   { opacity: 1, y: 0,  transition: { duration: 0.4 } },
    exit:   { opacity: 0, y: 20, transition: { duration: 0.3 } },
  };

  const containerfooter = {
    hidden: { transition: { staggerChildren: 0.15, staggerDirection: -1 } },
    show:   { transition: { staggerChildren: 0.15, staggerDirection: 1  } },
  };

  // Search handler — re-uses existing getProducts API
  const handleSearch = useCallback((query) => {
    getProducts({ status: "published", page: 1, limit: 50, q: query || undefined })
      .then(({ products }) => {
        setNotsortedGrid(products);
        const imgMap = {};
        products.forEach(p => { imgMap[p._id] = pickRandomImage(p.images); });
        setProductImages(imgMap);
      })
      .catch(console.error);
  }, []);

  return (
    <div className={`${isSorted ? "" : "overflow-y-auto scroll-smooth "}`}>
      <div data-scroll className="fixed w-full top-16 flex items-center justify-center m-auto z-40 bg-transparent">        
        <div className="md:w-[40px] sm:w-[30px] md:pr-2.5 sm:pr-1.5 md:pl-1.5 sm:pl-[2px] md:py-1 sm:py-[0px] rounded-sm flex items-center justify-center m-auto backgroundbtn">
          <div id="icon3" onClick={handleClick} className={`${isSorted ? "open" : ""}`}>
            <span></span>
            <span style={{ top: isSorted ? '0px' : '9.5px' }}></span>
            <span></span>
            <span></span>
            <span style={{ left: isSorted ? '0px' : '50%' }}></span>
            <span style={{ left: isSorted ? '100%' : '50%' }}></span>
            <span></span>
            <span style={{ top: isSorted ? '19px' : '9.5px' }}></span>
            <span></span>
          </div>
        </div>
      </div>

      {isSorted && (
        <div className="w-full mt-28">
          <div className="w-full px-4">
            <motion.h1 dir={locale === "fa" ? "rtl" : "ltr"} variants={container} initial="hidden" animate="show" className="md:text-7xl sm:text-3xl font-thin mb-4 flex flex-wrap">
              {titleWords.map((word, idx) => (
                <span key={idx} className="overflow-hidden inline-block mb-2 text-[#0D1828] md:h-20 sm:h-9">
                  <motion.span variants={wordd} className="md:mr-4 sm:mr-2 inline-block">
                    {word}
                  </motion.span>
                </span>
              ))}
            </motion.h1>

            <motion.div
              dir={locale === "fa" ? "rtl" : "ltr"}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="md:text-[16px] sm:text-[13px] text-gray-700 mb-6 leading-relaxed flex flex-col gap-2 w-full max-w-none"
              dangerouslySetInnerHTML={{ __html: homeSubtitle || textaslifa }}
            />

            {/* ─── Top-level category anchor links ────────────────────────────── */}
            <div className="flex items-center justify-center overflow-x-auto w-[80%] mx-auto">
              <div className="flex md:gap-7 sm:gap-3 w-full max-w-fit inline-block align-top scrollbar-thin scrollbar-thumb-gray-400">
                {sortedGrid.map((topCat, index) => (
                  <a
                    key={topCat.id}
                    href={`#group${index}`}
                    className="md:text-[16px] sm:text-[13px] font-bold p-2 hover:border-b hover:border-gray-800 transition-all"
                  >
                    {locale === "fa" ? (topCat.name?.fa || topCat.name?.en) : (topCat.name?.en || topCat.name?.fa)}
                  </a>
                ))}
              </div>
            </div>


            {/* ─── Category sections ─────────────────────────────────────────── */}
            {sortedGrid.map((topCat, index) => {
              const subcats = (topCat.children || []).filter(c => c.type === 'category');
              const directProducts = (topCat.children || []).filter(c => c.type === 'product');
              const allSubcats = [
                ...subcats,
                ...(directProducts.length ? [{ id: `${topCat.id}-direct`, name: topCat.name, slug: topCat.slug, type: 'category', children: directProducts }] : []),
              ];
              if (!allSubcats.length) return null;

              return (
                <div id={`group${index}`} key={topCat.id} className="md:py-20 sm:py-6 relative border-b border-gray-300">
                  <motion.h2
                    dir={locale === "fa" ? "rtl" : "ltr"}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    viewport={{ once: true }}
                    className="text-black md:text-[22px] sm:text-[18px] font-bold mb-3"
                  >
                    {locale === "fa" ? (topCat.name?.fa || topCat.name?.en) : (topCat.name?.en || topCat.name?.fa)}
                  </motion.h2>
                  <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {allSubcats.map((subcat, boxIndex) => (
                      <BoxWithLocalDrag
                        key={subcat.id}
                        subcategory={subcat}
                        boxIndex={boxIndex}
                        boxVariant={boxVariant}
                        imageVariant={imageVariant}
                        textVariant={textVariant}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <Footer2 />
        </div>
      )}

      {!isSorted && (
        <div className="w-full h-screen select-none relative md:mt-0 sm:mt-4">
          <div
            id="scrollanime"
            ref={containerRef}
            className={`w-full h-full overflow-auto ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
            onMouseDown={(e) => !selected && startDrag(e.clientX, e.clientY)}
            onMouseMove={(e) => !selected && moveDrag(e.clientX, e.clientY)}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
            onTouchStart={(e) => !selected && startDrag(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchMove={(e) => !selected && moveDrag(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchEnd={endDrag}
            style={{ pointerEvents: selected ? "none" : "auto" }}
            onClick={() => !selected && setIsSorted(false)}
          >
            <motion.div
              className="md:w-[2580px] sm:w-[1900px] h-auto flex flex-wrap justify-center gap-6 py-10 px-5 transition-all duration-500"
              style={{ marginLeft: selected ? 320 : 0 }}
              initial={{ scale: overview ? 0.6 : 1 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.9, ease: "easeInOut" }}
            >
              {notsortedGrid.map((p) => {
                const isVisible = visiblePlates[p._id];
                const isSelected = selected?._id === p._id;
                const isReturning = returningPlate?._id === p._id;

                return (
                  <motion.div
                    key={p._id}
                    data-id={p._id}
                    className="plate-item inline-flex md:w-[300px] md:h-[300px] sm:w-[150px] sm:h-[150px] md:m-5 sm:m-3 flex-col"
                    initial={initialLoad || isReturning ? { scale: 0, opacity: 0 } : false}
                    animate={isVisible || isReturning ? { scale: 1, opacity: 1 } : {}}
                    transition={{ duration: 0.6, type: "spring", stiffness: 120, damping: 15 }}
                    whileHover={!isSelected ? { scale: 1.08 } : {}}
                    whileTap={!isSelected ? { scale: 0.95 } : {}}
                  >
                    <div className="w-full h-full overflow-hidden m-auto flex items-center justify-center">
                      <img
                        onMouseMove={(e) => handleMouseMove(e, `${locale === "fa" ? `${p.name.fa}` : `${p.name.en}`}`)}
                        onMouseLeave={hideTooltip}
                        draggable="false"
                        onClick={() => {
                          if (!draggingStarted) {
                            setSelected(null);
                            setSelectedid(p._id);
                            setTimeout(() => setSelected(p), 300);
                          }
                        }}
                        src={productImages[p._id]}
                        alt={locale === "fa" ? p.name.fa : p.name.en}
                        style={{
                          width: 200,
                          height: 200,
                          marginBottom: p._id % 2 === 0 ? '70px' : '0px',
                          opacity: isSelected ? 0.3 : 1,
                          pointerEvents: isSelected ? 'none' : 'auto',
                        }}
                        className="object-contain cursor-pointer transition-opacity duration-300"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {tooltip.visible && (
            <div
              className="fixed z-30 px-2 py-1 bg-white text-black text-sm rounded shadow-lg pointer-events-none transition-opacity duration-200"
              style={{ top: tooltip.y, left: tooltip.x }}
            >
              {tooltip.text}
            </div>
          )}

          <AnimatePresence>
            {selected && (
              <motion.aside
                initial={{ x: -420, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -420, opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 30 }}
                className="fixed left-0 top-0 md:w-[850px] sm:w-full h-full backdrop-blur-[24px] bg-[#FFFFFF40] border-r md:border-black sm:border-[#FFFFFF00] z-40"
              >
                <button
                  onClick={() => {
                    setSelected(null);
                    setSelectedid(null);
                    setReturningPlate(selected);
                    setSelected(null);
                    setCollectionImages([]);
                    setTimeout(() => setReturningPlate(null), 600);
                    setCurrentIndex(0);
                  }}
                  className="absolute md:top-[47%] sm:top-5 md:-right-6 sm:right-auto md:left-auto sm:left-5 bg-gray-100 w-[40px] h-[40px] md:text-xl sm:text-[19px] rounded-sm border border-black hover:bg-gray-100 transition-all duration-200 z-50"
                >
                  ✕
                </button>
                <AnimatePresence mode="wait">
                  <motion.h1
                    key={currentIndex}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="md:text-[25px] sm:text-[18px] font-bold absolute z-50 right-5 top-5 text-[#363635]"
                  >
                    {locale === "fa"
                      ? (collectionImages[currentIndex]?.name?.fa || selected?.name?.fa || '')
                      : (collectionImages[currentIndex]?.name?.en || selected?.name?.en || '')}
                  </motion.h1>
                </AnimatePresence>
                <div className="flex h-[100vh]">
                  <div style={{ overflowY: "auto" }} className="md:w-[130px] border-r border-black hidden md:block py-5 md:px-2 sm:px-1 md:pl-5 sm:pl-1">
                    {collectionImages.map((src, i) => (
                      <div
                        key={i}
                        style={{
                          border: currentIndex === i ? "1px solid black" : "1px solid gray",
                          boxSizing: "border-box",
                          cursor: "pointer",
                          borderRadius: '3px'
                        }}
                        className="md:w-[80px] md:h-[80px] md:mb-[10px] sm:w-[50px] sm:h-[50px] sm:mb-[5px] p-[3px]"
                        onClick={() => setCurrentIndex(i)}
                      >
                        <img
                          src={src.images?.[0]?.thumbnailUrl || src.images?.[0]?.url || ''}
                          alt={src.name?.fa || src.name?.en || `thumb-${i}`}
                          className="w-full h-auto max-h-full object-contain"
                          draggable={false}
                        />
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      height: "100vh",
                      overflow: "hidden",
                      userSelect: "none",
                      touchAction: "none",
                    }}
                    className="cursor-grab md:w-[calc(100% - 140px)] sm:w-full md:p-0 sm:p-4"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp}
                    onMouseLeave={onMouseLeave}
                  >
                    <div
                      style={{
                        height: "100%",
                        transition: isDragging2.current ? "none" : "transform 0.3s ease",
                        transform: `translateY(calc(-${currentIndex * 101}% + ${dragY}px))`,
                      }}
                    >
                      {collectionImages.map((src, i) => (
                        <div
                          key={i}
                          className="flex mx-auto items-center justify-center relative h-full"
                        >
                          <img
                            className="flex m-auto items-center justify-center cursor-pointer w-auto h-full object-contain"
                            src={src.images?.[0]?.url || ''}
                            alt={src.name?.fa || src.name?.en || `slide-${i}`}
                            draggable={false}
                          />
                          <p className="md:text-[18px] sm:text-[15px] font-thin absolute z-50 md:left-5 sm:left-1 bottom-16 text-[#363635]">
                            {new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(getMinPrice(src))} {locale === "fa" ? "تومان" : "IRT"}
                          </p>

                          <motion.button
                            initial={{ opacity: 1, y: 0 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="absolute flex gap-[1px] bottom-16 md:right-5 sm:right-2 text-white cursor-pointer z-50"
                            onClick={() => {
                              const targetSlug = src.slug || src._id || src.id;
                              if (targetSlug) router.push(`/product/${targetSlug}`);
                            }}
                          >
                            <motion.p
                              initial={{ scale: 1 }}
                              whileHover={{ scale: 1.05 }}
                              className="text-white px-3 py-1.5 rounded-sm shadow text-[13px] bg-[#222222] inline-flex font-bold"
                            >
                              {locale === "fa" ? "مشاهده" : "explore"}
                            </motion.p>
                            <span className="text-white">
                              <BiRightArrowAlt
                                size={30}
                                className="text-white px-[7px] h-[31px] rounded-sm shadow bg-[#222222] inline-flex"
                              />
                            </span>
                          </motion.button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      )}

      <motion.footer
        layout
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="text-white md:px-4 sm:px-1 py-4 fixed w-full bottom-0 flex justify-center z-[99999] pointer-events-none"
      >
        <motion.div
          layout
          className="flex items-center md:gap-2 sm:gap-1 pointer-events-auto"
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        >
          {/* ── Menu toggle ── */}
          <motion.button
            layout
            className="cursor-pointer inline-flex items-center bg-[#222222] md:px-3 sm:px-2 md:py-2 sm:py-[6.5px] rounded-sm shadow-lg hover:bg-[#47221C] transition-colors"
            onClick={() => { setIsOpen(!isOpen); setIsOpen2(false); }}
            whileTap={{ scale: 0.95 }}
          >
            {isOpen ? <CiCircleRemove size={20} /> : <CiTextAlignLeft size={20} />}
          </motion.button>

          {/* ── Nav links (same as Footer.js) ── */}
          <AnimatePresence mode="popLayout">
            {isOpen && (
              <motion.div
                layout
                variants={containerfooter}
                initial="hidden"
                animate="show"
                exit="hidden"
                className="flex items-center md:gap-2 sm:gap-1"
              >
                {/* 1. Home */}
                <motion.button
                  layout variants={item}
                  onClick={() => { router.push('/'); setIsOpen(false); }}
                  className="inline-flex bg-[#222222] md:px-3 sm:px-2 py-2 rounded-sm md:text-[16px] sm:text-[12px] shadow-md hover:bg-[#47221C] transition-colors"
                >
                  {locale === "fa" ? "خانه" : "Home"}
                </motion.button>

                {/* 2. Shop */}
                <motion.button
                  layout variants={item}
                  onClick={() => { router.push('/shop'); setIsOpen(false); }}
                  className="inline-flex bg-[#222222] md:px-3 sm:px-2 py-2 rounded-sm md:text-[16px] sm:text-[12px] shadow-md hover:bg-[#47221C] transition-colors"
                >
                  {locale === "fa" ? "فروشگاه" : "Shop"}
                </motion.button>

                {/* 3. Contact */}
                <motion.button
                  layout variants={item}
                  onClick={() => { router.push('/contactUs'); setIsOpen(false); }}
                  className="inline-flex bg-[#222222] md:px-3 sm:px-2 py-2 rounded-sm md:text-[16px] sm:text-[12px] shadow-md hover:bg-[#47221C] transition-colors"
                >
                  {locale === "fa" ? "ارتباط با ما" : "Contact Us"}
                </motion.button>

                {/* 4. Cart */}
                <motion.button
                  layout variants={item}
                  onClick={() => { router.push('/basket'); setIsOpen(false); }}
                  className="inline-flex bg-[#47221C] md:px-3 sm:px-2 py-2 rounded-sm md:text-[16px] sm:text-[12px] shadow-md hover:bg-[#341813] transition-colors"
                >
                  {locale === "fa" ? "سبد خرید" : "Cart"}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Search toggle (only in unsorted grid) ── */}
          {!isSorted && (
            <motion.button
              layout
              className="cursor-pointer inline-flex items-center bg-[#222222] md:px-3 sm:px-2 md:py-2 sm:py-[6.5px] rounded-sm shadow-lg hover:bg-[#47221C] transition-colors"
              onClick={() => { setIsOpen2(!isOpen2); setIsOpen(false); }}
              whileTap={{ scale: 0.95 }}
            >
              {isOpen2 ? <CiCircleRemove size={20} /> : <CiSearch size={20} />}
            </motion.button>
          )}

          {/* ── Search input ── */}
          <AnimatePresence mode="popLayout">
            {isOpen2 && !isSorted && (
              <motion.div
                layout
                variants={containerfooter}
                initial="hidden"
                animate="show"
                exit="hidden"
                className="flex items-center"
              >
                <motion.div
                  layout
                  className="inline-flex bg-[#222222] md:px-3 sm:px-2 py-2 rounded-sm shadow-md"
                  variants={item}
                >
                  <input
                    dir={locale === "fa" ? "rtl" : "ltr"}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent outline-none text-white placeholder-gray-400 md:text-[16px] sm:text-[12px] w-44"
                    placeholder={locale === "fa" ? "نام محصول را وارد کنید.." : "Search products..."}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearch(searchQuery.trim());
                        setIsOpen2(false);
                      }
                    }}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.footer>
    </div>
  );
}
