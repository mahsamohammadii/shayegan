"use client";
import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../../app/contexts/LanguageContext";
import { useContent } from "../../app/contexts/ContentContext";
import { FaMapMarkerAlt } from "react-icons/fa";

export default function AboutUs() {
  const { locale } = useLanguage();
  const { getByKey } = useContent();

  const aboutItem   = getByKey("about-us");
  const videoItem   = getByKey("video-aboutus");
  const contactInfo = getByKey("contact-info");

  // Title / Subtitle for right side on Desktop / top on Mobile
  const titleText = typeof aboutItem?.title === 'object'
    ? (aboutItem.title[locale] || aboutItem.title.fa || aboutItem.title.en || "")
    : (aboutItem?.title || (locale === "fa" ? "درباره ما" : "About Us"));

  const subtitleText = typeof aboutItem?.subtitle === 'object'
    ? (aboutItem.subtitle[locale] || aboutItem.subtitle.fa || aboutItem.subtitle.en || "")
    : (aboutItem?.subtitle || "");

  // Body for left side on Desktop / bottom on Mobile
  const defaultBodyFa = "<p>فروشگاه مبلمان شایگان دیزاین با هدف ارائهٔ مبلمان باکیفیت و مقرون‌به‌صرفه به خانواده‌های ایرانی تأسیس شد.</p><p>ما از بهترین مواد اولیه و استادکاران مجرب بهره می‌بریم تا محصولاتی ماندگار تولید کنیم.</p>";
  const defaultBodyEn = "<p>Shaygan Design furniture store was founded with the goal of delivering quality furniture to Iranian families.</p>";

  const bodyText = typeof aboutItem?.body === 'object'
    ? (aboutItem.body[locale] || aboutItem.body.fa || aboutItem.body.en || defaultBodyFa)
    : (aboutItem?.body || defaultBodyFa);

  // Background image cover for right side (media[0])
  const bgImage = aboutItem?.media?.[0]?.url || null;

  // Video & Poster from video-aboutus
  const videoUrl   = videoItem?.media?.[0]?.url || videoItem?.fields?.videoUrl || videoItem?.fields?.url || null;
  const posterUrl  = videoItem?.media?.[1]?.url || videoItem?.fields?.posterUrl || "/images/logo.png";

  // Address from contact-info
  const address = typeof contactInfo?.fields?.address === 'object'
    ? (contactInfo.fields.address[locale] || contactInfo.fields.address.fa || contactInfo.fields.address.en || "")
    : (contactInfo?.fields?.address || "");

  const titleWords = (titleText || "").split(" ").filter(Boolean);
  const descWords  = (subtitleText || "").split(" ").filter(Boolean);

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  };

  const wordd = {
    hidden: { y: 100, opacity: 1 },
    show: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <div dir={locale === "fa" ? "rtl" : "ltr"} className="w-full min-h-screen bgabout flex flex-col pt-16">
      <div className="md:flex items-start">
        
        {/* Right side on Desktop / Top on Mobile — 100vh height, sticky on desktop */}
        <div 
          className="w-full md:w-1/3 h-screen md:sticky md:top-0 md:border-l sm:border-l-0 border-b md:border-b-0 border-gray-400 flex items-center justify-center relative bg-cover bg-center object-cover flex-shrink-0 z-10"
          style={bgImage ? { backgroundImage: `url(${bgImage})` } : {}}
        >
          <div className="w-full p-6 bg-white/40 backdrop-blur-[2px] h-full flex flex-col justify-center items-center">
            <motion.h1
              dir={locale === "fa" ? "rtl" : "ltr"}
              variants={container}
              initial="hidden"
              animate="show"
              className="md:text-6xl text-3xl md:font-thin font-bold mb-4 flex flex-wrap justify-center text-center"
            >
              {titleWords.map((word, idx) => (
                <span
                  key={idx}
                  className="overflow-hidden inline-block text-[#363635] md:h-20 h-10"
                >
                  <motion.span variants={wordd} className="mr-1 inline-block">
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
              className="text-sm flex flex-wrap justify-center text-center text-gray-800 font-medium leading-relaxed max-w-xs"
              dangerouslySetInnerHTML={{ __html: subtitleText || "" }}
            />

            {/* {descWords.length > 0 && (
              <motion.p
                dir={locale === "fa" ? "rtl" : "ltr"}
                variants={container}
                initial="hidden"
                animate="show"
                className="text-sm flex flex-wrap justify-center text-center text-gray-800 font-medium leading-relaxed max-w-xs"
              >
                {descWords.map((word, idx) => (
                  <span
                    key={idx}
                    className="overflow-hidden inline-block text-[#363635]"
                    style={{ height: "1.4rem" }}
                  >
                    <motion.span variants={wordd} className="mr-1 inline-block">
                      {word}
                    </motion.span>
                  </span>
                ))}
              </motion.p>
            )} */}

            {address && (
              <div className="mt-6 flex items-center gap-2 text-xs md:text-sm text-[#47221C] bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-[#47221C30] shadow-sm">
                <FaMapMarkerAlt />
                <span>{address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Left side on Desktop / Bottom on Mobile — scrollable if content overflows */}
        <div className="w-full md:w-2/3 min-h-screen">
          <div className="w-[90%] mx-auto pb-24 pt-8">
            {/* Intro Video section */}
            <h2 className="md:text-2xl text-lg font-bold text-center mb-5 text-[#363635]">
              {locale === "fa" ? "ویدیو معرفی" : "Intro Video"}
            </h2>
            <div className="w-full h-[40vh] md:h-[50vh] rounded-2xl border border-gray-400 bg-black overflow-hidden shadow-lg">
              <video
                className="w-full h-full object-cover"
                poster={posterUrl}
                controls
              >
                {videoUrl && <source src={videoUrl} type="video/mp4" />}
                {locale === "fa"
                  ? "مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند."
                  : "Your browser does not support video playback."}
              </video>
            </div>

            {/* Main Body Description */}
            <h3 className="md:text-2xl text-lg font-bold text-center mt-12 pt-6 mb-6 border-t border-gray-400 text-[#363635]">
              {locale === "fa" ? "شایگان دیزاین" : "Shaygan Design"}
            </h3>
            <div
              dir={locale === "fa" ? "rtl" : "ltr"}
              className="text-sm md:text-base text-gray-800 flex flex-col items-center text-center gap-4 leading-relaxed max-w-3xl mx-auto"
              dangerouslySetInnerHTML={{ __html: bodyText }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}