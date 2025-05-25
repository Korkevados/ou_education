/** @format */
"use client";

import { useState, useEffect } from "react";
import Calendar from "@/components/Calendar";
import Link from "next/link";
import { getMaterials } from "@/app/actions/materials";
import { toast } from "sonner";
import SingleItemCarousel from "@/components/SingleItemCarousel";

export default function Homepage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [latestMaterials, setLatestMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch latest materials
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await getMaterials();

        if (error) {
          toast.error(error);
          return;
        }

        // Sort materials by creation date and take the 10 most recent
        const sortedMaterials = (data || [])
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 10);

        setLatestMaterials(sortedMaterials);
      } catch (error) {
        console.error("Error fetching materials:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaterials();
  }, []);

  return (
    <div className="flex flex-col flex-1 h-full bg-sky-50">
      <div className="flex flex-col flex-1 h-full lg:min-h-[500px] lg:flex-row lg:h-[calc(100vh-16rem)] gap-4">
        {/* Calendar Section - 2/3 width on desktop */}
        <div className="lg:w-2/3">
          <div className="bg-white rounded-lg shadow-md p-6 h-full">
            <div className="h-[calc(100%-5rem)]">
              <Calendar
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            </div>
          </div>
        </div>

        {/* Right Side Section - 1/3 width on desktop */}
        <div className="lg:w-1/3 flex flex-col gap-4">
          {/* Latest Content Carousel */}
          <div className="bg-white rounded-lg lg:max-h-[55%] lg:h-[55%] shadow-md p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <Link
                href="/dashboard/content/explore"
                className="text-sm text-blue-500 hover:underline">
                גלה עוד תכנים
              </Link>
              <h2 className="text-2xl font-semibold text-right">תכנים חדשים</h2>
            </div>
            <div className="h-full flex-1">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <SingleItemCarousel materials={latestMaterials} />
              )}
            </div>
          </div>

          {/* Social Media Component */}
          <div className="bg-white rounded-lg lg:max-h-[45%] lg:h-[45%] shadow-md p-6 flex-1 flex flex-col">
            <h2 className="text-2xl font-semibold mb-2 text-right">
              עקבו אחרינו ברשתות החברתיות
            </h2>
            <div className="flex-1 overflow-y-auto">
              <p className="text-gray-600 mb-2 text-right">
                הצטרפו לקהילה שלנו ברשתות החברתיות
              </p>

              <div className="space-y-3">
                {/* Facebook */}
                <a
                  href="https://facebook.com/ouisrael"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors group">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </div>
                  <span className="text-gray-700 group-hover:text-blue-600">
                    עמוד הפייסבוק שלנו
                  </span>
                </a>

                {/* Instagram */}
                <a
                  href="https://instagram.com/ouisrael"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-pink-50 hover:border-pink-300 transition-colors group">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </div>
                  <span className="text-gray-700 group-hover:text-pink-600">
                    עמוד האינסטגרם שלנו
                  </span>
                </a>

                {/* Twitter */}
                <a
                  href="https://twitter.com/ouisrael"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-sky-50 hover:border-sky-300 transition-colors group">
                  <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                  </div>
                  <span className="text-gray-700 group-hover:text-sky-600">
                    עמוד הטוויטר שלנו
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
