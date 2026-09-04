"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getMyOrders } from "../../../lib/api/orders";
import { useLanguage } from "../../../app/contexts/LanguageContext";
import { BiPackage, BiTimeFive, BiCheckCircle, BiXCircle, BiChevronDown, BiChevronUp, BiChevronRight, BiChevronLeft, BiMessageSquareDetail } from "react-icons/bi";
import LoadingBox from "../../layout/LoadingBox";

const STATUS_MAP = {
  ALL: { labelFa: "همه سفارش‌ها", labelEn: "All Orders", bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-300" },
  PENDING_PAYMENT: { labelFa: "در انتظار پرداخت", labelEn: "Pending Payment", bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-300" },
  AWAITING_PAYMENT_REVIEW: { labelFa: "در حال بررسی رسید", labelEn: "Payment Review", bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-300" },
  PAID: { labelFa: "پرداخت شده", labelEn: "Paid", bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-300" },
  PROCESSING: { labelFa: "در حال پردازش", labelEn: "Processing", bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-300" },
  SHIPPED: { labelFa: "ارسال شده", labelEn: "Shipped", bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-300" },
  DELIVERED: { labelFa: "تحویل داده شده", labelEn: "Delivered", bg: "bg-teal-50", text: "text-teal-800", border: "border-teal-300" },
  COMPLETED: { labelFa: "تکمیل شده", labelEn: "Completed", bg: "bg-emerald-100", text: "text-emerald-900", border: "border-emerald-400" },
  CANCELLED: { labelFa: "لغو شده", labelEn: "Cancelled", bg: "bg-red-50", text: "text-red-800", border: "border-red-300" },
  REFUND_REQUESTED: { labelFa: "درخواست مرجوعی", labelEn: "Refund Requested", bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-300" },
  REFUNDED: { labelFa: "مرجوع شده", labelEn: "Refunded", bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-300" },
};

const STATUS_KEYS = [
  "ALL",
  "PENDING_PAYMENT",
  "AWAITING_PAYMENT_REVIEW",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "REFUND_REQUESTED",
  "REFUNDED"
];

export default function Sec3Panel() {
  const { locale } = useLanguage();

  const [orders, setOrders]       = useState([]);
  const [meta, setMeta]           = useState({ total: 0, page: 1, limit: 5, totalPages: 1, statusCounts: {} });
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const fetchOrders = useCallback(async (selectedStatus, p) => {
    setLoading(true);
    try {
      const data = await getMyOrders({
        status: selectedStatus === "ALL" ? undefined : selectedStatus,
        page: p,
        limit: 5,
      });
      setOrders(data.orders || []);
      setMeta(data.meta || { total: 0, page: p, limit: 5, totalPages: 1, statusCounts: {} });
    } catch (err) {
      console.error("Fetch orders error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(statusFilter, page);
  }, [statusFilter, page, fetchOrders]);

  const handleTabChange = (st) => {
    setStatusFilter(st);
    setPage(1);
  };

  const statusCounts = meta?.statusCounts || {};
  const totalAllCount = Object.values(statusCounts).reduce((a, b) => a + (Number(b) || 0), 0);

  // Calculate total pages based on meta.totalPages or calculate from count and limit (5)
  const currentTabCount = statusFilter === "ALL" ? (meta.total || totalAllCount) : (statusCounts[statusFilter] ?? meta.total ?? 0);
  const totalPages = meta.totalPages || Math.ceil((currentTabCount || 1) / 5) || 1;

  return (
    <div dir={locale === "fa" ? "rtl" : "ltr"} className="border border-[#47221C] rounded-2xl p-4 md:p-6 bg-white/70 backdrop-blur-md shadow-sm">
      <h6 className="md:text-xl text-base font-bold text-[#47221C] p-3 rounded-xl border border-[#47221C30] text-center mb-6 bg-[#47221C08]">
        {locale === "fa" ? "سفارشات شما" : "Your Orders"}
      </h6>

      {/* Status Tabs with Badges */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-thin scrollbar-thumb-gray-300">
        {STATUS_KEYS.map((key) => {
          const conf = STATUS_MAP[key] || STATUS_MAP.ALL;
          const isActive = statusFilter === key;

          return (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                isActive
                  ? "bg-[#47221C] text-white border-[#47221C] shadow-sm"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
              }`}
            >
              {locale === "fa" ? conf.labelFa : conf.labelEn}
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-12 text-center">
          <span className="text-gray-400 text-center text-sm">
            {locale === "fa" ? "در حال بارگذاری..." : "Loading..."}
          </span>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-xl text-gray-400">
          <BiPackage className="mx-auto text-4xl mb-2 text-gray-300" />
          <p className="text-sm font-medium">
            {locale === "fa" ? "هیچ سفارشی در این وضعیت یافت نشد." : "No orders found in this status."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => {
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
              <div
                key={ord._id}
                className="border border-gray-200 rounded-xl overflow-hidden bg-white/80 transition-all shadow-sm hover:shadow-md"
              >
                {/* Header Row */}
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

                {/* Main Items Quick Preview */}
                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {items.slice(0, 4).map((it, idx) => {
                      const imgUrl = it.product?.image?.thumbnailUrl || it.product?.image?.url || it.image || "/images/sandali.png";
                      const itemName = locale === "fa" ? (it.product?.name?.fa || it.name || "محصول") : (it.product?.name?.en || it.name || "Product");
                      return (
                        <div key={idx} className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-lg border text-xs shrink-0">
                          <img src={imgUrl} alt={itemName} className="w-8 h-8 object-contain rounded bg-white" />
                          <span className="truncate max-w-[120px] font-medium text-gray-700">{itemName}</span>
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

                {/* Expanded Details Section */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-200 p-4 bg-gray-50/40 text-xs space-y-4"
                    >
                      {/* Items List Table */}
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

                      {/* Shipping Address & Breakdown */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                        {ord.shippingAddress && (
                          <div className="bg-white p-3 rounded-lg border space-y-1">
                            <h5 className="font-bold text-[#47221C] mb-1">
                              {locale === "fa" ? "آدرس تحویل سفارش:" : "Delivery Address:"}
                            </h5>
                            <p className="text-gray-700">{ord.shippingAddress.fullAddress || `${ord.shippingAddress.state || ''} ${ord.shippingAddress.city || ''}`}</p>
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
              </div>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6 pb-2" dir="ltr">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Previous Page"
              >
                <BiChevronLeft size={20} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-xs font-bold font-mono transition-all border ${
                    p === page
                      ? "bg-[#47221C] text-white border-[#47221C] shadow-sm"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Next Page"
              >
                <BiChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
