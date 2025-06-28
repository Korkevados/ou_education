/** @format */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  LayoutGrid,
  List,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import { getMaterials, deleteMaterial } from "@/app/actions/materials";
import { getMainTopics } from "@/app/actions/topics";
import { ContentCarousel } from "@/components/ui/ContentCarousel";
import getUserDetails from "@/app/actions/auth";
import createSupaClient from "@/lib/supabase/supabase";

export default function ContentPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [topics, setTopics] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'table'
  const [userRole, setUserRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [showViewDialog, setShowViewDialog] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Check user role first
        const userDetails = await getUserDetails();
        if (userDetails && userDetails.role) {
          setUserRole(userDetails.role);
          setIsAdmin(
            userDetails.role === "ADMIN" || userDetails.role === "מנהל כללי"
          );
        }

        // טעינת כל החומרים
        const { data: materialsData, error: materialsError } =
          await getMaterials();
        if (materialsError) {
          toast.error(materialsError);
          return;
        }

        // טעינת נושאים ראשיים
        const { data: topicsData, error: topicsError } = await getMainTopics();
        if (topicsError) {
          toast.error(topicsError);
          return;
        }

        setMaterials(materialsData || []);
        setFilteredMaterials(materialsData || []);
        setTopics(topicsData || []);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("שגיאה בטעינת נתונים");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
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
      const supabase = await createSupaClient();

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
      setFilteredMaterials(
        filteredMaterials.filter((material) => material.id !== deleteId)
      );
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

  // Handle material updates
  const handleMaterialUpdated = (materialId, updatedData) => {
    setMaterials((prev) =>
      prev.map((material) =>
        material.id === materialId ? { ...material, ...updatedData } : material
      )
    );
    setFilteredMaterials((prev) =>
      prev.map((material) =>
        material.id === materialId ? { ...material, ...updatedData } : material
      )
    );
  };

  // Handle material deletions
  const handleMaterialDeleted = (materialId) => {
    setMaterials((prev) =>
      prev.filter((material) => material.id !== materialId)
    );
    setFilteredMaterials((prev) =>
      prev.filter((material) => material.id !== materialId)
    );
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

  // ארגון חומרים לפי קטגוריות שונות

  // חומרים אחרונים שהועלו
  const latestMaterials = [...filteredMaterials]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10);

  // חומרים לפי דירוג (הכי הרבה לייקים)
  const topRatedMaterials = [...filteredMaterials]
    .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
    .slice(0, 10);

  // ארגון חומרים לפי נושאים
  const materialsByTopic = topics
    .map((topic) => ({
      topic,
      materials: filteredMaterials.filter(
        (material) => material.main_topic_id === topic.id
      ),
    }))
    .filter((group) => group.materials.length > 0);

  return (
    <>
      <div className="content-container">
        {/* Header Controls Section - Always Visible */}
        <div className="sticky top-0 bg-sky-50 pb-4 z-10">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">ניהול תכנים</h1>
            <Button onClick={() => router.push("/dashboard/content/new")}>
              <Plus className="mr-2 h-4 w-4" />
              תוכן חדש
            </Button>
          </div>

          <Card className="mt-4">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center">
                  <CardTitle>תכנים</CardTitle>
                  <div className="flex border rounded-md p-1 ml-4">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setViewMode("grid")}>
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "table" ? "default" : "ghost"}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setViewMode("table")}>
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
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
                : "אין תכנים להצגה"}
            </div>
          ) : (
            <>
              {viewMode === "grid" ? (
                <div className="space-y-8">
                  {latestMaterials.length > 0 && (
                    <ContentCarousel
                      title="נוסף לאחרונה"
                      materials={latestMaterials}
                      isAdmin={isAdmin}
                      onMaterialUpdated={handleMaterialUpdated}
                      onMaterialDeleted={handleMaterialDeleted}
                    />
                  )}

                  {topRatedMaterials.length > 0 && (
                    <ContentCarousel
                      title="הכי פופולרי"
                      materials={topRatedMaterials}
                      isAdmin={isAdmin}
                      onMaterialUpdated={handleMaterialUpdated}
                      onMaterialDeleted={handleMaterialDeleted}
                    />
                  )}

                  {materialsByTopic.map((group) => (
                    <ContentCarousel
                      key={group.topic.id}
                      title={group.topic.name}
                      materials={group.materials}
                      isAdmin={isAdmin}
                      onMaterialUpdated={handleMaterialUpdated}
                      onMaterialDeleted={handleMaterialDeleted}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableCaption>רשימת תכנים עדכנית</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>כותרת</TableHead>
                            <TableHead>נושא</TableHead>
                            <TableHead>משך</TableHead>
                            <TableHead>קהלי יעד</TableHead>
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
                              <TableCell>{material.main_topic?.name}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1 text-gray-400" />
                                  <span>{material.estimated_time} דקות</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {material.target_audiences &&
                                material.target_audiences.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {material.target_audiences.map(
                                      (audience) => (
                                        <span
                                          key={audience.id}
                                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                          {audience.grade}
                                        </span>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-xs">
                                    לא נבחר
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                {material.creator?.full_name}
                              </TableCell>
                              <TableCell>
                                {formatDate(material.created_at)}
                              </TableCell>
                              <TableCell className="text-left">
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
                                  {isAdmin && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEdit(material)}>
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => confirmDelete(material)}>
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
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
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>אישור מחיקה</DialogTitle>
            <DialogDescription>
              האם אתה בטוח שברצונך למחוק את התוכן הזה? פעולה זו אינה ניתנת
              לביטול.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}>
              ביטול
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  מוחק...
                </>
              ) : (
                "מחק"
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
    </>
  );
}
