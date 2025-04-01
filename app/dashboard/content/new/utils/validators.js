/** @format */

// Allowed file types
export const ALLOWED_FILE_TYPES = [
  "application/pdf", // PDF
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
  "application/msword", // DOC
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // PPTX
  "application/vnd.ms-powerpoint", // PPT
];

// Allowed image types
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg", // JPG/JPEG
  "image/png", // PNG
  "image/gif", // GIF
  "image/webp", // WebP
];

// Max file size in MB
export const MAX_FILE_SIZE_MB = 50;

// Max image size in MB
export const MAX_IMAGE_SIZE_MB = 2;

/**
 * Validates the content form data
 * @param {Object} formData - The form data to validate
 * @param {File} file - The file to upload
 * @param {Array} selectedTargetAudiences - The selected target audiences
 * @param {boolean} isNewMainTopic - Whether a new main topic is being created
 * @param {string} newTopicName - The name of the new topic
 * @param {File} imageFile - The optional image file to upload
 * @returns {Object} - An object with validation errors, if any
 */
export function validateForm(
  formData,
  file,
  selectedTargetAudiences,
  isNewMainTopic,
  newTopicName,
  imageFile
) {
  const errors = {};

  if (!formData.title?.trim()) {
    errors.title = "נא להזין כותרת";
  }

  if (!formData.description?.trim()) {
    errors.description = "נא להזין תיאור";
  }

  if (!isNewMainTopic && !formData.mainTopicId) {
    errors.mainTopicId = "נא לבחור נושא";
  }

  if (isNewMainTopic && !newTopicName.trim()) {
    errors.newTopicName = "נא להזין שם לנושא החדש";
  }

  if (!formData.estimatedTime || formData.estimatedTime < 1) {
    errors.estimatedTime = "נא להזין זמן משוער חוקי";
  }

  if (!file) {
    errors.file = "נא לבחור קובץ להעלאה";
  }

  if (selectedTargetAudiences.length === 0) {
    errors.targetAudiences = "נא לבחור לפחות קהל יעד אחד";
  }

  // וולידציה לתמונה אם הועלתה תמונה
  if (imageFile) {
    const imageError = validateImage(imageFile);
    if (imageError) {
      errors.image = imageError;
    }
  }

  return errors;
}

/**
 * Validates a file for upload
 * @param {File} file - The file to validate
 * @returns {Object} - An validation error message if invalid, or null if valid
 */
export function validateFile(file) {
  // Check file type
  if (file && !ALLOWED_FILE_TYPES.includes(file.type)) {
    return "קובץ לא נתמך. אנא העלה קובץ מסוג PDF, Word או PowerPoint";
  }

  // Check file size
  if (file && file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `גודל הקובץ חייב להיות קטן מ-${MAX_FILE_SIZE_MB}MB`;
  }

  return null;
}

/**
 * Validates an image file for upload
 * @param {File} file - The image file to validate
 * @returns {string|null} - An validation error message if invalid, or null if valid
 */
export function validateImage(file) {
  // Check file type
  if (file && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "סוג תמונה לא נתמך. אנא העלה קובץ מסוג JPG, PNG או GIF";
  }

  // Check file size
  if (file && file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    return `גודל התמונה חייב להיות קטן מ-${MAX_IMAGE_SIZE_MB}MB`;
  }

  return null;
}
