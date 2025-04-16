/** @format */
"use server";
import { NextResponse } from "next/server";
import createClient from "@/lib/supabase/supabase-server";
import axios from "axios";
import FormData from "form-data";

const CLOUDMERSIVE_API_KEY = process.env.Cloud_Mersive_Api;
const CLOUDMERSIVE_API_URL =
  "https://api.cloudmersive.com/convert/autodetect/to/jpg";

export async function POST(request) {
  console.log("=== Starting Document Preview Generation ===");
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      console.error("Missing or invalid file");
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    console.log("File received:", {
      type: file.type,
      name: file.name,
      size: file.size,
    });

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log("File converted to buffer, size:", buffer.length);

    const supabase = await createClient();
    const { data: session, error: sessionError } =
      await supabase.auth.getUser();

    if (sessionError || !session?.user) {
      console.error("Authentication error:", sessionError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Prepare form data for Cloudmersive
    const cloudFormData = new FormData();
    cloudFormData.append("inputFile", buffer, {
      filename: file.name,
      contentType: file.type,
    });

    console.log("Sending request to Cloudmersive");
    const convertResponse = await axios({
      method: "post",
      url: CLOUDMERSIVE_API_URL,
      headers: {
        Apikey: CLOUDMERSIVE_API_KEY,
        quality: "75",
        ...cloudFormData.getHeaders(),
      },
      data: cloudFormData,
      responseType: "arraybuffer",
      maxBodyLength: Infinity,
      timeout: 30000, // 30 seconds timeout
    });

    if (!convertResponse.data) {
      throw new Error("No data received from conversion");
    }
    console.log(
      "Received response from Cloudmersive, size:",
      convertResponse.data.length
    );

    const json = JSON.parse(Buffer.from(convertResponse.data).toString("utf8"));

    if (!json.Successful || !json.JpgResultPages?.length) {
      throw new Error("Cloudmersive response missing image data");
    }
    // console.log(json);
    // Extract base64 image data
    const base64Image = json.JpgResultPages[0].Content;
    console.log("base64 :", base64Image);
    // Convert to real image buffer
    const previewBuffer = Buffer.from(base64Image, "base64");

    console.log("previewBuffer :", previewBuffer);
    // Generate file name

    // Upload to Supabase storage
    const fileName = `${crypto.randomUUID()}.jpg`;
    console.log("Uploading to storage:", fileName);
    console.log(convertResponse);
    const { error: uploadError } = await supabase.storage
      .from("photos-materials")
      .upload(fileName, previewBuffer, {
        contentType: "image/jpeg",
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("photos-materials").getPublicUrl(fileName);

    console.log("=== Preview Generation Completed Successfully ===");
    console.log("Generated preview URL:", publicUrl);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      originalFile: {
        name: file.name,
        type: file.type,
        size: file.size,
      },
    });
  } catch (error) {
    console.error("Error in preview generation:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers,
    });

    return NextResponse.json(
      {
        error: "Failed to generate preview",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
