/** @format */

"use client";
import Image from "next/image";
import { Clock, ThumbsUp, MessageCircle, FileIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export function ContentCard({ material, onClick, isFocused = false }) {
  const [isHovering, setIsHovering] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Reset hover state when focus changes to prevent stuck states
  useEffect(() => {
    if (!isFocused) {
      setIsHovering(false);
    }
  }, [isFocused]);

  // קיצור התיאור אם הוא ארוך מדי
  const truncatedDescription =
    material.description?.length > 100
      ? `${material.description.substring(0, 100)}...`
      : material.description;

  // בחירת אייקון בהתאם לסוג הקובץ
  const getFileIcon = (url) => {
    if (!url) return null;

    if (url.toLowerCase().endsWith(".pdf")) {
      return <FileIcon className="h-6 w-6 text-red-500" />;
    } else if (url.toLowerCase().match(/\.(docx?|rtf)$/)) {
      return <FileIcon className="h-6 w-6 text-blue-500" />;
    } else if (url.toLowerCase().match(/\.(pptx?|pps)$/)) {
      return <FileIcon className="h-6 w-6 text-orange-500" />;
    } else {
      return <FileIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  // בדיקה האם יש תמונת תצוגה מקדימה
  const hasPreviewImage = material.photo_url && !imageError;

  return (
    <motion.div
      className={`relative w-full h-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer transition-shadow ${
        isFocused ? "shadow-xl" : "shadow-md"
      }`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={onClick}
      whileHover={{ scale: isFocused ? 1.03 : 1.02, zIndex: 20 }}
      transition={{ duration: 0.2 }}>
      <div className="h-1/2 relative bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center">
        {/* תמונת קדימה מותאמת אישית או אייקון ברירת מחדל */}
        {hasPreviewImage ? (
          <div className="absolute inset-0">
            <Image
              src={material.photo_url}
              alt={material.title}
              fill
              sizes="(max-width: 640px) 100vw, 300px"
              className="object-cover"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-black bg-opacity-10"></div>
            <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/60 to-transparent p-3">
              <h3 className="text-lg font-semibold text-white line-clamp-2">
                {material.title}
              </h3>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center">
            <div className="flex justify-center mb-2">
              {getFileIcon(material.url)}
            </div>
            <h3
              className={`text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 ${
                isFocused ? "text-lg" : "text-base"
              }`}>
              {material.title}
            </h3>
          </div>
        )}
      </div>

      <div className="p-4 h-1/2 flex flex-col justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {truncatedDescription}
          </p>
          <div className="mt-2 text-sm text-gray-500">
            {material.main_topic?.name}
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center text-blue-600 dark:text-blue-400">
            <ThumbsUp size={16} />
            <span className="mr-2 text-sm">{material.likes_count || 0}</span>
          </div>
          <div className="flex items-center text-gray-500 dark:text-gray-400">
            <Clock size={16} />
            <span className="mr-2 text-sm">{material.estimated_time} דקות</span>
          </div>
        </div>
      </div>

      {/* Hover Overlay - only show on focused or hovered items */}
      {(isHovering || (isFocused && isHovering)) && (
        <motion.div
          className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}>
          <div className="text-white text-center p-4">
            <h4 className="text-lg font-bold mb-2">{material.title}</h4>
            <p className="text-sm mb-4 line-clamp-3">{truncatedDescription}</p>
            <div className="flex justify-center space-x-4">
              <div className="flex flex-col items-center">
                <ThumbsUp size={20} />
                <span className="text-xs mt-1">
                  {material.likes_count || 0}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <MessageCircle size={20} />
                <span className="text-xs mt-1">
                  {material.comments_count || 0}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <Clock size={20} />
                <span className="text-xs mt-1">
                  {material.estimated_time} דקות
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
