/** @format */

"use server";

import supabaseAdmin from "@/lib/supabase/supabase-admin";
import createClient from "@/lib/supabase/supabase-server";
import axios from "axios";
import { redirect } from "next/navigation";
import { sendSMS } from "./sms";

const FIXED_PASSWORD = "258852";

// פונקציית עזר לבדיקת תקינות הסיסמא
function validatePassword(password) {
  // בדיקה שהסיסמא לפחות 8 תווים
  if (password.length < 8) {
    return { isValid: false, error: "הסיסמא חייבת להכיל לפחות 8 תווים" };
  }

  // בדיקה שיש לפחות אות גדולה אחת באנגלית
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: "הסיסמא חייבת להכיל לפחות אות גדולה אחת באנגלית",
    };
  }

  // בדיקה שיש לפחות אות קטנה אחת באנגלית
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      error: "הסיסמא חייבת להכיל לפחות אות קטנה אחת באנגלית",
    };
  }

  return { isValid: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function registerGuide({ fullName, phone, email, password }) {
  console.log("Starting guide registration process");

  try {
    // בדיקת תקינות הסיסמא
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return { error: passwordValidation.error };
    }

    const supabase = await createClient();
    const supabaseadmin = await supabaseAdmin();

    // בדיקה אם המשתמש כבר קיים לפי אימייל
    const { data: existingUser, error: checkError } = await supabaseadmin
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (existingUser) {
      console.log("User already exists with this email");
      return { error: "משתמש עם אימייל זה כבר קיים במערכת" };
    }

    // בדיקה אם המשתמש כבר קיים לפי טלפון
    const { data: existingPhone, error: phoneError } = await supabaseadmin
      .from("users")
      .select("*")
      .eq("phone", phone)
      .single();

    if (existingPhone) {
      console.log("User already exists with this phone");
      return { error: "משתמש עם מספר טלפון זה כבר קיים במערכת" };
    }

    // יצירת משתמש חדש בסופאבייס אוט
    const { data: authUser, error: createError } =
      await supabaseadmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
      });

    if (createError) {
      console.error("Error creating auth user:", createError);
      return { error: createError.message };
    }

    console.log("Auth user created successfully");

    // יצירת רשומת משתמש בטבלת users
    const { data: newUser, error: userError } = await supabaseadmin
      .from("users")
      .insert([
        {
          full_name: fullName,
          phone: phone,
          email: email,
          user_type: "GUIDE",
          supabase_id: authUser.user.id,
          is_active: false, // משתמש חדש מתחיל כלא פעיל
          position: "GUIDE", // הוספת ערך ברירת מחדל לposition
        },
      ])
      .select()
      .single();

    if (userError) {
      console.error("Error creating user record:", userError);
      // מחיקת המשתמש מהאוט במקרה של שגיאה
      await supabaseadmin.auth.admin.deleteUser(authUser.user.id);
      return { error: "שגיאה ביצירת המשתמש" };
    }
    await sendSMS([phone], "משתמש נוצר בהצלחה ממתין לאישור מערכת");
    console.log("Guide registered successfully, waiting for admin approval");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error in registerGuide:", error);
    return { error: "שגיאה בלתי צפויה בתהליך ההרשמה" };
  }
}

export async function loginWithEmail(email, password) {
  console.log("loginWithEmail - התחלת תהליך התחברות", { email });

  const supabase = await createClient();
  try {
    // בדיקת אימות פרטי התחברות
    const { data: session, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

    if (signInError) {
      console.log("שגיאת התחברות:", signInError);

      // מחזירים הודעות שגיאה ידידותיות למשתמש
      if (signInError.message.includes("Invalid login credentials")) {
        return { error: "אימייל או סיסמא שגויים" };
      }

      return { error: signInError.message };
    }

    if (!session) {
      console.log("לא התקבל סשן תקין");
      return { error: "שגיאה בתהליך ההתחברות" };
    }

    console.log("התחברות בוצעה בהצלחה, בודק סטטוס משתמש");

    // בדיקה האם המשתמש קיים ופעיל בטבלת users
    const supabaseadmin = await supabaseAdmin();
    let { data: userData, error: userError } = await supabaseadmin
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    // אם יש שגיאה שלא קשורה לכך שלא נמצאו שורות
    if (userError && userError.code !== "PGRST116") {
      console.log("שגיאה בשליפת נתוני משתמש:", userError);
      throw userError;
    }

    // אם המשתמש לא קיים בטבלת users, נחפש אותו לפי supabase_id
    if (!userData) {
      const { data: userById, error: userByIdError } = await supabaseadmin
        .from("users")
        .select("*")
        .eq("supabase_id", session.user.id)
        .single();

      if (userByIdError && userByIdError.code !== "PGRST116") {
        console.log("שגיאה בשליפת משתמש לפי ID:", userByIdError);
        throw userByIdError;
      }

      if (!userById) {
        return { error: "משתמש לא קיים במערכת" };
      }

      userData = userById;
    }

    // בדיקה האם המשתמש פעיל
    if (!userData.is_active) {
      console.log("משתמש לא פעיל:", userData.email);
      return { error: "החשבון שלך עדיין לא אושר על ידי מנהל המערכת" };
    }
  } catch (error) {
    console.error("Error in loginWithEmail:", error);
    return {
      error: error.message || "שגיאה בתהליך ההתחברות",
    };
  }

  console.log("התחברות הושלמה בהצלחה, מעביר לדף הבקרה");
  redirect("/dashboard");
}

export async function checkUser(phone) {
  console.log("checkUser", phone);
  const supabase = await supabaseAdmin();
  try {
    // בדיקה האם המשתמש קיים בטבלת users לפי הסכמה החדשה
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
  console.log("validateOtp - התחלת תהליך אימות", { phone, code });
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
      console.log("קוד OTP לא תקין", otpResponse);
      return { error: "קוד לא תקין" };
    }

    console.log("קוד OTP אומת בהצלחה");

    const supabaseadmin = await supabaseAdmin();
    // קבלת פרטי המשתמש מהטבלה החדשה
    const { data: user, error: userError } = await supabaseadmin
      .from("users")
      .select("*")
      .eq("phone", phone)
      .single();

    if (userError) {
      console.log("שגיאה בחילוץ משתמש", userError);
      if (userError.code === "PGRST116") {
        // אם אין משתמש כזה בכלל (קוד PGRST116 = no rows returned)
        console.log("משתמש לא קיים במערכת");
        return { error: "משתמש לא קיים במערכת" };
      }
      throw userError;
    }

    if (!user) {
      console.log("משתמש לא קיים במערכת");
      return { error: "משתמש לא קיים במערכת" };
    }

    console.log("משתמש נמצא בהצלחה", user);

    // בדיקה אם המשתמש כבר קיים במערכת Auth של Supabase
    let authUser;
    if (user.supabase_id && user.supabase_id.trim() !== "") {
      // אם יש supabase_id, נבדוק אם המשתמש קיים בauth
      console.log("בודק אם קיים משתמש auth לפי supabase_id", user.supabase_id);
      const { data: existingAuthUser, error: getAuthUserError } =
        await supabaseadmin.auth.admin.getUserById(user.supabase_id);

      if (!getAuthUserError && existingAuthUser) {
        console.log("משתמש קיים ב-Auth", existingAuthUser.user);
        authUser = existingAuthUser.user;
      } else {
        console.log("לא נמצא משתמש auth עם ה-ID המבוקש, יוצר חדש...");
      }
    }

    console.log("התחברות הצליחה, מעביר לדף הבקרה");
  } catch (error) {
    console.error("Error in validateOtp:", error);
    return {
      error: error.response?.data?.message || "שגיאה בתהליך האימות",
    };
  }

  console.log("אימות הושלם בהצלחה, מעביר לדף הבקרה");
  redirect("/dashboard");
}

export default async function getUserDetails() {
  try {
    const supabase = await createClient();

    // בדיקת קיום סשן
    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser();

    if (sessionError) {
      console.error("Session error:", sessionError);
      throw new Error("No session found");
    }

    if (!user) {
      console.error("No user found in session");
      throw new Error("No session found");
    }
    // קודם ננסה למצוא את המשתמש לפי supabase_id שזה הכי מדויק
    let { data: userData, error } = await supabase
      .from("users")
      .select("*")
      .eq("supabase_id", user.id)
      .single();

    // אם לא מצאנו לפי supabase_id, ננסה לפי אימייל

    // אם עדיין לא מצאנו ויש מספר טלפון, ננסה לפי טלפון

    if (error) {
      console.error("Error finding user data:", error);
      throw error;
    }

    if (!userData) {
      console.error("User data not found for ID:", user.id);
      throw new Error("User data not found");
    }

    // אם מצאנו משתמש אבל אין לו supabase_id, נעדכן את המשתמש עם ה-supabase_id

    // בדיקה נוספת שכל השדות הנדרשים קיימים
    const name = userData.name || userData.full_name;
    const role = userData.role || userData.user_type;

    if (!name || !role) {
      console.warn("Missing user data fields:", { name, role });
    }

    return {
      name: name || "משתמש",
      phone: userData.phone || "",
      email: userData.email || "",
      role: role || "guest",
      activityCenter: userData.center_id || null,
    };
  } catch (error) {
    console.error("Error in getUserDetails:", error);
    throw error;
  }
}

export async function resetPasswordForEmail(email) {
  console.log("resetPasswordForEmail", email);
  try {
    // Check if user exists in our users table first
    const supabase = await supabaseAdmin();
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("email, is_active")
      .eq("email", email)
      .single();

    if (userError && userError.code !== "PGRST116") {
      console.error("Error checking user:", userError);
      return { error: "שגיאה בבדיקת המשתמש" };
    }

    if (!user) {
      return { error: "לא נמצא משתמש עם כתובת אימייל זו" };
    }

    if (!user.is_active) {
      return { error: "החשבון שלך עדיין לא אושר על ידי מנהל המערכת" };
    }

    // Send password reset email
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    });

    if (error) {
      console.error("Error sending reset email:", error);
      return { error: "שגיאה בשליחת מייל איפוס סיסמא" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in resetPasswordForEmail:", error);
    return { error: "שגיאה בתהליך איפוס הסיסמא" };
  }
}

export async function tempLogin(phone) {
  const supabase = await createClient();
  try {
    // Check if user exists
    const supabaseadmin = await supabaseAdmin();
    const { data: user, error: userError } = await supabaseadmin
      .from("users")
      .select("*")
      .eq("phone", phone)
      .single();

    if (userError) {
      if (userError.code === "PGRST116") {
        // אם אין משתמש כזה בכלל (קוד PGRST116 = no rows returned)
        console.log("משתמש לא קיים במערכת");
        return { error: "משתמש לא קיים במערכת" };
      }
      throw userError;
    }

    if (!user) {
      return { error: "משתמש לא קיים במערכת" };
    }

    // User exists, check if they have a supabase_id
    let authUser;
    if (user.supabase_id && user.supabase_id.trim() !== "") {
      // אם יש supabase_id, נבדוק אם המשתמש קיים בauth
      const { data: existingAuthUser, error: getAuthUserError } =
        await supabaseadmin.auth.admin.getUserById(user.supabase_id);

      if (!getAuthUserError && existingAuthUser) {
        authUser = existingAuthUser.user;
      }
    }

    // אם המשתמש לא קיים ב-Auth, ניצור אותו
    if (!authUser) {
      const emailToUse = user.email || `${phone}@temp.com`;

      const { data: newAuthUser, error: createError } =
        await supabaseadmin.auth.admin.createUser({
          email: emailToUse,
          password: FIXED_PASSWORD,
          email_confirm: true,
          user_metadata: {
            name: user.full_name,
            user_type: user.user_type,
          },
        });

      if (createError) {
        throw createError;
      }

      // עדכון שדה supabase_id בטבלת users
      const { error: updateError } = await supabaseadmin
        .from("users")
        .update({
          supabase_id: newAuthUser.user.id,
        })
        .eq("phone", phone);

      if (updateError) {
        throw updateError;
      }

      authUser = newAuthUser.user;
    }

    // התחברות עם המשתמש
    const { data: session, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: authUser.email || user.email || `${phone}@temp.com`,
        password: FIXED_PASSWORD,
      });

    if (signInError) {
      throw signInError;
    }

    return { success: true };
  } catch (error) {
    console.error("Error in tempLogin:", error);
    return {
      error: error.message || "Error during login",
    };
  }
}

export async function updateUserPassword(password) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      console.error("Error updating password:", error);
      return { error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in updateUserPassword:", error);
    return { error: "שגיאה בעדכון הסיסמא" };
  }
}
