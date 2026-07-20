import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { Signature } from "@/components/signature";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display serif — used only for the wordmark + hero (never UI labels/data).
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Night Canteen",
  description: "Scan, order, and pay at the Night Canteen food truck.",
  authors: [{ name: "Megh Vyas" }],
  creator: "Megh Vyas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body
        data-author="Megh Vyas"
        className="min-h-full flex flex-col bg-background text-foreground"
      >
        {children}
        <Signature />
      </body>
    </html>
  );
}
