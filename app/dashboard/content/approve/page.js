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
  TableCaption,
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
import {
  Plus,
  Search,
  MoreVertical,
  Loader2,
  Eye,
  Trash,
  Clock,
  FileText,
  LayoutGrid,
  List,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  getPendingMaterials,
  approveMaterial,
  rejectMaterial,
  getMaterials,
  deleteMaterial,
} from "@/app/actions/materials";
import { getMainTopics } from "@/app/actions/topics";
import { ContentCarousel } from "@/components/ui/ContentCarousel";
import getUserDetails from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/supabase";

export default function ContentApprovalPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showViewDialog, setShowViewDialog] = useState(false);

  useEffect(() => {
    const loadPendingMaterials = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await getPendingMaterials();

        if (error) {
          toast.error(error);
          return;
        }

        setMaterials(data || []);
        setFilteredMaterials(data || []);
      } catch (error) {
        console.error("Error loading pending materials:", error);
        toast.error("שגיאה בטעינת תכנים ממתינים לאישור");
      } finally {
        setIsLoading(false);
      }
    };

    loadPendingMaterials();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredMaterials(materials);
      return;
    }

    const lowercaseSearch = searchTerm.toLowerCase();
    const filtered = materials.filter((material) => {
      return (
        material.title.toLowerCase().includes(lowercaseSearch) ||
        material.creator?.full_name.toLowerCase().includes(lowercaseSearch)
      );
    });

    setFilteredMaterials(filtered);
  }, [searchTerm, materials]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleView = (material) => {
    setSelectedMaterial(material);
    setShowViewDialog(true);
  };

  const handleViewContent = async (material) => {
    try {
      // יצירת כתובת חתומה מהבאקט הפרטי
      const supabase = await createClient();

      // חילוץ שם הקובץ מה-URL
      const urlParts = material.url.split("/");
      const fileName = urlParts[urlParts.length - 1];
      console.log(fileName);
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

  const handleApprove = async (materialId) => {
    try {
      setIsProcessing(true);
      const { error } = await approveMaterial(materialId);

      if (error) {
        toast.error(error);
        return;
      }

      // Update materials list
      setMaterials(materials.filter((material) => material.id !== materialId));
      setFilteredMaterials(
        filteredMaterials.filter((material) => material.id !== materialId)
      );
      toast.success("התוכן אושר בהצלחה");
    } catch (error) {
      console.error("Error approving material:", error);
      toast.error("שגיאה באישור התוכן");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedMaterial || !rejectReason.trim()) return;

    try {
      setIsProcessing(true);
      const { error } = await rejectMaterial(selectedMaterial.id, rejectReason);

      if (error) {
        toast.error(error);
        return;
      }

      // Update materials list
      setMaterials(
        materials.filter((material) => material.id !== selectedMaterial.id)
      );
      setFilteredMaterials(
        filteredMaterials.filter(
          (material) => material.id !== selectedMaterial.id
        )
      );
      toast.success("התוכן נדחה בהצלחה");
      setShowRejectDialog(false);
      setRejectReason("");
      setSelectedMaterial(null);
    } catch (error) {
      console.error("Error rejecting material:", error);
      toast.error("שגיאה בדחיית התוכן");
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmReject = (material) => {
    setSelectedMaterial(material);
    setShowRejectDialog(true);
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("he-IL", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  };

  // Get file type icon based on URL
  const getFileIcon = (url) => {
    if (url.toLowerCase().endsWith(".pdf")) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (url.toLowerCase().match(/\.(docx?|rtf)$/)) {
      return <FileText className="h-5 w-5 text-blue-500" />;
    } else if (url.toLowerCase().match(/\.(pptx?|pps)$/)) {
      return <FileText className="h-5 w-5 text-orange-500" />;
    } else {
      return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="content-container">
      {/* Header Controls Section - Always Visible */}
      <div className="sticky top-0 bg-sky-50 pb-4 z-10">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">אישור תכנים</h1>
        </div>

        <Card className="mt-4">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>תכנים ממתינים לאישור</CardTitle>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="חיפוש תכנים..."
                  className="pl-10 w-full sm:w-[300px]"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Scrollable Content Section */}
      <div className="content-scrollable py-4">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm
              ? "לא נמצאו תכנים התואמים את החיפוש"
              : "אין תכנים ממתינים לאישור"}
          </div>
        ) : (
          <Card>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableCaption>רשימת תכנים ממתינים לאישור</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>כותרת</TableHead>
                      <TableHead>מעלה</TableHead>
                      <TableHead>תאריך העלאה</TableHead>
                      <TableHead>סוג תוכן</TableHead>
                      <TableHead>סטטוס</TableHead>
                      <TableHead className="text-left">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaterials.map((material) => (
                      <TableRow key={material.id}>
                        <TableCell>{getFileIcon(material.url)}</TableCell>
                        <TableCell className="font-medium">
                          {material.title}
                        </TableCell>
                        <TableCell>{material.creator?.full_name}</TableCell>
                        <TableCell>{formatDate(material.created_at)}</TableCell>
                        <TableCell>
                          {material.content_type || "לא צוין"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              material.status?.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : material.status?.status === "APPROVED"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                            {material.status?.status === "PENDING"
                              ? "ממתין לאישור"
                              : material.status?.status === "APPROVED"
                              ? "מאושר"
                              : "נדחה"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewContent(material)}
                              title="צפה בתוכן">
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleView(material)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleApprove(material.id)}
                              disabled={isProcessing}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => confirmReject(material)}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>דחיית תוכן</DialogTitle>
            <DialogDescription>אנא ספק סיבה לדחיית התוכן</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="סיבת הדחייה..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectReason("");
                setSelectedMaterial(null);
              }}>
              ביטול
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing || !rejectReason.trim()}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  דוחה...
                </>
              ) : (
                "דחה"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add custom styles for the content container */}
      <style jsx global>{`
        .content-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }

        .content-scrollable {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
        }

        /* Fix for Safari */
        @supports (-webkit-overflow-scrolling: touch) {
          .content-scrollable {
            -webkit-overflow-scrolling: touch;
          }
        }

        /* Hide scrollbar for Chrome, Safari and Opera */
        .content-scrollable::-webkit-scrollbar {
          display: none;
        }

        /* Hide scrollbar for IE, Edge and Firefox */
        .content-scrollable {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
      `}</style>
    </div>
  );
}
