/** @format */

"use client";
import { useState, useRef, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ContentCard } from "./ContentCard";
import { ContentModal } from "./ContentModal";
import { Button } from "./button";

export function ContentCarousel({ title, materials }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  // Embla Carousel setup
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    dragFree: true,
    direction: "rtl", // עברית - מימין לשמאל
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // הפונקציה שפותחת את המודל עם החומר הנבחר
  const handleCardClick = (material) => {
    setSelectedMaterial(material);
    setModalOpen(true);
  };

  if (!materials || materials.length === 0) {
    return null;
  }

  return (
    <div className="my-8">
      <div className="flex justify-between items-center mb-4 px-2">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            className="h-8 w-8 rounded-full">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            className="h-8 w-8 rounded-full">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {materials.map((material) => (
            <div
              key={material.id}
              className="flex-shrink-0 pr-4 rtl:pl-4 rtl:pr-0"
              style={{ width: "280px" }}>
              <ContentCard
                material={material}
                onClick={() => handleCardClick(material)}
              />
            </div>
          ))}
        </div>
      </div>

      {modalOpen && selectedMaterial && (
        <ContentModal
          material={selectedMaterial}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
