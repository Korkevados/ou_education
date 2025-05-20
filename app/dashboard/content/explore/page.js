/** @format */

"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ContentCarousel } from "@/components/ui/ContentCarousel";
import { Card } from "@/components/ui/card";
import { PopularTopicsSection } from "@/components/ui/PopularTopicsSection";
import { getMaterials } from "@/app/actions/materials";
import { getMainTopics } from "@/app/actions/topics";

export default function ExplorePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [materials, setMaterials] = useState([]);
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);

        // טעינת כל החומרים
        const { data: materialsData, error: materialsError } =
          await getMaterials();
        if (materialsError) {
          toast.error(materialsError);
          return;
        }

        // טעינת נושאים ראשיים
        const { data: topicsData, error: topicsError } = await getMainTopics();
        if (topicsError) {
          toast.error(topicsError);
          return;
        }

        setMaterials(materialsData || []);
        setTopics(topicsData || []);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("שגיאה בטעינת נתונים");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // ארגון חומרים לפי קטגוריות שונות

  // חומרים אחרונים שהועלו
  const latestMaterials = [...materials]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10);

  // חומרים לפי דירוג (הכי הרבה לייקים)
  // במערכת בהמשך יהיה לנו לייקים אמיתיים
  const topRatedMaterials = [...materials]
    .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
    .slice(0, 10);

  // חומרים לפי דירוג (הכי הרבה לייקים)
  const topLikedMaterials = [...materials]
    .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
    .slice(0, 10);

  // חומרים עם הכי הרבה תגובות
  const mostCommentedMaterials = [...materials]
    .sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0))
    .slice(0, 10);

  // ארגון חומרים לפי נושאים
  const materialsByTopic = topics
    .map((topic) => ({
      topic: topic,
      materials: materials.filter(
        (material) => material.main_topic_id === topic.id
      ),
    }))
    .filter((group) => group.materials.length > 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="container px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">גלה תוכן</h1>

      {materials.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-xl text-gray-500">לא נמצאו תכנים להצגה.</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* נושאים פופולריים */}
          <PopularTopicsSection limit={6} />

          {/* תכנים אחרונים */}
          {latestMaterials.length > 0 && (
            <ContentCarousel title="נוסף לאחרונה" materials={latestMaterials} />
          )}

          {/* תכנים מדורגים */}
          {topRatedMaterials.length > 0 && (
            <ContentCarousel
              title="הכי פופולרי"
              materials={topRatedMaterials}
            />
          )}

          {/* תכנים לפי דירוג (הכי הרבה לייקים) */}
          {topLikedMaterials.length > 0 && (
            <ContentCarousel
              title="הכי פופולרי לפי לייקים"
              materials={topLikedMaterials}
            />
          )}

          {/* תכנים עם הכי הרבה תגובות */}
          {mostCommentedMaterials.length > 0 && (
            <ContentCarousel
              title="הכי פופולרי לפי תגובות"
              materials={mostCommentedMaterials}
            />
          )}

          {/* תכנים לפי נושא */}
          {materialsByTopic.map((group) => (
            <ContentCarousel
              key={group.topic.id}
              title={group.topic.name}
              materials={group.materials}
            />
          ))}
        </div>
      )}
    </div>
  );
}
