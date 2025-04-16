/** @format */

import CloudmersiveConvertApiClient from "cloudmersive-convert-api-client";

const defaultClient = CloudmersiveConvertApiClient.ApiClient.instance;
const Apikey = defaultClient.authentications["Apikey"];
Apikey.apiKey = process.env.Cloud_Mersive_Api;

/**
 * Generates a preview image from a document using Cloudmersive API
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} fileType - The MIME type of the file
 * @returns {Promise<Buffer>} - The preview image as a buffer
 */
export async function generatePreview(fileBuffer, fileType) {
  try {
    let apiInstance;
    let apiMethod;
    let requestData = { inputFile: fileBuffer };

    // Select the appropriate API based on file type
    if (fileType === "application/pdf" || fileType.endsWith("pdf")) {
      apiInstance = new CloudmersiveConvertApiClient.ConvertDocumentApi();
      apiMethod = apiInstance.convertDocumentPdfToJpg.bind(apiInstance);
    } else if (
      fileType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileType.endsWith("docx")
    ) {
      apiInstance = new CloudmersiveConvertApiClient.ConvertDocumentApi();
      apiMethod = apiInstance.convertDocumentDocxToJpg.bind(apiInstance);
    } else if (
      fileType ===
        "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
      fileType.endsWith("pptx")
    ) {
      apiInstance = new CloudmersiveConvertApiClient.ConvertDocumentApi();
      apiMethod = apiInstance.convertDocumentPptxToJpg.bind(apiInstance);
    } else {
      throw new Error("Unsupported file type");
    }

    // Call the API
    const result = await apiMethod(requestData);

    // For PDF, the result is an array of pages, we want the first one
    if (Array.isArray(result)) {
      return result[0];
    }

    return result;
  } catch (error) {
    console.error("Error in generatePreview:", error);
    throw error;
  }
}
