/** @format */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  ChevronLeft,
  Clock,
  ThumbsUp,
  MessageCircle,
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ContentModal } from "@/components/ui/ContentModal";

export default function SingleItemCarousel({ materials = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const goToNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) =>
      prevIndex === materials.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToPrevious = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? materials.length - 1 : prevIndex - 1
    );
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  if (materials.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">אין תכנים להצגה</div>
    );
  }

  const currentMaterial = materials[currentIndex];

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
        {materials.map((_, index) => (
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
        />
      )}
    </div>
  );
}
