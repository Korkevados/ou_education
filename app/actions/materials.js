/** @format */

"use server";

import createClient from "@/lib/supabase/supabase-server";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { getUserDetails } from "./auth";

// Function to get all materials
export async function getMaterials() {
  try {
    console.log("Fetching all materials");
    const supabase = createClient();

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

    return { data };
  } catch (error) {
    console.error("Exception in getMaterials:", error);
    return { error: "שגיאה בטעינת חומרים" };
  }
}

// Function to get a single material by ID
export async function getMaterialById(id) {
  try {
    console.log(`Fetching material with ID: ${id}`);
    const supabase = createClient();

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

    return { data };
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
  subTopicId,
  estimatedTime,
  file,
}) {
  try {
    console.log("Uploading new material");
    const supabase = createClient();

    // Check session
    const { data: session, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError || !session?.session) {
      console.error("Session error:", sessionError);
      return { error: "אין הרשאה. נא להתחבר מחדש." };
    }

    // Get current user details
    const { data: userData, error: userError } = await getUserDetails();
    if (userError || !userData) {
      console.error("User error:", userError);
      return { error: "שגיאה בקבלת פרטי משתמש" };
    }

    // Validate data
    if (
      !title ||
      !description ||
      !mainTopicId ||
      !subTopicId ||
      !estimatedTime ||
      !file
    ) {
      return { error: "כל השדות הנדרשים חייבים להיות מלאים" };
    }

    // Check if content bucket exists, create if it doesn't
    const { data: buckets } = await supabase.storage.listBuckets();
    const contentBucket = buckets?.find((bucket) => bucket.name === "content");
    if (!contentBucket) {
      console.log("Creating new 'content' bucket");
      const { error: bucketError } = await supabase.storage.createBucket(
        "content",
        {
          public: true,
          fileSizeLimit: 10485760, // 10MB limit
          allowedMimeTypes: [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/vnd.ms-powerpoint",
          ],
        }
      );

      if (bucketError) {
        console.error("Error creating bucket:", bucketError);
        return { error: "שגיאה ביצירת מאגר אחסון" };
      }
    }

    // Get the file data from the form data
    const fileArrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(fileArrayBuffer);

    // Generate a unique file name
    const fileExtension = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `materials/${fileName}`;

    // Upload file to Supabase Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from("content")
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: "3600",
      });

    if (storageError) {
      console.error("Error uploading file to storage:", storageError);
      return { error: "שגיאה בהעלאת הקובץ" };
    }

    // Get public URL for the file
    const { data: urlData } = await supabase.storage
      .from("content")
      .getPublicUrl(filePath);

    const fileUrl = urlData.publicUrl;

    // Create record in materials table
    const { data: materialData, error: materialError } = await supabase
      .from("materials")
      .insert([
        {
          title,
          description,
          url: fileUrl,
          main_topic_id: mainTopicId,
          sub_topic_id: subTopicId,
          creator_id: userData.id,
          estimated_time: estimatedTime,
        },
      ])
      .select()
      .single();

    if (materialError) {
      console.error("Error inserting material record:", materialError);

      // Try to clean up the uploaded file if the database insert failed
      await supabase.storage.from("content").remove([filePath]);

      return { error: "שגיאה בשמירת פרטי החומר" };
    }

    revalidatePath("/dashboard/content");
    return { data: materialData };
  } catch (error) {
    console.error("Exception in uploadMaterial:", error);
    return { error: "שגיאה בהעלאת החומר" };
  }
}

// Function to delete a material
export async function deleteMaterial(id) {
  try {
    console.log(`Deleting material with ID: ${id}`);
    const supabase = createClient();

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
