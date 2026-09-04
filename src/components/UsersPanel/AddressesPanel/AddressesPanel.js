"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLogin } from "../../../app/contexts/LoginContext";
import { useLanguage } from "../../../app/contexts/LanguageContext";
import { getAddresses, createAddress, updateAddress, deleteAddress } from "../../../lib/api/profile";
import { getProvinces, getCities } from "../../../lib/api/locations";
import { CiLocationOn } from "react-icons/ci";
import { CiEdit } from "react-icons/ci";
import { CiTrash } from "react-icons/ci";
import { CiCirclePlus } from "react-icons/ci";
import { AiOutlineClose } from "react-icons/ai";
import { motion, AnimatePresence } from "framer-motion";

// ─── Empty form state ──────────────────────────────────────────────────────────
const EMPTY_FORM = {
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
  isDefault: false,
};

// ─── Simple text field ────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, dir, required, locale }) {
  const isRtl = locale === "fa";
  return (
    <div>
      <label className="block text-[13px] text-[#47221C] mb-1">
        {label}{required && <span className="text-red-500 mx-0.5">*</span>}
      </label>
      <input
        dir={dir || (isRtl ? "rtl" : "ltr")}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="px-3 py-2 text-[13px] rounded-md bg-transparent border border-[#47221C60] w-full outline-none focus:border-[#47221C] transition-colors placeholder:text-gray-400"
      />
    </div>
  );
}

// ─── Searchable dropdown ──────────────────────────────────────────────────────
function SearchableSelect({ label, options, value, onChange, placeholder, disabled, required, isLoading, locale }) {
  const [query, setQuery]   = useState("");
  const [open, setOpen]     = useState(false);
  const ref                 = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Display name for selected value
  const selected = options.find(o => o.id === value);

  const filtered = query.trim()
    ? options.filter(o => o.name.includes(query.trim()))
    : options;

  return (
    <div ref={ref} className="relative">
      <label className="block text-[13px] text-[#47221C] mb-1">
        {label}{required && <span className="text-red-500 mx-0.5">*</span>}
      </label>
      <button
        type="button"
        disabled={disabled || isLoading}
        onClick={() => setOpen(v => !v)}
        className={`w-full px-3 py-2 text-[13px] rounded-md border ${locale === "fa" ? "text-right" : "text-left"} flex items-center justify-between transition-colors
          ${disabled ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed" : "bg-transparent border-[#47221C60] hover:border-[#47221C]"}
          ${open ? "border-[#47221C]" : ""}`}
      >
        <span className={selected ? "text-gray-800" : "text-gray-400"}>
          {isLoading ? (locale === "fa" ? "در حال بارگذاری..." : "Loading...") : (selected?.name || placeholder)}
        </span>
        <svg className={`w-4 h-4 text-[#47221C] transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1 right-0 left-0 bg-white border border-[#47221C40] rounded-lg shadow-lg z-50 overflow-hidden"
          >
            {/* Search input */}
            <div className="p-2 border-b border-[#47221C20]">
              <input
                dir={locale === "fa" ? "rtl" : "ltr"}
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={locale === "fa" ? "جستجو..." : "Search..."}
                className="w-full px-2 py-1.5 text-[13px] rounded border border-[#47221C40] outline-none focus:border-[#47221C]"
              />
            </div>
            {/* Options list */}
            <ul className="max-h-44 overflow-y-auto">
              {filtered.length === 0 ? (
                <li className="text-center text-[13px] text-gray-400 py-3">
                  {locale === "fa" ? "نتیجه‌ای یافت نشد" : "No results found"}
                </li>
              ) : filtered.map(opt => (
                <li
                  key={opt.id}
                  onClick={() => {
                    onChange(opt);
                    setQuery("");
                    setOpen(false);
                  }}
                  className={`px-3 py-2 text-[13px] ${locale === "fa" ? "text-right" : "text-left"} cursor-pointer transition-colors
                    ${opt.id === value ? "bg-[#47221C15] text-[#47221C] font-semibold" : "hover:bg-[#47221C08] text-gray-700"}`}
                >
                  {opt.name}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Address form modal ───────────────────────────────────────────────────────
function AddressModal({ initial, onSave, onClose, isLoading, error, locale }) {
  const [form, setForm]         = useState(initial || EMPTY_FORM);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities]     = useState([]);
  const [provLoading, setProvLoading] = useState(true);
  const [cityLoading, setCityLoading] = useState(false);

  const set = (key) => (val) => setForm(prev => ({ ...prev, [key]: val }));

  // Load provinces once on mount
  useEffect(() => {
    getProvinces()
      .then(setProvinces)
      .catch(() => setProvinces([]))
      .finally(() => setProvLoading(false));
  }, []);

  // Load cities when provinceId changes
  useEffect(() => {
    if (!form.provinceId) { setCities([]); return; }
    setCityLoading(true);
    getCities(form.provinceId)
      .then(setCities)
      .catch(() => setCities([]))
      .finally(() => setCityLoading(false));
  }, [form.provinceId]);

  // When editing an existing address that already has a provinceId
  useEffect(() => {
    if (initial?.provinceId && provinces.length > 0 && cities.length === 0) {
      setCityLoading(true);
      getCities(initial.provinceId)
        .then(setCities)
        .catch(() => setCities([]))
        .finally(() => setCityLoading(false));
    }
  }, [provinces]);

  const handleProvinceChange = (province) => {
    setForm(prev => ({
      ...prev,
      provinceId: province.id,
      state: province.name,
      cityId: null,
      city: "",
    }));
    setCities([]);
  };

  const handleCityChange = (city) => {
    setForm(prev => ({
      ...prev,
      cityId: city.id,
      city: city.name,
    }));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ duration: 0.25 }}
          dir={locale === "fa" ? "rtl" : "ltr"}
          className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#47221C30]">
            <h3 className="text-[16px] font-bold text-[#47221C]">
              {initial
                ? (locale === "fa" ? "ویرایش آدرس" : "Edit Address")
                : (locale === "fa" ? "افزودن آدرس جدید" : "Add New Address")}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
              <AiOutlineClose size={20} />
            </button>
          </div>

          {/* Form */}
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field
                label={locale === "fa" ? "برچسب" : "Label"}
                value={form.label}
                onChange={set("label")}
                placeholder={locale === "fa" ? "خانه، محل‌کار..." : "Home, Office..."}
                locale={locale}
                required
              />
              <div>
                <label className="block text-[13px] text-[#47221C] mb-1">
                  {locale === "fa" ? "کشور" : "Country"} <span className="text-red-500 mx-0.5">*</span>
                </label>
                <input
                  dir="ltr"
                  value="ir"
                  readOnly
                  disabled
                  className={`px-3 py-2 text-[13px] rounded-md bg-gray-100 border border-[#47221C40] w-full outline-none text-gray-500 cursor-not-allowed font-mono ${locale === "fa" ? "text-right" : "text-left"}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field
                label={locale === "fa" ? "نام گیرنده" : "Recipient Name"}
                value={form.fullName}
                onChange={set("fullName")}
                placeholder={locale === "fa" ? "نام کامل" : "Full Name"}
                locale={locale}
                required
              />
              <Field
                label={locale === "fa" ? "تلفن گیرنده" : "Recipient Phone"}
                value={form.phone}
                onChange={set("phone")}
                placeholder="09xxxxxxxxx"
                dir="ltr"
                locale={locale}
                required
              />
            </div>

            {/* Address textarea */}
            <div>
              <label className="block text-[13px] text-[#47221C] mb-1">
                {locale === "fa" ? "آدرس کامل" : "Full Address"} <span className="text-red-500 mx-0.5">*</span>
              </label>
              <textarea
                dir={locale === "fa" ? "rtl" : "ltr"}
                rows={3}
                value={form.fullAddress}
                onChange={e => setForm(prev => ({ ...prev, fullAddress: e.target.value }))}
                placeholder={locale === "fa" ? "خیابان، کوچه، پلاک، واحد..." : "Street, Alley, No, Unit..."}
                className="px-3 py-2 text-[13px] rounded-md bg-transparent border border-[#47221C60] w-full outline-none focus:border-[#47221C] transition-colors placeholder:text-gray-400 resize-none"
              />
            </div>

            {/* Province & City dropdowns */}
            <div className="grid grid-cols-2 gap-3">
              <SearchableSelect
                label={locale === "fa" ? "استان" : "Province"}
                options={provinces}
                value={form.provinceId}
                onChange={handleProvinceChange}
                placeholder={locale === "fa" ? "انتخاب استان" : "Select Province"}
                isLoading={provLoading}
                locale={locale}
                required
              />
              <SearchableSelect
                label={locale === "fa" ? "شهر" : "City"}
                options={cities}
                value={form.cityId}
                onChange={handleCityChange}
                placeholder={form.provinceId
                  ? (locale === "fa" ? "انتخاب شهر" : "Select City")
                  : (locale === "fa" ? "ابتدا استان انتخاب کنید" : "Select province first")}
                disabled={!form.provinceId}
                isLoading={cityLoading}
                locale={locale}
                required
              />
            </div>

            <Field
              label={locale === "fa" ? "کد پستی" : "Postal Code"}
              value={form.postalCode}
              onChange={set("postalCode")}
              placeholder="1234567890"
              dir="ltr"
              locale={locale}
              required
            />

            {/* Default toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none mt-1">
              <div
                onClick={() => setForm(prev => ({ ...prev, isDefault: !prev.isDefault }))}
                className={`w-10 h-5 rounded-full transition-colors duration-200 flex items-center px-0.5 ${form.isDefault ? "bg-[#47221C]" : "bg-gray-300"}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${form.isDefault ? (locale === "fa" ? "translate-x-[-20px]" : "translate-x-[20px]") : ""}`} />
              </div>
              <span className="text-[13px] text-gray-700">
                {locale === "fa" ? "آدرس پیش‌فرض" : "Default Address"}
              </span>
            </label>
          </div>

          {/* Error */}
          {error && <p className="px-4 pb-2 text-sm text-red-600 text-center">{error}</p>}

          {/* Footer */}
          <div className="flex gap-3 p-4 border-t border-[#47221C30]">
            <button
              onClick={() => onSave(form)}
              disabled={isLoading}
              className="flex-1 py-2 rounded-[10px] bg-[#363635] text-white text-[14px] disabled:opacity-60 transition-opacity"
            >
              {isLoading
                ? (locale === "fa" ? "در حال ذخیره..." : "Saving...")
                : (initial
                    ? (locale === "fa" ? "ذخیره تغییرات" : "Save Changes")
                    : (locale === "fa" ? "افزودن آدرس" : "Add Address"))}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-[10px] border border-[#47221C] text-[#47221C] text-[14px] hover:bg-[#47221C10] transition-colors"
            >
              {locale === "fa" ? "انصراف" : "Cancel"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main AddressesPanel ──────────────────────────────────────────────────────
export default function AddressesPanel() {
  const { getValidToken } = useLogin();
  const { locale } = useLanguage();

  const [addresses, setAddresses]       = useState([]);
  const [isFetching, setIsFetching]     = useState(true);
  const [fetchError, setFetchError]     = useState("");

  const [modalOpen, setModalOpen]       = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError]     = useState("");

  const [deleteId, setDeleteId]         = useState(null);
  const [isDeleting, setIsDeleting]     = useState(false);

  // Load addresses
  const loadAddresses = useCallback(async () => {
    setIsFetching(true);
    setFetchError("");
    try {
      const token = await getValidToken();
      if (!token) return;
      const data = await getAddresses(token);
      setAddresses(data);
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setIsFetching(false);
    }
  }, [getValidToken]);

  useEffect(() => { loadAddresses(); }, [loadAddresses]);

  // Create / Update
  const handleSave = async (form) => {
    setModalError("");

    if (!form.label?.trim() || !form.fullName?.trim() || !form.phone?.trim() || !form.fullAddress?.trim() || !form.provinceId || !form.cityId || !form.postalCode?.trim()) {
      setModalError(locale === "fa"
        ? "لطفاً تمامی موارد الزامی (نام، تلفن، آدرس کامل، استان، شهر، کد پستی و برچسب) را وارد کنید."
        : "Please fill in all required fields (Name, Phone, Full Address, Province, City, Postal Code, and Label).");
      return;
    }

    setModalLoading(true);
    try {
      // Exclude line1 and line2, enforce country 'ir'
      const payload = {
        label: form.label.trim(),
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        fullAddress: form.fullAddress.trim(),
        provinceId: form.provinceId,
        cityId: form.cityId,
        state: form.state,
        city: form.city,
        postalCode: form.postalCode.trim(),
        country: "ir",
        isDefault: Boolean(form.isDefault),
      };

      if (editTarget) {
        await updateAddress(editTarget._id, payload);
      } else {
        await createAddress(payload);
      }
      setModalOpen(false);
      setEditTarget(null);
      await loadAddresses();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    setIsDeleting(true);
    try {
      const token = await getValidToken();
      await deleteAddress(token, id);
      setDeleteId(null);
      await loadAddresses();
    } catch {
      await loadAddresses();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {modalOpen && (
        <AddressModal
          initial={editTarget}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditTarget(null); setModalError(""); }}
          isLoading={modalLoading}
          error={modalError}
          locale={locale}
        />
      )}

      <div dir={locale === "fa" ? "rtl" : "ltr"} className="border border-[#47221C] rounded-xl px-4 pt-4 pb-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h6 className={`md:text-[18px] sm:text-[15px] text-black p-2 rounded-[10px] border border-[#47221C] text-center flex-1 ${locale === "fa" ? "ml-3" : "mr-3"}`}>
            {locale === "fa" ? "آدرس‌های من" : "My Addresses"}
          </h6>
          <button
            onClick={() => { setEditTarget(null); setModalOpen(true); }}
            className="flex items-center gap-1 text-[13px] text-white bg-[#363635] px-3 py-2 rounded-[10px] hover:bg-[#47221C] transition-colors flex-shrink-0"
          >
            <CiCirclePlus size={18} />
            {locale === "fa" ? "آدرس جدید" : "New Address"}
          </button>
        </div>

        {/* Content */}
        {isFetching ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            {locale === "fa" ? "در حال بارگذاری آدرس‌ها..." : "Loading addresses..."}
          </div>
        ) : fetchError ? (
          <div className="text-center py-10 text-red-500 text-sm">{fetchError}</div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-xl text-gray-400">
            <CiLocationOn className="mx-auto text-4xl mb-2 text-gray-300" />
            <p className="text-sm font-medium">
              {locale === "fa" ? "هنوز هیچ آدرسی ثبت نکرده‌اید." : "No addresses registered yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map(addr => (
              <div
                key={addr._id}
                className="border border-[#47221C40] rounded-xl p-4 bg-white/60 hover:bg-white transition-all duration-200 relative group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[14px] text-black">{addr.label}</span>
                    {addr.isDefault && (
                      <span className="text-[11px] bg-[#47221C] text-white px-2 py-0.5 rounded-full font-medium">
                        {locale === "fa" ? "پیش‌فرض" : "Default"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditTarget(addr); setModalOpen(true); }}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-black hover:bg-[#47221C15] transition-colors"
                      title={locale === "fa" ? "ویرایش" : "Edit"}
                    >
                      <CiEdit size={18} />
                    </button>
                    <button
                      onClick={() => setDeleteId(addr._id)}
                      className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                      title={locale === "fa" ? "حذف" : "Delete"}
                    >
                      <CiTrash size={18} />
                    </button>
                  </div>
                </div>

                <p className="text-[13px] text-gray-700 mt-2 leading-relaxed">{addr.fullAddress}</p>

                <div className="mt-3 pt-3 border-t border-[#47221C15] flex flex-wrap gap-4 text-[12px] text-gray-500 font-mono">
                  <span>{locale === "fa" ? "شهر:" : "City:"} {addr.city}</span>
                  <span>{locale === "fa" ? "استان:" : "Province:"} {addr.state}</span>
                  <span>{locale === "fa" ? "کد پستی:" : "Postal Code:"} {addr.postalCode}</span>
                  <span>{locale === "fa" ? "گیرنده:" : "Recipient:"} {addr.fullName}</span>
                  <span>{locale === "fa" ? "تلفن:" : "Phone:"} {addr.phone}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div dir={locale === "fa" ? "rtl" : "ltr"} className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm text-center">
            <h4 className="text-[16px] font-bold text-[#47221C] mb-2">
              {locale === "fa" ? "حذف آدرس" : "Delete Address"}
            </h4>
            <p className="text-[13px] text-gray-600 mb-6">
              {locale === "fa"
                ? "آیا از حذف این آدرس مطمئن هستید؟ این عملیات قابل بازگشت نیست."
                : "Are you sure you want to delete this address? This action cannot be undone."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-[10px] bg-red-600 text-white text-[14px] hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting
                  ? (locale === "fa" ? "در حال حذف..." : "Deleting...")
                  : (locale === "fa" ? "بله، حذف شود" : "Yes, Delete")}
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2 rounded-[10px] border border-gray-300 text-gray-600 text-[14px] hover:bg-gray-100 transition-colors"
              >
                {locale === "fa" ? "انصراف" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
