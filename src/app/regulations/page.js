"use client";
import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../contexts/LanguageContext";
import { useContent } from "../contexts/ContentContext";
import Footer2 from "@/components/layout/Footer2";
import { FaShieldAlt } from "react-icons/fa";

export default function RegulationsPage() {
  const { locale }   = useLanguage();
  const { getByKey } = useContent();

  const privacyItem = getByKey("privacy-security");

  const defaultBodyFa = `
    <h2>شرایط و قوانین استفاده از خدمات شایگان دیزاین</h2>
    <p>ورود کاربران به وب‌سایت شایگان دیزاین و استفاده از خدمات، به معنای آگاه بودن و پذیرفتن شرایط و قوانین و همچنین نحوه استفاده از سرویس‌ها است.</p>
    <h3>۱. حریم خصوصی کاربران</h3>
    <p>شایگان دیزاین به اطلاعات خصوصی اشخاصی که از خدمات سایت استفاده می‌کنند احترام گذاشته و از آن محافظت می‌کند.</p>
    <h3>۲. ثبت، پردازش و ارسال سفارش</h3>
    <p>روز کاری به معنی روز شنبه تا پنج شنبه هر هفته، به استثنای تعطیلات عمومی در ایران است و کلیه سفارش‌های ثبت شده در طول روزهای کاری پردازش می‌شوند.</p>
    <h3>۳. گارانتی و ضمانت بازگشت</h3>
    <p>کلیه محصولات شامل گارانتی ۲ ساله کیفیت بوده و تا ۷ روز پس از تحویل در صورت معیوب بودن کالا قابلیت بازگشت دارند.</p>
  `;

  const defaultBodyEn = `
    <h2>Terms & Privacy Policy</h2>
    <p>By using Shaygan Design services, you agree to our terms of privacy and service usage.</p>
    <h3>1. User Privacy</h3>
    <p>We strictly protect all personal information provided by users on our storefront.</p>
    <h3>2. Order Processing</h3>
    <p>Orders are processed on business days from Saturday through Thursday.</p>
    <h3>3. Warranty & Returns</h3>
    <p>All items carry a 2-year quality warranty and can be returned within 7 days of receipt if defective.</p>
  `;

  const bodyText = typeof privacyItem?.body === 'object' && privacyItem?.body !== null
    ? (privacyItem.body[locale] || privacyItem.body.fa || privacyItem.body.en || defaultBodyFa)
    : (privacyItem?.body || (locale === "fa" ? defaultBodyFa : defaultBodyEn));

  const titleText = typeof privacyItem?.title === 'object' && privacyItem?.title !== null
    ? (privacyItem.title[locale] || privacyItem.title.fa || privacyItem.title.en || "")
    : (privacyItem?.title || (locale === "fa" ? "قوانین، مقررات و حریم خصوصی" : "Terms, Security & Privacy Policy"));

  return (
    <div dir={locale === "fa" ? "rtl" : "ltr"} className="mt-28 min-h-screen flex flex-col justify-between">
      <div className="max-w-5xl mx-auto px-6 pb-20 w-full">
        
        {/* Header Title */}
        <div className="flex items-center gap-3 mb-8 border-b border-[#47221C20] pb-4">
          <div className="w-12 h-12 rounded-full bg-[#47221C15] flex items-center justify-center text-[#47221C] text-xl flex-shrink-0">
            <FaShieldAlt />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#363635]">
              {titleText}
            </h1>
            <p className="text-xs md:text-sm text-gray-500 font-light mt-1">
              {locale === "fa" ? "آخرین به‌روزرسانی قوانین و شرایط استفاده از خدمات" : "Latest update of terms and conditions"}
            </p>
          </div>
        </div>

        {/* Main Content Body */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="prose prose-stone max-w-none text-sm md:text-base text-gray-800 leading-relaxed space-y-4 bg-white/70 backdrop-blur-sm p-6 md:p-8 rounded-xl border border-gray-300 shadow-sm"
          dangerouslySetInnerHTML={{ __html: bodyText }}
        />
      </div>

      <Footer2 />
    </div>
  );
}
