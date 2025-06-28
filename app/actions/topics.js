/** @format */

"use server";

import createClient from "@/lib/supabase/supabase-server";

// Get all main topics
export async function getMainTopics() {
  try {
    console.log("Fetching main topics");
    const supabase = await createClient();

    const { data: session, error: sessionError } =
      await supabase.auth.getUser();
    if (sessionError || !session?.user) {
      console.error("Session error:", sessionError);
      return { error: "אין הרשאה. נא להתחבר מחדש." };
    }

    const { data, error } = await supabase
      .from("main_topics")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching main topics:", error);
      return { error: "שגיאה בטעינת נושאים ראשיים" };
    }

    return { data };
  } catch (error) {
    console.error("Exception in getMainTopics:", error);
    return { error: "שגיאה בטעינת נושאים ראשיים" };
  }
}

// Get target audiences
export async function getTargetAudiences() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("target_audiences")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching target audiences:", error);
      return { error };
    }

    return { data };
  } catch (error) {
    console.error("Unexpected error in getTargetAudiences:", error);
    return { error };
  }
}

// Get materials by main topic
export async function getMaterialsByMainTopic(topicId) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("materials")
      .select(
        `
        *,
        main_topic:main_topic_id(*),
        target_audiences:material_target_audiences(target_audience:target_audiences(*))
      `
      )
      .eq("main_topic_id", topicId);

    if (error) {
      console.error("Error fetching materials by main topic:", error);
      return { error };
    }

    return { data };
  } catch (error) {
    console.error("Unexpected error in getMaterialsByMainTopic:", error);
    return { error };
  }
}

// Function to get all sub topics
export async function getSubTopics() {
  try {
    console.log("Fetching sub topics");
    const supabase = await createClient();

    const { data: session, error: sessionError } =
      await supabase.auth.getUser();
    if (sessionError || !session?.user) {
      console.error("Session error:", sessionError);
      return { error: "אין הרשאה. נא להתחבר מחדש." };
    }

    const { data, error } = await supabase
      .from("sub_topics")
      .select("*, main_topic:main_topic_id(name)")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching sub topics:", error);
      return { error: "שגיאה בטעינת תתי נושאים" };
    }

    return { data };
  } catch (error) {
    console.error("Exception in getSubTopics:", error);
    return { error: "שגיאה בטעינת תתי נושאים" };
  }
}

// Function to get sub topics by main topic ID
export async function getSubTopicsByMainTopicId(mainTopicId) {
  try {
    console.log(`Fetching sub topics for main topic ID: ${mainTopicId}`);
    const supabase = await createClient();

    const { data: session, error: sessionError } =
      await supabase.auth.getUser();
    if (sessionError || !session?.user) {
      console.error("Session error:", sessionError);
      return { error: "אין הרשאה. נא להתחבר מחדש." };
    }

    if (!mainTopicId) {
      return { error: "יש לציין נושא ראשי" };
    }

    const { data, error } = await supabase
      .from("sub_topics")
      .select("*")
      .eq("main_topic_id", mainTopicId)
      .order("name", { ascending: true });

    if (error) {
      console.error(
        `Error fetching sub topics for main topic ID ${mainTopicId}:`,
        error
      );
      return { error: "שגיאה בטעינת תתי נושאים" };
    }

    return { data };
  } catch (error) {
    console.error(
      `Exception in getSubTopicsByMainTopicId for ID ${mainTopicId}:`,
      error
    );
    return { error: "שגיאה בטעינת תתי נושאים" };
  }
}

// Function to create a pending topic
export async function createPendingTopic({
  name,
  isMainTopic,
  parentTopicId,
  materialId,
}) {
  try {
    console.log("Creating pending topic:", {
      name,
      isMainTopic,
      parentTopicId,
      materialId,
    });
    const supabase = await createClient();

    const { data: session, error: sessionError } =
      await supabase.auth.getUser();
    if (sessionError || !session?.user) {
      console.error("Session error:", sessionError);
      return { error: "אין הרשאה. נא להתחבר מחדש." };
    }

    const { data, error } = await supabase
      .from("pending_topics")
      .insert({
        name,
        is_main_topic: isMainTopic,
        parent_topic_id: parentTopicId,
        material_id: materialId,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating pending topic:", error);
      return { error: "שגיאה ביצירת נושא חדש" };
    }

    return { data };
  } catch (error) {
    console.error("Exception in createPendingTopic:", error);
    return { error: "שגיאה ביצירת נושא חדש" };
  }
}

// Function to get all pending topics (admin only)
export async function getPendingTopics() {
  try {
    console.log("Fetching pending topics");
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
      console.log("Unauthorized access attempt by user:", session.user.id);
      return { error: "אין לך הרשאות לצפות בנושאים ממתינים" };
    }
    console.log("User is authorized to view pending topics");
    // Fetch pending topics with related data
    const { data, error } = await supabase
      .from("pending_topics")
      .select(
        `
        id,
        name,
        is_main_topic,
        status,
        rejection_reason,
        created_at,
        material:material_id (
          id,
          title,
          creator:creator_id (
            full_name,
            email
          )
        ),
        parent_topic:parent_topic_id (
          id,
          name
        ),
        creator:created_by (
          full_name,
          email
        )
      `
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    console.log("Data:", data);
    if (error) {
      console.error("Error fetching pending topics:", error);
      return { error: "שגיאה בטעינת נושאים ממתינים" };
    }

    // Transform the data to include computed fields
    const transformedData = data.map((topic) => ({
      ...topic,
      statusText: getStatusText(topic.status),
      createdAtFormatted: new Date(topic.created_at).toLocaleDateString(
        "he-IL",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      ),
      approvedAtFormatted: topic.approved_at
        ? new Date(topic.approved_at).toLocaleDateString("he-IL", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : null,
    }));
    console.log("Transformed data:", transformedData);
    return { data: transformedData };
    // return;
  } catch (error) {
    console.error("Exception in getPendingTopics:", error);
    return { error: "שגיאה בלתי צפויה בטעינת נושאים ממתינים" };
  }
}

// Helper function to get status text in Hebrew
function getStatusText(status) {
  switch (status) {
    case "pending":
      return "ממתין לאישור";
    case "approved":
      return "אושר";
    case "rejected":
      return "נדחה";
    default:
      return "לא ידוע";
  }
}

// Function to approve a pending topic (admin only)
export async function approvePendingTopic(topicId) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    // Call the database function to approve the topic
    const { error: functionError } = await supabase.rpc(
      "approve_pending_topic",
      {
        p_topic_id: topicId,
        p_approved_by: user.id,
      }
    );

    if (functionError) throw functionError;

    return { error: null };
  } catch (error) {
    console.error("Error approving topic:", error);
    return {
      error: error.message,
    };
  }
}

// Function to reject a pending topic (admin only)
export async function rejectPendingTopic(topicId, rejectionReason) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    // Update the pending topic status
    const { error: updateError } = await supabase
      .from("pending_topics")
      .update({
        status: "rejected",
        rejection_reason: rejectionReason,
      })
      .eq("id", topicId);

    if (updateError) throw updateError;

    return { error: null };
  } catch (error) {
    console.error("Error rejecting topic:", error);
    return {
      error: error.message,
    };
  }
}

// Function to reassign a material to a different topic (admin only)
export async function reassignTopic(pendingTopicId, newTopicId, isMainTopic) {
  try {
    console.log("Reassigning topic:", {
      pendingTopicId,
      newTopicId,
      isMainTopic,
    });
    const supabase = await createClient();

    const { data: session, error: sessionError } =
      await supabase.auth.getUser();
    if (sessionError || !session?.user) {
      console.error("Session error:", sessionError);
      return { error: "אין הרשאה. נא להתחבר מחדש." };
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (roleError || !roleData || roleData.role !== "admin") {
      return { error: "אין הרשאת מנהל" };
    }

    // Get the pending topic to get the material_id
    const { data: pendingTopic, error: fetchError } = await supabase
      .from("pending_topics")
      .select("material_id")
      .eq("id", pendingTopicId)
      .single();

    if (fetchError || !pendingTopic) {
      console.error("Error fetching pending topic:", fetchError);
      return { error: "שגיאה בטעינת הנושא" };
    }

    // Start a transaction
    const { error: transactionError } = await supabase.rpc("reassign_topic", {
      p_pending_topic_id: pendingTopicId,
      p_new_topic_id: newTopicId,
      p_is_main_topic: isMainTopic,
      p_approved_by: session.user.id,
    });

    if (transactionError) {
      console.error("Error in reassign_topic transaction:", transactionError);
      return { error: "שגיאה בשיוך מחדש של הנושא" };
    }

    return { success: true };
  } catch (error) {
    console.error("Exception in reassignTopic:", error);
    return { error: "שגיאה בשיוך מחדש של הנושא" };
  }
}

// Function to create a main topic
export async function createMainTopic(name) {
  try {
    console.log("Creating main topic:", name);
    const supabase = await createClient();

    const { data: session, error: sessionError } =
      await supabase.auth.getUser();
    if (sessionError || !session?.user) {
      console.error("Session error:", sessionError);
      return { error: "אין הרשאה. נא להתחבר מחדש." };
    }

    // Check if user is admin
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
      return { error: "אין לך הרשאות ליצור נושאים" };
    }

    // Check if topic already exists
    const { data: existingTopic, error: checkError } = await supabase
      .from("main_topics")
      .select("id")
      .eq("name", name)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking existing topic:", checkError);
      return { error: "שגיאה בבדיקת קיום נושא" };
    }

    if (existingTopic) {
      return { error: "נושא עם שם זה כבר קיים" };
    }

    const { data, error } = await supabase
      .from("main_topics")
      .insert({ name })
      .select()
      .single();

    if (error) {
      console.error("Error creating main topic:", error);
      return { error: "שגיאה ביצירת נושא ראשי" };
    }

    return { data };
  } catch (error) {
    console.error("Exception in createMainTopic:", error);
    return { error: "שגיאה ביצירת נושא ראשי" };
  }
}

// Function to create a sub topic
export async function createSubTopic(name, mainTopicId) {
  try {
    console.log("Creating sub topic:", name, "for main topic:", mainTopicId);
    const supabase = await createClient();

    const { data: session, error: sessionError } =
      await supabase.auth.getUser();
    if (sessionError || !session?.user) {
      console.error("Session error:", sessionError);
      return { error: "אין הרשאה. נא להתחבר מחדש." };
    }

    // Check if user is admin
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
      return { error: "אין לך הרשאות ליצור נושאים" };
    }

    // Check if sub topic already exists for this main topic
    const { data: existingTopic, error: checkError } = await supabase
      .from("sub_topics")
      .select("id")
      .eq("name", name)
      .eq("main_topic_id", mainTopicId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking existing sub topic:", checkError);
      return { error: "שגיאה בבדיקת קיום נושא משני" };
    }

    if (existingTopic) {
      return { error: "נושא משני עם שם זה כבר קיים תחת הנושא הראשי הזה" };
    }

    const { data, error } = await supabase
      .from("sub_topics")
      .insert({ name, main_topic_id: mainTopicId })
      .select()
      .single();

    if (error) {
      console.error("Error creating sub topic:", error);
      return { error: "שגיאה ביצירת נושא משני" };
    }

    return { data };
  } catch (error) {
    console.error("Exception in createSubTopic:", error);
    return { error: "שגיאה ביצירת נושא משני" };
  }
}

// Function to update a main topic
export async function updateMainTopic(id, name) {
  try {
    console.log("Updating main topic:", id, "to name:", name);
    const supabase = await createClient();

    const { data: session, error: sessionError } =
      await supabase.auth.getUser();
    if (sessionError || !session?.user) {
      console.error("Session error:", sessionError);
      return { error: "אין הרשאה. נא להתחבר מחדש." };
    }

    // Check if user is admin
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
      return { error: "אין לך הרשאות לערוך נושאים" };
    }

    // Check if topic already exists with different ID
    const { data: existingTopic, error: checkError } = await supabase
      .from("main_topics")
      .select("id")
      .eq("name", name)
      .neq("id", id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking existing topic:", checkError);
      return { error: "שגיאה בבדיקת קיום נושא" };
    }

    if (existingTopic) {
      return { error: "נושא עם שם זה כבר קיים" };
    }

    const { data, error } = await supabase
      .from("main_topics")
      .update({ name, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating main topic:", error);
      return { error: "שגיאה בעדכון נושא ראשי" };
    }

    return { data };
  } catch (error) {
    console.error("Exception in updateMainTopic:", error);
    return { error: "שגיאה בעדכון נושא ראשי" };
  }
}

// Function to update a sub topic
export async function updateSubTopic(id, name, mainTopicId) {
  try {
    console.log(
      "Updating sub topic:",
      id,
      "to name:",
      name,
      "main topic:",
      mainTopicId
    );
    const supabase = await createClient();

    const { data: session, error: sessionError } =
      await supabase.auth.getUser();
    if (sessionError || !session?.user) {
      console.error("Session error:", sessionError);
      return { error: "אין הרשאה. נא להתחבר מחדש." };
    }

    // Check if user is admin
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
      return { error: "אין לך הרשאות לערוך נושאים" };
    }

    // Check if sub topic already exists for this main topic with different ID
    const { data: existingTopic, error: checkError } = await supabase
      .from("sub_topics")
      .select("id")
      .eq("name", name)
      .eq("main_topic_id", mainTopicId)
      .neq("id", id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking existing sub topic:", checkError);
      return { error: "שגיאה בבדיקת קיום נושא משני" };
    }

    if (existingTopic) {
      return { error: "נושא משני עם שם זה כבר קיים תחת הנושא הראשי הזה" };
    }

    const { data, error } = await supabase
      .from("sub_topics")
      .update({
        name,
        main_topic_id: mainTopicId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating sub topic:", error);
      return { error: "שגיאה בעדכון נושא משני" };
    }

    return { data };
  } catch (error) {
    console.error("Exception in updateSubTopic:", error);
    return { error: "שגיאה בעדכון נושא משני" };
  }
}

// Function to delete a main topic
export async function deleteMainTopic(id) {
  try {
    console.log("Deleting main topic:", id);
    const supabase = await createClient();

    const { data: session, error: sessionError } =
      await supabase.auth.getUser();
    if (sessionError || !session?.user) {
      console.error("Session error:", sessionError);
      return { error: "אין הרשאה. נא להתחבר מחדש." };
    }

    // Check if user is admin
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
      return { error: "אין לך הרשאות למחוק נושאים" };
    }

    // Check if topic is used in materials
    const { data: materialsUsingTopic, error: materialsError } = await supabase
      .from("materials")
      .select("id")
      .eq("main_topic_id", id)
      .limit(1);

    if (materialsError) {
      console.error("Error checking materials using topic:", materialsError);
      return { error: "שגיאה בבדיקת שימוש בנושא" };
    }

    if (materialsUsingTopic && materialsUsingTopic.length > 0) {
      return { error: "לא ניתן למחוק נושא שמשמש בתכנים" };
    }

    // Check if topic has sub topics
    const { data: subTopics, error: subTopicsError } = await supabase
      .from("sub_topics")
      .select("id")
      .eq("main_topic_id", id)
      .limit(1);

    if (subTopicsError) {
      console.error("Error checking sub topics:", subTopicsError);
      return { error: "שגיאה בבדיקת תתי נושאים" };
    }

    if (subTopics && subTopics.length > 0) {
      return { error: "לא ניתן למחוק נושא שיש לו תתי נושאים" };
    }

    const { error } = await supabase.from("main_topics").delete().eq("id", id);

    if (error) {
      console.error("Error deleting main topic:", error);
      return { error: "שגיאה במחיקת נושא ראשי" };
    }

    return { success: true };
  } catch (error) {
    console.error("Exception in deleteMainTopic:", error);
    return { error: "שגיאה במחיקת נושא ראשי" };
  }
}

// Function to delete a sub topic
export async function deleteSubTopic(id) {
  try {
    console.log("Deleting sub topic:", id);
    const supabase = await createClient();

    const { data: session, error: sessionError } =
      await supabase.auth.getUser();
    if (sessionError || !session?.user) {
      console.error("Session error:", sessionError);
      return { error: "אין הרשאה. נא להתחבר מחדש." };
    }

    // Check if user is admin
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
      return { error: "אין לך הרשאות למחוק נושאים" };
    }

    // Check if topic is used in materials
    const { data: materialsUsingTopic, error: materialsError } = await supabase
      .from("materials")
      .select("id")
      .eq("sub_topic_id", id)
      .limit(1);

    if (materialsError) {
      console.error("Error checking materials using topic:", materialsError);
      return { error: "שגיאה בבדיקת שימוש בנושא" };
    }

    if (materialsUsingTopic && materialsUsingTopic.length > 0) {
      return { error: "לא ניתן למחוק נושא שמשמש בתכנים" };
    }

    const { error } = await supabase.from("sub_topics").delete().eq("id", id);

    if (error) {
      console.error("Error deleting sub topic:", error);
      return { error: "שגיאה במחיקת נושא משני" };
    }

    return { success: true };
  } catch (error) {
    console.error("Exception in deleteSubTopic:", error);
    return { error: "שגיאה במחיקת נושא משני" };
  }
}
