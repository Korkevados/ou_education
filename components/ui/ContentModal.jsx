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
  Trash2,
  Edit,
  Eye,
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
  deleteMaterial,
  updateMaterial,
} from "@/app/actions/materials";
import getUserDetails from "@/app/actions/auth";
import { getMainTopics } from "@/app/actions/topics";
import { getTargetAudiences } from "@/app/actions/target-audiences";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Input } from "./input";
import { Label } from "./label";
import ReactSelect from "react-select";
import createSupaClient from "@/lib/supabase/supabase";

export function ContentModal({
  material,
  isOpen,
  onClose,
  onMaterialDeleted,
  onMaterialUpdated,
  isAdmin = false,
}) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mainTopics, setMainTopics] = useState([]);
  const [targetAudiences, setTargetAudiences] = useState([]);
  const [editForm, setEditForm] = useState({
    title: material?.title || "",
    description: material?.description || "",
    mainTopicId: material?.main_topic_id || "",
    estimatedTime: material?.estimated_time || 15,
    targetAudiences: [],
  });
  const [currentMaterial, setCurrentMaterial] = useState(material);

  // טעינת תגובות ומידע על לייקים בטעינת המודל
  useEffect(() => {
    if (currentMaterial?.id && isOpen) {
      loadComments();
      checkLikeStatus();
      countLikes();
      loadUserRole();
      loadEditData();
    }
  }, [currentMaterial?.id, isOpen]);

  // טעינת תפקיד המשתמש
  const loadUserRole = async () => {
    try {
      const userDetails = await getUserDetails();
      setUserRole(userDetails.role);
    } catch (error) {
      console.error("Error loading user role:", error);
    }
  };

  // טעינת נתונים לעריכה
  const loadEditData = async () => {
    try {
      // Load main topics
      const { data: topicsData } = await getMainTopics();
      setMainTopics(topicsData || []);

      // Load target audiences
      const { data: audiencesData } = await getTargetAudiences();
      setTargetAudiences(audiencesData || []);

      // Set current target audiences
      if (material?.target_audiences) {
        const currentAudienceIds = material.target_audiences.map(
          (audience) => audience.id || audience.target_audience?.id
        );
        setEditForm((prev) => ({
          ...prev,
          targetAudiences: currentAudienceIds,
        }));
      }
    } catch (error) {
      console.error("Error loading edit data:", error);
    }
  };

  // טעינת תגובות
  const loadComments = async () => {
    try {
      setIsLoadingComments(true);

      // If comments are already loaded with the material, use them
      if (currentMaterial.comments && Array.isArray(currentMaterial.comments)) {
        setComments(currentMaterial.comments);
        setIsLoadingComments(false);
        return;
      }

      // Otherwise fetch from server
      const { data, error } = await getComments(currentMaterial.id);

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
      const { data, error } = await checkUserLike(currentMaterial.id);

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
      const { data, error } = await getLikesCount(currentMaterial.id);

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
      const { data, error } = await toggleLike(currentMaterial.id);

      if (error) {
        toast.error(error);
        return;
      }

      // עדכון מצב הלייק
      setIsLiked(!isLiked);
      setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("שגיאה בלחיצה על לייק");
    }
  };

  // טיפול בהורדת הקובץ
  const handleDownload = async () => {
    try {
      const { data, error } = await downloadMaterial(currentMaterial.id);

      if (error) {
        toast.error(error);
        return;
      }

      // יצירת קובץ להורדה
      const blob = new Blob([Buffer.from(data.file, "base64")], {
        type: data.mimeType,
      });
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

  // טיפול בצפייה בתוכן
  const handleViewContent = async () => {
    try {
      // יצירת כתובת חתומה מהבאקט הפרטי
      const supabase = await createSupaClient();

      // חילוץ שם הקובץ מה-URL
      const urlParts = currentMaterial.url.split("/");
      const fileName = urlParts[urlParts.length - 1];

      // יצירת כתובת חתומה לתקופה של שעה (3600 שניות)
      const { data, error } = await supabase.storage
        .from("content")
        .createSignedUrl(fileName, 3600);

      if (error) {
        console.error("Error creating signed URL:", error);
        toast.error("שגיאה בפתיחת התוכן");
        return;
      }

      if (data) {
        // פתיחת התוכן בטאב חדש עם הכתובת החתומה
        window.open(data.signedUrl, "_blank");
      }
    } catch (error) {
      console.error("Error viewing content:", error);
      toast.error("שגיאה בפתיחת התוכן");
    }
  };

  // טיפול בשליחת תגובה
  const handleSubmitComment = async () => {
    if (!comment.trim()) return;

    try {
      setIsSubmitting(true);
      const { data, error } = await addComment(currentMaterial.id, comment);

      if (error) {
        toast.error(error);
        return;
      }

      // הוספת התגובה החדשה לרשימה
      setComments((prev) => [data, ...prev]);
      setComment("");
      toast.success("התגובה נשלחה בהצלחה");
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast.error("שגיאה בשליחת התגובה");
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

  // Handle material deletion
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const { error } = await deleteMaterial(currentMaterial.id);

      if (error) {
        toast.error(error);
        return;
      }

      toast.success("התוכן נמחק בהצלחה");
      setShowDeleteConfirm(false);
      onClose();

      // Notify parent component
      if (onMaterialDeleted) {
        onMaterialDeleted(currentMaterial.id);
      }
    } catch (error) {
      console.error("Error deleting material:", error);
      toast.error("שגיאה במחיקת התוכן");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle material editing
  const handleEdit = async () => {
    try {
      setIsSaving(true);
      const { data, error } = await updateMaterial(
        currentMaterial.id,
        editForm
      );

      if (error) {
        toast.error(error);
        return;
      }

      // Update the local material state with the new data
      const updatedMaterial = {
        ...currentMaterial,
        title: editForm.title,
        description: editForm.description,
        main_topic: mainTopics.find(
          (topic) => topic.id.toString() === editForm.mainTopicId
        ),
        main_topic_id: editForm.mainTopicId,
        estimated_time: editForm.estimatedTime,
        target_audiences: editForm.targetAudiences.map((id) => ({
          id: id,
          target_audience: targetAudiences.find(
            (audience) => audience.id === id
          ),
        })),
      };

      // Update the material prop locally
      Object.assign(currentMaterial, updatedMaterial);

      // Update current material state
      setCurrentMaterial(updatedMaterial);

      toast.success("התוכן עודכן בהצלחה");
      setIsEditing(false);

      // Notify parent component
      if (onMaterialUpdated) {
        onMaterialUpdated(currentMaterial.id, currentMaterial);
      }
    } catch (error) {
      console.error("Error updating material:", error);
      toast.error("שגיאה בעדכון התוכן");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle edit form changes
  const handleEditFormChange = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle target audiences change
  const handleTargetAudiencesChange = (selected) => {
    const selectedIds = selected ? selected.map((option) => option.value) : [];
    setEditForm((prev) => ({
      ...prev,
      targetAudiences: selectedIds,
    }));
  };

  // Update current material when material prop changes
  useEffect(() => {
    setCurrentMaterial(material);
    setEditForm({
      title: material?.title || "",
      description: material?.description || "",
      mainTopicId: material?.main_topic_id || "",
      estimatedTime: material?.estimated_time || 15,
      targetAudiences:
        material?.target_audiences?.map(
          (audience) => audience.id || audience.target_audience?.id
        ) || [],
    });
  }, [material]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {currentMaterial.title}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-500 ml-1" />
                  <span className="text-sm text-gray-500 mr-4 font-bold">
                    {formatDate(currentMaterial.created_at)}
                  </span>
                </div>
                {currentMaterial.creator && (
                  <div className="flex items-center mr-4">
                    <span className="text-sm text-gray-500 mr-4 font-bold">
                      נוצר על ידי : {currentMaterial.creator.full_name}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 font-bold">
                    זמן משוער לפעילות : {currentMaterial.estimated_time} דקות
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
                {currentMaterial.description}
              </p>
            </div>

            {currentMaterial.main_topic && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">נושא</h3>
                <div className="flex items-center">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {currentMaterial.main_topic.name}
                  </span>
                </div>
              </div>
            )}

            {currentMaterial.target_audiences &&
              currentMaterial.target_audiences.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">קהלי יעד</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentMaterial.target_audiences.map((audience) => (
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
                {getFileIcon(currentMaterial.url)}
                <span className="text-sm text-gray-500 mt-2">
                  {getFileType(currentMaterial.url)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Button
                  onClick={handleViewContent}
                  className="flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200">
                  <Eye className="ml-2 h-4 w-4" />
                  צפייה
                </Button>
                <Button
                  onClick={handleDownload}
                  className="flex items-center justify-center hover:bg-blue-200 hover:rounded-lg">
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

              {/* Admin buttons */}
              {isAdmin && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="flex items-center justify-center text-blue-600 hover:bg-blue-50">
                      <Edit className="ml-2 h-4 w-4" />
                      עריכה
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center justify-center text-red-600 hover:bg-red-50">
                      <Trash2 className="ml-2 h-4 w-4" />
                      מחיקה
                    </Button>
                  </div>
                </div>
              )}
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

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>אישור מחיקה</DialogTitle>
              <DialogDescription>
                האם אתה בטוח שברצונך למחוק את התוכן "{currentMaterial.title}"?
                פעולה זו תמחק גם את כל הלייקים, התגובות וקהלי היעד הקשורים אליו.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}>
                ביטול
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}>
                {isDeleting ? "מוחק..." : "מחק"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Form Dialog */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>עריכת תוכן</DialogTitle>
              <DialogDescription>
                ערוך את פרטי התוכן. לחץ על "שמור" כדי לשמור את השינויים.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">כותרת</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) =>
                    handleEditFormChange("title", e.target.value)
                  }
                  placeholder="כותרת התוכן"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">תיאור</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) =>
                    handleEditFormChange("description", e.target.value)
                  }
                  placeholder="תיאור מפורט של התוכן"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-topic">נושא</Label>
                <Select
                  value={editForm.mainTopicId}
                  onValueChange={(value) =>
                    handleEditFormChange("mainTopicId", value)
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר נושא" />
                  </SelectTrigger>
                  <SelectContent>
                    {mainTopics.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id.toString()}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-time">זמן משוער (בדקות)</Label>
                <Input
                  id="edit-time"
                  type="number"
                  min="1"
                  value={editForm.estimatedTime}
                  onChange={(e) =>
                    handleEditFormChange(
                      "estimatedTime",
                      parseInt(e.target.value)
                    )
                  }
                  placeholder="זמן משוער בדקות"
                />
              </div>

              <div className="space-y-2">
                <Label>קהלי יעד</Label>
                <ReactSelect
                  isMulti
                  isRtl
                  placeholder="בחר קהלי יעד..."
                  noOptionsMessage={() => "לא נמצאו קהלי יעד"}
                  options={targetAudiences.map((audience) => ({
                    value: audience.id,
                    label: `כיתות ${audience.grade}`,
                  }))}
                  value={editForm.targetAudiences.map((id) => ({
                    value: id,
                    label: `כיתות ${
                      targetAudiences.find((a) => a.id === id)?.grade
                    }`,
                  }))}
                  onChange={handleTargetAudiencesChange}
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "42px",
                    }),
                    menu: (base) => ({
                      ...base,
                      zIndex: 50,
                    }),
                  }}
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                ביטול
              </Button>
              <Button
                variant="outline"
                onClick={handleViewContent}
                className="hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200">
                <Eye className="ml-2 h-4 w-4" />
                צפייה בתוכן
              </Button>
              <Button onClick={handleEdit} disabled={isSaving}>
                {isSaving ? "שומר..." : "שמור"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
