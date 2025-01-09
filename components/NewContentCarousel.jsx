/** @format */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const NewContentCarousel = ({ contents }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === contents.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? contents.length - 1 : prevIndex - 1
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("he-IL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-lg">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(${currentIndex * 100}%)`,
          }}>
          {contents.map((content, index) => (
            <div key={content.id} className="w-full flex-shrink-0 p-4">
              <div className="text-right space-y-3">
                <h3 className="text-xl font-semibold text-gray-900">
                  {content.title}
                </h3>
                <p className="text-sky-600 font-medium">{content.subject}</p>
                <div className="flex items-center justify-end gap-1">
                  <span className="text-gray-600 text-sm">
                    {formatDate(content.publishedAt)}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <span className="text-yellow-500 flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-4 h-4",
                          i < Math.floor(content.rating)
                            ? "fill-yellow-500"
                            : "fill-gray-200"
                        )}
                      />
                    ))}
                  </span>
                  <span className="text-sm text-gray-600">
                    {content.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={prevSlide}
          className="px-3">
          הקודם
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={nextSlide}
          className="px-3">
          הבא
        </Button>
      </div>

      <div className="flex justify-center gap-1 mt-2">
        {contents.map((_, index) => (
          <button
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              index === currentIndex ? "bg-sky-600" : "bg-gray-300"
            )}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default NewContentCarousel;
