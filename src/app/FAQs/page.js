import FAQs from "@/components/FAQs/FAQs";

export const metadata = {
  title: "شایگان دیزاین",
  description: "شایگان دیزاین",
  robots: "index,follow",
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, shrink-to-fit=no, viewport-fit=cover",
  icons: {
    icon: "/images/favicon.ico",
  },
};

export default function HomePage() {
  return (
    <div className="w-full">
      <FAQs/>
    </div>
  );
}