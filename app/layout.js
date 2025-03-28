/** @format */

import { Rubik } from "next/font/google";
import Footer from "../components/Footer";
import "./globals.css";

const rubik = Rubik({ subsets: ["hebrew"] });

export const metadata = {
  title: "OU - ברוכים הבאים",
  description: "הצטרפו למשפחת המדריכים שלנו",
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl" className="h-full">
      <body className={`${rubik.className} h-full bg-sky-50`}>{children}</body>
    </html>
  );
}
