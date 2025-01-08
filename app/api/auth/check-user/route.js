/** @format */

import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabase/supabase-admin";
import axios from "axios";

export async function POST(req) {
  try {
    const { phone } = await req.json();

    // בדיקה האם המשתמש קיים עם הרשאות מנהל
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("phone", phone)
      .single();

    if (error && error.code !== "PGRST116") {
      console.log("ERROR HERE", error);
      throw error;
    }

    if (!user) {
      return NextResponse.json(
        { error: "משתמש לא קיים במערכת" },
        { status: 404 }
      );
    }

    // שליחת OTP באמצעות 019
    const { data: otpResponse } = await axios.post(
      "https://019sms.co.il/api",
      {
        send_otp: {
          user: {
            username: process.env.SMS_019_USERNAME,
          },
          phone: phone,
          source: process.env.SMS_019_SOURCE,
          text: "קוד האימות שלך הוא: [code]",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SMS_019_PASSWORD}`,
        },
      }
    );

    if (otpResponse.status !== 0) {
      throw new Error(otpResponse.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in check-user:", error);
    return NextResponse.json(
      {
        error: error.response?.data?.message || "שגיאה בתהליך האימות",
      },
      { status: 500 }
    );
  }
}
