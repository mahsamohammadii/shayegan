"use client";
import React from "react";
import { motion } from "framer-motion";
import { BiRightArrowAlt } from "react-icons/bi";

export default function SortedView({ sortedGrid, router }) {
  const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
  const wordd = { hidden: { y: 100, opacity: 1 }, show: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } } };
  const title = "explore palmer dinnerware collections";
  const description = "Our collection is designed to engage all of the senses. Rich colors and beautifully textured finishes transform every meal into a dish worth celebrating.";
  const titleWords = title.split(" ");
  const descWords = description.split(" ");
  const boxVariant = { hidden: { opacity: 0, y: 50 }, visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.6, ease: "easeOut" } }) };
  const imageVariant = { hidden: { scale: 0, opacity: 1 }, visible: (i) => ({ opacity: 1, scale: 1, transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" } }) };
  const textVariant = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { delay: 1.4, duration: 0.6, ease: "easeOut" } } };

  return (
      <div className="mt-28 px-4 mb-20 h-200 overflow-scroll">
        <motion.h1 variants={container} initial="hidden" animate="show" className="text-8xl font-thin mb-4 flex flex-wrap w-[1000px]">
          {titleWords.map((w, i) => (
            <span key={i} className="overflow-hidden inline-block mb-2 text-[#0D1828]" style={{ height: "5.8rem" }}>
              <motion.span variants={wordd} className="mr-4 inline-block">{w}</motion.span>
            </span>
          ))}
        </motion.h1>
        <motion.p variants={container} initial="hidden" animate="show" className="text-[13px] flex flex-wrap w-[320px]">
          {descWords.map((w, i) => (
            <span key={i} className="overflow-hidden inline-block text-[#363635]" style={{ height: "1.3rem" }}>
              <motion.span variants={wordd} className="mr-1 inline-block">{w}</motion.span>
            </span>
          ))}
        </motion.p>

        {sortedGrid.map((row, index) => (
          <div key={index} className="py-20 relative border-b border-gray-300">
            <motion.h2 initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} viewport={{ once: true }} className="text-black text-2xl font-bold text-left mb-3">
              {row.GroupTitle.fa.GroupTitle}
            </motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {row.Models.map((box, boxIndex) => (
                <motion.div key={box.id} custom={boxIndex} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={boxVariant} className="flex flex-col items-center relative">
                  <motion.div className="relative w-full h-64 overflow-hidden rounded-lg bg-transparent border border-gray-300">
                    <div style={{ width: "100%", overflow: "hidden", touchAction: "none", userSelect: "none" }}>
                      <motion.div style={{ display: "flex" }} animate={{ x: 0 }} transition={{ type: "spring", stiffness: 80, damping: 50 }}>
                        {box.latestProducts.map((src, i) => (
                          <motion.div key={i} style={{ minWidth: "100%" }} className="flex items-center justify-center" variants={imageVariant} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
                            <img src={`https://shayegandesign.com/${src.imgPath}`} alt={`slide-${i}`} style={{ width: "50%", objectFit: "cover" }} draggable={false} />
                          </motion.div>
                        ))}
                      </motion.div>
                    </div>
                    <motion.button
                      initial={{ opacity: 1, y: -43 }}
                      animate={{ opacity: 1, y: 1 }}
                      transition={{ duration: 0.3 }}
                      className="absolute top-2 right-2 text-white cursor-pointer"
                      onClick={() => router.push("/collection")}
                    >
                      <motion.p whileHover={{ scale: 1.05 }} className="text-white px-3 py-1 rounded-sm shadow text-[12px] bg-[#222222] inline-flex">
                        explore
                      </motion.p>
                      <BiRightArrowAlt size={36} className="text-white px-[10px] h-[27px] rounded-sm shadow bg-[#222222] inline-flex" />
                    </motion.button>
                  </motion.div>
                  <div className="w-full">
                    <span className="inline-flex float-left">
                      <motion.p variants={textVariant} className="mt-4 text-md font-light text-gray-600 text-left">
                        {box.info.fa.ModelTitle}
                      </motion.p>
                    </span>
                    <span className="inline-flex float-right">
                      <motion.p variants={textVariant} className="mt-4 text-md font-light text-gray-600 text-right inline-flex float-right">
                        {box.latestProducts.length} products
                      </motion.p>
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
  );
}
