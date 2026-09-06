"use client"
import Link from "next/link"
import React, { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from 'next/navigation'
import { BsFillPhoneFill, BsFillEyeFill, BsHeadset, BsPencilSquare } from "react-icons/bs"
import { useLanguage } from "../../app/contexts/LanguageContext"
import { useLogin } from "../../app/contexts/LoginContext"
import { requestOtp, verifyOtp } from "../../lib/api/auth"

/** Stepped OTP resend delays (in seconds) for successive attempts: 30s -> 1m -> 3m -> 5m -> 15m */
const RESEND_STEPS = [30, 60, 180, 300, 900];

function formatCountdown(sec, locale) {
  if (sec >= 60) {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    if (locale === "fa") {
      return secs > 0 ? `${mins} دقیقه و ${secs} ثانیه` : `${mins} دقیقه`;
    }
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  return locale === "fa" ? `${sec} ثانیه` : `${sec}s`;
}

export default function Login() {
  const router  = useRouter()
  const { locale } = useLanguage()
  const { login } = useLogin()

  // ─── UI state ───────────────────────────────────────────────────────────────
  /** 0 = mobile input  |  1 = OTP input */
  const [action, setAction]       = useState(0)
  const [mobile, setMobile]       = useState("")
  const [code, setCode]           = useState("")
  const [remember, setRemember]   = useState(false)

  // ─── Stepped OTP Resend state ────────────────────────────────────────────────
  const [resendCount, setResendCount]           = useState(0)
  const [isSuspended, setIsSuspended]           = useState(false)
  const [suspendedMessage, setSuspendedMessage] = useState("")

  // ─── Async / feedback state ──────────────────────────────────────────────────
  const [isLoading, setIsLoading]     = useState(false)
  const [error, setError]             = useState("")
  const [infoMessage, setInfoMessage] = useState("")

  // ─── Countdown for "Resend OTP" ─────────────────────────────────────────────
  const [countdown, setCountdown]   = useState(0)
  const countdownRef                = useRef(null)

  const startCountdown = useCallback((seconds) => {
    setCountdown(seconds)
    clearInterval(countdownRef.current)
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  useEffect(() => () => clearInterval(countdownRef.current), [])

  // ─── Remember-me restore ─────────────────────────────────────────────────────
  useEffect(() => {
    const remembered = localStorage.getItem('rememberMe') === 'true'
    if (remembered) {
      setMobile(localStorage.getItem('rememberedMobile') || "")
      setRemember(true)
    }
  }, [])

  // ─── Step 1: Send OTP ────────────────────────────────────────────────────────
  async function handleRequestOtp() {
    setError("")
    setInfoMessage("")

    if (isSuspended) return

    const cleaned = mobile.trim()
    if (!/^09\d{9}$/.test(cleaned)) {
      setError(locale === "fa"
        ? "شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹)"
        : "Invalid mobile number (e.g. 09123456789)")
      return
    }

    setIsLoading(true)
    try {
      const res = await requestOtp(cleaned)
      const isSent = res?.data?.sent !== false

      if (remember) {
        localStorage.setItem('rememberMe', 'true')
        localStorage.setItem('rememberedMobile', cleaned)
      } else {
        localStorage.removeItem('rememberMe')
        localStorage.removeItem('rememberedMobile')
      }

      if (!isSent) {
        setError(res?.message || (locale === "fa" ? "در حال حاضر امکان ارسال کد نبود. لطفاً کمی بعد دوباره تلاش کنید" : "Could not send SMS code. Please try again."))
        return
      }

      setAction(1)
      const waitTime = RESEND_STEPS[Math.min(resendCount, RESEND_STEPS.length - 1)]
      startCountdown(waitTime)
      setResendCount(prev => prev + 1)
    } catch (err) {
      if (err.status === 403) {
        setIsSuspended(true)
        setSuspendedMessage(err.message || (locale === "fa" ? "درخواست کد از این دستگاه بیش از حد مجاز است. لطفاً با پشتیبانی سایت تماس بگیرید" : "Too many requests from this device. Please contact support."))
        setError(err.message)
      } else if (err.status === 400) {
        setError(err.message)
      } else {
        setError(err.message || (locale === "fa" ? "خطا در ارسال کد" : "Failed to send code"))
      }
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Resend OTP (Stepped Countdown) ─────────────────────────────────────────
  async function handleResendOtp() {
    if (countdown > 0 || isSuspended || isLoading) return
    setError("")
    setInfoMessage("")
    setIsLoading(true)
    try {
      const res = await requestOtp(mobile.trim())
      const isSent = res?.data?.sent !== false

      if (!isSent) {
        setError(res?.message || (locale === "fa" ? "در حال حاضر امکان ارسال کد نبود. لطفاً کمی بعد دوباره تلاش کنید" : "Could not send SMS code. Please try again."))
        return
      }

      const waitTime = RESEND_STEPS[Math.min(resendCount, RESEND_STEPS.length - 1)]
      startCountdown(waitTime)
      setResendCount(prev => prev + 1)
      setInfoMessage(locale === "fa" ? "کد جدید با موفقیت ارسال شد" : "New OTP code sent successfully")
    } catch (err) {
      if (err.status === 403) {
        setIsSuspended(true)
        setSuspendedMessage(err.message || (locale === "fa" ? "درخواست کد از این دستگاه بیش از حد مجاز است. لطفاً با پشتیبانی سایت تماس بگیرید" : "Too many requests from this device. Please contact support."))
        setError(err.message)
      } else if (err.status === 400) {
        setError(err.message)
      } else {
        setError(err.message || (locale === "fa" ? "خطا در ارسال مجدد کد" : "Failed to resend code"))
      }
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Step 2: Verify OTP ───────────────────────────────────────────────────────
  async function handleVerifyOtp() {
    setError("")
    setInfoMessage("")
    if (!code.trim()) {
      setError(locale === "fa" ? "کد تأیید را وارد کنید" : "Please enter the OTP code")
      return
    }

    setIsLoading(true)
    try {
      const verifyData = await verifyOtp(mobile.trim(), code.trim())
      const userData = verifyData?.user || verifyData

      setResendCount(0)
      setIsSuspended(false)

      login(userData)
      router.push('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      dir={locale === "fa" ? "rtl" : "ltr"}
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-[#FBF9F5] selection:bg-[#786548] selection:text-white"
    >
      <div className="w-full max-w-[440px] flex flex-col items-center">
        {/* Logo centered above the card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-6 flex flex-col items-center"
        >
          <Link href="/">
            <img
              src="/images/logo.png"
              alt="Shayegan Design"
              className="w-[220px] md:w-[250px] h-auto object-contain cursor-pointer transition-transform duration-300 hover:scale-105"
            />
          </Link>
        </motion.div>

        {/* Auth Card Container */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full bg-white rounded-2xl border border-stone-200/80 shadow-[0_12px_35px_-10px_rgba(54,54,53,0.08)] p-6 md:p-8"
        >
          <AnimatePresence mode="wait">
            {action === 0 ? (
              <motion.div
                key="step-mobile"
                initial={{ opacity: 0, x: locale === "fa" ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: locale === "fa" ? -20 : 20 }}
                transition={{ duration: 0.3 }}
                className="w-full flex flex-col"
              >
                <h1 className="text-[#363635] text-xl font-bold text-center mb-1">
                  {locale === "fa" ? "ورود / ثبت‌نام" : "Login / Register"}
                </h1>
                <p className="text-stone-500 text-xs text-center mb-6">
                  {locale === "fa"
                    ? "لطفاً شماره موبایل خود را وارد کنید"
                    : "Please enter your phone number to proceed"}
                </p>

                {/* Mobile input form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleRequestOtp();
                  }}
                  className="space-y-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#363635]">
                      {locale === "fa" ? "شماره موبایل" : "Phone Number"}
                    </label>
                    <div className="relative flex items-center border border-stone-300 rounded-xl bg-stone-50/50 focus-within:border-[#363635] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#363635]/10 transition-all duration-200 px-3.5 py-2.5">
                      <BsFillPhoneFill className="text-stone-400 text-lg ml-2 flex-shrink-0" />
                      <input
                        type="tel"
                        maxLength={11}
                        minLength={11}
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        disabled={isSuspended}
                        placeholder={locale === "fa" ? "۰۹۱۲۳۴۵۶۷۸۹" : "09123456789"}
                        dir="ltr"
                        required
                        className="w-full bg-transparent text-left outline-none text-stone-800 text-sm font-mono tracking-wider placeholder:text-stone-400 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 text-[#363635] focus:ring-[#363635] accent-[#363635] cursor-pointer"
                    />
                    <label
                      htmlFor="rememberMe"
                      className="text-xs text-stone-600 select-none cursor-pointer"
                    >
                      {locale === "fa" ? "مرا بخاطر بسپار" : "Remember me"}
                    </label>
                  </div>

                  <p className="text-[11px] text-stone-400 leading-relaxed pt-1">
                    {locale === "fa" ? "ورود شما به معنای" : "By continuing, you accept"}{" "}
                    <Link href="/regulations" className="text-[#363635] font-semibold underline underline-offset-2">
                      {locale === "fa" ? "پذیرش شرایط آدرینیکس" : "Terms & Conditions"}
                    </Link>{" "}
                    {locale === "fa" ? "و" : "and"}{" "}
                    <Link href="/regulations" className="text-[#363635] font-semibold underline underline-offset-2">
                      {locale === "fa" ? "قوانین حریم‌خصوصی" : "Privacy Policy"}
                    </Link>{" "}
                    {locale === "fa" ? "است." : "."}
                  </p>

                  {error && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs text-center font-medium">
                      {error}
                    </div>
                  )}

                  {isSuspended && (
                    <div className="p-4 rounded-xl border border-red-300 bg-red-50/90 text-red-800 text-xs text-center space-y-3">
                      <p className="font-semibold leading-relaxed">
                        {suspendedMessage ||
                          (locale === "fa"
                            ? "درخواست کد از این دستگاه بیش از حد مجاز است. لطفاً با پشتیبانی سایت تماس بگیرید."
                            : "Too many requests from this device. Please contact site support.")}
                      </p>
                      <Link
                        href="/contactUs"
                        className="inline-flex items-center justify-center gap-1.5 bg-[#363635] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-black transition-colors"
                      >
                        <BsHeadset className="text-sm" />
                        {locale === "fa" ? "تماس با پشتیبانی" : "Contact Support"}
                      </Link>
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={isLoading || isSuspended}
                    className="w-full bg-[#363635] hover:bg-black text-white font-medium py-3 px-4 rounded-xl text-sm transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
                  >
                    {isLoading
                      ? (locale === "fa" ? "در حال ارسال..." : "Sending...")
                      : (locale === "fa" ? "ارسال کد تأیید" : "Send verification code")}
                  </motion.button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="step-otp"
                initial={{ opacity: 0, x: locale === "fa" ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: locale === "fa" ? 20 : -20 }}
                transition={{ duration: 0.3 }}
                className="w-full flex flex-col"
              >
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => {
                      setAction(0);
                      setError("");
                      setInfoMessage("");
                      setCode("");
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-[#363635] bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <BsPencilSquare className="text-xs" />
                    {locale === "fa" ? "اصلاح شماره" : "Edit phone"}
                  </button>
                  <span className="text-xs font-mono font-bold text-[#363635] dir-ltr">
                    {mobile}
                  </span>
                </div>

                <h1 className="text-[#363635] text-xl font-bold text-center mb-1">
                  {locale === "fa" ? "ورود کد تأیید" : "Enter Verification Code"}
                </h1>
                <p className="text-stone-500 text-xs text-center mb-6">
                  {locale === "fa"
                    ? `کد پیامک‌شده به شماره ${mobile} را وارد کنید`
                    : `Enter the code sent to ${mobile}`}
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleVerifyOtp();
                  }}
                  className="space-y-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#363635]">
                      {locale === "fa" ? "کد تأیید 6 رقمی" : "6-Digit OTP Code"}
                    </label>
                    <div className="relative flex items-center border border-stone-300 rounded-xl bg-stone-50/50 focus-within:border-[#363635] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#363635]/10 transition-all duration-200 px-3.5 py-2.5">
                      <BsFillEyeFill className="text-stone-400 text-lg ml-2 flex-shrink-0" />
                      <input
                        type="text"
                        maxLength={6}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        disabled={isSuspended}
                        placeholder="••••••"
                        dir="ltr"
                        required
                        className="w-full bg-transparent text-center outline-none text-stone-900 text-lg font-mono tracking-[0.5em] placeholder:text-stone-300 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs text-center font-medium">
                      {error}
                    </div>
                  )}

                  {infoMessage && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs text-center font-medium">
                      {infoMessage}
                    </div>
                  )}

                  {isSuspended && (
                    <div className="p-4 rounded-xl border border-red-300 bg-red-50/90 text-red-800 text-xs text-center space-y-3">
                      <p className="font-semibold leading-relaxed">
                        {suspendedMessage ||
                          (locale === "fa"
                            ? "درخواست کد از این دستگاه بیش از حد مجاز است. لطفاً با پشتیبانی سایت تماس بگیرید."
                            : "Too many requests from this device. Please contact site support.")}
                      </p>
                      <Link
                        href="/contactUs"
                        className="inline-flex items-center justify-center gap-1.5 bg-[#363635] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-black transition-colors"
                      >
                        <BsHeadset className="text-sm" />
                        {locale === "fa" ? "تماس با پشتیبانی" : "Contact Support"}
                      </Link>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={countdown > 0 || isLoading || isSuspended}
                      className="text-xs font-medium text-[#363635] hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed cursor-pointer"
                    >
                      {locale === "fa" ? "ارسال مجدد کد" : "Resend code"}
                    </button>

                    {countdown > 0 && (
                      <span className="text-xs font-mono text-stone-500">
                        {formatCountdown(countdown, locale)}
                      </span>
                    )}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={isLoading || isSuspended}
                    className="w-full bg-[#363635] hover:bg-black text-white font-medium py-3 px-4 rounded-xl text-sm transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
                  >
                    {isLoading
                      ? (locale === "fa" ? "در حال بررسی..." : "Verifying...")
                      : (locale === "fa" ? "تأیید و ورود" : "Verify & Login")}
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}