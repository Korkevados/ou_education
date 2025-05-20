/** @format */

"use client";
import { useState, useEffect } from "react";
import { getMostLikedMaterials } from "@/app/actions/topicInteractions";
import { ContentCarousel } from "./ContentCarousel";
import { Skeleton } from "./skeleton";
import { toast } from "sonner";
import { getMaterials } from "@/app/actions/materials";

export function PopularContentSection({
  title = "התוכן הכי אהוב",
  limit = 10,
  sortBy = "likes",
}) {
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPopularContent = async () => {
      try {
        setIsLoading(true);

        // Option 1: Use server RPC function for likes sorting
        if (sortBy === "likes") {
          const { data, error } = await getMostLikedMaterials(limit);
          if (error) {
            toast.error(error);
            return;
          }
          setMaterials(data || []);
        }
        // Option 2: Get all materials and sort on client for comments or custom sorting
        else {
          const { data, error } = await getMaterials();
          if (error) {
            toast.error(error);
            return;
          }

          let sortedData = [...(data || [])];

          if (sortBy === "comments") {
            sortedData = sortedData
              .sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0))
              .slice(0, limit);
          }

          setMaterials(sortedData);
        }
      } catch (error) {
        console.error("Error loading popular content:", error);
        toast.error("שגיאה בטעינת תוכן פופולרי");
      } finally {
        setIsLoading(false);
      }
    };

    loadPopularContent();
  }, [limit, sortBy]);

  if (isLoading) {
    return (
      <div className="my-8">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <div className="w-full h-72 bg-gray-100 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  if (materials.length === 0) {
    return null;
  }

  return (
    <div className="my-8">
      <ContentCarousel title={title} materials={materials} />
    </div>
  );
}
