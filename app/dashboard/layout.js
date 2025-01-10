/** @format */

import Footer from "@/components/Footer";
import Header from "@/components/Header";

export default function HomeLayout({ children }) {
  return (
    <div className="home-layout">
      <header className="bg-sky-900 text-white">
        <Header />
      </header>
      {children}
      <footer className="bg-sky-900 text-white py-4">
        <Footer />
      </footer>
    </div>
  );
}
