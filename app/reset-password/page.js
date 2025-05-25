/** @format */

"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { updateUserPassword } from "@/app/actions/auth";
import Link from "next/link";
import Header from "@/components/Header";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get("token_hash");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const validatePassword = (password) => {
    if (password.length < 8) {
      return "הסיסמא חייבת להכיל לפחות 8 תווים";
    }
    if (!/[A-Z]/.test(password)) {
      return "הסיסמא חייבת להכיל לפחות אות גדולה אחת באנגלית";
    }
    if (!/[a-z]/.test(password)) {
      return "הסיסמא חייבת להכיל לפחות אות קטנה אחת באנגלית";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setPasswordError("");
    setConfirmPasswordError("");

    let hasError = false;

    if (!password) {
      setPasswordError("אנא הזן סיסמא חדשה");
      hasError = true;
    } else {
      const passwordValidationError = validatePassword(password);
      if (passwordValidationError) {
        setPasswordError(passwordValidationError);
        hasError = true;
      }
    }

    if (!confirmPassword) {
      setConfirmPasswordError("אנא הזן סיסמא בשנית");
      hasError = true;
    }

    if (password && confirmPassword && password !== confirmPassword) {
      setConfirmPasswordError("הסיסמאות לא תואמות");
      hasError = true;
    }

    if (hasError) {
      return;
    }

    if (!tokenHash) {
      setError("לא נמצא טוקן תקין. אנא נסה שוב מהקישור באימייל");
      return;
    }

    setLoading(true);

    try {
      const result = await updateUserPassword(password);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/verify");
        }, 3000);
      }
    } catch (error) {
      setError("שגיאה בעדכון הסיסמא");
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Header />
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-green-600">
              הסיסמא עודכנה בהצלחה!
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              תועבר לדף ההתחברות בעוד מספר שניות...
            </p>
          </div>
          <div className="mt-8">
            <Link
              href="/verify"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              המשך להתחברות
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenHash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Header />
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              קישור לא תקין
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              הקישור לאיפוס הסיסמא לא תקין או פג תוקף
            </p>
          </div>
          <div className="mt-8 space-y-4">
            <Link
              href="/forgot-password"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              בקש קישור חדש
            </Link>
            <Link
              href="/verify"
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              חזור להתחברות
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Header />
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            בחר סיסמא מחדש
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            הכנס סיסמא חדשה לחשבון שלך
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <input type="hidden" id="otp" name="otp" value={tokenHash || ""} />

          <div className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-lg font-medium leading-6 text-gray-700 mb-1">
                סיסמא
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="סיסמא חדשה"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              {passwordError && (
                <div className="text-red-500 text-sm mt-1">{passwordError}</div>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-lg font-medium leading-6 text-gray-700 mb-1">
                הזן סיסמא בשנית
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="אישור סיסמא"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
              {confirmPasswordError && (
                <div className="text-red-500 text-sm mt-1">
                  {confirmPasswordError}
                </div>
              )}
            </div>
          </div>

          <div className="text-xs text-gray-500">
            <p>הסיסמא חייבת להכיל:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>לפחות 8 תווים</li>
              <li>אות גדולה אחת באנגלית</li>
              <li>אות קטנה אחת באנגלית</li>
            </ul>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "מעדכן..." : "עדכן סיסמא"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-lg">טוען...</p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
