"use client"
import Link from "next/link"
import React, { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { useRouter } from 'next/navigation'
import { BsFillPhoneFill, BsFillEyeFill, BsHeadset } from "react-icons/bs"
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

  // ─── Animation variants ──────────────────────────────────────────────────────
  const boxVariant = {
    hidden: { opacity: 0, y: 50 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.6, ease: "easeOut" },
    }),
  }

  const imgVariant = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  }

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
        // SMS was not dispatched by provider -> allow immediate re-try without advancing step
        setError(res?.message || (locale === "fa" ? "در حال حاضر امکان ارسال کد نبود. لطفاً کمی بعد دوباره تلاش کنید" : "Could not send SMS code. Please try again."))
        return
      }

      // SMS dispatched successfully
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

      // Reset local counter and suspension state upon successful login
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
    <div dir={locale === "fa" ? "rtl" : "ltr"} className="w-full h-screen flex items-center justify-center">
      <div>
        {/* Logo */}
        <motion.img
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={imgVariant}
          src="/images/logo.png"
          className="w-[250px] mx-auto -mt-6"
        />

        {/* ── Step 0: Mobile number ──────────────────────────────────────────── */}
        {action === 0 && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={boxVariant}
            className="md:w-[600px] sm:w-[90%] border border-gray-500 rounded-md p-4"
          >
            <h1 className="text-[#363635] text-xl text-center font-bold mt-3">
              {locale === "fa" ? "ورود" : "Login"}
            </h1>

            <div className="credentials-panel mt-5">
              <div className="field-wrapper">
                <input
                  maxLength={11}
                  minLength={11}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  disabled={isSuspended}
                  required
                  className="bg-tranparent outline-none text-right disabled:opacity-50"
                />
                <label>{locale === "fa" ? "شماره موبایل" : "Phone number"}</label>
                <BsFillPhoneFill />
              </div>
            </div>

            <label className="flex items-center space-x-1 text-[15px] mt-4 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
              />
              <span className="pr-0.5 text-sm text-[#363635]">
                {locale === "fa" ? "مرا بخاطر بسپار" : "Remember me"}
              </span>
            </label>

            <p className="text-xs text-zinc-500">
              {locale === "fa" ? "ورود شما به معنای" : "Login"}{" "}
              <Link href="/regulations" className="text-[#363635]">
                {locale === "fa" ? "پذیرش شرایط آدرینیکس" : ""}
              </Link>{" "}
              {locale === "fa" ? "و" : "and"}{" "}
              <Link href="/regulations" className="text-[#363635]">
                {locale === "fa" ? "قوانین حریم‌خصوصی" : ""}
              </Link>{" "}
              {locale === "fa" ? "است." : ""}
            </p>

            {/* Error message */}
            {error && (
              <p className="mt-3 text-sm text-red-600 text-center">{error}</p>
            )}

            {/* 403 Device Suspended Banner */}
            {isSuspended && (
              <div className="mt-4 p-4 rounded-md border border-red-500 bg-red-50 text-red-800 text-sm text-center">
                <p className="font-bold mb-2">
                  {suspendedMessage || (locale === "fa" 
                    ? "درخواست کد از این دستگاه بیش از حد مجاز است. لطفاً با پشتیبانی سایت تماس بگیرید."
                    : "Too many requests from this device. Please contact site support.")}
                </p>
                <div className="flex justify-center items-center gap-2 mt-3">
                  <Link href="/contactUs" className="bg-[#363635] text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-1 hover:bg-black transition-colors">
                    <BsHeadset className="text-sm" />
                    {locale === "fa" ? "تماس با پشتیبانی" : "Contact Support"}
                  </Link>
                </div>
              </div>
            )}

            <button
              onClick={handleRequestOtp}
              disabled={isLoading || isSuspended}
              className="bg-[#363635] py-2 text-sm text-white w-full text-center rounded-sm mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? (locale === "fa" ? "در حال ارسال..." : "Sending...")
                : (locale === "fa" ? "ارسال کد" : "Send code")}
            </button>
          </motion.div>
        )}

        {/* ── Step 1: OTP verification ───────────────────────────────────────── */}
        {action === 1 && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={boxVariant}
            className="md:w-[600px] sm:w-[90%] border border-gray-500 rounded-md p-4"
          >
            <h1 className="text-[#363635] text-[18px] font-bold mt-3">
              {locale === "fa" ? "در حال ارسال کد به شماره" : "Sending code to"}{" "}
              {mobile}
            </h1>

            {/* Edit mobile — goes back to step 0 */}
            <button
              className="my-3 border border-[#363635] rounded-[5px] p-2 text-[#363635] text-[14px] hover:bg-[#36363520]"
              onClick={() => { setAction(0); setError(""); setInfoMessage(""); setCode("") }}
            >
              {locale === "fa" ? "اصلاح شماره موبایل" : "Edit phone number"}
            </button>

            <div className="credentials-panel mt-5">
              <div className="field-wrapper">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={isSuspended}
                  required
                  maxLength={6}
                  className="bg-tranparent outline-none text-right disabled:opacity-50"
                />
                <label>{locale === "fa" ? "کد تأیید" : "OTP Code"}</label>
                <BsFillEyeFill />
              </div>
            </div>

            {/* Error & Info messages */}
            {error && (
              <p className="mt-3 text-sm text-red-600 text-center">{error}</p>
            )}
            {infoMessage && (
              <p className="mt-3 text-sm text-emerald-700 text-center">{infoMessage}</p>
            )}

            {/* 403 Device Suspended Banner */}
            {isSuspended && (
              <div className="mt-4 p-4 rounded-md border border-red-500 bg-red-50 text-red-800 text-sm text-center">
                <p className="font-bold mb-2">
                  {suspendedMessage || (locale === "fa" 
                    ? "درخواست کد از این دستگاه بیش از حد مجاز است. لطفاً با پشتیبانی سایت تماس بگیرید."
                    : "Too many requests from this device. Please contact site support.")}
                </p>
                <div className="flex justify-center items-center gap-2 mt-3">
                  <Link href="/contactUs" className="bg-[#363635] text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-1 hover:bg-black transition-colors">
                    <BsHeadset className="text-sm" />
                    {locale === "fa" ? "تماس با پشتیبانی" : "Contact Support"}
                  </Link>
                </div>
              </div>
            )}

            {/* Resend OTP with Stepped Countdown */}
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={handleResendOtp}
                disabled={countdown > 0 || isLoading || isSuspended}
                className="text-sm text-[#363635] underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
              >
                {locale === "fa" ? "ارسال مجدد کد" : "Resend code"}
              </button>
              {countdown > 0 && (
                <span className="text-xs text-zinc-600 font-medium">
                  ({formatCountdown(countdown, locale)})
                </span>
              )}
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={isLoading || isSuspended}
              className="bg-[#363635] py-2 text-sm text-white w-full text-center rounded-sm mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? (locale === "fa" ? "در حال بررسی..." : "Verifying...")
                : (locale === "fa" ? "وارد شوید" : "Login")}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}