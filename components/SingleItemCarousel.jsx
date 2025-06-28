/** @format */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  ChevronLeft,
  Clock,
  ThumbsUp,
  MessageCircle,
  Eye,
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ContentModal } from "@/components/ui/ContentModal";
import createSupaClient from "@/lib/supabase/supabase";
import { toast } from "sonner";

export default function SingleItemCarousel({
  materials = [],
  onMaterialDeleted,
  onMaterialUpdated,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localMaterials, setLocalMaterials] = useState(materials);

  // Update local materials when props change
  useEffect(() => {
    setLocalMaterials(materials);
  }, [materials]);

  // Handle material deletion
  const handleMaterialDeleted = (materialId) => {
    setLocalMaterials((prev) =>
      prev.filter((material) => material.id !== materialId)
    );
    if (onMaterialDeleted) {
      onMaterialDeleted(materialId);
    }
  };

  // Handle material update
  const handleMaterialUpdated = (materialId, updatedData) => {
    setLocalMaterials((prev) =>
      prev.map((material) =>
        material.id === materialId ? { ...material, ...updatedData } : material
      )
    );
    if (onMaterialUpdated) {
      onMaterialUpdated(materialId, updatedData);
    }
  };

  const goToNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) =>
      prevIndex === localMaterials.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToPrevious = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? localMaterials.length - 1 : prevIndex - 1
    );
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleViewContent = async (e) => {
    e.stopPropagation();
    try {
      // יצירת כתובת חתומה מהבאקט הפרטי
      const supabase = await createSupaClient();

      // חילוץ שם הקובץ מה-URL
      const urlParts = currentMaterial.url.split("/");
      const fileName = urlParts[urlParts.length - 1];

      // יצירת כתובת חתומה לתקופה של שעה (3600 שניות)
      const { data, error } = await supabase.storage
        .from("materials")
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

  if (localMaterials.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">אין תכנים להצגה</div>
    );
  }

  const currentMaterial = localMaterials[currentIndex];

  // Format the date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("he-IL", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  };

  return (
    <div className="relative h-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full">
          <Card
            className="h-full p-4 flex flex-col justify-between cursor-pointer hover:shadow-lg transition-shadow"
            onClick={openModal}>
            <div className="mb-2">
              <h3 className="text-lg font-bold text-right mb-1">
                {currentMaterial.title}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2 text-right">
                {currentMaterial.description}
              </p>
            </div>

            {/* Add image display */}
            {currentMaterial.photo_url && (
              <div className="relative w-full h-32 my-2 rounded-md overflow-hidden">
                <Image
                  src={currentMaterial.photo_url}
                  alt={currentMaterial.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <div className="mt-2">
              {currentMaterial.main_topic && (
                <div className="flex justify-end mb-2">
                  <span className="bg-sky-100 text-sky-800 text-xs px-2 py-1 rounded-full">
                    {currentMaterial.main_topic.name}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  {formatDate(currentMaterial.created_at)}
                </div>

                <div className="flex gap-3">
                  <div className="flex items-center text-gray-600">
                    <Clock size={14} className="ml-1" />
                    <span className="text-xs">
                      {currentMaterial.estimated_time} דק׳
                    </span>
                  </div>

                  <div className="flex items-center text-blue-600">
                    <ThumbsUp size={14} className="ml-1" />
                    <span className="text-xs">
                      {currentMaterial.likes_count || 0}
                    </span>
                  </div>

                  <div className="flex items-center text-gray-600">
                    <MessageCircle size={14} className="ml-1" />
                    <span className="text-xs">
                      {currentMaterial.comments_count || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center text-blue-600">
                  <ThumbsUp size={16} />
                  <span className="mr-2 text-sm">
                    {currentMaterial.likes_count || 0}
                  </span>
                </div>
                <div className="flex items-center text-gray-500">
                  <MessageCircle size={16} />
                  <span className="mr-2 text-sm">
                    {currentMaterial.comments_count || 0}
                  </span>
                </div>
                <div className="flex items-center text-gray-500">
                  <Clock size={16} />
                  <span className="mr-2 text-sm">
                    {currentMaterial.estimated_time} דקות
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewContent}
                className="hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200">
                <Eye className="w-4 h-4 ml-1" />
                צפה בתוכן
              </Button>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 -translate-x-0.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevious}
          className="h-8 w-8 rounded-full bg-white shadow-md hover:bg-slate-100">
          <ChevronRight size={18} />
        </Button>
      </div>

      <div className="absolute top-1/2 left-0 -translate-y-1/2 translate-x-0.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNext}
          className="h-8 w-8 rounded-full bg-white shadow-md hover:bg-slate-100">
          <ChevronLeft size={18} />
        </Button>
      </div>

      {/* Indicators */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1.5">
        {localMaterials.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(index);
            }}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              index === currentIndex ? "bg-sky-500" : "bg-gray-300"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Content Modal */}
      {isModalOpen && (
        <ContentModal
          material={currentMaterial}
          isOpen={isModalOpen}
          onClose={closeModal}
          onMaterialDeleted={handleMaterialDeleted}
          onMaterialUpdated={handleMaterialUpdated}
        />
      )}
    </div>
  );
}
