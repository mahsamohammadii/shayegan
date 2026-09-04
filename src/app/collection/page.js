import Collection from "@/components/collections/Collection";
import { Suspense } from "react";

export const metadata = {
  title: "شایگان دیزاین",
  description: "شایگان دیزاین",
  robots: "index,follow",
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
  icons: {
    icon: "/images/favicon.ico",
  },
};

export default function HomePage() {

  return (
    <div className="w-full">
      <Suspense fallback={<div>Loading...</div>}>
        <Collection />
      </Suspense>
    </div>
  );
}