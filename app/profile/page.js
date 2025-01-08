/** @format */

"use client";

import { useEffect, useState } from "react";
import { getUserDetails } from "@/app/actions/auth";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const userDetails = await getUserDetails();
        setUser(userDetails);
      } catch (error) {
        console.error("Error fetching user details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        טוען...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div
      className="flex flex-1 h-full flex-col items-center justify-center md:mt-24 mt-12 p-8"
      dir="rtl">
      <div className="space-y-6 bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center">פרופיל משתמש</h1>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-gray-600">שם מלא</p>
            <p className="font-medium">{user.name}</p>
          </div>
          <div className="space-y-2">
            <p className="text-gray-600">מספר טלפון</p>
            <p className="font-medium">{user.phone}</p>
          </div>
          <div className="space-y-2">
            <p className="text-gray-600">תפקיד</p>
            <p className="font-medium">
              {user.role === "GUIDE" && "מדריך"}
              {user.role === "TRAINING_MANAGER" && "מנהל הדרכה"}
              {user.role === "ADMIN" && "מנהל כללי"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
