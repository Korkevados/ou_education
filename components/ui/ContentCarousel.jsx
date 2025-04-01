/** @format */

"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ContentCard } from "./ContentCard";
import { ContentModal } from "./ContentModal";
import { Button } from "./button";

export function ContentCarousel({ title, materials }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(true);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(true);

  // Embla Carousel setup with improved options for natural feeling
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    loop: true, // Enable infinite scrolling
    loopAdditionalSlides: 2, // Add extra slides for smoother looping
    containScroll: "keepSnaps", // Keep slides in view
    dragFree: false,
    direction: "rtl", // עברית - מימין לשמאל
    skipSnaps: false, // Ensure we always land perfectly on a snap point
    startIndex: Math.floor(materials?.length / 2) || 0, // Start with center item in focus
    inViewThreshold: 0.7, // When 70% of the slide is in view, consider it in view
    speed: 15, // Slow down the animation for smoother transitions
  });

  // Track the current slide index and update button states
  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setCurrentIndex(emblaApi.selectedScrollSnap());
      setPrevBtnEnabled(true);
      setNextBtnEnabled(true);
    };

    emblaApi.on("select", onSelect);
    emblaApi.on("resize", onSelect);
    emblaApi.on("reInit", onSelect);
    onSelect(); // Initialize

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("resize", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  // Navigation handlers for better reliability
  const scrollPrev = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollPrev({ duration: 35 }); // Slightly slower for smoother transition
    }
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollNext({ duration: 35 }); // Slightly slower for smoother transition
    }
  }, [emblaApi]);

  // הפונקציה שפותחת את המודל עם החומר הנבחר
  const handleCardClick = (material) => {
    setSelectedMaterial(material);
    setModalOpen(true);
  };

  if (!materials || materials.length === 0) {
    return null;
  }

  // Calculate appropriate scale factors and distances based on index from center
  const getItemStyles = (index) => {
    if (!emblaApi) return { width: "280px" };

    // Get the actual index considering possible duplication
    const normalizedIndex = index % materials.length;
    const isCenter = currentIndex % materials.length === normalizedIndex;

    // Calculate distance in a circular way (handling loop)
    let distance = Math.abs(
      (currentIndex % materials.length) - normalizedIndex
    );
    // Adjust for wrap-around cases
    distance = Math.min(distance, materials.length - distance);

    // Create smoother scaling gradient as items get further from center
    const scale = isCenter ? 1 : Math.max(0.75, 1 - distance * 0.12);
    const opacity = isCenter ? 1 : Math.max(0.6, 1 - distance * 0.2);
    const zIndex = isCenter ? 10 : 10 - distance;

    return {
      width: "280px",
      transform: `scale(${scale})`,
      opacity,
      zIndex,
    };
  };

  return (
    <div className="my-8 relative max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-4 px-2">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
        </div>
        {/* Add visible control buttons here as well for better usability */}
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

      {/* Carousel Container with absolutely positioned navigation buttons */}
      <div className="relative group">
        {/* Left Navigation Button */}
        <div
          onClick={scrollNext}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 z-50 h-12 w-12 rounded-full bg-white/90 shadow-md hover:bg-white flex items-center justify-center cursor-pointer">
          <ChevronLeft className="h-6 w-6" />
        </div>

        {/* Main Carousel with additional padding for visibility of side items */}
        <div className="overflow-hidden px-16" ref={emblaRef}>
          <div className="flex py-8">
            {materials.map((material, index) => (
              <div
                key={`${material.id}-${index}`}
                className="flex-shrink-0 px-4 transition-all duration-300 ease-out mx-auto"
                style={getItemStyles(index)}>
                <ContentCard
                  material={material}
                  isFocused={currentIndex === index}
                  onClick={() => handleCardClick(material)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right Navigation Button */}
        <div
          onClick={scrollPrev}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 z-50 h-12 w-12 rounded-full bg-white/90 shadow-md hover:bg-white flex items-center justify-center cursor-pointer">
          <ChevronRight className="h-6 w-6" />
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
