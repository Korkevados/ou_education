/** @format */
"use server";

import supabaseAdmin from "@/lib/supabase/supabase-admin";

// פונקציית אתחול משתמש לצרכי בדיקות המערכת
export async function createTestUser() {
  console.log("Starting createTestUser");
  try {
    const supabase = await supabaseAdmin();

    // בדיקה אם המשתמש כבר קיים
    const { data: existingUser, error: searchError } = await supabase
      .from("users")
      .select("*")
      .eq("email", "test@example.com")
      .single();

    if (searchError && searchError.code !== "PGRST116") {
      console.error("Error checking for existing user:", searchError);
      return { error: searchError.message };
    }

    if (existingUser) {
      console.log("Test user already exists");
      return { message: "משתמש קיים במערכת", user: existingUser };
    }

    // יצירת משתמש חדש בסופאבייס אוט
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email: "test@example.com",
        password: "password123",
        email_confirm: true,
      });

    if (authError) {
      console.error("Error creating auth user:", authError);
      return { error: authError.message };
    }

    console.log("Auth user created:", authUser);

    // יצירת משתמש בטבלת users
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert([
        {
          name: "משתמש בדיקות",
          email: "test@example.com",
          phone: "0501234567",
          role: "מדריך",
          supabase_id: authUser.user.id,
        },
      ])
      .select()
      .single();

    if (userError) {
      console.error("Error creating user record:", userError);
      return { error: userError.message };
    }

    console.log("User created successfully:", newUser);
    return {
      message: "משתמש נוצר בהצלחה",
      user: newUser,
      credentials: {
        email: "test@example.com",
        password: "password123",
      },
    };
  } catch (error) {
    console.error("Unexpected error in createTestUser:", error);
    return { error: error.message };
  }
}

// פונקציה להסרת משתמש לאחר בדיקות
export async function removeTestUser() {
  console.log("Starting removeTestUser");
  try {
    const supabase = await supabaseAdmin();

    // מציאת המשתמש לפי אימייל
    const { data: user, error: searchError } = await supabase
      .from("users")
      .select("*")
      .eq("email", "test@example.com")
      .single();

    if (searchError) {
      console.error("Error finding test user:", searchError);
      return { error: searchError.message };
    }

    if (!user) {
      return { message: "משתמש בדיקות לא נמצא" };
    }

    // מחיקת המשתמש מטבלת users
    const { error: deleteUserError } = await supabase
      .from("users")
      .delete()
      .eq("id", user.id);

    if (deleteUserError) {
      console.error("Error deleting user record:", deleteUserError);
      return { error: deleteUserError.message };
    }

    // מחיקת המשתמש מסופאבייס אוט
    if (user.supabase_id) {
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(
        user.supabase_id
      );

      if (deleteAuthError) {
        console.error("Error deleting auth user:", deleteAuthError);
        return { error: deleteAuthError.message };
      }
    }

    console.log("Test user removed successfully");
    return { message: "משתמש בדיקות הוסר בהצלחה" };
  } catch (error) {
    console.error("Unexpected error in removeTestUser:", error);
    return { error: error.message };
  }
}
