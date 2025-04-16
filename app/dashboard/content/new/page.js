/** @format */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMainTopics } from "@/app/actions/topics";
import { getTargetAudiences } from "@/app/actions/target-audiences";
import { uploadMaterial } from "@/app/actions/materials";
import getUserDetails from "@/app/actions/auth";
import createSupaClient from "@/lib/supabase/supabase";
import ContentForm from "./components/ContentForm";
import InfoBanner from "./components/InfoBanner";
import { validateForm, validateFile, validateImage } from "./utils/validators";

export default function NewContentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [mainTopics, setMainTopics] = useState([]);
  const [targetAudiences, setTargetAudiences] = useState([]);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    mainTopicId: "",
    estimatedTime: 15,
  });
  const [selectedTargetAudiences, setSelectedTargetAudiences] = useState([]);
  const [errors, setErrors] = useState({});
  const [isNewMainTopic, setIsNewMainTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  // Load all necessary data from the server
  const loadInitialData = async () => {
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
        toast.error("שגיאה בטעינת נושאים");
        return;
      }
      setMainTopics(topicsData);

      // Get all target audiences
      const { data: audiencesData, error: audiencesError } =
        await getTargetAudiences();
      if (audiencesError) {
        toast.error("שגיאה בטעינת קהלי יעד");
        return;
      }
      setTargetAudiences(audiencesData);
    } catch (error) {
      console.error("Error loading initial data:", error);
      toast.error("שגיאה בטעינת נתונים");
    }
  };

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

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];

    // Validate file
    const errorMessage = validateFile(selectedFile);
    if (errorMessage) {
      setErrors((prev) => ({ ...prev, file: errorMessage }));
      e.target.value = null; // Reset the input
      return;
    }

    setFile(selectedFile);
    setErrors((prev) => ({ ...prev, file: null }));
  };

  const handleImageChange = (e) => {
    const selectedImage = e.target.files[0];

    if (!selectedImage) {
      setImageFile(null);
      setErrors((prev) => ({ ...prev, image: null }));
      return;
    }

    // Validate image
    const errorMessage = validateImage(selectedImage);
    if (errorMessage) {
      setErrors((prev) => ({ ...prev, image: errorMessage }));
      e.target.value = null; // Reset the input
      return;
    }

    setImageFile(selectedImage);
    setErrors((prev) => ({ ...prev, image: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Validation
    const formErrors = validateForm(
      formData,
      file,
      selectedTargetAudiences,
      isNewMainTopic,
      newTopicName,
      imageFile
    );

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setIsLoading(false);
      return;
    }

    try {
      await uploadContent();
    } catch (error) {
      console.error("Error uploading material:", error);
      toast.error("אירעה שגיאה בהעלאת התוכן");
    } finally {
      setIsLoading(false);
    }
  };

  const uploadContent = async () => {
    try {
      const supabase = await createSupaClient();

      // Upload file first
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("content")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Error uploading file:", uploadError);
        toast.error("שגיאה בהעלאת הקובץ");
        return;
      }

      // Get the public URL for the content file
      const {
        data: { publicUrl: fileUrl },
      } = supabase.storage.from("content").getPublicUrl(fileName);

      let photoUrl = null;

      // If no image was provided, generate preview
      if (!imageFile) {
        try {
          console.log("Starting preview generation for file:", file.name);
          // Create FormData
          const formData = new FormData();
          formData.append("file", file);

          // Send to API
          const response = await fetch("/api/content/preview", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error("Failed to generate preview");
          }

          // Get the response with the URL
          const result = await response.json();
          console.log("Preview API response:", result);

          if (result.success && result.url) {
            console.log("Preview generated successfully, URL:", result.url);
            photoUrl = result.url;
          } else {
            console.error("Preview API returned success=false or no URL");
            throw new Error("Invalid API response");
          }
        } catch (error) {
          console.error("Error generating preview:", error);
          toast.warning("לא הצלחנו ליצור תצוגה מקדימה, ממשיכים בלעדיה");
        }
      } else if (imageFile) {
        // Upload provided image
        const imageExt = imageFile.name.split(".").pop();
        const imageName = `${crypto.randomUUID()}.${imageExt}`;

        const { error: imageUploadError } = await supabase.storage
          .from("photos-materials")
          .upload(imageName, imageFile);

        if (imageUploadError) {
          console.error("Error uploading image:", imageUploadError);
          toast.warning("שגיאה בהעלאת התמונה, ממשיכים בלעדיה");
        } else {
          const {
            data: { publicUrl },
          } = supabase.storage.from("photos-materials").getPublicUrl(imageName);
          photoUrl = publicUrl;
        }
      }

      console.log("Final URLs before material upload:", { fileUrl, photoUrl });

      // Ensure IDs are either valid or null
      const sanitizedMainTopicId = formData.mainTopicId || null;

      // Now upload the material with all URLs
      const { data, error } = await uploadMaterial({
        title: formData.title.trim(),
        description: formData.description.trim(),
        mainTopicId: isNewMainTopic ? null : sanitizedMainTopicId,
        estimatedTime: parseInt(formData.estimatedTime),
        fileUrl: fileUrl,
        photoUrl: photoUrl,
        targetAudiences: selectedTargetAudiences,
        newTopic: isNewMainTopic
          ? {
              name: newTopicName.trim(),
              isMainTopic: true,
            }
          : null,
      });

      if (error) {
        // If material creation failed, clean up the uploaded files
        await supabase.storage.from("content").remove([fileName]);
        if (photoUrl) {
          const imageName = photoUrl.split("/").pop();
          await supabase.storage.from("photos-materials").remove([imageName]);
        }
        toast.error(error);
        return;
      }

      console.log("Material uploaded successfully:", data);
      toast.success("התוכן הועלה בהצלחה");
      if (isNewMainTopic) {
        toast.info("הנושא החדש ממתין לאישור מנהל");
      }
      router.push("/dashboard/content");
    } catch (error) {
      console.error("Error in uploadContent:", error);
      toast.error("אירעה שגיאה בהעלאת התוכן");
    }
  };

  return (
    <div className="flex flex-col h-full md:w-[80%] bg-white rounded-lg shadow-md overflow-y-auto mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">העלאת תוכן חדש</CardTitle>
          <InfoBanner />
        </CardHeader>
        <CardContent>
          <ContentForm
            formData={formData}
            setFormData={setFormData}
            handleInputChange={handleInputChange}
            handleSelectChange={handleSelectChange}
            handleFileChange={handleFileChange}
            handleImageChange={handleImageChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            errors={errors}
            file={file}
            imageFile={imageFile}
            isNewMainTopic={isNewMainTopic}
            setIsNewMainTopic={setIsNewMainTopic}
            newTopicName={newTopicName}
            setNewTopicName={setNewTopicName}
            mainTopics={mainTopics}
            targetAudiences={targetAudiences}
            selectedTargetAudiences={selectedTargetAudiences}
            setSelectedTargetAudiences={setSelectedTargetAudiences}
            router={router}
          />
        </CardContent>
      </Card>
    </div>
  );
}
