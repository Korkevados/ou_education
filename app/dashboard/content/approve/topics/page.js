/** @format */

"use client";

import { useEffect, useState } from "react";
import { getPendingTopics } from "@/app/actions/topics";
import { PendingTopicsTable } from "./components/pending-topics-table";
import { useToast } from "@/components/ui/use-toast";

export default function PendingTopicsPage() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const loadTopics = async () => {
      try {
        const { data, error } = await getPendingTopics();
        if (!isMounted) return;

        if (error) {
          toast({
            title: "שגיאה",
            description: error,
            variant: "destructive",
          });
          return;
        }
        setTopics(data || []);
      } catch (error) {
        if (!isMounted) return;
        console.error("Error loading topics:", error);
        toast({
          title: "שגיאה",
          description: "שגיאה בטעינת הנושאים",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTopics();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array since we only want to load once

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-right">אישור נושאים</h1>
      <PendingTopicsTable topics={topics} loading={loading} />
    </div>
  );
}
