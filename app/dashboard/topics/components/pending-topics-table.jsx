/** @format */

"use client";

import { useState } from "react";
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
  const { toast } = useToast();

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

  if (loading) {
    return <div>טוען...</div>;
  }

  if (!topics?.length) {
    return <div>אין נושאים ממתינים לאישור</div>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>שם הנושא</TableHead>
            <TableHead>סוג</TableHead>
            <TableHead>נושא אב</TableHead>
            <TableHead>חומר</TableHead>
            <TableHead>יוצר</TableHead>
            <TableHead>תאריך יצירה</TableHead>
            <TableHead>פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topics.map((topic) => (
            <TableRow key={topic.id}>
              <TableCell>{topic.name}</TableCell>
              <TableCell>
                {topic.is_main_topic ? "נושא ראשי" : "תת-נושא"}
              </TableCell>
              <TableCell>
                {topic.is_main_topic ? "-" : topic.parent_topic?.name}
              </TableCell>
              <TableCell>{topic.material?.title}</TableCell>
              <TableCell>{topic.creator?.full_name}</TableCell>
              <TableCell>
                {new Date(topic.created_at).toLocaleDateString("he-IL")}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleApprove(topic)}>
                    אישור
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
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

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>דחיית נושא</DialogTitle>
            <DialogDescription>
              אנא הזן את הסיבה לדחיית הנושא &quot;
              {selectedTopic?.name}&quot;
            </DialogDescription>
          </DialogHeader>
          <Input
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="סיבת הדחייה"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}>
              ביטול
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              דחייה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReassignDialog} onOpenChange={setShowReassignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>שיוך מחדש</DialogTitle>
            <DialogDescription>
              בחר נושא קיים לשיוך החומר &quot;{selectedTopic?.material?.title}
              &quot;
            </DialogDescription>
          </DialogHeader>
          <Select
            value={selectedNewTopicId}
            onValueChange={setSelectedNewTopicId}>
            <SelectTrigger>
              <SelectValue placeholder="בחר נושא" />
            </SelectTrigger>
            <SelectContent>
              {selectedTopic?.is_main_topic
                ? mainTopics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id.toString()}>
                      {topic.name}
                    </SelectItem>
                  ))
                : subTopics
                    .filter(
                      (topic) =>
                        topic.main_topic_id === selectedTopic?.parent_topic_id
                    )
                    .map((topic) => (
                      <SelectItem key={topic.id} value={topic.id.toString()}>
                        {topic.name}
                      </SelectItem>
                    ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReassignDialog(false)}>
              ביטול
            </Button>
            <Button onClick={handleReassign}>שיוך מחדש</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
