/** @format */

"use server";

import createClient from "@/lib/supabase/supabase-server";
import { revalidatePath } from "next/cache";
import { linkMaterialToTargetAudiences } from "./target-audiences";
import createSupaClient from "@/lib/supabase/supabase";

// Function to get all materials
export async function getMaterials(includePending = false) {
  try {
    console.log("Fetching all materials");
    const supabase = await createClient();

    const { data: session, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError || !session?.session) {
      console.error("Session error:", sessionError);
      return { error: "אין הרשאה. נא להתחבר מחדש." };
    }

    // Build the query
    let query = supabase
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

    // Only show approved materials unless explicitly requested
    if (!includePending) {
      query = query.eq("is_approved", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching materials:", error);
      return { error: "שגיאה בטעינת חומרים" };
    }

    // For each material, fetch its target audiences, likes count, and comments
    const materialsWithDetails = await Promise.all(
      data.map(async (material) => {
        // Fetch target audiences
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
            likes_count: 0,
            comments: [],
            comments_count: 0,
          };
        }

        // Fetch likes count
        const { count: likesCount, error: likesError } = await supabase
          .from("likes")
          .select("id", { count: "exact" })
          .eq("material_id", material.id);

        if (likesError) {
          console.error(
            `Error fetching likes count for material ${material.id}:`,
            likesError
          );
        }

        // Fetch comments with user information
        const { data: comments, error: commentsError } = await supabase
          .from("comments")
          .select(
            `
            *,
            user:user_id(id, full_name)
          `
          )
          .eq("material_id", material.id)
          .order("created_at", { ascending: false });

        if (commentsError) {
          console.error(
            `Error fetching comments for material ${material.id}:`,
            commentsError
          );
        }

        return {
          ...material,
          target_audiences: audiences.map((a) => a.target_audience),
          likes_count: likesCount || 0,
          comments: comments || [],
          comments_count: comments?.length || 0,
        };
      })
    );

    return { data: materialsWithDetails };
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
          likes_count: 0,
          comments: [],
          comments_count: 0,
        },
      };
    }

    // Fetch likes count
    const { count: likesCount, error: likesError } = await supabase
      .from("likes")
      .select("id", { count: "exact" })
      .eq("material_id", id);

    if (likesError) {
      console.error(
        `Error fetching likes count for material ${id}:`,
        likesError
      );
    }

    // Fetch comments with user information
    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select(
        `
        *,
        user:user_id(id, full_name)
      `
      )
      .eq("material_id", id)
      .order("created_at", { ascending: false });

    if (commentsError) {
      console.error(
        `Error fetching comments for material ${id}:`,
        commentsError
      );
    }

    return {
      data: {
        ...data,
        target_audiences: audiences.map((a) => a.target_audience),
        likes_count: likesCount || 0,
        comments: comments || [],
        comments_count: comments?.length || 0,
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
  photoUrl,
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

    // Sanitize IDs
    const sanitizedMainTopicId = mainTopicId || null;

    // Insert material record first
    const { data: material, error: materialError } = await supabase
      .from("materials")
      .insert({
        title,
        description,
        main_topic_id: sanitizedMainTopicId,
        sub_topic_id: null,
        estimated_time: estimatedTime,
        url: fileUrl,
        photo_url: photoUrl, // Initially use provided photo or null
        creator_id: session.user.id,
        is_approved: false,
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
          is_main_topic: true,
          parent_topic_id: null,
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

    // If no photo provided and file is PDF, generate preview
    if (!photoUrl && fileUrl && fileUrl.toLowerCase().endsWith(".pdf")) {
      try {
        // Call our preview generation API
        const response = await fetch("/api/content/preview", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            materialId: material.id,
            fileUrl: fileUrl,
          }),
        });

        if (!response.ok) {
          console.warn("Failed to generate preview, continuing without it");
        }
      } catch (previewError) {
        console.warn("Error generating preview:", previewError);
        // Continue without preview - not a critical error
      }
    }

    // Revalidate content pages
    revalidatePath("/dashboard/content");
    revalidatePath("/dashboard/explore");

    return { data: material };
  } catch (error) {
    console.error("Exception in uploadMaterial:", error);
    return { error: "שגיאה ביצירת חומר לימוד" };
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
    console.log("insert like with user.id", user.id);
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

    // Check if the user already liked this material
    const { data, error } = await supabase
      .from("likes")
      .select()
      .eq("material_id", materialId)
      .eq("user_id", user.id)
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

export async function getMaterialsForApproval() {
  try {
    console.log("Fetching materials for approval");
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
      return { error: "אין לך הרשאות לצפות בתכנים הממתינים לאישור" };
    }

    // Modified query to use LEFT JOIN instead of INNER JOIN
    const { data, error } = await supabase
      .from("materials")
      .select(
        `
        *,
        creator:users!materials_creator_id_fkey (
          full_name,
          email
        ),
        pending_topic:pending_topics (
          id,
          name,
          is_main_topic,
          parent_topic_id,
          status
        ),
        main_topic:main_topics (
          id,
          name
        )
      `
      )
      .eq("is_approved", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching materials:", error);
      return { error: "שגיאה בטעינת החומרים" };
    }

    console.log("Found unapproved materials:", data?.length || 0);
    return { data };
  } catch (error) {
    console.error("Exception in getMaterialsForApproval:", error);
    return { error: "שגיאה בטעינת החומרים" };
  }
}

export async function approveMaterialContent(materialId) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("materials")
      .update({ is_approved: true })
      .eq("id", materialId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error("Error approving material:", error);
    return {
      error: error.message,
    };
  }
}

export async function rejectMaterialContent(materialId, rejectionReason) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("materials")
      .update({
        is_approved: false,
        rejection_reason: rejectionReason,
      })
      .eq("id", materialId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error("Error rejecting material:", error);
    return {
      error: error.message,
    };
  }
}

// Function to download a material file
export async function downloadMaterial(materialId) {
  try {
    console.log(`Downloading material: ${materialId}`);
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
      return { error: "שגיאה בבדיקת משתמש" };
    }

    // Get the material details including the file URL
    const { data: material, error: materialError } = await supabase
      .from("materials")
      .select("id, title, url")
      .eq("id", materialId)
      .eq("is_approved", true)
      .single();

    if (materialError) {
      console.error("Error fetching material:", materialError);
      return { error: "שגיאה בטעינת פרטי החומר" };
    }

    if (!material.url) {
      return { error: "לא נמצא קובץ להורדה" };
    }

    // Extract the file path from the URL
    // Assuming the URL format is like the public URLs we saw in the code
    let filePath = material.url;

    // If it's a full URL, extract just the path part
    if (filePath.includes("/storage/v1/object/public/content/")) {
      filePath = filePath.split("/storage/v1/object/public/content/")[1];
    } else if (filePath.includes("/content/")) {
      filePath = filePath.split("/content/")[1];
    }

    // Download the file from Supabase storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("content")
      .download(filePath);

    if (downloadError) {
      console.error("Error downloading file:", downloadError);
      return { error: "שגיאה בהורדת הקובץ" };
    }

    // Convert blob to base64 for transfer
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // Get file extension for proper filename
    const fileExtension = filePath.split(".").pop();
    const fileName = `${material.title}.${fileExtension}`;

    return {
      data: {
        file: base64,
        fileName: fileName,
        mimeType: fileData.type,
      },
    };
  } catch (error) {
    console.error("Unexpected error in downloadMaterial:", error);
    return { error: "שגיאה בלתי צפויה בהורדת הקובץ" };
  }
}
