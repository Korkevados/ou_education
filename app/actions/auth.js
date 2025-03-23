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

export async function loginWithEmail(email, password) {
  console.log("loginWithEmail - התחלת תהליך התחברות", { email });

  const supabase = await createClient();
  try {
    const { data: session, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

    if (signInError) {
      console.log("שגיאת התחברות:", signInError);

      if (signInError.message.includes("Invalid login credentials")) {
        return { error: "אימייל או סיסמא שגויים" };
      }

      return { error: signInError.message };
    }

    if (!session) {
      console.log("לא התקבל סשן תקין");
      return { error: "שגיאה בתהליך ההתחברות" };
    }

    console.log("התחברות בוצעה בהצלחה");

    const supabaseadmin = await supabaseAdmin();
    const { data: userData, error: userError } = await supabaseadmin
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (userError && userError.code !== "PGRST116") {
      console.log("שגיאה בשליפת נתוני משתמש:", userError);
      throw userError;
    }

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

export async function getUserDetails() {
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

// export async function tempLogin(phone) {
//   const supabase = await createClient();
//   try {
//     // Check if user exists
//     const supabaseadmin = await supabaseAdmin();
//     const { data: user, error: userError } = await supabaseadmin
//       .from("users")
//       .select("*")
//       .eq("phone", phone)
//       .single();

//     if (userError) {
//       if (userError.code === "PGRST116") {
//         // אם אין משתמש כזה בכלל (קוד PGRST116 = no rows returned)
//         console.log("משתמש לא קיים במערכת");
//         return { error: "משתמש לא קיים במערכת" };
//       }
//       throw userError;
//     }

//     if (!user) {
//       return { error: "משתמש לא קיים במערכת" };
//     }

//     // User exists, check if they have a supabase_id
//     let authUser;
//     if (user.supabase_id && user.supabase_id.trim() !== "") {
//       // אם יש supabase_id, נבדוק אם המשתמש קיים בauth
//       const { data: existingAuthUser, error: getAuthUserError } =
//         await supabaseadmin.auth.admin.getUserById(user.supabase_id);

//       if (!getAuthUserError && existingAuthUser) {
//         authUser = existingAuthUser.user;
//       }
//     }

//     // אם המשתמש לא קיים ב-Auth, ניצור אותו
//     if (!authUser) {
//       const emailToUse = user.email || `${phone}@temp.com`;

//       const { data: newAuthUser, error: createError } =
//         await supabaseadmin.auth.admin.createUser({
//           email: emailToUse,
//           password: FIXED_PASSWORD,
//           email_confirm: true,
//           user_metadata: {
//             name: user.full_name,
//             user_type: user.user_type,
//           },
//         });

//       if (createError) {
//         throw createError;
//       }

//       // עדכון שדה supabase_id בטבלת users
//       const { error: updateError } = await supabaseadmin
//         .from("users")
//         .update({
//           supabase_id: newAuthUser.id,
//         })
//         .eq("phone", phone);

//       if (updateError) {
//         throw updateError;
//       }

//       authUser = newAuthUser.user;
//     }

//     // התחברות עם המשתמש
//     const { data: session, error: signInError } =
//       await supabase.auth.signInWithPassword({
//         email: authUser.email || user.email || `${phone}@temp.com`,
//         password: FIXED_PASSWORD,
//       });

//     if (signInError) {
//       throw signInError;
//     }

//     return { success: true };
//   } catch (error) {
//     console.error("Error in tempLogin:", error);
//     return {
//       error: error.message || "Error during login",
//     };
//   }
// }
