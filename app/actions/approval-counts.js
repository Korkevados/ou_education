/** @format */
"use server";

import createClient from "@/lib/supabase/supabase-server";

/**
 * Get counts of pending items for approval
 * Returns counts for materials, topics, and users
 */
export async function getApprovalCounts() {
  try {
    const supabase = await createClient();

    // Check session
    const { data: session, error: sessionError } =
      await supabase.auth.getUser();
    if (sessionError || !session?.user) {
      console.error("Session error:", sessionError);
      return { error: "אין הרשאה. נא להתחבר מחדש." };
    }

    // Check if user is admin or training manager
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("user_type")
      .eq("supabase_id", session.user.id)
      .single();

    if (userError || !userData) {
      console.error("Error fetching user role:", userError);
      return { error: "שגיאה בבדיקת הרשאות" };
    }

    if (
      userData.user_type !== "ADMIN" &&
      userData.user_type !== "TRAINING_MANAGER"
    ) {
      return {
        data: {
          pendingMaterials: 0,
          pendingTopics: 0,
          pendingUsers: 0,
          total: 0,
        },
      };
    }

    // Get pending materials count
    const { count: materialsCount, error: materialsError } = await supabase
      .from("materials")
      .select("*", { count: "exact", head: true })
      .eq("is_approved", false);

    if (materialsError) {
      console.error("Error fetching materials count:", materialsError);
    }

    // Get pending topics count
    const { count: topicsCount, error: topicsError } = await supabase
      .from("pending_topics")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    if (topicsError) {
      console.error("Error fetching topics count:", topicsError);
    }

    // Get pending users count (inactive users)
    const { count: usersCount, error: usersError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("is_active", false);

    if (usersError) {
      console.error("Error fetching users count:", usersError);
    }

    const pendingMaterials = materialsCount || 0;
    const pendingTopics = topicsCount || 0;
    const pendingUsers = usersCount || 0;
    const total = pendingMaterials + pendingTopics + pendingUsers;

    return {
      data: {
        pendingMaterials,
        pendingTopics,
        pendingUsers,
        total,
      },
    };
  } catch (error) {
    console.error("Exception in getApprovalCounts:", error);
    return { error: "שגיאה בטעינת מספר פריטים ממתינים לאישור" };
  }
}
