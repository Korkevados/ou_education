/** @format */
"use server";

import createClient from "@/lib/supabase/supabase-server";
import supabaseAdmin from "@/lib/supabase/supabase-admin";
import getUserDetails from "@/app/actions/auth";

/**
 * Fetches all users with their center information
 */
export async function getUsers() {
  console.log("=== getUsers: FUNCTION START ===");
  try {
    // Get current user details to check role from users table
    console.log("getUsers: Attempting to get current user details");
    const currentUser = await getUserDetails();
    if (!currentUser) {
      console.log("getUsers: User not authenticated");
      throw new Error("Not authenticated");
    }
    console.log("getUsers: Current user details:", JSON.stringify(currentUser));

    // Choose the appropriate client based on user role from users table
    console.log(`getUsers: User role: ${currentUser.role}`);
    const supabase =
      currentUser.role === "ADMIN"
        ? await supabaseAdmin()
        : await createClient();
    console.log("getUsers: Supabase client created successfully");

    // Fetching all users including inactive ones
    console.log("getUsers: Starting to fetch users data from database");
    const { data: users, error } = await supabase.from("users").select(`
        id,
        full_name,
        phone,
        email,
        user_type,
        is_active,
        center_id,
        position,
        supabase_id,
        centers!users_center_id_fkey (
          id,
          name
        )
      `);

    if (error) {
      console.log("getUsers: Error fetching users data:", error);
      throw error;
    }

    console.log(`getUsers: Number of users found: ${users?.length || 0}`);

    // Transform the data to match the expected format
    console.log("getUsers: Starting data transformation to required format");
    const transformedUsers = users.map((user) => {
      console.log(`getUsers: Processing user ${user.id} - ${user.full_name}`);
      return {
        id: user.id,
        full_name: user.full_name || "Temporary User",
        phone: user.phone,
        email: user.email,
        user_type: user.user_type,
        is_active: user.is_active,
        center_id: user.center_id,
        center_name:
          user.centers && user.centers.name
            ? user.centers.name
            : "No Activity Center",
        position: user.position,
      };
    });

    console.log(
      `getUsers: Data transformation complete, ${transformedUsers.length} users processed`
    );
    console.log("=== getUsers: FUNCTION COMPLETED SUCCESSFULLY ===");
    return { data: transformedUsers };
  } catch (error) {
    console.error("=== getUsers: GENERAL ERROR ===", error);
    return { error: "Failed to fetch users" };
  }
}

/**
 * Creates a new user
 */
export async function createUser(userData) {
  console.log("=== createUser: FUNCTION START ===");
  try {
    const supabase = await supabaseAdmin();
    console.log("createUser: User data received:", userData);

    // Validate required fields
    if (
      !userData.name ||
      !userData.phone ||
      !userData.email ||
      !userData.role
    ) {
      console.error("createUser: Missing required fields");
      return { error: "כל השדות המסומנים הם שדות חובה" };
    }

    // Clean phone number (remove any remaining hyphens) for database storage
    const cleanPhone = userData.phone.replace(/-/g, "");
    console.log("createUser: Cleaned phone number:", cleanPhone);

    // First, check if a user with this phone number already exists
    // Check both with and without hyphens for existing users
    const { data: existingUsersByPhone, error: phoneCheckError } =
      await supabase
        .from("users")
        .select("*")
        .or(`phone.eq.${cleanPhone},phone.eq.${userData.phone}`);

    if (phoneCheckError) {
      console.log(
        "createUser: Error checking for existing phone:",
        phoneCheckError
      );
      return {
        error: "שגיאה בבדיקת מספר טלפון קיים: " + phoneCheckError.message,
      };
    }

    if (existingUsersByPhone && existingUsersByPhone.length > 0) {
      console.log("createUser: Phone number already exists");
      return { error: "משתמש עם מספר טלפון זה כבר קיים במערכת" };
    }

    // בדיקה אם קיים משתמש עם אותו אימייל
    const { data: existingUserByEmail, error: emailCheckError } = await supabase
      .from("users")
      .select("*")
      .eq("email", userData.email)
      .single();

    if (emailCheckError && emailCheckError.code !== "PGRST116") {
      console.log(
        "createUser: Error checking for existing email:",
        emailCheckError
      );
      return { error: "שגיאה בבדיקת אימייל קיים: " + emailCheckError.message };
    }

    if (existingUserByEmail) {
      console.log("createUser: Email already exists");
      return { error: "משתמש עם אימייל זה כבר קיים במערכת" };
    }

    // Get the center ID based on the center name or create a new center
    let centerId;

    if (userData.activityCenter) {
      console.log(`createUser: Looking for center: ${userData.activityCenter}`);
      const { data: existingCenter, error: centerCheckError } = await supabase
        .from("centers")
        .select("id")
        .eq("name", userData.activityCenter)
        .single();

      if (centerCheckError && centerCheckError.code !== "PGRST116") {
        console.log(
          "createUser: Error checking for existing center:",
          centerCheckError
        );
        return {
          error: "שגיאה בבדיקת מרכז פעילות קיים: " + centerCheckError.message,
        };
      }

      if (!existingCenter) {
        console.log("createUser: Creating new center");
        // Validate city if creating a new center
        if (!userData.activityCity) {
          return { error: "נדרש להזין עיר למרכז פעילות חדש" };
        }

        // Create new center
        const { data: newCenter, error: centerError } = await supabase
          .from("centers")
          .insert([
            {
              name: userData.activityCenter,
              city: userData.activityCity || "Unknown", // Default city if none provided
            },
          ])
          .select()
          .single();

        if (centerError) {
          console.log("createUser: Error creating center:", centerError);
          return {
            error: "שגיאה ביצירת מרכז פעילות חדש: " + centerError.message,
          };
        }
        centerId = newCenter.id;
        console.log(`createUser: New center created with ID: ${centerId}`);
      } else {
        centerId = existingCenter.id;
        console.log(`createUser: Found existing center with ID: ${centerId}`);
      }
    }

    // יצירת משתמש auth בסופאבייס
    console.log("createUser: Creating auth user");
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password || Math.random().toString(36).slice(-8), // סיסמא רנדומלית אם לא סופקה
        email_confirm: true,
      });

    if (authError) {
      console.error("createUser: Error creating auth user:", authError);
      return { error: "שגיאה ביצירת משתמש: " + authError.message };
    }

    // הכנת נתוני משתמש
    const userDataToInsert = {
      full_name: userData.name,
      phone: cleanPhone, // Use cleaned phone number
      email: userData.email,
      user_type: userData.role,
      supabase_id: authUser.user.id,
      is_active: userData.is_active !== undefined ? userData.is_active : true,
    };

    // הוספת מרכז פעילות ותפקיד אם קיימים
    if (centerId) {
      userDataToInsert.center_id = centerId;
    }

    if (userData.role === "GUIDE" && !userData.position) {
      userDataToInsert.position = "GUIDE";
    } else if (userData.position) {
      userDataToInsert.position = userData.position;
    }

    // Create the user
    console.log("createUser: Creating user record in database");
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert([userDataToInsert])
      .select(); // This ensures the inserted row is returned

    if (insertError) {
      // if error, delete the auth user
      console.log(
        "createUser: Error creating user record, deleting auth user:",
        insertError
      );
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return {
        error: "שגיאה בהוספת משתמש למסד הנתונים: " + insertError.message,
      };
    }

    console.log("createUser: User created successfully");
    console.log("=== createUser: FUNCTION COMPLETED SUCCESSFULLY ===");
    return { data: newUser[0] };
  } catch (error) {
    console.error("=== createUser: GENERAL ERROR ===", error);
    return { error: "שגיאה כללית ביצירת משתמש: " + (error.message || error) };
  }
}

/**
 * Updates an existing user
 */
export async function updateUser(data) {
  console.log("=== updateUser: FUNCTION START ===");

  try {
    const supabase = await supabaseAdmin();
    const userId = data.userId;
    console.log(`updateUser: Updating user ID: ${userId}`, data);

    // Validate user ID
    if (!userId) {
      console.error("updateUser: Missing user ID");
      return { error: "מזהה משתמש חסר" };
    }

    // Validate required fields
    if (!data.name || !data.phone || !data.email || !data.role) {
      console.error("updateUser: Missing required fields");
      return { error: "כל השדות המסומנים הם שדות חובה" };
    }

    // Clean phone number (remove any hyphens) for database storage
    const cleanPhone = data.phone.replace(/-/g, "");
    console.log("updateUser: Cleaned phone number:", cleanPhone);

    // First check if the user exists
    const { data: existingUser, error: userCheckError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userCheckError) {
      console.error(
        "updateUser: Error checking user existence:",
        userCheckError
      );
      return { error: "שגיאה בבדיקת קיום משתמש: " + userCheckError.message };
    }

    if (!existingUser) {
      console.error("updateUser: User not found");
      return { error: "משתמש לא נמצא" };
    }

    // בדיקה אם מעדכנים את הסטטוס בלבד
    if (data.hasOwnProperty("is_active") && Object.keys(data).length === 1) {
      console.log(`updateUser: Updating only is_active to: ${data.is_active}`);
      const { data: updatedUser, error: statusError } = await supabase
        .from("users")
        .update({ is_active: data.is_active })
        .eq("id", userId)
        .select();

      if (statusError) {
        console.log("updateUser: Error updating is_active:", statusError);
        return { error: "שגיאה בעדכון סטטוס משתמש: " + statusError.message };
      }
      console.log("updateUser: User status updated successfully");
      return { data: updatedUser };
    }

    // Check if phone number exists for another user
    if (data.phone) {
      const { data: existingUsers, error: phoneCheckError } = await supabase
        .from("users")
        .select("id")
        .or(`phone.eq.${cleanPhone},phone.eq.${data.phone}`)
        .neq("id", userId);

      if (phoneCheckError) {
        console.log(
          "updateUser: Error checking for existing phone:",
          phoneCheckError
        );
        return {
          error: "שגיאה בבדיקת מספר טלפון קיים: " + phoneCheckError.message,
        };
      }

      if (existingUsers && existingUsers.length > 0) {
        console.log("updateUser: Phone number already exists for another user");
        return { error: "מספר הטלפון כבר קיים למשתמש אחר במערכת" };
      }
    }

    // Check if email exists for another user
    if (data.email) {
      const { data: existingUsers, error: emailCheckError } = await supabase
        .from("users")
        .select("id")
        .eq("email", data.email)
        .neq("id", userId);

      if (emailCheckError) {
        console.log(
          "updateUser: Error checking for existing email:",
          emailCheckError
        );
        return {
          error: "שגיאה בבדיקת אימייל קיים: " + emailCheckError.message,
        };
      }

      if (existingUsers && existingUsers.length > 0) {
        console.log("updateUser: Email already exists for another user");
        return { error: "כתובת האימייל כבר קיימת למשתמש אחר במערכת" };
      }
    }

    // Get the center ID based on the center name or create a new center
    let centerId;
    if (data.activityCenter) {
      console.log(`updateUser: Looking for center: ${data.activityCenter}`);
      const { data: existingCenter, error: centerCheckError } = await supabase
        .from("centers")
        .select("id")
        .eq("name", data.activityCenter)
        .single();

      if (centerCheckError && centerCheckError.code !== "PGRST116") {
        console.log(
          "updateUser: Error checking for existing center:",
          centerCheckError
        );
        return {
          error: "שגיאה בבדיקת מרכז פעילות קיים: " + centerCheckError.message,
        };
      }

      if (!existingCenter) {
        console.log("updateUser: Creating new center");
        // Validate city if creating a new center
        if (!data.activityCity) {
          return { error: "נדרש להזין עיר למרכז פעילות חדש" };
        }

        // Create new center
        const { data: newCenter, error: centerError } = await supabase
          .from("centers")
          .insert([
            {
              name: data.activityCenter,
              city: data.activityCity || "Unknown", // Default city if none provided
            },
          ])
          .select()
          .single();

        if (centerError) {
          console.log("updateUser: Error creating center:", centerError);
          return {
            error: "שגיאה ביצירת מרכז פעילות חדש: " + centerError.message,
          };
        }
        centerId = newCenter.id;
        console.log(`updateUser: New center created with ID: ${centerId}`);
      } else {
        centerId = existingCenter.id;
        console.log(`updateUser: Found existing center with ID: ${centerId}`);
      }
    }

    // הכנת נתוני משתמש לעדכון
    const userDataToUpdate = {};

    if (data.name) userDataToUpdate.full_name = data.name;
    if (data.phone) userDataToUpdate.phone = cleanPhone; // Use cleaned phone number
    if (data.email) userDataToUpdate.email = data.email;
    if (data.role) userDataToUpdate.user_type = data.role;
    if (centerId) userDataToUpdate.center_id = centerId;
    if (data.is_active !== undefined)
      userDataToUpdate.is_active = data.is_active;

    // עדכון תפקיד אם צריך
    if (data.role === "GUIDE" && !data.position) {
      userDataToUpdate.position = "GUIDE";
    } else if (data.position) {
      userDataToUpdate.position = data.position;
    }

    console.log("updateUser: Updating user with data:", userDataToUpdate);

    // Update the user
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update(userDataToUpdate)
      .eq("id", userId)
      .select();

    if (updateError) {
      console.log("updateUser: Error updating user:", updateError);
      return { error: "שגיאה בעדכון פרטי משתמש: " + updateError.message };
    }

    console.log("updateUser: User updated successfully");
    console.log("=== updateUser: FUNCTION COMPLETED SUCCESSFULLY ===");
    return { data: updatedUser };
  } catch (error) {
    console.error("=== updateUser: GENERAL ERROR ===", error);
    return { error: "שגיאה כללית בעדכון משתמש: " + (error.message || error) };
  }
}

/**
 * Soft deletes a user by setting is_active to false
 */
export async function deleteUser(userId) {
  console.log("=== deleteUser: FUNCTION START ===");
  try {
    console.log(`deleteUser: Attempting to delete user with ID ${userId}`);
    const supabase = await supabaseAdmin();

    // First check if the user exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id, full_name, is_active")
      .eq("id", userId)
      .single();

    if (checkError) {
      console.log(`deleteUser: Error checking if user exists:`, checkError);
      throw checkError;
    }

    if (!existingUser) {
      console.log(`deleteUser: User with ID ${userId} not found`);
      return { error: "User not found" };
    }

    if (!existingUser.is_active) {
      console.log(
        `deleteUser: User ${existingUser.full_name} is already inactive`
      );
      return { success: true, message: "User is already inactive" };
    }

    console.log(`deleteUser: Soft-deleting user ${existingUser.full_name}`);
    const { error } = await supabase
      .from("users")
      .update({ is_active: false })
      .eq("id", userId);

    if (error) {
      console.log("deleteUser: Error soft-deleting user:", error);
      throw error;
    }

    console.log(
      `deleteUser: User ${existingUser.full_name} successfully deactivated`
    );
    console.log("=== deleteUser: FUNCTION COMPLETED SUCCESSFULLY ===");
    return { success: true };
  } catch (error) {
    console.error("=== deleteUser: GENERAL ERROR ===", error);
    return { error: "Failed to delete user" };
  }
}

/**
 * Fetches all activity centers
 */
export async function getActivityCenters() {
  console.log("=== getActivityCenters: FUNCTION START ===");
  try {
    const supabase = await createClient();
    console.log("getActivityCenters: Querying centers table");
    const { data: centers, error } = await supabase
      .from("centers")
      .select("id, name, city");

    if (error) {
      console.log("getActivityCenters: Error fetching centers:", error);
      throw error;
    }

    console.log(`getActivityCenters: Found ${centers?.length || 0} centers`);

    // Return just the names for the dropdown
    return { data: centers.map((center) => center.name) };
  } catch (error) {
    console.error("getActivityCenters: Error:", error);
    return { error: "Failed to fetch activity centers" };
  }
}

/**
 * Activates a user and sets their activation date
 */
export async function activateUser(userId) {
  console.log("=== activateUser: FUNCTION START ===");
  try {
    const supabase = await supabaseAdmin();
    console.log(`activateUser: Activating user with ID ${userId}`);

    // First check if the user exists and is not already active
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id, full_name, is_active")
      .eq("id", userId)
      .single();

    if (checkError) {
      console.log(`activateUser: Error checking if user exists:`, checkError);
      return { error: "שגיאה בבדיקת קיום משתמש" };
    }

    if (!existingUser) {
      console.log(`activateUser: User with ID ${userId} not found`);
      return { error: "משתמש לא נמצא" };
    }

    if (existingUser.is_active) {
      console.log(
        `activateUser: User ${existingUser.full_name} is already active`
      );
      return { error: "המשתמש כבר פעיל במערכת" };
    }

    // Activate the user and set activation date
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select();

    if (updateError) {
      console.log("activateUser: Error activating user:", updateError);
      return { error: "שגיאה באישור המשתמש" };
    }

    console.log(
      `activateUser: User ${existingUser.full_name} successfully activated`
    );
    console.log("=== activateUser: FUNCTION COMPLETED SUCCESSFULLY ===");
    return { data: updatedUser[0] };
  } catch (error) {
    console.error("=== activateUser: GENERAL ERROR ===", error);
    return { error: "שגיאה כללית באישור המשתמש" };
  }
}

/**
 * Deactivates a user
 */
export async function deactivateUser(userId) {
  console.log("=== deactivateUser: FUNCTION START ===");
  try {
    const supabase = await supabaseAdmin();
    console.log(`deactivateUser: Deactivating user with ID ${userId}`);

    // First check if the user exists and is currently active
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id, full_name, is_active")
      .eq("id", userId)
      .single();

    if (checkError) {
      console.log(`deactivateUser: Error checking if user exists:`, checkError);
      return { error: "שגיאה בבדיקת קיום משתמש" };
    }

    if (!existingUser) {
      console.log(`deactivateUser: User with ID ${userId} not found`);
      return { error: "משתמש לא נמצא" };
    }

    if (!existingUser.is_active) {
      console.log(
        `deactivateUser: User ${existingUser.full_name} is already inactive`
      );
      return { error: "המשתמש כבר לא פעיל במערכת" };
    }

    // Deactivate the user
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select();

    if (updateError) {
      console.log("deactivateUser: Error deactivating user:", updateError);
      return { error: "שגיאה בהשבתת המשתמש" };
    }

    console.log(
      `deactivateUser: User ${existingUser.full_name} successfully deactivated`
    );
    console.log("=== deactivateUser: FUNCTION COMPLETED SUCCESSFULLY ===");
    return { data: updatedUser[0] };
  } catch (error) {
    console.error("=== deactivateUser: GENERAL ERROR ===", error);
    return { error: "שגיאה כללית בהשבתת המשתמש" };
  }
}
