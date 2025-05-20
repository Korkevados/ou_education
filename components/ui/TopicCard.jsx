/** @format */

"use client";
import { useState } from "react";
import { Card, CardContent } from "./card";
import { Button } from "./button";
import { ThumbsUp, MessageCircle } from "lucide-react";
import { TopicInteractionModal } from "./TopicInteractionModal";

export function TopicCard({ topic, likesCount = 0, commentsCount = 0 }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Card
        className="w-full h-40 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer transition-shadow hover:shadow-lg"
        onClick={() => setIsModalOpen(true)}>
        <CardContent className="p-6 h-full flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {topic.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {topic.description || `תכנים בנושא ${topic.name}`}
            </p>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-4 gap-4">
              <div className="flex items-center text-blue-600 dark:text-blue-400 gap-1">
                <ThumbsUp size={16} />
                <span className="text-sm">{likesCount}</span>
              </div>
              <div className="flex items-center text-gray-500 dark:text-gray-400 gap-1">
                <MessageCircle size={16} />
                <span className="text-sm">{commentsCount}</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}>
              פרטים
            </Button>
          </div>
        </CardContent>
      </Card>

      <TopicInteractionModal
        topic={topic}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
