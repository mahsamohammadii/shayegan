"use client";
import { FaHeart } from "react-icons/fa";
import { useLanguage } from "@/app/contexts/LanguageContext";

export default function Sec4Panel() {
  const { locale } = useLanguage();

  return (
    <>
        <div dir="ltr" className="border border-[#47221C] rounded-xl px-2 pt-2">
            <h6 className="md:text-[18px] sm:text-[15px] text-black p-2 rounded-[10px] border border-[#47221C] text-center">لیست علاقه مندی ها</h6>
            {[...Array(6)].map((_, i) => (
            <div key={i} dir="rtl" className="flex items-center gap-2 w-full border-b border-[#47221C] md:py-1.5 sm:py-2">
                <img src="/images/sandali.png" className="md:w-[120px] sm:w-[80px]"/>
                <div className="w-full">
                    <div className="flex justify-between items-center">
                    <p className="md:text-[15px] sm:text-[10px] text-black font-bold">صندلی راحتی کرم </p>
                    <div className="flex md:gap-2 sm:gap-1">
                        <button className="text-[#910D3C] md:text-[15px] sm:text-[10px] ">حذف</button>
                        <FaHeart color="red" className="md:text-[20px] sm:text-[13px]"/>
                    </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                    <p className="text-gray-500 md:text-[12px] sm:text-[9px]">{new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format('70000000')} {locale === "fa" ? "تومان" : "IRT"}</p>
                    <button className="md:text-[14px] sm:text-[12px] py-2 px-4 rounded-[8px] bg-[#363635] text-white">مشاهده</button>
                    </div>
                </div>
            </div>
            ))}
        </div>
    </>
  );
}
