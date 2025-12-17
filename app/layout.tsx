import type { Metadata } from "next";
import { Gowun_Dodum } from "next/font/google";
import "./globals.css";

const gowun = Gowun_Dodum({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--font-gowun",
});

export const metadata: Metadata = {
  title: "Christmas Rolling Paper",
  description: "Claymorphism Christmas rolling paper",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${gowun.variable}`}>
      <body
        className={`min-h-dvh bg-skyPastel-50 text-slate-800 ${gowun.className}`}
      >
        {children}
      </body>
    </html>
  );
}
