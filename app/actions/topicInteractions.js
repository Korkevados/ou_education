/** @format */

"use server";

import createClient from "@/lib/supabase/supabase-server";

// Function to toggle like on a topic
export async function toggleTopicLike(topicId) {
  try {
    console.log(`Toggling like for topic: ${topicId}`);
    const supabase = await createClient();

    // Check session
    const { data: session, error: sessionError } =
      await supabase.auth.getUser();
    if (sessionError || !session?.user) {
      console.error("Session error:", sessionError);
      return { error: "אין הרשאה. נא להתחבר מחדש." };
    }

    // Verify the user exists in the users table
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("supabase_id", session.user.id)
      .single();

    if (userError) {
      console.error("Error checking user existence:", userError);
      return {
        error:
          "שגיאה באיתור המשתמש. יש להתחבר מחדש או ליצור קשר עם מנהל המערכת.",
      };
    }

    // Check if the user already liked this topic
    const { data: existingLike, error: likeCheckError } = await supabase
      .from("likes")
      .select()
      .eq("main_topic_id", topicId)
      .eq("user_id", user.id)
      .single();

    if (likeCheckError && likeCheckError.code !== "PGRST116") {
      // PGRST116 is the "not found" error code
      console.error("Error checking existing like:", likeCheckError);
      return { error: "שגיאה בבדיקת לייק קיים" };
    }

    // If like exists, remove it
    if (existingLike) {
      const { error: deleteLikeError } = await supabase
        .from("likes")
        .delete()
        .eq("id", existingLike.id);

      if (deleteLikeError) {
        console.error("Error deleting like:", deleteLikeError);
        return { error: "שגיאה בביטול הלייק" };
      }

      return { data: { action: "unliked" } };
    }

    // If no like exists, add it
    const { data: newLike, error: addLikeError } = await supabase
      .from("likes")
      .insert({
        main_topic_id: topicId,
        user_id: user.id,
      })
      .select()
      .single();

    if (addLikeError) {
      console.error("Error adding like:", addLikeError);
      return { error: "שגיאה בהוספת לייק" };
    }

    return { data: { action: "liked", like: newLike } };
  } catch (error) {
    console.error("Unexpected error in toggleTopicLike:", error);
    return { error: "שגיאה בלתי צפויה בשינוי מצב לייק" };
  }
}

// Function to add a comment to a topic
export async function addTopicComment(topicId, content) {
  try {
    console.log(`Adding comment to topic ${topicId}: ${content}`);
    const supabase = await createClient();

    // Check session
    const { data: session, error: sessionError } =
      await supabase.auth.getUser();
    if (sessionError || !session?.user) {
      console.error("Session error:", sessionError);
      return { error: "אין הרשאה. נא להתחבר מחדש." };
    }

    // Verify the user exists in the users table
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("supabase_id", session.user.id)
      .single();

    if (userError) {
      console.error("Error checking user existence:", userError);
      return {
        error:
          "שגיאה באיתור המשתמש. יש להתחבר מחדש או ליצור קשר עם מנהל המערכת.",
      };
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      return { error: "תוכן התגובה חייב להכיל טקסט" };
    }

    if (content.length > 400) {
      return { error: "תוכן התגובה ארוך מדי (מקסימום 400 תווים)" };
    }

    // Add the comment
    const { data: comment, error: commentError } = await supabase
      .from("comments")
      .insert({
        main_topic_id: topicId,
        user_id: user.id,
        content: content.trim(),
      })
      .select(
        `
        *,
        user:user_id(id, full_name)
      `
      )
      .single();

    if (commentError) {
      console.error("Error adding comment:", commentError);
      return { error: "שגיאה בהוספת תגובה" };
    }

    return { data: comment };
  } catch (error) {
    console.error("Unexpected error in addTopicComment:", error);
    return { error: "שגיאה בלתי צפויה בהוספת תגובה" };
  }
}

// Function to get comments for a topic
export async function getTopicComments(topicId) {
  try {
    console.log(`Fetching comments for topic: ${topicId}`);
    const supabase = await createClient();

    // Check session
    const { data: session, error: sessionError } =
      await supabase.auth.getUser();
    if (sessionError || !session?.user) {
      console.error("Session error:", sessionError);
      return { error: "אין הרשאה. נא להתחבר מחדש." };
    }

    // Get comments with user information
    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select(
        `
        *,
        user:user_id(id, full_name)
      `
      )
      .eq("main_topic_id", topicId)
      .order("created_at", { ascending: false });

    if (commentsError) {
      console.error("Error fetching comments:", commentsError);
      return { error: "שגיאה בטעינת תגובות" };
    }

    return { data: comments };
  } catch (error) {
    console.error("Unexpected error in getTopicComments:", error);
    return { error: "שגיאה בלתי צפויה בטעינת תגובות" };
  }
}

// Function to check if user has liked a topic
export async function checkTopicUserLike(topicId) {
  try {
    console.log(`Checking if user liked topic: ${topicId}`);
    const supabase = await createClient();

    // Check session
    const { data: session, error: sessionError } =
      await supabase.auth.getUser();
    if (sessionError || !session?.user) {
      console.error("Session error:", sessionError);
      return { error: "אין הרשאה. נא להתחבר מחדש." };
    }

    // Verify the user exists in the users table
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("supabase_id", session.user.id)
      .single();

    if (userError) {
      console.error("Error checking user existence:", userError);
      return { data: { hasLiked: false } }; // Assume not liked if user not found
    }

    // Check if the user already liked this topic
    const { data, error } = await supabase
      .from("likes")
      .select()
      .eq("main_topic_id", topicId)
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is the "not found" error code
      console.error("Error checking user like:", error);
      return { error: "שגיאה בבדיקת לייק" };
    }

    return { data: { hasLiked: !!data } };
  } catch (error) {
    console.error("Unexpected error in checkTopicUserLike:", error);
    return { error: "שגיאה בלתי צפויה בבדיקת לייק" };
  }
}

// Function to count likes for a topic
export async function getTopicLikesCount(topicId) {
  try {
    console.log(`Counting likes for topic: ${topicId}`);
    const supabase = await createClient();

    // Count the likes
    const { count, error } = await supabase
      .from("likes")
      .select("id", { count: "exact" })
      .eq("main_topic_id", topicId);

    if (error) {
      console.error("Error counting likes:", error);
      return { error: "שגיאה בספירת לייקים" };
    }

    return { data: { count } };
  } catch (error) {
    console.error("Unexpected error in getTopicLikesCount:", error);
    return { error: "שגיאה בלתי צפויה בספירת לייקים" };
  }
}

// Function to get most liked topics
export async function getMostLikedTopics(limit = 10) {
  try {
    console.log(`Fetching ${limit} most liked topics`);
    const supabase = await createClient();

    // Get topics ordered by like count
    const { data, error } = await supabase.rpc("get_most_liked_topics", {
      limit_count: limit,
    });

    if (error) {
      console.error("Error fetching most liked topics:", error);
      return { error: "שגיאה בקבלת נושאים פופולריים" };
    }

    return { data };
  } catch (error) {
    console.error("Unexpected error in getMostLikedTopics:", error);
    return { error: "שגיאה בלתי צפויה בקבלת נושאים פופולריים" };
  }
}

// Function to get most liked materials
export async function getMostLikedMaterials(limit = 10) {
  try {
    console.log(`Fetching ${limit} most liked materials`);
    const supabase = await createClient();

    // Get materials with most likes
    const { data, error } = await supabase.rpc("get_most_liked_materials", {
      limit_count: limit,
    });

    if (error) {
      console.error("Error fetching most liked materials:", error);
      return { error: "שגיאה בקבלת חומרים פופולריים" };
    }

    return { data };
  } catch (error) {
    console.error("Unexpected error in getMostLikedMaterials:", error);
    return { error: "שגיאה בלתי צפויה בקבלת חומרים פופולריים" };
  }
}
