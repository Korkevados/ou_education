/** @format */

"use client";
import Image from "next/image";
import { Clock, ThumbsUp, MessageCircle, FileIcon } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export function ContentCard({ material, onClick }) {
  const [isHovering, setIsHovering] = useState(false);

  // קיצור התיאור אם הוא ארוך מדי
  const truncatedDescription =
    material.description?.length > 100
      ? `${material.description.substring(0, 100)}...`
      : material.description;

  // בחירת אייקון בהתאם לסוג הקובץ
  const getFileIcon = (url) => {
    if (!url) return null;

    if (url.toLowerCase().endsWith(".pdf")) {
      return <FileIcon className="h-5 w-5 text-red-500" />;
    } else if (url.toLowerCase().match(/\.(docx?|rtf)$/)) {
      return <FileIcon className="h-5 w-5 text-blue-500" />;
    } else if (url.toLowerCase().match(/\.(pptx?|pps)$/)) {
      return <FileIcon className="h-5 w-5 text-orange-500" />;
    } else {
      return <FileIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <motion.div
      className="relative w-64 h-96 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}>
      <div className="h-1/2 relative bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
        {/* אייקון או תמונה של התוכן */}
        <div className="p-6 text-center">
          {getFileIcon(material.url)}
          <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
            {material.title}
          </h3>
        </div>
      </div>

      <div className="p-4 h-1/2 flex flex-col justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
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

      {/* Hover Overlay */}
      {isHovering && (
        <motion.div
          className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}>
          <div className="text-white text-center p-4">
            <h4 className="text-lg font-bold mb-2">{material.title}</h4>
            <p className="text-sm mb-4">{truncatedDescription}</p>
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
