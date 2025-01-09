/** @format */

import { Rubik } from "next/font/google";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./globals.css";

const rubik = Rubik({ subsets: ["hebrew"] });

export const metadata = {
  title: "OU - ברוכים הבאים",
  description: "הצטרפו למשפחת המדריכים שלנו",
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body
        className={`${rubik.className} min-h-screen flex flex-col bg-sky-50`}>
        <Header />
        <main className="flex flex-col flex-1 h-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
