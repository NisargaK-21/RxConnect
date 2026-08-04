import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ToastContainer from "@/components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "RxConnect — Premium Pharmacy Management Platform",
  description:
    "RxConnect streamlines pharmacy operations with intelligent order management, prescription processing, real-time inventory, and multi-branch coordination.",
  keywords: [
    "pharmacy management",
    "healthcare SaaS",
    "prescription processing",
    "inventory management",
    "order fulfillment",
    "multi-branch pharmacy",
  ],
  authors: [{ name: "RxConnect Healthcare" }],
  openGraph: {
    title: "RxConnect — Premium Pharmacy Management Platform",
    description:
      "Intelligent pharmacy operations platform for modern healthcare.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "RxConnect — Pharmacy Management Platform",
    description:
      "Streamline pharmacy operations with intelligent workflows.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { CartProvider } from "@/context/CartContext";

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gradient-soft">
        <CartProvider>
          {children}
          <ToastContainer />
        </CartProvider>
      </body>
    </html>
  );
}

