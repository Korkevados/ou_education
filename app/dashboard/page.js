/** @format */
"use client";

import { useState, useEffect } from "react";
import Calendar from "@/components/Calendar";
import NewContentCarousel from "@/components/NewContentCarousel";

// Dummy data for new content
const dummyNewContent = [
  {
    id: 1,
    title: "מערך שיעור חדש",
    subject: "חגים ומועדים",
    publishedAt: "2024-03-15",
    rating: 4.5,
  },
  {
    id: 2,
    title: "פעילות קבוצתית",
    subject: "כישורי חיים",
    publishedAt: "2024-03-14",
    rating: 4.8,
  },
  {
    id: 3,
    title: "מצגת הדרכה",
    subject: "ערכים ומידות",
    publishedAt: "2024-03-13",
    rating: 4.2,
  },
];

export default function Homepage() {
  const [selectedDate, setSelectedDate] = useState(new Date());

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
          {/* New Content Carousel */}
          <div className="bg-white rounded-lg lg:max-h-[55%] shadow-md p-6 flex-1">
            <h2 className="text-2xl font-semibold mb-2 text-right">
              תכנים חדשים
            </h2>
            <NewContentCarousel contents={dummyNewContent} />
          </div>

          {/* Additional Component */}
          <div className="bg-white rounded-lg lg:max-h-[45%] shadow-md p-6 flex-1">
            <h2 className="text-2xl font-semibold mb-4 text-right">
              סיכום חודשי
            </h2>
            <div className="realtive text-right">
              <p className="text-gray-600 mb-2">משימות שהושלמו: 12</p>
              <p className="text-gray-600 mb-2">תכנים חדשים: 5</p>
              <p className="text-gray-600">דירוג ממוצע: 4.5</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
