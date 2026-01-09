import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SellerGenix - Seller Analytics Dashboard",
  description: "AI-powered analytics dashboard for sellers. View sales, finance, inventory, and performance insights with secure, read-only access.",
  keywords: ["analytics", "dashboard", "seller", "e-commerce", "inventory", "finance", "reporting"],
  authors: [{ name: "SellerGenix" }],
  icons: {
    icon: [
      { url: "/sellergenix-logo-220.svg", type: "image/svg+xml" },
    ],
    apple: "/sellergenix-logo-300.svg",
  },
  openGraph: {
    title: "SellerGenix - Seller Analytics Dashboard",
    description: "AI-powered analytics dashboard for sellers. View sales, finance, inventory, and performance insights.",
    url: "https://sellergenix.io",
    siteName: "SellerGenix",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
