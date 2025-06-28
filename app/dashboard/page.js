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
          <div className="bg-white rounded-lg lg:max-h-[66%] lg:h-[66%] shadow-md p-6 flex-1 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <Link
                href="/dashboard/content/explore"
                className="text-sm text-blue-500 hover:underline">
                גלה עוד תכנים
              </Link>
              <h2 className="text-2xl font-semibold text-right">תכנים חדשים</h2>
            </div>
            <div className="h-full flex-1 overflow-hidden">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <SingleItemCarousel materials={latestMaterials} />
              )}
            </div>
          </div>

          {/* Social Media Grid - 2x2 */}
          <div className="lg:max-h-[34%] lg:h-[34%] flex flex-col overflow-hidden">
            <h2 className="text-sm font-semibold mb-2 text-right">
              עקבו אחרינו ברשתות החברתיות
            </h2>
            <div className="grid grid-cols-2 gap-2 flex-1">
              {/* Facebook */}
              <div className="bg-white rounded-lg shadow-md flex items-center justify-center hover:shadow-lg transition-shadow">
                <a
                  href="https://www.facebook.com/ouyouthcenters"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-blue-50 transition-colors group w-full h-full justify-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700 group-hover:text-blue-600 text-center font-medium">
                    פייסבוק
                  </span>
                </a>
              </div>

              {/* Instagram */}
              <div className="bg-white rounded-lg shadow-md flex items-center justify-center hover:shadow-lg transition-shadow">
                <a
                  href="https://www.instagram.com/merkazey_hanoar_ou/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-pink-50 transition-colors group w-full h-full justify-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700 group-hover:text-pink-600 text-center font-medium">
                    אינסטגרם
                  </span>
                </a>
              </div>

              {/* YouTube */}
              <div className="bg-white rounded-lg shadow-md flex items-center justify-center hover:shadow-lg transition-shadow">
                <a
                  href="https://www.youtube.com/@ouisrael"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-red-50 transition-colors group w-full h-full justify-center">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700 group-hover:text-red-600 text-center font-medium">
                    יוטיוב
                  </span>
                </a>
              </div>

              {/* TikTok */}
              <div className="bg-white rounded-lg shadow-md flex items-center justify-center hover:shadow-lg transition-shadow">
                <a
                  href="https://www.tiktok.com/@ouisrael"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-black hover:text-white transition-colors group w-full h-full justify-center">
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700 group-hover:text-white text-center font-medium">
                    טיקטוק
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
