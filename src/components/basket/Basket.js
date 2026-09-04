"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from 'next/navigation';
import { BiTrash, BiShoppingBag, BiCheck, BiTimeFive, BiUpload, BiUser, BiMap, BiCreditCard, BiPlus, BiPackage, BiXCircle } from "react-icons/bi";
import { FaCheckCircle, FaExclamationTriangle, FaMapMarkerAlt } from "react-icons/fa";
import { useLanguage } from "../../app/contexts/LanguageContext";
import { useLogin } from "../../app/contexts/LoginContext";
import { useCart } from "../../app/contexts/CartContext";
import { getCart, updateCartItem, deleteCartItem } from "../../lib/api/cart";
import { getProfile, updateProfile, getAddresses, createAddress } from "../../lib/api/profile";
import { getProvinces, getCities } from "../../lib/api/locations";
import { initiateCheckout, uploadManualReceipt } from "../../lib/api/checkout";
import { getMyOrders, cancelOrder } from "../../lib/api/orders";
import LoadingBox from "../layout/LoadingBox";
import Footer2 from "../layout/Footer2";

const boxVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

// ─── Payment Countdown Timer ──────────────────────────────────────────────────
function PaymentTimer({ expiresAt, onExpire }) {
  const { locale } = useLanguage();
  const [timeLeft, setTimeLeft] = useState(0);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (!expiresAt) return;

    const targetTime = new Date(expiresAt).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((targetTime - now) / 1000));
      setTimeLeft(diff);
      if (diff <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        if (onExpire) {
          onExpire();
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isUrgent = timeLeft < 300; // less than 5 mins

  return (
    <div className={`p-3.5 sm:p-4 rounded-xl border flex items-center justify-between font-mono gap-2 ${
      isUrgent ? 'bg-red-50 border-red-300 text-red-800 animate-pulse' : 'bg-amber-50 border-amber-300 text-amber-900'
    }`}>
      <div className="flex items-center gap-2 min-w-0">
        <BiTimeFive className="text-lg sm:text-xl shrink-0" />
        <span className="text-[11px] sm:text-xs md:text-sm font-sans font-medium truncate">
          {locale === "fa" ? "مهلت پرداخت تا انقضای سفارش:" : "Payment deadline until order expiry:"}
        </span>
      </div>
      <span className="text-base sm:text-lg md:text-xl font-bold tracking-widest shrink-0" dir="ltr">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}

// ─── Cancel Order Confirmation Modal ──────────────────────────────────────────
function CancelOrderModal({ isOpen, onClose, onConfirm, isLoading, locale }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        dir={locale === "fa" ? "rtl" : "ltr"}
        className="w-full max-w-sm bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-gray-100 text-center space-y-4 sm:space-y-5"
      >
        <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl sm:text-2xl shadow-inner">
          <FaExclamationTriangle />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900">
            {locale === "fa" ? "آیا از لغو این سفارش اطمینان دارید؟" : "Are you sure you want to cancel?"}
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
            {locale === "fa"
              ? "پس از لغو، این سفارش باطل خواهد شد و می‌توانید سفارش جدیدی ثبت فرمایید."
              : "Once cancelled, this order will be revoked and you can place a new order."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {locale === "fa" ? "انصراف" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading 
              ? (locale === "fa" ? "در حال لغو..." : "Cancelling...") 
              : (locale === "fa" ? "بله، لغو شود" : "Yes, Cancel")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Address Form Modal ───────────────────────────────────────────────────────
function AddressModal({ onSave, onClose, isLoading, error }) {
  const { locale } = useLanguage();
  const [form, setForm] = useState({
    label: "",
    fullName: "",
    phone: "",
    fullAddress: "",
    city: "",
    state: "",
    provinceId: null,
    cityId: null,
    postalCode: "",
    country: "ir",
    isDefault: true,
  });

  const [provinces, setProvinces] = useState([]);
  const [cities, setCities]       = useState([]);
  const [provLoading, setProvLoading] = useState(true);
  const [cityLoading, setCityLoading] = useState(false);

  useEffect(() => {
    getProvinces()
      .then(setProvinces)
      .catch(() => setProvinces([]))
      .finally(() => setProvLoading(false));
  }, []);

  const handleProvinceChange = (e) => {
    const provId = Number(e.target.value);
    const prov = provinces.find(p => p.id === provId);
    setForm(prev => ({
      ...prev,
      provinceId: provId,
      state: prov?.name || "",
      cityId: null,
      city: "",
    }));
    if (provId) {
      setCityLoading(true);
      getCities(provId)
        .then(setCities)
        .catch(() => setCities([]))
        .finally(() => setCityLoading(false));
    } else {
      setCities([]);
    }
  };

  const handleCityChange = (e) => {
    const cId = Number(e.target.value);
    const c = cities.find(ct => ct.id === cId);
    setForm(prev => ({
      ...prev,
      cityId: cId,
      city: c?.name || "",
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div dir={locale === "fa" ? "rtl" : "ltr"} className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-4 sm:p-6 border border-[#47221C30]">
        <h3 className={`text-base sm:text-lg font-bold text-[#47221C] mb-4 border-b pb-2 ${locale === "fa" ? "text-right" : "text-left"}`}>
          {locale === "fa" ? "افزودن آدرس جدید پستی" : "Add New Postal Address"}
        </h3>

        {error && <p className="text-xs sm:text-sm text-red-600 mb-4 bg-red-50 p-2.5 rounded-lg border border-red-200">{error}</p>}

        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-700">
                {locale === "fa" ? "برچسب آدرس *" : "Address Label *"}
              </label>
              <input
                value={form.label}
                onChange={e => setForm({ ...form, label: e.target.value })}
                placeholder={locale === "fa" ? "خانه، محل کار..." : "Home, Office..."}
                className="w-full px-3 py-2 text-xs sm:text-sm border rounded-lg outline-none focus:border-[#47221C]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-700">
                {locale === "fa" ? "کشور *" : "Country *"}
              </label>
              <input
                value="ir"
                disabled
                readOnly
                className="w-full px-3 py-2 text-xs sm:text-sm border rounded-lg bg-gray-100 text-gray-500 font-mono cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-700">
                {locale === "fa" ? "نام گیرنده *" : "Recipient Full Name *"}
              </label>
              <input
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                placeholder={locale === "fa" ? "نام کامل" : "Full Name"}
                className="w-full px-3 py-2 text-xs sm:text-sm border rounded-lg outline-none focus:border-[#47221C]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-700">
                {locale === "fa" ? "شماره تماس گیرنده *" : "Recipient Phone Number *"}
              </label>
              <input
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="09123456789"
                dir="ltr"
                className="w-full px-3 py-2 text-xs sm:text-sm border rounded-lg outline-none focus:border-[#47221C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-700">
              {locale === "fa" ? "آدرس کامل پستی *" : "Full Street Address *"}
            </label>
            <textarea
              rows={3}
              value={form.fullAddress}
              onChange={e => setForm({ ...form, fullAddress: e.target.value })}
              placeholder={locale === "fa" ? "خیابان، کوچه، پلاک، واحد..." : "Street, alley, building, unit..."}
              className="w-full px-3 py-2 text-xs sm:text-sm border rounded-lg outline-none focus:border-[#47221C] resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-700">
                {locale === "fa" ? "استان *" : "Province *"}
              </label>
              <select
                value={form.provinceId || ""}
                onChange={handleProvinceChange}
                className="w-full px-3 py-2 text-xs sm:text-sm border rounded-lg outline-none focus:border-[#47221C] bg-white"
              >
                <option value="">
                  {provLoading 
                    ? (locale === "fa" ? "در حال بارگذاری..." : "Loading...") 
                    : (locale === "fa" ? "انتخاب استان" : "Select Province")}
                </option>
                {provinces.map(p => (
                  <option key={p.id} value={p.id}>
                    {typeof p.name === 'object' ? (p.name[locale] || p.name.fa || p.name.en) : p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-700">
                {locale === "fa" ? "شهر *" : "City *"}
              </label>
              <select
                value={form.cityId || ""}
                onChange={handleCityChange}
                disabled={!form.provinceId || cityLoading}
                className="w-full px-3 py-2 text-xs sm:text-sm border rounded-lg outline-none focus:border-[#47221C] bg-white disabled:bg-gray-100"
              >
                <option value="">
                  {cityLoading 
                    ? (locale === "fa" ? "در حال بارگذاری..." : "Loading...") 
                    : (locale === "fa" ? "انتخاب شهر" : "Select City")}
                </option>
                {cities.map(c => (
                  <option key={c.id} value={c.id}>
                    {typeof c.name === 'object' ? (c.name[locale] || c.name.fa || c.name.en) : c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-700">
              {locale === "fa" ? "کد پستی ۱۰ رقمی *" : "Postal Code (10 digits) *"}
            </label>
            <input
              value={form.postalCode}
              onChange={e => setForm({ ...form, postalCode: e.target.value })}
              placeholder="1234567890"
              dir="ltr"
              maxLength={10}
              className="w-full px-3 py-2 text-xs sm:text-sm border rounded-lg outline-none focus:border-[#47221C]"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-2">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={e => setForm({ ...form, isDefault: e.target.checked })}
              className="w-4 h-4 accent-[#47221C] shrink-0"
            />
            <span className="text-xs text-gray-700">
              {locale === "fa" ? "تنظیم به عنوان آدرس پیش‌فرض جهت سفارشات بعدی" : "Set as default address for future orders"}
            </span>
          </label>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 border border-gray-300 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-colors text-xs sm:text-sm"
          >
            {locale === "fa" ? "انصراف" : "Cancel"}
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={isLoading}
            className="w-full sm:flex-1 bg-[#47221C] text-white py-2.5 rounded-xl font-bold hover:bg-[#341813] transition-colors disabled:opacity-50 text-xs sm:text-sm shadow-sm"
          >
            {isLoading 
              ? (locale === "fa" ? "در حال ثبت..." : "Saving...") 
              : (locale === "fa" ? "ذخیره آدرس" : "Save Address")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Basket Component ─────────────────────────────────────────────────────
export default function Basket() {
  const router = useRouter();
  const { locale } = useLanguage();
  const { isLoggedIn, isAuthLoading } = useLogin();
  const { refreshCart } = useCart();

  /** Checkout Step: 1 = Cart List, 2 = Identity & Address Selection, 3 = Payment & Manual Receipt */
  const [step, setStep] = useState(1);

  // Cart & Feedback State
  const [cartData, setCartData] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState(null);

  // Step 2 Profile & Address State
  const [profile, setProfile]             = useState(null);
  const [profileForm, setProfileForm]     = useState({ firstName: "", lastName: "", phone: "" });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  const [addresses, setAddresses]         = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressModal, setShowAddressModal]   = useState(false);
  const [addressModalLoading, setAddressModalLoading] = useState(false);
  const [addressModalError, setAddressModalError]     = useState("");
  const [orderNotes, setOrderNotes]                   = useState("");

  // Step 3 Checkout & Receipt State
  const [checkoutData, setCheckoutData]       = useState(null); // { orderId, total, expiresAt, ... }
  const [isInitiating, setIsInitiating]       = useState(false);
  const [receiptFile, setReceiptFile]         = useState(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [receiptSuccess, setReceiptSuccess]   = useState(false);
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // ─── Load Cart Data & Check Pending Payment Order ───────────────────────────
  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      if (!isLoggedIn) {
        setCartData(null);
        setLoading(false);
        return;
      }

      // 1. Check if user already has an order in PENDING_PAYMENT status (without page/limit)
      try {
        const myOrdersData = await getMyOrders();
        const ordersList = myOrdersData?.orders || [];
        const pendingOrder = ordersList.find(ord => ord.status === 'PENDING_PAYMENT');

        if (pendingOrder) {
          // Check if order is still within active payment window
          const isExpired = pendingOrder.expiresAt ? new Date(pendingOrder.expiresAt).getTime() < Date.now() : false;

          if (!isExpired) {
            setCheckoutData({
              orderId: pendingOrder._id || pendingOrder.id || pendingOrder.orderNumber,
              orderNumber: pendingOrder.orderNumber,
              total: pendingOrder.total,
              expiresAt: pendingOrder.expiresAt,
              currency: pendingOrder.currency,
              items: pendingOrder.items || [],
              shippingAddress: pendingOrder.shippingAddress,
              billingAddress: pendingOrder.billingAddress,
              ...pendingOrder,
            });
            setStep(3);
            setLoading(false);
            return;
          }
        }
      } catch (orderErr) {
        console.error("Error checking pending payment orders:", orderErr);
      }

      // 2. If no pending payment order, load active shopping cart as normal
      const data = await getCart();
      setCartData(data);
      setStep(1);
    } catch (err) {
      console.error("Fetch cart error:", err);
      setCartData(null);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isAuthLoading) {
      fetchCart();
    }
  }, [isAuthLoading, fetchCart]);

  // Helper for localized price formatting
  const formatPrice = (amount) => {
    const num = Number(amount) || 0;
    const formatted = new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(num);
    return `${formatted} ${locale === "fa" ? "تومان" : "IRT"}`;
  };

  // Helper for localized product name
  const getItemName = (item) => {
    const p = item?.product || {};
    if (typeof p.name === 'object' && p.name !== null) {
      return p.name[locale] || p.name.fa || p.name.en || "";
    }
    if (typeof item?.name === 'object' && item.name !== null) {
      return item.name[locale] || item.name.fa || item.name.en || "";
    }
    if (locale === "fa") {
      return p.name?.fa || p.name || item?.name || "محصول";
    }
    return p.name?.en || p.name || item?.name || "Product";
  };

  // Helper for real product image with fallback to site logo (no fake mock image)
  const getItemImage = (item) => {
    const p = item?.product || {};
    // 1. Check product-level image
    if (typeof p.image === 'string' && p.image.trim()) return p.image.trim();
    if (typeof p.image?.url === 'string' && p.image.url.trim()) return p.image.url.trim();
    if (Array.isArray(p.images) && p.images.length > 0) {
      const first = p.images[0];
      if (typeof first === 'string' && first.trim()) return first.trim();
      if (typeof first?.url === 'string' && first.url.trim()) return first.url.trim();
    }
    // 2. Check item-level image (snapshot from order / cart items)
    if (typeof item?.image === 'string' && item.image.trim()) return item.image.trim();
    if (typeof item?.image?.url === 'string' && item.image.url.trim()) return item.image.url.trim();
    if (Array.isArray(item?.images) && item.images.length > 0) {
      const first = item.images[0];
      if (typeof first === 'string' && first.trim()) return first.trim();
      if (typeof first?.url === 'string' && first.url.trim()) return first.url.trim();
    }
    // 3. Check alternative keys
    if (typeof p.imageUrl === 'string' && p.imageUrl.trim()) return p.imageUrl.trim();
    if (typeof item?.imageUrl === 'string' && item.imageUrl.trim()) return item.imageUrl.trim();
    return "/images/logo.png";
  };

  // ─── Step 1 Actions: Quantity Increase with Stock Control ─────────────────────
  const handleIncrease = async (itemId, currentQty, availableStock) => {
    if (availableStock !== undefined && currentQty >= availableStock) {
      setToast({ type: 'error', message: locale === 'fa' ? `موجودی این کالا کافی نیست (سقف موجودی: ${availableStock})` : `Not enough stock available (Max: ${availableStock})` });
      setTimeout(() => setToast(null), 3500);
      return;
    }

    try {
      const updatedCart = await updateCartItem(itemId, { quantity: currentQty + 1 });
      setCartData(updatedCart);
      setToast({ type: 'success', message: locale === 'fa' ? 'تعداد محصول ویرایش شد.' : 'Cart quantity updated.' });
      setTimeout(() => setToast(null), 2500);
    } catch (err) {
      console.error("Increase item qty error:", err);
      // Handle 400 Bad Request stock overflow
      const isStockError = err?.status === 400 || err?.data?.message?.includes("stock") || err?.message?.includes("موجودی");
      const msg = isStockError 
        ? (locale === 'fa' ? 'موجودی این کالا کافی نیست' : 'Not enough stock for this item.')
        : (err.message || (locale === 'fa' ? 'خطا در ویرایش سبد خرید' : 'Failed to update cart'));
      setToast({ type: 'error', message: msg });
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleDecrease = async (itemId, currentQty) => {
    if (currentQty <= 1) {
      await handleDelete(itemId);
      return;
    }
    try {
      const updatedCart = await updateCartItem(itemId, { quantity: currentQty - 1 });
      setCartData(updatedCart);
      setToast({ type: 'success', message: locale === 'fa' ? 'تعداد محصول ویرایش شد.' : 'Cart quantity updated.' });
      setTimeout(() => setToast(null), 2500);
    } catch (err) {
      console.error("Decrease item qty error:", err);
      setToast({ type: 'error', message: err.message || (locale === 'fa' ? 'خطا در ویرایش سبد خرید' : 'Failed to update cart') });
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleDelete = async (itemId) => {
    try {
      const updatedCart = await deleteCartItem(itemId);
      setCartData(updatedCart);
      setToast({ type: 'info', message: locale === 'fa' ? 'کالا از سبد خرید حذف شد.' : 'Item removed from cart.' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error("Delete item error:", err);
      setToast({ type: 'error', message: err.message || (locale === 'fa' ? 'خطا در حذف کالا' : 'Failed to delete item') });
      setTimeout(() => setToast(null), 4000);
    }
  };

  // ─── Step 2 Load Profile & Address Data ──────────────────────────────────────
  const loadStep2Data = useCallback(async () => {
    try {
      const prof = await getProfile();
      setProfile(prof);
      setProfileForm({
        firstName: prof.firstName || "",
        lastName: prof.lastName || "",
        phone: prof.phone || "",
      });

      const addrs = await getAddresses();
      setAddresses(addrs || []);
      
      const defaultAddr = addrs?.find(a => a.isDefault) || addrs?.[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr._id);
      }
    } catch (err) {
      console.error("Error loading Step 2 profile/address data:", err);
    }
  }, []);

  useEffect(() => {
    if (step === 2) {
      loadStep2Data();
    }
  }, [step, loadStep2Data]);

  // Handle Profile Update in Step 2
  const handleSaveProfile = async () => {
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim() || !profileForm.phone.trim()) {
      setToast({ type: 'error', message: locale === 'fa' ? 'لطفاً نام، نام خانوادگی و شماره تماس را تکمیل فرمایید.' : 'Please fill in your first name, last name, and phone number.' });
      setTimeout(() => setToast(null), 3500);
      return;
    }
    setIsUpdatingProfile(true);
    try {
      const updated = await updateProfile(profileForm);
      setProfile(updated);
      setToast({ type: 'success', message: locale === 'fa' ? 'اطلاعات هویت با موفقیت بروزرسانی شد.' : 'Profile details updated successfully.' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ type: 'error', message: err.message || (locale === 'fa' ? 'خطا در ویرایش اطلاعات پروفایل' : 'Failed to update profile') });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle Create Address in Step 2 Modal
  const handleSaveAddress = async (formData) => {
    setAddressModalError("");
    if (!formData.label?.trim() || !formData.fullName?.trim() || !formData.phone?.trim() || !formData.fullAddress?.trim() || !formData.provinceId || !formData.cityId || !formData.postalCode?.trim()) {
      setAddressModalError(locale === 'fa' ? "لطفاً تمامی فیلدهای الزامی فرم آدرس را تکمیل نمایید." : "Please fill in all required address fields.");
      return;
    }

    setAddressModalLoading(true);
    try {
      const created = await createAddress({
        ...formData,
        country: "ir",
      });
      setShowAddressModal(false);
      const updatedList = await getAddresses();
      setAddresses(updatedList || []);
      setSelectedAddressId(created._id || updatedList?.[0]?._id);
      setToast({ type: 'success', message: locale === 'fa' ? 'آدرس جدید با موفقیت اضافه شد.' : 'New address added successfully.' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setAddressModalError(err.message || (locale === 'fa' ? "خطا در افزودن آدرس" : "Failed to add address"));
    } finally {
      setAddressModalLoading(false);
    }
  };

  // ─── Initiate Checkout (Move from Step 2 to Step 3) ─────────────────────────
  const handleInitiateCheckout = async () => {
    const isProfileIncomplete = !profile?.firstName?.trim() || !profile?.lastName?.trim() || !profile?.phone?.trim();
    if (isProfileIncomplete) {
      setToast({ type: 'error', message: locale === 'fa' ? 'لطفاً ابتدا نام و تلفن خود را در کادر اطلاعات کاربری تکمیل فرمایید.' : 'Please complete your name and phone number in user info.' });
      setTimeout(() => setToast(null), 4000);
      return;
    }

    if (!selectedAddressId || addresses.length === 0) {
      setToast({ type: 'error', message: locale === 'fa' ? 'لطفاً آدرس تحویل سفارش را انتخاب یا اضافه کنید.' : 'Please select or add a shipping address.' });
      setTimeout(() => setToast(null), 4000);
      return;
    }

    const selectedAddr = addresses.find(a => (a._id === selectedAddressId || a.id === selectedAddressId)) || addresses[0];

    const addressData = {
      label: selectedAddr?.label || "",
      fullName: selectedAddr?.fullName || (profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : ""),
      phone: selectedAddr?.phone || profile?.phone || "",
      fullAddress: selectedAddr?.fullAddress || "",
      city: selectedAddr?.city || "",
      state: selectedAddr?.state || "",
      provinceId: selectedAddr?.provinceId !== undefined && selectedAddr?.provinceId !== null ? Number(selectedAddr.provinceId) : 1,
      cityId: selectedAddr?.cityId !== undefined && selectedAddr?.cityId !== null ? Number(selectedAddr.cityId) : 1,
      postalCode: selectedAddr?.postalCode || "",
      country: selectedAddr?.country || "ir",
      isDefault: selectedAddr?.isDefault !== undefined ? Boolean(selectedAddr.isDefault) : true,
    };

    const payload = {
      shippingAddress: {
        ...addressData,
      },
      billingAddress: {
        ...addressData,
      },
      notes: orderNotes || "",
    };

    setIsInitiating(true);
    try {
      const data = await initiateCheckout(payload);
      setCheckoutData(data);
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error("Initiate checkout error:", err);
      const isIdentityError = err?.data?.error === 'incomplete_identity.checkout' || err?.message?.includes('incomplete');
      const msg = isIdentityError
        ? (locale === 'fa' ? 'اطلاعات هویت یا آدرس کاربر ناقص است. لطفاً موارد فوق را بررسی کنید.' : 'Identity or address information is incomplete.')
        : (err.message || (locale === 'fa' ? 'خطا در ثبت و شروع فرایند پرداخت' : 'Failed to initiate checkout'));
      setToast({ type: 'error', message: msg });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsInitiating(false);
    }
  };

  // ─── Step 3: Manual Receipt Upload ──────────────────────────────────────────
  const handleUploadReceipt = async () => {
    if (!receiptFile || !checkoutData?.orderId) {
      setToast({ type: 'error', message: locale === 'fa' ? 'لطفاً ابتدا فایل تصویر رسید پرداخت را انتخاب فرمایید.' : 'Please select a receipt image file.' });
      setTimeout(() => setToast(null), 3500);
      return;
    }

    setIsUploadingReceipt(true);
    try {
      await uploadManualReceipt(checkoutData.orderId, receiptFile);
      setReceiptSuccess(true);
      setToast({ type: 'success', message: locale === 'fa' ? 'رسید پرداخت با موفقیت ثبت شد.' : 'Receipt submitted successfully.' });
    } catch (err) {
      console.error("Upload receipt error:", err);
      setToast({ type: 'error', message: err.message || (locale === 'fa' ? 'خطا در ثبت رسید پرداخت' : 'Failed to upload receipt') });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  // ─── Step 3: Cancel Pending Order ──────────────────────────────────────────
  const handleCancelOrder = () => {
    setShowCancelModal(true);
  };

  const confirmCancelOrder = async () => {
    const orderId = checkoutData?.orderId || checkoutData?._id || checkoutData?.id;
    if (!orderId) return;

    setIsCancellingOrder(true);
    try {
      await cancelOrder(orderId);
      setShowCancelModal(false);
      setToast({
        type: 'info',
        message: locale === "fa" ? "سفارش شما با موفقیت لغو شد." : "Order cancelled successfully.",
      });
      setCheckoutData(null);
      setReceiptFile(null);
      setReceiptSuccess(false);
      setStep(1);
      await fetchCart();
      if (refreshCart) await refreshCart();
      setTimeout(() => setToast(null), 3500);
    } catch (err) {
      console.error("Cancel order error:", err);
      setToast({
        type: 'error',
        message: err.message || (locale === "fa" ? "خطا در لغو سفارش" : "Failed to cancel order"),
      });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setIsCancellingOrder(false);
    }
  };

  const items = cartData?.items || [];
  const step3Items = (checkoutData?.items && checkoutData.items.length > 0) ? checkoutData.items : items;
  const isCartEmpty = !isLoggedIn || items.length === 0;
  const isProfileIncomplete = !profile?.firstName?.trim() || !profile?.lastName?.trim() || !profile?.phone?.trim();

  return (
    <div dir={locale === "fa" ? "rtl" : "ltr"} className="w-full min-h-screen bgabout flex flex-col justify-between pt-20 sm:pt-24">
      <div className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-4 pb-16">
        {/* Checkout Step Header Indicator */}
        <motion.div variants={boxVariants} initial="hidden" animate="visible" className="w-full mb-6 sm:mb-8">
        <div className="py-4 sm:px-4 md:px-6 rounded-2xl text-[#47221C] border-2 border-[#47221C30] bg-white/60 backdrop-blur-md shadow-md">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <span className="flex items-center justify-center bg-[#47221C] text-white rounded-full font-bold sm:text-sm text-xs w-7 h-7 sm:w-8 sm:h-8 shadow-sm shrink-0">
                0{step}
              </span>
              <h1 className="md:text-2xl sm:text-md text-base font-bold text-[#47221C] truncate">
                {step === 1 && (locale === "fa" ? "سبد خرید" : "Shopping Cart")}
                {step === 2 && (locale === "fa" ? "اطلاعات ارسال و آدرس" : "Shipping & Identity")}
                {step === 3 && (locale === "fa" ? "پرداخت و ثبت رسید" : "Payment & Receipt")}
              </h1>
            </div>

            {/* Steps Progress Pills (Desktop) */}
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold">
              <button 
                onClick={() => step !== 3 && step > 1 && setStep(1)} 
                disabled={step === 3}
                className={`px-3 py-1.5 rounded-full transition-all ${
                  step === 1 ? 'bg-[#47221C] text-white' : 
                  step === 3 ? 'bg-gray-100 text-gray-400 cursor-not-allowed select-none opacity-40' : 
                  'bg-[#47221C10] text-[#47221C] hover:bg-[#47221C20]'
                }`}
              >
                {locale === "fa" ? "۱. سبد خرید" : "1. Cart"}
              </button>
              <span>{locale === "fa" ? "←" : "→"}</span>
              <button 
                onClick={() => step !== 3 && step > 2 && setStep(2)} 
                disabled={step === 3 || step < 2}
                className={`px-3 py-1.5 rounded-full transition-all ${
                  step === 2 ? 'bg-[#47221C] text-white' : 
                  step === 3 ? 'bg-gray-100 text-gray-400 cursor-not-allowed select-none opacity-40' : 
                  'bg-[#47221C10] text-[#47221C] disabled:opacity-40'
                }`}
              >
                {locale === "fa" ? "۲. آدرس و مشخصات" : "2. Address & Info"}
              </button>
              <span>{locale === "fa" ? "←" : "→"}</span>
              <button 
                disabled={step < 3}
                className={`px-3 py-1.5 rounded-full transition-all ${step === 3 ? 'bg-[#47221C] text-white' : 'bg-[#47221C10] text-[#47221C] disabled:opacity-40'}`}
              >
                {locale === "fa" ? "۳. پرداخت" : "3. Payment"}
              </button>
            </div>

            {/* Mobile Mini Step Dots */}
            <div className="flex md:hidden items-center gap-1 text-[11px] font-bold shrink-0">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                step === 1 ? 'bg-[#47221C] text-white shadow-xs' : 'bg-gray-200/80 text-gray-500'
              }`}>1</span>
              <span className="text-gray-400 text-xs">{locale === "fa" ? "←" : "→"}</span>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                step === 2 ? 'bg-[#47221C] text-white shadow-xs' : 'bg-gray-200/80 text-gray-500'
              }`}>2</span>
              <span className="text-gray-400 text-xs">{locale === "fa" ? "←" : "→"}</span>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                step === 3 ? 'bg-[#47221C] text-white shadow-xs' : 'bg-gray-200/80 text-gray-500'
              }`}>3</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Global Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`max-w-6xl mx-auto w-full mb-6 p-4 rounded-xl text-sm font-medium shadow-md flex items-center justify-between ${
              toast.type === 'error' ? 'bg-red-100 border border-red-300 text-red-800' :
              toast.type === 'info' ? 'bg-blue-100 border border-blue-300 text-blue-800' :
              'bg-emerald-100 border border-emerald-300 text-emerald-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-lg" />
              <span>{toast.message}</span>
            </div>
            <button onClick={() => setToast(null)} className="font-bold opacity-70 hover:opacity-100">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Loading Box */}
      {loading || isAuthLoading ? (
        <div className="py-24 flex items-center justify-center w-full min-h-[300px]">
          <LoadingBox />
        </div>
      ) : isCartEmpty && step === 1 ? (
        /* Empty Cart State */
        <motion.div variants={boxVariants} initial="hidden" animate="visible" className="max-w-xl mx-auto w-full my-12 p-8 rounded-2xl border border-gray-300 bg-white/70 backdrop-blur-md text-center shadow-lg">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#47221C15] flex items-center justify-center text-[#47221C]">
            <BiShoppingBag size={40} />
          </div>
          <h2 className="text-2xl font-bold text-[#47221C] mb-2">
            {locale === "fa" ? "سبد خرید شما خالی است" : "Your cart is empty"}
          </h2>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            {!isLoggedIn
              ? (locale === "fa" ? "برای مشاهده و مدیریت سبد خرید خود، لطفاً ابتدا وارد حساب کاربری شوید." : "Please log in to view and manage your shopping cart.")
              : (locale === "fa" ? "هیچ محصولی در سبد خرید شما قرار ندارد. برای مشاهده محصولات کلیک کنید." : "There are no products in your shopping cart.")
            }
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            {!isLoggedIn && (
              <button
                onClick={() => router.push('/login')}
                className="bg-[#47221C] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#341813] transition-colors shadow-md"
              >
                {locale === "fa" ? "ورود به حساب کاربری" : "Log In"}
              </button>
            )}
            <button
              onClick={() => router.push('/shop')}
              className="border border-[#47221C] text-[#47221C] px-6 py-2.5 rounded-xl font-bold hover:bg-[#47221C15] transition-colors"
            >
              {locale === "fa" ? "مشاهده فروشگاه" : "View Shop"}
            </button>
          </div>
        </motion.div>
      ) : (
        /* ── STEP 1: CART ITEMS LIST ────────────────────────────────────────── */
        step === 1 ? (
          <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            <div className="lg:col-span-2 space-y-3.5 sm:space-y-4">
              {items.map((item) => {
                const p = item.product || {};
                const name = getItemName(item);
                const image = getItemImage(item);
                const unitPrice = item.unitPrice || item.price || 0;
                const totalPrice = item.totalPrice || (unitPrice * item.quantity);
                const stockLimit = item.variant?.stock !== undefined ? item.variant.stock : p.stock;

                return (
                  <motion.div
                    key={item._id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="p-3.5 sm:p-4 rounded-2xl border border-gray-300 bg-white/70 backdrop-blur-md flex sm:flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto min-w-0">
                      <img 
                        src={image} 
                        alt={name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/images/logo.png";
                        }}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-lg border bg-white p-1 shrink-0" 
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className={`font-bold text-xs sm:text-sm md:text-base text-[#363635] line-clamp-2 leading-relaxed ${locale === "fa" ? "text-right" : "text-left"}`}>{name}</h3>
                        {item.sku && (
                          <span className="inline-block mt-1 text-[10px] sm:text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded border">
                            {locale === "fa" ? "کد کالا:" : "SKU:"} {item.sku}
                          </span>
                        )}
                        <p className={`text-[11px] sm:text-xs text-gray-600 mt-1 font-mono ${locale === "fa" ? "text-right" : "text-left"}`}>
                          {locale === "fa" ? "قیمت واحد:" : "Unit Price:"} {formatPrice(unitPrice)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-2.5 sm:pt-0">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 sm:gap-2 bg-gray-100 p-1 sm:p-1.5 rounded-xl border">
                        <button
                          onClick={() => handleIncrease(item._id, item.quantity, stockLimit)}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white shadow flex items-center justify-center font-bold text-gray-800 hover:bg-[#47221C] hover:text-white transition-colors text-sm sm:text-base"
                        >
                          +
                        </button>
                        <span className="w-6 sm:w-8 text-center font-bold text-xs sm:text-sm font-mono">{item.quantity}</span>
                        {item.quantity <= 1 ? (
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
                          >
                            <BiTrash size={15} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDecrease(item._id, item.quantity)}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white shadow flex items-center justify-center font-bold text-gray-800 hover:bg-[#47221C] hover:text-white transition-colors text-sm sm:text-base"
                          >
                            -
                          </button>
                        )}
                      </div>

                      {/* Total Item Price */}
                      <div className={`text-left sm:text-right ${locale === "fa" ? "text-right sm:text-left" : "text-left sm:text-right"}`}>
                        <span className="text-[10px] sm:text-xs text-gray-400 block">
                          {locale === "fa" ? "جمع کل آیتم" : "Item Total"}
                        </span>
                        <span className="font-bold text-xs sm:text-sm md:text-base text-[#47221C] font-mono">
                          {formatPrice(totalPrice)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Summary Card Step 1 */}
            <div className="lg:col-span-1">
              <div className="p-4 sm:p-6 rounded-2xl border-2 border-[#47221C30] bg-white/80 backdrop-blur-md shadow-lg sticky top-28 space-y-4">
                <h3 className={`text-base sm:text-lg font-bold text-[#47221C] border-b pb-3 ${locale === "fa" ? "text-right" : "text-left"}`}>
                  {locale === "fa" ? "خلاصه فاکتور خرید" : "Order Summary"}
                </h3>
                
                <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                  <span>{locale === "fa" ? "مبلغ کل محصولات:" : "Products Subtotal:"}</span>
                  <span className="font-mono">{formatPrice(cartData?.subtotal || cartData?.total || 0)}</span>
                </div>

                {cartData?.couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>{locale === "fa" ? "تخفیف:" : "Discount:"}</span>
                    <span className="font-mono">- {formatPrice(cartData.couponDiscount)}</span>
                  </div>
                )}

                <div className="border-t pt-3 flex justify-between items-center text-base font-bold text-[#47221C]">
                  <span>{locale === "fa" ? "مبلغ قابل پرداخت:" : "Total Payable:"}</span>
                  <span className="text-lg font-mono">{formatPrice(cartData?.total || 0)}</span>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full bg-[#47221C] text-white py-3 rounded-xl font-bold hover:bg-[#341813] transition-colors shadow-md text-sm mt-4 flex items-center justify-center gap-2"
                >
                  <span>{locale === "fa" ? "ادامه فرایند خرید (آدرس و مشخصات)" : "Proceed to Checkout"}</span>
                </button>
              </div>
            </div>
          </div>
        ) : step === 2 ? (
          /* ── STEP 2: PROFILE IDENTITY & SHIPPING ADDRESS ────────────────────── */
          <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              
              {/* Profile Identity Card */}
              <div className="p-4 sm:p-6 rounded-2xl border border-gray-300 bg-white/70 backdrop-blur-md shadow-sm">
                <h3 className={`text-base sm:text-lg font-bold text-[#47221C] mb-4 flex items-center gap-2 border-b pb-3 ${locale === "fa" ? "text-right" : "text-left"}`}>
                  <BiUser className="text-xl shrink-0" />
                  <span>{locale === "fa" ? "اطلاعات کاربری و هویت گیرنده" : "Recipient & Account Information"}</span>
                </h3>

                {isProfileIncomplete && (
                  <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs flex items-center gap-2">
                    <FaExclamationTriangle className="text-base flex-shrink-0" />
                    <span>
                      {locale === "fa"
                        ? "برای ثبت سفارش باید نام، نام خانوادگی و شماره تماس در پروفایل شما تکمیل باشد."
                        : "Your first name, last name, and phone number must be completed to place an order."}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {locale === "fa" ? "نام *" : "First Name *"}
                    </label>
                    <input
                      value={profileForm.firstName}
                      onChange={e => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      placeholder={locale === "fa" ? "نام" : "First Name"}
                      className="w-full px-3 py-2 text-xs sm:text-sm border rounded-lg outline-none focus:border-[#47221C] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {locale === "fa" ? "نام خانوادگی *" : "Last Name *"}
                    </label>
                    <input
                      value={profileForm.lastName}
                      onChange={e => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      placeholder={locale === "fa" ? "نام خانوادگی" : "Last Name"}
                      className="w-full px-3 py-2 text-xs sm:text-sm border rounded-lg outline-none focus:border-[#47221C] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {locale === "fa" ? "شماره تماس *" : "Phone Number *"}
                    </label>
                    <input
                      value={profileForm.phone}
                      onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="09123456789"
                      dir="ltr"
                      className="w-full px-3 py-2 text-xs sm:text-sm border rounded-lg outline-none focus:border-[#47221C] bg-white"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isUpdatingProfile}
                    className="w-full sm:w-auto px-5 py-2.5 sm:py-2 bg-[#363635] text-white text-xs font-bold rounded-lg hover:bg-black transition-colors disabled:opacity-50"
                  >
                    {isUpdatingProfile 
                      ? (locale === "fa" ? "در حال ثبت..." : "Saving...") 
                      : (locale === "fa" ? "ذخیره تغییرات مشخصات" : "Save Details")}
                  </button>
                </div>
              </div>

              {/* Shipping Address Selection Card */}
              <div className="p-4 sm:p-6 rounded-2xl border border-gray-300 bg-white/70 backdrop-blur-md shadow-sm">
                <div className="flex sm:flex-col md:flex-row sm:items-center justify-between sm:gap-2.5 md:gap-0 mb-4 border-b pb-3">
                  <h3 className="text-base sm:text-lg font-bold text-[#47221C] flex items-center gap-2">
                    <BiMap className="text-xl shrink-0" />
                    <span>{locale === "fa" ? "انتخاب آدرس تحویل سفارش" : "Select Shipping Address"}</span>
                  </h3>
                  <button
                    onClick={() => setShowAddressModal(true)}
                    className="self-start sm:self-auto px-3 py-1.5 bg-[#47221C] text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-[#341813] transition-colors"
                  >
                    <BiPlus className="text-base" />
                    <span>{locale === "fa" ? "افزودن آدرس جدید" : "Add New Address"}</span>
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="text-center py-8 border border-dashed rounded-xl bg-gray-50/50">
                    <FaMapMarkerAlt className="mx-auto text-3xl text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-3">
                      {locale === "fa" ? "هیچ آدرسی ثبت نشده است." : "No address has been registered."}
                    </p>
                    <button
                      onClick={() => setShowAddressModal(true)}
                      className="px-4 py-2 border border-[#47221C] text-[#47221C] rounded-lg text-xs font-bold hover:bg-[#47221C10]"
                    >
                      {locale === "fa" ? "ثبت اولین آدرس پستی" : "Add First Postal Address"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map(addr => (
                      <label
                        key={addr._id}
                        className={`block p-3.5 sm:p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedAddressId === addr._id
                            ? 'border-[#47221C] bg-[#47221C08] shadow-sm'
                            : 'border-gray-200 bg-white/50 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 sm:gap-3">
                          <input
                            type="radio"
                            name="checkout_address"
                            checked={selectedAddressId === addr._id}
                            onChange={() => setSelectedAddressId(addr._id)}
                            className="mt-1 accent-[#47221C] shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                              <span className="font-bold text-xs sm:text-sm text-[#47221C] break-words">
                                {addr.label} — {addr.fullName}
                              </span>
                              {addr.isDefault && (
                                <span className="text-[10px] sm:text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium shrink-0">
                                  {locale === "fa" ? "آدرس پیش‌فرض" : "Default Address"}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-700 leading-relaxed break-words">{addr.fullAddress}</p>
                            <div className="flex gap-2 sm:gap-4 mt-2 text-[10px] sm:text-[11px] text-gray-500 font-mono flex-wrap">
                              <span>{locale === "fa" ? "استان:" : "Province:"} {addr.state || addr.city}</span>
                              <span>{locale === "fa" ? "کد پستی:" : "Postal Code:"} {addr.postalCode}</span>
                              <span>{locale === "fa" ? "تلفن:" : "Phone:"} {addr.phone}</span>
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Notes Card */}
              <div className="p-4 sm:p-5 rounded-2xl border border-gray-300 bg-white/70 backdrop-blur-md shadow-sm">
                <h4 className={`text-sm font-bold text-[#47221C] mb-2 ${locale === "fa" ? "text-right" : "text-left"}`}>
                  {locale === "fa" ? "یادداشت سفارش (اختیاری)" : "Order Notes (Optional)"}
                </h4>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder={locale === "fa" ? "اگر توضیحات یا نکته خاصی درباره ارسال سفارش دارید، اینجا بنویسید..." : "Write any delivery notes or instructions here (optional)..."}
                  rows={2}
                  className="w-full px-3 py-2 text-xs sm:text-sm border rounded-lg outline-none focus:border-[#47221C] bg-white resize-none"
                />
              </div>

            </div>

            {/* Summary & Order Initiate Button */}
            <div className="lg:col-span-1">
              <div className="p-4 sm:p-6 rounded-2xl border-2 border-[#47221C30] bg-white/80 backdrop-blur-md shadow-lg sticky top-28 space-y-4">
                <h3 className={`text-base sm:text-lg font-bold text-[#47221C] border-b pb-3 ${locale === "fa" ? "text-right" : "text-left"}`}>
                  {locale === "fa" ? "تأیید فاکتور و ادامه" : "Confirm & Proceed"}
                </h3>
                
                <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                  <span>{locale === "fa" ? "مبلغ کل:" : "Total Amount:"}</span>
                  <span className="font-mono">{formatPrice(cartData?.total || 0)}</span>
                </div>

                <div className="border-t pt-3 flex justify-between items-center text-sm sm:text-base font-bold text-[#47221C]">
                  <span>{locale === "fa" ? "مبلغ نهایی:" : "Final Total:"}</span>
                  <span className="text-base sm:text-lg font-mono">{formatPrice(cartData?.total || 0)}</span>
                </div>

                <button
                  onClick={handleInitiateCheckout}
                  disabled={isInitiating}
                  className="w-full bg-[#47221C] text-white py-3 rounded-xl font-bold hover:bg-[#341813] transition-colors shadow-md text-xs sm:text-sm mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isInitiating 
                    ? (locale === "fa" ? "در حال ثبت سفارش..." : "Processing...") 
                    : (locale === "fa" ? "تأیید و رفتن به مرحله پرداخت" : "Confirm & Proceed to Payment")}
                </button>

                <button
                  onClick={() => setStep(1)}
                  className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-100 transition-colors text-xs"
                >
                  {locale === "fa" ? "بازگشت به سبد خرید" : "Back to Cart"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── STEP 3: PAYMENT METHOD & MANUAL RECEIPT UPLOAD ─────────────────── */
          <div className="max-w-4xl mx-auto w-full space-y-6">
            
            {receiptSuccess ? (
              /* Receipt Success Card */
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-5 sm:p-8 rounded-2xl border border-emerald-300 bg-emerald-50/80 backdrop-blur-md text-center shadow-lg space-y-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl sm:text-3xl">
                  <BiCheck />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-emerald-900">
                  {locale === "fa" ? "رسید پرداخت شما با موفقیت ثبت شد" : "Payment Receipt Submitted Successfully"}
                </h2>
                <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed max-w-xl mx-auto font-medium">
                  {locale === "fa"
                    ? "رسید شما جهت بررسی و تأیید به مدیریت ارسال گردید. پس از تأیید نهایی، وضعیت سفارش شما به \"پرداخت‌شده\" تغییر خواهد یافت."
                    : "Your receipt has been submitted for review. Once approved, your order status will be updated to \"Paid\"."}
                </p>

                {checkoutData?.orderId && (
                  <p className="text-xs font-mono text-emerald-700">
                    {locale === "fa" ? "کد سفارش:" : "Order ID:"} {checkoutData.orderId}
                  </p>
                )}

                <div className="pt-4 flex justify-center gap-4">
                  <button
                    onClick={() => router.push('/user-panel')}
                    className="w-full sm:w-auto bg-[#47221C] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#341813] transition-colors shadow-md text-xs sm:text-sm"
                  >
                    {locale === "fa" ? "مشاهده لیست سفارشات من" : "View My Orders"}
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Step 3 Active Form */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                  
                  {/* Online Payment Notice Banner */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-amber-300 bg-amber-50/90 text-amber-900 text-xs sm:text-sm leading-relaxed space-y-2 shadow-sm">
                    <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-amber-900">
                      <BiCreditCard className="text-xl shrink-0" />
                      <span>{locale === "fa" ? "پرداخت آنلاین درگاه بانکی" : "Online Payment Gateway"}</span>
                    </div>
                    <p className="text-xs sm:text-sm font-light">
                      {locale === "fa"
                        ? "درگاه پرداخت آنلاین در حال بروزرسانی می‌باشد و به‌زودی فعال خواهد گردید. در حال حاضر جهت ثبت و نهایی‌سازی سفارش، لطفاً مبلغ فاکتور را واریز نموده و تصویر رسید فیش واریزی را ارسال فرمایید."
                        : "The online payment gateway is currently under maintenance and will be activated soon. In the meantime, please transfer the total invoice amount and upload your deposit receipt below."}
                    </p>
                  </div>

                  {/* Manual Receipt Upload Form */}
                  <div className="p-4 sm:p-6 rounded-2xl border border-gray-300 bg-white/80 backdrop-blur-md shadow-md space-y-4">
                    <h3 className={`text-base sm:text-lg font-bold text-[#47221C] border-b pb-3 flex items-center gap-2 ${locale === "fa" ? "text-right" : "text-left"}`}>
                      <BiUpload className="text-xl shrink-0" />
                      <span>{locale === "fa" ? "بارگذاری فیش و تصویر رسید پرداخت" : "Upload Payment Receipt"}</span>
                    </h3>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        {locale === "fa" ? "انتخاب تصویر یا فایل رسید (JPG, PNG, PDF) *" : "Select Receipt Image or File (JPG, PNG, PDF) *"}
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={e => setReceiptFile(e.target.files?.[0] || null)}
                        className="w-full text-xs text-gray-600 file:mr-2 sm:file:mr-4 file:py-2 file:px-3 sm:file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#47221C] file:text-white hover:file:bg-[#341813] cursor-pointer"
                      />
                    </div>

                    {receiptFile && (
                      <p className="text-xs text-emerald-700 font-medium bg-emerald-50 p-2 rounded border border-emerald-200">
                        {locale === "fa" ? "فایل انتخاب شده:" : "Selected file:"} {receiptFile.name}
                      </p>
                    )}

                    <button
                      onClick={handleUploadReceipt}
                      disabled={isUploadingReceipt || !receiptFile}
                      className="w-full bg-[#47221C] text-white py-3 rounded-xl font-bold hover:bg-[#341813] transition-colors shadow-md text-xs sm:text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isUploadingReceipt 
                        ? (locale === "fa" ? "در حال ارسال و ثبت رسید..." : "Submitting receipt...") 
                        : (locale === "fa" ? "ثبت و ارسال نهایی رسید پرداخت" : "Submit Payment Receipt")}
                    </button>
                  </div>

                </div>

                {/* Step 3 Order Expiry & Payable Summary */}
                <div className="lg:col-span-1 space-y-4">
                  <PaymentTimer 
                    expiresAt={checkoutData?.expiresAt} 
                    onExpire={() => {
                      window.location.reload();
                    }}
                  />

                  <div className="p-4 sm:p-6 rounded-2xl border-2 border-[#47221C30] bg-white/80 backdrop-blur-md shadow-lg space-y-4">
                    <h3 className={`text-base sm:text-lg font-bold text-[#47221C] border-b pb-3 ${locale === "fa" ? "text-right" : "text-left"}`}>
                      {locale === "fa" ? "مبلغ نهایی پرداخت" : "Final Payable Amount"}
                    </h3>
                    
                    {checkoutData?.orderNumber && (
                      <div className="flex justify-between text-xs text-gray-600 border-b pb-2">
                        <span>{locale === "fa" ? "شماره سفارش:" : "Order Number:"}</span>
                        <span className="font-mono font-bold text-gray-800">{checkoutData.orderNumber}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                      <span>{locale === "fa" ? "مبلغ فاکتور:" : "Invoice Amount:"}</span>
                      <span className="font-mono">{formatPrice(checkoutData?.total || cartData?.total || 0)}</span>
                    </div>

                    <div className="border-t pt-3 flex justify-between items-center text-sm sm:text-base font-bold text-[#47221C]">
                      <span>{locale === "fa" ? "مبلغ قابل واریز:" : "Amount to Pay:"}</span>
                      <span className="text-base sm:text-lg font-mono">{formatPrice(checkoutData?.total || cartData?.total || 0)}</span>
                    </div>
                  </div>

                  {/* Cancel Order Card */}
                  <div className="p-3.5 sm:p-4 rounded-2xl border border-red-200 bg-red-50/60 backdrop-blur-md shadow-sm space-y-2.5">
                    <p className="text-xs text-red-700 leading-relaxed font-light">
                      {locale === "fa"
                        ? "در صورت تمایل به تغییر اقلام یا انصراف از خرید، می‌توانید سفارش را لغو فرمایید."
                        : "If you wish to modify items or cancel this purchase, you can cancel this order."}
                    </p>
                    <button
                      onClick={handleCancelOrder}
                      disabled={isCancellingOrder}
                      className="w-full border border-red-400 text-red-700 hover:bg-red-600 hover:text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <BiXCircle className="text-base" />
                      <span>{isCancellingOrder ? (locale === "fa" ? "در حال لغو سفارش..." : "Cancelling...") : (locale === "fa" ? "لغو این سفارش" : "Cancel This Order")}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Cart Items Preview (Real Images & Names with Logo fallback) */}
            {step3Items.length > 0 && (
              <div className="p-4 sm:p-6 rounded-2xl border border-gray-300 bg-white/80 backdrop-blur-md shadow-sm space-y-4">
                <h4 className={`text-sm font-bold text-[#47221C] border-b pb-2.5 flex items-center justify-between gap-2 ${locale === "fa" ? "text-right" : "text-left"}`}>
                  <div className="flex items-center gap-2">
                    <BiPackage className="text-lg shrink-0" />
                    <span>{locale === "fa" ? "اقلام سفارش شما" : "Your Order Items"}</span>
                  </div>
                  <span className="text-[11px] sm:text-xs font-normal text-gray-500 font-mono">
                    {step3Items.length} {locale === "fa" ? "کالا" : "items"}
                  </span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {step3Items.map((item, idx) => {
                    const name = getItemName(item);
                    const image = getItemImage(item);
                    const qty = item.quantity || 1;
                    const price = item.totalPrice || item.price || item.unitPrice;

                    return (
                      <div
                        key={item._id || item.id || idx}
                        className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-gray-100/70 transition-colors"
                      >
                        <img
                          src={image}
                          alt={name}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/images/logo.png";
                          }}
                          className="sm:w-14 h-14 md::w-16 sm:h-16 object-contain rounded-lg border bg-white p-1 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold sm:text-xs md:text-sm text-gray-800 line-clamp-2 leading-relaxed" title={name}>
                            {name}
                          </p>
                          {/* <div className="flex items-center justify-between mt-1 text-[11px] text-gray-500">
                            <span>{locale === "fa" ? `تعداد: ${qty}` : `Qty: ${qty}`}</span>
                            {price > 0 && (
                              <span className="font-mono text-[#47221C] font-semibold">{formatPrice(price)}</span>
                            )}
                          </div> */}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )
      )}
      </div>

      {/* Modal for Address Creation */}
      {showAddressModal && (
        <AddressModal
          onSave={handleSaveAddress}
          onClose={() => setShowAddressModal(false)}
          isLoading={addressModalLoading}
          error={addressModalError}
        />
      )}

      {/* In-Page Confirmation Modal for Order Cancellation */}
      <AnimatePresence>
        {showCancelModal && (
          <CancelOrderModal
            isOpen={showCancelModal}
            onClose={() => !isCancellingOrder && setShowCancelModal(false)}
            onConfirm={confirmCancelOrder}
            isLoading={isCancellingOrder}
            locale={locale}
          />
        )}
      </AnimatePresence>

      <Footer2 />
    </div>
  );
}
