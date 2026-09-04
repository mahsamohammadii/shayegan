"use client";
import { motion } from "framer-motion";
import {
  FaTelegramPlane, FaWhatsapp, FaInstagram, FaTwitter,
  FaFacebookF, FaLinkedinIn, FaYoutube,
  FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaClock
} from "react-icons/fa";
import { BsChatDots, BsClockHistory } from "react-icons/bs";
import { useLanguage } from "../../../app/contexts/LanguageContext";
import { useContent } from "../../../app/contexts/ContentContext";

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

const SOCIAL_ICONS = {
  instagram: FaInstagram,
  telegram:  FaTelegramPlane,
  whatsapp:  FaWhatsapp,
  twitter:   FaTwitter,
  facebook:  FaFacebookF,
  linkedin:  FaLinkedinIn,
  youtube:   FaYoutube,
};

/** Safely extract a localised string from a field that may be a plain string or {fa, en} object */
function localStr(field, locale, fallback = "") {
  if (!field) return fallback;
  if (typeof field === "string") return field;
  if (typeof field === "object") {
    return field[locale] || field.fa || field.en || fallback;
  }
  return fallback;
}

export default function Sec5Panel() {
  const { locale } = useLanguage();
  const { getByKey } = useContent();

  const contactInfo   = getByKey("contact-info");
  const socialContent = getByKey("social-links");

  // ── phones ──────────────────────────────────────────────────────────────────
  // phones can be: string[], {fa,en}[], or a single string in phone field
  const rawPhones = contactInfo?.fields?.phones
    || (contactInfo?.fields?.phone ? [contactInfo.fields.phone] : []);
  const phones = rawPhones.map(p => localStr(p, locale)).filter(Boolean);

  // ── emails ──────────────────────────────────────────────────────────────────
  const rawEmails = contactInfo?.fields?.emails
    || (contactInfo?.fields?.email ? [contactInfo.fields.email] : []);
  const emails = rawEmails.map(e => localStr(e, locale)).filter(Boolean);

  // ── address ─────────────────────────────────────────────────────────────────
  const address = localStr(
    contactInfo?.fields?.address,
    locale,
    locale === "fa" ? "تهران، خیابان ولیعصر" : "Tehran, Valiasr St."
  );

  // ── working hours ────────────────────────────────────────────────────────────
  const workingHours = localStr(
    contactInfo?.fields?.workingHours,
    locale,
    locale === "fa" ? "شنبه تا پنج‌شنبه: ۹ صبح الی ۹ شب" : "Sat - Thu: 9 AM - 9 PM"
  );

  // ── social links ─────────────────────────────────────────────────────────────
  const socialLinks = socialContent?.links || [];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" dir={locale === "fa" ? "rtl" : "ltr"} className="space-y-4">

      {/* ─── Header card ─── */}
      <motion.div
        variants={fadeUp}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0D1828] to-[#1e3456] p-6 text-white shadow-xl"
      >
        <div className="absolute -top-10 -left-10 w-44 h-44 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-[#786548]/20 rounded-full" />

        <div className="relative flex items-start justify-between">
          <div>
            <h2 className="text-[20px] font-bold mb-1">
              {locale === "fa" ? "ارتباط با پشتیبانی" : "Customer Support"}
            </h2>
            <p className="text-white/60 text-[13px]">
              {locale === "fa"
                ? "تیم پشتیبانی ما همواره آماده پاسخگویی به سوالات شماست"
                : "Our support team is always ready to answer your questions"}
            </p>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <BsChatDots size={22} className="text-white" />
          </div>
        </div>

        <div className="relative mt-5 flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 w-fit">
          <BsClockHistory size={14} className="text-[#F0BD92]" />
          <span className="text-[12px] text-white/80">
            {locale === "fa" ? "ساعت پاسخگویی: " : "Working Hours: "}
            {workingHours}
          </span>
        </div>
      </motion.div>

      {/* ─── Contact info cards: stacked on mobile (grid-cols-1), side-by-side on desktop (md:grid-cols-3) ─── */}
      <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Phone */}
        {phones.length > 0 && (
          <motion.div variants={fadeUp} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-[#786548]/30 transition-all duration-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#47221C]/8 rounded-xl flex items-center justify-center text-[#47221C] shrink-0 mt-0.5">
                <FaPhoneAlt size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-gray-400 font-medium mb-1">
                  {locale === "fa" ? "تلفن تماس" : "Phone"}
                </p>
                <div className="space-y-0.5">
                  {phones.map((p, i) => (
                    <a
                      key={i}
                      href={`tel:${p.replace(/\s+/g, "")}`}
                      dir="ltr"
                      className={`block text-[13px] text-gray-800 font-semibold hover:text-[#47221C] transition-colors ${locale === "fa" ? "text-right" : "text-left"}`}
                    >
                      {p}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Email */}
        {emails.length > 0 && (
          <motion.div variants={fadeUp} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-[#786548]/30 transition-all duration-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#47221C]/8 rounded-xl flex items-center justify-center text-[#47221C] shrink-0 mt-0.5">
                <FaEnvelope size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-gray-400 font-medium mb-1">
                  {locale === "fa" ? "ایمیل" : "Email"}
                </p>
                <div className="space-y-0.5">
                  {emails.map((e, i) => (
                    <a
                      key={i}
                      href={`mailto:${e.trim()}`}
                      dir="ltr"
                      className={`block text-[13px] text-gray-800 font-semibold hover:text-[#47221C] transition-colors truncate ${locale === "fa" ? "text-right" : "text-left"}`}
                    >
                      {e}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Address */}
        {address && (
          <motion.div variants={fadeUp} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-[#786548]/30 transition-all duration-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#47221C]/8 rounded-xl flex items-center justify-center text-[#47221C] shrink-0 mt-0.5">
                <FaMapMarkerAlt size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-gray-400 font-medium mb-1">
                  {locale === "fa" ? "آدرس" : "Address"}
                </p>
                <p className="text-[13px] text-gray-800 font-semibold leading-relaxed">
                  {address}
                </p>
              </div>
            </div>
          </motion.div>
        )}

      </motion.div>

      {/* ─── Social networks ─── */}
      {socialLinks.length > 0 && (
        <motion.div variants={fadeUp} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h3 className="text-[14px] font-bold text-gray-800 mb-4">
            {locale === "fa" ? "شبکه‌های اجتماعی" : "Social Media"}
          </h3>
          <div className="flex flex-wrap gap-3">
            {socialLinks.map((s, i) => {
              const platformKey = (s.platform || "").toLowerCase();
              const Icon = SOCIAL_ICONS[platformKey] || FaInstagram;
              const label = localStr(s.label, locale, s.platform || "");
              return (
                <a
                  key={i}
                  href={s.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#47221C] hover:bg-[#341813] text-white px-4 py-2.5 rounded-xl text-[13px] font-medium shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
                >
                  <Icon size={16} />
                  {/* {label} */}
                </a>
              );
            })}
          </div>
        </motion.div>
      )}

    </motion.div>
  );
}
