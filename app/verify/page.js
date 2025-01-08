/** @format */
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { checkUser, validateOtp } from "../actions/auth";

export default function VerifyPage() {
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState("phone");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      const result = await validateOtp(phone, otp.join(""));

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
    <div
      className="flex min-h-screen flex-col items-center justify-center p-24"
      dir="rtl">
      {step === "phone" ? (
        <form
          onSubmit={handlePhoneSubmit}
          className="space-y-4 w-full max-w-sm">
          <div className="space-y-2">
            <label htmlFor="phone">מספר טלפון</label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="הזן מספר טלפון"
              required
            />
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "שולח..." : "שלח קוד"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit} className="space-y-4 w-full max-w-sm">
          <div className="space-y-2">
            <label>קוד אימות</label>
            <div className="flex gap-2" dir="ltr">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => {
                    const newOtp = [...otp];
                    newOtp[index] = e.target.value;
                    setOtp(newOtp);
                    if (e.target.value && index < 5) {
                      document
                        .querySelector(`input[name="otp-${index + 1}"]`)
                        ?.focus();
                    }
                  }}
                  name={`otp-${index}`}
                  className="w-12 text-center"
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
  );
}
