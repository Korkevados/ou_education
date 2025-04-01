/** @format */
import createClient from "@/lib/supabase/supabase-server";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import { Canvas } from "canvas";
import fs from "fs-extra";
import path from "path";

// הגדרה מותאמת ל-worker של pdf.js
if (typeof window === "undefined") {
  // בצד השרת - הגדר worker src למיקום ספציפי או לערך ריק
  pdfjsLib.GlobalWorkerOptions.workerSrc = "";
} else {
  // בצד הלקוח
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

/**
 * הורדת קובץ ישירות מ-Supabase Storage
 * @param {string} bucket - שם הבאקט
 * @param {string} path - נתיב הקובץ בתוך הבאקט
 * @returns {Promise<ArrayBuffer>} - הקובץ כ-ArrayBuffer
 */
export async function downloadFileFromStorage(bucket, path) {
  try {
    console.log(
      `Downloading file directly from Supabase: bucket=${bucket}, path=${path}`
    );
    const supabase = await createClient();

    // הורדת הקובץ ישירות מאחסון Supabase
    const { data, error } = await supabase.storage.from(bucket).download(path);

    if (error) {
      console.error("Error downloading file from Supabase:", error);
      throw error;
    }

    if (!data) {
      throw new Error("No data received from Supabase");
    }

    // המרת ה-Blob ל-ArrayBuffer
    return await data.arrayBuffer();
  } catch (error) {
    console.error("Error in downloadFileFromStorage:", error);
    throw error;
  }
}

/**
 * חילוץ תמונה ממוגרת מהעמוד הראשון של קובץ PDF
 * @param {ArrayBuffer} pdfBuffer - הקובץ במצב בינארי
 * @param {Object} options - אפשרויות נוספות
 * @param {number} options.width - רוחב התמונה הממוגרת (פיקסלים)
 * @param {number} options.quality - איכות התמונה (1-100)
 * @returns {Promise<Buffer>} - התמונה הממוגרת כבאפר
 */
export async function extractPdfThumbnail(pdfBuffer, options = {}) {
  try {
    const { width = 400, quality = 80 } = options;
    console.log("Starting PDF to image conversion with pdf.js");

    // טעינת ה-PDF באמצעות pdf.js, עם טיפול באופציה disableWorker בצד השרת
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      disableWorker: typeof window === "undefined", // מבטל את ה-worker בצד השרת
    });

    const pdf = await loadingTask.promise;
    console.log("PDF loaded successfully, pages:", pdf.numPages);

    // קבלת העמוד הראשון
    const page = await pdf.getPage(1);
    console.log("First page loaded successfully");

    // בחירת גודל המסמך
    const viewport = page.getViewport({ scale: 1.0 });
    const scale = width / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    // יצירת canvas
    const canvas = new Canvas(scaledViewport.width, scaledViewport.height);
    const context = canvas.getContext("2d");

    // רקע לבן
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // רינדור ה-PDF לתוך ה-canvas
    try {
      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport,
      };

      await page.render(renderContext).promise;
      console.log("Page rendered to canvas successfully");

      // המרת ה-canvas לבאפר של תמונה
      const imageBuffer = canvas.toBuffer("image/jpeg", {
        quality: quality / 100,
      });

      // עיבוד התמונה באמצעות sharp לוודא שהיא בפורמט הנכון ובגודל המתאים
      const processedImage = await sharp(imageBuffer)
        .resize(width) // וידוא שהתמונה ברוחב הרצוי
        .jpeg({ quality })
        .toBuffer();

      console.log("Successfully converted PDF to image using pdf.js");
      return processedImage;
    } catch (renderError) {
      console.error("Error rendering PDF page:", renderError);
      throw renderError;
    }
  } catch (error) {
    console.error("Error converting PDF with pdf.js:", error);

    // במקרה של שגיאה, נחזיר תמונה אפורה פשוטה כגיבוי
    const { width = 400, quality = 80 } = options;
    console.log("Falling back to placeholder image");

    const image = await sharp({
      create: {
        width: width,
        height: Math.floor(width * 1.414), // יחס גובה-רוחב של A4
        channels: 4,
        background: { r: 245, g: 245, b: 245, alpha: 1 },
      },
    })
      .jpeg({ quality })
      .toBuffer();

    return image;
  }
}

/**
 * העלאת תמונה ממוגרת לאחסון בענן
 * @param {Buffer} imageBuffer - התמונה כבאפר
 * @param {string} fileName - שם הקובץ שיישמר
 * @returns {Promise<string>} - ה-URL של התמונה שנשמרה
 */
export async function uploadThumbnail(imageBuffer, fileName) {
  try {
    const supabase = await createClient();

    // העלאת התמונה ל-storage
    const { data, error } = await supabase.storage
      .from("photos-materials") // שימוש בבאקט החדש שנוצר
      .upload(`${fileName}.jpg`, imageBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) {
      console.error("Error uploading thumbnail:", error);
      throw error;
    }

    // קבלת URL ציבורי
    const { data: publicUrlData } = supabase.storage
      .from("photos-materials") // שימוש בבאקט החדש שנוצר
      .getPublicUrl(`${fileName}.jpg`);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error in uploadThumbnail:", error);
    throw error;
  }
}

/**
 * עיבוד קובץ PDF - הפקת תמונה ממוגרת ושמירתה באחסון
 * @param {string} fileUrl - ה-URL של קובץ ה-PDF
 * @param {string} fileName - שם הקובץ לשמירה (מזהה ייחודי)
 * @param {Object} options - אפשרויות נוספות
 * @param {string} options.bucket - הבאקט ממנו להוריד את הקובץ (אופציונלי)
 * @param {string} options.path - הנתיב לקובץ בתוך הבאקט (אופציונלי)
 * @returns {Promise<string>} - ה-URL של התמונה הממוגרת
 */
export async function processPdfAndCreateThumbnail(
  fileUrl,
  fileName,
  options = {}
) {
  try {
    console.log("Starting processPdfAndCreateThumbnail with:", {
      fileUrl,
      fileName,
      options,
    });

    const { bucket, path } = options;
    let pdfBuffer;

    // ניסיון להורדת הקובץ מה-URL
    try {
      console.log("Attempting to fetch PDF from URL:", fileUrl);

      const response = await fetch(fileUrl, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
          "Cache-Control": "no-cache",
        },
      });

      console.log("Fetch response status:", response.status);

      if (!response.ok) {
        console.error(
          "Fetch response not OK:",
          response.status,
          response.statusText
        );
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }

      // המרה ל-ArrayBuffer
      pdfBuffer = await response.arrayBuffer();
      console.log("Successfully fetched PDF buffer from URL");
    } catch (fetchError) {
      // אם הבקשה נכשלה ויש פרטי באקט ונתיב, ננסה להוריד ישירות מ-Supabase
      console.log("Fetch attempt failed:", fetchError.message);
      console.log("Trying direct Supabase download with:", { bucket, path });

      if (bucket && path) {
        console.log("Using provided bucket and path");
        pdfBuffer = await downloadFileFromStorage(bucket, path);
      } else {
        // אם אין פרטי באקט ונתיב, ננסה לחלץ אותם מה-URL
        console.log("Attempting to extract bucket and path from URL");
        const match = fileUrl.match(
          /\/storage\/v1\/object\/public\/([^\/]+)\/(.+)/
        );
        if (match) {
          const extractedBucket = match[1];
          const extractedPath = match[2];
          console.log("Extracted storage details:", {
            bucket: extractedBucket,
            path: extractedPath,
          });
          pdfBuffer = await downloadFileFromStorage(
            extractedBucket,
            extractedPath
          );
        } else {
          console.error("Could not extract bucket and path from URL");
          throw fetchError;
        }
      }
    }

    // בדיקה שיש תוכן בקובץ
    if (!pdfBuffer || pdfBuffer.byteLength === 0) {
      console.error("PDF buffer is empty");
      throw new Error("Retrieved PDF buffer is empty");
    }

    console.log("PDF buffer obtained successfully:", {
      size: pdfBuffer.byteLength,
      type: typeof pdfBuffer,
    });

    // חילוץ תמונה ממוגרת
    console.log("Starting thumbnail extraction");
    const thumbnailBuffer = await extractPdfThumbnail(pdfBuffer);
    console.log("Thumbnail extracted successfully");

    // העלאת התמונה הממוגרת לאחסון
    console.log("Starting thumbnail upload");
    const thumbnailUrl = await uploadThumbnail(thumbnailBuffer, fileName);
    console.log("Thumbnail uploaded successfully:", thumbnailUrl);

    return thumbnailUrl;
  } catch (error) {
    console.error("Error in processPdfAndCreateThumbnail:", {
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}
