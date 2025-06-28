/** @format */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  getMainTopics,
  getSubTopics,
  createMainTopic,
  createSubTopic,
  deleteMainTopic,
  deleteSubTopic,
  updateMainTopic,
  updateSubTopic,
} from "@/app/actions/topics";
import getUserDetails from "@/app/actions/auth";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TopicsPage() {
  const router = useRouter();
  const [mainTopics, setMainTopics] = useState([]);
  const [subTopics, setSubTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [topicType, setTopicType] = useState("main"); // "main" or "sub"
  const [formData, setFormData] = useState({
    name: "",
    mainTopicId: "",
  });

  useEffect(() => {
    const checkUserAndLoadData = async () => {
      try {
        setIsLoading(true);

        // Check user role
        const userDetails = await getUserDetails();
        if (
          !userDetails ||
          (userDetails.role !== "ADMIN" &&
            userDetails.role !== "TRAINING_MANAGER")
        ) {
          router.push("/dashboard");
          return;
        }
        setIsAdmin(true);

        // Load topics data
        const [mainTopicsResult, subTopicsResult] = await Promise.all([
          getMainTopics(),
          getSubTopics(),
        ]);

        if (mainTopicsResult.error) {
          toast.error(mainTopicsResult.error);
        } else {
          setMainTopics(mainTopicsResult.data || []);
        }

        if (subTopicsResult.error) {
          toast.error(subTopicsResult.error);
        } else {
          setSubTopics(subTopicsResult.data || []);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("שגיאה בטעינת נתונים");
      } finally {
        setIsLoading(false);
      }
    };

    checkUserAndLoadData();
  }, [router]);

  const handleAddTopic = async () => {
    if (!formData.name.trim()) {
      toast.error("יש להזין שם לנושא");
      return;
    }

    if (topicType === "sub" && !formData.mainTopicId) {
      toast.error("יש לבחור נושא ראשי");
      return;
    }

    try {
      setIsSubmitting(true);
      let result;

      if (topicType === "main") {
        result = await createMainTopic(formData.name);
      } else {
        result = await createSubTopic(formData.name, formData.mainTopicId);
      }

      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Update local state immediately
      if (topicType === "main") {
        setMainTopics((prev) => [...prev, result.data]);
      } else {
        // Find the main topic name for display
        const mainTopic = mainTopics.find(
          (t) => t.id.toString() === formData.mainTopicId
        );
        const newSubTopic = {
          ...result.data,
          main_topic: { name: mainTopic?.name || "לא מוגדר" },
        };
        setSubTopics((prev) => [...prev, newSubTopic]);
      }

      setShowAddDialog(false);
      setFormData({ name: "", mainTopicId: "" });
      setTopicType("main");
      toast.success("הנושא נוסף בהצלחה");
    } catch (error) {
      console.error("Error adding topic:", error);
      toast.error("שגיאה בהוספת הנושא");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTopic = async () => {
    if (!formData.name.trim()) {
      toast.error("יש להזין שם לנושא");
      return;
    }

    if (topicType === "sub" && !formData.mainTopicId) {
      toast.error("יש לבחור נושא ראשי");
      return;
    }

    try {
      setIsSubmitting(true);
      let result;

      if (topicType === "main") {
        result = await updateMainTopic(editingTopic.id, formData.name);
      } else {
        result = await updateSubTopic(
          editingTopic.id,
          formData.name,
          formData.mainTopicId
        );
      }

      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Update local state immediately
      if (topicType === "main") {
        setMainTopics((prev) =>
          prev.map((t) =>
            t.id === editingTopic.id
              ? {
                  ...t,
                  name: formData.name,
                  updated_at: new Date().toISOString(),
                }
              : t
          )
        );
      } else {
        // Find the main topic name for display
        const mainTopic = mainTopics.find(
          (t) => t.id.toString() === formData.mainTopicId
        );
        setSubTopics((prev) =>
          prev.map((t) =>
            t.id === editingTopic.id
              ? {
                  ...t,
                  name: formData.name,
                  main_topic_id: formData.mainTopicId,
                  main_topic: { name: mainTopic?.name || "לא מוגדר" },
                  updated_at: new Date().toISOString(),
                }
              : t
          )
        );
      }

      setShowAddDialog(false);
      setEditingTopic(null);
      setFormData({ name: "", mainTopicId: "" });
      setTopicType("main");
      toast.success("הנושא עודכן בהצלחה");
    } catch (error) {
      console.error("Error updating topic:", error);
      toast.error("שגיאה בעדכון הנושא");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTopic = async (topic, type) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את הנושא "${topic.name}"?`)) {
      return;
    }

    try {
      let result;
      if (type === "main") {
        result = await deleteMainTopic(topic.id);
      } else {
        result = await deleteSubTopic(topic.id);
      }

      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Update local state immediately
      if (type === "main") {
        setMainTopics((prev) => prev.filter((t) => t.id !== topic.id));
      } else {
        setSubTopics((prev) => prev.filter((t) => t.id !== topic.id));
      }

      toast.success("הנושא נמחק בהצלחה");
    } catch (error) {
      console.error("Error deleting topic:", error);
      toast.error("שגיאה במחיקת הנושא");
    }
  };

  const openEditDialog = (topic, type) => {
    setEditingTopic(topic);
    setTopicType(type);
    setFormData({
      name: topic.name,
      mainTopicId: type === "sub" ? topic.main_topic_id?.toString() || "" : "",
    });
    setShowAddDialog(true);
  };

  const openAddDialog = () => {
    setEditingTopic(null);
    setTopicType("main");
    setFormData({ name: "", mainTopicId: "" });
    setShowAddDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            אין הרשאה
          </h2>
          <p className="text-gray-600">אין לך הרשאות לגשת לדף זה</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">ניהול נושאים</h1>
        <Button
          onClick={openAddDialog}
          className="hover:bg-green-600 hover:scale-105 transition-all duration-200">
          <Plus className="mr-2 h-4 w-4" />
          הוסף נושא
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Topics */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>נושאים ראשיים</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם</TableHead>
                  <TableHead>תאריך יצירה</TableHead>
                  <TableHead className="text-left">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mainTopics.map((topic) => (
                  <TableRow
                    key={topic.id}
                    className="hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
                    <TableCell className="font-medium">{topic.name}</TableCell>
                    <TableCell>
                      {new Date(topic.created_at).toLocaleDateString("he-IL")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(topic, "main")}
                          className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors duration-200">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTopic(topic, "main")}
                          className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors duration-200">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Sub Topics */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>נושאים משניים</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם</TableHead>
                  <TableHead>נושא ראשי</TableHead>
                  <TableHead>תאריך יצירה</TableHead>
                  <TableHead className="text-left">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subTopics.map((topic) => (
                  <TableRow
                    key={topic.id}
                    className="hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
                    <TableCell className="font-medium">{topic.name}</TableCell>
                    <TableCell>
                      {topic.main_topic?.name || "לא מוגדר"}
                    </TableCell>
                    <TableCell>
                      {new Date(topic.created_at).toLocaleDateString("he-IL")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(topic, "sub")}
                          className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors duration-200">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTopic(topic, "sub")}
                          className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors duration-200">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTopic ? "ערוך נושא" : "הוסף נושא חדש"}
            </DialogTitle>
            <DialogDescription>
              {editingTopic ? "ערוך את פרטי הנושא" : "הוסף נושא חדש למערכת"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>סוג נושא</Label>
              <Select
                value={topicType}
                onValueChange={setTopicType}
                disabled={!!editingTopic}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">נושא ראשי</SelectItem>
                  <SelectItem value="sub">נושא משני</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic-name">שם הנושא</Label>
              <Input
                id="topic-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="הזן שם לנושא"
              />
            </div>

            {topicType === "sub" && (
              <div className="space-y-2">
                <Label>נושא ראשי</Label>
                <Select
                  value={formData.mainTopicId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, mainTopicId: value })
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר נושא ראשי" />
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
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              className="hover:bg-gray-100 hover:border-gray-400 transition-colors duration-200">
              ביטול
            </Button>
            <Button
              onClick={editingTopic ? handleEditTopic : handleAddTopic}
              disabled={isSubmitting}
              className="hover:bg-blue-600 hover:scale-105 transition-all duration-200">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  שומר...
                </>
              ) : editingTopic ? (
                "שמור שינויים"
              ) : (
                "הוסף נושא"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
