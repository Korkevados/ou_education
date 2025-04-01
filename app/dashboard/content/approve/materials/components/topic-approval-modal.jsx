/** @format */

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { approvePendingTopic, rejectPendingTopic } from "@/app/actions/topics";

export function TopicApprovalModal({
  topic,
  isOpen,
  onClose,
  onTopicApproved,
}) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Don't render if topic is null
  if (!topic) return null;

  const handleApprove = async () => {
    try {
      setLoading(true);
      const { error } = await approvePendingTopic(topic.id);
      if (error) throw new Error(error);

      toast({
        title: "הנושא אושר בהצלחה",
        description: "הנושא אושר והועבר לנושאים מאושרים",
      });

      onTopicApproved(topic.id);
      onClose();
    } catch (error) {
      toast({
        title: "שגיאה",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "שגיאה",
        description: "נא להזין סיבת דחייה",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await rejectPendingTopic(topic.id, rejectionReason);
      if (error) throw new Error(error);

      toast({
        title: "הנושא נדחה",
        description: "הנושא נדחה והערות נשמרו",
      });

      onTopicApproved(topic.id);
      onClose();
    } catch (error) {
      toast({
        title: "שגיאה",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  console.log("approving topic", topic);
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>אישור נושא חדש</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium">שם הנושא</h4>
            <p className="text-sm text-gray-500">{topic.name}</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">סוג נושא</h4>
            <p className="text-sm text-gray-500">
              {topic.is_main_topic ? "נושא ראשי" : "תת נושא"}
            </p>
          </div>
          {topic.parent_topic_id && (
            <div className="space-y-2">
              <h4 className="font-medium">נושא אב</h4>
              <p className="text-sm text-gray-500">
                {topic.parent_topic?.name || "לא זמין"}
              </p>
            </div>
          )}
          <div className="space-y-2">
            <h4 className="font-medium">סיבת דחייה</h4>
            <Textarea
              placeholder="הזן סיבת דחייה (אופציונלי)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            ביטול
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700">
            דחה
          </Button>
          <Button
            onClick={handleApprove}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700">
            אשר
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
