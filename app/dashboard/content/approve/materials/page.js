/** @format */

"use client";

import { useEffect, useState } from "react";
import { getMaterialsForApproval } from "@/app/actions/materials";
import { MaterialsTable } from "./components/materials-table";
import { useToast } from "@/components/ui/use-toast";

export default function PendingMaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadMaterials = async () => {
    try {
      const { data, error } = await getMaterialsForApproval();
      if (error) throw new Error(error);
      setMaterials(data || []);
    } catch (error) {
      console.error("Error loading materials:", error);
      toast({
        title: "שגיאה",
        description: "שגיאה בטעינת החומרים",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const handleMaterialApproved = (materialId, topicId) => {
    setMaterials(
      (prev) =>
        prev
          .map((material) => {
            // If this is a material approval, remove the material
            if (material.id === materialId) {
              return null;
            }
            // If this is a topic approval, remove the pending topic
            if (material.pending_topic?.id === topicId) {
              return {
                ...material,
                pending_topic: null,
              };
            }
            return material;
          })
          .filter(Boolean) // Remove null items
    );
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-right">אישור תכנים</h1>
      <MaterialsTable
        materials={materials}
        loading={loading}
        onMaterialApproved={handleMaterialApproved}
      />
    </div>
  );
}
