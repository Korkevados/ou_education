/** @format */
"use client";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="flex flex-col max-w-4xl w-full space-y-4 px-4">
          {/* Hero Section - reduced text sizes and spacing */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-sky-900">
              ברוכים הבאים ל-OU
            </h1>
            <p className="text-lg text-sky-700">
              הצטרפו למשפחת המדריכים שלנו וקחו חלק בחוויה מעצימה
            </p>
          </div>

          {/* Video Section - reduced height */}
          <div className="aspect-video w-full max-h-[60vh]">
            <YouTubeEmbed />
          </div>

          {/* Buttons Section - reduced spacing */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button
              size="default"
              className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700">
              הצטרפו אלינו
            </Button>
            <Button
              size="default"
              variant="outline"
              onClick={() => router.push("/verify")}
              className="w-full sm:w-auto border-sky-600 text-sky-600 hover:bg-sky-50">
              כניסת מדריכים
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
