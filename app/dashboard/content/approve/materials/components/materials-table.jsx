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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Check, X, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  approveMaterialContent,
  rejectMaterialContent,
} from "@/app/actions/materials";
import { TopicApprovalModal } from "./topic-approval-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function MaterialsTable({ materials, loading, onMaterialApproved }) {
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectingMaterial, setRejectingMaterial] = useState(null);
  const { toast } = useToast();
  console.log("materials", materials);
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedMaterials(materials.map((m) => m.id));
    } else {
      setSelectedMaterials([]);
    }
  };

  const handleSelectMaterial = (materialId) => {
    setSelectedMaterials((prev) =>
      prev.includes(materialId)
        ? prev.filter((id) => id !== materialId)
        : [...prev, materialId]
    );
  };

  const handleApprove = async (materialId) => {
    try {
      const { error } = await approveMaterialContent(materialId);
      if (error) throw new Error(error);

      toast({
        title: "החומר אושר בהצלחה",
        description: "החומר אושר והועבר לחומרים מאושרים",
      });

      // Dispatch custom event to refresh approval badge
      window.dispatchEvent(new CustomEvent("approval-action-completed"));

      onMaterialApproved(materialId);
    } catch (error) {
      toast({
        title: "שגיאה",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReject = async (materialId) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "שגיאה",
        description: "נא להזין סיבת דחייה",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await rejectMaterialContent(
        materialId,
        rejectionReason
      );
      if (error) throw new Error(error);

      toast({
        title: "החומר נדחה",
        description: "החומר נדחה והערות נשמרו",
      });

      // Dispatch custom event to refresh approval badge
      window.dispatchEvent(new CustomEvent("approval-action-completed"));

      onMaterialApproved(materialId);
      setRejectingMaterial(null);
      setRejectionReason("");
    } catch (error) {
      toast({
        title: "שגיאה",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleBulkApprove = async () => {
    try {
      for (const materialId of selectedMaterials) {
        await approveMaterialContent(materialId);
      }

      toast({
        title: "החומרים אושרו בהצלחה",
        description: "כל החומרים הנבחרים אושרו",
      });

      selectedMaterials.forEach(onMaterialApproved);
      setSelectedMaterials([]);
    } catch (error) {
      toast({
        title: "שגיאה",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDownload = (material) => {
    // Implement download functionality
    window.open(material.url, "_blank");
  };

  return (
    <div className="space-y-4">
      {selectedMaterials.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            נבחרו {selectedMaterials.length} חומרים
          </p>
          <Button onClick={handleBulkApprove}>אשר את כל החומרים הנבחרים</Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedMaterials.length === materials.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>כותרת</TableHead>
              <TableHead>תיאור</TableHead>
              <TableHead>יוצר</TableHead>
              <TableHead>תאריך יצירה</TableHead>
              <TableHead>סטטוס נושא</TableHead>
              <TableHead className="text-right">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.map((material) => (
              <TableRow key={material.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedMaterials.includes(material.id)}
                    onCheckedChange={() => handleSelectMaterial(material.id)}
                  />
                </TableCell>
                <TableCell>{material.title}</TableCell>
                <TableCell>{material.description}</TableCell>
                <TableCell>{material.creator_name}</TableCell>
                <TableCell>
                  {new Date(material.created_at).toLocaleDateString("he-IL")}
                </TableCell>
                <TableCell>
                  {material.pending_topic && (
                    <Badge
                      variant={
                        material.pending_topic.status === "pending"
                          ? "warning"
                          : material.pending_topic.status === "approved"
                          ? "success"
                          : material.pending_topic.status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                      className="cursor-pointer"
                      onClick={() => setSelectedTopic(material.pending_topic)}>
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {material.pending_topic.status === "pending"
                        ? "נושא ממתין לאישור"
                        : material.pending_topic.status === "approved"
                        ? "נושא אושר"
                        : material.pending_topic.status === "rejected"
                        ? "נושא נדחה"
                        : "נושא הוחזר"}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(material)}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleApprove(material.id)}>
                      <Check className="w-4 h-4 text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setRejectingMaterial(material)}>
                      <X className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TopicApprovalModal
        topic={selectedTopic}
        isOpen={!!selectedTopic}
        onClose={() => setSelectedTopic(null)}
        onTopicApproved={(topicId) => {
          // Pass both null for materialId and the topicId
          onMaterialApproved(null, topicId);
        }}
      />

      <Dialog
        open={!!rejectingMaterial}
        onOpenChange={() => {
          setRejectingMaterial(null);
          setRejectionReason("");
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>דחיית חומר</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <h4 className="font-medium">סיבת דחייה</h4>
              <Textarea
                placeholder="הזן סיבת דחייה"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectingMaterial(null);
                setRejectionReason("");
              }}>
              ביטול
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleReject(rejectingMaterial?.id)}>
              דחה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
