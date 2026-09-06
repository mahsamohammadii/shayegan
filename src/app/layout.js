"use client"
import "./globals.css";
import Footer from "@/components/layout/Footer";
import { LanguageProvider } from "./contexts/LanguageContext"
import { MatnProvider } from "./contexts/MatnContext"
import { ContentProvider } from "./contexts/ContentContext"
import Header from "@/components/layout/Header";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import { useState, useEffect } from "react";
import { usePathname } from 'next/navigation';
import Lenis from "@studio-freight/lenis";
import { LoginProvider } from "./contexts/LoginContext";
import { CartProvider } from "./contexts/CartContext";

export default function RootLayout({ children }) {
  const [isHome, setIsHome] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsHome(pathname === '/');
  }, [pathname]);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 2.5,
      smooth: true,
      easing: (t) => 1 - Math.pow(1 - t, 3)
    });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);

    // Prevent iOS Safari pinch/gesture zoom
    const preventGesture = (e) => e.preventDefault();
    document.addEventListener("gesturestart", preventGesture, { passive: false });
    document.addEventListener("gesturechange", preventGesture, { passive: false });
    document.addEventListener("gestureend", preventGesture, { passive: false });

    // Prevent Ctrl/Cmd + Wheel zoom on Desktop
    const preventWheelZoom = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };
    document.addEventListener("wheel", preventWheelZoom, { passive: false });

    return () => {
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      document.removeEventListener("gestureend", preventGesture);
      document.removeEventListener("wheel", preventWheelZoom);
    };
  }, []);

  return (
    <html>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, shrink-to-fit=no, viewport-fit=cover"
        />
      </head>
      <body>
        <LoginProvider>
          <CartProvider>
            <LanguageProvider>
              <MatnProvider>
                <ContentProvider>
                  <AnnouncementBar />
                  <Header />
                  {children}
                  {!isHome && <Footer />}
                </ContentProvider>
              </MatnProvider>
            </LanguageProvider>
          </CartProvider>
        </LoginProvider>
      </body>
    </html>
  );
}
