/** @format */

"use client";

import { useState } from "react";
import { createTestUser, removeTestUser } from "@/app/actions/setup";

export default function AdminSetupPage() {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateTestUser = async () => {
    setIsLoading(true);
    try {
      const response = await createTestUser();
      setResult(response);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTestUser = async () => {
    setIsLoading(true);
    try {
      const response = await removeTestUser();
      setResult(response);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8" dir="rtl">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">
          כלי הגדרות אדמין
        </h1>

        <div className="space-y-8">
          <section className="p-4 border rounded-md">
            <h2 className="text-xl font-semibold mb-4">ניהול משתמשי בדיקה</h2>
            <div className="flex space-x-4 space-x-reverse">
              <button
                onClick={handleCreateTestUser}
                disabled={isLoading}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50">
                צור משתמש בדיקה
              </button>
              <button
                onClick={handleRemoveTestUser}
                disabled={isLoading}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50">
                הסר משתמש בדיקה
              </button>
            </div>

            {isLoading && <div className="mt-4 text-blue-600">טוען...</div>}

            {result && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <h3 className="font-semibold mb-2">תוצאה:</h3>
                {result.error ? (
                  <div className="text-red-600">{result.error}</div>
                ) : (
                  <div>
                    <div className="text-green-600">{result.message}</div>
                    {result.credentials && (
                      <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                        <h4 className="font-semibold mb-2">פרטי התחברות:</h4>
                        <div>
                          <span className="font-semibold">אימייל:</span>{" "}
                          {result.credentials.email}
                        </div>
                        <div>
                          <span className="font-semibold">סיסמא:</span>{" "}
                          {result.credentials.password}
                        </div>
                      </div>
                    )}
                    {result.user && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">פרטי משתמש:</h4>
                        <pre className="p-2 bg-gray-50 rounded overflow-x-auto text-xs">
                          {JSON.stringify(result.user, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
