/** @format */
"use server";

import createClient from "@/lib/supabase/supabase-server";
import supabaseAdmin from "@/lib/supabase/supabase-admin";
import { getUserDetails } from "@/app/actions/auth";

/**
 * Fetches all users with their center information
 */
export async function getUsers() {
  try {
    // Get current user details to check role from users table
    const currentUser = await getUserDetails();
    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    // Choose the appropriate client based on user role from users table
    const supabase =
      currentUser.role === "ADMIN"
        ? await supabaseAdmin()
        : await createClient();

    const { data: users, error } = await supabase
      .from("users")
      .select(
        `
        id,
        name,
        phone,
        role,
        is_active,
        centers (
          id,
          center_name
        )
      `
      )
      .eq("is_active", true);

    if (error) throw error;

    // Transform the data to match the expected format
    const transformedUsers = users.map((user) => ({
      id: user.id,
      name: user.name || "משתמש זמני",
      phone: user.phone,
      role: user.role,
      activityCenter: user.centers?.center_name || "ללא מרכז פעילות",
    }));
    console.log(transformedUsers);
    return { data: transformedUsers };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { error: "Failed to fetch users" };
  }
}

/**
 * Creates a new user
 */

export async function createUser(userData) {
  try {
    const supabase = await supabaseAdmin();
    console.log("userData1", userData);
    // First, check if a user with this phone number already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("phone", userData.phone)
      .single();

    if (existingUser) {
      return { error: "משתמש עם מספר טלפון זה כבר קיים במערכת" };
    }

    // Get the center ID based on the center name or create a new center
    let centerId;
    const { data: existingCenter } = await supabase
      .from("centers")
      .select("id")
      .eq("center_name", userData.activityCenter)
      .single();

    if (!existingCenter) {
      // Create new center
      const { data: newCenter, error: centerError } = await supabase
        .from("centers")
        .insert([{ center_name: userData.activityCenter }])
        .select("id")
        .single();

      if (centerError) throw centerError;
      centerId = newCenter.id;
    } else {
      centerId = existingCenter.id;
    }

    console.log("centerId", centerId);
    // Create the user
    const { data: newUser, error } = await supabase
      .from("users")
      .insert([
        {
          name: userData.name,
          phone: userData.phone,
          role: userData.role,
          center_activity_id: centerId,
        },
      ])
      .select(); // This ensures the inserted row is returned

    if (error) throw error;
    console.log("newUser", newUser);

    return { data: newUser };
  } catch (error) {
    console.error("Error creating user:", error);
    return { error: "Failed to create user" };
  }
}

/**
 * Updates an existing user
 */
export async function updateUser(userId, userData) {
  try {
    const supabase = await createClient();

    // Get the center ID based on the center name or create a new center
    let centerId;
    const { data: existingCenter } = await supabase
      .from("centers")
      .select("id")
      .eq("center_name", userData.activityCenter)
      .single();

    if (!existingCenter) {
      // Create new center
      const { data: newCenter, error: centerError } = await supabase
        .from("centers")
        .insert([{ center_name: userData.activityCenter }])
        .select("id")
        .single();

      if (centerError) throw centerError;
      centerId = newCenter.id;
    } else {
      centerId = existingCenter.id;
    }

    // Update the user
    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({
        name: userData.name,
        phone: userData.phone,
        role: userData.role,
        center_activity_id: centerId,
      })
      .eq("id", userId);

    if (error) throw error;

    return { data: updatedUser };
  } catch (error) {
    console.error("Error updating user:", error);
    return { error: "Failed to update user" };
  }
}

/**
 * Soft deletes a user by setting is_active to false
 */
export async function deleteUser(userId) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("users")
      .update({ is_active: false })
      .eq("id", userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { error: "Failed to delete user" };
  }
}

/**
 * Fetches all activity centers
 */
export async function getActivityCenters() {
  try {
    const supabase = await createClient();
    const { data: centers, error } = await supabase
      .from("centers")
      .select("center_name");

    if (error) throw error;

    return { data: centers.map((center) => center.center_name) };
  } catch (error) {
    console.error("Error fetching activity centers:", error);
    return { error: "Failed to fetch activity centers" };
  }
}
