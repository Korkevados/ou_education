/** @format */
"use client";

import { useState } from "react";
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
import { Loader2, Upload, PlusCircle, Image as ImageIcon } from "lucide-react";
import ReactSelect from "react-select";
import Image from "next/image";

export default function ContentForm({
  formData,
  setFormData,
  handleInputChange,
  handleSelectChange,
  handleFileChange,
  handleImageChange,
  handleSubmit,
  isLoading,
  errors,
  file,
  imageFile,
  isNewMainTopic,
  setIsNewMainTopic,
  newTopicName,
  setNewTopicName,
  mainTopics,
  targetAudiences,
  selectedTargetAudiences,
  setSelectedTargetAudiences,
  router,
}) {
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="title" className="block text-lg font-medium">
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
        {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="block text-lg font-medium">
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

      <div className="space-y-2">
        <TopicSelector
          type="main"
          formData={formData}
          setFormData={setFormData}
          handleSelectChange={handleSelectChange}
          isNewTopic={isNewMainTopic}
          setIsNewTopic={setIsNewMainTopic}
          newTopicName={newTopicName}
          setNewTopicName={setNewTopicName}
          topics={mainTopics}
          errors={errors}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="estimatedTime" className="block text-lg font-medium">
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
          className={`w-full ${errors.estimatedTime ? "border-red-500" : ""}`}
        />
        {errors.estimatedTime && (
          <p className="text-red-500 text-sm">{errors.estimatedTime}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-lg font-medium">
          קהלי יעד <span className="text-red-500">*</span>
        </label>
        <ReactSelect
          isMulti
          isRtl
          placeholder="בחר קהלי יעד..."
          noOptionsMessage={() => "לא נמצאו קהלי יעד"}
          className={`${errors.targetAudiences ? "border-red-500" : ""}`}
          options={targetAudiences.map((audience) => ({
            value: audience.id,
            label: `כיתות ${audience.grade}`,
          }))}
          value={selectedTargetAudiences.map((id) => ({
            value: id,
            label: `כיתות ${targetAudiences.find((a) => a.id === id)?.grade}`,
          }))}
          onChange={(selected) => {
            const selectedIds = selected
              ? selected.map((option) => option.value)
              : [];
            setSelectedTargetAudiences(selectedIds);
          }}
          styles={{
            control: (base) => ({
              ...base,
              borderColor: errors.targetAudiences
                ? "rgb(239, 68, 68)"
                : base.borderColor,
              minHeight: "42px",
            }),
            menu: (base) => ({
              ...base,
              zIndex: 50,
            }),
          }}
        />
        {errors.targetAudiences && (
          <p className="text-red-500 text-sm">{errors.targetAudiences}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FileUploader
          handleFileChange={handleFileChange}
          file={file}
          errors={errors}
        />

        <ImageUploader
          handleImageChange={handleImageChange}
          imageFile={imageFile}
          errors={errors}
        />
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
  );
}

function TopicSelector({
  type,
  formData,
  setFormData,
  handleSelectChange,
  isNewTopic,
  setIsNewTopic,
  newTopicName,
  setNewTopicName,
  topics,
  errors,
}) {
  const fieldName = "mainTopicId";
  const label = "נושא";
  const placeholder = "בחר נושא";
  const addLabel = "הוסף נושא חדש";
  const newTopicPlaceholder = "שם הנושא החדש";
  const errorField = "mainTopicId";

  return (
    <div className="space-y-2">
      <label htmlFor={fieldName} className="block text-lg font-medium">
        {label} <span className="text-red-500">*</span>
      </label>
      {!isNewTopic ? (
        <>
          <Select
            value={formData[fieldName]}
            onValueChange={(value) => {
              if (value === "new") {
                setIsNewTopic(true);
                setFormData((prev) => ({ ...prev, [fieldName]: "" }));
              } else {
                handleSelectChange(fieldName, value);
              }
            }}>
            <SelectTrigger
              className={errors[errorField] ? "border-red-500" : ""}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {topics.map((topic) => (
                <SelectItem key={topic.id} value={topic.id.toString()}>
                  {topic.name}
                </SelectItem>
              ))}
              <SelectItem value="new" className="text-blue-600">
                <div className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  <span>{addLabel}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder={newTopicPlaceholder}
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              className={errors.newTopicName ? "border-red-500" : ""}
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsNewTopic(false);
                setNewTopicName("");
              }}>
              ביטול
            </Button>
          </div>
          {errors.newTopicName && (
            <p className="text-red-500 text-sm">{errors.newTopicName}</p>
          )}
        </div>
      )}
    </div>
  );
}

function FileUploader({ handleFileChange, file, errors }) {
  return (
    <div className="space-y-2">
      <label htmlFor="file" className="block text-lg font-medium">
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
      {errors.file && <p className="text-red-500 text-sm">{errors.file}</p>}
      {file && (
        <p className="text-green-600 text-sm">
          {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
        </p>
      )}
    </div>
  );
}

function ImageUploader({ handleImageChange, imageFile, errors }) {
  const [previewUrl, setPreviewUrl] = useState(null);

  // עדכון תצוגה מקדימה כאשר משתנה התמונה
  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }

    handleImageChange(e);
  };

  return (
    <div className="space-y-2">
      <label htmlFor="image" className="block text-lg font-medium">
        תמונת תצוגה מקדימה <span className="text-gray-500">(אופציונלי)</span>
      </label>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          errors.image ? "border-red-500" : "border-gray-300"
        }`}>
        <Input
          id="image"
          type="file"
          onChange={handleChange}
          className="hidden"
          accept="image/jpeg,image/png,image/gif,image/webp"
        />
        <label htmlFor="image" className="cursor-pointer block">
          {previewUrl ? (
            <div className="relative w-32 h-32 mx-auto">
              <Image
                src={previewUrl}
                alt="תצוגה מקדימה"
                fill
                className="object-contain rounded-md"
              />
            </div>
          ) : (
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          )}
          <p className="mt-2 text-sm font-medium">
            {imageFile ? imageFile.name : "לחץ או גרור תמונה לכאן"}
          </p>
          <p className="mt-1 text-xs text-gray-500">JPG, PNG או GIF עד 2MB</p>
        </label>
      </div>
      {errors.image && <p className="text-red-500 text-sm">{errors.image}</p>}
      {imageFile && !previewUrl && (
        <p className="text-green-600 text-sm">
          {imageFile.name} ({(imageFile.size / (1024 * 1024)).toFixed(2)} MB)
        </p>
      )}
    </div>
  );
}
