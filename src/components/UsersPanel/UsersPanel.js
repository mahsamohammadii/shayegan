"use client";
import Link from "next/link";
import React,{ useState, useEffect }  from 'react';
import { CiUser } from "react-icons/ci";
import { CiEdit } from "react-icons/ci";
import { CiFloppyDisk } from "react-icons/ci";
import { CiChat1 } from "react-icons/ci";
import { CiLogout } from "react-icons/ci";
import { CiGrid42 } from "react-icons/ci";
import { CiLocationOn } from "react-icons/ci";
import { CgMenuLeftAlt } from "react-icons/cg";
import Sec1Panel from "./Sec1Panel/Sec1Panel";
import Sec2Panel from "./Sec2Panel/Sec2Panel";
import Sec3Panel from "./Sec3Panel/Sec3Panel";
import Sec5Panel from "./Sec5Panel/Sec5Panel";
import AddressesPanel from "./AddressesPanel/AddressesPanel";

import { useLogin } from "../../app/contexts/LoginContext"
import { useLanguage } from "../../app/contexts/LanguageContext";
import { getProfile } from "../../lib/api/profile";
import { useRouter } from 'next/navigation';

const tabs = [
  { nameFa: 'داشبورد',              nameEn: 'Dashboard',       icon: <CiGrid42 />,    id: 1 },
  { nameFa: 'اطلاعات حساب کاربری', nameEn: 'Account Details', icon: <CiUser />,      id: 2 },
  { nameFa: 'سفارشات',             nameEn: 'Orders',          icon: <CiFloppyDisk />, id: 3 },
  { nameFa: 'ارتباط با پشتیبانی',  nameEn: 'Customer Support', icon: <CiChat1 />,     id: 4 },
  { nameFa: 'آدرس‌های من',         nameEn: 'My Addresses',    icon: <CiLocationOn />, id: 5 },
];

export default function UsersPanel() {
  const router = useRouter();
  const { isLoggedIn: log, logout, getValidToken } = useLogin();
  const { locale } = useLanguage();

  const [activeTab, setActiveTab] = useState(1);
  const [profile, setProfile] = useState(null);

  const [isMobile, setIsMobile] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 899);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load profile for sidebar display
  useEffect(() => {
    const load = async () => {
      try {
        const token = await getValidToken();
        if (!token) return;
        const data = await getProfile(token);
        setProfile(data);
      } catch { /* sidebar stays with placeholder */ }
    };
    load();
  }, [getValidToken]);


  return (
    <>
      {/* <HeroSecPanel/> */}
      <div dir={locale === "fa" ? "rtl" : "ltr"} className="md:w-[90%] w-[95%] mx-auto md:mt-16 mt-16 pb-20">
        {isMobile ? (
          <div className="flex items-center justify-between text-black border border-[#47221C] p-2 rounded-xl text-[16.5px]">
            <p>
              {locale === "fa" ? "به پنل کاربری شایگان دیزاین خوش آمدید" : "Welcome to Shaygan Design User Panel"}
            </p>
            <button onClick={() => setShowMobileNav(true)}>
              <CgMenuLeftAlt className="text-[23px]"/>
            </button>
          </div>
        ) : (
          <h6 className="text-[24px] text-black border border-[#47221C] p-2 rounded-xl text-center font-medium">
            {locale === "fa" ? "به پنل کاربری شایگان دیزاین خوش آمدید" : "Welcome to Shaygan Design User Panel"}
          </h6>
        )}
        <div className="flex flex-1 gap-4 md:mt-5 mt-3">
          {isMobile && (
            <div
              className={`fixed bottom-0 left-0 w-full bg-white rounded-t-2xl shadow-xl z-50
                          transition-transform duration-500 ease-in-out 
                          ${showMobileNav ? "translate-y-0" : "translate-y-full"}`}
            >
              <div className="p-5">
                <div className="flex justify-between">
                  <h5 className="text-[15px]">{profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || (locale === "fa" ? 'کاربر' : 'User') : (locale === "fa" ? 'کاربر' : 'User')}</h5>
                  <button onClick={() => setShowMobileNav(false)}>✕</button>
                </div>
                <h5 className="text-[12px] text-gray-500" dir="ltr">{profile?.phone || ''}</h5>

                <div className="mt-4 flex flex-col">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setShowMobileNav(false);
                      }}
                      className={`flex items-center text-[12px] gap-2 md:px-4 xs:px-2 h-8 border-t border-gray-300 transition-colors ${
                        activeTab === tab.id
                          ? "text-[#47221C] font-semibold"
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      <span className="text-[15px]">
                        {tab.icon}
                      </span>
                      {locale === "fa" ? tab.nameFa : tab.nameEn}
                    </button>
                  ))}

                  <button
                      onClick={async () => {
                        await logout();
                        router.push("/");
                      }}
                      className={`flex items-center text-[12px] gap-2 md:px-4 xs:px-2 h-8 border-t border-gray-300 transition-colors text-gray-600 hover:text-gray-800`}
                  >
                      <span className="text-[15px]">
                        <CiLogout/>
                      </span>
                      {locale === "fa" ? "خروج از حساب کاربری" : "Log out"}
                  </button>
                </div>
              </div>
            </div>
          )}
          {!isMobile && (
          <div className="relative w-[27%]">
            <div className="border border-[#47221C] rounded-xl p-5 shadow-sec1shadow sticky top-20 right-0 w-full">
              <div className="">
                <div className="mt-2 flex justify-between items-center">
                  <div className="text-black">
                    <h5 className="text-[16px]">
                      {profile ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || (locale === "fa" ? "کاربر" : "User") : (locale === "fa" ? "کاربر" : "User")}
                    </h5>
                    <p className="text-[12px] mt-1" dir="ltr">{profile?.phone || ""}</p>
                  </div>
                  <div>
                    <button onClick={() => setActiveTab(2)}>
                      <CiEdit className="text-[30px] text-[#47221C]"/>
                    </button>
                  </div>
                </div>
                <div className="relative w-full mt-4">
                  <div className="flex flex-col relative">
                    <div
                      className={`absolute ${locale === "fa" ? "-right-5 rounded-l-md" : "-left-5 rounded-r-md"} w-1 bg-[#47221C] transition-all duration-300`}
                      style={{
                        top: `${(activeTab - 1) * 48}px`,
                        height: '48px',
                      }}
                    />
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center justify-between px-4 h-12 ${locale === "fa" ? "text-right" : "text-left"} transition-colors duration-300 border-t border-[#47221C] ${
                          activeTab === tab.id
                            ? "text-[#47221C] font-semibold"
                            : "text-gray-600 hover:text-gray-800"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={`text-lg transition-colors ${
                              activeTab === tab.id ? "text-[#47221C]" : "text-gray-600"
                            }`}
                          >
                            {tab.icon}
                          </span>
                          {locale === "fa" ? tab.nameFa : tab.nameEn}
                        </span>
                      </button>
                    ))}
                    <button
                      onClick={async () => {
                         await logout();
                        router.push("/");
                      }}
                      className={`flex items-center justify-between px-4 h-12 ${locale === "fa" ? "text-right" : "text-left"} transition-colors duration-300 border-t border-[#47221C] text-gray-600 hover:text-gray-800`}>
                      <span className="flex items-center gap-2">
                      <span
                        className={`text-lg transition-colors text-gray-600`}
                      >
                        <CiLogout/>
                      </span>
                      {locale === "fa" ? "خروج از حساب کاربری" : "Log out"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}
          <div className={`md:w-[72.7%] w-full ${locale === "fa" ? "md:mr-[.3%] xs:mr-0" : "md:ml-[.3%] xs:ml-0"}`}>
            {activeTab == 1 && (
            <Sec1Panel setActiveTab={setActiveTab}/>
            )}
            {activeTab == 2 && (
            <Sec2Panel/>
            )} 
            {activeTab == 3 && (
            <Sec3Panel/>
            )}
            {activeTab == 4 && (
            <Sec5Panel/>
            )} 
            {activeTab == 5 && (
            <AddressesPanel/>
            )}
          </div>
        </div>
      </div>
    </>
  )
}