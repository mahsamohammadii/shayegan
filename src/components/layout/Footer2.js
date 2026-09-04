"use client";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../app/contexts/LanguageContext";
import { useContent } from "../../app/contexts/ContentContext";
import {
  FaInstagram,
  FaTelegramPlane,
  FaWhatsapp,
  FaTwitter,
  FaFacebookF,
  FaLinkedinIn,
  FaYoutube,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock
} from "react-icons/fa";

const SOCIAL_ICONS = {
  instagram: FaInstagram,
  telegram:  FaTelegramPlane,
  whatsapp:  FaWhatsapp,
  twitter:   FaTwitter,
  facebook:  FaFacebookF,
  linkedin:  FaLinkedinIn,
  youtube:   FaYoutube,
};

export default function Footer2() {
  const { locale }   = useLanguage();
  const { getByKey } = useContent();
  const router       = useRouter();

  const footerContent  = getByKey("footer");
  const socialContent  = getByKey("social-links");
  const contactInfo    = getByKey("contact-info");

  // Footer body (ignoring footer.links per instruction)
  const footerBody = typeof footerContent?.body === 'object'
    ? (footerContent.body[locale] || footerContent.body.fa || footerContent.body.en || "")
    : (footerContent?.body || "");

  const copyright = typeof footerContent?.fields?.copyright === 'object'
    ? (footerContent.fields.copyright[locale] || footerContent.fields.copyright.fa || footerContent.fields.copyright.en || "")
    : (footerContent?.fields?.copyright || "");

  const socialLinks = socialContent?.links || [];

  // Contact Info
  const phones = contactInfo?.fields?.phones || (contactInfo?.fields?.phone ? [contactInfo.fields.phone] : []);
  const emails = contactInfo?.fields?.emails || (contactInfo?.fields?.email ? [contactInfo.fields.email] : []);
  
  const address = typeof contactInfo?.fields?.address === 'object'
    ? (contactInfo.fields.address[locale] || contactInfo.fields.address.fa || contactInfo.fields.address.en || "")
    : (contactInfo?.fields?.address || (locale === "fa" ? "شیراز، خیابان ستارخان، پلاک ۱۲۳" : "Shiraz, Starkhane St, No. 123"));

  const workingHours = typeof contactInfo?.fields?.workingHours === 'object'
    ? (contactInfo.fields.workingHours[locale] || contactInfo.fields.workingHours.fa || contactInfo.fields.workingHours.en || "")
    : (contactInfo?.fields?.workingHours || (locale === "fa" ? "شنبه تا پنج‌شنبه: ۹ صبح الی ۹ شب" : "Sat - Thu: 9 AM - 9 PM"));

  return (
    <footer dir={locale === "fa" ? "rtl" : "ltr"} className="w-full border-t border-[#47221C20] bg-white/60 backdrop-blur-md text-[#363635]">
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

        {/* Brand & Description Column */}
        <div className="flex flex-col items-start space-y-4">
          <img src="/images/logo.png" className="h-16 object-contain" alt="Shaygan Design Logo" />
          {footerBody && (
            <p className="text-xs md:text-sm font-light text-gray-600 leading-relaxed">
              {footerBody}
            </p>
          )}

          {/* Social Icons */}
          {socialLinks.length > 0 && (
            <div className="flex items-center gap-2.5 pt-2 flex-wrap">
              {socialLinks.map((s, i) => {
                const platformKey = (s.platform || '').toLowerCase();
                const Icon = SOCIAL_ICONS[platformKey] || FaInstagram;
                return (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border border-[#47221C40] rounded-full text-[#47221C] hover:bg-[#47221C] hover:text-white transition-all duration-200"
                    aria-label={s.platform || "social link"}
                  >
                    <Icon size={16} />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Access Links (دسترسی سریع) */}
        <div>
          <h3 className="text-base md:text-lg font-bold text-[#47221C] mb-4 border-b border-[#47221C20] pb-2 inline-block">
            {locale === "fa" ? "دسترسی سریع" : "Quick Links"}
          </h3>
          <ul className="space-y-2.5 text-xs md:text-sm font-medium text-gray-600">
            <li className="cursor-pointer hover:text-[#47221C] transition-colors" onClick={() => router.push('/')}>
              {locale === "fa" ? "خانه" : "Home"}
            </li>
            <li className="cursor-pointer hover:text-[#47221C] transition-colors" onClick={() => router.push('/shop')}>
              {locale === "fa" ? "فروشگاه" : "Shop"}
            </li>
            <li className="cursor-pointer hover:text-[#47221C] transition-colors" onClick={() => router.push('/contactUs')}>
              {locale === "fa" ? "ارتباط با ما" : "Contact Us"}
            </li>
            <li className="cursor-pointer hover:text-[#47221C] transition-colors" onClick={() => router.push('/aboutUs')}>
              {locale === "fa" ? "درباره ما" : "About Us"}
            </li>
          </ul>
        </div>

        {/* Useful Pages Links (صفحات کاربردی) */}
        <div>
          <h3 className="text-base md:text-lg font-bold text-[#47221C] mb-4 border-b border-[#47221C20] pb-2 inline-block">
            {locale === "fa" ? "صفحات کاربردی" : "Useful Pages"}
          </h3>
          <ul className="space-y-2.5 text-xs md:text-sm font-medium text-gray-600">
            <li className="cursor-pointer hover:text-[#47221C] transition-colors" onClick={() => router.push('/shop')}>
              {locale === "fa" ? "فروشگاه" : "Shop"}
            </li>
            <li className="cursor-pointer hover:text-[#47221C] transition-colors" onClick={() => router.push('/user-panel')}>
              {locale === "fa" ? "پنل کاربری" : "User Panel"}
            </li>
            <li className="cursor-pointer hover:text-[#47221C] transition-colors" onClick={() => router.push('/basket')}>
              {locale === "fa" ? "سبد خرید" : "Cart"}
            </li>
            <li className="cursor-pointer hover:text-[#47221C] transition-colors" onClick={() => router.push('/FAQs')}>
              {locale === "fa" ? "سوالات متداول" : "FAQs"}
            </li>
            <li className="cursor-pointer hover:text-[#47221C] transition-colors" onClick={() => router.push('/regulations')}>
              {locale === "fa" ? "قوانین و مقررات" : "Privacy & Security"}
            </li>
          </ul>
        </div>

        {/* Contact Info Column */}
        <div className="space-y-3">
          <h3 className="text-base md:text-lg font-bold text-[#47221C] mb-4 border-b border-[#47221C20] pb-2 inline-block">
            {locale === "fa" ? "اطلاعات تماس" : "Contact Info"}
          </h3>

          {address && (
            <div className="flex items-start gap-2.5 text-xs md:text-sm text-gray-600">
              <FaMapMarkerAlt className="text-[#47221C] mt-1 flex-shrink-0" />
              <span>{address}</span>
            </div>
          )}

          {phones.length > 0 && (
            <div className="flex items-start gap-2.5 text-xs md:text-sm text-gray-600">
              <FaPhoneAlt className="text-[#47221C] mt-1 flex-shrink-0" />
              <div className="flex flex-col gap-1">
                {phones.map((p, idx) => (
                  <a key={idx} href={`tel:${p.replace(/\s+/g, '')}`} className="hover:text-[#47221C] transition-colors dir-ltr text-right">
                    {p}
                  </a>
                ))}
              </div>
            </div>
          )}

          {emails.length > 0 && (
            <div className="flex items-start gap-2.5 text-xs md:text-sm text-gray-600">
              <FaEnvelope className="text-[#47221C] mt-1 flex-shrink-0" />
              <div className="flex flex-col gap-1">
                {emails.map((e, idx) => (
                  <a key={idx} href={`mailto:${e.trim()}`} className="hover:text-[#47221C] transition-colors">
                    {e}
                  </a>
                ))}
              </div>
            </div>
          )}

          {workingHours && (
            <div className="flex items-start gap-2.5 text-xs md:text-sm text-gray-600">
              <FaClock className="text-[#47221C] mt-1 flex-shrink-0" />
              <span>{workingHours}</span>
            </div>
          )}
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-[#47221C15] py-4 text-center text-xs text-gray-500 font-light">
        {copyright || (locale === "fa" ? "تمامی حقوق متعلق به شایگان دیزاین می‌باشد." : "All rights reserved by Shaygan Design.")}
      </div>
    </footer>
  );
}
