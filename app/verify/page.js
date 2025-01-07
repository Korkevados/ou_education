/** @format */
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";

export default function VerifyPage() {
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
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

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError("נא להזין מספר טלפון תקין");
      return;
    }

    console.log("Sending OTP to", phone);
    setError("");
    setStep("otp");
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError("נא להזין קוד אימות תקין");
      return;
    }

    if (otp === "123456") {
      setError("");
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 2000);
    } else {
      setError("קוד האימות שגוי");
    }
  };

  return (
    <div className="min-h-screen bg-sky-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-6 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-sky-900">אימות משתמש</h2>
          <p className="mt-2 text-gray-600">
            {step === "phone"
              ? "נא להזין מספר טלפון לאימות"
              : "נא להזין את קוד האימות שנשלח לטלפון"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-md text-center font-medium">
            קוד תקין
          </div>
        )}

        {step === "phone" ? (
          <form onSubmit={handleSendOTP} className="mt-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                מספר טלפון
              </label>
              <Input
                type="tel"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05X-XXXXXXX"
                className="text-center"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-sky-600 hover:bg-sky-700">
              שלח קוד אימות
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="mt-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                קוד אימות
              </label>
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
            </div>
            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full bg-sky-600 hover:bg-sky-700">
                אמת קוד
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep("phone");
                  setError("");
                  setOtp("");
                }}
                className="w-full">
                חזור למספר טלפון
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
