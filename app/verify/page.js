/** @format */
"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { loginWithEmail } from "../actions/auth";
import Header from "@/components/Header";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function VerifyPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [debug, setDebug] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showManualRedirect, setShowManualRedirect] = useState(false);
  const router = useRouter();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setDebug("");

    if (!email || !password) {
      setError("יש להזין אימייל וסיסמא");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("יש להזין כתובת אימייל תקינה");
      return;
    }

    setIsLoading(true);
    setDebug("שולח בקשת התחברות...");

    try {
      const result = await loginWithEmail(email, password);

      if (result && result.error) {
        setError(result.error);
        setDebug(`שגיאה: ${result.error}`);
        setIsLoading(false);
        return;
      }

      if (result && result.success) {
        setDebug("התחברות בוצעה בהצלחה! מעביר לדף הבקרה...");

        // הפניה אוטומטית לדף הבקרה
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);

        // הצגת כפתור הפניה ידני אם ההפניה האוטומטית לא עובדת
        setTimeout(() => {
          setShowManualRedirect(true);
        }, 3000);
      } else {
        setError("שגיאה לא ידועה בתהליך ההתחברות");
        setIsLoading(false);
      }
    } catch (error) {
      setError("שגיאה בתהליך ההתחברות");
      setDebug(`Exception: ${error.message}`);
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      {/* <Header /> */}
      <Header />
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FAFB] p-4">
        <div className="max-w-md w-full mx-auto bg-white p-8 rounded-xl shadow-md">
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
            התחברות למערכת
          </h1>

          {error && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
              role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-lg font-medium text-gray-700 mb-1">
                אימייל
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="הכנס אימייל"
                dir="ltr"
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-lg font-medium text-gray-700 mb-1">
                סיסמא
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="הכנס סיסמא"
                  dir="ltr"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 left-0 px-3 flex items-center">
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isLoading ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}>
              {isLoading ? "מתחבר..." : "התחברות"}
            </button>
          </form>

          <div className="text-center mt-4">
            <Link
              href="/forgot-password"
              className="text-blue-600 hover:text-blue-800 text-sm">
              שכחת סיסמא?
            </Link>
          </div>

          {showManualRedirect && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 mb-2">
                ההפניה האוטומטית לא פעלה?
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="text-blue-600 hover:text-blue-800 font-medium">
                המשך לדף הבקרה
              </button>
            </div>
          )}

          {/* {debug && (
            <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-500 dir-ltr">
              <p>{debug}</p>
            </div>
          )} */}
        </div>
      </div>
    </>
  );
}
