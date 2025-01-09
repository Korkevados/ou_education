/** @format */
"use client";
import { Button } from "@/components/ui/button";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="h-full flex items-center justify-center p-8 bg-sky-50">
      <div className="flex flex-col max-w-4xl w-full h-full space-y-8 mx-auto">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-sky-900">ברוכים הבאים ל-OU</h1>
          <p className="text-xl text-sky-700">
            הצטרפו למשפחת המדריכים שלנו וקחו חלק בחוויה מעצימה
          </p>
        </div>

        {/* Video Section */}
        <div className="aspect-video w-full">
          <YouTubeEmbed />
        </div>

        {/* Buttons Section */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            size="lg"
            className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700">
            הצטרפו אלינו
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push("/verify")}
            className="w-full sm:w-auto border-sky-600 text-sky-600 hover:bg-sky-50">
            כניסת מדריכים
          </Button>
        </div>
      </div>
    </div>
  );
}
