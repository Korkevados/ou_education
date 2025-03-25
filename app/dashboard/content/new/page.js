/** @format */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DashboardShell } from "@/components/DashboardShell";
import { getUserDetails } from "@/app/actions/auth";
import { uploadMaterial } from "@/app/actions/materials";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload } from "lucide-react";
import { getMainTopics, getSubTopics } from "@/app/actions/topics";

export default function NewContentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [mainTopics, setMainTopics] = useState([]);
  const [subTopics, setSubTopics] = useState([]);
  const [filteredSubTopics, setFilteredSubTopics] = useState([]);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    mainTopicId: "",
    subTopicId: "",
    estimatedTime: 15,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get user details
        const { data: userData, error: userError } = await getUserDetails();
        if (userError) {
          toast.error("שגיאה בטעינת פרטי משתמש");
          return;
        }
        setUser(userData);

        // Get main topics
        const { data: topicsData, error: topicsError } = await getMainTopics();
        if (topicsError) {
          toast.error("שגיאה בטעינת נושאים ראשיים");
          return;
        }
        setMainTopics(topicsData);

        // Get all sub topics
        const { data: subTopicsData, error: subTopicsError } =
          await getSubTopics();
        if (subTopicsError) {
          toast.error("שגיאה בטעינת תתי נושאים");
          return;
        }
        setSubTopics(subTopicsData);
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast.error("שגיאה בטעינת נתונים");
      }
    };

    loadData();
  }, []);

  // Filter sub topics when main topic changes
  useEffect(() => {
    if (formData.mainTopicId && subTopics.length > 0) {
      const filtered = subTopics.filter(
        (topic) => topic.main_topic_id === parseInt(formData.mainTopicId)
      );
      setFilteredSubTopics(filtered);

      // Reset sub topic selection if the current selection doesn't belong to the selected main topic
      if (
        formData.subTopicId &&
        !filtered.some((t) => t.id === parseInt(formData.subTopicId))
      ) {
        setFormData((prev) => ({ ...prev, subTopicId: "" }));
      }
    } else {
      setFilteredSubTopics([]);
    }
  }, [formData.mainTopicId, subTopics]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear specific error when user corrects the field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear specific error when user corrects the field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    // Validate file type
    const allowedTypes = [
      "application/pdf", // PDF
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
      "application/msword", // DOC
      "application/vnd.openxmlformats-officedocument.presentationml.presentation", // PPTX
      "application/vnd.ms-powerpoint", // PPT
    ];

    if (selectedFile && !allowedTypes.includes(selectedFile.type)) {
      setErrors((prev) => ({
        ...prev,
        file: "קובץ לא נתמך. אנא העלה קובץ מסוג PDF, Word או PowerPoint",
      }));
      e.target.value = null; // Reset the input
      return;
    }

    // Max file size - 10MB
    if (selectedFile && selectedFile.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        file: "גודל הקובץ חייב להיות קטן מ-10MB",
      }));
      e.target.value = null; // Reset the input
      return;
    }

    setFile(selectedFile);
    setErrors((prev) => ({ ...prev, file: null }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "נא להזין כותרת";
    }

    if (!formData.description.trim()) {
      newErrors.description = "נא להזין תיאור";
    }

    if (!formData.mainTopicId) {
      newErrors.mainTopicId = "נא לבחור נושא ראשי";
    }

    if (!formData.subTopicId) {
      newErrors.subTopicId = "נא לבחור תת נושא";
    }

    if (!file) {
      newErrors.file = "נא לבחור קובץ להעלאה";
    }

    const estimatedTime = parseInt(formData.estimatedTime);
    if (isNaN(estimatedTime) || estimatedTime <= 0) {
      newErrors.estimatedTime = "זמן משוער חייב להיות מספר חיובי";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("אנא מלא את כל השדות הנדרשים");
      return;
    }

    setIsLoading(true);

    try {
      const result = await uploadMaterial({
        title: formData.title,
        description: formData.description,
        mainTopicId: parseInt(formData.mainTopicId),
        subTopicId: parseInt(formData.subTopicId),
        estimatedTime: parseInt(formData.estimatedTime),
        file: file,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("התוכן הועלה בהצלחה");
      router.push("/dashboard/content");
    } catch (error) {
      console.error("Error uploading material:", error);
      toast.error("שגיאה בהעלאת התוכן");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full md:w-[80%] bg-white rounded-lg shadow-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">העלאת תוכן חדש</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-medium">
                כותרת <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="כותרת התוכן"
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-red-500 text-sm">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium">
                תיאור <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="תיאור מפורט של התוכן"
                rows={4}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && (
                <p className="text-red-500 text-sm">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="mainTopic"
                  className="block text-sm font-medium">
                  נושא ראשי <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.mainTopicId}
                  onValueChange={(value) =>
                    handleSelectChange("mainTopicId", value)
                  }>
                  <SelectTrigger
                    className={errors.mainTopicId ? "border-red-500" : ""}>
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
                {errors.mainTopicId && (
                  <p className="text-red-500 text-sm">{errors.mainTopicId}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="subTopic" className="block text-sm font-medium">
                  תת נושא <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.subTopicId}
                  onValueChange={(value) =>
                    handleSelectChange("subTopicId", value)
                  }
                  disabled={
                    !formData.mainTopicId || filteredSubTopics.length === 0
                  }>
                  <SelectTrigger
                    className={errors.subTopicId ? "border-red-500" : ""}>
                    <SelectValue
                      placeholder={
                        !formData.mainTopicId
                          ? "בחר נושא ראשי תחילה"
                          : filteredSubTopics.length === 0
                          ? "אין תתי נושאים זמינים"
                          : "בחר תת נושא"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSubTopics.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id.toString()}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.subTopicId && (
                  <p className="text-red-500 text-sm">{errors.subTopicId}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="estimatedTime"
                className="block text-sm font-medium">
                זמן משוער לקריאה (בדקות) <span className="text-red-500">*</span>
              </label>
              <Input
                id="estimatedTime"
                name="estimatedTime"
                type="number"
                min="1"
                value={formData.estimatedTime}
                onChange={handleInputChange}
                placeholder="זמן משוער בדקות"
                className={`w-full ${
                  errors.estimatedTime ? "border-red-500" : ""
                }`}
              />
              {errors.estimatedTime && (
                <p className="text-red-500 text-sm">{errors.estimatedTime}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="file" className="block text-sm font-medium">
                קובץ להעלאה <span className="text-red-500">*</span>
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  errors.file ? "border-red-500" : "border-gray-300"
                }`}>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                />
                <label htmlFor="file" className="cursor-pointer block">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm font-medium">
                    {file ? file.name : "לחץ או גרור קובץ לכאן"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    PDF, Word או PowerPoint עד 10MB
                  </p>
                </label>
              </div>
              {errors.file && (
                <p className="text-red-500 text-sm">{errors.file}</p>
              )}
              {file && (
                <p className="text-green-600 text-sm">
                  {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div className="pt-4 flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/content")}
                disabled={isLoading}>
                ביטול
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    מעלה...
                  </>
                ) : (
                  "העלאת תוכן"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
