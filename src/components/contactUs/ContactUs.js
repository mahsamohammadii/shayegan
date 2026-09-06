"use client";
import React from "react";
import { motion } from "framer-motion";
import { useRouter } from 'next/navigation';
import {
  FaTelegramPlane,
  FaWhatsapp,
  FaInstagram,
  FaEnvelope,
  FaTwitter,
  FaFacebookF,
  FaLinkedinIn,
  FaYoutube,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaClock,
  FaInfoCircle,
  FaHandshake
} from "react-icons/fa";
import { Map, Marker, ZoomControl } from "pigeon-maps";
import { useLanguage } from "../../app/contexts/LanguageContext";
import { useContent } from "../../app/contexts/ContentContext";
import Footer2 from "../layout/Footer2";

const SOCIAL_ICONS = {
  instagram: FaInstagram,
  telegram:  FaTelegramPlane,
  whatsapp:  FaWhatsapp,
  twitter:   FaTwitter,
  facebook:  FaFacebookF,
  linkedin:  FaLinkedinIn,
  youtube:   FaYoutube,
};

function MyMap({ coords, mapUrl }) {
  const center = coords || [29.6218594, 52.5052895];
  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-400 shadow-md relative">
      <div className="w-full h-[40vh]">
        <Map height={400} defaultCenter={center} defaultZoom={15}>
          <Marker width={45} anchor={center} />
          <ZoomControl />
        </Map>
      </div>
      {mapUrl && (
        <div className="p-3 bg-white/90 backdrop-blur-sm border-t border-gray-200 flex justify-between items-center text-xs">
          <span className="text-gray-700 font-medium">موقعیت مکانی شایگان دیزاین</span>
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#363635] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#47221C] transition-colors shadow-sm"
          >
            مشاهده در گوگل‌مپ
          </a>
        </div>
      )}
    </div>
  );
}

export default function ContactUs() {
  const router = useRouter();
  const { locale } = useLanguage();
  const { getByKey } = useContent();

  const contactUsItem   = getByKey("contact-us");
  const contactInfoItem = getByKey("contact-info");
  const socialInfoItem  = getByKey("social-links");
  const collaborateItem = getByKey("collaborate-us");

  // contact-us body & bg media
  const contactUsBody = typeof contactUsItem?.body === 'object'
    ? (contactUsItem.body[locale] || contactUsItem.body.fa || contactUsItem.body.en || "")
    : (contactUsItem?.body || "");

  const bgImage = contactUsItem?.media?.[0]?.url || null;

  // contact-info fields
  const phones = contactInfoItem?.fields?.phones || (contactInfoItem?.fields?.phone ? [contactInfoItem.fields.phone] : ["021-12345678"]);
  const emails = contactInfoItem?.fields?.emails || (contactInfoItem?.fields?.email ? [contactInfoItem.fields.email] : ["info@shayegandesign.com"]);

  const address = typeof contactInfoItem?.fields?.address === 'object'
    ? (contactInfoItem.fields.address[locale] || contactInfoItem.fields.address.fa || contactInfoItem.fields.address.en || "")
    : (contactInfoItem?.fields?.address || (locale === "fa" ? "شیراز، خیابان ستارخان، پلاک ۱۲۳" : "Shiraz, Starkhane St, No. 123"));

  const bio = typeof contactInfoItem?.fields?.bio === 'object'
    ? (contactInfoItem.fields.bio[locale] || contactInfoItem.fields.bio.fa || contactInfoItem.fields.bio.en || "")
    : (contactInfoItem?.fields?.bio || contactInfoItem?.body || (locale === "fa" ? "مجموعه شایگان دیزاین طراحی و تولیدکننده تخصصی مبلمان مدرن و کلاسیک با بالاترین استاندارد کیفی می‌باشد." : "Shaygan Design specializes in modern and classic furniture design and production."));

  const workingHours = typeof contactInfoItem?.fields?.workingHours === 'object'
    ? (contactInfoItem.fields.workingHours[locale] || contactInfoItem.fields.workingHours.fa || contactInfoItem.fields.workingHours.en || "")
    : (contactInfoItem?.fields?.workingHours || (locale === "fa" ? "شنبه تا پنج‌شنبه: ۹ صبح الی ۹ شب" : "Sat - Thu: 9 AM - 9 PM"));

  const mapUrl = contactInfoItem?.fields?.mapUrl || "";
  let mapCoords = [29.6218594, 52.5052895];
  if (mapUrl) {
    const match = mapUrl.match(/q=([\d.-]+),\s*([\d.-]+)/) || mapUrl.match(/@([\d.-]+),([\d.-]+)/);
    if (match) {
      mapCoords = [parseFloat(match[1]), parseFloat(match[2])];
    }
  }

  // social links
  const socialLinks = socialInfoItem?.links || [];

  // collaborate-us
  const collaborateBody = typeof collaborateItem?.body === 'object'
    ? (collaborateItem.body[locale] || collaborateItem.body.fa || collaborateItem.body.en || "")
    : (collaborateItem?.body || (locale === "fa" ? "برای همکاری با ما می‌توانید فرم ارتباط یا فایل رزومه خود را ارسال فرمایید." : "To collaborate with us, send us your resume or project proposal."));

  const collaborateFileUrl = collaborateItem?.media?.[0]?.url || collaborateItem?.fields?.fileUrl || null;

  const title = locale === "fa" ? "ارتباط با ما" : "Contact Us";
  const titlewords = title.split(" ");

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
          <div className="w-full p-6 bg-white/40 backdrop-blur-[2px] h-full flex flex-col justify-center items-center relative z-10">
            <motion.h1 
              dir={locale === "fa" ? "rtl" : "ltr"}
              variants={container} 
              initial="hidden" 
              animate="show" 
              className="md:text-6xl text-3xl md:font-thin font-bold mb-6 flex flex-wrap justify-center text-center"
            >
              {titlewords.map((word, idx) => (
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

            {/* Social Icons */}
            {socialLinks.length > 0 && (
              <div className="flex gap-3 flex-wrap justify-center items-center mt-2">
                {socialLinks.map((s, i) => {
                  const platformKey = (s.platform || '').toLowerCase();
                  const Icon = SOCIAL_ICONS[platformKey] || FaInstagram;
                  return (
                    <a
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 border border-[#363635] rounded-full text-[#363635] hover:text-white hover:border-[#47221C] hover:bg-[#47221C] transition-all duration-200 shadow-sm"
                      aria-label={s.platform || "social"}
                    >
                      <Icon size={18} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Left side on Desktop / Bottom on Mobile (Contact Details + Bio + Collaborate + Map) */}
        <div className="w-full md:w-2/3 min-h-screen flex flex-col justify-between">
          <div className="w-[92%] mx-auto pb-16 pt-8 flex flex-col gap-8">
            
            {/* Overview / Contact Us Body */}
            {contactUsBody && (
              <div className="p-5 rounded-2xl border border-gray-300 bg-white/60 backdrop-blur-sm text-sm md:text-base text-gray-800 leading-relaxed shadow-sm">
                <div dangerouslySetInnerHTML={{ __html: contactUsBody }} />
              </div>
            )}

            {/* Bio Card */}
            {bio && (
              <div className="p-5 rounded-2xl border border-[#47221C30] bg-[#47221C08] text-sm text-[#363635] flex items-start gap-3 shadow-sm">
                <FaInfoCircle className="text-[#47221C] text-xl flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[#47221C] mb-1">
                    {locale === "fa" ? "درباره خدمات ما" : "About Our Services"}
                  </h4>
                  <p className="leading-relaxed font-light">{bio}</p>
                </div>
              </div>
            )}

            {/* Contact Details & Collaboration Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Contact Information */}
              <div className="p-5 rounded-2xl border border-gray-300 bg-white/60 backdrop-blur-sm flex flex-col gap-4 text-[#363635] shadow-sm">
                <h3 className="text-lg md:text-xl font-bold border-b border-gray-300 pb-2 flex items-center gap-2">
                  <FaPhoneAlt className="text-[#47221C] text-base" />
                  {locale === "fa" ? "اطلاعات ارتباط با ما" : "Contact Details"}
                </h3>

                {address && (
                  <div className="flex items-start gap-2.5 text-sm text-gray-700">
                    <FaMapMarkerAlt className="text-[#47221C] mt-1 flex-shrink-0" />
                    <span>{address}</span>
                  </div>
                )}

                {phones.length > 0 && (
                  <div className="flex items-start gap-2.5 text-sm text-gray-700">
                    <FaPhoneAlt className="text-[#47221C] mt-1 flex-shrink-0" />
                    <div className="flex flex-col gap-1">
                      {phones.map((p, idx) => (
                        <a key={idx} href={`tel:${p.replace(/\s+/g, '')}`} className="hover:text-[#47221C] transition-colors dir-ltr text-right font-medium">
                          {p}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {emails.length > 0 && (
                  <div className="flex items-start gap-2.5 text-sm text-gray-700">
                    <FaEnvelope className="text-[#47221C] mt-1 flex-shrink-0" />
                    <div className="flex flex-col gap-1">
                      {emails.map((e, idx) => (
                        <a key={idx} href={`mailto:${e.trim()}`} className="hover:text-[#47221C] transition-colors font-medium">
                          {e}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {workingHours && (
                  <div className="flex items-start gap-2.5 text-sm text-gray-700">
                    <FaClock className="text-[#47221C] mt-1 flex-shrink-0" />
                    <span>{workingHours}</span>
                  </div>
                )}
              </div>

              {/* Collaboration Section */}
              <div className="p-5 rounded-2xl border border-gray-300 bg-white/60 backdrop-blur-sm flex flex-col justify-between text-[#363635] shadow-sm">
                <div>
                  <h3 className="text-lg md:text-xl font-bold border-b border-gray-300 pb-2 flex items-center gap-2">
                    <FaHandshake className="text-[#47221C] text-lg" />
                    {locale === "fa" ? "همکاری با ما" : "Cooperate with Us"}
                  </h3>
                  <div className="text-sm text-gray-700 mt-3 leading-relaxed">
                    {collaborateBody}
                  </div>
                </div>

                {collaborateFileUrl && (
                  <div className="mt-4">
                    <a
                      href={collaborateFileUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#47221C] text-white py-2.5 px-4 rounded-xl text-xs md:text-sm font-bold inline-block hover:bg-[#341813] transition-colors shadow"
                    >
                      {locale === "fa" ? "دانلود فایل شرایط همکاری" : "Download Collaboration Info"}
                    </a>
                  </div>
                )}
              </div>

            </div>

            {/* Map Section */}
            <div className="text-[#363635] w-full border-t border-gray-300 pt-6">
              <h3 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
                <FaMapMarkerAlt className="text-[#47221C]" />
                {locale === "fa" ? "آدرس ما روی نقشه" : "Our Location on Map"}
              </h3>
              <MyMap coords={mapCoords} mapUrl={mapUrl} />
            </div>

          </div>
        </div>

      </div>

      {/* Full width Footer below both columns */}
      <div className="w-full relative z-20">
        <Footer2 />
      </div>
    </div>
  );
}