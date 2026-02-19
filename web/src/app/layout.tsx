import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { AppShell } from "@/components/layout/AppShell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YachtDrop — Boat Parts, Delivered",
  description:
    "The fastest way to get chandlery supplies delivered to your boat. Browse thousands of marine parts and get them delivered to your marina.",
  icons: {
    icon: [
      { url: "/brand/logo.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/brand/logo.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "YachtDrop — Boat Parts, Delivered to Your Berth",
    description:
      "Browse thousands of marine parts and get them delivered to your marina. The UberEats of chandlery.",
    images: [{ url: "/brand/hero-bg.png", width: 1200, height: 630 }],
    siteName: "YachtDrop",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "YachtDrop — Boat Parts, Delivered",
    description:
      "Browse thousands of marine parts and get them delivered to your marina.",
    images: ["/brand/hero-bg.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0A2540",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
