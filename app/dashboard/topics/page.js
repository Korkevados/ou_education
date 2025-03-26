/** @format */

"use client";

import { useEffect, useState } from "react";
import { getPendingTopics } from "@/app/actions/topics";
import { PendingTopicsTable } from "./components/pending-topics-table";
import { useToast } from "@/components/ui/use-toast";

export default function PendingTopicsPage() {
  const [pendingTopics, setPendingTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const loadPendingTopics = async () => {
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
        setPendingTopics(data || []);
      } catch (error) {
        if (!isMounted) return;
        console.error("Error loading pending topics:", error);
        toast({
          title: "שגיאה",
          description: "שגיאה בטעינת נושאים ממתינים",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPendingTopics();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">נושאים ממתינים לאישור</h1>
      </div>
      <PendingTopicsTable topics={pendingTopics} loading={loading} />
    </div>
  );
}
