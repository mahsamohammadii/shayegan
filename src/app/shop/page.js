import Shop from "@/components/shop/Shop";
import { Suspense } from "react";

export const metadata = {
  title: "فروشگاه | شایگان دیزاین",
  description: "جستجو و فیلتر میان تمام محصولات شایگان دیزاین",
  robots: "index,follow",
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, shrink-to-fit=no, viewport-fit=cover",
  icons: {
    icon: "/images/favicon.ico",
  },
};

export default function ShopPage() {
  return (
    <div className="w-full">
      <Suspense fallback={<div className="loadingdiv"><div className="loadingdivinside" /></div>}>
        <Shop />
      </Suspense>
    </div>
  );
}
