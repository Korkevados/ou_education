/** @format */
"use server";

import createClient from "@/lib/supabase/supabase-server";

// Get folder structure
export async function getFolders() {
  try {
    // TODO: Implement with Supabase
    // const supabase = await createClient();
    // const { data, error } = await supabase
    //   .from('folders')
    //   .select('*')
    //   .order('created_at');
    // if (error) throw error;
    // return { data };
  } catch (error) {
    console.error("Error fetching folders:", error);
    return { error: "Failed to fetch folders" };
  }
}

// Create new folder
export async function createFolder({ name, parentId }) {
  try {
    // TODO: Implement with Supabase
    // const supabase = await createClient();
    // const { data, error } = await supabase
    //   .from('folders')
    //   .insert([{ name, parent_id: parentId }])
    //   .select()
    //   .single();
    // if (error) throw error;
    // return { data };
  } catch (error) {
    console.error("Error creating folder:", error);
    return { error: "Failed to create folder" };
  }
}

// Rename folder
export async function renameFolder(folderId, newName) {
  try {
    // TODO: Implement with Supabase
    // const supabase = await createClient();
    // const { data, error } = await supabase
    //   .from('folders')
    //   .update({ name: newName })
    //   .eq('id', folderId)
    //   .select()
    //   .single();
    // if (error) throw error;
    // return { data };
  } catch (error) {
    console.error("Error renaming folder:", error);
    return { error: "Failed to rename folder" };
  }
}

// Delete folder
export async function deleteFolder(folderId) {
  try {
    // TODO: Implement with Supabase
    // const supabase = await createClient();
    // const { error } = await supabase
    //   .from('folders')
    //   .delete()
    //   .eq('id', folderId);
    // if (error) throw error;
    // return { success: true };
  } catch (error) {
    console.error("Error deleting folder:", error);
    return { error: "Failed to delete folder" };
  }
}

// Upload file
export async function uploadFile(folderId, file) {
  try {
    // TODO: Implement with Supabase Storage
    // const supabase = await createClient();
    // const { data, error } = await supabase
    //   .storage
    //   .from('content')
    //   .upload(`${folderId}/${file.name}`, file);
    // if (error) throw error;
    // return { data };
  } catch (error) {
    console.error("Error uploading file:", error);
    return { error: "Failed to upload file" };
  }
}

// Get files in folder
export async function getFiles(folderId) {
  try {
    // TODO: Implement with Supabase
    // const supabase = await createClient();
    // const { data, error } = await supabase
    //   .from('files')
    //   .select('*')
    //   .eq('folder_id', folderId)
    //   .order('created_at');
    // if (error) throw error;
    // return { data };
  } catch (error) {
    console.error("Error fetching files:", error);
    return { error: "Failed to fetch files" };
  }
}
