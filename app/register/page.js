/** @format */

"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { registerGuide } from "../actions/auth";
import Header from "@/components/Header";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Clean phone number by removing dashes
    const cleanedPhone = formData.phone.replace(/-/g, "");

    // בדיקות תקינות בסיסיות
    if (formData.password !== formData.confirmPassword) {
      setError("הסיסמאות אינן תואמות");
      setIsLoading(false);
      return;
    }

    // בדיקת שם בעברית
    const hebrewRegex = /^[\u0590-\u05FF\s]+$/;
    if (!hebrewRegex.test(formData.fullName)) {
      setError("שם מלא חייב להיות בעברית בלבד");
      setIsLoading(false);
      return;
    }

    // בדיקת פורמט טלפון ישראלי - עכשיו בודק על המספר הנקי
    const phoneRegex = /^\+?(972|0)([1-9]\d{1})(\d{3})(\d{4})$/;
    if (!phoneRegex.test(cleanedPhone)) {
      setError("מספר טלפון לא תקין");
      setIsLoading(false);
      return;
    }

    // בדיקת אימייל
    const emailRegex = /^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
    if (!emailRegex.test(formData.email)) {
      setError("כתובת אימייל לא תקינה");
      setIsLoading(false);
      return;
    }

    try {
      const result = await registerGuide({
        ...formData,
        phone: cleanedPhone, // שליחת המספר הנקי לשרת
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        // נמתין 3 שניות ואז נעבור לדף ההתחברות
        setTimeout(() => {
          router.push("/verify");
        }, 3000);
      }
    } catch (error) {
      setError(error.message || "אירעה שגיאה בתהליך ההרשמה");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FAFB] p-4">
        <Header />
        <div className="max-w-md w-full mx-auto bg-white p-8 rounded-xl shadow-md text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ההרשמה הושלמה בהצלחה!
          </h2>
          <p className="text-gray-600 mb-8">
            בקשתך נשלחה למנהל המערכת לאישור.
            <br />
            לאחר אישור החשבון תוכל להתחבר למערכת.
          </p>
          <p className="text-sm text-gray-500">מעביר אותך לדף ההתחברות...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[#F9FAFB] py-8">
        <div className="flex items-center justify-center min-h-full px-4">
          <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-center mb-6">
              <Image
                src="/images/ouisrael_logo.png"
                alt="לוגו"
                width={120}
                height={120}
                priority
              />
            </div>

            <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
              הרשמה למערכת
            </h1>

            {error && (
              <div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
                role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700 mb-1">
                  שם מלא (בעברית)
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="הכנס שם מלא"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1">
                  מספר טלפון
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="הכנס מספר טלפון"
                  dir="ltr"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1">
                  אימייל
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="הכנס כתובת אימייל"
                  dir="ltr"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1">
                  סיסמא
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="הכנס סיסמא"
                  dir="ltr"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1">
                  אימות סיסמא
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="הכנס סיסמא שוב"
                  dir="ltr"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isLoading ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}>
                {isLoading ? "מבצע הרשמה..." : "הרשמה"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
