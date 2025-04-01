/** @format */

"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getMainTopics,
  getSubTopics,
  approvePendingTopic,
  rejectPendingTopic,
  reassignTopic,
} from "@/app/actions/topics";
import { useToast } from "@/components/ui/use-toast";

export function PendingTopicsTable({ topics, loading }) {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [mainTopics, setMainTopics] = useState([]);
  const [subTopics, setSubTopics] = useState([]);
  const [selectedNewTopicId, setSelectedNewTopicId] = useState("");
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState(-1);
  const { toast } = useToast();

  // אפקט לביטול הבחירה כאשר נטען מידע חדש
  useEffect(() => {
    setSelectedTopics([]);
  }, [topics]);

  const loadTopics = async () => {
    const { data: mainTopicsData } = await getMainTopics();
    const { data: subTopicsData } = await getSubTopics();
    setMainTopics(mainTopicsData || []);
    setSubTopics(subTopicsData || []);
  };

  const handleApprove = async (topic) => {
    try {
      const { error } = await approvePendingTopic(topic.id);
      if (error) {
        toast({
          title: "שגיאה",
          description: error,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "הצלחה",
        description: "הנושא אושר בהצלחה",
      });
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error("Error approving topic:", error);
      toast({
        title: "שגיאה",
        description: "שגיאה באישור הנושא",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    try {
      if (!rejectionReason) {
        toast({
          title: "שגיאה",
          description: "יש להזין סיבת דחייה",
          variant: "destructive",
        });
        return;
      }

      const { error } = await rejectPendingTopic(
        selectedTopic.id,
        rejectionReason
      );
      if (error) {
        toast({
          title: "שגיאה",
          description: error,
          variant: "destructive",
        });
        return;
      }

      setShowRejectDialog(false);
      setRejectionReason("");
      setSelectedTopic(null);
      toast({
        title: "הצלחה",
        description: "הנושא נדחה בהצלחה",
      });
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error("Error rejecting topic:", error);
      toast({
        title: "שגיאה",
        description: "שגיאה בדחיית הנושא",
        variant: "destructive",
      });
    }
  };

  const handleReassign = async () => {
    try {
      if (!selectedNewTopicId) {
        toast({
          title: "שגיאה",
          description: "יש לבחור נושא",
          variant: "destructive",
        });
        return;
      }

      const { error } = await reassignTopic(
        selectedTopic.id,
        parseInt(selectedNewTopicId),
        selectedTopic.is_main_topic
      );
      if (error) {
        toast({
          title: "שגיאה",
          description: error,
          variant: "destructive",
        });
        return;
      }

      setShowReassignDialog(false);
      setSelectedNewTopicId("");
      setSelectedTopic(null);
      toast({
        title: "הצלחה",
        description: "החומר שויך מחדש בהצלחה",
      });
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error("Error reassigning topic:", error);
      toast({
        title: "שגיאה",
        description: "שגיאה בשיוך מחדש",
        variant: "destructive",
      });
    }
  };

  // פונקציות לניהול בחירה מרובה
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedTopics(topics.map((topic) => topic.id));
    } else {
      setSelectedTopics([]);
    }
  };

  const handleSelectTopic = (topicId, index, e) => {
    // בדיקה האם זו לחיצה עם shift
    if (e.shiftKey && lastSelectedIndex >= 0) {
      const startIndex = Math.min(index, lastSelectedIndex);
      const endIndex = Math.max(index, lastSelectedIndex);
      const topicIdsInRange = topics
        .slice(startIndex, endIndex + 1)
        .map((topic) => topic.id);

      // אם זה כבר נבחר, הסר את הבחירה
      if (selectedTopics.includes(topicId)) {
        setSelectedTopics((prev) =>
          prev.filter((id) => !topicIdsInRange.includes(id))
        );
      } else {
        // אחרת הוסף את כל הטווח
        setSelectedTopics((prev) => [
          ...new Set([...prev, ...topicIdsInRange]),
        ]);
      }
    } else {
      // בחירה רגילה
      setSelectedTopics((prev) => {
        if (prev.includes(topicId)) {
          return prev.filter((id) => id !== topicId);
        } else {
          return [...prev, topicId];
        }
      });
    }

    setLastSelectedIndex(index);
  };

  // פעולות ברמת קבוצה
  const handleBulkApprove = async () => {
    if (!selectedTopics.length) return;

    const confirmMsg = `האם אתה בטוח שברצונך לאשר ${selectedTopics.length} נושאים?`;
    if (!window.confirm(confirmMsg)) return;

    let successCount = 0;
    let errorCount = 0;

    for (const topicId of selectedTopics) {
      try {
        const { error } = await approvePendingTopic(topicId);
        if (error) {
          errorCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }

    toast({
      title: "פעולה הסתיימה",
      description: `אושרו בהצלחה: ${successCount}, שגיאות: ${errorCount}`,
      variant: successCount > 0 ? "default" : "destructive",
    });

    // רענון עמוד אם היו הצלחות
    if (successCount > 0) {
      window.location.reload();
    }
  };

  const handleBulkReject = async () => {
    if (!selectedTopics.length) return;

    setRejectionReason("");
    setSelectedTopic({ id: selectedTopics }); // שומר את כל ה-IDs
    setShowRejectDialog(true);
  };

  const handleBulkRejectConfirm = async () => {
    if (!rejectionReason) {
      toast({
        title: "שגיאה",
        description: "יש להזין סיבת דחייה",
        variant: "destructive",
      });
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const topicId of selectedTopic.id) {
      try {
        const { error } = await rejectPendingTopic(topicId, rejectionReason);
        if (error) {
          errorCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }

    setShowRejectDialog(false);

    toast({
      title: "פעולה הסתיימה",
      description: `נדחו בהצלחה: ${successCount}, שגיאות: ${errorCount}`,
      variant: successCount > 0 ? "default" : "destructive",
    });

    // רענון עמוד אם היו הצלחות
    if (successCount > 0) {
      window.location.reload();
    }
  };

  if (loading) {
    return <div className="text-lg">טוען...</div>;
  }

  if (!topics?.length) {
    return <div className="text-lg">אין נושאים ממתינים לאישור</div>;
  }

  const allSelected =
    topics.length > 0 && selectedTopics.length === topics.length;
  const someSelected =
    selectedTopics.length > 0 && selectedTopics.length < topics.length;

  return (
    <>
      {selectedTopics.length > 0 && (
        <div className="flex items-center gap-2 p-2 mb-4 bg-gray-100 rounded-md dark:bg-gray-800">
          <span className="text-lg font-medium">
            נבחרו {selectedTopics.length} נושאים
          </span>
          <div className="flex gap-2 mr-auto">
            <Button
              variant="success"
              onClick={handleBulkApprove}
              className="bg-green-600 hover:bg-green-700">
              אישור {selectedTopics.length} נושאים
            </Button>
            <Button variant="destructive" onClick={handleBulkReject}>
              דחיית {selectedTopics.length} נושאים
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={handleSelectAll}
                  className="mr-3 bg-white"
                />
              </TableHead>
              <TableHead className="text-base">שם הנושא</TableHead>
              <TableHead className="text-base">סוג</TableHead>
              <TableHead className="text-base">נושא אב</TableHead>
              <TableHead className="text-base">חומר</TableHead>
              <TableHead className="text-base">יוצר</TableHead>
              <TableHead className="text-base">תאריך יצירה</TableHead>
              <TableHead className="text-base">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topics.map((topic, index) => (
              <TableRow
                key={topic.id}
                className={
                  selectedTopics.includes(topic.id)
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : ""
                }>
                <TableCell className="mx-auto">
                  <Checkbox
                    checked={selectedTopics.includes(topic.id)}
                    onCheckedChange={(checked) =>
                      handleSelectTopic(topic.id, index, window.event || {})
                    }
                    className="mr-3 bg-white"
                  />
                </TableCell>
                <TableCell className="text-base font-medium">
                  {topic.name}
                </TableCell>
                <TableCell className="text-base">
                  {topic.is_main_topic ? "נושא ראשי" : "תת-נושא"}
                </TableCell>
                <TableCell className="text-base">
                  {topic.is_main_topic ? "-" : topic.parent_topic?.name}
                </TableCell>
                <TableCell className="text-base">
                  {topic.material?.title}
                </TableCell>
                <TableCell className="text-base">
                  {topic.creator?.full_name}
                </TableCell>
                <TableCell className="text-base">
                  {new Date(topic.created_at).toLocaleDateString("he-IL")}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="success"
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-base"
                      onClick={() => handleApprove(topic)}>
                      אישור
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-orange-500 hover:bg-orange-600 text-base"
                      onClick={() => {
                        setSelectedTopic(topic);
                        loadTopics();
                        setShowReassignDialog(true);
                      }}>
                      שיוך מחדש
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="text-base"
                      onClick={() => {
                        setSelectedTopic(topic);
                        setShowRejectDialog(true);
                      }}>
                      דחייה
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="text-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">דחיית נושא</DialogTitle>
            <DialogDescription className="text-base">
              {Array.isArray(selectedTopic?.id)
                ? `אנא הזן את הסיבה לדחיית ${selectedTopic?.id.length} נושאים`
                : `אנא הזן את הסיבה לדחיית הנושא "${selectedTopic?.name}"`}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="סיבת הדחייה"
            className="text-base"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              className="text-base">
              ביטול
            </Button>
            <Button
              variant="destructive"
              onClick={
                Array.isArray(selectedTopic?.id)
                  ? handleBulkRejectConfirm
                  : handleReject
              }
              className="text-base">
              דחייה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReassignDialog} onOpenChange={setShowReassignDialog}>
        <DialogContent className="text-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">שיוך מחדש</DialogTitle>
            <DialogDescription className="text-base">
              בחר נושא קיים לשיוך החומר &quot;{selectedTopic?.material?.title}
              &quot;
            </DialogDescription>
          </DialogHeader>
          <Select
            value={selectedNewTopicId}
            onValueChange={setSelectedNewTopicId}>
            <SelectTrigger className="text-base">
              <SelectValue placeholder="בחר נושא" />
            </SelectTrigger>
            <SelectContent>
              {selectedTopic?.is_main_topic
                ? mainTopics.map((topic) => (
                    <SelectItem
                      key={topic.id}
                      value={topic.id.toString()}
                      className="text-base">
                      {topic.name}
                    </SelectItem>
                  ))
                : subTopics
                    .filter(
                      (topic) =>
                        topic.main_topic_id === selectedTopic?.parent_topic_id
                    )
                    .map((topic) => (
                      <SelectItem
                        key={topic.id}
                        value={topic.id.toString()}
                        className="text-base">
                        {topic.name}
                      </SelectItem>
                    ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReassignDialog(false)}
              className="text-base">
              ביטול
            </Button>
            <Button onClick={handleReassign} className="text-base">
              שיוך מחדש
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
