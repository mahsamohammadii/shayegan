"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getProfile } from "../../../lib/api/profile";
import { getMyOrders } from "../../../lib/api/orders";
import { useLogin } from "../../../app/contexts/LoginContext";
import { useLanguage } from "../../../app/contexts/LanguageContext";
import { BiPackage, BiChevronRight, BiChevronDown, BiChevronUp, BiMessageSquareDetail } from "react-icons/bi";
import { CiUser, CiPhone } from "react-icons/ci";
import LoadingBox from "../../layout/LoadingBox";

const STATUS_MAP = {
  ALL:                     { labelFa: "همه",                labelEn: "All",             bg: "bg-gray-100",    text: "text-gray-800",    border: "border-gray-300"   },
  PENDING_PAYMENT:         { labelFa: "در انتظار پرداخت",  labelEn: "Pending Payment", bg: "bg-amber-50",    text: "text-amber-800",   border: "border-amber-300"   },
  AWAITING_PAYMENT_REVIEW: { labelFa: "در حال بررسی رسید", labelEn: "Payment Review",  bg: "bg-blue-50",     text: "text-blue-800",    border: "border-blue-300"    },
  PAID:                    { labelFa: "پرداخت شده",         labelEn: "Paid",            bg: "bg-emerald-50",  text: "text-emerald-800", border: "border-emerald-300" },
  PROCESSING:              { labelFa: "در حال پردازش",      labelEn: "Processing",      bg: "bg-sky-50",      text: "text-sky-800",     border: "border-sky-300"     },
  SHIPPED:                 { labelFa: "ارسال شده",          labelEn: "Shipped",         bg: "bg-purple-50",   text: "text-purple-800",  border: "border-purple-300"  },
  DELIVERED:               { labelFa: "تحویل داده شده",     labelEn: "Delivered",       bg: "bg-teal-50",     text: "text-teal-800",    border: "border-teal-300"    },
  COMPLETED:               { labelFa: "تکمیل شده",          labelEn: "Completed",       bg: "bg-emerald-100", text: "text-emerald-900", border: "border-emerald-400" },
  CANCELLED:               { labelFa: "لغو شده",            labelEn: "Cancelled",       bg: "bg-red-50",      text: "text-red-800",     border: "border-red-300"     },
  REFUND_REQUESTED:        { labelFa: "درخواست مرجوعی",     labelEn: "Refund Request",  bg: "bg-orange-50",   text: "text-orange-800",  border: "border-orange-300"  },
  REFUNDED:                { labelFa: "مرجوع شده",          labelEn: "Refunded",        bg: "bg-gray-100",    text: "text-gray-600",    border: "border-gray-300"    },
};

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

export default function Sec1Panel({ setActiveTab }) {
  const { getValidToken } = useLogin();
  const { locale } = useLanguage();

  const [profile, setProfile]   = useState(null);
  const [orders, setOrders]     = useState([]);
  const [loadingP, setLoadingP] = useState(true);
  const [loadingO, setLoadingO] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await getValidToken();
        if (!token) return;
        const data = await getProfile(token);
        setProfile(data);
      } catch { /* ignore */ } finally { setLoadingP(false); }
    })();
  }, [getValidToken]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyOrders({ page: 1, limit: 5 });
        setOrders(data?.orders || data?.data || []);
      } catch { /* ignore */ } finally { setLoadingO(false); }
    })();
  }, []);

  const fullName = profile
    ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || (locale === "fa" ? "کاربر" : "User")
    : (locale === "fa" ? "کاربر" : "User");

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" dir={locale === "fa" ? "rtl" : "ltr"} className="space-y-4">

      {/* ── Profile card ── */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-[#47221C]/30 bg-white shadow-sm overflow-hidden">
        <div className={`bg-gradient-to-l from-[#47221C] to-[#7a3929] px-5 py-3 ${locale === "fa" ? "text-right" : "text-left"}`}>
          <p className="text-white/70 text-[12px]">{locale === "fa" ? "خوش آمدید" : "Welcome"}</p>
          <h2 className="text-white font-bold text-[18px]">{loadingP ? "..." : fullName}</h2>
        </div>
        <div className="flex flex-col sm:flex-row sm:gap-8 gap-3 px-5 py-4">
          <div className="flex items-center gap-2 text-[#47221C]">
            <CiUser size={18} className="shrink-0" />
            <span className="text-[14px]">{loadingP ? "..." : fullName}</span>
          </div>
          {profile?.phone && (
            <div className="flex items-center gap-2 text-[#47221C]">
              <CiPhone size={18} className="shrink-0" />
              <span className="text-[14px]" dir="ltr">{profile.phone}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Last 5 orders ── */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-[#47221C]/30 bg-white shadow-sm overflow-hidden">
        {/* Section header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#47221C]/20">
          <h3 className="font-bold text-[#47221C] text-[16px] flex items-center gap-2">
            <BiPackage size={20} />
            {locale === "fa" ? "آخرین سفارشات" : "Recent Orders"}
          </h3>
          <button
            onClick={() => setActiveTab(3)}
            className="flex items-center gap-1 text-[12px] text-[#47221C] hover:underline"
          >
            {locale === "fa" ? "مشاهده همه" : "View All"}
            <BiChevronRight size={16} className={locale === "fa" ? "rotate-180" : ""} />
          </button>
        </div>

        {/* Content */}
        {loadingO ? (
          <div className="py-10 text-center">
             <span className="text-gray-400 text-center text-sm">
               {locale === "fa" ? "در حال بارگذاری..." : "Loading..."}
             </span>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-[13px]">
            <BiPackage className="mx-auto text-4xl mb-2 text-gray-300" />
            {locale === "fa" ? "سفارشی یافت نشد" : "No orders found"}
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {orders.map((ord, i) => {
              const statusConf = STATUS_MAP[ord.status] || STATUS_MAP.ALL;
              const items = ord.items || [];
              const isExpanded = expandedId === ord._id;
              const formattedDate = ord.createdAt
                ? new Date(ord.createdAt).toLocaleDateString(locale === "fa" ? "fa-IR" : "en-US")
                : "";

              // Extract note from the last item of statusHistory if present
              const lastStatusHistory = Array.isArray(ord.statusHistory) && ord.statusHistory.length > 0 
                ? ord.statusHistory[ord.statusHistory.length - 1] 
                : null;
              const rawNote = lastStatusHistory?.note;
              const statusNote = typeof rawNote === "object" && rawNote !== null
                ? (rawNote[locale] || rawNote.fa || rawNote.en || "")
                : (rawNote ? String(rawNote).trim() : "");

              return (
                <motion.div
                  key={ord._id || i}
                  // variants={fadeUp}
                  className="border border-gray-200 rounded-xl overflow-hidden bg-white/80 transition-all shadow-sm hover:shadow-md"
                >
                  {/* Header Row — click to expand */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : ord._id)}
                    className="p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer bg-gray-50/60 hover:bg-gray-100/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}>
                        {locale === "fa" ? statusConf.labelFa : statusConf.labelEn}
                      </span>
                      <span className="text-xs font-bold text-gray-700 font-mono">
                        {locale === "fa" ? "شماره سفارش:" : "Order #:"} {ord.orderNumber || ord._id?.slice(-8)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{locale === "fa" ? "تاریخ:" : "Date:"} {formattedDate}</span>
                      <span className="font-bold text-[#47221C] text-sm font-mono">
                        {new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(ord.total || 0)} {locale === "fa" ? "تومان" : "IRT"}
                      </span>
                      <button className="text-gray-500 hover:text-black">
                        {isExpanded ? <BiChevronUp size={22} /> : <BiChevronDown size={22} />}
                      </button>
                    </div>
                  </div>

                  {/* Status Note Banner (from last statusHistory item) */}
                  {statusNote && (
                    <div className="px-4 py-2.5 bg-amber-50/90 border-t border-amber-200/70 flex items-start sm:items-center gap-2 text-xs text-amber-900">
                      <BiMessageSquareDetail className="text-amber-700 text-base shrink-0 mt-0.5 sm:mt-0" />
                      <span className="font-bold text-amber-950 shrink-0">
                        {locale === "fa" ? "پیام وضعیت سفارش:" : "Status Note:"}
                      </span>
                      <p className="text-amber-800 font-medium leading-relaxed">{statusNote}</p>
                    </div>
                  )}

                  {/* Items quick preview */}
                  <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 overflow-x-auto">
                      {items.slice(0, 4).map((it, idx) => {
                        const imgUrl = it.product?.image?.thumbnailUrl || it.product?.image?.url || it.image || "/images/sandali.png";
                        const itemName = locale === "fa" ? (it.product?.name?.fa || it.name || "محصول") : (it.product?.name?.en || it.name || "Product");
                        return (
                          <div key={idx} className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-lg border text-xs shrink-0">
                            <img src={imgUrl} alt={itemName} className="w-8 h-8 object-contain rounded bg-white" />
                            <span className="truncate max-w-[100px] font-medium text-gray-700">{itemName}</span>
                            <span className="text-gray-400 font-mono">×{it.quantity}</span>
                          </div>
                        );
                      })}
                      {items.length > 4 && (
                        <span className="text-xs text-gray-400 font-mono shrink-0">
                          {locale === "fa" ? `+${items.length - 4} بیشتر` : `+${items.length - 4} more`}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : ord._id)}
                      className="text-xs font-bold text-[#47221C] hover:underline shrink-0"
                    >
                      {isExpanded
                        ? (locale === "fa" ? "بستن جزئیات" : "Close Details")
                        : (locale === "fa" ? "مشاهده جزئیات فاکتور" : "View Invoice Details")}
                    </button>
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-200 p-4 bg-gray-50/40 text-xs space-y-4"
                      >
                        {/* Items list */}
                        <div className="space-y-2">
                          <h5 className="font-bold text-gray-700 mb-2">
                            {locale === "fa" ? "لیست اقلام سفارش:" : "Order Items List:"}
                          </h5>
                          {items.map((it, idx) => {
                            const imgUrl = it.product?.image?.url || it.image || "/images/sandali.png";
                            const itemName = locale === "fa" ? (it.product?.name?.fa || it.name || "محصول") : (it.product?.name?.en || it.name || "Product");
                            return (
                              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-200">
                                <div className="flex items-center gap-3">
                                  <img src={imgUrl} alt={itemName} className="w-12 h-12 object-contain rounded border p-0.5 bg-white" />
                                  <div>
                                    <p className="font-bold text-gray-800">{itemName}</p>
                                    {it.sku && <p className="text-[10px] text-gray-400 font-mono">SKU: {it.sku}</p>}
                                  </div>
                                </div>
                                <div className={`${locale === "fa" ? "text-left" : "text-right"} font-mono`}>
                                  <p className="text-gray-600">{it.quantity} × {new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(it.unitPrice || 0)} {locale === "fa" ? "تومان" : "IRT"}</p>
                                  <p className="font-bold text-[#47221C]">{new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(it.totalPrice || 0)} {locale === "fa" ? "تومان" : "IRT"}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Shipping + Price breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                          {ord.shippingAddress && (
                            <div className="bg-white p-3 rounded-lg border space-y-1">
                              <h5 className="font-bold text-[#47221C] mb-1">
                                {locale === "fa" ? "آدرس تحویل سفارش:" : "Delivery Address:"}
                              </h5>
                              <p className="text-gray-700">{ord.shippingAddress.fullAddress || `${ord.shippingAddress.state || ""} ${ord.shippingAddress.city || ""}`}</p>
                              <p className="text-gray-500">
                                {locale === "fa" ? "تحویل‌گیرنده:" : "Receiver:"} {ord.shippingAddress.fullName} | {locale === "fa" ? "کد پستی:" : "Postal Code:"} {ord.shippingAddress.postalCode}
                              </p>
                            </div>
                          )}
                          <div className="bg-white p-3 rounded-lg border space-y-1 font-mono">
                            <div className="flex justify-between text-gray-600">
                              <span>{locale === "fa" ? "مبلغ اقلام:" : "Items Subtotal:"}</span>
                              <span>{new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(ord.subtotal || 0)} {locale === "fa" ? "تومان" : "IRT"}</span>
                            </div>
                            {ord.shippingCost > 0 && (
                              <div className="flex justify-between text-gray-600">
                                <span>{locale === "fa" ? "هزینه ارسال:" : "Shipping Cost:"}</span>
                                <span>{new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(ord.shippingCost)} {locale === "fa" ? "تومان" : "IRT"}</span>
                              </div>
                            )}
                            {ord.tax > 0 && (
                              <div className="flex justify-between text-gray-600">
                                <span>{locale === "fa" ? "مالیات:" : "Tax:"}</span>
                                <span>{new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(ord.tax)} {locale === "fa" ? "تومان" : "IRT"}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold text-[#47221C] text-sm pt-1 border-t">
                              <span>{locale === "fa" ? "مبلغ نهایی فاکتور:" : "Total Amount:"}</span>
                              <span>{new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(ord.total || 0)} {locale === "fa" ? "تومان" : "IRT"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Note in Expanded Details */}
                        {statusNote && (
                          <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200 text-amber-900 space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-[#47221C]">
                              <BiMessageSquareDetail className="text-amber-700 text-sm" />
                              <span>{locale === "fa" ? "توضیحات آخرین تغییر وضعیت سفارش:" : "Latest Status Update Note:"}</span>
                            </div>
                            <p className="text-xs text-amber-800 leading-relaxed font-medium">{statusNote}</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

    </motion.div>
  );
}
