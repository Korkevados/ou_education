/** @format */

"use server";

import supabaseAdmin from "@/lib/supabase/supabase-admin";
import createClient from "@/lib/supabase/supabase-server";
import axios from "axios";
import { redirect } from "next/navigation";

const FIXED_PASSWORD = "258852";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function checkUser(phone) {
  try {
    // בדיקה האם המשתמש קיים
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("phone", phone)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!user) {
      console.log("im here");
      return { error: "משתמש לא קיים במערכת" };
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

    return { success: true };
  } catch (error) {
    console.error("Error in checkUser:", error);
    return {
      error: error.response?.data?.message || "שגיאה בתהליך האימות",
    };
  }
}

export async function validateOtp(phone, code) {
  const supabase = await createClient();
  try {
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
      return { error: "קוד לא תקין" };
    }

    // קבלת פרטי המשתמש
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
      await supabase.auth.signInWithPassword({
        email: `${phone}@temp.com`,
        password: FIXED_PASSWORD,
      });

    if (!signInError && session) {
      console.log("skippd");
      // שמירת הסשן בסופאבייס
      //   await supabase.auth.setSession({
      //     access_token: session.access_token,
      //     refresh_token: session.refresh_token,
      //   });
    } else {
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

      const { data: newSession, error: newSignInError } =
        await supabaseAdmin.auth.signInWithPassword({
          email: `${phone}@temp.com`,
          password: FIXED_PASSWORD,
        });

      if (newSignInError) {
        throw newSignInError;
      }
      await supabaseAdmin.auth.setSession({
        access_token: newSession.access_token,
        refresh_token: newSession.refresh_token,
      });
    }
  } catch (error) {
    console.error("Error in validateOtp:", error);
    return {
      error: error.response?.data?.message || "שגיאה בתהליך האימות",
    };
  }
  console.log("beforeredirect");
  redirect("/profile");
}

export async function getUserDetails() {
  try {
    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) throw new Error("No session found");

    const phone = session.user.email.replace("@temp.com", "");

    // משתמש בקליינט רגיל במקום באדמין - הפוליסה תטפל בהרשאות
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("phone", phone)
      .single();

    if (error) throw error;

    return {
      name: user.name,
      phone: phone,
      role: user.role,
    };
  } catch (error) {
    console.error("Error fetching user details:", error);
    throw error;
  }
}
