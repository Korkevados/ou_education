/** @format */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import getUserDetails from "@/app/actions/auth";
import * as Icons from "lucide-react";
import { NAVIGATION_CONFIG } from "@/lib/config";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  BookOpen,
  ChevronDown,
  FileText,
  FilePlus,
  Compass,
} from "lucide-react";

function DashboardNav() {
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const currentPath = usePathname();
  const [openSubmenus, setOpenSubmenus] = useState({ content: true });

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const details = await getUserDetails();
        console.log("User details:", details);

        if (details && details.role) {
          setUserRole(details.role);
        } else {
          console.log("No user role found in details");
          setError("פרטי משתמש חסרים");
        }
      } catch (error) {
        console.error("Error fetching user role:", error);

        // אם הסשן לא קיים או פג תוקף, עבור לדף ההתחברות
        if (error.message?.includes("No session found")) {
          router.push("/verify");
        }

        setError("שגיאה בטעינת פרטי משתמש");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [router]);

  // אוטומטית פתח את התת-תפריט אם נמצאים בדף שקשור אליו
  useEffect(() => {
    if (currentPath.includes("/dashboard/content")) {
      setOpenSubmenus((prev) => ({ ...prev, content: true }));
    }
  }, [currentPath]);

  const getMenuItems = () => {
    let items = [...NAVIGATION_CONFIG.base];

    // רק אם יש תפקיד, התאם את התפריט
    if (userRole) {
      if (userRole === "מנהל כללי" || userRole === "ADMIN") {
        items = [...items, ...NAVIGATION_CONFIG.admin];
      } else if (userRole === "מדריך" || userRole === "GUIDE") {
        items = [...items, ...NAVIGATION_CONFIG.instructor];
      } else if (userRole === "מנהל הדרכה" || userRole === "TRAINING_MANAGER") {
        items = [...items, ...NAVIGATION_CONFIG.training_manager];
      }
    }

    return items;
  };

  const toggleSubmenu = (submenu) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [submenu]: !prev[submenu],
    }));
  };

  if (isLoading) {
    return (
      <nav className="h-full bg-white shadow-lg flex items-center justify-center">
        <div className="text-center">
          <Spinner className="w-8 h-8 text-sky-600" />
          <p className="mt-2 text-sky-900 text-sm">טוען תפריט...</p>
        </div>
      </nav>
    );
  }

  if (error) {
    return (
      <nav className="h-full bg-white shadow-lg flex items-center justify-center">
        <div className="text-center p-4">
          <div className="text-red-500 mb-2">
            <Icons.AlertCircle className="h-8 w-8 mx-auto" />
          </div>
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={() => router.push("/verify")}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors">
            התחברות מחדש
          </button>
        </div>
      </nav>
    );
  }

  return (
    <nav className="h-full bg-white shadow-lg p-4">
      <ul className="space-y-2 mb-4">
        {getMenuItems().map((item) => {
          const Icon = Icons[item.icon];
          return (
            <li key={item.name}>
              <Link
                href={item.href}
                className="flex items-center space-x-3 p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors duration-200">
                <Icon className="h-5 w-5 ml-3" />
                <span>{item.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
        {/* בית */}
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100",
            currentPath === "/dashboard" ? "bg-gray-100 font-semibold" : ""
          )}>
          <Home className="h-4 w-4 ml-2" />
          <span>בית</span>
        </Link>

        {/* תוכן */}
        <div>
          <div
            onClick={() => toggleSubmenu("content")}
            className={cn(
              "flex items-center justify-between px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer",
              currentPath.includes("/dashboard/content")
                ? "bg-gray-100 font-semibold"
                : ""
            )}>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 ml-2" />
              <span>תוכן</span>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                openSubmenus.content ? "rotate-180" : ""
              )}
            />
          </div>
          {openSubmenus.content && (
            <div className="mr-4 mt-1 flex flex-col gap-1">
              <Link
                href="/dashboard/content"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100",
                  currentPath === "/dashboard/content"
                    ? "bg-gray-100 font-semibold"
                    : ""
                )}>
                <FileText className="h-4 w-4 ml-2" />
                <span>ניהול תכנים</span>
              </Link>
              <Link
                href="/dashboard/content/new"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100",
                  currentPath === "/dashboard/content/new"
                    ? "bg-gray-100 font-semibold"
                    : ""
                )}>
                <FilePlus className="h-4 w-4 ml-2" />
                <span>תוכן חדש</span>
              </Link>
              <Link
                href="/dashboard/content/explore"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100",
                  currentPath === "/dashboard/content/explore"
                    ? "bg-gray-100 font-semibold"
                    : ""
                )}>
                <Compass className="h-4 w-4 ml-2" />
                <span>גלה תוכן</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default DashboardNav;
