/** @format */

"use client";
import { useState, useEffect } from "react";
import { getMostLikedTopics } from "@/app/actions/topicInteractions";
import { TopicCard } from "./TopicCard";
import { Skeleton } from "./skeleton";
import { toast } from "sonner";

export function PopularTopicsSection({ limit = 6 }) {
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPopularTopics = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await getMostLikedTopics(limit);

        if (error) {
          toast.error(error);
          return;
        }

        setTopics(data || []);
      } catch (error) {
        console.error("Error loading popular topics:", error);
        toast.error("שגיאה בטעינת נושאים פופולריים");
      } finally {
        setIsLoading(false);
      }
    };

    loadPopularTopics();
  }, [limit]);

  if (isLoading) {
    return (
      <div className="my-8">
        <h2 className="text-2xl font-bold mb-6">נושאים פופולריים</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: limit }).map((_, index) => (
            <Skeleton key={index} className="w-full h-40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (topics.length === 0) {
    return null;
  }

  return (
    <div className="my-8">
      <h2 className="text-2xl font-bold mb-6">נושאים פופולריים</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {topics.map((topic) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            likesCount={topic.likes_count || 0}
            commentsCount={topic.comments_count || 0}
          />
        ))}
      </div>
    </div>
  );
}
