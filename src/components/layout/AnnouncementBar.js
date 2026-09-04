"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useContent } from "../../app/contexts/ContentContext";
import { useLanguage } from "../../app/contexts/LanguageContext";

const SESSION_KEY = "ann_closed";
const AUTO_HIDE_MS = 8000; // Auto-hide after 8 seconds

export default function AnnouncementBar() {
  const { getByKey } = useContent();
  const { locale }   = useLanguage();
  const [visible, setVisible] = useState(false);
  const [text, setText]       = useState("");

  useEffect(() => {
    // Don't show again if user already closed it this session
    if (typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY)) return;

    const headerContent = getByKey("header");
    if (!headerContent) return;

    const ann = headerContent.fields?.announcement;
    const body = headerContent.body;
    const title = headerContent.title;

    let msg = "";
    if (typeof ann === 'object' && ann !== null) {
      msg = ann[locale] || ann.fa || ann.en || "";
    } else if (typeof ann === 'string' && ann.trim()) {
      msg = ann;
    }

    if (!msg) {
      if (typeof body === 'object' && body !== null) {
        msg = body[locale] || body.fa || body.en || "";
      } else if (typeof body === 'string' && body.trim()) {
        msg = body;
      }
    }

    if (!msg) {
      if (typeof title === 'object' && title !== null) {
        msg = title[locale] || title.fa || title.en || "";
      } else if (typeof title === 'string' && title.trim()) {
        msg = title;
      }
    }

    // Clean HTML tags if any present
    const cleanMsg = (msg || "").replace(/<[^>]*>?/gm, '').trim();
    if (!cleanMsg) return;

    setText(cleanMsg);
    setVisible(true);

    const timer = setTimeout(() => setVisible(false), AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [getByKey, locale]);

  const close = () => {
    setVisible(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(SESSION_KEY, "1");
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="announcement"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 24 }}
          dir={locale === "fa" ? "rtl" : "ltr"}
          className="fixed top-0 left-0 right-0 z-[99999] flex items-center justify-between px-6 py-2 bg-white/40 backdrop-blur-md border-b border-gray-300/40 text-[#363635] shadow-sm"
        >
          <div className="w-6" />
          <p className="text-center font-medium text-xs md:text-sm tracking-wide">
            {text}
          </p>
          <button
            onClick={close}
            className="text-[#363635]/70 hover:text-black transition-colors text-base font-bold w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/5"
            aria-label="close announcement"
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
