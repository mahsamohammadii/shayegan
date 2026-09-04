"use client";
import { useState, useEffect } from "react";
import { useLogin } from "../../../app/contexts/LoginContext";
import { useLanguage } from "../../../app/contexts/LanguageContext";
import { getProfile, updateProfile } from "../../../lib/api/profile";
import { CiUser } from "react-icons/ci";

export default function Sec2Panel() {
  const { getValidToken } = useLogin();
  const { locale } = useLanguage();

  // ─── State ──────────────────────────────────────────────────────────────────
  const [profile, setProfile]     = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [phone, setPhone]         = useState("");

  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving]     = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");

  // ─── Fetch profile on mount ──────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const token = await getValidToken();
        if (!token) return;
        const data = await getProfile(token);
        setProfile(data);
        setFirstName(data.firstName || "");
        setLastName(data.lastName   || "");
        setPhone(data.phone         || "");
      } catch (err) {
        setError(err.message);
      } finally {
        setIsFetching(false);
      }
    };
    load();
  }, [getValidToken]);

  // ─── Submit update ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (!firstName.trim() || !lastName.trim()) {
      setError(locale === "fa" ? "نام و نام خانوادگی نمی‌توانند خالی باشند" : "First name and last name cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const token = await getValidToken();
      const updated = await updateProfile(token, { firstName, lastName, phone });
      setProfile(updated);
      setSuccess(locale === "fa" ? "اطلاعات با موفقیت ذخیره شد" : "Information saved successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Loading skeleton ────────────────────────────────────────────────────────
  if (isFetching) {
    return (
      <div dir={locale === "fa" ? "rtl" : "ltr"} className="border border-[#47221C] rounded-xl px-4 pt-4 pb-6 animate-pulse">
        <div className="h-9 bg-[#47221C20] rounded-lg mb-6" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="mb-4">
            <div className="h-3 w-24 bg-[#47221C20] rounded mb-2" />
            <div className="h-10 bg-[#47221C10] rounded-md" />
          </div>
        ))}
        <div className="h-10 bg-[#47221C20] rounded-lg mt-4" />
      </div>
    );
  }

  return (
    <div dir={locale === "fa" ? "rtl" : "ltr"} className="border border-[#47221C] rounded-xl px-4 pt-4 pb-6">

      {/* Header */}
      <h6 className="md:text-[18px] sm:text-[15px] text-black p-2 rounded-[10px] border border-[#47221C] text-center mb-4">
        {locale === "fa" ? "ویرایش اطلاعات حساب کاربری" : "Edit Account Information"}
      </h6>

      {/* Profile badge */}
      {profile && (
        <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-[#47221C08] border border-[#47221C30]">
          <div className="w-10 h-10 rounded-full bg-[#47221C20] flex items-center justify-center flex-shrink-0">
            <CiUser className="text-[#47221C] text-[22px]" />
          </div>
          <div className={locale === "fa" ? "text-right" : "text-left"}>
            <p className="text-[14px] font-bold text-[#47221C]">
              {profile.firstName || ""} {profile.lastName || ""}
            </p>
            <p className="text-[12px] text-gray-500" dir="ltr">{profile.phone}</p>
          </div>
          {profile.isPhoneVerified && (
            <span className={`${locale === "fa" ? "mr-auto" : "ml-auto"} text-[11px] text-green-700 bg-green-100 px-2 py-0.5 rounded-full`}>
              {locale === "fa" ? "تأیید شده" : "Verified"}
            </span>
          )}
        </div>
      )}

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="block md:text-[14px] sm:text-[11px] text-[#47221C] mb-1">
            {locale === "fa" ? "نام" : "First Name"}
          </label>
          <input
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            className="md:px-3 sm:px-2 md:py-2 sm:py-1.5 md:text-[15px] sm:text-[12px] rounded-md bg-transparent border border-[#47221C] w-full outline-none focus:border-[#47221Caa] transition-colors placeholder:text-gray-400"
            placeholder={locale === "fa" ? "نام" : "First Name"}
          />
        </div>

        <div>
          <label className="block md:text-[14px] sm:text-[11px] text-[#47221C] mb-1">
            {locale === "fa" ? "نام خانوادگی" : "Last Name"}
          </label>
          <input
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            className="md:px-3 sm:px-2 md:py-2 sm:py-1.5 md:text-[15px] sm:text-[12px] rounded-md bg-transparent border border-[#47221C] w-full outline-none focus:border-[#47221Caa] transition-colors placeholder:text-gray-400"
            placeholder={locale === "fa" ? "نام خانوادگی" : "Last Name"}
          />
        </div>

        <div>
          <label className="block md:text-[14px] sm:text-[11px] text-[#47221C] mb-1">
            {locale === "fa" ? "شماره موبایل" : "Phone Number"}
          </label>
          <input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            dir="ltr"
            className={`md:px-3 sm:px-2 md:py-2 sm:py-1.5 md:text-[15px] sm:text-[12px] rounded-md bg-transparent border border-[#47221C] w-full outline-none focus:border-[#47221Caa] transition-colors placeholder:text-gray-400 ${locale === "fa" ? "text-right" : "text-left"}`}
            placeholder="09xxxxxxxxx"
          />
        </div>
      </div>

      {/* Feedback */}
      {error   && <p className="mt-3 text-sm text-red-600 text-center">{error}</p>}
      {success && <p className="mt-3 text-sm text-green-700 text-center">{success}</p>}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full md:text-[16px] sm:text-[13px] text-white p-2 rounded-[10px] bg-[#363635] text-center mt-5 disabled:opacity-60 transition-opacity"
      >
        {isSaving
          ? (locale === "fa" ? "در حال ذخیره..." : "Saving...")
          : (locale === "fa" ? "ذخیره تغییرات" : "Save Changes")}
      </button>
    </div>
  );
}
