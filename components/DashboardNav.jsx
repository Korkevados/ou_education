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
import ApprovalBadge from "./ApprovalBadge";

function DashboardNav() {
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const currentPath = usePathname();
  const [openSubmenus, setOpenSubmenus] = useState({});

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
    const menuItems = getMenuItems();
    menuItems.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some((child) =>
          currentPath.startsWith(child.href)
        );
        if (isChildActive) {
          setOpenSubmenus((prev) => ({ ...prev, [item.href]: true }));
        }
      }
    });
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

  const renderMenuItem = (item) => {
    const Icon = Icons[item.icon];
    const isActive = currentPath === item.href;
    const hasChildren = item.children && item.children.length > 0;
    const isSubmenuOpen = openSubmenus[item.href];
    const showApprovalBadge =
      item.name === "אישור תכנים" ||
      item.href === "/dashboard/content/approve" ||
      item.href === "/dashboard/users";

    return (
      <li key={item.name}>
        {hasChildren ? (
          <div>
            <button
              onClick={() => toggleSubmenu(item.href)}
              className={cn(
                "flex items-center justify-between w-full p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors duration-200",
                isActive && "bg-gray-100"
              )}>
              <div className="flex items-center space-x-3 relative">
                <Icon className="h-5 w-5 ml-3" />
                <span>{item.name}</span>
                {showApprovalBadge && <ApprovalBadge />}
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  isSubmenuOpen && "transform rotate-180"
                )}
              />
            </button>
            {isSubmenuOpen && (
              <ul className="mr-4 mt-2 space-y-1">
                {item.children.map((child) => {
                  const ChildIcon = Icons[child.icon];
                  const isChildActive = currentPath === child.href;
                  return (
                    <li key={child.name}>
                      <Link
                        href={child.href}
                        className={cn(
                          "flex items-center space-x-3 p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors duration-200",
                          isChildActive && "bg-gray-100"
                        )}>
                        <ChildIcon className="h-5 w-5 ml-3" />
                        <span>{child.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : (
          <Link
            href={item.href}
            className={cn(
              "flex items-center space-x-3 p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors duration-200",
              isActive && "bg-gray-100"
            )}>
            <div className="flex items-center space-x-3 relative">
              <Icon className="h-5 w-5 ml-3" />
              <span>{item.name}</span>
              {showApprovalBadge && <ApprovalBadge />}
            </div>
          </Link>
        )}
      </li>
    );
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
      <ul className="space-y-2 mb-4">{getMenuItems().map(renderMenuItem)}</ul>
    </nav>
  );
}

export default DashboardNav;
