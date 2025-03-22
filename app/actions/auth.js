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
  const supabase = await supabaseAdmin();
  try {
    // בדיקה האם המשתמש קיים
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("phone", phone)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!user) {
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
    const supabaseadmin = await supabaseAdmin();
    // קבלת פרטי המשתמש
    const { data: user, error: userError } = await supabaseadmin
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
  redirect("/dashboard");
}

export async function getUserDetails() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("No session found");

    const phone = user.email.replace("@temp.com", "");

    // משתמש בקליינט רגיל במקום באדמין - הפוליסה תטפל בהרשאות
    const { data: userData, error } = await supabase
      .from("users")
      .select("*")
      .eq("phone", phone)
      .single();

    if (error) throw error;

    return {
      name: userData.name,
      phone: phone,
      role: userData.role,
    };
  } catch (error) {
    console.error("Error fetching user details:", error);
    throw error;
  }
}

export async function tempLogin(phone) {
  const supabase = await createClient();
  try {
    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("phone", phone)
      .single();

    if (userError && userError.code !== "PGRST116") {
      throw userError;
    }

    // If user doesn't exist, create one
    if (!user) {
      await supabaseAdmin.from("users").insert([
        {
          phone: phone,
          name: "Temporary User",
          role: "user",
        },
      ]);
    }

    // Try to sign in
    const { data: session, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: `${phone}@temp.com`,
        password: FIXED_PASSWORD,
      });

    // If sign in fails, create new auth user and try again
    if (signInError) {
      await supabaseAdmin.auth.admin.createUser({
        email: `${phone}@temp.com`,
        password: FIXED_PASSWORD,
        email_confirm: true,
        user_metadata: {
          name: "Temporary User",
          role: "user",
        },
      });

      const { data: newSession, error: newSignInError } =
        await supabase.auth.signInWithPassword({
          email: `${phone}@temp.com`,
          password: FIXED_PASSWORD,
        });

      if (newSignInError) {
        throw newSignInError;
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error in tempLogin:", error);
    return {
      error: error.message || "Error during login",
    };
  }
}
