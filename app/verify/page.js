/** @format */
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { checkUser, validateOtp } from "../actions/auth";
import {
  InputOTP,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import Header from "@/components/Header";

export default function VerifyPage() {
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState("phone");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const firstInputRef = useRef(null);

  // Auto focus on first OTP input when step changes to 'otp'
  useEffect(() => {
    if (step === "otp") {
      // Small timeout to ensure the input is rendered
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 50);
    }
  }, [step]);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await checkUser(phone);
      if (result.error) {
        setError(result.error);
        return;
      }
      setStep("otp");
    } catch (error) {
      setError("שגיאה בתהליך האימות");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await validateOtp(phone, otp);

      if (result?.error) {
        setError(result.error);
      }
      // אין צורך לטפל בהצלחה כי הניווט מתבצע בצד השרת
    } catch (error) {
      setError("שגיאה בתהליך האימות");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div
        className="flex flex-1 h-full flex-col items-center justify-center bg-sky-50 px-4"
        dir="rtl">
        <div className="flex text-center flex-col items-center justify-center max-w-md w-full space-y-8 bg-white p-6 rounded-xl shadow-lg">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-sky-900">אימות משתמש</h2>
            <p className="mt-2 text-gray-600">
              {step === "phone"
                ? "נא להזין מספר טלפון לאימות"
                : "נא להזין את קוד האימות שנשלח לטלפון"}
            </p>
          </div>
          {step === "phone" ? (
            <form
              onSubmit={handlePhoneSubmit}
              className="space-y-4 w-full max-w-sm">
              <div className="space-y-2 text-center">
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 10) {
                      setPhone(value);
                    }
                  }}
                  pattern="[0-9]{10}"
                  maxLength={10}
                  minLength={10}
                  placeholder="הזן מספר טלפון (10 ספרות)"
                  required
                  className="text-center mb-4 ltr"
                  dir="ltr"
                />
              </div>
              {error && <p className="text-red-500">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "שולח..." : "שלח קוד"}
              </Button>
            </form>
          ) : (
            <form
              onSubmit={handleOtpSubmit}
              className="space-y-4 w-full max-w-sm">
              <div className="flex justify-center" dir="ltr">
                <div className="flex gap-2">
                  {[...Array(6)].map((_, index) => (
                    <InputOTPSlot
                      key={index}
                      ref={index === 0 ? firstInputRef : null}
                      char={otp[index] || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (!/^\d*$/.test(value)) return; // Only allow digits

                        const newOtp = otp.split("");
                        newOtp[index] = value;
                        setOtp(newOtp.join(""));
                        setError("");

                        // Move to next input if value is entered
                        if (value && index < 5) {
                          const nextInput =
                            e.target.parentElement.nextElementSibling?.querySelector(
                              "input"
                            );
                          if (nextInput) nextInput.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        // Handle backspace
                        if (e.key === "Backspace" && !otp[index] && index > 0) {
                          const prevInput =
                            e.target.parentElement.previousElementSibling?.querySelector(
                              "input"
                            );
                          if (prevInput) {
                            prevInput.focus();
                          }
                        }
                        // Handle left arrow
                        if (e.key === "ArrowLeft" && index > 0) {
                          const prevInput =
                            e.target.parentElement.previousElementSibling?.querySelector(
                              "input"
                            );
                          if (prevInput) prevInput.focus();
                        }
                        // Handle right arrow
                        if (e.key === "ArrowRight" && index < 5) {
                          const nextInput =
                            e.target.parentElement.nextElementSibling?.querySelector(
                              "input"
                            );
                          if (nextInput) nextInput.focus();
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedData = e.clipboardData
                          .getData("text")
                          .replace(/\D/g, "")
                          .slice(0, 6);
                        if (pastedData) {
                          setOtp(pastedData);
                          // Focus last input if full code pasted, or next empty input
                          const targetIndex = Math.min(pastedData.length, 5);
                          const inputs =
                            e.target.parentElement.parentElement.querySelectorAll(
                              "input"
                            );
                          inputs[targetIndex]?.focus();
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
              {error && <p className="text-red-500">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "מאמת..." : "אמת קוד"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
