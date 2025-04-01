/** @format */
"use client";

import { useState, useEffect } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardNav from "@/components/DashboardNav";
import { GREETINGS_CONFIG, LAYOUT_CONFIG } from "@/lib/config";
import getUserDetails from "@/app/actions/auth";
import { Spinner } from "@/components/ui/spinner";

export default function DashboardLayout({ children }) {
  const [greeting, setGreeting] = useState("");
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (
        hour >= GREETINGS_CONFIG.morning.start &&
        hour < GREETINGS_CONFIG.morning.end
      ) {
        setGreeting(GREETINGS_CONFIG.morning.text);
      } else if (
        hour >= GREETINGS_CONFIG.afternoon.start &&
        hour < GREETINGS_CONFIG.afternoon.end
      ) {
        setGreeting(GREETINGS_CONFIG.afternoon.text);
      } else if (
        hour >= GREETINGS_CONFIG.evening.start &&
        hour < GREETINGS_CONFIG.evening.end
      ) {
        setGreeting(GREETINGS_CONFIG.evening.text);
      } else {
        setGreeting(GREETINGS_CONFIG.night.text);
      }
    };

    const fetchUserName = async () => {
      try {
        const details = await getUserDetails();
        setUserName(details.name);
      } catch (error) {
        console.error("Error fetching user name:", error);
      } finally {
        setIsLoading(false);
      }
    };

    updateGreeting();
    fetchUserName();
    const interval = setInterval(updateGreeting, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <DashboardHeader />
        <div className="flex-1 flex items-center justify-center bg-sky-50">
          <div className="text-center">
            <Spinner className="w-12 h-12 text-sky-600" />
            <p className="mt-4 text-sky-900 text-lg">טוען...</p>
          </div>
        </div>
      </div>
    );
  }

  // If not a protected route, continue normally
  const mainLayoutRoutes = [
    "/dashboard",
    "/dashboard/content",
    "/dashboard/content/new",
    "/dashboard/content/explore", // נתיב חדש
    "/dashboard/profile",
    // Add more paths as needed
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header Fixed */}
      <div className="flex-none">
        <DashboardHeader />
      </div>

      {/* Main Content Area with Fixed Header and Scrollable Content */}
      <div className="flex-1 flex flex-col md:px-8 py-4 px-4 bg-sky-50 overflow-hidden">
        {/* Fixed Greeting Banner */}
        <div className="flex-none mb-4">
          <h1 className="text-3xl font-bold text-right text-gray-800">
            {greeting}, {userName}
          </h1>
        </div>

        {/* Main Content Area with Scrollable Content */}
        <div className="flex-1 flex overflow-hidden lg:min-h-0">
          {/* Fixed Navigation - Hidden on mobile */}
          <div
            className={`hidden md:block flex-none ${LAYOUT_CONFIG.sideNavWidth} border-r ml-4 overflow-y-auto`}>
            <DashboardNav />
          </div>

          {/* Scrollable Content Area */}
          <div
            className={`w-full md:${LAYOUT_CONFIG.mainContentWidth} overflow-y-auto`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
