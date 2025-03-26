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
import { Loader2, Upload, PlusCircle } from "lucide-react";
import ReactSelect from "react-select";

export default function ContentForm({
  formData,
  setFormData,
  handleInputChange,
  handleSelectChange,
  handleFileChange,
  handleSubmit,
  isLoading,
  errors,
  file,
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

      <FileUploader
        handleFileChange={handleFileChange}
        file={file}
        errors={errors}
      />

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
