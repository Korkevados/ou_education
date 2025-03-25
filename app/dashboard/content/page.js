/** @format */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "lucide-react";
import { toast } from "sonner";
import { getMaterials, deleteMaterial } from "@/app/actions/materials";

export default function ContentPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const loadMaterials = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await getMaterials();

        if (error) {
          toast.error(error);
          return;
        }

        setMaterials(data || []);
        setFilteredMaterials(data || []);
      } catch (error) {
        console.error("Error loading materials:", error);
        toast.error("שגיאה בטעינת תכנים");
      } finally {
        setIsLoading(false);
      }
    };

    loadMaterials();
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
        material.description.toLowerCase().includes(lowercaseSearch) ||
        material.main_topic?.name.toLowerCase().includes(lowercaseSearch) ||
        material.sub_topic?.name.toLowerCase().includes(lowercaseSearch) ||
        material.creator?.full_name.toLowerCase().includes(lowercaseSearch)
      );
    });

    setFilteredMaterials(filtered);
  }, [searchTerm, materials]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleView = (material) => {
    // Open material in a new tab
    window.open(material.url, "_blank");
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setIsDeleting(true);
      const { error } = await deleteMaterial(deleteId);

      if (error) {
        toast.error(error);
        return;
      }

      // Update materials list
      setMaterials(materials.filter((material) => material.id !== deleteId));
      toast.success("התוכן נמחק בהצלחה");
    } catch (error) {
      console.error("Error deleting material:", error);
      toast.error("שגיאה במחיקת התוכן");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setDeleteId(null);
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
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
    <DashboardShell>
      <div className="container px-4 py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">ניהול תכנים</h1>
          <Button onClick={() => router.push("/dashboard/content/new")}>
            <Plus className="mr-2 h-4 w-4" />
            תוכן חדש
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>תכנים</CardTitle>
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
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredMaterials.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm
                  ? "לא נמצאו תכנים התואמים את החיפוש"
                  : "אין תכנים להצגה"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableCaption>רשימת תכנים עדכנית</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>כותרת</TableHead>
                      <TableHead>נושא</TableHead>
                      <TableHead>משך</TableHead>
                      <TableHead>יוצר</TableHead>
                      <TableHead>תאריך</TableHead>
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
                        <TableCell>
                          {material.main_topic?.name} /{" "}
                          {material.sub_topic?.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-gray-400" />
                            <span>{material.estimated_time} דקות</span>
                          </div>
                        </TableCell>
                        <TableCell>{material.creator?.full_name}</TableCell>
                        <TableCell>{formatDate(material.created_at)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="bg-white">
                              <DropdownMenuItem
                                className="cursor-pointer flex items-center"
                                onClick={() => handleView(material)}>
                                <Eye className="mr-2 h-4 w-4" />
                                <span>צפה בקובץ</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer flex items-center text-red-600"
                                onClick={() => confirmDelete(material.id)}>
                                <Trash className="mr-2 h-4 w-4" />
                                <span>מחק</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>מחיקת תוכן</DialogTitle>
            <DialogDescription>
              האם אתה בטוח שברצונך למחוק את התוכן הזה? פעולה זו אינה ניתנת
              לביטול.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  מוחק...
                </>
              ) : (
                "כן, מחק"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}>
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
