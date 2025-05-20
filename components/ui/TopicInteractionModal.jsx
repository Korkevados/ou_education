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
import { Avatar, AvatarFallback } from "./avatar";
import { ThumbsUp, MessageCircle, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  toggleTopicLike,
  addTopicComment,
  getTopicComments,
  checkTopicUserLike,
  getTopicLikesCount,
} from "@/app/actions/topicInteractions";

export function TopicInteractionModal({ topic, isOpen, onClose }) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(true);

  // טעינת תגובות ומידע על לייקים בטעינת המודל
  useEffect(() => {
    if (topic?.id && isOpen) {
      loadComments();
      checkLikeStatus();
      countLikes();
    }
  }, [topic?.id, isOpen]);

  // טעינת תגובות
  const loadComments = async () => {
    try {
      setIsLoadingComments(true);
      const { data, error } = await getTopicComments(topic.id);

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
      const { data, error } = await checkTopicUserLike(topic.id);

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
      const { data, error } = await getTopicLikesCount(topic.id);

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
      const { data, error } = await toggleTopicLike(topic.id);

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

  // שליחת תגובה חדשה
  const handleSubmitComment = async () => {
    if (!comment.trim()) return;

    try {
      setIsSubmitting(true);
      const { data, error } = await addTopicComment(topic.id, comment);

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

  // פורמט תאריך לתצוגה
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("he-IL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!topic) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{topic.name}</DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center justify-between">
              <div className="flex items-center mr-4">
                <span className="text-sm text-gray-500">נושא ראשי</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-500 ml-1" />
                <span className="text-sm text-gray-500">
                  {formatDate(topic.created_at)}
                </span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* מידע על הנושא */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">תיאור</h3>
              <p className="text-gray-700 dark:text-gray-300">
                תכנים בנושא {topic.name}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">פעולות</h3>
              <Button
                variant="outline"
                onClick={() =>
                  (window.location.href = `/dashboard/content/explore?topic=${topic.id}`)
                }
                className="w-full mb-2">
                צפה בתכנים בנושא זה
              </Button>
            </div>
          </div>

          {/* אפשרויות ופעולות */}
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
              <div className="flex flex-col items-center mb-4">
                <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center">
                  <ThumbsUp className="h-8 w-8 text-sky-500" />
                </div>
              </div>

              <Button
                variant={isLiked ? "default" : "outline"}
                onClick={handleToggleLike}
                className="w-full flex items-center justify-center">
                <ThumbsUp
                  className={`mr-2 h-4 w-4 ${isLiked ? "fill-current" : ""}`}
                />
                {isLiked ? "ביטול לייק" : "לייק"} ({likesCount})
              </Button>
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
