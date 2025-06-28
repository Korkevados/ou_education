/** @format */

"use client";

import { useEffect, useState, useCallback } from "react";
import { getApprovalCounts } from "@/app/actions/approval-counts";

export default function ApprovalBadge() {
  const [counts, setCounts] = useState({
    pendingMaterials: 0,
    pendingTopics: 0,
    pendingUsers: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    try {
      const { data, error } = await getApprovalCounts();
      if (error) {
        console.error("Error fetching approval counts:", error);
        return;
      }
      setCounts(data);
    } catch (error) {
      console.error("Exception fetching approval counts:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCounts();

    // Refresh counts every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  // Listen for custom events to refresh counts
  useEffect(() => {
    const handleRefresh = () => {
      fetchCounts();
    };

    window.addEventListener("approval-action-completed", handleRefresh);
    return () => {
      window.removeEventListener("approval-action-completed", handleRefresh);
    };
  }, [fetchCounts]);

  // Don't show badge if no pending items or still loading
  if (isLoading || counts.total === 0) {
    return null;
  }

  return (
    <div className="relative inline-flex">
      <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[20px] h-5">
        {counts.total > 99 ? "99+" : counts.total}
      </span>
    </div>
  );
}
