"use client";
import React, { useState, useEffect } from "react";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useLanguage } from "../../app/contexts/LanguageContext";
import { useContent } from "../../app/contexts/ContentContext";
import Footer2 from "../layout/Footer2";

export default function FAQs() {
  const { locale } = useLanguage();
  const { getByKey } = useContent();
  const [faqList, setFaqList] = useState([]);

  useEffect(() => {
    const faqItem = getByKey("faq");
    const items = faqItem?.fields?.items || faqItem?.items || [];

    if (Array.isArray(items) && items.length > 0) {
      const parsed = items.map(item => ({
        question: typeof item.q === 'object' && item.q !== null
          ? (item.q[locale] || item.q.fa || item.q.en || "")
          : (item.q || ""),
        answer: typeof item.a === 'object' && item.a !== null
          ? (item.a[locale] || item.a.fa || item.a.en || "")
          : (item.a || "")
      }));
      setFaqList(parsed);
    } else {
      // Default fallbacks if API data isn't set yet
      setFaqList([
        {
          question: locale === "fa" ? "زمان ارسال سفارش چقدر است؟" : "What is the delivery time?",
          answer: locale === "fa" ? "بین ۳ تا ۷ روز کاری بسته به مقصد نهایی سفارش." : "3 to 7 working days depending on destination."
        },
        {
          question: locale === "fa" ? "امکان مرجوع کردن کالا وجود دارد؟" : "Can I return items?",
          answer: locale === "fa" ? "تا ۷ روز پس از تحویل، در صورت سلامت کامل کالا امکان‌پذیر است." : "Up to 7 days after delivery if product is undamaged."
        },
        {
          question: locale === "fa" ? "شرایط گارانتی محصولات به چه صورت است؟" : "What is the warranty policy?",
          answer: locale === "fa" ? "تمامی محصولات شایگان دیزاین دارای ۲ سال گارانتی اصالت و کیفیت هستند." : "All Shaygan Design products include a 2-year quality warranty."
        }
      ]);
    }
  }, [getByKey, locale]);

  const [openIndex, setOpenIndex] = useState(null);
  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      <section dir={locale === "fa" ? "rtl" : "ltr"} className="w-[90%] max-w-5xl mx-auto mt-[120px] pb-24 min-h-[70vh]">
        <div className={`flex gap-5 mt-10 mb-8 ${locale === "fa" ? "text-right" : "text-left"}`}>
          <div className="w-full">
            <span className="text-[#47221C] md:text-lg text-sm font-bold bg-[#47221C15] px-3 py-1 rounded-full border border-[#47221C30] inline-block">
              {locale === "fa" ? "سوالات متداول" : "Frequently Asked Questions"}
            </span>
            <h1 className="md:text-4xl text-2xl font-bold text-[#363635] mt-4">
              {locale === "fa" ? "سوال دارید؟ ما پاسخ می‌دهیم!" : "Have Questions? We Have Answers!"}
            </h1>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {faqList.map((faq, index) => (
            <div
              key={index}
              className="bg-white/70 backdrop-blur-sm rounded-lg border border-gray-300 p-4 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <div
                className="flex items-center justify-between cursor-pointer gap-3"
                onClick={() => toggleFAQ(index)}
              >
                <h3 className={`flex-1 ${locale === "fa" ? "text-right" : "text-left"} md:text-lg text-sm text-[#363635] font-bold`}>
                  {faq.question}
                </h3>
                <button className="text-[#47221C] p-1 shrink-0" aria-label="toggle question">
                  {openIndex === index ? (
                    <KeyboardArrowUpIcon />
                  ) : (
                    <KeyboardArrowDownIcon />
                  )}
                </button>
              </div>
              {openIndex === index && (
                <>
                  <hr className="my-3 border-gray-200" />
                  <p className={`mt-2 md:text-sm text-xs text-gray-700 ${locale === "fa" ? "text-right" : "text-left"} leading-relaxed font-light`}>
                    {faq.answer}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      </section>
      <Footer2 />
    </>
  );
}