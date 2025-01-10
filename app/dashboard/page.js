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
  const [greeting, setGreeting] = useState("");

  // Time-based greeting
  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) {
        setGreeting("בוקר טוב");
      } else if (hour >= 12 && hour < 17) {
        setGreeting("צהריים טובים");
      } else if (hour >= 17 && hour < 21) {
        setGreeting("ערב טוב");
      } else {
        setGreeting("לילה טוב");
      }
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        {/* Greeting Title */}
        <h1 className="text-3xl font-bold mb-8 text-right text-gray-800">
          {greeting}, ישראל {/* Replace with actual user name */}
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Calendar Section - 2/3 width on desktop */}
          <div className="lg:w-2/3 min-h-[500px] lg:h-[calc(100vh-16rem)]">
            <div className="bg-white rounded-lg shadow-md p-6 h-full">
              <h2 className="text-2xl font-semibold mb-6 text-right">
                לוח שנה
              </h2>
              <div className="h-[calc(100%-5rem)]">
                <Calendar
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                />
              </div>
            </div>
          </div>

          {/* Right Side Section - 1/3 width on desktop */}
          <div className="lg:w-1/3 flex flex-col gap-8 lg:h-[calc(100vh-16rem)]">
            {/* New Content Carousel */}
            <div className="bg-white rounded-lg shadow-md p-6 flex-1">
              <h2 className="text-2xl font-semibold mb-6 text-right">
                תכנים חדשים
              </h2>
              <NewContentCarousel contents={dummyNewContent} />
            </div>

            {/* Additional Component */}
            <div className="bg-white rounded-lg shadow-md p-6 flex-1">
              <h2 className="text-2xl font-semibold mb-6 text-right">
                סיכום חודשי
              </h2>
              <div className="text-right">
                <p className="text-gray-600 mb-2">משימות שהושלמו: 12</p>
                <p className="text-gray-600 mb-2">תכנים חדשים: 5</p>
                <p className="text-gray-600">דירוג ממוצע: 4.5</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
