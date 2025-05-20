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
        <div className="lg:w-1/3 flex flex-col gap-8">
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

          {/* Additional Component */}
          <div className="bg-white rounded-lg lg:max-h-[45%] shadow-md p-6 flex-1">
            <h2 className="text-2xl font-semibold mb-4 text-right">
              סיכום חודשי
            </h2>
            <div className="realtive text-right">
              <p className="text-gray-600 mb-2">משימות שהושלמו: 12</p>
              <p className="text-gray-600 mb-2">
                תכנים חדשים: {latestMaterials.length}
              </p>
              <p className="text-gray-600">דירוג ממוצע: 4.5</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
