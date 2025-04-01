/** @format */

import { NextResponse } from "next/server";
import { processPdfAndCreateThumbnail } from "@/utils/pdf-helpers";

export async function GET() {
  try {
    // שימוש בקובץ PDF לדוגמה מהאינטרנט
    const testPdfUrl =
      "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
    const uniqueFileName = `test_${Date.now()}`;

    // הפעלת פונקציית עיבוד ה-PDF
    const thumbnailUrl = await processPdfAndCreateThumbnail(
      testPdfUrl,
      uniqueFileName
    );

    return NextResponse.json({
      success: true,
      message: "PDF thumbnail created successfully",
      thumbnailUrl,
    });
  } catch (error) {
    console.error("Error in test-pdf route:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
