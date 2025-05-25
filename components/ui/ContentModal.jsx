/** @format */

"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./dialog";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import {
  ThumbsUp,
  Download,
  MessageCircle,
  Clock,
  Calendar,
  Users,
  FileIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  toggleLike,
  addComment,
  getComments,
  checkUserLike,
  getLikesCount,
  downloadMaterial,
} from "@/app/actions/materials";

export function ContentModal({ material, isOpen, onClose }) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(true);

  // טעינת תגובות ומידע על לייקים בטעינת המודל
  useEffect(() => {
    if (material?.id && isOpen) {
      loadComments();
      checkLikeStatus();
      countLikes();
    }
  }, [material?.id, isOpen]);

  // טעינת תגובות
  const loadComments = async () => {
    try {
      setIsLoadingComments(true);

      // If comments are already loaded with the material, use them
      if (material.comments && Array.isArray(material.comments)) {
        setComments(material.comments);
        setIsLoadingComments(false);
        return;
      }

      // Otherwise fetch from server
      const { data, error } = await getComments(material.id);

      if (error) {
        toast.error(error);
        return;
      }

      setComments(data || []);
    } catch (error) {
      console.error("Error loading comments:", error);
      toast.error("שגיאה בטעינת תגובות");
    } finally {
      setIsLoadingComments(false);
    }
  };

  // בדיקה אם המשתמש לחץ לייק
  const checkLikeStatus = async () => {
    try {
      const { data, error } = await checkUserLike(material.id);

      if (error) {
        toast.error(error);
        return;
      }

      setIsLiked(data.hasLiked);
    } catch (error) {
      console.error("Error checking like status:", error);
      toast.error("שגיאה בבדיקת מצב לייק");
    }
  };

  // ספירת לייקים
  const countLikes = async () => {
    try {
      const { data, error } = await getLikesCount(material.id);

      if (error) {
        toast.error(error);
        return;
      }

      setLikesCount(data.count);
    } catch (error) {
      console.error("Error counting likes:", error);
      toast.error("שגיאה בספירת לייקים");
    }
  };

  // טיפול בלחיצה על כפתור הלייק
  const handleToggleLike = async () => {
    try {
      const { data, error } = await toggleLike(material.id);

      if (error) {
        toast.error(error);
        return;
      }

      // עדכון מצב הלייק
      setIsLiked(data.action === "liked");
      setLikesCount((prev) => (data.action === "liked" ? prev + 1 : prev - 1));
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("שגיאה בשינוי מצב לייק");
    }
  };

  const handleDownload = async () => {
    try {
      const { data, error } = await downloadMaterial(material.id);

      if (error) {
        toast.error(error);
        return;
      }

      // Convert base64 back to blob and trigger download
      const byteCharacters = atob(data.file);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: data.mimeType });

      // Create download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("הקובץ הורד בהצלחה");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("שגיאה בהורדת הקובץ");
    }
  };

  // שליחת תגובה חדשה
  const handleSubmitComment = async () => {
    if (!comment.trim()) return;

    try {
      setIsSubmitting(true);
      const { data, error } = await addComment(material.id, comment);

      if (error) {
        toast.error(error);
        return;
      }

      // הוספת התגובה החדשה
      setComments([data, ...comments]);
      setComment("");
      toast.success("התגובה נוספה בהצלחה");
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast.error("שגיאה בשליחת תגובה");
    } finally {
      setIsSubmitting(false);
    }
  };

  // פורמט של תאריך לעברית
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("he-IL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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

  // זיהוי קובץ לפי שם
  const getFileType = (url) => {
    if (!url) return "קובץ";

    if (url.toLowerCase().endsWith(".pdf")) {
      return "מסמך PDF";
    } else if (url.toLowerCase().match(/\.(docx?)$/)) {
      return "מסמך Word";
    } else if (url.toLowerCase().match(/\.(pptx?)$/)) {
      return "מצגת PowerPoint";
    } else if (url.toLowerCase().match(/\.(xlsx?)$/)) {
      return "גיליון Excel";
    } else {
      return "קובץ";
    }
  };

  // Initialize likes count from material if available
  useEffect(() => {
    if (material?.likes_count !== undefined) {
      setLikesCount(material.likes_count);
    }
  }, [material?.likes_count]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{material.title}</DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-500 ml-1" />
                  <span className="text-sm text-gray-500 mr-4 font-bold">
                    {formatDate(material.created_at)}
                  </span>
                </div>
                {material.creator && (
                  <div className="flex items-center mr-4">
                    <span className="text-sm text-gray-500 mr-4 font-bold">
                      נוצר על ידי : {material.creator.full_name}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 font-bold">
                    זמן משוער לפעילות : {material.estimated_time} דקות
                  </span>
                  <Clock className="h-4 w-4 text-gray-500 mr-1" />
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* מידע על החומר */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">תיאור</h3>
              <p className="text-gray-700 dark:text-gray-300">
                {material.description}
              </p>
            </div>

            {material.main_topic && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">נושא</h3>
                <div className="flex items-center">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {material.main_topic.name}
                  </span>
                </div>
              </div>
            )}

            {material.target_audiences &&
              material.target_audiences.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">קהלי יעד</h3>
                  <div className="flex flex-wrap gap-2">
                    {material.target_audiences.map((audience) => (
                      <span
                        key={audience.id || audience.target_audience?.id}
                        className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        {audience.grade || audience.target_audience?.grade}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>

          {/* אפשרויות ופעולות */}
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
              <div className="flex flex-col items-center mb-4">
                {getFileIcon(material.url)}
                <span className="text-sm text-gray-500 mt-2">
                  {getFileType(material.url)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={handleDownload}
                  className="flex items-center justify-center  hover:bg-blue-200 hover:rounded-lg">
                  <Download className="ml-2 h-4 w-4" />
                  הורדה
                </Button>
                <Button
                  variant={isLiked ? "default" : "outline"}
                  onClick={handleToggleLike}
                  className="flex items-center justify-center">
                  <ThumbsUp
                    className={`ml-2 h-4 w-4 ${isLiked ? "fill-current" : ""}`}
                  />
                  {likesCount}
                </Button>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">הוסף תגובה</h3>
              <Textarea
                placeholder="כתוב תגובה..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mb-2 resize-none"
                rows={3}
              />
              <Button
                onClick={handleSubmitComment}
                disabled={!comment.trim() || isSubmitting}
                className="w-full">
                {isSubmitting ? "שולח..." : "שליחה"}
              </Button>
            </div>
          </div>
        </div>

        {/* תגובות */}
        <div className="mt-8">
          <h3 className="font-semibold mb-4 flex items-center">
            <MessageCircle className="mr-2 h-4 w-4" />
            תגובות ({comments.length})
          </h3>

          {isLoadingComments ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-gray-500">טוען תגובות...</p>
            </div>
          ) : (
            <AnimatePresence>
              {comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-start">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {comment.user?.full_name.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="mr-3 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">
                              {comment.user?.full_name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  אין תגובות עדיין. היה הראשון להגיב!
                </div>
              )}
            </AnimatePresence>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            סגירה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
