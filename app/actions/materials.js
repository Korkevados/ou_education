/** @format */

"use server";

import createClient from "@/lib/supabase/supabase-server";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import getUserDetails from "./auth";
import { linkMaterialToTargetAudiences } from "./target-audiences";

// Function to get all materials
export async function getMaterials() {
  try {
    console.log("Fetching all materials");
    const supabase = await createClient();

    const { data: session, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError || !session?.session) {
      console.error("Session error:", sessionError);
      return { error: "אין הרשאה. נא להתחבר מחדש." };
    }

    // Join with users table to get creator information
    const { data, error } = await supabase
      .from("materials")
      .select(
        `
        *,
        creator:creator_id(id, full_name),
        main_topic:main_topic_id(id, name),
        sub_topic:sub_topic_id(id, name)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching materials:", error);
      return { error: "שגיאה בטעינת חומרים" };
    }

    // For each material, fetch its target audiences
    const materialsWithAudiences = await Promise.all(
      data.map(async (material) => {
        const { data: audiences, error: audiencesError } = await supabase
          .from("material_target_audiences")
          .select(
            `
            target_audience:target_audience_id(id, grade)
          `
          )
          .eq("material_id", material.id);

        if (audiencesError) {
          console.error(
            `Error fetching target audiences for material ${material.id}:`,
            audiencesError
          );
          return {
            ...material,
            target_audiences: [],
          };
        }

        return {
          ...material,
          target_audiences: audiences.map((a) => a.target_audience),
        };
      })
    );

    return { data: materialsWithAudiences };
  } catch (error) {
    console.error("Exception in getMaterials:", error);
    return { error: "שגיאה בטעינת חומרים" };
  }
}

// Function to get a single material by ID
export async function getMaterialById(id) {
  try {
    console.log(`Fetching material with ID: ${id}`);
    const supabase = await createClient();

    const { data: session, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError || !session?.session) {
      console.error("Session error:", sessionError);
      return { error: "אין הרשאה. נא להתחבר מחדש." };
    }

    const { data, error } = await supabase
      .from("materials")
      .select(
        `
        *,
        creator:creator_id(id, full_name),
        main_topic:main_topic_id(id, name),
        sub_topic:sub_topic_id(id, name)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error fetching material with ID ${id}:`, error);
      return { error: "שגיאה בטעינת החומר" };
    }

    // Fetch target audiences for this material
    const { data: audiences, error: audiencesError } = await supabase
      .from("material_target_audiences")
      .select(
        `
        target_audience:target_audience_id(id, grade)
      `
      )
      .eq("material_id", id);

    if (audiencesError) {
      console.error(
        `Error fetching target audiences for material ${id}:`,
        audiencesError
      );
      return {
        data: {
          ...data,
          target_audiences: [],
        },
      };
    }

    return {
      data: {
        ...data,
        target_audiences: audiences.map((a) => a.target_audience),
      },
    };
  } catch (error) {
    console.error(`Exception in getMaterialById for ID ${id}:`, error);
    return { error: "שגיאה בטעינת החומר" };
  }
}

// Function to upload a new material
export async function uploadMaterial({
  title,
  description,
  mainTopicId,
  estimatedTime,
  fileUrl,
  targetAudiences,
  newTopic,
}) {
  try {
    const supabase = await createClient();

    // Check session
    const { data: session, error: sessionError } =
      await supabase.auth.getUser();
    if (sessionError || !session?.user) {
      console.error("Session error:", sessionError);
      return { error: "אין הרשאה. נא להתחבר מחדש." };
    }

    // Sanitize IDs - convert empty strings or falsy values to null
    const sanitizedMainTopicId = mainTopicId || null;

    // Insert material record
    const { data: material, error: materialError } = await supabase
      .from("materials")
      .insert({
        title,
        description,
        main_topic_id: sanitizedMainTopicId,
        sub_topic_id: null, // We no longer use sub-topics
        estimated_time: estimatedTime,
        url: fileUrl,
        creator_id: session.user.id,
      })
      .select()
      .single();

    if (materialError) {
      console.error("Error creating material:", materialError);
      return { error: "שגיאה ביצירת חומר לימוד" };
    }

    // Link target audiences
    if (targetAudiences?.length > 0) {
      const { error: audiencesError } = await linkMaterialToTargetAudiences(
        material.id,
        targetAudiences
      );

      if (audiencesError) {
        console.error("Error linking target audiences:", audiencesError);
        // Delete the material if linking target audiences failed
        await supabase.from("materials").delete().eq("id", material.id);
        return { error: "שגיאה בקישור קהלי יעד" };
      }
    }

    // Create pending topic if needed
    if (newTopic) {
      const { error: topicError } = await supabase
        .from("pending_topics")
        .insert({
          name: newTopic.name,
          is_main_topic: true, // Always a main topic now
          parent_topic_id: null, // No parent topics since we don't use sub-topics anymore
          material_id: material.id,
          created_by: session.user.id,
        });

      if (topicError) {
        console.error("Error creating pending topic:", topicError);
        // Delete the material if creating pending topic failed
        await supabase.from("materials").delete().eq("id", material.id);
        return { error: "שגיאה ביצירת נושא חדש" };
      }
    }

    return { data: material };
  } catch (error) {
    console.error("Unexpected error in uploadMaterial:", error);
    return { error: "שגיאה בלתי צפויה בהעלאת החומר" };
  }
}

// Function to delete a material
export async function deleteMaterial(id) {
  try {
    console.log(`Deleting material with ID: ${id}`);
    const supabase = await createClient();

    // Check session
    const { data: session, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError || !session?.session) {
      console.error("Session error:", sessionError);
      return { error: "אין הרשאה. נא להתחבר מחדש." };
    }

    // Get the material first to get the file URL
    const { data: material, error: getMaterialError } = await supabase
      .from("materials")
      .select("url")
      .eq("id", id)
      .single();

    if (getMaterialError) {
      console.error(`Error getting material with ID ${id}:`, getMaterialError);
      return { error: "שגיאה במציאת החומר למחיקה" };
    }

    // Extract the file path from the URL
    const fileUrl = material.url;
    const urlParts = fileUrl.split("/");
    const filePath = `materials/${urlParts[urlParts.length - 1]}`;

    // Delete the record from the materials table
    const { error: deleteError } = await supabase
      .from("materials")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error(`Error deleting material with ID ${id}:`, deleteError);
      return { error: "שגיאה במחיקת החומר ממסד הנתונים" };
    }

    // Delete the file from storage
    const { error: storageError } = await supabase.storage
      .from("content")
      .remove([filePath]);

    if (storageError) {
      console.warn(
        `Warning: Could not delete file ${filePath} from storage:`,
        storageError
      );
      // We don't return an error here because the database record was successfully deleted
    }

    revalidatePath("/dashboard/content");
    return { success: true };
  } catch (error) {
    console.error(`Exception in deleteMaterial for ID ${id}:`, error);
    return { error: "שגיאה במחיקת החומר" };
  }
}

// Function to toggle like on a material
export async function toggleLike(materialId) {
  try {
    console.log(`Toggling like for material: ${materialId}`);
    const supabase = await createClient();

    // Check session
    const { data: session, error: sessionError } =
      await supabase.auth.getUser();
    if (sessionError || !session?.user) {
      console.error("Session error:", sessionError);
      return { error: "אין הרשאה. נא להתחבר מחדש." };
    }

    // Check if the user already liked this material
    const { data: existingLike, error: likeCheckError } = await supabase
      .from("likes")
      .select()
      .eq("material_id", materialId)
      .eq("user_id", session.user.id)
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
        material_id: materialId,
        user_id: session.user.id,
      })
      .select()
      .single();

    if (addLikeError) {
      console.error("Error adding like:", addLikeError);
      return { error: "שגיאה בהוספת לייק" };
    }

    return { data: { action: "liked", like: newLike } };
  } catch (error) {
    console.error("Unexpected error in toggleLike:", error);
    return { error: "שגיאה בלתי צפויה בשינוי מצב לייק" };
  }
}

// Function to add a comment to a material
export async function addComment(materialId, content) {
  try {
    console.log(`Adding comment to material ${materialId}: ${content}`);
    const supabase = await createClient();

    // Check session
    const { data: session, error: sessionError } =
      await supabase.auth.getUser();
    if (sessionError || !session?.user) {
      console.error("Session error:", sessionError);
      return { error: "אין הרשאה. נא להתחבר מחדש." };
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
        material_id: materialId,
        user_id: session.user.id,
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
    console.error("Unexpected error in addComment:", error);
    return { error: "שגיאה בלתי צפויה בהוספת תגובה" };
  }
}

// Function to get comments for a material
export async function getComments(materialId) {
  try {
    console.log(`Fetching comments for material: ${materialId}`);
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
      .eq("material_id", materialId)
      .order("created_at", { ascending: false });

    if (commentsError) {
      console.error("Error fetching comments:", commentsError);
      return { error: "שגיאה בטעינת תגובות" };
    }

    return { data: comments };
  } catch (error) {
    console.error("Unexpected error in getComments:", error);
    return { error: "שגיאה בלתי צפויה בטעינת תגובות" };
  }
}

// Function to check if user has liked a material
export async function checkUserLike(materialId) {
  try {
    console.log(`Checking if user liked material: ${materialId}`);
    const supabase = await createClient();

    // Check session
    const { data: session, error: sessionError } =
      await supabase.auth.getUser();
    if (sessionError || !session?.user) {
      console.error("Session error:", sessionError);
      return { error: "אין הרשאה. נא להתחבר מחדש." };
    }

    // Check if the user already liked this material
    const { data, error } = await supabase
      .from("likes")
      .select()
      .eq("material_id", materialId)
      .eq("user_id", session.user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is the "not found" error code
      console.error("Error checking user like:", error);
      return { error: "שגיאה בבדיקת לייק" };
    }

    return { data: { hasLiked: !!data } };
  } catch (error) {
    console.error("Unexpected error in checkUserLike:", error);
    return { error: "שגיאה בלתי צפויה בבדיקת לייק" };
  }
}

// Function to count likes for a material
export async function getLikesCount(materialId) {
  try {
    console.log(`Counting likes for material: ${materialId}`);
    const supabase = await createClient();

    // Count the likes
    const { count, error } = await supabase
      .from("likes")
      .select("id", { count: "exact" })
      .eq("material_id", materialId);

    if (error) {
      console.error("Error counting likes:", error);
      return { error: "שגיאה בספירת לייקים" };
    }

    return { data: { count } };
  } catch (error) {
    console.error("Unexpected error in getLikesCount:", error);
    return { error: "שגיאה בלתי צפויה בספירת לייקים" };
  }
}
