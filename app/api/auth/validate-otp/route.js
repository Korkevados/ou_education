/** @format */

import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabase/supabase-admin";
import axios from "axios";

const FIXED_PASSWORD = "258852";

export async function POST(req) {
  try {
    const { phone, code } = await req.json();

    // אימות ה-OTP מול 019
    const { data: otpResponse } = await axios.post(
      "https://019sms.co.il/api",
      {
        validate_otp: {
          user: {
            username: process.env.SMS_019_USERNAME,
          },
          phone: phone,
          destination_type: "1",
          code: code,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SMS_019_PASSWORD}`,
        },
      }
    );

    if (otpResponse.status !== 0) {
      return NextResponse.json({ error: "קוד לא תקין" }, { status: 400 });
    }

    // קבלת פרטי המשתמש מטבלת users
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("phone", phone)
      .single();

    if (userError) {
      throw userError;
    }

    // ננסה להתחבר עם המשתמש הקיים
    const { data: session, error: signInError } =
      await supabaseAdmin.auth.signInWithPassword({
        email: `${phone}@temp.com`,
        password: FIXED_PASSWORD,
      });

    // אם אין שגיאה בהתחברות, נחזיר את פרטי המשתמש והסשן
    if (!signInError && session) {
      const response = NextResponse.json({
        user: {
          name: user.name,
          role: user.role,
        },
        session: session,
      });

      // הוספת ניווט לדף הפרופיל
      response.headers.set("Location", "/profile");
      response.status = 307;

      return response;
    }

    // אם יש שגיאה בהתחברות, ניצור משתמש חדש
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: `${phone}@temp.com`,
        password: FIXED_PASSWORD,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          role: user.role,
        },
      });

    if (createError) {
      throw createError;
    }

    // נתחבר עם המשתמש החדש
    const { data: newSession, error: newSignInError } =
      await supabaseAdmin.auth.signInWithPassword({
        email: `${phone}@temp.com`,
        password: FIXED_PASSWORD,
      });

    if (newSignInError) {
      throw newSignInError;
    }

    // נחזיר את פרטי המשתמש החדש והסשן עם ניווט
    const response = NextResponse.json({
      user: {
        name: user.name,
        role: user.role,
      },
      session: newSession,
    });

    // הוספת ניווט לדף הפרופיל
    response.headers.set("Location", "/profile");
    response.status = 307;

    return response;
  } catch (error) {
    console.error("Error in validate-otp:", error);
    return NextResponse.json(
      {
        error: error.response?.data?.message || "שגיאה בתהליך האימות",
      },
      { status: 500 }
    );
  }
}
