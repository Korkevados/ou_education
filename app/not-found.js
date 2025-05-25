/** @format */

"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Header from "@/components/Header";

export default function NotFound() {
  const router = useRouter();

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FAFB] p-4">
        <div className="max-w-md w-full mx-auto bg-white p-8 rounded-xl shadow-md text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/images/ouisrael_logo.png"
              alt="לוגו"
              width={120}
              height={120}
              priority
            />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            הדף לא נמצא
          </h2>
          <p className="text-gray-600 mb-8">
            מצטערים, אך הדף שחיפשת אינו קיים.
          </p>

          <button
            onClick={() => router.push("/dashboard")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors duration-200">
            חזרה לדף הבית
          </button>
        </div>
      </div>
    </>
  );
}
